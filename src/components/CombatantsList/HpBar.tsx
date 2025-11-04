type Props = {
  hp: number;
  maxHp: number;
  onDelta: (delta: number) => void;
};

export default function HpBar({ hp, maxHp, onDelta }: Props) {
  const pct = (hp / maxHp) * 100;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{hp} / {maxHp} HP</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onDelta(-5)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition">-5</button>
          <button onClick={() => onDelta(-1)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition">-1</button>
          <button onClick={() => onDelta(1)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition">+1</button>
          <button onClick={() => onDelta(5)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition">+5</button>
        </div>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all ${pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}


