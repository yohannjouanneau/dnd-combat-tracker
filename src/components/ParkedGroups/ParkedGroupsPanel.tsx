import { CircleParking, Search } from 'lucide-react';
import type { NewCombatant } from '../../types';
import ParkedGroupChip from './ParkedGroupChip';

type Props = {
	parkedGroups: NewCombatant[];
	onInclude: (group: NewCombatant) => void;
	onFight: (group: NewCombatant) => void;
	onRemove: (name: string) => void;
};

export default function ParkedGroupsPanel({ parkedGroups, onInclude, onFight, onRemove }: Props) {
	return (
		<div className="bg-slate-800 rounded-lg p-4 md:p-6 mb-6 border border-slate-700">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
				<div className="flex items-center gap-2">
					<CircleParking className="w-5 h-5 text-sky-400" />
					<h2 className="text-xl font-semibold">Parked groups</h2>
				</div>
				
				{/* Search Input */}
				<div className="relative flex-1 md:flex-initial md:w-64">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
					<input
						type="text"
						placeholder="Search monsters..."
						className="w-full bg-slate-700 text-white rounded pl-10 pr-3 py-2 text-sm border border-slate-600 focus:border-sky-500 focus:outline-none placeholder-slate-400"
						// onFocus handler will be added later for dropdown
						// onChange handler will be added for API search
					/>
				</div>
			</div>
			
			{parkedGroups.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{parkedGroups.map((group) => (
						<ParkedGroupChip key={group.groupName} group={group} onInclude={onInclude} onFight={onFight} onRemove={onRemove} />
					))}
				</div>
			)}
			{parkedGroups.length === 0 && (
				<div className="text-center text-slate-200 py-3">
					<CircleParking className="w-8 h-8 mx-auto mb-4 opacity-50" />
					<p className="text-m">Park combattant to use them later in this combat</p>
				</div>
			)}
		</div>
	);
}
