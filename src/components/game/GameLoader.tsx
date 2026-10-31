"use client";

import dynamic from "next/dynamic";

// The game needs window / WebGL / localStorage, so it is client-only.
const GameRoot = dynamic(() => import("./GameRoot"), { ssr: false, loading: () => <div className="fallback">Loading...</div> });

export default function GameLoader() {
  return <GameRoot />;
}
