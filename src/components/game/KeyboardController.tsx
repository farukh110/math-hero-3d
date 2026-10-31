"use client";

import { useEffect } from "react";
import { actions, gameStore } from "@/systems/progression/gameStore";
import { clearInput, input } from "@/systems/input/input";
import { rt } from "@/systems/runtime/runtime";
import { startMusic, unlockAudio } from "@/systems/audio/audio";

const GAME_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyE", "ShiftLeft", "ShiftRight"]);

/** The one place that turns raw browser events into game input and UI shortcuts. */
export default function KeyboardController() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      unlockAudio();
      const st = gameStore.get();
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA");
      if (st.screen !== "playing") return;
      if (typing && e.code !== "Escape") return;
      if (GAME_KEYS.has(e.code) && !(target?.tagName === "BUTTON" && (e.code === "Space"))) e.preventDefault();
      startMusic();
      // Enter must not also "click" the button that appears (e.g. the result card) from this same keypress.
      if (e.code === "Enter" && (st.puzzle || st.result || st.intro)) e.preventDefault();

      if (e.code === "Escape") {
        if (e.repeat) return;
        if (st.result) actions.dismissResult();
        else if (st.puzzle) actions.closePuzzle();
        else if (st.intro) actions.advanceIntro();
        else actions.togglePause();
        return;
      }
      if (st.loading || st.overlay !== "none") return;

      if (st.intro) {
        if (!e.repeat && (e.code === "Enter" || e.code === "Space" || e.code === "KeyE")) actions.advanceIntro();
        return;
      }
      if (st.result) {
        if (!e.repeat && (e.code === "Enter" || e.code === "Space" || e.code === "KeyE")) actions.dismissResult();
        return;
      }
      if (st.puzzle) {
        const v = st.puzzle.value;
        if (e.code === "KeyA" || e.code === "ArrowLeft") actions.setPuzzleValue(v - 1);
        else if (e.code === "KeyD" || e.code === "ArrowRight") actions.setPuzzleValue(v + 1);
        else if (e.code === "KeyS" || e.code === "ArrowDown") actions.setPuzzleValue(v - 5);
        else if (e.code === "KeyW" || e.code === "ArrowUp") actions.setPuzzleValue(v + 5);
        else if (!e.repeat && (e.code === "Enter" || e.code === "KeyE")) actions.attempt(st.puzzle.id, v);
        return;
      }

      if (e.code === "KeyE" && !e.repeat) input.interactEdge = true;
      input.keys.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      input.keys.delete(e.code);
    };
    const onBlur = () => clearInput();

    const onPointerDown = (e: PointerEvent) => {
      unlockAudio();
      if ((e.target as HTMLElement)?.tagName === "CANVAS" && !rt.locked) {
        input.dragging = true;
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (input.dragging && e.buttons !== 0) {
        input.dragX += e.movementX;
        input.dragY += e.movementY;
      } else {
        input.dragging = false;
      }
    };
    const onPointerUp = () => {
      input.dragging = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);
  return null;
}
