import { useState, type RefObject } from 'react';
import type { NewCombatant } from '../../types';
import LabeledTextInput from '../common/LabeledTextInput';
import LabeledNumberInput from '../common/LabeledNumberInput';
import ColorPicker from '../common/ColorPicker';
import InitiativeInput from './InitiativeInput';
import { Plus, ChevronDown } from 'lucide-react';

type ColorPreset = { name: string; value: string };

type Props = {
	formRef: RefObject<HTMLDivElement | null>;
	colorPresets: ColorPreset[];
	value: NewCombatant;
	fromParkedName?: string | null;
	onChange: (patch: Partial<NewCombatant>) => void;
	onSubmit: () => void;
	onAddGroup: () => void 
};

export default function AddCombatantForm({ formRef, colorPresets, value, fromParkedName, onChange, onSubmit, onAddGroup }: Props) {
	const [isCollapsed, setIsCollapsed] = useState(false);

	return (
		<div ref={formRef} className="bg-slate-800 rounded-lg border border-slate-700 mb-6 overflow-hidden">
			<button
				onClick={() => setIsCollapsed(!isCollapsed)}
				className="w-full flex items-center justify-between p-6 hover:bg-slate-700 transition-colors"
			>
				<h2 className="text-xl font-semibold">Add Combatant</h2>
				<div className="transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>
					<ChevronDown className="w-5 h-5 text-slate-400" />
				</div>
			</button>

			<div 
				className="transition-all duration-300 ease-in-out overflow-hidden"
				style={{
					maxHeight: isCollapsed ? '0px' : '1000px',
					opacity: isCollapsed ? 0 : 1
				}}
			>
				<div className="px-6 pb-6">
					{fromParkedName && (
						<div className="mb-3 text-sm text-slate-300">
							Staged from parked group <span className="font-semibold">{fromParkedName}</span>.
						</div>
					)}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<LabeledTextInput id="combatGroupName" label="Group Name" value={value.groupName} placeholder="Group Name" onChange={(v) => onChange({ groupName: v })} />
						<div className="flex items-start gap-2">
							<LabeledNumberInput id="combatCount" label="Count" value={value.count} placeholder="Count" min={1} onChange={(v) => onChange({ count: v })} className="bg-slate-700 rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none w-24" />
							<ColorPicker presets={colorPresets} value={value.color} onChange={(v) => onChange({ color: v })} label="Color" />
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<InitiativeInput value={value.initiative} onChange={(v) => onChange({ initiative: v })} />
						<LabeledNumberInput id="combatHp" label="Current HP" value={value.hp} placeholder="Current HP" onChange={(v) => onChange({ hp: v })} />
						<LabeledNumberInput id="combatMaxHp" label="Max HP" value={value.maxHp} placeholder="Max HP" onChange={(v) => onChange({ maxHp: v })} />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
						<LabeledNumberInput id="combatAc" label="AC" value={value.ac} placeholder="AC" onChange={(v) => onChange({ ac: v })} />
					</div>
					<div className="flex gap-3 mt-4">
						<button onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition">
							<Plus className="w-4 h-4" />
							Add to Combat
						</button>
						<button onClick={onAddGroup} className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded flex items-center gap-2 transition">
							<Plus className="w-4 h-4" />
							Add to Parked Groups
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}