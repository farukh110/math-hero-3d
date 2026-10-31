import { useEffect, useRef } from "react";
import { rt, type Interactable } from "@/systems/runtime/runtime";

/**
 * Registers a nearby-object interaction with the player controller. The latest
 * callbacks are always used (kept in a ref) so closures never go stale.
 */
export function useInteractable(def: Interactable | null): void {
  const latest = useRef(def);
  const id = def?.id;

  useEffect(() => {
    latest.current = def;
  });

  useEffect(() => {
    if (!id) return;
    const proxy: Interactable = {
      id,
      get pos() {
        return latest.current?.pos ?? [9999, 9999, 9999];
      },
      get radius() {
        return latest.current?.radius ?? 0;
      },
      prompt: () => latest.current?.prompt() ?? null,
      onInteract: () => latest.current?.onInteract(),
    };
    rt.interactables.set(id, proxy);
    return () => {
      rt.interactables.delete(id);
    };
  }, [id]);
}
