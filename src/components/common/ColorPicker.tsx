type Preset = { name: string; value: string };

type Props = {
	presets: Preset[];
	value: string;
	onChange: (value: string) => void;
	label?: string;
};

export default function ColorPicker({ presets, value, onChange, label }: Props) {
	return (
		<div className="flex flex-col gap-1">
			{label && <label className="text-sm text-slate-300">{label}</label>}
			<div className="flex gap-1">
				{presets.map((preset) => (
					<button
						key={preset.value}
						onClick={() => onChange(preset.value)}
						className={`w-8 h-8 rounded border-2 transition ${value === preset.value ? 'border-white scale-110' : 'border-slate-600'}`}
						style={{ backgroundColor: preset.value }}
						title={preset.name}
					/>
				))}
			</div>
		</div>
	);
}
