import { useState, useCallback } from 'react';
import type { CombatState, Combatant, NewCombatant, DeathSaves, GroupSummary, InitiativeGroup } from './types';

export type CombatStateManager = {
  // State
  state: CombatState;
  
  // Parked Groups
  addParkedGroup: () => void;
  removeParkedGroup: (name: string) => void;
  includeParkedGroup: (combatant: NewCombatant) => void;
  
  // New Combatant Form
  updateNewCombatant: (patch: Partial<NewCombatant>) => void;
  
  // Initiative Groups
  addInitiativeGroup: () => void;
  removeInitiativeGroup: (id: string) => void;
  updateInitiativeGroup: (id: string, patch: Partial<InitiativeGroup>) => void;
  
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
  getTotalCombatantCount: () => number;
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
    initiativeGroups: [{ id: crypto.randomUUID(), initiative: '', count: '1' }],
    hp: '',
    maxHp: '',
    ac: '',
    color: '#3b82f6'
  }
});

export function useCombatState(initialState?: CombatState): CombatStateManager {
  const [state, setState] = useState<CombatState>(initialState || getInitialState());

  // Parked Groups Management
  const addParkedGroup = useCallback(() => {
    setState(prev => {
      if (!prev.newCombatant.groupName || !prev.newCombatant.hp) return prev;
      if (prev.newCombatant.initiativeGroups.length === 0) return prev;
      if (prev.newCombatant.initiativeGroups.some(g => !g.initiative)) return prev;
      
      return {
        ...prev,
        parkedGroups: [...prev.parkedGroups, { ...prev.newCombatant }],
        newCombatant: {
          groupName: '',
          initiativeGroups: [{ id: crypto.randomUUID(), initiative: '', count: '1' }],
          hp: '',
          maxHp: '',
          ac: '',
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

  // Initiative Groups Management
  const addInitiativeGroup = useCallback(() => {
    setState(prev => ({
      ...prev,
      newCombatant: {
        ...prev.newCombatant,
        initiativeGroups: [
          ...prev.newCombatant.initiativeGroups,
          { id: crypto.randomUUID(), initiative: '', count: '1' }
        ]
      }
    }));
  }, []);

  const removeInitiativeGroup = useCallback((id: string) => {
    setState(prev => {
      const filtered = prev.newCombatant.initiativeGroups.filter(g => g.id !== id);
      // Keep at least one group
      if (filtered.length === 0) return prev;
      
      return {
        ...prev,
        newCombatant: {
          ...prev.newCombatant,
          initiativeGroups: filtered
        }
      };
    });
  }, []);

  const updateInitiativeGroup = useCallback((id: string, patch: Partial<InitiativeGroup>) => {
    setState(prev => ({
      ...prev,
      newCombatant: {
        ...prev.newCombatant,
        initiativeGroups: prev.newCombatant.initiativeGroups.map(g =>
          g.id === id ? { ...g, ...patch } : g
        )
      }
    }));
  }, []);

  // Combatant Management
  const addCombatant = useCallback(() => {
    setState(prev => {
      const nc = prev.newCombatant;
      if (!nc.groupName || !nc.hp) return prev;
      if (nc.initiativeGroups.length === 0) return prev;
      if (nc.initiativeGroups.some(g => !g.initiative)) return prev;

      // Calculate total count across all initiative groups
      const totalCount = nc.initiativeGroups.reduce((sum, g) => sum + (parseInt(g.count) || 0), 0);
      if (totalCount === 0) return prev;

      const baseId = Date.now();
      let globalLetterIndex = 0;
      const newCombatants: Combatant[] = [];

      // Create combatants for each initiative group
      nc.initiativeGroups.forEach(group => {
        const count = parseInt(group.count) || 0;
        for (let i = 0; i < count; i++) {
          const letter = String.fromCharCode(65 + globalLetterIndex);
          newCombatants.push({
            id: baseId + globalLetterIndex,
            name: nc.groupName,
            displayName: totalCount > 1 ? `${nc.groupName} ${letter}` : nc.groupName,
            initiative: parseFloat(group.initiative),
            hp: parseInt(nc.hp),
            maxHp: parseInt(nc.maxHp || nc.hp),
            ac: nc.ac ? parseInt(nc.ac) : 10,
            conditions: [],
            concentration: false,
            deathSaves: { successes: 0, failures: 0 },
            groupName: nc.groupName,
            color: nc.color,
            groupIndex: globalLetterIndex
          });
          globalLetterIndex++;
        }
      });

      // Merge and sort all combatants
      const updated = [...prev.combatants, ...newCombatants].sort((a, b) => {
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
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
          initiativeGroups: [{ id: crypto.randomUUID(), initiative: '', count: '1' }],
          hp: '',
          maxHp: '',
          ac: '',
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

  const getTotalCombatantCount = useCallback(() => {
    return state.newCombatant.initiativeGroups.reduce((sum, g) => {
      return sum + (parseInt(g.count) || 0);
    }, 0);
  }, [state.newCombatant.initiativeGroups]);

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
    
    // Initiative Groups
    addInitiativeGroup,
    removeInitiativeGroup,
    updateInitiativeGroup,
    
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
    getTotalCombatantCount,
    loadState,
    resetState
  };
}