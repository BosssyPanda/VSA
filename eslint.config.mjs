// ESLint flat config.
//
// `eslint-config-next` on the 15 line is still eslintrc-shaped, so it is bridged
// through FlatCompat. When this project moves to Next 16 the body becomes a direct
// `...nextVitals` spread and the bridge drops out.
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
