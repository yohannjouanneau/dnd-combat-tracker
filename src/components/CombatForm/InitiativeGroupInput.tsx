import { Trash2, Dices } from 'lucide-react';
import type { InitiativeGroup } from '../../types';
import { useCallback, useEffect } from 'react';

type Props = {
  group: InitiativeGroup;
  index: number;
  canRemove: boolean;
  initBonus: string,
  onChange: (id: string, patch: Partial<InitiativeGroup>) => void;
  onRemove: (id: string) => void;
};

export default function InitiativeGroupInput({ group, index, canRemove, initBonus, onChange, onRemove }: Props) {
  const rollInitiative = useCallback(() => {
    const bonus = initBonus.length > 0 ? parseInt(initBonus) : 0
    const roll = Math.floor(Math.random() * 20) + 1;
    onChange(group.id, { initiative: String(roll + bonus) });
  }, [initBonus, group.id, onChange])

  useEffect(() => {
    rollInitiative()
  }, [rollInitiative])

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-900 rounded border border-slate-600">
      <span className="text-xs text-slate-400 font-semibold min-w-[20px]">#{index + 1}</span>

      <div className="flex gap-1 flex-1">
        <input
          type="text"
          value={group.initiative}
          onChange={(e) => onChange(group.id, { initiative: e.target.value })}
          placeholder="Init"
          className="bg-slate-700 text-white rounded px-2 py-1.5 text-sm border border-slate-600 focus:border-blue-500 focus:outline-none w-16"
        />
        <button
          onClick={rollInitiative}
          className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1.5 rounded border border-slate-600"
          title="Roll d20"
        >
          <Dices className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400">×</span>
        <input
          type="number"
          value={group.count}
          onChange={(e) => onChange(group.id, { count: e.target.value })}
          placeholder="1"
          min={1}
          className="bg-slate-700 text-white rounded px-2 py-1.5 text-sm border border-slate-600 focus:border-blue-500 focus:outline-none w-14"
        />
      </div>

      <button
        onClick={() => onRemove(group.id)}
        disabled={!canRemove}
        className={`px-2 py-2 rounded transition ${canRemove
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        title={canRemove ? 'Remove initiative group' : 'At least one group required'}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}