type Props = {
  round: number;
  currentTurn: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function TurnControls({ round, currentTurn, onPrev, onNext }: Props) {
  const isAtStart = round === 1 && currentTurn === 0;

  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700 flex justify-between items-center">
      <div className="text-2xl font-bold">Round {round}</div>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={isAtStart}
          className={`px-4 py-2 rounded transition ${isAtStart
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
        >
          Previous Turn
        </button>
        <button
          onClick={onNext}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition text-white"
        >
          Next Turn
        </button>
      </div>
    </div>
  );
}