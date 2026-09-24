import { createContext, useContext } from "react";

/** 0 → 1 while the player stands at a station; read by landmark animations. */
export const ActiveCtx = createContext<{ current: number }>({ current: 0 });
export const useActive = () => useContext(ActiveCtx);
