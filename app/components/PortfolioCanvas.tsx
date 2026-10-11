"use client";

import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";
import { ArchiveInteractions } from "./ArchiveInteractions";
import { useRouter } from "next/navigation";

type PortfolioCanvasProps = {
  id: number;
  title: string;
  description: string;
  height: number;
  html: string;
};

const DESIGN_WIDTH = 1024;

type MotionFrame = {
  opacity?: string;
  transform?: string;
};

type OriginalInlineStyle = {
  opacity: string;
  opacityPriority: string;
  transform: string;
  transformPriority: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function numberFromStyle(style: CSSStyleDeclaration, property: "top" | "width" | "height") {
  return Number.parseFloat(style[property]) || 0;
}

function transformWithoutScale(transform: string) {
  return transform
    .replace(/scale(?:3d|X|Y)?\([^)]*\)/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^none$/, "")
    .trim();
}

function readMotionFrame(keyframes: string, position: "0%" | "100%") {
  const escapedPosition = position.replace("%", "\\%");
  const body = keyframes.match(new RegExp(`${escapedPosition}\\s*\\{([^}]*)\\}`))?.[1];
  if (!body) return {};

  const frame: MotionFrame = {};
  for (const declaration of body.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon === -1) continue;
    const property = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (property === "opacity") frame.opacity = value;
    if (property === "transform") frame.transform = value;
  }
  return frame;
}

