import { Dice1 } from "lucide-react";

type Props = {
	value: string;
	onChange: (value: string) => void;
};

export default function InitiativeInput({ value, onChange }: Props) {
	return (
		<div className="flex flex-col gap-1">
			<label htmlFor="combatInitiative" className="text-sm text-slate-300">Initiative</label>
			<div className="flex gap-2">
				<input
					id="combatInitiative"
					type="number"
					placeholder="Initiative"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="bg-slate-700 rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none flex-1"
				/>
				<button
					onClick={() => onChange(String(Math.floor(Math.random() * 20) + 1))}
					className="bg-slate-600 hover:bg-slate-500 px-3 py-2 rounded transition text-sm"
					title="Roll d20"
				>
					<Dice1 className="w-4 h-4"/>
				</button>
			</div>
		</div>
	);
}

