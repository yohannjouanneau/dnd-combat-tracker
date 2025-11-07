type Props = {
  active: boolean;
  onToggle: () => void;
};

export default function ConcentrationToggle({ active, onToggle }: Props) {
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className={`px-3 py-1 rounded text-sm transition ${active ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 hover:bg-slate-600'}`}
      >
        {active ? '✓ Concentrating' : 'Concentration'}
      </button>
    </div>
  );
}