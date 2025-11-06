import type { NewCombatant } from "./types";

export const DEFAULT_NEW_COMBATANT: NewCombatant = {
    groupName: '',
    initiativeGroups: [{ id: crypto.randomUUID(), initiative: '', count: '1' }],
    hp: '',
    maxHp: '',
    ac: '',
    color: '#3b82f6',
    imageUrl: ''
  }

  export const DEFAULT_CONDITIONS = [
    'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
    'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned',
    'Prone', 'Restrained', 'Stunned', 'Unconscious'
  ];

  export const DEFAULT_COLOR_PRESET = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Cyan', value: '#06b6d4' }
  ];