"use client";

import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Column } from "@/components/ui/Column";

/**
 * An error screen that does not frighten anyone.
 *
 * It says the run is safe before it says anything went wrong, because the person
 * reading it has just watched a screen about their money disappear.
 */
export default function ErrorScreen({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="flex min-h-screen items-center py-8">
      <Column className="flex flex-col gap-5">
        <h1 className="text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold">
          {t("error.title")}
        </h1>
        <p className="text-muted">{t("error.body")}</p>
        <div className="flex flex-col gap-3">
          <Button kind="primary" onClick={reset}>
            {t("error.retry")}
          </Button>
          <Button kind="secondary" onClick={() => window.location.assign("/")}>
            {t("error.home")}
          </Button>
        </div>
      </Column>
    </main>
  );
}
