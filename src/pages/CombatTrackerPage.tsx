import { useCallback, useRef, useState } from 'react';
import type { Combatant, DeathSaves, NewCombatant, CombatState } from '../types';
import { Sword } from 'lucide-react';
import ParkedGroupsPanel from '../components/ParkedGroups/ParkedGroupsPanel';
import AddCombatantForm from '../components/CombatForm/AddCombatantForm';
import GroupsOverview from '../components/GroupsOverview/GroupsOverview';
import TurnControls from '../components/TurnControls/TurnControls';
import CombatantsList from '../components/CombatantsList/CombatantsList';
import type { GroupSummary } from '../types';

type Props = {
  initialState?: CombatState;
};

export default function CombatTrackerPage({ initialState }: Props) {
  const [combatants, setCombatants] = useState<Combatant[]>(initialState?.combatants ?? []);
  const [currentTurn, setCurrentTurn] = useState<number>(initialState?.currentTurn ?? 0);
  const [round, setRound] = useState<number>(initialState?.round ?? 1);
  const [newCombatant, setNewCombatant] = useState<NewCombatant>(initialState?.newCombatant ?? {
    groupName: '',
    initiative: '',
    hp: '',
    maxHp: '',
    ac: '',
    count: '1',
    color: '#3b82f6'
  });
  const [parkedGroups, setParkedGroups] = useState<NewCombatant[]>(initialState?.parkedGroups ?? []);
  const formRef = useRef<HTMLDivElement>(null);
  console.log('DEBUG ==> CombatTrackerPage initialState:', initialState);

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

  const addParkedGroup = useCallback(() => {
    if (newCombatant.groupName && newCombatant.initiative && newCombatant.hp) {
      setParkedGroups([...parkedGroups, {...newCombatant}]);
      setNewCombatant({ 
        groupName: '',
        initiative: '', 
        hp: '', 
        maxHp: '', 
        ac: '', 
        count: '1',
        color: '#3b82f6'
      });
    }
  }, [ newCombatant]);
  
  const removeParkedGroup = useCallback((name: string) => {
    setParkedGroups(parkedGroups.filter(g => g.groupName !== name));
  }, [parkedGroups]);
  
  const includeParkedGroup = useCallback((combatant: NewCombatant) => {
    setNewCombatant(combatant);
    // Focus/scroll to the form so the initiative can be edited before adding
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [newCombatant]);
  
  const addCombatant = useCallback(() => {
    if (newCombatant.groupName && newCombatant.initiative && newCombatant.hp) {
      const count = parseInt(newCombatant.count) || 1;
      const baseId = Date.now();
      
      const newCombatants = Array.from({ length: count }, (_, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C, etc.
        return {
          id: baseId + index,
          name: newCombatant.groupName,
          displayName: count > 1 ? `${newCombatant.groupName} ${letter}` : newCombatant.groupName,
          initiative: parseFloat(newCombatant.initiative),
          hp: parseInt(newCombatant.hp),
          maxHp: parseInt(newCombatant.maxHp || newCombatant.hp),
          ac: newCombatant.ac ? parseInt(newCombatant.ac) : 10,
          conditions: [],
          concentration: false,
          deathSaves: { successes: 0, failures: 0 },
          groupName: newCombatant.groupName,
          color: newCombatant.color,
          groupIndex: index
        } as Combatant;
      });
      
      const updated = [...combatants, ...newCombatants].sort((a, b) => {
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
        // Same initiative: sort by group, then by index within group
        if (a.groupName !== b.groupName) {
          return a.groupName.localeCompare(b.groupName);
        }
        return a.groupIndex - b.groupIndex;
      });
      
      setCombatants(updated);
      setNewCombatant({ 
        groupName: '',
        initiative: '', 
        hp: '', 
        maxHp: '', 
        ac: '', 
        count: '1',
        color: '#3b82f6'
      });
    }
  }, [newCombatant, combatants]);
  
  const removeCombatant = useCallback((id: number) => {
    setCombatants(combatants.filter(c => c.id !== id));
    if (currentTurn >= combatants.length - 1) {
      setCurrentTurn(Math.max(0, combatants.length - 2));
    }
  }, [combatants, currentTurn]);
  
  const removeGroup = useCallback((groupName: string) => {
    setCombatants(combatants.filter(c => c.groupName !== groupName));
    setCurrentTurn(0);
  }, [combatants]);
  
  const updateHP = useCallback((id: number, change: number) => {
    setCombatants(combatants.map(c => {
      if (c.id === id) {
        const newHp = Math.max(0, Math.min(c.maxHp, c.hp + change));
        return { ...c, hp: newHp };
      }
      return c;
    }));
  }, [combatants]);
  
  const toggleCondition = useCallback((id: number, condition: string) => {
    setCombatants(combatants.map(c => {
      if (c.id === id) {
        const hasCondition = c.conditions.includes(condition);
        return {
          ...c,
          conditions: hasCondition
            ? c.conditions.filter(cond => cond !== condition)
            : [...c.conditions, condition]
        };
      }
      return c;
    }));
  }, [combatants]);
  
  const toggleConcentration = useCallback((id: number) => {
    setCombatants(combatants.map(c => 
      c.id === id ? { ...c, concentration: !c.concentration } : c
    ));
  }, [combatants]);
  
  const updateDeathSave = useCallback((id: number, type: keyof DeathSaves, value: number) => {
    setCombatants(combatants.map(c => {
      if (c.id === id) {
        return {
          ...c,
          deathSaves: { ...c.deathSaves, [type]: Math.max(0, Math.min(3, value)) }
        };
      }
      return c;
    }));
  }, [combatants]);
  
  const nextTurn = useCallback(() => {
    if (combatants.length === 0) return;
    const next = (currentTurn + 1) % combatants.length;
    setCurrentTurn(next);
    if (next === 0) {
      setRound(round + 1);
    }
  }, [combatants.length, currentTurn, round]);
  
  const prevTurn = useCallback(() => {
    if (combatants.length === 0) return;
    const prev = currentTurn === 0 ? combatants.length - 1 : currentTurn - 1;
    setCurrentTurn(prev);
    if (prev === combatants.length - 1) {
      setRound(Math.max(1, round - 1));
    }
  }, [combatants.length, currentTurn, round]);
  
  // Get unique groups for display
  const getUniqueGroups = useCallback(() => {
    const groups = new Map();
    combatants.forEach(c => {
      if (!groups.has(c.groupName)) {
        groups.set(c.groupName, {
          name: c.groupName,
          color: c.color,
          count: 1
        });
      } else {
        groups.get(c.groupName).count++;
      }
    });
    return Array.from(groups.values());
  }, [combatants]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Sword className="w-10 h-10 text-red-500" />
          <h1 className="text-4xl font-bold">Combat Tracker</h1>
        </div>

        <ParkedGroupsPanel
          parkedGroups={parkedGroups}
          onInclude={includeParkedGroup}
          onRemove={removeParkedGroup}
        />

        <AddCombatantForm
          formRef={formRef}
          colorPresets={colorPresets}
          value={newCombatant}
          fromParkedName={parkedGroups.some(g => g.groupName === newCombatant.groupName) ? newCombatant.groupName : null}
          onChange={(patch) => {
            setNewCombatant({ ...newCombatant, ...patch })
            console.log('DEBUG ==> updated new combatant ', newCombatant);
            
          }}
          onSubmit={addCombatant}
          onAddGroup={addParkedGroup}
        />

        {combatants.length > 0 && (
          <GroupsOverview groups={getUniqueGroups() as GroupSummary[]} onRemoveGroup={removeGroup} />
        )}

        {combatants.length > 0 && (
          <TurnControls round={round} onPrev={prevTurn} onNext={nextTurn} />
        )}

        <CombatantsList
          combatants={combatants}
          currentTurn={currentTurn}
          conditions={conditions}
          onRemove={removeCombatant}
          onDeltaHp={updateHP}
          onDeathSaves={updateDeathSave}
          onToggleConcentration={toggleConcentration}
          onToggleCondition={toggleCondition}
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