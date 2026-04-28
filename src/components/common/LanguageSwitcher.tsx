import { useTranslation } from "react-i18next";
import Select from "./Select";

const languages = [
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language.split("-")[0];
  return (
    <div className="flex items-center gap-2">
      <Select
        id="lang-select"
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        aria-label="Select language"
        value={currentLanguage}
        className="px-2 py-1"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
