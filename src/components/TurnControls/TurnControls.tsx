import FocusModeToggle from "./FocusModeToggle";

type Props = {
  round: number;
  currentTurn: number;
  isFocusMode: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleFocus: () => void 
};

export default function TurnControls({ round, currentTurn, isFocusMode, onPrev, onNext, onToggleFocus }: Props) {
  const isAtStart = round === 1 && currentTurn === 0;

  return (
    <div className="bg-slate-800 rounded-lg p-3 md:p-4 mb-6 border border-slate-700 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
      <div className="text-xl md:text-2xl font-bold text-center md:text-left">Round {round}</div>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={isAtStart}
          className={`flex-1 md:flex-none px-3 md:px-4 py-3 md:py-2 rounded transition text-sm md:text-base ${isAtStart
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          title="Previous Turn (Left Arrow)"
        >
          <span className="hidden sm:inline">Previous Turn</span>
          <span className="sm:hidden">Previous</span>
        </button>
        <button
          onClick={onNext}
          className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 px-3 md:px-4 py-3 md:py-2 rounded transition text-white text-sm md:text-base"
          title="Next Turn (Right Arrow)"
        >
          <span className="hidden sm:inline">Next Turn</span>
          <span className="sm:hidden">Next</span>
        </button>
        <FocusModeToggle isFocusMode={isFocusMode} onToggle={onToggleFocus}/>
      </div>
    </div>
  );
}