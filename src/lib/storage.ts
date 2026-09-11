/**
 * `localStorage` is not always there to be read.
 *
 * Safari with "block all cookies", Chrome with site data blocked, and any
 * embedding of the page in a cross-origin iframe (third-party storage is
 * partitioned or denied) all make a bare `localStorage.getItem` *throw*, not
 * return null. Reading one in a `useState` initialiser would then white-screen
 * the whole portfolio before the first paint, which is a steep price for
 * remembering a toggle.
 *
 * So every access goes through here: the preference is lost, nothing else is.
 */
export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* the choice still holds for this session, it just won't outlive it */
  }
}
