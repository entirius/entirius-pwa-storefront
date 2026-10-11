import { get_i18n } from "@/lib/i18n/i18n.server";
import { Button } from "@/components/ui/button";
import { LinkDynamic } from "@/lib/link-dynamic";

export default async function NotFound() {
  const { t } = await get_i18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="mb-3 text-2xl font-bold">{t("notfound.title")}</h1>
      <p className="text-muted-foreground mb-6">{t("notfound.text")}</p>
      <Button asChild variant="outline">
        <LinkDynamic href="/">{t("common.back_to_store")}</LinkDynamic>
      </Button>
    </div>
  );
}
