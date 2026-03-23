import { useTranslation } from "react-i18next";
import type { SkillProficiency, SpellcastingAbility } from "../../types";
import { getEffectiveProficiencyBonus, getPassiveScore, getProficiencyBonusFromLevel, safeParseInt } from "../../utils/utils";
import LabeledTextInput from "../common/LabeledTextInput";

type SkillKey = "perceptionProficiency" | "insightProficiency" | "investigationProficiency";

type Props = {
  perceptionProficiency?: SkillProficiency;
  insightProficiency?: SkillProficiency;
  investigationProficiency?: SkillProficiency;
  proficiencyBonus?: number;
  level?: number;
  wis?: number;
  int?: number;
  spellcastingAbility?: SpellcastingAbility;
  onChange: (key: SkillKey, value: SkillProficiency) => void;
  onSpellcastingAbilityChange: (value: SpellcastingAbility | undefined) => void;
  onLevelChange: (level: number | undefined, profBonus: number | undefined) => void;
  onProficiencyBonusChange: (bonus: number | undefined) => void;
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
  spellcastingAbility,
  onChange,
  onSpellcastingAbilityChange,
  onLevelChange,
  onProficiencyBonusChange,
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
      {/* Section Header */}
      <div className="text-sm font-semibold text-text-secondary pt-2">
        {t("forms:library.edit.sections.proficiencySpellcasting")}
      </div>

      {/* Level + Proficiency Bonus */}
      <div className="grid grid-cols-2 gap-4">
        <LabeledTextInput
          id="edit-level"
          label={t("forms:library.edit.fields.level")}
          value={level?.toString() ?? ""}
          onChange={(v) => {
            const newLevel = safeParseInt(v);
            const newProfBonus = newLevel ? getProficiencyBonusFromLevel(newLevel) : proficiencyBonus;
            onLevelChange(newLevel, newProfBonus);
          }}
          placeholder="5"
        />
        <LabeledTextInput
          id="edit-proficiencyBonus"
          label={t("forms:library.edit.fields.proficiencyBonus")}
          value={proficiencyBonus?.toString() ?? ""}
          onChange={(v) => onProficiencyBonusChange(safeParseInt(v))}
          placeholder="2"
        />
      </div>

      {/* Spellcasting Ability */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
          {t("forms:library.edit.fields.spellcastingAbility")}
        </label>
        <select
          className="bg-panel-secondary border border-border-primary rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-border-primary"
          value={spellcastingAbility ?? ""}
          onChange={(e) =>
            onSpellcastingAbilityChange((e.target.value as SpellcastingAbility) || undefined)
          }
        >
          <option value="">{t("forms:library.edit.spellcastingOptions.none")}</option>
          <option value="int">{t("forms:library.edit.spellcastingOptions.int")}</option>
          <option value="wis">{t("forms:library.edit.spellcastingOptions.wis")}</option>
          <option value="cha">{t("forms:library.edit.spellcastingOptions.cha")}</option>
        </select>
      </div>

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
