import { useEffect, useState } from 'react';
import type { SavedCombat, CombatState } from '../types';
import LabeledTextInput from '../components/common/LabeledTextInput';
import { dataStore } from '../persistence/storage';
import { DEFAULT_NEW_COMBATANT } from '../constants';
import logo from '../assets/logo.png';
import { Plus, FolderOpen, Edit, Trash2 } from 'lucide-react';

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
    <div className="mx-auto text-white">
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        {/* Header Section with Logo and Inputs */}
        <div className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Logo - centered on mobile */}
            <div className="flex justify-center md:justify-start">
              <img
                src={logo}
                alt="D&D Combat Tracker Logo"
                className="w-16 h-16 md:w-20 md:h-20 object-contain"
              />
            </div>

            {/* Form inputs */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <div className="flex-1">
                <LabeledTextInput
                  id="newName"
                  label="Name"
                  value={name}
                  placeholder="Goblin Ambush"
                  onChange={setName}
                  onKeyDown={handleKeyPress}
                />
              </div>

              <div className="flex-1">
                <LabeledTextInput
                  id="newDesc"
                  label="Description"
                  value={description}
                  placeholder="Short note"
                  onChange={setDescription}
                  onKeyDown={handleKeyPress}
                />
              </div>

              {/* Create Button */}
              <div className="md:flex md:items-end">
                <button
                  onClick={create}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 px-6 py-3 md:py-2 rounded transition font-semibold h-[42px] whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700"></div>

        {/* Combat List Section */}
        <div className="p-4 md:p-6">
          {combats.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <FolderOpen className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" />
              <p className="text-base md:text-lg">No combats yet.</p>
              <p className="text-xs md:text-sm mt-2">Create your first combat encounter above!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {combats.map(c => (
                <li key={c.id} className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 rounded p-3 md:p-4 border border-slate-700 hover:border-slate-600 transition gap-3">
                  <div className="flex-1 min-w-0 md:mr-4">
                    <div className="font-semibold text-base md:text-lg text-white truncate">{c.name}</div>
                    {c.description && (
                      <div className="text-xs md:text-sm text-slate-400 mt-1 line-clamp-2">{c.description}</div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 md:flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => onOpen(c.id)}
                      className="bg-green-600 hover:bg-green-700 px-3 md:px-4 py-2 rounded transition font-medium text-sm flex items-center justify-center gap-1"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span className="hidden sm:inline">Open</span>
                    </button>
                    <button
                      onClick={() => rename(c.id, prompt('Rename combat', c.name) || c.name)}
                      className="bg-slate-700 hover:bg-slate-600 px-3 md:px-4 py-2 rounded transition font-medium text-sm flex items-center justify-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Rename</span>
                    </button>
                    <button
                      onClick={() => del(c.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 md:px-4 py-2 rounded transition font-medium text-sm flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
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