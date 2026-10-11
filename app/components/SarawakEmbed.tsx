"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const PROTOTYPE = "https://xd.adobe.com/embed/86682da0-b663-4a8b-989c-627c43dbf192-d33b/";

// Keep one real iframe alive across client-side page changes. Rendering it
// outside the scaled artwork canvas gives XD the actual viewport dimensions.
export function SarawakEmbed() {
  const pathname = usePathname();
  const wrapper = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const onProject = pathname === "/sarawak-youth-talent";

  useEffect(() => {
    const timer = window.setTimeout(() => setStarted(true), onProject ? 0 : 1200);
    return () => window.clearTimeout(timer);
  }, [onProject]);

  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const slot = document.getElementById("sarawak-embed-slot");
      const visible = onProject && !!slot;
      element.inert = !visible;
      element.style.visibility = visible ? "visible" : "hidden";
      if (expanded && visible) {
        Object.assign(element.style, { left: "0px", top: "0px", width: "100vw", height: "100dvh" });
      } else if (slot && visible) {
        const rect = slot.getBoundingClientRect();
        Object.assign(element.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
      } else {
        Object.assign(element.style, { left: "-2000px", top: "0px", width: "1280px", height: "720px" });
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new MutationObserver(schedule);
    observer.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", escape);
    measure();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("keydown", escape);
    };
  }, [onProject, expanded]);

  useEffect(() => {
    if (!expanded || !onProject) return;
    const previous = document.body.style.overflow;
    const main = document.querySelector("main");
    const previousInert = main?.inert ?? false;
    if (main) main.inert = true;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      if (main) main.inert = previousInert;
    };
  }, [expanded, onProject]);

  return (
    <div ref={wrapper} className={`sarawak-live-embed${expanded && onProject ? " is-expanded" : ""}`}>
      <div className="embed-toolbar">
        <span>Interactive website</span>
        <button type="button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Exit full screen" : "Full screen ↗"}
        </button>
        <a href={PROTOTYPE} target="_blank" rel="noopener noreferrer">Open in new tab ↗</a>
      </div>
      {!loaded && <div className="embed-loading" role="status">Loading interactive website…</div>}
      {started && <iframe src={PROTOTYPE} title="Sarawak Youth Talent interactive website prototype" loading="eager" allow="fullscreen; autoplay" allowFullScreen onLoad={() => setLoaded(true)} />}
    </div>
  );
}
