import { DEFAULT_CONDITIONS } from "../../constants";

type Props = {
  activeConditions: string[];
  onToggle: (condition: string) => void;
};

export default function ConditionsList({ activeConditions, onToggle }: Props) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">Conditions</div>
      <div className="flex flex-wrap gap-2">
        {DEFAULT_CONDITIONS.map((condition) => (
          <button
            key={condition}
            onClick={() => onToggle(condition)}
            className={`px-3 py-1 rounded text-sm transition ${activeConditions.includes(condition) ? 'bg-orange-600 hover:bg-orange-700' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            {condition}
          </button>
        ))}
      </div>
    </div>
  );
}


