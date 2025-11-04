import { Sword } from 'lucide-react';
import type { NewCombatant } from '../../types';
import ParkedGroupChip from './ParkedGroupChip';

type Props = {
	parkedGroups: NewCombatant[];
	onInclude: (group: NewCombatant) => void;
	onRemove: (name: string) => void;
};

export default function ParkedGroupsPanel({parkedGroups, onInclude, onRemove}: Props) {
	return (
		<div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
			<h2 className="text-xl font-semibold mb-4">Parked Groups</h2>
			{parkedGroups.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{parkedGroups.map((group) => (
						<ParkedGroupChip key={group.groupName} group={group} onInclude={onInclude} onRemove={onRemove} />
					))}
				</div>
			)}
			{parkedGroups.length === 0 && (
				<div className="text-center text-slate-200 py-3">
				<Sword className="w-8 h-8 mx-auto mb-4 opacity-50" />
				<p className="text-m">No parked group yet !</p>
			  </div>
			)}
		</div>
	);
}
