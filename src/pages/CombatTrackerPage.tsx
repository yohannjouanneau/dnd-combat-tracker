import { useRef, useState } from 'react';
import { Sword } from 'lucide-react';
import ParkedGroupsPanel from '../components/ParkedGroups/ParkedGroupsPanel';
import AddCombatantForm from '../components/CombatForm/AddCombatantForm';
import GroupsOverview from '../components/GroupsOverview/GroupsOverview';
import TurnControls from '../components/TurnControls/TurnControls';
import CombatantsList from '../components/CombatantsList/CombatantsList';
import type { GroupSummary } from '../types';
import type { CombatStateManager } from '../state';
import SavedPlayersPanel from '../components/CombatForm/SavedPlayerPanel';

type Props = {
  combatStateManager: CombatStateManager;
};

export default function CombatTrackerPage({ combatStateManager }: Props) {
  const formRef = useRef<HTMLDivElement>(null);
  const combatants = combatStateManager.state.combatants
  const [formCollapsed, setFormCollapsed] = useState(false);

  const conditions = [
    'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
    'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned',
    'Prone', 'Restrained', 'Stunned', 'Unconscious'
  ];

  const colorPresets = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Cyan', value: '#06b6d4' }
  ];

  const handleIncludeParked = (combatant: any) => {
    combatStateManager.includeParkedGroup(combatant);
    if (formRef.current) {
      setFormCollapsed(false); // Auto-expand
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleIncludePlayer = (player: any) => {
    combatStateManager.includePlayer(player);
    if (formRef.current) {
      setFormCollapsed(false); // Auto-expand
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Sword className="w-10 h-10 text-red-500" />
          <h1 className="text-4xl font-bold">Combat Tracker</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SavedPlayersPanel
            savedPlayers={combatStateManager.savedPlayers}
            onInclude={handleIncludePlayer}
            onRemove={combatStateManager.removePlayer}
          />

          <ParkedGroupsPanel
            parkedGroups={combatStateManager.state.parkedGroups}
            onInclude={handleIncludeParked}
            onRemove={combatStateManager.removeParkedGroup}
          />
        </div>

        <AddCombatantForm
          formRef={formRef}
          colorPresets={colorPresets}
          value={combatStateManager.state.newCombatant}
          fromParkedName={
            combatStateManager.state.parkedGroups.some(g => g.groupName === combatStateManager.state.newCombatant.groupName) 
              ? combatStateManager.state.newCombatant.groupName 
              : null
          }
          totalCount={combatStateManager.getTotalCombatantCount()}
          isCollapsed={formCollapsed}
          onToggleCollapse={setFormCollapsed}
          onChange={combatStateManager.updateNewCombatant}
          onSubmit={combatStateManager.addCombatant}
          onAddGroup={combatStateManager.addParkedGroup}
          onSaveAsPlayer={combatStateManager.addPlayerFromForm}
          onAddInitiativeGroup={combatStateManager.addInitiativeGroup}
          onRemoveInitiativeGroup={combatStateManager.removeInitiativeGroup}
          onUpdateInitiativeGroup={combatStateManager.updateInitiativeGroup}
        />


        {combatants.length > 0 && (
          <GroupsOverview groups={combatStateManager.getUniqueGroups() as GroupSummary[]} onRemoveGroup={combatStateManager.removeGroup} />
        )}

        {combatants.length > 0 && (
          <TurnControls round={combatStateManager.state.round} onPrev={combatStateManager.prevTurn} onNext={combatStateManager.nextTurn} />
        )}

        <CombatantsList
          combatants={combatants}
          currentTurn={combatStateManager.state.currentTurn}
          conditions={conditions}
          onRemove={combatStateManager.removeCombatant}
          onDeltaHp={combatStateManager.updateHP}
          onDeathSaves={combatStateManager.updateDeathSave}
          onToggleConcentration={combatStateManager.toggleConcentration}
          onToggleCondition={combatStateManager.toggleCondition}
        />

        {combatants.length === 0 && (
          <div className="text-center text-slate-400 py-12">
            <Sword className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No combatants yet. Add some to start the battle!</p>
          </div>
        )}

      </div>
    </div>
  );
}