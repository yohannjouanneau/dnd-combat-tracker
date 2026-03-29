import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import enCommon from "./locales/en/common.json";
import enCombat from "./locales/en/combat.json";
import enForms from "./locales/en/forms.json";
import enConditions from "./locales/en/conditions.json";
import enColors from "./locales/en/colors.json";
import enCampaigns from "./locales/en/campaigns.json";

import frCommon from "./locales/fr/common.json";
import frCombat from "./locales/fr/combat.json";
import frForms from "./locales/fr/forms.json";
import frConditions from "./locales/fr/conditions.json";
import frColors from "./locales/fr/colors.json";
import frCampaigns from "./locales/fr/campaigns.json";

const resources = {
  en: {
    common: enCommon,
    combat: enCombat,
    forms: enForms,
    conditions: enConditions,
    colors: enColors,
    campaigns: enCampaigns,
  },
  fr: {
    common: frCommon,
    combat: frCombat,
    forms: frForms,
    conditions: frConditions,
    colors: frColors,
    campaigns: frCampaigns,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "combat", "forms", "conditions", "colors", "campaigns"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "dnd-ct:language",
    },
  });

export default i18n;
