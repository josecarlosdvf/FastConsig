/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["../../packages/config/eslint-preset.js"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    // Design system components MUST use design tokens (Tailwind classes derived
    // from tokens.ts) — no arbitrary colour or spacing values.
    // This is enforced by convention (tokens.ts documents allowed classes) and
    // via code review, not a lint rule, because Tailwind class names can't be
    // statically validated without the JIT plugin.
    "@typescript-eslint/explicit-function-return-type": "off",
  },
};
