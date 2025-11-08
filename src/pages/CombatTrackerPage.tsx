import { useRef, useState, useEffect } from 'react';
import { Sword } from 'lucide-react';
import ParkedGroupsPanel from '../components/ParkedGroups/ParkedGroupsPanel';
import AddCombatantForm from '../components/CombatForm/AddCombatantForm';
import GroupsOverview from '../components/GroupsOverview/GroupsOverview';
import TurnControls from '../components/TurnControls/TurnControls';
import CombatantsList from '../components/CombatantsList/CombatantsList';
import type { GroupSummary, NewCombatant, SavedPlayer } from '../types';
import type { CombatStateManager } from '../state';
import SavedPlayersPanel from '../components/CombatForm/SavedPlayerPanel';

type Props = {
  combatStateManager: CombatStateManager;
};

export default function CombatTrackerPage({ combatStateManager }: Props) {
  const formRef = useRef<HTMLDivElement>(null);
  const combatListRef = useRef<HTMLDivElement>(null);
  const combatants = combatStateManager.state.combatants;
  const [formCollapsed, setFormCollapsed] = useState(false);

  // Keyboard shortcuts for turn navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Only handle arrow keys if there are combatants
      if (combatants.length === 0) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        combatStateManager.nextTurn();
      } else if (event.key === 'ArrowLeft') {
        // Block previous turn if on first combatant of round 1
        const isAtStart = combatStateManager.state.round === 1 && combatStateManager.state.currentTurn === 0;
        if (!isAtStart) {
          event.preventDefault();
          combatStateManager.prevTurn();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combatants.length, combatStateManager]);

  const handleIncludeParked = (combatant: NewCombatant) => {
    combatStateManager.includeParkedGroup(combatant);
    if (formRef.current) {
      setFormCollapsed(false); // Auto-expand
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const includeToFight = (combatant: NewCombatant) => {
    combatStateManager.addCombatant(combatant);
    if (combatListRef.current) {
      combatListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const includePlayerToForm = (player: SavedPlayer) => {
    combatStateManager.includePlayer(player);
    if (formRef.current) {
      setFormCollapsed(false); // Auto-expand
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const includePlayerToFight = (player: SavedPlayer) => {
    const playerCombattant: NewCombatant = {
      groupName: player.groupName,
      initiativeGroups: player.initiativeGroups,
      hp: player.hp,
      maxHp: player.maxHp,
      ac: player.ac,
      color: player.color,
      imageUrl: player.imageUrl,
      initBonus: player.initBonus
    }
    combatStateManager.addCombatant(playerCombattant);
    if (combatListRef.current) {
      combatListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const stagedFromParkedGroups = combatStateManager.state.parkedGroups.find(group => group.groupName === combatStateManager.state.newCombatant.groupName)?.groupName
  const stagedPlayer = combatStateManager.savedPlayers.find(group => group.groupName === combatStateManager.state.newCombatant.groupName)?.groupName
  const stagedFrom = stagedFromParkedGroups ?? stagedPlayer

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
            onInclude={includePlayerToForm}
            onFight={includePlayerToFight}
            onRemove={combatStateManager.removePlayer}
          />

          <ParkedGroupsPanel
            parkedGroups={combatStateManager.state.parkedGroups}
            onInclude={handleIncludeParked}
            onFight={includeToFight}
            onRemove={combatStateManager.removeParkedGroup}
          />
        </div>

        <AddCombatantForm
          formRef={formRef}
          value={combatStateManager.state.newCombatant}
          stagedFrom={stagedFrom}
          totalCount={combatStateManager.getTotalCombatantCount()}
          isCollapsed={formCollapsed}
          onToggleCollapse={setFormCollapsed}
          onChange={combatStateManager.updateNewCombatant}
          onSubmit={() => { combatStateManager.addCombatant() }}
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
          <TurnControls
            round={combatStateManager.state.round}
            currentTurn={combatStateManager.state.currentTurn}
            onPrev={combatStateManager.prevTurn}
            onNext={combatStateManager.nextTurn}
          />
        )}

        <CombatantsList
          combatListRef={combatListRef}
          combatants={combatants}
          currentTurn={combatStateManager.state.currentTurn}
          onRemove={combatStateManager.removeCombatant}
          onDeltaHp={combatStateManager.updateHP}
          onDeathSaves={combatStateManager.updateDeathSave}
          onToggleConcentration={combatStateManager.toggleConcentration}
          onToggleCondition={combatStateManager.toggleCondition}
        />

        {combatants.length === 0 && (
          <div className="text-center text-slate-400 py-12">
            <Sword className="text-lime-400 w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No combatants yet. Add some to start the battle!</p>
          </div>
        )}

      </div>
    </div>
  );
}