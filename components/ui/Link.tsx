import { cx } from "@/lib/cx";

/**
 * Links.
 *
 * Ink with an underline, never accent. The underline is what tells a reader this is a
 * link — which is why the colour is free to be ink, and why the link still reads as one
 * for somebody who cannot tell green from black. `accent` means "the safe thing to do
 * next"; navigating is not an action of that kind, and green spent on a back link is
 * green that no longer marks the one button worth pressing.
 *
 * There are two of these rather than one because the elements are genuinely different.
 * Moving between views inside this app fetches nothing and has no address, so it is a
 * `button`. A phone number and somebody else's website are real destinations, so they
 * are anchors. A `div` with an onClick would be neither, and a keyboard would find it
 * last.
 *
 * Every one of them is at least 48px tall. That is not decoration either: the site
 * links used to be 22px lines of text, under even the 24px WCAG 2.2 asks for, and the
 * accessibility gate exempts inline anchors so nothing ever caught it. Somebody opening
 * a government page to check whether a figure is real is doing it on a phone, often
 * one-handed, often while upset.
 */
const UNDERLINED = "underline underline-offset-4";

/** How loud a link is, which follows from what it is for. */
export type OutLinkRole = "call" | "callLarge" | "site";

const ROLE: Record<OutLinkRole, string> = {
  /** A phone number beside the language it is answered in. */
  call:
    "text-[length:var(--text-body)] leading-[var(--leading-body)] font-medium",
  /** A phone number that is the whole point of the card it sits in. */
  callLarge:
    "text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold",
  /** The site a figure came from. Breaks anywhere, because domains do not wrap. */
  site:
    "text-[length:var(--text-label)] leading-[var(--leading-label)] [overflow-wrap:anywhere]",
};

/** A move to another view of this app. No address, so no anchor. */
export function NavLink({
  onClick,
  className,
  children,
}: {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "self-start min-h-12 text-[length:var(--text-body)] leading-[var(--leading-body)]",
        UNDERLINED,
        className,
      )}
    >
      {children}
    </button>
  );
}

/** A destination outside this app: a phone number, or a page on somebody else's site. */
export function OutLink({
  href,
  role = "site",
  className,
  children,
}: {
  href: string;
  role?: OutLinkRole;
  className?: string;
  children: React.ReactNode;
}) {
  // A `tel:` opens the dialler in this window; anything on the web opens beside the
  // game, so a player checking a source does not lose the month they were part way
  // through. `noreferrer noopener` because the target is not ours to trust.
  const away = /^https?:/i.test(href);
  return (
    <a
      href={href}
      {...(away ? { target: "_blank", rel: "noreferrer noopener" } : null)}
      className={cx("inline-flex min-h-12 items-center", ROLE[role], UNDERLINED, className)}
    >
      {children}
    </a>
  );
}
