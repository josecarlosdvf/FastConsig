/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: [
    "next/core-web-vitals",
    "../../packages/config/eslint-preset.js",
  ],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  rules: {
    // ─── Type safety ───────────────────────────────────────────────────────
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off", // too noisy for React components

    // ─── Frontend Design System enforcement ────────────────────────────────
    // Pages and feature code in src/app must NOT use raw HTML container/text
    // elements directly. Use components from @fastconsig/ui instead.
    //
    // Why: guarantees UI consistency, prevents ad-hoc styling, and ensures
    // accessibility attributes (role, aria-*) are baked into the component.
    //
    // Allowed exceptions:
    // - packages/ui/src — the design system itself (overridden below)
    // - Plain semantic wrappers with no className are sometimes unavoidable
    //   (e.g. <html>, <body>, <main>) — those are not JSX Elements in the
    //   sense this rule targets (raw divs with arbitrary className).
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "JSXOpeningElement[name.name=/^(div|span|p|h1|h2|h3|h4|h5|h6|section|article|aside|header|footer|nav|ul|ol|li)$/][attributes.length>0]",
        message:
          "Avoid raw HTML elements with props in app/ pages. " +
          "Use components from @fastconsig/ui (Button, Input, Form, AppShell, Container, PageHeader…) instead. " +
          "Raw elements are only allowed inside packages/ui.",
      },
      {
        selector:
          "JSXAttribute[name.name='className'][value.value=/\\b(p|px|py|m|mx|my|text|bg|border|rounded|shadow|grid|flex|items|justify|gap|min-h|w|h)-/]",
        message:
          "Tailwind classes in apps/web are forbidden. " +
          "Use design-system components from @fastconsig/ui instead of inline utility classes.",
      },
    ],
  },

  overrides: [
    {
      // Root layout, globals and next.js special files are excluded — they
      // necessarily use <html>, <body> and top-level wrappers.
      files: ["src/app/layout.tsx", "src/app/globals.css", "*.config.*"],
      rules: {
        "no-restricted-syntax": "off",
      },
    },
  ],
};
