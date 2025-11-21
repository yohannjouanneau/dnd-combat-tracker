import { Sword, Trash2, Edit } from "lucide-react";
import type { MonsterData } from "../../types";
import CombatantAvatar from "../common/CombatantAvatar";

type Props = {
  monster: MonsterData;
  canLoadToForm?: boolean;
  onLoadToForm?: (monster: MonsterData) => void;
  onEdit?: (monster: MonsterData) => void;
  onDelete: (id: string) => void;
};

export default function MonsterListItem({
  monster,
  canLoadToForm = false,
  onLoadToForm,
  onEdit,
  onDelete,
}: Props) {
  const getAbilityModifier = (score: string) => {
    const num = parseInt(score) || 10;
    const mod = Math.floor((num - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-3 hover:border-slate-600 transition-colors">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <CombatantAvatar
          imageUrl={monster.imageUrl}
          name={monster.name}
          color="#a855f7"
          size="sm"
        />

        {/* Name */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white truncate">
            {monster.name}
          </h3>
        </div>

        {/* HP & AC */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">HP</span>
            <span className="font-semibold text-white text-sm">
              {monster.hp}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">AC</span>
            <span className="font-semibold text-white text-sm">
              {monster.ac}
            </span>
          </div>
        </div>

        {/* Ability Scores */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {[
            { label: "STR", value: monster.str },
            { label: "DEX", value: monster.dex },
            { label: "CON", value: monster.con },
            { label: "INT", value: monster.int },
            { label: "WIS", value: monster.wis },
            { label: "CHA", value: monster.cha },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-slate-800 rounded px-2 py-1 text-center min-w-[48px]"
            >
              <div className="text-xs text-slate-400 leading-none">{label}</div>
              <div className="text-sm font-semibold text-white leading-none mt-0.5">
                {value}
              </div>
              <div className="text-xs text-blue-400 leading-none mt-0.5">
                {getAbilityModifier(value)}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          {/* Edit Button */}
          {onEdit && (
            <button
              onClick={() => onEdit(monster)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition min-w-[44px]"
              title="Edit Monster"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden lg:inline">Edit</span>
            </button>
          )}

          {/* Load to Form Button */}
          {canLoadToForm && onLoadToForm && (
            <button
              onClick={() => onLoadToForm(monster)}
              className="bg-lime-600 hover:bg-lime-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition min-w-[44px]"
              title="Load to Form"
            >
              <Sword className="w-4 h-4" />
              <span className="hidden lg:inline">Load</span>
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => onDelete(monster.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition min-w-[44px]"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden lg:inline">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
