import { type RefObject } from 'react';
import type { NewCombatant, InitiativeGroup } from '../../types';
import LabeledTextInput from '../common/LabeledTextInput';
import LabeledNumberInput from '../common/LabeledNumberInput';
import ColorPicker from '../common/ColorPicker';
import InitiativeGroupInput from './InitiativeGroupInput';
import { ChevronDown, Save, Sword, CircleParking, Dice3 } from 'lucide-react';


type Props = {
	formRef: RefObject<HTMLDivElement | null>;
	value: NewCombatant;
	stagedFrom?: string;
	totalCount: number;
	isCollapsed: boolean;
	isFightModeEnabled: boolean;
	onToggleCollapse: (collapsed: boolean) => void;
	onChange: (patch: Partial<NewCombatant>) => void;
	onSubmit: () => void;
	onAddGroup: () => void;
	onSaveAsPlayer: () => void;
	onAddInitiativeGroup: () => void;
	onRemoveInitiativeGroup: (id: string) => void;
	onUpdateInitiativeGroup: (id: string, patch: Partial<InitiativeGroup>) => void;
};

export default function AddCombatantForm({
	formRef,
	value,
	stagedFrom,
	totalCount,
	isCollapsed,
	isFightModeEnabled,
	onToggleCollapse,
	onChange,
	onSubmit,
	onAddGroup,
	onSaveAsPlayer,
	onAddInitiativeGroup,
	onRemoveInitiativeGroup,
	onUpdateInitiativeGroup
}: Props) {

	const getLetterRange = () => {
		if (totalCount <= 1) return '';
		const lastLetter = String.fromCharCode(65 + totalCount - 1);
		return ` (A-${lastLetter})`;
	};

	const parkGroupButtonText = isFightModeEnabled ? "Park group and Fight" : "Park group"
	const savePlayerButtonText = isFightModeEnabled ? "Save player and Fight" : "Save player"

	return (
		<div ref={formRef} className="bg-slate-800 rounded-lg border border-slate-700 mb-6 overflow-hidden">
			<button
				onClick={() => onToggleCollapse(!isCollapsed)}
				className="w-full flex items-center justify-between p-6 hover:bg-slate-700 transition-colors"
			>
				<h2 className="text-xl font-semibold">Combatant</h2>
				<div className="transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>
					<ChevronDown className="w-5 h-5 text-slate-400" />
				</div>
			</button>

			<div
				className="transition-all duration-300 ease-in-out overflow-hidden"
				style={{
					maxHeight: isCollapsed ? '0px' : '2000px',
					opacity: isCollapsed ? 0 : 1
				}}
			>
				<div className="px-6 pb-6">
					{stagedFrom && (
						<div className="mb-3 text-sm text-slate-300">
							Staged from <span className="font-semibold">{stagedFrom}</span>.
						</div>
					)}

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<LabeledTextInput
							id="combatGroupName"
							label="Name"
							value={value.groupName}
							placeholder="Name"
							onChange={(v) => onChange({ groupName: v })}
						/>
						<ColorPicker
							value={value.color}
							onChange={(v) => onChange({ color: v })}
						/>
					</div>

					<div className="mb-4">
						<LabeledTextInput
							id="combatImageUrl"
							label="Image URL (optional)"
							value={value.imageUrl || ''}
							placeholder="https://example.com/character.jpg"
							onChange={(v) => onChange({ imageUrl: v })}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<LabeledNumberInput
							id="combatHp"
							label="Current HP"
							value={value.hp}
							placeholder="Current HP"
							onChange={(v) => onChange({ hp: v })}
						/>
						<LabeledNumberInput
							id="combatMaxHp"
							label="Max HP (Optional)"
							value={value.maxHp}
							placeholder="Max HP"
							onChange={(v) => onChange({ maxHp: v })}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<LabeledNumberInput
							id="combatAc"
							label="AC"
							value={value.ac}
							placeholder="AC"
							onChange={(v) => onChange({ ac: v })}
						/>

						<LabeledNumberInput
							id="initBonus"
							label="Init bonus (Optional)"
							value={value.initBonus}
							placeholder="Init bonus"
							onChange={(v) => onChange({ initBonus: v })}
						/>
					</div>

					<div className="mb-4">
						<div className="flex items-center justify-between mb-2">
							<label className="text-sm font-medium text-slate-300">
								Initiative Groups
								{totalCount > 0 && (
									<span className="ml-2 text-blue-400 text-xs">
										→ {totalCount} combatant{totalCount !== 1 ? 's' : ''}{getLetterRange()}
									</span>
								)}
							</label>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
							{value.initiativeGroups.map((group, index) => (
								<InitiativeGroupInput
									key={group.id}
									group={group}
									index={index}
									initBonus={value.initBonus}
									canRemove={value.initiativeGroups.length > 1}
									onChange={onUpdateInitiativeGroup}
									onRemove={onRemoveInitiativeGroup}
								/>
							))}
						</div>
					</div>

					<div className="grid grid-cols-2 md:flex gap-2 md:gap-3 mt-4">
						<button
							onClick={onSubmit}
							className="bg-lime-600 hover:bg-lime-700 text-white px-4 py-3 rounded flex items-center justify-center gap-2 transition"
							title="Fight!"
						>
							<Sword className="w-5 h-5" />
							<span className="hidden md:inline">Fight !</span>
						</button>
						<button
							onClick={onAddGroup}
							className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-3 rounded flex items-center justify-center gap-2 transition"
							title={parkGroupButtonText}
						>
							<CircleParking className="w-5 h-5" />
							<span className="hidden md:inline">{parkGroupButtonText}</span>
						</button>
						<button
							onClick={onSaveAsPlayer}
							className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded flex items-center justify-center gap-2 transition"
							title="Save as player for reuse across combats"
						>
							<Save className="w-5 h-5" />
							<span className="hidden md:inline">{savePlayerButtonText}</span>
						</button>
						<button
							onClick={onAddInitiativeGroup}
							className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded flex items-center justify-center gap-2 transition"
							title="Add initiative group"
						>
							<Dice3 className="w-5 h-5" />
							<span className="hidden md:inline">Add init group</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}