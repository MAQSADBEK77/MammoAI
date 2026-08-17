import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This prototype loads its (localStorage-backed) data on mount via
      // useEffect + setState — the standard fetch-on-mount pattern, and the
      // same shape we'll use once this is swapped for real API calls. The
      // new react-hooks rule below nudges toward useSyncExternalStore /
      // data-fetching libraries, which is out of scope for this stage.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
