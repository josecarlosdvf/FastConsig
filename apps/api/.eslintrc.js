/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["../../packages/config/eslint-preset.js"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  rules: {
    // ─── Architecture enforcement ──────────────────────────────────────────
    // Forbid importing prisma directly outside of repository files.
    // Repositories are the ONLY layer allowed to touch the database.
    // Violation example: import { prisma } from "../../shared/database/prisma"
    // in a service, controller, or middleware.
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["**/shared/database/prisma", "**/shared/database/tenant-prisma"],
            message:
              "Direct Prisma imports are only allowed in *.repository.ts files. " +
              "Use the Repository pattern — create or inject a Repository class instead.",
          },
          {
            group: ["@prisma/client"],
            message:
              "@prisma/client must only be imported in *.repository.ts or database/* files. " +
              "Access the database through the Repository layer.",
          },
        ],
      },
    ],

    // ─── Type safety ───────────────────────────────────────────────────────
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-argument": "warn",
    "@typescript-eslint/explicit-function-return-type": "warn",
  },

  overrides: [
    {
      // Repository files and database helpers are the only places
      // allowed to import Prisma directly.
      files: [
        "**/*.repository.ts",
        "**/shared/database/*.ts",
      ],
      rules: {
        "no-restricted-imports": "off",
      },
    },
    {
      // Test files — relax some strictness to keep tests readable.
      files: ["**/*.test.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
      },
    },
  ],
};
