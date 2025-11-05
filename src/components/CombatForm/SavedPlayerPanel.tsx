import { Users, Trash2, Plus } from 'lucide-react';
import type { SavedPlayer } from '../../types';

type Props = {
  savedPlayers: SavedPlayer[];
  onInclude: (player: SavedPlayer) => void;
  onRemove: (id: string) => void;
};

export default function SavedPlayersPanel({ savedPlayers, onInclude, onRemove }: Props) {
  const getInitiativeSummary = (player: SavedPlayer) => {
    const totalCount = player.initiativeGroups.reduce((sum, g) => sum + (parseInt(g.count) || 0), 0);
    const groupCount = player.initiativeGroups.length;
    if (groupCount === 1) {
      return `${totalCount} combatant${totalCount !== 1 ? 's' : ''}`;
    }
    return `${groupCount} groups, ${totalCount} total`;
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-semibold">Saved Players</h2>
      </div>
      
      {savedPlayers.length === 0 ? (
        <div className="text-center text-slate-200 py-3">
          <Users className="w-8 h-8 mx-auto mb-4 opacity-50" />
          <p className="text-m">No saved players yet!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {savedPlayers.map(player => (
            <div 
              key={player.id} 
              className="flex items-center justify-between bg-slate-900 rounded p-3 border border-slate-700"
            >
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: player.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{player.groupName}</div>
                  <div className="text-xs text-slate-400">
                    {getInitiativeSummary(player)} • HP: {player.hp}/{player.maxHp || player.hp} • AC: {player.ac || 10}
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
                  Include
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
          ))}
        </div>
      )}
    </div>
  );
}