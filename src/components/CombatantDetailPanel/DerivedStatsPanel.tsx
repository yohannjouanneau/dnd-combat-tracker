import { useTranslation } from "react-i18next";
import type { AbilityScores, ProficiencyData } from "../../types";
import { getEffectiveProficiencyBonus, getPassiveScore, getSpellSaveDC, getSpellAttackBonus } from "../../utils/utils";

export type DerivedStatsInput = ProficiencyData & Partial<AbilityScores>;

type Props = {
  combatant: DerivedStatsInput;
  mode?: "large" | "compact";
};

export default function DerivedStatsPanel({ combatant, mode = "large" }: Props) {
  const { t } = useTranslation(["combat"]);
  const profBonus = getEffectiveProficiencyBonus(combatant.level, combatant.proficiencyBonus);
  const spellcastingScore = combatant.spellcastingAbility
    ? ({ int: combatant.int, wis: combatant.wis, cha: combatant.cha })[combatant.spellcastingAbility]
    : undefined;

  if (profBonus === undefined) return null;

  if (mode === "compact") {
    return (
      <div className="space-y-2 mt-2">
        {/* Proficiency bonus inline */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted uppercase tracking-wider">
            {t("combat:combatant.details.proficiencyBonus")}
          </span>
          <span className="bg-panel-secondary rounded px-2 py-0.5 text-xs font-bold text-blue-400">
            +{profBonus}
          </span>
          {combatant.level && (
            <span className="text-xs text-text-muted">
              {t("combat:combatant.details.level", { level: combatant.level })}
            </span>
          )}
        </div>

        {/* Passive checks */}
        <div className="grid grid-cols-3 gap-1">
          {(["perception", "insight", "investigation"] as const).map((skill) => {
            const profKey = `${skill}Proficiency` as "perceptionProficiency" | "insightProficiency" | "investigationProficiency";
            const abilityMap = { perception: combatant.wis, insight: combatant.wis, investigation: combatant.int };
            const score = getPassiveScore(abilityMap[skill], profBonus, combatant[profKey]);
            const isProficient = combatant[profKey]?.proficient;
            const hasExpertise = combatant[profKey]?.expertise;
            return (
              <div key={skill} className="bg-panel-secondary rounded px-1 py-1.5 flex flex-col items-center">
                <div className="text-xs text-text-muted text-center leading-tight">
                  {t(`combat:combatant.details.passive.${skill}`)}
                  {hasExpertise && <span className="ml-1 text-yellow-400">★★</span>}
                  {isProficient && !hasExpertise && <span className="ml-1 text-blue-400">★</span>}
                </div>
                <div className="text-sm font-bold text-text-primary mt-0.5">{score}</div>
              </div>
            );
          })}
        </div>

        {/* Spell stats */}
        {combatant.spellcastingAbility && (
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-panel-secondary rounded px-1 py-1.5 flex flex-col items-center">
              <div className="text-xs text-text-muted">{t("combat:combatant.details.spellSaveDC")}</div>
              <div className="text-sm font-bold text-purple-400 mt-0.5">
                {getSpellSaveDC(spellcastingScore, profBonus)}
              </div>
            </div>
            <div className="bg-panel-secondary rounded px-1 py-1.5 flex flex-col items-center">
              <div className="text-xs text-text-muted">{t("combat:combatant.details.spellAttackBonus")}</div>
              <div className="text-sm font-bold text-purple-400 mt-0.5">
                {getSpellAttackBonus(spellcastingScore, profBonus) >= 0
                  ? `+${getSpellAttackBonus(spellcastingScore, profBonus)}`
                  : getSpellAttackBonus(spellcastingScore, profBonus)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-text-muted mb-3">
        {t("combat:combatant.details.derivedStats")}
      </h3>

      {/* Proficiency Bonus */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-text-muted uppercase tracking-wider">
          {t("combat:combatant.details.proficiencyBonus")}
        </span>
        <span className="bg-panel-secondary rounded px-3 py-1 text-sm font-bold text-blue-400">
          +{profBonus}
        </span>
        {combatant.level && (
          <span className="text-xs text-text-muted">
            {t("combat:combatant.details.level", { level: combatant.level })}
          </span>
        )}
      </div>

      {/* Passive Checks */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {(["perception", "insight", "investigation"] as const).map((skill) => {
          const profKey = `${skill}Proficiency` as "perceptionProficiency" | "insightProficiency" | "investigationProficiency";
          const abilityMap = { perception: combatant.wis, insight: combatant.wis, investigation: combatant.int };
          const score = getPassiveScore(abilityMap[skill], profBonus, combatant[profKey]);
          const isProficient = combatant[profKey]?.proficient;
          const hasExpertise = combatant[profKey]?.expertise;
          return (
            <div key={skill} className="bg-panel-secondary rounded-lg p-2 flex flex-col items-center">
              <div className="text-xs text-text-muted mb-1 text-center leading-tight">
                {t(`combat:combatant.details.passive.${skill}`)}
                {hasExpertise && <span className="ml-1 text-yellow-400">★★</span>}
                {isProficient && !hasExpertise && <span className="ml-1 text-blue-400">★</span>}
              </div>
              <div className="text-xl font-bold text-text-primary">{score}</div>
            </div>
          );
        })}
      </div>

      {/* Spell DC + Spell Attack Bonus */}
      {combatant.spellcastingAbility && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-panel-secondary rounded-lg p-2 flex flex-col items-center">
            <div className="text-xs text-text-muted mb-1">
              {t("combat:combatant.details.spellSaveDC")}
            </div>
            <div className="text-xl font-bold text-purple-400">
              {getSpellSaveDC(spellcastingScore, profBonus)}
            </div>
          </div>
          <div className="bg-panel-secondary rounded-lg p-2 flex flex-col items-center">
            <div className="text-xs text-text-muted mb-1">
              {t("combat:combatant.details.spellAttackBonus")}
            </div>
            <div className="text-xl font-bold text-purple-400">
              {getSpellAttackBonus(spellcastingScore, profBonus) >= 0
                ? `+${getSpellAttackBonus(spellcastingScore, profBonus)}`
                : getSpellAttackBonus(spellcastingScore, profBonus)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
