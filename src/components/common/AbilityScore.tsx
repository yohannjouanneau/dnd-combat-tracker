import { useTranslation } from "react-i18next";
import { getAbilityModifier } from "../../utils/utils";
import type { AbilityScores } from "../../types";

interface Props {
  scores: AbilityScores;
  type?: "library" | "combatant_details";
}

export function AbilityScore({ scores, type = "library" }: Props) {
  const { t } = useTranslation(["forms"]);
  const backgroundColor = type === "library" ? "bg-panel-bg" : "bg-panel-secondary";

  // Container classes
  const containerClass =
    type === "library"
      ? "hidden md:flex items-center gap-2 flex-shrink-0"
      : "flex items-center gap-2 md:gap-4 w-full";

  // Box classes
  const boxClass =
    type === "library"
      ? `${backgroundColor} rounded px-2 py-1 text-center min-w-[48px]`
      : `${backgroundColor} rounded px-2 py-2 md:px-4 md:py-3 text-center flex-1`;

  // Text size classes
  const labelClass = type === "library" ? "text-xs" : "text-xs md:text-sm";
  const valueClass = type === "library" ? "text-sm" : "text-sm md:text-lg";
  const modifierClass = type === "library" ? "text-xs" : "text-xs md:text-sm";

  return (
    <div className={containerClass}>
      {[
        { label: t("library.listItem.abilities.str"), value: scores.str ?? 0 },
        { label: t("library.listItem.abilities.dex"), value: scores.dex ?? 0 },
        { label: t("library.listItem.abilities.con"), value: scores.con ?? 0 },
        { label: t("library.listItem.abilities.int"), value: scores.int ?? 0 },
        { label: t("library.listItem.abilities.wis"), value: scores.wis ?? 0 },
        { label: t("library.listItem.abilities.cha"), value: scores.cha ?? 0 },
      ].map(({ label, value }) => (
        <div key={label} className={boxClass}>
          <div className={`${labelClass} text-text-muted leading-none`}>{label}</div>
          <div className={`${valueClass} font-semibold text-text-primary leading-none mt-1`}>
            {value}
          </div>
          <div className={`${modifierClass} text-blue-400 leading-none mt-1`}>
            {getAbilityModifier(value)}
          </div>
        </div>
      ))}
    </div>
  );
}
