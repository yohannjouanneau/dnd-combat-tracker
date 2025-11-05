import { Trash2, Dices } from 'lucide-react';
import type { InitiativeGroup } from '../../types';
import LabeledNumberInput from '../common/LabeledNumberInput';

type Props = {
  group: InitiativeGroup;
  index: number;
  canRemove: boolean;
  onChange: (id: string, patch: Partial<InitiativeGroup>) => void;
  onRemove: (id: string) => void;
};

export default function InitiativeGroupInput({ group, index, canRemove, onChange, onRemove }: Props) {
  const rollInitiative = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    onChange(group.id, { initiative: String(roll) });
  };

  return (
    <div className="flex items-end gap-3 p-3 bg-slate-900 rounded border border-slate-600">
      <div className="flex-1">
        <label className="block text-sm text-slate-300 mb-1">
          Initiative {index + 1}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={group.initiative}
            onChange={(e) => onChange(group.id, { initiative: e.target.value })}
            placeholder="Initiative"
            className="bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none flex-1"
          />
          <button
            onClick={rollInitiative}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded border border-slate-600"
            title="Roll d20"
          >
            <Dices className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <LabeledNumberInput
        id={`count-${group.id}`}
        label="Count"
        value={group.count}
        placeholder="Count"
        min={1}
        onChange={(v) => onChange(group.id, { count: v })}
        className="bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none w-20"
      />

      <button
        onClick={() => onRemove(group.id)}
        disabled={!canRemove}
        className={`px-3 py-2 rounded transition ${
          canRemove 
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