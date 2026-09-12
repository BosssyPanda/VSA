"use client";

import { cx } from "@/lib/cx";

export type ChoiceOption = {
  id: string;
  label: string;
  /** One plain line under the label. Optional, and short. */
  blurb?: string;
};

/**
 * Every decision this game will grade, drawn so that none of them is the green one.
 *
 * A row, a radio, a label, and nothing else — the same weight for the safe answer, the
 * careless one and the one a real money lender is pushing. Consequence comes after
 * Continue, never before.
 *
 * This replaces a design where the safe action was a filled accent button, the second
 * safe action was outlined, and the risky one was quiet underlined text. That design
 * taught one skill: press the green one. It is a skill with no value outside this
 * website, because a lender's SMS does not arrive with the safe answer already styled,
 * and a player who learned the colour learned nothing they can use on the day it
 * matters. What has to transfer is noticing the tell, so the interface stops noticing
 * on the player's behalf.
 *
 * Selection is drawn in ink, not accent. Accent means "the safe thing to do next" and a
 * selected row is a state rather than a recommendation; a green tint under whatever the
 * player just picked would congratulate them before the game had decided anything.
 *
 * Native radios on purpose. Arrow keys move within the group, Tab skips past it, the
 * label is the hit area, and the browser's own focus ring survives a stylesheet this
 * product never wrote. A div with `role="radio"` would have had to reimplement all four.
 */
export function ChoiceRow({
  name,
  option,
  selected,
  onSelect,
}: {
  name: string;
  option: ChoiceOption;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <label
      className={cx(
        "flex min-h-12 cursor-pointer items-start gap-3 rounded-[var(--radius-button)] border p-4",
        "transition-colors duration-150",
        selected ? "border-ink bg-ground" : "border-line-strong bg-card hover:bg-ground",
      )}
    >
      <input
        type="radio"
        name={name}
        value={option.id}
        checked={selected}
        onChange={() => onSelect(option.id)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-ink)]"
      />
      <span className="flex flex-col gap-0.5">
        <span
          className={cx(
            "text-[length:var(--text-body)] leading-[var(--leading-body)]",
            selected && "font-medium",
          )}
        >
          {option.label}
        </span>
        {option.blurb ? (
          <span className="text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted">
            {option.blurb}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/**
 * A group of them, with the question as its legend.
 *
 * `fieldset`/`legend` rather than a heading and a div: it is the one grouping a screen
 * reader announces on entering the first radio, so somebody arriving by keyboard hears
 * the question again without having to go back for it.
 */
export function ChoiceGroup({
  name,
  legend,
  options,
  value,
  onSelect,
  /** Choices this player cannot take, as plain lines. Never as dead controls. */
  unavailable = [],
}: {
  name: string;
  legend: string;
  options: ChoiceOption[];
  value: string | null;
  onSelect: (id: string) => void;
  unavailable?: string[];
}) {
  return (
    <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
      <legend className="mb-2 p-0 text-[length:var(--text-label)] leading-[var(--leading-label)] font-medium text-muted">
        {legend}
      </legend>
      {options.map((option) => (
        <ChoiceRow
          key={option.id}
          name={name}
          option={option}
          selected={value === option.id}
          onSelect={onSelect}
        />
      ))}
      {unavailable.map((reason) => (
        <p
          key={reason}
          className="m-0 text-[length:var(--text-label)] leading-[var(--leading-label)] text-muted"
        >
          {reason}
        </p>
      ))}
    </fieldset>
  );
}
