
type Props = {
  round: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function TurnControls({ round, onPrev, onNext }: Props) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700 flex justify-between items-center">
      <div className="text-2xl font-bold">Round {round}</div>
      <div className="flex gap-2">
        <button onClick={onPrev} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded transition">Previous Turn</button>
        <button onClick={onNext} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition">Next Turn</button>
      </div>
    </div>
  );
}


