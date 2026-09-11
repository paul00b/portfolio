// Low-poly avatar generator — turns a portrait photo into the faceted illustration used as
// public/images/paul.jpg. Person cut-out and face landmarks come from Apple Vision (CPU),
// the facets from an edge-guided Delaunay triangulation. Output: PNG + SVG.
//
//   swiftc -O -o lowpoly tools/lowpoly-avatar/main.swift
//   ./lowpoly public/images/paul-photo.jpg out.png out.svg 1100 efe7d8 1000
//   args: input  out.png  out.svg  [points=1600]  [bgHex=f7f2e8]  [cropHeightPx]
//   sips -s format jpeg -s formatOptions 90 out.png --out public/images/paul.jpg
//
import Foundation
import CoreGraphics
import ImageIO
import Vision

// usage: lowpoly in.jpg out.png out.svg [points] [bgHex]
let args = CommandLine.arguments
guard args.count >= 4 else { print("usage: lowpoly in out.png out.svg [points] [bgHex]"); exit(1) }
let inPath = args[1], outPNG = args[2], outSVG = args[3]
let targetPoints = args.count > 4 ? Int(args[4])! : 1600
let bgHex = args.count > 5 ? args[5] : "f7f2e8"
func hexToRGB(_ h: String) -> (Float, Float, Float) {
    let v = UInt32(h, radix: 16)!
    return (Float((v >> 16) & 255), Float((v >> 8) & 255), Float(v & 255))
}
let bg = hexToRGB(bgHex)

// ---------- load ----------
guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: inPath) as CFURL, nil),
      let cgFull = CGImageSourceCreateImageAtIndex(src, 0, nil) else { print("cannot read \(inPath)"); exit(1) }
let cropH = args.count > 6 ? min(cgFull.height, Int(args[6])!) : cgFull.height
let cg = cropH < cgFull.height ? cgFull.cropping(to: CGRect(x: 0, y: 0, width: cgFull.width, height: cropH))! : cgFull
let W = cg.width, H = cg.height
let rgb = CGColorSpaceCreateDeviceRGB()

