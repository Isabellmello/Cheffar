import { createContext, useContext } from "react";

const NowContext = createContext(Date.now());

export const NowProvider = NowContext.Provider;

export function useNow() {
  return useContext(NowContext);
}
