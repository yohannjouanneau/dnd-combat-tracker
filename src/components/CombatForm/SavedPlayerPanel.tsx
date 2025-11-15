import { Users } from 'lucide-react';
import type { SavedPlayer } from '../../types';
import SavedPlayerRow from './SavedPlayerRow';

type Props = {
  savedPlayers: SavedPlayer[];
  onInclude: (player: SavedPlayer) => void;
  onFight: (player: SavedPlayer) => void;
  onRemove: (id: string) => void;
};

export default function SavedPlayersPanel({ savedPlayers, onInclude, onFight, onRemove }: Props) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-semibold">Saved Players</h2>
      </div>

      {savedPlayers.length === 0 ? (
        <div className="text-center text-slate-200 py-3">
          <Users className="w-8 h-8 mx-auto mb-4 opacity-50" />
          <p className="text-m">Save playes to use across combats</p>
        </div>
      ) : (
        <div className="space-y-2">
          {savedPlayers.map(player => (
            <SavedPlayerRow
              key={player.id}
              player={player}
              onInclude={onInclude}
              onFight={onFight}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}