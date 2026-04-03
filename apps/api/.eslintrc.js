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

    // ─── Soft delete enforcement ───────────────────────────────────────────
    // Real `.delete()` / `.deleteMany()` calls bypass the soft-delete pattern.
    // All removal operations MUST go through softDelete() in the repository,
    // which sets `is_active = false` (and eventually `deleted_at`).
    //
    // The only place that is allowed to call real Prisma delete is
    // database migration scripts — never application code.
    "no-restricted-syntax": [
      "error",
      {
        selector: "MemberExpression[property.name='delete'][object.type='CallExpression']",
        message:
          "Do not call .delete() on a Prisma model. " +
          "Use the repository's softDelete() method which sets is_active=false instead.",
      },
      {
        selector: "MemberExpression[property.name='deleteMany'][object.type='CallExpression']",
        message:
          "Do not call .deleteMany() on a Prisma model. " +
          "Implement a soft-delete bulk operation in the repository instead.",
      },
    ],

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
