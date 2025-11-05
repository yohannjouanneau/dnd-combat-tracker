import type { NewCombatant } from '../../types';

type Props = {
	group: NewCombatant;
	onInclude: (group: NewCombatant) => void;
	onRemove: (name: string) => void;
};

export default function ParkedGroupChip({ group, onInclude, onRemove }: Props) {
	return (
		<div
			className="flex items-center gap-2 px-3 py-2 rounded border-2"
			style={{ borderColor: group.color, backgroundColor: `${group.color}20` }}
		>
			<div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
			<span className="font-semibold">{group.groupName}</span>
			<button onClick={() => onInclude(group)} className="text-blue-400 hover:text-blue-300 text-sm">Include</button>
			<button onClick={() => onRemove(group.groupName)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
		</div>
	);
}
