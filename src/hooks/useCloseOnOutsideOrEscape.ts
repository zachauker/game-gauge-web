"use client";

import { useEffect, useRef } from "react";

/**
 * Returns a ref to attach to a dropdown/popover container. While `open` is
 * true, clicking outside the container or pressing Escape calls `setOpen(false)`.
 */
export function useCloseOnOutsideOrEscape(open: boolean, setOpen: (open: boolean) => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return ref;
}
