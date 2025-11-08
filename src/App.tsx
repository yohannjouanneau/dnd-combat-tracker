import { useEffect, useState } from 'react'
import './App.css'
import SaveBar from './components/SaveBar'
import CombatTrackerPage from './pages/CombatTrackerPage'
import CombatsPage from './pages/CombatsPage'
import { useCombatState } from './state'

function App() {
  const [route, setRoute] = useState<string>(location.hash || '#combats');
  const combatStateManager = useCombatState()

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
      combatStateManager.loadCombat(combatIdMatch[1])
    }
  }, [route, combatStateManager]);

  const open = (id: string) => { location.hash = `#play/${id}`; };
  const back = () => { location.hash = '#combats'; };

  if (!route.startsWith('#play')) {
    return <CombatsPage onOpen={open} />;
  }

  if (!combatStateManager.state) return <div className="p-6 text-white">Loading…</div>;

  return (
    <div>
      <SaveBar
        name={combatStateManager.state.combatName ?? ''}
        description={combatStateManager.state.combatDescription ?? ''}
        onChange={(patch) => combatStateManager.updateCombat(patch.name ?? '', patch.description ?? '')}
        onBack={back}
        onSave={async () => {
          if (!combatStateManager.state) return;
          await combatStateManager.saveCombat({ name: combatStateManager.state.combatName, description: combatStateManager.state.combatDescription, data: combatStateManager.state, updatedAt: Date.now() });
        }}
      />
      <CombatTrackerPage
        combatStateManager={combatStateManager}
      />
    </div>
  )
}

export default App
