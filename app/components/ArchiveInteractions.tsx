"use client";

/* eslint-disable @next/next/no-img-element -- portfolio artwork keeps its original exported dimensions */

import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  getInteractiveProject,
  interactiveProjects,
  type InteractiveProject,
} from "../project-media";

const FOLDER_WIDGET_ID = "6a100d84d4a20edcacbae02e";
const HOME_PROJECT_HOTSPOTS: Record<string, string> = {
  "6a2ab403068c123af12e58dd": "/oopsie-daisy",
  "6a2ab50f79922523f31296a5": "/sarawak-youth-talent",
  "6a2ab65f58bb217c3b5b0e36": "/kiss-or-death",
  "6a2ab67c16576cefb92f8dd2": "/maruki-ramen",
  "6a2ab6952b544b4beff87a81": "/baaquet",
  "6a2ab6c39ae213e0025c15b9": "/christmas",
  "6a2ab6d5f86bc328ba58aaf9": "/soonami",
};

const subscribeToClient = () => () => undefined;


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
  onViewAll,
  onPointerEnter,
  onPointerLeave,
}: {
  open: boolean;
  onViewAll: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  return (
    <aside
      id="archive-table-of-contents"
      className={`archive-toc${open ? " is-open" : ""}`}
      aria-hidden={!open}
      inert={!open}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onPointerEnter}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onPointerLeave();
      }}
    >
      <div className="archive-toc-heading">
        <div>
          <span>Archive index</span>
          <h2>Table of Contents</h2>
        </div>
      </div>
      <nav aria-label="Portfolio projects">
        <ol className="archive-project-list">
          {interactiveProjects.map((project, index) => (
            <li key={project.slug} style={{ "--menu-index": index } as CSSProperties}>
              <Link href={project.href} tabIndex={open ? 0 : -1}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{project.title}</strong>
                <em>{project.category}</em>
              </Link>
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
  );
}

type ProjectScatterProps = {
  project: InteractiveProject;
  visible: boolean;
  onClose: () => void;
};

function ProjectScatter({
  project,
  visible,
  onClose,
}: ProjectScatterProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>("#project-scatter-title")?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className={`project-scatter project-preview-dialog${visible ? " is-open" : " is-closing"}`}
      aria-labelledby="project-scatter-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
    >
      <div className="scatter-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="project-preview-panel">
      <button type="button" className="preview-back" onClick={onClose}>← Back to projects</button>
      <header className="scatter-heading">
        <span>{project.category}</span>
        <h2 id="project-scatter-title" tabIndex={-1}>{project.title}</h2>
        <small>A closer look at the project</small>
        <Link
          href={project.href}
        >
          View full project <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <div className="project-scatter-images">
        {project.images.map((src, index) => {
          const style = {
            "--enter-delay": `${index * 35}ms`,
          } as CSSProperties;
          return (
            <figure
              key={src}
              className="scatter-image"
              style={style}
            >
              <img src={src} decoding="async" alt={`${project.title} project preview ${index + 1}`} />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </figure>
          );
        })}
      </div>
      </div>
    </dialog>
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
  const [activeProject, setActiveProject] = useState<InteractiveProject | null>(null);
  const [scatterVisible, setScatterVisible] = useState(false);
  const projectUnmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelProjectClose = useCallback(() => {
    if (projectUnmountTimer.current) clearTimeout(projectUnmountTimer.current);
    projectUnmountTimer.current = null;
  }, []);

  const closeProject = useCallback(() => {
    cancelProjectClose();
    setScatterVisible(false);
    projectUnmountTimer.current = setTimeout(() => {
      setActiveProject(null);
    }, 240);
  }, [cancelProjectClose]);

  const openProject = useCallback((project: InteractiveProject) => {
    cancelProjectClose();
    setMenuOpen(false);
    setActiveProject(project);
    requestAnimationFrame(() => setScatterVisible(true));
  }, [cancelProjectClose]);

  const cancelMenuClose = useCallback(() => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    menuCloseTimer.current = null;
  }, []);

  const openMenu = useCallback(() => {
    cancelMenuClose();
    setMenuOpen(true);
  }, [cancelMenuClose]);

  const scheduleMenuClose = useCallback(() => {
    cancelMenuClose();
    menuCloseTimer.current = setTimeout(() => setMenuOpen(false), 140);
  }, [cancelMenuClose]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = root?.querySelector<HTMLElement>(".portfolio-stage");
    if (!stage) return;
    const projectWidgets = new Set<HTMLElement>();

    const projectFromTarget = (target: EventTarget | null) => {
      const element = target instanceof Element ? target : null;
      const anchor = element?.closest<HTMLAnchorElement>("a");
      if (!anchor || !stage.contains(anchor)) return null;
      const href = anchor.getAttribute("href");
      const widgetId =
        element?.closest<HTMLElement>("[data-id]")?.dataset.id ??
        anchor.querySelector<HTMLElement>("[data-id]")?.dataset.id;
      const projectPath = href
        ? new URL(href, window.location.href).pathname
        : widgetId
          ? HOME_PROJECT_HOTSPOTS[widgetId]
          : undefined;
      const project = projectPath ? getInteractiveProject(projectPath) : null;
      return project ? { anchor, project } : null;
    };

    const showPreview = (target: EventTarget | null, relatedTarget?: EventTarget | null) => {
      const match = projectFromTarget(target);
      if (!match) return;
      if (relatedTarget instanceof Node && match.anchor.contains(relatedTarget)) return;
      match.project.images.forEach((src) => { const image = new Image(); image.src = src; });
      const widget = match.anchor.closest<HTMLElement>(".widget-text-v3");
      widget?.classList.add("archive-project-hover");
      if (widget) projectWidgets.add(widget);
    };

    const hidePreview = (target: EventTarget | null, relatedTarget: EventTarget | null) => {
      const match = projectFromTarget(target);
      if (!match) return;
      if (relatedTarget instanceof Node && match.anchor.contains(relatedTarget)) return;
      match.anchor.closest<HTMLElement>(".widget-text-v3")?.classList.remove("archive-project-hover");
    };

    const onClick = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const match = projectFromTarget(event.target);
      if (!match) return;
      event.preventDefault();
      match.anchor.focus({ preventScroll: true });
      openProject(match.project);
    };
    const onPointerOver = (event: PointerEvent) => showPreview(event.target, event.relatedTarget);
    const onPointerOut = (event: PointerEvent) => hidePreview(event.target, event.relatedTarget);
    const onFocusIn = (event: FocusEvent) => showPreview(event.target, event.relatedTarget);
    const onFocusOut = (event: FocusEvent) => hidePreview(event.target, event.relatedTarget);

    stage.addEventListener("click", onClick);
    stage.addEventListener("pointerover", onPointerOver);
    stage.addEventListener("pointerout", onPointerOut);
    stage.addEventListener("focusin", onFocusIn);
    stage.addEventListener("focusout", onFocusOut);
    stage.querySelectorAll<HTMLAnchorElement>("a").forEach((anchor) => {
      const match = projectFromTarget(anchor);
      if (match) {
        anchor.dataset.cursorLabel = "PREVIEW";
        anchor.href = match.project.href;
        anchor.setAttribute("aria-haspopup", "dialog");
        anchor.setAttribute("aria-label", `Preview ${match.project.title}`);
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
  }, [openProject, rootRef, scale]);

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
        if (activeProject) closeProject();
        else setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeProject, closeProject]);

  useEffect(() => () => {
    if (projectUnmountTimer.current) clearTimeout(projectUnmountTimer.current);
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
  }, []);

  const overlays = mounted
    ? createPortal(
        <>
          <TableOfContents
            open={menuOpen}
            onPointerEnter={cancelMenuClose}
            onPointerLeave={scheduleMenuClose}
            onViewAll={() => {
              setMenuOpen(false);
              window.history.replaceState(null, "", "#projects");
              window.scrollTo({ top: 1416 * scale, behavior: "smooth" });
            }}
          />
          {activeProject ? (
            <ProjectScatter
              project={activeProject}
              visible={scatterVisible}
              onClose={closeProject}
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
        data-cursor-label={menuOpen ? "" : "OPEN"}
        onPointerEnter={() => {
          setFolderHovered(true);
          openMenu();
        }}
        onPointerLeave={() => {
          setFolderHovered(false);
          scheduleMenuClose();
        }}
        onFocus={() => {
          setFolderHovered(true);
          openMenu();
        }}
        onBlur={(event) => {
          setFolderHovered(false);
          if (!event.currentTarget.contains(event.relatedTarget)) scheduleMenuClose();
        }}
        onClick={() => {
          cancelMenuClose();
          if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
            setMenuOpen((current) => !current);
          } else {
            openMenu();
          }
        }}
      >
        <span className="sr-only">{menuOpen ? "Close archive" : "Open archive"}</span>
      </button>
      {overlays}
    </>
  );
}