export function PortfolioCanvas({ id, title, height, html }: PortfolioCanvasProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [viewportHeight, setViewportHeight] = useState(0);

  useLayoutEffect(() => {
    const resize = () => {
      setScale(window.innerWidth / DESIGN_WIDTH);
      setViewportHeight(window.innerHeight);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mediaRestorers: Array<() => void> = [];
    const replaceMedia = (widget: HTMLElement, media: HTMLElement) => {
      const originalChildren = [...widget.childNodes];
      widget.replaceChildren(media);
      mediaRestorers.push(() => widget.replaceChildren(...originalChildren));
    };

    if (id === 3) {
      const widget = root.querySelector<HTMLElement>('[data-id="6a1676b09526b302da70f80c"]');
      if (widget) {
        const placeholder = document.createElement("div");
        placeholder.id = "sarawak-embed-slot";
        placeholder.className = "portfolio-embedded-media";
        replaceMedia(widget, placeholder);
      }
    }

    if (id === 7) {
      const widget = root.querySelector<HTMLElement>('[data-id="6ab656c38c34b5f397cf31e3"]');
      if (widget) {
        const video = document.createElement("video");
        video.className = "portfolio-embedded-media portfolio-project-video";
        video.src = "/assets/christmas-3d-environment.mp4";
        video.poster = "/assets/96deecf0c55d85f3.jpg";
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.setAttribute("aria-label", "Christmas 3D environment design video");
        replaceMedia(widget, video);
      }
    }

    const contactWidget = root.querySelector<HTMLElement>('[data-id="6a1a639514ceb446817326a2"]');
    const contactAnchor = contactWidget?.closest<HTMLAnchorElement>("a");
    const originalContactHref = contactAnchor ? contactAnchor.getAttribute("href") : null;
    const originalContactLabel = contactAnchor ? contactAnchor.getAttribute("aria-label") : null;
    if (contactAnchor) {
      contactAnchor.href = "/contact";
      contactAnchor.setAttribute("aria-label", "Go to contact page");
    }

    const originalStyles = new Map<HTMLElement, OriginalInlineStyle>();
    const rememberStyle = (element: HTMLElement) => {
      if (originalStyles.has(element)) return;
      originalStyles.set(element, {
        opacity: element.style.getPropertyValue("opacity"),
        opacityPriority: element.style.getPropertyPriority("opacity"),
        transform: element.style.getPropertyValue("transform"),
        transformPriority: element.style.getPropertyPriority("transform"),
      });
    };

    const projectImageMotions = id === 1
      ? []
      : [
          ...root.querySelectorAll<HTMLElement>(
            ".animation-container:has(.widget-picture), .animation-container:has(.video), .page-content-container > .widget-picture",
          ),
        ]
          .filter((element) => {
            // Baaquet's long background and layout artwork must not scale away
            // from the animated project images placed over them.
            if (id === 6 && !element.classList.contains("animation-container")) return false;
            const top = numberFromStyle(element.style, "top");
            const width = numberFromStyle(element.style, "width");
            const height = numberFromStyle(element.style, "height");
            return top >= 500 && width * height >= 45_000;
          })
          .map((element) => {
            rememberStyle(element);
            const sourceTransform = element.style.transform;
            const scaleMatch = sourceTransform.match(/scale\(\s*([\d.]+)\s*\)/i);
            const startScale = clamp(
              scaleMatch ? Number.parseFloat(scaleMatch[1]) : 0.82,
              0.68,
              0.92,
            );
            const baseTransform = transformWithoutScale(sourceTransform);
            const revealOpacity =
              element.classList.contains("reveal") ||
              Number.parseFloat(element.style.opacity || "1") === 0;

            element.classList.add("portfolio-scroll-motion");
            return {
              element,
              startScale,
              baseTransform,
              revealOpacity,
              currentProgress: 0,
              targetProgress: 0,
            };
          });

    let scrollFrame = 0;
    const applyProjectImageMotion = (
      motion: (typeof projectImageMotions)[number],
      progress: number,
    ) => {
      const currentScale = motion.startScale + (1 - motion.startScale) * progress;
      const transform = `${motion.baseTransform} scale(${currentScale.toFixed(4)})`.trim();
      motion.element.style.setProperty("transform", transform, "important");
      if (motion.revealOpacity) {
        motion.element.style.setProperty("opacity", progress.toFixed(4), "important");
      }
    };

    const renderProjectImageMotion = () => {
      scrollFrame = 0;
      let keepAnimating = false;
      for (const motion of projectImageMotions) {
        const difference = motion.targetProgress - motion.currentProgress;
        if (Math.abs(difference) < 0.001) {
          motion.currentProgress = motion.targetProgress;
        } else {
          motion.currentProgress += difference * 0.24;
          keepAnimating = true;
        }
        applyProjectImageMotion(motion, motion.currentProgress);
      }
      if (keepAnimating) scrollFrame = window.requestAnimationFrame(renderProjectImageMotion);
    };

    const measureProjectImageMotion = (immediate = false) => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const viewportHeight = window.innerHeight;
      const enterAt = viewportHeight;
      const finishAt = viewportHeight * -0.135;
      const distance = enterAt - finishAt;
      const rootTop = root.getBoundingClientRect().top;

      for (const motion of projectImageMotions) {
        const top = rootTop + motion.element.offsetTop * scale;
        const progress = reduceMotion ? 1 : clamp((enterAt - top) / distance, 0, 1);
        motion.targetProgress = progress;
        if (immediate || reduceMotion) {
          motion.currentProgress = progress;
          applyProjectImageMotion(motion, progress);
        }
      }
      if (!immediate && !scrollFrame) {
        scrollFrame = window.requestAnimationFrame(renderProjectImageMotion);
      }
    };
    const requestProjectImageMotion = () => {
      measureProjectImageMotion();
    };

    if (projectImageMotions.length) {
      measureProjectImageMotion(true);
      window.addEventListener("scroll", requestProjectImageMotion, { passive: true });
      window.addEventListener("resize", requestProjectImageMotion);
    }

    const animated = [...root.querySelectorAll<HTMLElement>(".animation-container")]
      .map((element) => {
        if (element.classList.contains("portfolio-scroll-motion")) return null;
        const keyframes = element.querySelector<HTMLStyleElement>(":scope > style")?.textContent ?? "";
        const from = readMotionFrame(keyframes, "0%");
        const to = readMotionFrame(keyframes, "100%");
        const isReveal = element.classList.contains("reveal");

        if (!keyframes && !isReveal) return null;

        const inlineOpacity = element.style.opacity || "1";
        const inlineTransform = element.style.transform || "none";
        const startOpacity = from.opacity ?? (isReveal ? "0" : inlineOpacity);
        const startTransform = from.transform ?? inlineTransform;
        const endOpacity = to.opacity ?? "1";
        const endTransform = to.transform ?? inlineTransform;

        rememberStyle(element);
        element.classList.add("portfolio-motion");
        element.style.setProperty("opacity", startOpacity, "important");
        element.style.setProperty("transform", startTransform, "important");

        return { element, startOpacity, startTransform, endOpacity, endTransform };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const motion = animated.find(({ element }) => element === entry.target);
          if (!motion) continue;
          if (entry.isIntersecting) {
            requestAnimationFrame(() => {
              motion.element.classList.add("is-visible");
              motion.element.style.setProperty("opacity", motion.endOpacity, "important");
              motion.element.style.setProperty("transform", motion.endTransform, "important");
            });
          } else if (entry.boundingClientRect.top > (entry.rootBounds?.bottom ?? window.innerHeight)) {
            motion.element.classList.remove("is-visible");
            motion.element.style.setProperty("opacity", motion.startOpacity, "important");
            motion.element.style.setProperty("transform", motion.startTransform, "important");
          }
        }
      },
      { rootMargin: "0px 0px 4%", threshold: 0.03 },
    );
    animated.forEach(({ element }) => observer.observe(element));

    const slideshow = root.querySelector<HTMLElement>(".widget-slideshow");
    const slides = slideshow
      ? [...slideshow.querySelectorAll<HTMLElement>(".images-wrapper > .image")]
      : [];
    let activeSlide = 0;

    const renderSlide = () => {
      slides.forEach((slide, index) => {
        slide.classList.toggle("portfolio-active-slide", index === activeSlide);
      });
      const counter = slideshow?.querySelector<HTMLElement>(".current-slide, .current");
      if (counter) counter.textContent = String(activeSlide + 1);
    };
    if (slides.length) renderSlide();

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const target = event.target as HTMLElement;
      const anchor = target.closest<HTMLAnchorElement>("a");
      if (anchor) {
        if (anchor.classList.contains("back-to-top") && !anchor.getAttribute("href")) {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        const href = anchor.getAttribute("href") ?? "";
        if (href === "#about" || href === "#projects") {
          event.preventDefault();
          const top = href === "#about" ? 620 : 1416;
          window.scrollTo({ top: top * scale, behavior: "smooth" });
          window.history.replaceState(null, "", href);
          return;
        }
        if (href.startsWith("/") && !href.startsWith("//") && (!anchor.target || anchor.target === "_self")) {
          event.preventDefault();
          router.push(href);
          return;
        }
      }

      if (!slideshow || slides.length === 0) return;
      if (target.closest(".next-picture-arrow-middle")) {
        activeSlide = (activeSlide + 1) % slides.length;
        renderSlide();
      } else if (target.closest(".prev-picture-arrow-middle")) {
        activeSlide = (activeSlide - 1 + slides.length) % slides.length;
        renderSlide();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== "Enter" && event.key !== " ") return;
      if (
        target.closest(".next-picture-arrow-middle") ||
        target.closest(".prev-picture-arrow-middle")
      ) {
        event.preventDefault();
        target.click();
      }
    };

    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKeyDown);

    if (id === 1 && window.location.hash) {
      const top = window.location.hash === "#about" ? 620 : 1416;
      requestAnimationFrame(() => window.scrollTo({ top: top * scale }));
    }

    return () => {
      observer.disconnect();
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", requestProjectImageMotion);
      window.removeEventListener("resize", requestProjectImageMotion);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      mediaRestorers.forEach((restore) => restore());
      if (contactAnchor) {
        if (originalContactHref === null) contactAnchor.removeAttribute("href");
        else contactAnchor.setAttribute("href", originalContactHref);
        if (originalContactLabel === null) contactAnchor.removeAttribute("aria-label");
        else contactAnchor.setAttribute("aria-label", originalContactLabel);
      }
      originalStyles.forEach((original, element) => {
        element.classList.remove("portfolio-motion", "portfolio-scroll-motion", "is-visible");
        if (original.opacity) {
          element.style.setProperty("opacity", original.opacity, original.opacityPriority);
        } else {
          element.style.removeProperty("opacity");
        }
        if (original.transform) {
          element.style.setProperty("transform", original.transform, original.transformPriority);
        } else {
          element.style.removeProperty("transform");
        }
      });
    };
  }, [id, scale, router]);

  return (
    <main
      ref={rootRef}
      className={`portfolio-shell${id === 9 ? " portfolio-contact" : ""}`}
      aria-label={`${title} portfolio page`}
      style={{ height: `${Math.max(height * scale, id === 9 ? viewportHeight : 0)}px` }}
    >
      <div
        className="portfolio-stage"
        style={{
          zoom: scale,
          "--page-height": `${Math.max(height, viewportHeight / scale)}px`,
          "--content-top": `${Math.max(0, (viewportHeight / scale - height) / 2)}px`,
        } as CSSProperties}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {id === 1 ? <ArchiveInteractions rootRef={rootRef} scale={scale} /> : null}
    </main>
  );
}
