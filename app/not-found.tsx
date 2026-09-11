"use client";

import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Column } from "@/components/ui/Column";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className="flex min-h-screen items-center py-8">
      <Column className="flex flex-col gap-5">
        <h1 className="text-[length:var(--text-title)] leading-[var(--leading-title)] font-semibold">
          {t("notFound.title")}
        </h1>
        <p className="text-muted">{t("notFound.body")}</p>
        <Button kind="primary" onClick={() => window.location.assign("/")}>
          {t("notFound.home")}
        </Button>
      </Column>
    </main>
  );
}
