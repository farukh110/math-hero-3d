import { createStore, useStore } from "@/systems/store";

/** Which numbered stone the player stands on (0 = none). Low-frequency: only changes on stepping. */
export const laneStore = createStore<{ puzzleId: string | null; step: number }>({ puzzleId: null, step: 0 });
export const useLane = <S,>(selector: (s: { puzzleId: string | null; step: number }) => S): S => useStore(laneStore, selector);
