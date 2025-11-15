import { Edit, Sword, Trash2 } from 'lucide-react';
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
    <div className="flex flex-col md:flex-row md:items-center gap-3 bg-slate-900 rounded p-3 border border-slate-700">
      {/* Avatar and Info Section */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <CombatantAvatar
          imageUrl={player.imageUrl}
          name={player.groupName}
          color={player.color}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate text-base md:text-lg">
            {player.groupName}
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            <div className="truncate">{getInitiativeSummary()}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span>HP: {player.hp}/{player.maxHp || player.hp}</span>
              <span>AC: {player.ac || 10}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-shrink-0 justify-end md:justify-start">
        <button
          onClick={() => onInclude(player)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition min-w-[44px]"
          title="Load into form"
        >
          <Edit className="w-4 h-4" />
          <span className="hidden md:inline">Edit</span>
        </button>
        <button
          onClick={() => onFight(player)}
          className="bg-lime-600 hover:bg-lime-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition min-w-[44px]"
          title="Add to combat"
        >
          <Sword className="w-4 h-4" />
          <span className="hidden md:inline">Fight !</span>
        </button>
        <button
          onClick={() => onRemove(player.id)}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition min-w-[44px] flex items-center justify-center"
          title="Delete player"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}