import { cx } from "@/lib/cx";

/**
 * A surface holding one thing.
 *
 * One border, one radius, no shadow. The design contract allows a 1px line and nothing
 * else, because a shadow would be the only element on the screen that means nothing.
 */
export function Card({
  as: Tag = "section",
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: "section" | "article" | "div" }) {
  return (
    <Tag
      className={cx("rounded-[var(--radius-card)] border border-line bg-card p-4", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** The quiet label that names a section. Always above its value, never beside it. */
export function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cx(
        "block text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
