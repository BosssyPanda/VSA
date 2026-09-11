"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  advanceMonth,
  applyChoice,
  allCardsResolved,
  cardContext,
  deferrableCards,
  drawnCards,
  initRun,
  isResolved,
  quitRun,
  repayDebt,
  setAside,
  takeLoan,
} from "@/lib/monthEngine";
import { readWeakSpots, recordWeakSpots } from "@/lib/progress/weakSpots";
import { parseTicket } from "@/lib/replay";
import { weakSpotsFrom } from "@/lib/report";
import { clearRun, loadRunChecked, saveRun } from "@/lib/saves";
import type { PersonaId, PlayerLoanKind } from "@/lib/types";
import type { Card, MonthRecord, RunState } from "@/lib/types";

/**
 * The whole game, as one hook.
 *
 * It holds no rules. Every action here delegates to `lib/monthEngine.ts`, which is
 * pure and property-tested — so the screens cannot drift from the engine the
 * properties check, and a bug in the month can never be a bug in a component.
 *
 * What this file does own: which screen is showing, when to save, and the one seeded
 * decision a browser has to make that a pure engine cannot (which year you get).
 */

export type Phase = "title" | "pickLife" | "run" | "report" | "help";

/** Where inside a month the player is standing. */
export type Stage =
  | { kind: "month" }
  | { kind: "outcome"; cardId: string; outcomeIdx: number }
  | { kind: "receipt"; record: MonthRecord };

export type RunApi = ReturnType<typeof useRun>;

/** A fresh year. Generated in an event handler, never during render. */
function newSeed(): number {
  const bytes = new Uint32Array(1);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else bytes[0] = Math.floor(Math.random() * 0xffffffff);
  return bytes[0] | 0;
}

/** A ticket in the address bar means somebody shared this year with the player. */
function ticketFromUrl(): { personaId: PersonaId; seed: number } | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("play");
  return value ? parseTicket(value) : null;
}

export function useRun() {
  const [phase, setPhase] = useState<Phase>("title");
  const [returnTo, setReturnTo] = useState<Phase>("title");
  const [run, setRun] = useState<RunState | null>(null);
  const [stage, setStage] = useState<Stage>({ kind: "month" });
  const [saveState, setSaveState] = useState<"unknown" | "none" | "found" | "outdated">("unknown");
  const [invited, setInvited] = useState<{ personaId: PersonaId; seed: number } | null>(null);
  const recorded = useRef(false);

  // Storage and the address bar are read after mount, never during render: the first
  // paint is server-rendered, and reading either during render would make the markup
  // disagree with itself.
  useEffect(() => {
    const found = loadRunChecked();
    setSaveState(found.kind === "run" ? "found" : found.kind === "outdated" ? "none" : "none");
    if (found.kind === "run") setRun(found.run);
    if (found.kind === "outdated") {
      clearRun();
      setSaveState("outdated");
    }
    setInvited(ticketFromUrl());
  }, []);

  // Autosave. A finished run is kept too, so somebody who closes the tab on the final
  // statement can come back and read it.
  useEffect(() => {
    if (run) saveRun(run);
  }, [run]);

  // Weak spots are recorded once, when a run ends, and feed the next run's draw.
  useEffect(() => {
    if (!run || run.status !== "ended" || recorded.current) return;
    recorded.current = true;
    recordWeakSpots(weakSpotsFrom(run));
  }, [run]);

  const cards: Card[] = useMemo(() => (run ? drawnCards(run) : []), [run]);
  const unresolved = useMemo(
    () => (run ? cards.filter((c) => !isResolved(run, c.id)) : []),
    [cards, run],
  );
  const canClose = Boolean(
    run && (allCardsResolved(run) || unresolved.every((c) => c.deferrable)),
  );
  const leavable = useMemo(() => (run ? deferrableCards(run) : []), [run]);
  const context = useMemo(() => (run ? cardContext(run) : null), [run]);

  const goHelp = useCallback(() => {
    setReturnTo((current) => (phase === "help" ? current : phase));
    setPhase("help");
  }, [phase]);

  const closeHelp = useCallback(() => setPhase(returnTo), [returnTo]);

  const startNew = useCallback(() => {
    recorded.current = false;
    setPhase("pickLife");
  }, []);

  const begin = useCallback(
    (personaId: PersonaId, name: string) => {
      const seed = invited && invited.personaId === personaId ? invited.seed : newSeed();
      recorded.current = false;
      setRun(initRun(personaId, name, seed, { weakSpots: readWeakSpots() }));
      setStage({ kind: "month" });
      setPhase("run");
    },
    [invited],
  );

  const resume = useCallback(() => {
    if (!run) return;
    recorded.current = run.status === "ended";
    setStage({ kind: "month" });
    setPhase(run.status === "ended" ? "report" : "run");
  }, [run]);

  const choose = useCallback(
    (cardId: string, choiceId: string) => {
      setRun((current) => {
        if (!current) return current;
        const result = applyChoice(current, cardId, choiceId);
        if (!result) return current;
        setStage({ kind: "outcome", cardId, outcomeIdx: result.index });
        return result.run;
      });
    },
    [],
  );

  const dismissOutcome = useCallback(() => setStage({ kind: "month" }), []);

  const closeMonth = useCallback(() => {
    setRun((current) => {
      if (!current || current.status === "ended") return current;
      const next = advanceMonth(current);
      const record = next.history[next.history.length - 1];
      if (record) setStage({ kind: "receipt", record });
      return next;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setStage({ kind: "month" });
    setRun((current) => {
      if (current && current.status === "ended") setPhase("report");
      return current;
    });
  }, []);

  const putAside = useCallback((amount: number) => {
    setRun((current) => (current ? setAside(current, amount) : current));
  }, []);

  const borrow = useCallback((kind: PlayerLoanKind, amount: number) => {
    let refusal: string | undefined;
    setRun((current) => {
      if (!current) return current;
      const result = takeLoan(current, kind, amount);
      refusal = result.refused;
      return result.refused ? current : result.run;
    });
    return refusal;
  }, []);

  const repay = useCallback((debtId: string, amount: number) => {
    setRun((current) => (current ? repayDebt(current, debtId, amount) : current));
  }, []);

  const quit = useCallback(() => {
    setRun((current) => (current ? quitRun(current) : current));
    setPhase("report");
  }, []);

  const playAgain = useCallback(() => {
    clearRun();
    setRun(null);
    recorded.current = false;
    setSaveState("none");
    setInvited(null);
    setPhase("pickLife");
  }, []);

  return {
    phase,
    stage,
    run,
    cards,
    unresolved,
    leavable,
    canClose,
    context,
    saveState,
    invited,
    startNew,
    begin,
    resume,
    choose,
    dismissOutcome,
    closeMonth,
    nextMonth,
    putAside,
    borrow,
    repay,
    quit,
    playAgain,
    goHelp,
    closeHelp,
  };
}
