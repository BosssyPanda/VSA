"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

/**
 * A panel that slides up from the bottom.
 *
 * Built on the native `<dialog>` element rather than a div with a z-index, and that is
 * not a stylistic preference: `showModal()` gives focus containment, Escape, inert
 * background and the top layer for free, correctly, in every browser. A hand-rolled
 * modal in a product about money decisions would eventually strand somebody's keyboard
 * focus behind the backdrop while they were trying to read what a loan costs.
 *
 * The borrow sheet is the reason this exists: what a loan costs over one month and over
 * twelve has to be readable, calmly, before anything is confirmed, and it has to be
 * dismissible without deciding anything.
 *
 * The way out is rendered here rather than left to each sheet, and `closeLabel` is
 * required so the compiler will not let a sheet ship without one. The set-aside sheet had
 * no visible exit at all: Escape and a tap on the backdrop worked, and neither is
 * discoverable to somebody who is not sure what they are looking at. A panel about money
 * that can only be left by spending some is the kind of pressure this product exists to
 * refuse.
 */
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** The way out, always drawn, never optional. */
  closeLabel: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // A click on the dialog element itself is a click on the backdrop: the panel
        // inside stops its own clicks. Tapping away should never decide anything.
        if (event.target === ref.current) onClose();
      }}
      className={[
        "m-0 mt-auto w-full max-w-[var(--w-column)] bg-transparent p-0 backdrop:bg-black/40",
        "md:mx-auto md:my-auto md:max-w-[var(--w-column-wide)]",
      ].join(" ")}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="rounded-t-[var(--radius-card)] border border-line bg-card p-5 md:rounded-[var(--radius-card)]"
      >
        <h2 className="mt-0 mb-3 text-[length:var(--text-title)] leading-[var(--leading-title)] font-medium">
          {title}
        </h2>
        {children}
        <Button kind="secondary" className="mt-2.5" onClick={onClose}>
          {closeLabel}
        </Button>
      </div>
    </dialog>
  );
}
