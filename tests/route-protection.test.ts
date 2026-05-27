import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function collectAppRoutes(dir: string, urlPrefix: string): string[] {
  const routes: string[] = [];

  if (existsSync(path.join(dir, "page.tsx"))) {
    routes.push(urlPrefix || "/");
  }

  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    if (name.startsWith("_")) continue;

    const segment = name.startsWith("(") ? "" : `/${name}`;
    routes.push(...collectAppRoutes(full, urlPrefix + segment));
  }

  return routes;
}

describe("route protection (Next.js App Router)", () => {
  it("has no middleware.ts or proxy.ts — all routes are public by design", () => {
    expect(existsSync(path.join(repoRoot, "middleware.ts"))).toBe(false);
    expect(existsSync(path.join(repoRoot, "src/middleware.ts"))).toBe(false);
    expect(existsSync(path.join(repoRoot, "proxy.ts"))).toBe(false);
    expect(existsSync(path.join(repoRoot, "src/proxy.ts"))).toBe(false);
  });

  it("has no API routes or server actions requiring auth enforcement", () => {
    expect(existsSync(path.join(repoRoot, "src/app/api"))).toBe(false);
  });

  it("exposes only static app routes (no protected segments)", () => {
    const routes = collectAppRoutes(path.join(repoRoot, "src/app"), "");
    expect(routes.sort()).toEqual(["/", "/privacy", "/terms"]);
  });

  it("documents client-only Firebase auth (no server session gate)", () => {
    const authStore = readFileSync(
      path.join(repoRoot, "src/stores/auth-store.ts"),
      "utf8"
    );
    expect(authStore).toContain("onAuthChange");
    expect(authStore).not.toMatch(/from ["']@\/middleware/);
    expect(authStore).not.toMatch(/NextResponse\.redirect/);
  });
});
