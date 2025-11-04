import { useEffect, useState } from 'react'
import './App.css'
import SaveBar from './components/SaveBar'
import CombatTrackerPage from './pages/CombatTrackerPage'
import type { SavedCombat } from './types'
import CombatsPage from './pages/CombatsPage'
import { combatStore } from './persistence/combatStore'

function App() {
  const [route, setRoute] = useState<string>(location.hash || '#combats');
  const [current, setCurrent] = useState<SavedCombat | null>(null);

  useEffect(() => {
    const onHash = () => {
      console.log('DEBUG ==> location.hash:', location.hash); 
      setRoute(location.hash || '#combats');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const combatIdMatch = route.match(/^#play\/([a-zA-Z0-9]+)$/);
    if (combatIdMatch) {
      console.log('DEBUG ==> combatIdMatch:', combatIdMatch);
      combatStore.get(combatIdMatch[1]).then(setCurrent as any);
    } else {
      console.log('DEBUG ==> no combatIdMatch, setting current to null');
      setCurrent(null);
    } 
    console.log('DEBUG ==> current:', route);
  }, [route]);

  const open = (id: string) => { location.hash = `#play/${id}`; };
  const back = () => { location.hash = '#combats'; };

  if (!route.startsWith('#play')) {
    console.log('DEBUG ==> route does not start with #play, showing CombatsPage');
    return <CombatsPage onOpen={open} />;
  }

  if (!current) return <div className="p-6 text-white">Loading…</div>;
  console.log('DEBUG ==> current:', current);

  return (
    <div>
      <SaveBar
        name={current.name}
        description={current.description}
        onChange={(patch) => setCurrent({ ...current, ...patch })}
        onBack={back}
        onSave={async () => {
          if (!current) return;
          await combatStore.update(current.id, { name: current.name, description: current.description, data: current.data, updatedAt: Date.now() });
        }}
      />
      <CombatTrackerPage
        initialState={current.data}
      />
    </div>
  )
}

export default App
