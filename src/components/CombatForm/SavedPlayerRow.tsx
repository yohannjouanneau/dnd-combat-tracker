import { Plus, Sword, Trash2 } from 'lucide-react';
import type { SavedPlayer } from '../../types';
import CombatantAvatar from '../common/CombatantAvatar';

type Props = {
  player: SavedPlayer;
  onInclude: (player: SavedPlayer) => void;
  onFight: (player: SavedPlayer) => void;
  onRemove: (id: string) => void;
};

export default function SavedPlayerRow({ player, onInclude, onFight, onRemove }: Props) {
  const getInitiativeSummary = () => {
    const totalCount = player.initiativeGroups.reduce((sum, g) => sum + (parseInt(g.count) || 0), 0);
    const groupCount = player.initiativeGroups.length;
    if (groupCount === 1) {
      return `${totalCount} combatant${totalCount !== 1 ? 's' : ''}`;
    }
    return `${groupCount} groups, ${totalCount} total`;
  };

  return (
    <div
      className="flex items-center justify-between bg-slate-900 rounded p-3 border border-slate-700"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <CombatantAvatar
          imageUrl={player.imageUrl}
          name={player.groupName}
          color={player.color}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{player.groupName}</div>
          <div className="text-xs text-slate-400">
            {getInitiativeSummary()} • HP: {player.hp}/{player.maxHp || player.hp} • AC: {player.ac || 10}
          </div>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onInclude(player)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition"
          title="Load into form"
        >
          <Plus className="w-3 h-3" />
          Edit
        </button>
        <button
          onClick={() => onFight(player)}
          className="bg-lime-600 hover:bg-lime-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition"
          title="Add to combat"
        >
          <Sword className="w-3 h-3" />
          Fight !
        </button>
        <button
          onClick={() => onRemove(player.id)}
          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition"
          title="Delete player"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}