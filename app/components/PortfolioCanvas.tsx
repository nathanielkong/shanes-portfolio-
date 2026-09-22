"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type PortfolioCanvasProps = {
  id: number;
  title: string;
  description: string;
  height: number;
  html: string;
};

const DESIGN_WIDTH = 1024;

export function PortfolioCanvas({ id, title, height, html }: PortfolioCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const resize = () => setScale(window.innerWidth / DESIGN_WIDTH);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reveals = [...root.querySelectorAll<HTMLElement>(".reveal")];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px 12%", threshold: 0.03 },
    );
    reveals.forEach((element) => observer.observe(element));

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
    </main>
  );
}
