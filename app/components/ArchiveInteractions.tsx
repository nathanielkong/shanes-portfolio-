"use client";

/* eslint-disable @next/next/no-img-element -- portfolio artwork keeps its original exported dimensions */

import {
  type CSSProperties,
  type RefObject,
  type TouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import {
  getInteractiveProject,
  interactiveProjects,
  type InteractiveProject,
} from "../project-media";

const FOLDER_WIDGET_ID = "6a100d84d4a20edcacbae02e";
const SCATTER_POSITIONS = [
  { x: "-31vw", y: "-24vh", rotation: "-4deg", z: 2 },
  { x: "16vw", y: "-27vh", rotation: "3deg", z: 4 },
  { x: "-34vw", y: "11vh", rotation: "2.5deg", z: 5 },
  { x: "18vw", y: "12vh", rotation: "-3.5deg", z: 3 },
  { x: "-7vw", y: "27vh", rotation: "1.5deg", z: 6 },
] as const;

const subscribeToClient = () => () => undefined;

type HoveredProject = {
  project: InteractiveProject;
  rect: DOMRect;
};

type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function InteractiveCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const label = labelRef.current;
    if (!cursor || !label) return;

    const onPointerMove = (event: PointerEvent) => {
      cursor.style.transform = `translate3d(${event.clientX + 15}px, ${event.clientY + 15}px, 0)`;
      const target = event.target as HTMLElement | null;
      const context = target?.closest<HTMLElement>("[data-cursor-label]");
      const nextLabel = context?.dataset.cursorLabel ?? "";
      label.textContent = nextLabel;
      cursor.classList.toggle("is-visible", Boolean(nextLabel));
    };
    const hide = () => cursor.classList.remove("is-visible");

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
    };
  }, []);

  return (
    <div ref={cursorRef} className="archive-cursor" aria-hidden="true">
      <span ref={labelRef} />
    </div>
  );
}

