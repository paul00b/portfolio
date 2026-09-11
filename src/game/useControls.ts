import { useEffect, useRef } from "react";

export interface ControlState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

/** Shared, mutable control state (keyboard + touch). */
export const controls: ControlState = {
  up: false,
  down: false,
  left: false,
  right: false,
  jump: false,
};

type Listener = () => void;
const interactListeners = new Set<Listener>();
const jumpListeners = new Set<Listener>();

export function emitInteract() {
  interactListeners.forEach((l) => l());
}
export function emitJump() {
  jumpListeners.forEach((l) => l());
}

export function onInteract(l: Listener): () => void {
  interactListeners.add(l);
  return () => {
    interactListeners.delete(l);
  };
}
export function onJump(l: Listener): () => void {
  jumpListeners.add(l);
  return () => {
    jumpListeners.delete(l);
  };
}

const keyMap: Record<string, keyof ControlState> = {
  // ZQSD (azerty)
  KeyZ: "up",
  KeyQ: "left",
  KeyS: "down",
  KeyD: "right",
  // WASD (qwerty)
  KeyW: "up",
  KeyA: "left",
  // Arrows
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Space: "jump",
};

export function useKeyboardControls(enabled: boolean) {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!enabledRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const k = keyMap[e.code];
      if (k) {
        e.preventDefault();
        if (k === "jump" && !controls.jump) emitJump();
        controls[k] = true;
      }
      if (e.code === "KeyE" && !e.repeat) {
        e.preventDefault();
        emitInteract();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = keyMap[e.code];
      if (k) controls[k] = false;
    };
    const blur = () => {
      (Object.keys(controls) as (keyof ControlState)[]).forEach((k) => (controls[k] = false));
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
}
