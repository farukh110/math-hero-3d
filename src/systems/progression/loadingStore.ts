import { createStore, useStore } from "@/systems/store";

export const loadingStore = createStore({ stage: "Loading...", progress: 0.1 });
export const useLoading = <S,>(selector: (s: { stage: string; progress: number }) => S): S => useStore(loadingStore, selector);
