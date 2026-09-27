import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content");
const assetsDir = path.join(root, "public", "assets");

const pages = [
  { id: 1, slug: "home", height: 3257, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-4bdc756d-74dd-41e9-8a13-98c259ff9172.html" },
  { id: 2, slug: "oopsie-daisy", height: 8251, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-c43f67b8-cd93-4e79-a1c2-05881fba6284.html" },
  { id: 3, slug: "sarawak-youth-talent", height: 4337, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-87bac97d-3abc-41f2-8818-75e6f0e66739.html" },
  { id: 4, slug: "kiss-or-death", height: 3898, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-3c282c53-2a07-43d1-bbb7-b4d543837dc3.html" },
  { id: 5, slug: "maruki-ramen", height: 3350, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-a21aaa7a-b23d-4d7d-ae71-c6ea25c7bac8.html" },
  { id: 6, slug: "unbound", height: 3123, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-f51d77fd-ce6c-412c-adfc-77f1e7e096f9.html" },
  { id: 7, slug: "christmas", height: 3116, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-522d5636-0b18-4268-b645-330192cd6b12.html" },
  { id: 8, slug: "soonami", height: 4108, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-c087bbe4-48f4-4b4e-b435-a0d55e18df77.html" },
  { id: 9, slug: "contact", height: 540, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-81612e2e-7ad3-46a0-8059-dc27441eb326.html" },
];

const routeMap = {
  1: "/",
  2: "/oopsie-daisy",
  3: "/sarawak-youth-talent",
  4: "/kiss-or-death",
  5: "/maruki-ramen",
  6: "/unbound",
  7: "/christmas",
  8: "/soonami",
  9: "/contact",
};

function decodeUrl(value) {
  return value.replaceAll("&amp;", "&").replace(/&quot;.*$/, "");
}

function extensionFor(url) {
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext) ? ext : ".img";
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      referer: "https://readymag.website/",
      "user-agent": "Mozilla/5.0",
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function localizeAssets(markup) {
  const withoutSrcset = markup.replace(/\s+srcset="[^"]*"/g, "");
  const rawMatches = withoutSrcset.match(/https:\/\/(?:i-p\.rmcdn\.net|v-p\.rmcdn1\.net|c-p\.rmcdn\.net)\/[^\s"<]+/g) ?? [];
  const remoteUrls = [...new Set(rawMatches.map(decodeUrl))];
  const replacements = new Map();

  for (const remoteUrl of remoteUrls) {
    const hash = createHash("sha1").update(remoteUrl).digest("hex").slice(0, 16);
    const filename = `${hash}${extensionFor(remoteUrl)}`;
    const destination = path.join(assetsDir, filename);

    try {
      await readFile(destination);
    } catch {
      const buffer = await fetchBuffer(remoteUrl);
      await writeFile(destination, buffer);
    }

    replacements.set(remoteUrl, `/assets/${filename}`);
  }

  let localized = withoutSrcset;
  for (const [remoteUrl, localUrl] of replacements) {
    const encoded = remoteUrl.replaceAll("&", "&amp;");
    localized = localized.replaceAll(encoded, localUrl).replaceAll(remoteUrl, localUrl);
  }
  return localized;
}

function extractArticle(source) {
  const start = source.indexOf("<article");
  const end = source.indexOf("</article>");
  if (start < 0 || end < 0) throw new Error("Article markup not found");
  return source.slice(start, end + "</article>".length);
}

function normalizeMarkup(markup, pageId) {
  let next = markup
    .replaceAll('class="animation-container invisible"', 'class="animation-container reveal"')
    .replaceAll('class="animation-container vertical-animation invisible"', 'class="animation-container vertical-animation reveal"')
    .replaceAll('data-anchor-link-pos="620"', `href="${pageId === 1 ? "#about" : "/#about"}" data-anchor-link-pos="620"`)
    .replaceAll('data-anchor-link-pos="1416"', `href="${pageId === 1 ? "#projects" : "/#projects"}" data-anchor-link-pos="1416"`);

  for (const [id, route] of Object.entries(routeMap)) {
    const routePattern = new RegExp(`href="/(?:u1300893426/)?6357317/${id === "1" ? "(?:1/)?" : `${id}/`}"`, "g");
    next = next.replace(routePattern, `href="${route}"`);
  }

  next = next
    .replaceAll('href="/6357317/"', 'href="/"')
    .replaceAll('href="/u1300893426/6357317/"', 'href="/"')
    .replaceAll('href="/6357317/1/"', 'href="/"');

  return next;
}

await mkdir(contentDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });

const generatedPages = {};

for (const page of pages) {
  const response = await fetch(page.url, { headers: { referer: "https://readymag.website/" } });
  if (!response.ok) throw new Error(`${response.status} ${page.url}`);
  const source = await response.text();
  const article = normalizeMarkup(extractArticle(source), page.id);
  const localized = await localizeAssets(article);
  await writeFile(path.join(contentDir, `page-${page.id}.html`), localized);
  generatedPages[page.id] = localized;
  process.stdout.write(`Imported ${page.slug}\n`);
}

await writeFile(
  path.join(contentDir, "pages.json"),
  `${JSON.stringify(pages.map(({ id, slug, height }) => ({ id, slug, height })), null, 2)}\n`,
);

await writeFile(
  path.join(root, "app", "generated-pages.ts"),
  `// Generated by scripts/import-readymag.mjs.\nexport const generatedPages: Record<number, string> = ${JSON.stringify(generatedPages)};\n`,
);
