import { useTranslation } from "react-i18next";
import type { SkillProficiency } from "../../types";
import { getEffectiveProficiencyBonus, getPassiveScore } from "../../utils/utils";

type SkillKey = "perceptionProficiency" | "insightProficiency" | "investigationProficiency";

type Props = {
  perceptionProficiency?: SkillProficiency;
  insightProficiency?: SkillProficiency;
  investigationProficiency?: SkillProficiency;
  proficiencyBonus?: number;
  level?: number;
  wis?: number;
  int?: number;
  onChange: (key: SkillKey, value: SkillProficiency) => void;
};

const SKILLS: { key: SkillKey; abilityKey: "wis" | "int" }[] = [
  { key: "perceptionProficiency", abilityKey: "wis" },
  { key: "insightProficiency", abilityKey: "wis" },
  { key: "investigationProficiency", abilityKey: "int" },
];

export default function SkillProficienciesEditor({
  perceptionProficiency,
  insightProficiency,
  investigationProficiency,
  proficiencyBonus,
  level,
  wis,
  int,
  onChange,
}: Props) {
  const { t } = useTranslation(["forms", "combat"]);

  const proficiency = { perceptionProficiency, insightProficiency, investigationProficiency };
  const abilityScores = { wis, int };

  const effectiveProfBonus = getEffectiveProficiencyBonus(level, proficiencyBonus) ?? 0;

  const passiveScores = {
    perceptionProficiency: getPassiveScore(abilityScores.wis, effectiveProfBonus, perceptionProficiency),
    insightProficiency: getPassiveScore(abilityScores.wis, effectiveProfBonus, insightProficiency),
    investigationProficiency: getPassiveScore(abilityScores.int, effectiveProfBonus, investigationProficiency),
  };

  const skillLabels: Record<SkillKey, string> = {
    perceptionProficiency: t("forms:library.edit.skills.perception"),
    insightProficiency: t("forms:library.edit.skills.insight"),
    investigationProficiency: t("forms:library.edit.skills.investigation"),
  };

  const passiveLabels: Record<SkillKey, string> = {
    perceptionProficiency: t("combat:combatant.details.passive.perception"),
    insightProficiency: t("combat:combatant.details.passive.insight"),
    investigationProficiency: t("combat:combatant.details.passive.investigation"),
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium text-text-muted uppercase tracking-wider">
        {t("forms:library.edit.sections.skillProficiencies")}
      </div>
      <div className="bg-panel-secondary rounded-lg p-3 space-y-2">
        {/* Header row */}
        <div className="grid grid-cols-3 gap-2 text-xs text-text-muted font-medium pb-1 border-b border-border-primary">
          <span>{t("forms:library.edit.fields.skill")}</span>
          <span className="text-center">{t("forms:library.edit.fields.proficient")}</span>
          <span className="text-center">{t("forms:library.edit.fields.expertise")}</span>
        </div>
        {SKILLS.map(({ key }) => {
          const prof = proficiency[key];
          return (
            <div key={key} className="grid grid-cols-3 gap-2 items-center">
              <span className="text-sm text-text-primary">{skillLabels[key]}</span>
              <div className="flex justify-center">
                <input
                  type="checkbox"
                  checked={prof?.proficient ?? false}
                  onChange={(e) =>
                    onChange(key, {
                      proficient: e.target.checked,
                      expertise: e.target.checked ? prof?.expertise : false,
                    })
                  }
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
              </div>
              <div className="flex justify-center">
                <input
                  type="checkbox"
                  checked={prof?.expertise ?? false}
                  disabled={!prof?.proficient}
                  onChange={(e) =>
                    onChange(key, { ...prof, proficient: true, expertise: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          );
        })}

        {/* Passive stats preview */}
        <div className="pt-2 mt-1 border-t border-border-primary flex flex-wrap gap-x-4 gap-y-1">
          {SKILLS.map(({ key }) => (
            <span key={key} className="text-xs text-text-muted">
              <span className="text-text-secondary">{passiveLabels[key]}:</span>{" "}
              <span className="font-semibold text-text-primary">{passiveScores[key]}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
