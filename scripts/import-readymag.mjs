import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content");
const assetsDir = path.join(root, "public", "assets");

const pages = [
  { id: 1, slug: "home", height: 3543, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-101a7ae4-703c-486b-9321-e3ede5ca8820.html" },
  { id: 2, slug: "oopsie-daisy", height: 6708, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-198beb2a-b1a1-417d-9f41-b7864c98dac4.html" },
  { id: 3, slug: "sarawak-youth-talent", height: 4469, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-ba9c52cf-2f08-4494-a5c7-86c34471c1ac.html" },
  { id: 4, slug: "kiss-or-death", height: 4242, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-779603b0-fe65-4a9e-8bf1-1c86cb19c0dc.html" },
  { id: 5, slug: "maruki-ramen", height: 3667, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-c4328421-4ec5-47b4-873e-36bd24d49d39.html" },
  { id: 6, slug: "unbound", height: 3383, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-ced46b49-8bed-42bc-ad95-faaa5a036215.html" },
  { id: 7, slug: "bloody-health", height: 3090, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-e194b983-ec63-4b4a-8f50-9e454db40f97.html" },
  { id: 8, slug: "beauty-in-the-pot", height: 3719, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-95453ee0-09c6-44ea-a8b7-6c3996a6f906.html" },
  { id: 9, slug: "contact", height: 856, url: "https://c-p.rmcdn.net/6a0fe457f235cc8b4157bdb6/6357317/HtmlSnippet-4d3f2468-4339-4951-9008-4e949bbf590a.html" },
];

const routeMap = {
  1: "/",
  2: "/oopsie-daisy",
  3: "/sarawak-youth-talent",
  4: "/kiss-or-death",
  5: "/maruki-ramen",
  6: "/unbound",
  7: "/bloody-health",
  8: "/beauty-in-the-pot",
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
    .replace(/<style class="">@keyframes[\s\S]*?<\/style>/g, "")
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
  `${JSON.stringify(pages.map(({ url, ...page }) => page), null, 2)}\n`,
);

await writeFile(
  path.join(root, "app", "generated-pages.ts"),
  `// Generated by scripts/import-readymag.mjs.\nexport const generatedPages: Record<number, string> = ${JSON.stringify(generatedPages)};\n`,
);
