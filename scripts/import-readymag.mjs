import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content");
const assetsDir = path.join(root, "public", "assets");

const pages = [
  "home", "oopsie-daisy", "sarawak-youth-talent", "kiss-or-death",
  "maruki-ramen", "baaquet", "christmas", "soonami", "contact",
].map((slug, index) => ({ id: index + 1, slug, height: 0, url: "" }));

const routeMap = {
  1: "/",
  2: "/oopsie-daisy",
  3: "/sarawak-youth-talent",
  4: "/kiss-or-death",
  5: "/maruki-ramen",
  6: "/baaquet",
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
  // Keep the export's highest-resolution crop. The canvas grows beyond its
  // 1024px design width on desktop, so discarding srcset made artwork soft.
  const withoutSrcset = markup.replace(/<img\b[^>]*>/g, (image) => {
    const srcset = image.match(/\ssrcset="([^"]*)"/)?.[1];
    if (!srcset) return image;
    const candidates = srcset.split(",").map((candidate) => candidate.trim().split(/\s+/));
    candidates.sort((a, b) => Number.parseFloat(b[1]) - Number.parseFloat(a[1]));
    return image.replace(/\ssrcset="[^"]*"/, "").replace(/\ssrc="[^"]*"/, ` src="${candidates[0][0]}"`);
  });
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
  // Readymag exports its typography/link rules after the article. Keep those
  // scoped to the canvas so the separate hover overlays retain their animation.
  const textStyles = source.match(/<div id="text-global-styles">([\s\S]*?)<\/div>/)?.[1] ?? "";
  const css = [...textStyles.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]).join("\n");
  const scopedStyles = css.replace(/([^{}]+)\{([^{}]*)\}/g, (_, selectors, declarations) =>
    `${selectors.split(",").map((selector) => `.portfolio-stage ${selector.trim()}`).join(", ")} {${declarations}}`,
  );
  return source.slice(start, end + "</article>".length) + `<style>${scopedStyles}</style>`;
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

// Resolve the current publication instead of silently reusing an old snapshot.
const publicationResponse = await fetch("https://readymag.website/6357317");
if (!publicationResponse.ok) throw new Error(`Readymag: ${publicationResponse.status}`);
const publication = (await publicationResponse.text()).replaceAll("&quot;", '"').replaceAll("&amp;", "&");
const publishedPages = JSON.parse(publication.match(/"pages":(\[.*?\]),"pages_count"/)?.[1] ?? "[]");
if (publishedPages.length !== pages.length) throw new Error("Readymag page list changed; review the route mapping before importing.");
for (const page of pages) {
  const published = publishedPages.find((item) => item.num === page.id);
  if (!published?.htmlUrl) throw new Error(`Missing published page ${page.id}`);
  page.url = published.htmlUrl;
  page.height = published.height;
}

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
