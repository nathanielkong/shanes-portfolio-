import { generatedPages } from "./generated-pages";

// Keep the supplied artwork intact. These viewports reveal consecutive sections
// of the same original image, without cropping or resampling the source file.
export const tiffeArtwork = "/assets/tiffe-artboard.png";
const ARTBOARD_WIDTH = 1326;
const ARTBOARD_HEIGHT = 11199;
const boundaries = [0, 1477, 3460, 5108, 6520, 7390, 9180, 10830, 11199];
const labels = ["Tiffe coffee brand", "About Tiffe, brand goals, colours and typography", "Opening soon posters", "Coffee carriers and cups", "Coffee, non-coffee and pastry menu", "Countertop menu mockups", "Takeaway shopping bags", "Tiffe signature"];

export function tiffeCropStyle(start: number, end: number) {
  return `background-image:url('${tiffeArtwork}');background-size:100% auto;background-position:center ${start / (ARTBOARD_HEIGHT - (end - start)) * 100}%;aspect-ratio:${ARTBOARD_WIDTH}/${end - start};`;
}

export function tiffeImage(start: number, end: number, label: string) {
  return `<svg role="img" aria-label="${label}" viewBox="0 ${start} ${ARTBOARD_WIDTH} ${end - start}" width="${ARTBOARD_WIDTH}" height="${end - start}" style="display:block;width:100%;height:100%;overflow:hidden;"><image href="${tiffeArtwork}" width="${ARTBOARD_WIDTH}" height="${ARTBOARD_HEIGHT}" /></svg>`;
}

// Keep the complete original composition centered on the page background.
const heroHeight = 478;
const heroArtwork = `<svg role="img" aria-label="Tiffe coffee brand" viewBox="0 0 1024 478" width="1024" height="478" style="display:block;width:100%;height:100%;">
  <svg x="297.44" y="0" width="429.12" height="478" viewBox="0 0 1326 1477"><image href="${tiffeArtwork}" width="1326" height="11199" /></svg>
</svg>`;
// Reuse the actual Soonami widgets, including their entrance keyframes,
// typography, link hover rules and button styling.
const template = generatedPages[8];
function templateAnimation(widgetId: string) {
  const marker = template.indexOf(`data-id="${widgetId}"`);
  const start = template.lastIndexOf('<div class="animation-container"', marker);
  if (marker < 0 || start < 0) throw new Error(`Missing project template widget: ${widgetId}`);
  const tags = /<div\b[^>]*>|<\/div>/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let tag = tags.exec(template); tag; tag = tags.exec(template)) {
    depth += tag[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return template.slice(start, tags.lastIndex);
  }
  throw new Error(`Incomplete project template widget: ${widgetId}`);
}
const navigation = ["6a113c19466ebcc229b28646", "6a113c259965a9147f11bb77", "6a27f2a07facba77d9e2128d", "6a27f048ba9656318b40e3a9"].map(templateAnimation).join("");
const description = templateAnimation("6a28156b0a04d7120eab2940")
  .replace(/Soonami is [^<]+/, "Tiffe is a café branding project built around the comfort of a daily coffee ritual. Warm colours and playful, hand-drawn illustrations give the identity an approachable character across its printed materials and takeaway packaging.")
  .replace(/The visual system uses [^<]+/, "The visual system brings together coffee and pastry illustrations with expressive lettering and a warm brown, blue, red and yellow palette. The identity extends across opening-soon posters, coffee carriers, menus and shopping bags.");

let top = 930;
function artwork(start: number, end: number, label: string, left: number, width: number, rowTop: number) {
  const height = (end - start) / ARTBOARD_WIDTH * width;
  return { height, html: `<div class="animation-container" style="position:absolute;left:${left}px;top:${rowTop}px;width:${width}px;height:${height}px;transform:scale(0.82);opacity:1;"><div class="rmwidget widget-picture fixMobileImageStretch" style="left:0;top:0;width:${width}px;height:${height}px;">${tiffeImage(start, end, label)}</div></div>` };
}
const rows: [number, number, string][][] = [
  [[boundaries[1], boundaries[2], labels[1]]],
  [[boundaries[2], boundaries[3], labels[2]], [boundaries[3], boundaries[4], labels[3]]],
  [[boundaries[4], boundaries[5], labels[4]]],
  [[7390, 8285, "Countertop menu mockup, front view"], [8285, 9180, "Countertop menu mockup, angled view"]],
  [[boundaries[6], boundaries[7], labels[6]]],
  [[boundaries[7], boundaries[8], labels[7]]],
];
const sections = rows.map((row) => {
  const width = row.length === 1 ? 768 : 374;
  const images = row.map(([start, end, label], index) => artwork(start, end, label, 122 + index * 394, width, top));
  top += Math.max(...images.map((image) => image.height)) + 20;
  return images.map((image) => image.html).join("");
}).join("");
const backToTop = (template.match(/<a class="maglink back-to-top"[\s\S]*?<\/a>/)?.[0] ?? "")
  .replace("top: 3995.27px", `top: ${top}px`);
const templateStyles = template.slice(template.indexOf("</article>") + "</article>".length);

export const tiffeHeight = Math.ceil(top + 113);
export const tiffeHtml = `<article class="page tiffe-page" style="height:${tiffeHeight}px;background:#f5f3ef;color:#4d2d22;">
  <div class="page-content-container" style="height:${tiffeHeight}px;">
    ${navigation}
    <div class="tiffe-hero" style="position:absolute;left:0;top:84px;width:1024px;height:${heroHeight}px;">${heroArtwork}</div>
    ${description}
    ${sections}
    ${backToTop}
  </div>
</article>${templateStyles}`;

export function withTiffeHomePreview(html: string) {
  // Insert a fourth project row before the closing contact section. Keep the
  // imported Readymag source untouched so future imports retain this addition.
  const expanded = html.replace(/height: 3257px/g, "height: 3607px")
    .replace(/top: ([\d.]+)px/g, (match, value) => Number(value) >= 2460 ? `top: ${Number(value) + 350}px` : match);
  const preview = `<div class="animation-container reveal tiffe-home-preview" style="position:absolute;left:388px;top:2470px;width:248px;height:224px;z-index:340;">
    <div class="widget-text-v3"><a href="/tiffe" aria-label="Preview Tiffe"><div class="tiffe-film"><span aria-hidden="true">400 · KODAK PORTRA 400 · 53</span><div style="width:224px;height:159px;">${tiffeImage(7390, 8285, "Tiffe countertop menu design")}</div></div><p>Tiffe/Branding</p></a></div>
  </div>`;
  return expanded.replace(/(<div class="page-content-container"[^>]*>)/, `$1${preview}`);
}
