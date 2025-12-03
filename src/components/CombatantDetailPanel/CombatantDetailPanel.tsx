import { X, Shield } from "lucide-react";
import type { Combatant } from "../../types";
import CombatantAvatar from "../common/CombatantAvatar";

type Props = {
  combatant: Combatant;
  onClose?: () => void;
};

export default function CombatantDetailPanel({ combatant, onClose }: Props) {
  return (
    <div
      className="bg-slate-800 rounded-lg p-4 md:p-6 border-2 border-slate-700 relative overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 h-full"
      style={{ borderLeftWidth: "6px", borderLeftColor: combatant.color }}
    >
      {/* Close button - Mobile only */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition md:hidden"
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

      {/* Stats Grid */}
      <div className="space-y-4">
        {/* HP */}
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Hit Points</div>
          <div className="text-3xl font-bold text-green-400">
            {combatant.hp ?? 0} / {combatant.maxHp ?? 0}
          </div>
        </div>

        {/* AC */}
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Armor Class
          </div>
          <div className="text-3xl font-bold text-blue-400">
            {combatant.ac ?? 0}
          </div>
        </div>

        {/* Initiative */}
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Initiative</div>
          <div className="text-3xl font-bold text-blue-400">
            {combatant.initiative}
          </div>
        </div>
      </div>
    </div>
  );
}
