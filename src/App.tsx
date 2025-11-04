import { useEffect, useState } from 'react'
import './App.css'
import SaveBar from './components/SaveBar'
import CombatTrackerPage from './pages/CombatTrackerPage'
import type { SavedCombat } from './types'
import CombatsPage from './pages/CombatsPage'
import { combatStore } from './persistence/combatStore'
import { useCombatState } from './state'

function App() {
  const [route, setRoute] = useState<string>(location.hash || '#combats');
  const [current, setCurrent] = useState<SavedCombat | undefined>(undefined);
  const combatStateManager = useCombatState(current?.data)

  useEffect(() => {
    const onHash = () => {
      setRoute(location.hash || '#combats');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const combatIdMatch = route.match(/^#play\/([a-zA-Z0-9]+)$/);
    if (combatIdMatch) {
      combatStore.get(combatIdMatch[1]).then(setCurrent as any);
    } else {
      setCurrent(undefined);
    } 
  }, [route]);

  const open = (id: string) => { location.hash = `#play/${id}`; };
  const back = () => { location.hash = '#combats'; };

  if (!route.startsWith('#play')) {
    return <CombatsPage onOpen={open} />;
  }

  if (!current) return <div className="p-6 text-white">Loading…</div>;

  return (
    <div>
      <SaveBar
        name={current.name}
        description={current.description}
        onChange={(patch) => setCurrent({ ...current, ...patch })}
        onBack={back}
        onSave={async () => {
          if (!current) return;
          await combatStore.update(current.id, { name: current.name, description: current.description, data: combatStateManager.state, updatedAt: Date.now() });
        }}
      />
      <CombatTrackerPage
        combatStateManager={combatStateManager}
      />
    </div>
  )
}

export default App
