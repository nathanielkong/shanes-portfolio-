"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArchiveInteractions } from "./ArchiveInteractions";

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
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const resize = () => setScale(window.innerWidth / DESIGN_WIDTH);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const animated = [...root.querySelectorAll<HTMLElement>(".animation-container")]
      .map((element) => {
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

        element.classList.add("portfolio-motion");
        element.style.setProperty("opacity", startOpacity, "important");
        element.style.setProperty("transform", startTransform, "important");

        return { element, endOpacity, endTransform };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const motion = animated.find(({ element }) => element === entry.target);
            if (!motion) continue;
            requestAnimationFrame(() => {
              motion.element.classList.add("is-visible");
              motion.element.style.setProperty("opacity", motion.endOpacity, "important");
              motion.element.style.setProperty("transform", motion.endTransform, "important");
            });
            observer.unobserve(entry.target);
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
      const target = event.target as HTMLElement;
      const anchor = target.closest<HTMLAnchorElement>("a");
      if (anchor) {
        const href = anchor.getAttribute("href") ?? "";
        if (href === "#about" || href === "#projects") {
          event.preventDefault();
          const top = href === "#about" ? 620 : 1416;
          window.scrollTo({ top: top * scale, behavior: "smooth" });
          window.history.replaceState(null, "", href);
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
    };
  }, [id, scale]);

  return (
    <main
      ref={rootRef}
      className="portfolio-shell"
      aria-label={`${title} portfolio page`}
      style={{ height: `${height * scale}px` }}
    >
      <div
        className="portfolio-stage"
        style={{ transform: `scale(${scale})` }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {id === 1 ? <ArchiveInteractions rootRef={rootRef} scale={scale} /> : null}
    </main>
  );
}
