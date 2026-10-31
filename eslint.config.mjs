import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Three Fiber code mutates three.js objects / mutable refs inside useFrame by design
    // (that is how you avoid per-frame React renders), which the React Compiler lint rule flags.
    files: ["src/components/{character,camera,environment,game,interactions,puzzles,hud}/**/*.{ts,tsx}"],
    rules: { "react-hooks/immutability": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "school-package/**", "next-env.d.ts"]),
]);

export default eslintConfig;
