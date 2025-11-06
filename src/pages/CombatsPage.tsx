import { useEffect, useState } from 'react';
import type { SavedCombat, CombatState } from '../types';
import LabeledTextInput from '../components/common/LabeledTextInput';
import { dataStore } from '../persistence/storage';
import { DEFAULT_NEW_COMBATANT } from '../constants';

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
    
    const created = await dataStore.createCombat({ name: name.trim(), description: description.trim(), data: emptyState, createdAt: Date.now(), updatedAt: Date.now(), id: '' } as any);
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

  if (loading) return <div className="p-6 text-slate-300">Loading…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-4">Saved Combats</h1>
      <div className="bg-slate-800 rounded p-4 border border-slate-700 mb-6">
        <h2 className="text-xl font-semibold mb-3">Create New</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledTextInput id="newName" label="Name" value={name} placeholder="Goblin Ambush" onChange={setName} />
          <LabeledTextInput id="newDesc" label="Description" value={description} placeholder="Short note" onChange={setDescription} />
        </div>
        <button onClick={create} className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">Create</button>
      </div>

      <div className="bg-slate-800 rounded p-4 border border-slate-700">
        <h2 className="text-xl font-semibold mb-3">Your Combats</h2>
        {combats.length === 0 ? (
          <div className="text-slate-300">No combats yet.</div>
        ) : (
          <ul className="space-y-3">
            {combats.map(c => (
              <li key={c.id} className="flex items-center justify-between bg-slate-900 rounded p-3 border border-slate-700">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-slate-400">{c.description}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onOpen(c.id)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded">Open</button>
                  <button onClick={() => rename(c.id, prompt('Rename combat', c.name) || c.name)} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded">Rename</button>
                  <button onClick={() => del(c.id)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


