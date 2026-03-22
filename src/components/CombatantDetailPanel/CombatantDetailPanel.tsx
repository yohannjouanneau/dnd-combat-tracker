import { X, Shield, Heart, Hourglass, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import type { Combatant } from "../../types";
import CombatantAvatar from "../common/CombatantAvatar";
import { AbilityScore } from "../common/AbilityScore";
import { useTranslation } from "react-i18next";
import MarkdownRenderer from "../common/mardown/MarkdownRenderer";
import { getHpColorClass, getEffectiveProficiencyBonus, getPassiveScore, getSpellSaveDC, getSpellAttackBonus } from "../../utils/utils";
import { useDebounce } from "../../hooks/useDebounce";

const MAX_NOTES_LENGTH = 500;
const NOTES_DEBOUNCE_MS = 400;

type Props = {
  combatant: Combatant;
  onClose?: () => void;
  onUpdateNotes: (id: number, notes: string) => void;
};

export default function CombatantDetailPanel({ combatant, onClose, onUpdateNotes }: Props) {
  const { t } = useTranslation(["combat", "forms"]);
  const profBonus = getEffectiveProficiencyBonus(combatant.level, combatant.proficiencyBonus);
  const spellcastingScore = combatant.spellcastingAbility
    ? ({ int: combatant.int, wis: combatant.wis, cha: combatant.cha })[combatant.spellcastingAbility]
    : undefined;
  const [localNotes, setLocalNotes] = useState(combatant.combatNotes ?? "");

  const debouncedUpdateNotes = useDebounce(
    (value: string) => onUpdateNotes(combatant.id, value),
    NOTES_DEBOUNCE_MS
  );

  // Sync local notes when switching to a different combatant
  useEffect(() => {
    setLocalNotes(combatant.combatNotes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combatant.id]);

  const handleNotesChange = (value: string) => {
    setLocalNotes(value);
    debouncedUpdateNotes(value);
  };

  return (
    <div
      className={`bg-panel-bg rounded-lg p-4 md:p-6 border-2 border-border-primary relative ${onClose ? 'overflow-y-auto scrollbar-thin scrollbar-thumb-border-secondary scrollbar-track-panel-bg' : ''}`}
      style={{ borderLeftWidth: "6px", borderLeftColor: combatant.color }}
    >
      {/* Close button - Mobile only */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition md:hidden"
          title="Close details"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <CombatantAvatar
          imageUrl={combatant.imageUrl}
          name={combatant.displayName}
          color={combatant.color}
          size="lg"
        />
      </div>

      {/* Name */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-center truncate">
          {combatant.displayName}
        </h2>
        {combatant.externalResourceUrl && (
          <button
            type="button"
            onClick={() => window.open(combatant.externalResourceUrl, '_blank', 'noopener,noreferrer')}
            className="p-2 rounded hover:bg-panel-secondary transition text-text-muted hover:text-text-primary flex-shrink-0"
            title={t("combat:combatant.details.openInNewTab")}
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Stats Row - Horizontal Layout */}
      <div className="flex gap-2 md:gap-4">
        {/* HP */}
        <div className="bg-panel-secondary rounded-lg p-2 md:p-4 flex-1 flex flex-col items-center">
          <div className="text-xs md:text-sm text-text-muted mb-1 flex items-center gap-1 md:gap-2">
            <Heart className="w-3 h-3 md:w-4 md:h-4" />
            {t("combat:combatant.details.hitPoints")}
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${getHpColorClass(combatant.hp ?? 0, combatant.maxHp ?? 1)}`}>
            {combatant.hp ?? 0} / {combatant.maxHp ?? 0}
          </div>
        </div>

        {/* AC */}
        <div className="bg-panel-secondary rounded-lg p-2 md:p-4 flex-1 flex flex-col items-center">
          <div className="text-xs md:text-sm text-text-muted mb-1 flex items-center gap-1 md:gap-2">
            <Shield className="w-3 h-3 md:w-4 md:h-4" />
            {t("combat:combatant.details.armorClass")}
          </div>
          <div className="text-2xl md:text-3xl font-bold text-blue-400">
            {combatant.ac ?? 0}
          </div>
        </div>

        {/* Initiative */}
        <div className="bg-panel-secondary rounded-lg p-2 md:p-4 flex-1 flex flex-col items-center">
          <div className="text-xs md:text-sm text-text-muted mb-1 flex items-center gap-1 md:gap-2">
            <Hourglass className="w-3 h-3 md:w-4 md:h-4" />
            {t("combat:combatant.details.initiative")}
          </div>
          <div className="text-2xl md:text-3xl font-bold text-blue-400">
            {combatant.initiative}
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="mt-6">
        <AbilityScore
          type="combatant_details"
          scores={{
            str: combatant.str,
            dex: combatant.dex,
            con: combatant.con,
            int: combatant.int,
            wis: combatant.wis,
            cha: combatant.cha,
          }}
        />
      </div>

      {/* Derived Stats Section */}
      {profBonus !== undefined && (
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
      )}

      {/* Notes Section (read-only, from template) */}
      {combatant.notes && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-text-muted mb-2">
            {t("combat:combatant.details.notes")}
          </h3>
          <div className="bg-panel-secondary rounded-lg p-4">
            <MarkdownRenderer content={combatant.notes} />
          </div>
        </div>
      )}

      {/* Combat Notes (editable, fight-specific) */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-text-muted mb-2">
          {t("combat:combatant.details.combatNotes")}
        </h3>
        <textarea
          className="w-full bg-panel-secondary rounded-lg p-3 text-sm text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-border-primary"
          rows={4}
          maxLength={MAX_NOTES_LENGTH}
          placeholder={t("combat:combatant.details.combatNotesPlaceholder")}
          value={localNotes}
          onChange={(e) => handleNotesChange(e.target.value)}
        />
        <div className="text-xs text-text-muted text-right mt-1">
          {localNotes.length} / {MAX_NOTES_LENGTH}
        </div>
      </div>
    </div>
  );
}
