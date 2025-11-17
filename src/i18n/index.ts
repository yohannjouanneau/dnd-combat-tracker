import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import enCommon from "./locales/en/common.json";
import enCombat from "./locales/en/combat.json";
import enForms from "./locales/en/forms.json";
import enConditions from "./locales/en/conditions.json";
import enColors from "./locales/en/colors.json";

import frCommon from "./locales/fr/common.json";
import frCombat from "./locales/fr/combat.json";
import frForms from "./locales/fr/forms.json";
import frConditions from "./locales/fr/conditions.json";
import frColors from "./locales/fr/colors.json";

const resources = {
  en: {
    common: enCommon,
    combat: enCombat,
    forms: enForms,
    conditions: enConditions,
    colors: enColors,
  },
  fr: {
    common: frCommon,
    combat: frCombat,
    forms: frForms,
    conditions: frConditions,
    colors: frColors,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "combat", "forms", "conditions", "colors"],
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
