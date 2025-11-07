import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { DEFAULT_CONDITIONS } from "../../constants";

type Props = {
  activeConditions: string[];
  onToggle: (condition: string) => void;
};

export default function ConditionsList({ activeConditions, onToggle }: Props) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        {/* Show active conditions */}
        {activeConditions.map((condition) => (
          <button
            key={condition}
            onClick={() => onToggle(condition)}
            className="px-3 py-1 rounded text-sm bg-orange-600 hover:bg-orange-700 transition flex items-center gap-1"
          >
            {condition}
            <X className="w-4 h-4" />
          </button>
        ))}
        
        {/* Add Condition Button */}
        <button
          onClick={() => setShowAll(!showAll)}
          className="px-3 py-1 rounded text-sm bg-slate-700 hover:bg-slate-600 transition flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          {showAll ? 'Hide' : 'Add Condition'}
        </button>
      </div>

      {/* All Conditions Dropdown */}
      {showAll && (
        <div className="mt-2 p-3 bg-slate-900 rounded border border-slate-700">
          <div className="text-sm font-semibold mb-2 text-slate-400">Available Conditions</div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CONDITIONS.map((condition) => (
              <button
                key={condition}
                onClick={() => {
                  onToggle(condition);
                  if (!activeConditions.includes(condition)) {
                    setShowAll(false);
                  }
                }}
                className={`px-3 py-1 rounded text-sm transition ${
                  activeConditions.includes(condition)
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {condition}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}