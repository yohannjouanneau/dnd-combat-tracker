import { useState, useCallback } from 'react';
import type { CombatState, Combatant, NewCombatant, DeathSaves, GroupSummary } from './types';

export type CombatStateManager = {
    // State
    state: CombatState;
    
    // Parked Groups
    addParkedGroup: () => void;
    removeParkedGroup: (name: string) => void;
    includeParkedGroup: (combatant: NewCombatant) => void;
    
    // New Combatant Form
    updateNewCombatant: (patch: Partial<NewCombatant>) => void;
    
    // Combatants
    addCombatant: () => void;
    removeCombatant: (id: number) => void;
    removeGroup: (groupName: string) => void;
    updateHP: (id: number, change: number) => void;
    toggleCondition: (id: number, condition: string) => void;
    toggleConcentration: (id: number) => void;
    updateDeathSave: (id: number, type: keyof DeathSaves, value: number) => void;
    
    // Turn Management
    nextTurn: () => void;
    prevTurn: () => void;
    
    // Utility
    getUniqueGroups: () => GroupSummary[];
    loadState: (newState: CombatState) => void;
    resetState: () => void;
  };

const getInitialState = (): CombatState => ({
  combatants: [],
  currentTurn: 0,
  round: 1,
  parkedGroups: [],
  newCombatant: {
    groupName: '',
    initiative: '',
    hp: '',
    maxHp: '',
    ac: '',
    count: '1',
    color: '#3b82f6'
  }
});

export function useCombatState(initialState?: CombatState): CombatStateManager {
  const [state, setState] = useState<CombatState>(initialState || getInitialState());

  // Parked Groups Management
  const addParkedGroup = useCallback(() => {
    setState(prev => {
      if (!prev.newCombatant.groupName || !prev.newCombatant.initiative || !prev.newCombatant.hp) {
        return prev;
      }
      
      return {
        ...prev,
        parkedGroups: [...prev.parkedGroups, { ...prev.newCombatant }],
        newCombatant: {
          groupName: '',
          initiative: '',
          hp: '',
          maxHp: '',
          ac: '',
          count: '1',
          color: '#3b82f6'
        }
      };
    });
  }, []);

  const removeParkedGroup = useCallback((name: string) => {
    setState(prev => ({
      ...prev,
      parkedGroups: prev.parkedGroups.filter(g => g.groupName !== name)
    }));
  }, []);

  const includeParkedGroup = useCallback((combatant: NewCombatant) => {
    setState(prev => ({
      ...prev,
      newCombatant: combatant
    }));
  }, []);

  // New Combatant Form Management
  const updateNewCombatant = useCallback((patch: Partial<NewCombatant>) => {
    setState(prev => ({
      ...prev,
      newCombatant: { ...prev.newCombatant, ...patch }
    }));
  }, []);

  // Combatant Management
  const addCombatant = useCallback(() => {
    setState(prev => {
      const nc = prev.newCombatant;
      if (!nc.groupName || !nc.initiative || !nc.hp) return prev;

      const count = parseInt(nc.count) || 1;
      const baseId = Date.now();

      const newCombatants = Array.from({ length: count }, (_, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C, etc.
        return {
          id: baseId + index,
          name: nc.groupName,
          displayName: count > 1 ? `${nc.groupName} ${letter}` : nc.groupName,
          initiative: parseFloat(nc.initiative),
          hp: parseInt(nc.hp),
          maxHp: parseInt(nc.maxHp || nc.hp),
          ac: nc.ac ? parseInt(nc.ac) : 10,
          conditions: [],
          concentration: false,
          deathSaves: { successes: 0, failures: 0 },
          groupName: nc.groupName,
          color: nc.color,
          groupIndex: index
        } as Combatant;
      });

      const updated = [...prev.combatants, ...newCombatants].sort((a, b) => {
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
        // Same initiative: sort by group, then by index within group
        if (a.groupName !== b.groupName) {
          return a.groupName.localeCompare(b.groupName);
        }
        return a.groupIndex - b.groupIndex;
      });

      return {
        ...prev,
        combatants: updated,
        newCombatant: {
          groupName: '',
          initiative: '',
          hp: '',
          maxHp: '',
          ac: '',
          count: '1',
          color: '#3b82f6'
        }
      };
    });
  }, []);

  const removeCombatant = useCallback((id: number) => {
    setState(prev => {
      const newCombatants = prev.combatants.filter(c => c.id !== id);
      let newTurn = prev.currentTurn;
      if (newTurn >= prev.combatants.length - 1) {
        newTurn = Math.max(0, prev.combatants.length - 2);
      }
      return {
        ...prev,
        combatants: newCombatants,
        currentTurn: newTurn
      };
    });
  }, []);

  const removeGroup = useCallback((groupName: string) => {
    setState(prev => ({
      ...prev,
      combatants: prev.combatants.filter(c => c.groupName !== groupName),
      currentTurn: 0
    }));
  }, []);

  const updateHP = useCallback((id: number, change: number) => {
    setState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => {
        if (c.id === id) {
          const newHp = Math.max(0, Math.min(c.maxHp, c.hp + change));
          return { ...c, hp: newHp };
        }
        return c;
      })
    }));
  }, []);

  const toggleCondition = useCallback((id: number, condition: string) => {
    setState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => {
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
      })
    }));
  }, []);

  const toggleConcentration = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c =>
        c.id === id ? { ...c, concentration: !c.concentration } : c
      )
    }));
  }, []);

  const updateDeathSave = useCallback((id: number, type: keyof DeathSaves, value: number) => {
    setState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => {
        if (c.id === id) {
          return {
            ...c,
            deathSaves: { ...c.deathSaves, [type]: Math.max(0, Math.min(3, value)) }
          };
        }
        return c;
      })
    }));
  }, []);

  // Turn Management
  const nextTurn = useCallback(() => {
    setState(prev => {
      if (prev.combatants.length === 0) return prev;
      const next = (prev.currentTurn + 1) % prev.combatants.length;
      return {
        ...prev,
        currentTurn: next,
        round: next === 0 ? prev.round + 1 : prev.round
      };
    });
  }, []);

  const prevTurn = useCallback(() => {
    setState(prev => {
      if (prev.combatants.length === 0) return prev;
      const prev_turn = prev.currentTurn === 0 ? prev.combatants.length - 1 : prev.currentTurn - 1;
      return {
        ...prev,
        currentTurn: prev_turn,
        round: prev_turn === prev.combatants.length - 1 ? Math.max(1, prev.round - 1) : prev.round
      };
    });
  }, []);

  // Utility
  const getUniqueGroups = useCallback(() => {
    const groups = new Map();
    state.combatants.forEach(c => {
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
  }, [state.combatants]);

  const loadState = useCallback((newState: CombatState) => {
    setState(newState);
  }, []);

  const resetState = useCallback(() => {
    setState(getInitialState());
  }, []);

  return {
    // State
    state,
    
    // Parked Groups
    addParkedGroup,
    removeParkedGroup,
    includeParkedGroup,
    
    // New Combatant Form
    updateNewCombatant,
    
    // Combatants
    addCombatant,
    removeCombatant,
    removeGroup,
    updateHP,
    toggleCondition,
    toggleConcentration,
    updateDeathSave,
    
    // Turn Management
    nextTurn,
    prevTurn,
    
    // Utility
    getUniqueGroups,
    loadState,
    resetState
  };
}