var px = [UInt8](repeating: 0, count: W * H * 4)
px.withUnsafeMutableBytes { raw in
    let ctx = CGContext(data: raw.baseAddress, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4,
                        space: rgb, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    // no flip here: a bitmap context already stores the image's top row first
    ctx.draw(cg, in: CGRect(x: 0, y: 0, width: W, height: H))
}

// ---------- person mask (Vision), bilinear-resampled to W x H ----------
// The sandbox cannot reach the Neural Engine, so inference is forced onto the CPU,
// trying the most accurate model first.
var mask = [Float](repeating: 1, count: W * H)
var maskOK = false
for q in [VNGeneratePersonSegmentationRequest.QualityLevel.accurate, .balanced, .fast] {
    let req = VNGeneratePersonSegmentationRequest()
    req.qualityLevel = q
    req.outputPixelFormat = kCVPixelFormatType_OneComponent8
    req.usesCPUOnly = true
    do {
        try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
        guard let pb = req.results?.first?.pixelBuffer else { continue }
        CVPixelBufferLockBaseAddress(pb, .readOnly)
        let mw = CVPixelBufferGetWidth(pb), mh = CVPixelBufferGetHeight(pb), bpr = CVPixelBufferGetBytesPerRow(pb)
        let base = CVPixelBufferGetBaseAddress(pb)!.assumingMemoryBound(to: UInt8.self)
        for y in 0..<H {
            let fy = Double(y) / Double(H) * Double(mh - 1)
            let y0 = Int(fy), y1 = min(mh - 1, y0 + 1); let ty = Float(fy - Double(y0))
            for x in 0..<W {
                let fx = Double(x) / Double(W) * Double(mw - 1)
                let x0 = Int(fx), x1 = min(mw - 1, x0 + 1); let tx = Float(fx - Double(x0))
                let a = Float(base[y0 * bpr + x0]), b = Float(base[y0 * bpr + x1])
                let c = Float(base[y1 * bpr + x0]), d = Float(base[y1 * bpr + x1])
                mask[y * W + x] = ((a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty) / 255
            }
        }
        CVPixelBufferUnlockBaseAddress(pb, .readOnly)
        print("mask \(mw)x\(mh) quality=\(q.rawValue)")
        maskOK = true
        break
    } catch { print("segmentation quality=\(q.rawValue) failed: \(error.localizedDescription)") }
}
if !maskOK { print("WARNING: no person mask, background kept") }

// ---------- face box (denser sampling there) ----------
var faceRect: CGRect? = nil
do {
    let freq = VNDetectFaceRectanglesRequest()
    try VNImageRequestHandler(cgImage: cg, options: [:]).perform([freq])
    if let f = freq.results?.first {
        let bb = f.boundingBox
        let r = CGRect(x: bb.origin.x * CGFloat(W), y: (1 - bb.origin.y - bb.height) * CGFloat(H),
                       width: bb.width * CGFloat(W), height: bb.height * CGFloat(H))
        faceRect = r.insetBy(dx: -r.width * 0.25, dy: -r.height * 0.35)
        print("face \(Int(r.origin.x)),\(Int(r.origin.y)) \(Int(r.width))x\(Int(r.height))")
    }
} catch {}

// ---------- face landmarks: forced vertices so eyes, nose and lips stay crisp ----------
var landmarkPts: [(Double, Double)] = []
var eyeBoxes: [CGRect] = []
do {
    let lreq = VNDetectFaceLandmarksRequest()
    try VNImageRequestHandler(cgImage: cg, options: [:]).perform([lreq])
    if let f = lreq.results?.first, let lm = f.landmarks {
        let regions: [(VNFaceLandmarkRegion2D?, Double)] = [
            (lm.leftEye, 4), (lm.rightEye, 4), (lm.leftPupil, 3), (lm.rightPupil, 3),
            (lm.leftEyebrow, 7), (lm.rightEyebrow, 7), (lm.nose, 6), (lm.noseCrest, 9),
            (lm.outerLips, 5), (lm.innerLips, 6), (lm.faceContour, 12), (lm.medianLine, 14),
        ]
        for (region, step) in regions {
            guard let r = region else { continue }
            let ip = r.pointsInImage(imageSize: CGSize(width: W, height: H)).map { (Double($0.x), Double(H) - Double($0.y)) }
            var prev: (Double, Double)? = nil
            for q in ip {
                if let pr = prev {
                    let dx = q.0 - pr.0, dy = q.1 - pr.1
                    let len = (dx * dx + dy * dy).squareRoot()
                    let steps = max(1, Int(len / step))
                    for k in 1...steps { let t = Double(k) / Double(steps); landmarkPts.append((pr.0 + dx * t, pr.1 + dy * t)) }
                } else { landmarkPts.append(q) }
                prev = q
            }
        }
        for eye in [lm.leftEye, lm.rightEye].compactMap({ $0 }) {
            let ip = eye.pointsInImage(imageSize: CGSize(width: W, height: H))
            let xs = ip.map { Double($0.x) }, ys = ip.map { Double(H) - Double($0.y) }
            let r = CGRect(x: xs.min()!, y: ys.min()!, width: xs.max()! - xs.min()!, height: ys.max()! - ys.min()!)
            eyeBoxes.append(r.insetBy(dx: -r.width * 0.45, dy: -r.height * 1.2))
        }
        print("landmarks \(landmarkPts.count) points, \(eyeBoxes.count) eyes")
    }
} catch { print("landmarks failed: \(error.localizedDescription)") }

// ---------- composite on flat background + luminance + Sobel ----------
var comp = [Float](repeating: 0, count: W * H * 3)
var lum = [Float](repeating: 0, count: W * H)
for i in 0..<(W * H) {
    let a = mask[i]
    let r = Float(px[i * 4]), g = Float(px[i * 4 + 1]), b = Float(px[i * 4 + 2])
    comp[i * 3] = r * a + bg.0 * (1 - a); comp[i * 3 + 1] = g * a + bg.1 * (1 - a); comp[i * 3 + 2] = b * a + bg.2 * (1 - a)
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b
}
var edge = [Float](repeating: 0, count: W * H)
var maxE: Float = 0
for y in 1..<(H - 1) {
    for x in 1..<(W - 1) {
        let i = y * W + x
        if mask[i] < 0.5 { continue }
        let gx = -lum[i - W - 1] + lum[i - W + 1] - 2 * lum[i - 1] + 2 * lum[i + 1] - lum[i + W - 1] + lum[i + W + 1]
        let gy = -lum[i - W - 1] - 2 * lum[i - W] - lum[i - W + 1] + lum[i + W - 1] + 2 * lum[i + W] + lum[i + W + 1]
        let m = (gx * gx + gy * gy).squareRoot()
        edge[i] = m; if m > maxE { maxE = m }
    }
}

// ---------- point sampling ----------
struct LCG { var s: UInt64; mutating func next() -> Double { s = s &* 6364136223846793005 &+ 1442695040888963407; return Double(s >> 11) / Double(1 << 53) } }
var rng = LCG(s: 20260905)
var pts: [(Double, Double)] = []
var occupied = Set<Int>()
let cell = 3
@discardableResult func add(_ x: Double, _ y: Double) -> Bool {
    let xi = max(0, min(W - 1, Int(x))), yi = max(0, min(H - 1, Int(y)))
    let key = (yi / cell) * (W / cell + 2) + xi / cell
    if occupied.contains(key) { return false }
    occupied.insert(key); pts.append((Double(xi), Double(yi))); return true
}
// frame
for x in stride(from: 0, through: W - 1, by: 70) { add(Double(x), 0); add(Double(x), Double(H - 1)) }
for y in stride(from: 0, through: H - 1, by: 70) { add(0, Double(y)); add(Double(W - 1), Double(y)) }
add(Double(W - 1), 0); add(Double(W - 1), Double(H - 1)); add(0, Double(H - 1))
// silhouette
var bcells = Set<Int>()
let bcell = 11
for y in stride(from: 1, to: H - 1, by: 2) {
    for x in stride(from: 1, to: W - 1, by: 2) {
        let i = y * W + x; let m = mask[i] > 0.5
        if m != (mask[i + 2] > 0.5) || m != (mask[i + 2 * W] > 0.5) {
            let k = (y / bcell) * (W / bcell + 2) + x / bcell
            if !bcells.contains(k) { bcells.insert(k); add(Double(x), Double(y)) }
        }
    }
}
let silhouette = pts.count
// facial features first
for (x, y) in landmarkPts { add(x, y) }
for box in eyeBoxes {
    for _ in 0..<30 { add(Double(box.minX) + rng.next() * Double(box.width), Double(box.minY) + rng.next() * Double(box.height)) }
}
let features = pts.count - silhouette
// loose jittered grid so flat areas (shirt) still get facets
for gy in stride(from: 36, to: H, by: 76) {
    for gx in stride(from: 36, to: W, by: 76) {
        let x = Double(gx) + (rng.next() - 0.5) * 40, y = Double(gy) + (rng.next() - 0.5) * 40
        let xi = max(0, min(W - 1, Int(x))), yi = max(0, min(H - 1, Int(y)))
        if mask[yi * W + xi] > 0.5 { add(x, y) }
    }
}
// edge-weighted, face-boosted
var attempts = 0
while pts.count < targetPoints && attempts < 3_000_000 {
    attempts += 1
    let x = rng.next() * Double(W - 1), y = rng.next() * Double(H - 1)
    let i = Int(y) * W + Int(x)
    if mask[i] < 0.5 { continue }
    var w = Double(min(1, edge[i] / (maxE * 0.28)))
    w = pow(w, 0.9)
    var boost = 1.0
    if let f = faceRect, f.contains(CGPoint(x: x, y: y)) { boost = 5.0 }
    if rng.next() < w * boost { add(x, y) }
}
print("points \(pts.count) (silhouette \(silhouette), features \(features))")

// ---------- Delaunay (Bowyer-Watson) ----------
struct Tri { let a: Int, b: Int, c: Int; let cx: Double, cy: Double, r2: Double }
var P = pts
let R = Double(max(W, H)) * 12
let ccx = Double(W) / 2, ccy = Double(H) / 2
for k in 0..<3 {
    let ang = Double.pi / 2 + Double(k) * 2 * Double.pi / 3
    P.append((ccx + 2 * R * cos(ang), ccy + 2 * R * sin(ang)))
}
let n = P.count
func circum(_ a: Int, _ b: Int, _ c: Int) -> Tri? {
    let (ax, ay) = P[a], (bx, by) = P[b], (cx, cy) = P[c]
    let d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
    if abs(d) < 1e-9 { return nil }
    let a2 = ax * ax + ay * ay, b2 = bx * bx + by * by, c2 = cx * cx + cy * cy
    let ux = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d
    let uy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d
    return Tri(a: a, b: b, c: c, cx: ux, cy: uy, r2: (ax - ux) * (ax - ux) + (ay - uy) * (ay - uy))
}
var tris: [Tri] = [circum(n - 3, n - 2, n - 1)!]
for i in 0..<(n - 3) {
    let (x, y) = P[i]
    var bad: [Int] = []
    for (ti, t) in tris.enumerated() {
        let dx = x - t.cx, dy = y - t.cy
        if dx * dx + dy * dy <= t.r2 { bad.append(ti) }
    }
    var count: [Int: Int] = [:]
    var edges: [(Int, Int)] = []
    for ti in bad {
        let t = tris[ti]
        for (u, v) in [(t.a, t.b), (t.b, t.c), (t.c, t.a)] {
            let k = u < v ? u * n + v : v * n + u
            if let c = count[k] { count[k] = c + 1 } else { count[k] = 1; edges.append((u, v)) }
        }
    }
    for ti in bad.sorted(by: >) { tris.remove(at: ti) }
    for (u, v) in edges {
        let k = u < v ? u * n + v : v * n + u
        if count[k] == 1, let t = circum(u, v, i) { tris.append(t) }
    }
}
tris = tris.filter { $0.a < n - 3 && $0.b < n - 3 && $0.c < n - 3 }
print("triangles \(tris.count)")

// ---------- colour every facet with its mean pixel colour ----------
struct Facet { let a: (Double, Double), b: (Double, Double), c: (Double, Double); let r: Int, g: Int, bl: Int }
var facets: [Facet] = []
func clamp(_ v: Float) -> Int { Int(max(0, min(255, v.rounded()))) }
for t in tris {
    let (ax, ay) = P[t.a], (bx, by) = P[t.b], (cx, cy) = P[t.c]
    let area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
    if abs(area) < 1e-9 { continue }
    let minx = max(0, Int(floor(min(ax, bx, cx)))), maxx = min(W - 1, Int(ceil(max(ax, bx, cx))))
    let miny = max(0, Int(floor(min(ay, by, cy)))), maxy = min(H - 1, Int(ceil(max(ay, by, cy))))
    var sr: Float = 0, sg: Float = 0, sb: Float = 0, sa: Float = 0, cnt: Float = 0
    for y in miny...maxy {
        for x in minx...maxx {
            let pxc = Double(x) + 0.5, pyc = Double(y) + 0.5
            let w0 = ((bx - pxc) * (cy - pyc) - (by - pyc) * (cx - pxc)) / area
            let w1 = ((cx - pxc) * (ay - pyc) - (cy - pyc) * (ax - pxc)) / area
            let w2 = 1 - w0 - w1
            if w0 >= -1e-6 && w1 >= -1e-6 && w2 >= -1e-6 {
                let i = y * W + x
                sr += comp[i * 3]; sg += comp[i * 3 + 1]; sb += comp[i * 3 + 2]; sa += mask[i]; cnt += 1
            }
        }
    }
    if cnt == 0 {
        let gx = Int((ax + bx + cx) / 3), gy = Int((ay + by + cy) / 3)
        let i = max(0, min(W * H - 1, gy * W + gx))
        sr = comp[i * 3]; sg = comp[i * 3 + 1]; sb = comp[i * 3 + 2]; sa = mask[i]; cnt = 1
    }
    if sa / cnt < 0.3 { continue }   // pure background: the flat rect shows through
    var r = sr / cnt, g = sg / cnt, b = sb / cnt
    // a touch more saturation and contrast, for the illustrated feel
    let gray = 0.299 * r + 0.587 * g + 0.114 * b
    r = gray + (r - gray) * 1.18; g = gray + (g - gray) * 1.18; b = gray + (b - gray) * 1.18
    r = (r - 128) * 1.06 + 128; g = (g - 128) * 1.06 + 128; b = (b - 128) * 1.06 + 128
    facets.append(Facet(a: (ax, ay), b: (bx, by), c: (cx, cy), r: clamp(r), g: clamp(g), bl: clamp(b)))
}
print("facets kept \(facets.count)")

// ---------- SVG ----------
func hex(_ r: Int, _ g: Int, _ b: Int) -> String { String(format: "#%02x%02x%02x", r, g, b) }
var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 \(W) \(H)\" width=\"\(W)\" height=\"\(H)\">\n<rect width=\"\(W)\" height=\"\(H)\" fill=\"#\(bgHex)\"/>\n<g stroke-width=\"0.7\" stroke-linejoin=\"round\">\n"
for f in facets {
    let c = hex(f.r, f.g, f.bl)
    svg += "<polygon points=\"\(Int(f.a.0)),\(Int(f.a.1)) \(Int(f.b.0)),\(Int(f.b.1)) \(Int(f.c.0)),\(Int(f.c.1))\" fill=\"\(c)\" stroke=\"\(c)\"/>\n"
}
svg += "</g>\n</svg>\n"
try! svg.write(toFile: outSVG, atomically: true, encoding: .utf8)

// ---------- PNG ----------
let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0, space: rgb,
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.translateBy(x: 0, y: CGFloat(H)); ctx.scaleBy(x: 1, y: -1)
ctx.setFillColor(CGColor(colorSpace: rgb, components: [CGFloat(bg.0) / 255, CGFloat(bg.1) / 255, CGFloat(bg.2) / 255, 1])!)
ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
ctx.setLineWidth(0.8); ctx.setLineJoin(.round)
ctx.setShouldAntialias(true)
for f in facets {
    let col = CGColor(colorSpace: rgb, components: [CGFloat(f.r) / 255, CGFloat(f.g) / 255, CGFloat(f.bl) / 255, 1])!
    ctx.setFillColor(col); ctx.setStrokeColor(col)
    ctx.beginPath()
    ctx.move(to: CGPoint(x: f.a.0, y: f.a.1)); ctx.addLine(to: CGPoint(x: f.b.0, y: f.b.1)); ctx.addLine(to: CGPoint(x: f.c.0, y: f.c.1)); ctx.closePath()
    ctx.drawPath(using: .fillStroke)
}
let out = ctx.makeImage()!
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: outPNG) as CFURL, "public.png" as CFString, 1, nil)!
CGImageDestinationAddImage(dest, out, nil)
CGImageDestinationFinalize(dest)
print("wrote \(outPNG) and \(outSVG)")
