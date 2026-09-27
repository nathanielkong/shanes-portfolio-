import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const routes = [
  "/",
  "/oopsie-daisy",
  "/sarawak-youth-talent",
  "/kiss-or-death",
  "/maruki-ramen",
  "/unbound",
  "/christmas",
  "/soonami",
  "/contact",
];

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

function environment() {
  return {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  };
}

function context() {
  return {
    waitUntil() {},
    passThroughOnException() {},
  };
}

test("server-renders the complete portfolio", async () => {
  const site = await worker();
  const response = await site.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    environment(),
    context(),
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Shane Soon — Creative Portfolio/);
  assert.match(html, /Creative Portfolio/);
  assert.match(html, /Oopsie Daisy/);
  assert.match(html, /Sarawak Youth Talent/);
  assert.match(html, /Christmas\/3D Design/);
  assert.match(html, /Soonami\/Personal Branding/);
  assert.match(html, /\/assets\/[a-f0-9]+\.(?:png|jpg)/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("every portfolio route and share asset is generated", async () => {
  await Promise.all(
    routes.map(async (route) => {
      const relative = route === "/" ? "index.html" : `${route.slice(1)}.html`;
      await access(new URL(`../out/${relative}`, import.meta.url));
    }),
  );

  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.match(layout, /\/og\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/og.png", import.meta.url));
});
