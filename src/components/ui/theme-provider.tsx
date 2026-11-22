"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
  ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { Sun, Moon } from "lucide-react";

export type ThemeMode = "light" | "dark";

export interface ThemeTransitionOrigin {
  x?: number;
  y?: number;
  iconElement?: HTMLElement | null;
}

interface ViewTransitionLike {
  ready: Promise<void>;
  finished: Promise<void>;
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionLike;
};

interface ThemeContextValue {
  theme: ThemeMode;
  mounted: boolean;
  isTransitioning: boolean;
  setTheme: (next: ThemeMode, origin?: ThemeTransitionOrigin) => void;
  toggleTheme: (origin?: ThemeTransitionOrigin) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeToDocument(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
}

const emptySubscribe = () => () => {};

export function ThemeProvider({
  children,
  storageKey = "temanspace_theme_mode",
}: {
  children: ReactNode;
  storageKey?: string;
}) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const themeRef = useRef<ThemeMode>("light");
  const transitionIdRef = useRef(0);
  const fallbackTimerRef = useRef<number | null>(null);
  const activeAnimationRef = useRef<Animation | null>(null);
  const activeIconElRef = useRef<HTMLElement | null>(null);

  const clearActiveIconTransitionName = useCallback(() => {
    if (activeIconElRef.current) {
      activeIconElRef.current.style.viewTransitionName = "";
      activeIconElRef.current = null;
    }
  }, []);

  useEffect(() => {
    let initial: ThemeMode = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === "dark" || saved === "light") {
        initial = saved;
      }
    } catch {
      initial = "light";
    }
    themeRef.current = initial;
    applyThemeToDocument(initial);
    const id = window.requestAnimationFrame(() => {
      setThemeState(initial);
    });
    return () => window.cancelAnimationFrame(id);
  }, [storageKey]);

  const applyThemeAnimated = useCallback(
    (next: ThemeMode, origin?: ThemeTransitionOrigin) => {
      if (next === themeRef.current) return;
      themeRef.current = next;
      const currentId = ++transitionIdRef.current;

      if (fallbackTimerRef.current !== null) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (activeAnimationRef.current) {
        activeAnimationRef.current.cancel();
        activeAnimationRef.current = null;
      }
      clearActiveIconTransitionName();

      const persist = (mode: ThemeMode) => {
        try {
          window.localStorage.setItem(storageKey, mode);
        } catch {
          // Ignore storage restrictions
        }
      };

      const root = document.documentElement;
      const prefersReducedMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const docWithVT = document as DocumentWithViewTransition;

      if (!prefersReducedMotion && typeof docWithVT.startViewTransition === "function") {
        root.classList.remove("theme-transitioning");
        root.classList.add("theme-view-transition");
        setIsTransitioning(true);

        const iconEl = origin?.iconElement;
        if (iconEl && iconEl.isConnected) {
          iconEl.style.viewTransitionName = "theme-toggle-icon";
          activeIconElRef.current = iconEl;
        }

        const x =
          typeof origin?.x === "number" && Number.isFinite(origin.x)
            ? origin.x
            : window.innerWidth / 2;
        const y =
          typeof origin?.y === "number" && Number.isFinite(origin.y)
            ? origin.y
            : window.innerHeight / 2;
        const endRadius =
          Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
          ) + 2;

        try {
          const transition = docWithVT.startViewTransition(() => {
            flushSync(() => {
              setThemeState(next);
            });
            applyThemeToDocument(next);
            persist(next);
          });

          transition.ready
            .then(() => {
              if (transitionIdRef.current !== currentId) return;
              activeAnimationRef.current = root.animate(
                {
                  clipPath: [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${endRadius}px at ${x}px ${y}px)`,
                  ],
                },
                {
                  duration: 580,
                  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                  fill: "both",
                  pseudoElement: "::view-transition-new(root)",
                }
              );
            })
            .catch(() => {});

          transition.finished
            .catch(() => {})
            .finally(() => {
              if (transitionIdRef.current === currentId) {
                activeAnimationRef.current?.cancel();
                activeAnimationRef.current = null;
                clearActiveIconTransitionName();
                root.classList.remove("theme-view-transition");
                setIsTransitioning(false);
              }
            });

          return;
        } catch {
          clearActiveIconTransitionName();
          root.classList.remove("theme-view-transition");
        }
      }

      root.classList.remove("theme-view-transition");
      if (!prefersReducedMotion) {
        root.classList.add("theme-transitioning");
        setIsTransitioning(true);
        fallbackTimerRef.current = window.setTimeout(() => {
          if (transitionIdRef.current === currentId) {
            root.classList.remove("theme-transitioning");
            setIsTransitioning(false);
            fallbackTimerRef.current = null;
          }
        }, 520);
      }

      setThemeState(next);
      applyThemeToDocument(next);
      persist(next);
    },
    [clearActiveIconTransitionName, storageKey]
  );

  const setTheme = useCallback(
    (next: ThemeMode, origin?: ThemeTransitionOrigin) => applyThemeAnimated(next, origin),
    [applyThemeAnimated]
  );

  const toggleTheme = useCallback(
    (origin?: ThemeTransitionOrigin) =>
      applyThemeAnimated(themeRef.current === "dark" ? "light" : "dark", origin),
    [applyThemeAnimated]
  );

  return (
    <ThemeContext.Provider value={{ theme, mounted, isTransitioning, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

export function ThemeToggle({ compact = true }: { compact?: boolean }) {
  const { theme, mounted, toggleTheme } = useTheme();
  const isDark = mounted && theme === "dark";
  const iconStageRef = useRef<HTMLSpanElement | null>(null);

  return (
    <button
      type="button"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const hasCoords = e.clientX !== 0 || e.clientY !== 0;
        toggleTheme({
          x: hasCoords ? e.clientX : rect.left + rect.width / 2,
          y: hasCoords ? e.clientY : rect.top + rect.height / 2,
          iconElement: iconStageRef.current,
        });
      }}
      aria-label={isDark ? "Ubah ke mode terang" : "Ubah ke mode gelap"}
      aria-pressed={isDark}
      className={`group inline-flex items-center justify-center rounded-full bg-white/55 dark:bg-slate-800/75 hover:bg-white/90 dark:hover:bg-slate-700/90 hover:border-sky-200/80 dark:hover:border-sky-400/40 backdrop-blur-md border border-white/70 dark:border-slate-700/80 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 cursor-pointer ${
        compact ? "p-2.5" : "px-3.5 py-2"
      }`}
    >
      <span
        ref={iconStageRef}
        className="relative inline-flex items-center justify-center w-4 h-4 shrink-0"
      >
        <Sun
          className={`w-4 h-4 text-amber-400 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isDark
              ? "opacity-100 rotate-0 scale-100 group-hover:rotate-45 group-hover:scale-110"
              : "opacity-0 -rotate-90 scale-50 pointer-events-none"
          }`}
        />
        <Moon
          className={`w-4 h-4 text-sky-600 absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isDark
              ? "opacity-0 rotate-90 scale-50 pointer-events-none"
              : "opacity-100 rotate-0 scale-100 group-hover:-rotate-12 group-hover:scale-110"
          }`}
        />
      </span>
    </button>
  );
}