function TableOfContents({
  open,
  onClose,
  onViewAll,
}: {
  open: boolean;
  onClose: () => void;
  onViewAll: () => void;
}) {
  return (
    <>
      <button
        className={`archive-menu-scrim${open ? " is-open" : ""}`}
        type="button"
        aria-label="Close table of contents"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        id="archive-table-of-contents"
        className={`archive-toc${open ? " is-open" : ""}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="archive-toc-heading">
          <div>
            <span>Archive index</span>
            <h2>Table of Contents</h2>
          </div>
          <button
            type="button"
            className="archive-icon-button"
            aria-label="Close table of contents"
            tabIndex={open ? 0 : -1}
            data-cursor-label="CLOSE"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <nav aria-label="Portfolio projects">
          <ol className="archive-project-list">
            {interactiveProjects.map((project, index) => (
              <li key={project.slug} style={{ "--menu-index": index } as CSSProperties}>
                <a href={project.href} tabIndex={open ? 0 : -1}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{project.title}</strong>
                  <em>{project.category}</em>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <a
          className="archive-view-all"
          href="#projects"
          tabIndex={open ? 0 : -1}
          onClick={(event) => {
            event.preventDefault();
            onViewAll();
          }}
        >
          View all projects <span aria-hidden="true">↓</span>
        </a>
      </aside>
    </>
  );
}

function ProjectPeek({ hovered }: { hovered: HoveredProject | null }) {
  if (!hovered) return null;

  const width = 190;
  const placeRight = hovered.rect.left < window.innerWidth * 0.57;
  const left = placeRight
    ? clamp(hovered.rect.right - 62, 18, window.innerWidth - width - 18)
    : clamp(hovered.rect.left - width + 62, 18, window.innerWidth - width - 18);
  const top = clamp(hovered.rect.top - 116, 20, window.innerHeight - 180);

  return (
    <div
      className="project-peek is-visible"
      style={{ left, top, "--peek-rotation": placeRight ? "2deg" : "-2deg" } as CSSProperties}
      aria-hidden="true"
    >
      <img src={hovered.project.preview} alt="" />
      <span>{hovered.project.category}</span>
    </div>
  );
}

type ProjectLightboxProps = {
  project: InteractiveProject;
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
};

function ProjectLightbox({
  project,
  index,
  onClose,
  onNext,
  onPrevious,
}: ProjectLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef(0);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const onTouchStart = (event: TouchEvent) => {
    touchStart.current = event.changedTouches[0]?.clientX ?? 0;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const distance = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
    if (Math.abs(distance) < 46) return;
    if (distance < 0) onNext();
    else onPrevious();
  };

  return (
    <div className="project-lightbox" role="dialog" aria-modal="true" aria-label={`${project.title} image viewer`}>
      <button className="lightbox-backdrop" type="button" aria-label="Close image viewer" onClick={onClose} />
      <header className="lightbox-header">
        <span>{project.title}</span>
        <span aria-live="polite">
          {index + 1} / {project.images.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          className="archive-icon-button lightbox-close"
          aria-label="Close image viewer"
          data-cursor-label="CLOSE"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <button
        type="button"
        className="lightbox-arrow is-previous"
        aria-label="Previous image"
        onClick={onPrevious}
      >
        <span aria-hidden="true">←</span>
      </button>
      <figure className="lightbox-figure" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <img src={project.images[index]} alt={`${project.title} artwork ${index + 1}`} />
      </figure>
      <button type="button" className="lightbox-arrow is-next" aria-label="Next image" onClick={onNext}>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

type ProjectScatterProps = {
  project: InteractiveProject;
  visible: boolean;
  origin: Point;
  onClose: () => void;
  onOpenImage: (index: number) => void;
};

function ProjectScatter({ project, visible, origin, onClose, onOpenImage }: ProjectScatterProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (visible) closeRef.current?.focus();
  }, [visible]);

  return (
    <section
      className={`project-scatter${visible ? " is-open" : " is-closing"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-scatter-title"
      style={{ "--origin-x": `${origin.x}px`, "--origin-y": `${origin.y}px` } as CSSProperties}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button className="scatter-backdrop" type="button" aria-label="Close project preview" onClick={onClose} />
      <header className="scatter-heading">
        <span>{project.category}</span>
        <button type="button" onClick={onClose} data-cursor-label="CLOSE">
          <h2 id="project-scatter-title">{project.title}</h2>
          <small>Click to close</small>
        </button>
        <a href={project.href}>Open full case study <span aria-hidden="true">↗</span></a>
      </header>
      <button
        ref={closeRef}
        type="button"
        className="archive-icon-button scatter-close"
        aria-label="Close project preview"
        data-cursor-label="CLOSE"
        onClick={onClose}
      >
        <span aria-hidden="true">×</span>
      </button>
      <div className="project-scatter-images">
        {project.images.map((src, index) => {
          const position = SCATTER_POSITIONS[index % SCATTER_POSITIONS.length];
          const style = {
            "--scatter-x": position.x,
            "--scatter-y": position.y,
            "--scatter-rotation": position.rotation,
            "--scatter-z": position.z,
            "--enter-delay": `${index * 65}ms`,
            "--exit-delay": `${(project.images.length - index - 1) * 45}ms`,
          } as CSSProperties;
          return (
            <button
              key={src}
              type="button"
              className="scatter-image"
              style={style}
              aria-label={`Open ${project.title} image ${index + 1}`}
              data-cursor-label="EXPAND"
              onClick={() => onOpenImage(index)}
            >
              <img src={src} alt={`${project.title} project preview ${index + 1}`} />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type ArchiveInteractionsProps = {
  rootRef: RefObject<HTMLDivElement | null>;
  scale: number;
};

export function ArchiveInteractions({ rootRef, scale }: ArchiveInteractionsProps) {
  const mounted = useSyncExternalStore(subscribeToClient, () => true, () => false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [folderHovered, setFolderHovered] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<HoveredProject | null>(null);
  const [activeProject, setActiveProject] = useState<InteractiveProject | null>(null);
  const [scatterVisible, setScatterVisible] = useState(false);
  const [scatterOrigin, setScatterOrigin] = useState<Point>({ x: 0, y: 0 });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceAnchorRef = useRef<HTMLAnchorElement | null>(null);

  const closeProject = useCallback(() => {
    setLightboxIndex(null);
    setScatterVisible(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setActiveProject(null);
      requestAnimationFrame(() => sourceAnchorRef.current?.focus());
    }, 560);
  }, []);

  const openProject = useCallback((project: InteractiveProject, rect: DOMRect) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenuOpen(false);
    setHoveredProject(null);
    setActiveProject(project);
    setScatterOrigin({
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - window.innerHeight / 2,
    });
    setScatterVisible(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setScatterVisible(true)));
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const stage = root?.querySelector<HTMLElement>(".portfolio-stage");
    if (!stage) return;
    const projectWidgets = new Set<HTMLElement>();

    const projectFromTarget = (target: EventTarget | null) => {
      const element = target instanceof Element ? target : null;
      const anchor = element?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || !stage.contains(anchor)) return null;
      const project = getInteractiveProject(new URL(anchor.href, window.location.href).pathname);
      return project ? { anchor, project } : null;
    };

    const showPreview = (target: EventTarget | null) => {
      if (activeProject) return;
      const match = projectFromTarget(target);
      if (!match) return;
      const widget = match.anchor.closest<HTMLElement>(".widget-text-v3");
      widget?.classList.add("archive-project-hover");
      if (widget) projectWidgets.add(widget);
      match.anchor.dataset.cursorLabel = "VIEW";
      setHoveredProject({ project: match.project, rect: match.anchor.getBoundingClientRect() });
    };

    const hidePreview = (target: EventTarget | null, relatedTarget: EventTarget | null) => {
      const match = projectFromTarget(target);
      if (!match) return;
      if (relatedTarget instanceof Node && match.anchor.contains(relatedTarget)) return;
      match.anchor.closest<HTMLElement>(".widget-text-v3")?.classList.remove("archive-project-hover");
      setHoveredProject((current) =>
        current?.project.slug === match.project.slug ? null : current,
      );
    };

    const onClick = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const match = projectFromTarget(event.target);
      if (!match) return;
      event.preventDefault();
      sourceAnchorRef.current = match.anchor;
      openProject(match.project, match.anchor.getBoundingClientRect());
    };
    const onPointerOver = (event: PointerEvent) => showPreview(event.target);
    const onPointerOut = (event: PointerEvent) => hidePreview(event.target, event.relatedTarget);
    const onFocusIn = (event: FocusEvent) => showPreview(event.target);
    const onFocusOut = (event: FocusEvent) => hidePreview(event.target, event.relatedTarget);

    stage.addEventListener("click", onClick);
    stage.addEventListener("pointerover", onPointerOver);
    stage.addEventListener("pointerout", onPointerOut);
    stage.addEventListener("focusin", onFocusIn);
    stage.addEventListener("focusout", onFocusOut);
    stage.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
      const project = getInteractiveProject(new URL(anchor.href, window.location.href).pathname);
      if (project) {
        anchor.dataset.cursorLabel = "VIEW";
        anchor.setAttribute("aria-haspopup", "dialog");
      }
    });

    return () => {
      stage.removeEventListener("click", onClick);
      stage.removeEventListener("pointerover", onPointerOver);
      stage.removeEventListener("pointerout", onPointerOut);
      stage.removeEventListener("focusin", onFocusIn);
      stage.removeEventListener("focusout", onFocusOut);
      projectWidgets.forEach((widget) => widget.classList.remove("archive-project-hover"));
    };
  }, [activeProject, openProject, rootRef]);

  useEffect(() => {
    const folder = rootRef.current?.querySelector<HTMLElement>(`[data-id="${FOLDER_WIDGET_ID}"]`);
    folder?.classList.toggle("archive-folder-hovered", folderHovered);
    folder?.classList.toggle("archive-folder-open", menuOpen);
    return () => {
      folder?.classList.remove("archive-folder-hovered", "archive-folder-open");
    };
  }, [folderHovered, menuOpen, rootRef]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (lightboxIndex !== null) setLightboxIndex(null);
        else if (activeProject) closeProject();
        else setMenuOpen(false);
      }
      if (lightboxIndex !== null && activeProject) {
        if (event.key === "ArrowLeft") {
          setLightboxIndex((lightboxIndex - 1 + activeProject.images.length) % activeProject.images.length);
        }
        if (event.key === "ArrowRight") {
          setLightboxIndex((lightboxIndex + 1) % activeProject.images.length);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeProject, closeProject, lightboxIndex]);

  useEffect(() => {
    if (!activeProject) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeProject]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const nextImage = () => {
    if (!activeProject || lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % activeProject.images.length);
  };
  const previousImage = () => {
    if (!activeProject || lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + activeProject.images.length) % activeProject.images.length);
  };

  const overlays = mounted
    ? createPortal(
        <>
          <TableOfContents
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onViewAll={() => {
              setMenuOpen(false);
              window.history.replaceState(null, "", "#projects");
              window.scrollTo({ top: 1416 * scale, behavior: "smooth" });
            }}
          />
          <ProjectPeek hovered={activeProject ? null : hoveredProject} />
          {activeProject ? (
            <ProjectScatter
              project={activeProject}
              visible={scatterVisible}
              origin={scatterOrigin}
              onClose={closeProject}
              onOpenImage={setLightboxIndex}
            />
          ) : null}
          {activeProject && lightboxIndex !== null ? (
            <ProjectLightbox
              project={activeProject}
              index={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              onNext={nextImage}
              onPrevious={previousImage}
            />
          ) : null}
          <InteractiveCursor />
        </>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        type="button"
        className="archive-folder-trigger"
        style={{
          left: 184 * scale,
          top: 63 * scale,
          width: 607 * scale,
          height: 484 * scale,
        }}
        aria-label={menuOpen ? "Close portfolio archive" : "Open portfolio archive"}
        aria-expanded={menuOpen}
        aria-controls="archive-table-of-contents"
        data-cursor-label={menuOpen ? "CLOSE" : "OPEN"}
        onPointerEnter={() => setFolderHovered(true)}
        onPointerLeave={() => setFolderHovered(false)}
        onFocus={() => setFolderHovered(true)}
        onBlur={() => setFolderHovered(false)}
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span className="sr-only">{menuOpen ? "Close archive" : "Open archive"}</span>
      </button>
      {overlays}
    </>
  );
}
