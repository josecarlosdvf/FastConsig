/**
 * Architecture governance tests.
 *
 * These tests act as automated guardrails that catch violations of the
 * project's architectural conventions **before** they reach code review.
 *
 * They scan source files as text (no runtime execution) so they run fast,
 * require no external dependencies, and can be run in CI without a database.
 *
 * Conventions enforced:
 *  1. No direct Prisma import outside *.repository.ts and database/* files
 *  2. All write routes (POST / PUT / PATCH / DELETE) must use the validate() middleware
 *  3. All protected routes (user, session) must use authMiddleware
 *  4. All modules must expose a controller, service, repository, and schema
 */

import * as fs from "fs";
import * as path from "path";

const SRC = path.join(__dirname, "..");

/** Recursively collect all .ts files under a directory (excluding node_modules, dist) */
function collectTs(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTs(full));
    } else if (entry.name.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function relPath(filePath: string): string {
  return path.relative(SRC, filePath);
}

// ─── Gather file sets ──────────────────────────────────────────────────────────

const allFiles = collectTs(SRC);

const repositoryFiles = allFiles.filter((f) => f.endsWith(".repository.ts"));
const databaseFiles = allFiles.filter((f) => f.includes(path.join("shared", "database")));
const allowedPrismaFiles = new Set([...repositoryFiles, ...databaseFiles]);

const routerFiles = allFiles.filter((f) => f.endsWith(".router.ts"));
const moduleNames = ["auth", "user", "session", "tenant", "config"];

// ─── 1. No direct Prisma import outside repository / database files ────────────

describe("Governance: no direct Prisma import outside repository layer", () => {
  const nonRepoFiles = allFiles.filter((f) => !allowedPrismaFiles.has(f) && !f.endsWith(".test.ts"));

  it.each(nonRepoFiles)("%s must not import @prisma/client directly", (file) => {
    const content = readFile(file);
    expect(content).not.toMatch(/from\s+['"]@prisma\/client['"]/);
  });

  it.each(nonRepoFiles)("%s must not import from shared/database/prisma directly", (file) => {
    const content = readFile(file);
    // Allow the import only if the file itself is a database file
    const rel = relPath(file);
    if (rel.startsWith(path.join("shared", "database"))) return;
    expect(content).not.toMatch(/from\s+['"][^'"]*shared\/database\/prisma['"]/);
  });
});

// ─── 2. Write routes must use validate() middleware ────────────────────────────

describe("Governance: write routes must use validate() middleware", () => {
  const writeRouterFiles = routerFiles.filter((f) => {
    const content = readFile(f);
    // Only check routers that actually have POST/PUT/PATCH routes
    return /router\.(post|put|patch)\(/.test(content);
  });

  it.each(writeRouterFiles)("%s must import validate middleware for write routes", (file) => {
    const content = readFile(file);
    expect(content).toMatch(/validate\b/);
  });

  it.each(writeRouterFiles)("%s must use validate() on POST routes", (file) => {
    const content = readFile(file);
    const postLines = content
      .split("\n")
      .filter((l) => /router\.post\(/.test(l));

    for (const line of postLines) {
      // Each POST handler must include validate() call
      expect(line).toMatch(/validate\(/);
    }
  });

  it.each(writeRouterFiles)("%s must use validate() on PUT routes", (file) => {
    const content = readFile(file);
    const putLines = content
      .split("\n")
      .filter((l) => /router\.put\(/.test(l));

    for (const line of putLines) {
      expect(line).toMatch(/validate\(/);
    }
  });
});

// ─── 3. Protected routes must declare authMiddleware ──────────────────────────

describe("Governance: protected routers must declare authMiddleware", () => {
  const protectedRouters = routerFiles.filter((f) =>
    f.includes(path.join("modules", "user")) ||
    f.includes(path.join("modules", "session")) ||
    f.includes(path.join("modules", "config"))
  );

  it.each(protectedRouters)("%s must declare authMiddleware", (file) => {
    const content = readFile(file);
    expect(content).toMatch(/authMiddleware/);
  });
});

describe("Governance: config router must enforce permission checks", () => {
  const configRouter = routerFiles.filter((f) => f.includes(path.join("modules", "config")));

  it.each(configRouter)("%s must declare requirePermission for config routes", (file) => {
    const content = readFile(file);
    expect(content).toMatch(/requirePermission\("config:read"\)/);
    expect(content).toMatch(/requirePermission\("config:write"\)/);
  });
});

// ─── 4. Every module must have controller, service, repository, schema ─────────

describe("Governance: module completeness — controller / service / repository / schema", () => {
  const modulesDir = path.join(SRC, "modules");

  for (const mod of moduleNames) {
    const modDir = path.join(modulesDir, mod);

    it(`modules/${mod} must have a controller`, () => {
      expect(fs.existsSync(path.join(modDir, `${mod}.controller.ts`))).toBe(true);
    });

    it(`modules/${mod} must have a service`, () => {
      expect(fs.existsSync(path.join(modDir, `${mod}.service.ts`))).toBe(true);
    });

    it(`modules/${mod} must have a repository`, () => {
      expect(fs.existsSync(path.join(modDir, `${mod}.repository.ts`))).toBe(true);
    });

    it(`modules/${mod} must have a schema`, () => {
      expect(fs.existsSync(path.join(modDir, `${mod}.schema.ts`))).toBe(true);
    });

    it(`modules/${mod} must have a router`, () => {
      expect(fs.existsSync(path.join(modDir, `${mod}.router.ts`))).toBe(true);
    });
  }
});

// ─── 6. Soft delete: repositories must not call .delete() or .deleteMany() ───

describe("Governance: soft delete — repositories must not call .delete() or .deleteMany()", () => {
  it.each(repositoryFiles)("%s must use softDelete() — not .delete() or .deleteMany()", (file) => {
    const content = readFile(file);
    // Prisma model chained .delete( / .deleteMany( calls
    // e.g. db(tenantId).user.delete( or prisma.user.deleteMany(
    expect(content).not.toMatch(/\.\s*delete\s*\(/);
    expect(content).not.toMatch(/\.\s*deleteMany\s*\(/);
  });
});


describe("Governance: controllers must not call schema.parse() (use validate middleware)", () => {
  const controllerFiles = allFiles.filter(
    (f) => f.endsWith(".controller.ts") && !f.endsWith(".test.ts")
  );

  it.each(controllerFiles)("%s must not call schema.parse() directly", (file) => {
    const content = readFile(file);
    // schema.parse() in a controller means validation is bypassed by the middleware pattern
    expect(content).not.toMatch(/Schema\.parse\(/);
  });
});
