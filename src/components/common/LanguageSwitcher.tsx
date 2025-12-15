import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language.split("-")[0];
  return (
    <div className="flex items-center gap-2">
      <select
        id="lang-select"
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="bg-input-bg text-white rounded px-2 py-1 text-sm border border-border-secondary focus:border-blue-500 focus:outline-none cursor-pointer"
        aria-label="Select language"
        value={currentLanguage}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
