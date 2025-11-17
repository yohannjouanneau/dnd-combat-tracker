import "react-i18next";

// Import your translation files for type inference
import common from "./locales/en/common.json";
import combat from "./locales/en/combat.json";
import forms from "./locales/en/forms.json";
import conditions from "./locales/en/conditions.json";
import conditions from "./locales/en/colors.json";

declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof common;
      combat: typeof combat;
      forms: typeof forms;
      conditions: typeof conditions;
      colors: typeof colors;
    };
  }
}
