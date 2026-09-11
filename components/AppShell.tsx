"use client";

import { FinalStatement } from "@/components/screens/FinalStatement";
import { Help } from "@/components/screens/Help";
import { Month } from "@/components/screens/Month";
import { Outcome } from "@/components/screens/Outcome";
import { PickLife } from "@/components/screens/PickLife";
import { Receipt } from "@/components/screens/Receipt";
import { Title } from "@/components/screens/Title";
import { Nav } from "@/components/ui/Nav";
import { useI18n } from "@/components/I18nProvider";
import { useRun } from "@/hooks/useRun";

/**
 * Which screen is showing.
 *
 * All the routing this product has. One page, no URLs to lose, nothing to load between
 * screens — which matters on a cheap phone on mobile data far more than a tidy route
 * table does.
 *
 * The navigation appears only once a run is going. On the title screen there is nothing
 * to navigate between, and a nav bar there would be two rows of chrome around a single
 * button.
 */
export function AppShell() {
  const api = useRun();
  const { t } = useI18n();
  const { phase, stage, run } = api;

  const inGame = phase === "run" || phase === "report" || (phase === "help" && Boolean(run));

  const screen = () => {
    // Order matters: help overlays everything, picking a life happens before a run
    // exists, and only then does the absence of a run mean "show the title".
    if (phase === "help") {
      return <Help onBack={api.closeHelp} backLabel={run ? t("nav.backToMonth") : t("help.back")} />;
    }
    if (phase === "pickLife") {
      return <PickLife onBegin={api.begin} invitedPersona={api.invited?.personaId ?? null} />;
    }
    if (!run || phase === "title") {
      return (
        <Title
          canResume={api.saveState === "found" && Boolean(run)}
          saveExpired={api.saveState === "outdated"}
          onStart={api.startNew}
          onResume={api.resume}
          onHelp={api.goHelp}
        />
      );
    }
    if (phase === "report") {
      return <FinalStatement run={run} onPlayAgain={api.playAgain} />;
    }
    if (stage.kind === "outcome") {
      return (
        <Outcome
          run={run}
          cardId={stage.cardId}
          outcomeIdx={stage.outcomeIdx}
          onContinue={api.dismissOutcome}
        />
      );
    }
    if (stage.kind === "receipt") {
      return <Receipt record={stage.record} onContinue={api.nextMonth} />;
    }
    return <Month api={api} />;
  };

  return (
    <>
      {screen()}
      {inGame ? (
        <Nav
          tabs={[
            { id: "month", label: t("nav.month"), glyph: "▤" },
            { id: "help", label: t("nav.help"), glyph: "☎\uFE0E" },
          ]}
          active={phase === "help" ? "help" : "month"}
          onSelect={(id) => (id === "help" ? api.goHelp() : api.closeHelp())}
        />
      ) : null}
    </>
  );
}
