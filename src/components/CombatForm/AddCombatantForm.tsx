import { type RefObject } from 'react';
import type { NewCombatant, InitiativeGroup } from '../../types';
import LabeledTextInput from '../common/LabeledTextInput';
import LabeledNumberInput from '../common/LabeledNumberInput';
import ColorPicker from '../common/ColorPicker';
import InitiativeGroupInput from './InitiativeGroupInput';
import { Plus, ChevronDown, Save, Sword, CircleParking } from 'lucide-react';


type Props = {
	formRef: RefObject<HTMLDivElement | null>;
	value: NewCombatant;
	stagedFrom?: string;
	totalCount: number;
	isCollapsed: boolean;
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

	return (
		<div ref={formRef} className="bg-slate-800 rounded-lg border border-slate-700 mb-6 overflow-hidden">
			<button
				onClick={() => onToggleCollapse(!isCollapsed)}
				className="w-full flex items-center justify-between p-6 hover:bg-slate-700 transition-colors"
			>
				<h2 className="text-xl font-semibold">Combatant stats</h2>
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
							label="Group Name" 
							value={value.groupName} 
							placeholder="Group Name" 
							onChange={(v) => onChange({ groupName: v })} 
						/>
						<ColorPicker 
							value={value.color} 
							onChange={(v) => onChange({ color: v })} 
							label="Color" 
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
							label="Max HP" 
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
							<button
								onClick={onAddInitiativeGroup}
								className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded flex items-center gap-1 transition text-xs"
							>
								<Plus className="w-3 h-3" />
								Add Group
							</button>
						</div>
						
						<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
							{value.initiativeGroups.map((group, index) => (
								<InitiativeGroupInput
									key={group.id}
									group={group}
									index={index}
									canRemove={value.initiativeGroups.length > 1}
									onChange={onUpdateInitiativeGroup}
									onRemove={onRemoveInitiativeGroup}
								/>
							))}
						</div>
					</div>

					<div className="flex gap-3 mt-4">
						<button 
							onClick={onSubmit} 
							className="bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
						>
							<Sword className="w-4 h-4" />
							Fight !
						</button>
						<button 
							onClick={onAddGroup} 
							className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded flex items-center gap-2 transition"
						>
							<CircleParking className="w-4 h-4" />
							Park Group
						</button>
						<button 
							onClick={onSaveAsPlayer} 
							className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
							title="Save as player for reuse across combats"
						>
							<Save className="w-4 h-4" />
							Save player
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}