import { X, Shield, Heart, Hourglass } from "lucide-react";
import type { Combatant } from "../../types";
import CombatantAvatar from "../common/CombatantAvatar";
import { AbilityScore } from "../common/AbilityScore";
import { useTranslation } from "react-i18next";
import MarkdownRenderer from "../common/mardown/MarkdownRenderer";

type Props = {
  combatant: Combatant;
  onClose?: () => void;
};

export default function CombatantDetailPanel({ combatant, onClose }: Props) {
  const { t } = useTranslation(["combat"]);
  return (
    <div
      className="bg-panel-bg rounded-lg p-4 md:p-6 border-2 border-border-primary relative overflow-y-auto scrollbar-thin scrollbar-thumb-border-secondary scrollbar-track-panel-bg h-full"
      style={{ borderLeftWidth: "6px", borderLeftColor: combatant.color }}
    >
      {/* Close button - Mobile only */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-white transition md:hidden"
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
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 truncate">
        {combatant.displayName}
      </h2>

      {/* Stats Row - Horizontal Layout */}
      <div className="flex gap-2 md:gap-4">
        {/* HP */}
        <div className="bg-panel-secondary rounded-lg p-2 md:p-4 flex-1 flex flex-col items-center">
          <div className="text-xs md:text-sm text-text-muted mb-1 flex items-center gap-1 md:gap-2">
            <Heart className="w-3 h-3 md:w-4 md:h-4" />
            {t("combat:combatant.details.hitPoints")}
          </div>
          <div className="text-2xl md:text-3xl font-bold text-green-400">
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

      {/* Notes Section */}
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
    </div>
  );
}
