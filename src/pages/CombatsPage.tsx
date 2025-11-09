import { useEffect, useState } from 'react';
import type { SavedCombat, CombatState } from '../types';
import LabeledTextInput from '../components/common/LabeledTextInput';
import { dataStore } from '../persistence/storage';
import { DEFAULT_NEW_COMBATANT } from '../constants';
import logo from '../assets/logo.png';

type Props = {
  onOpen: (id: string) => void;
};

export default function CombatsPage({ onOpen }: Props) {
  const [combats, setCombats] = useState<SavedCombat[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataStore.listCombat().then((c) => { setCombats(c); setLoading(false); });
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    const emptyState: CombatState = {
      combatants: [], currentTurn: 0, round: 1, parkedGroups: [],
      newCombatant: DEFAULT_NEW_COMBATANT,
    };

    const created = await dataStore.createCombat({ name: name.trim(), description: description.trim(), data: emptyState });
    setName('');
    setDescription('');
    setCombats(await dataStore.listCombat());
    onOpen(created.id);
  };

  const del = async (id: string) => {
    await dataStore.deleteCombat(id);
    setCombats(await dataStore.listCombat());
  };

  const rename = async (id: string, newName: string) => {
    await dataStore.updateCombat(id, { name: newName, updatedAt: Date.now() });
    setCombats(await dataStore.listCombat());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      create();
    }
  };

  if (loading) return <div className="p-6 text-slate-300">Loading…</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto text-white">
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        {/* Header Section with Logo and Inputs */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-[80px_1fr_1fr_auto] gap-4 items-end">
            {/* Logo */}
            <div className="flex justify-center md:justify-start">
              <img
                src={logo}
                alt="D&D Combat Tracker Logo"
                className="w-20 h-20 object-contain"
              />
            </div>

            {/* Name Input */}
            <LabeledTextInput
              id="newName"
              label="Name"
              value={name}
              placeholder="Goblin Ambush"
              onChange={setName}
              onKeyDown={handleKeyPress}
            />

            {/* Description Input */}
            <LabeledTextInput
              id="newDesc"
              label="Description"
              value={description}
              placeholder="Short note"
              onChange={setDescription}
              onKeyDown={handleKeyPress}
            />

            {/* Create Button */}
            <button
              onClick={create}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded transition font-semibold h-[42px] whitespace-nowrap"
            >
              Create
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700"></div>

        {/* Combat List Section */}
        <div className="p-6">
          {combats.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <p className="text-lg">No combats yet.</p>
              <p className="text-sm mt-2">Create your first combat encounter above!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {combats.map(c => (
                <li key={c.id} className="flex items-center justify-between bg-slate-900 rounded p-4 border border-slate-700 hover:border-slate-600 transition">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="font-semibold text-lg text-white truncate">{c.name}</div>
                    {c.description && (
                      <div className="text-sm text-slate-400 mt-1">{c.description}</div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => onOpen(c.id)}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition font-medium"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => rename(c.id, prompt('Rename combat', c.name) || c.name)}
                      className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded transition font-medium"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => del(c.id)}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}