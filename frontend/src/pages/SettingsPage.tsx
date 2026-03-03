import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();

  const changeLanguage = async (lang: "fr" | "en") => {
    await i18n.changeLanguage(lang);
    localStorage.setItem("briefops:lang", lang);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>

      <Card className="max-w-2xl">
        <h2 className="text-lg font-semibold">{t("settings.languageTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("settings.languageHint")}</p>
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant={i18n.language === "fr" ? "primary" : "secondary"}
            onClick={() => void changeLanguage("fr")}
          >
            FR
          </Button>
          <Button
            variant={i18n.language === "en" ? "primary" : "secondary"}
            onClick={() => void changeLanguage("en")}
          >
            EN
          </Button>
        </div>
      </Card>
    </div>
  );
}

