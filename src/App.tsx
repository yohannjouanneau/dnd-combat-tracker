import { useEffect, useState } from "react";
import "./App.css";
import CombatTrackerPage from "./pages/CombatTrackerPage";
import CombatsPage from "./pages/CombatsPage";
import { useCombatState } from "./state";

function App() {
  const [route, setRoute] = useState<string>(location.hash || "#combats");
  const [isLoading, setIsLoading] = useState(false);
  const combatStateManager = useCombatState();

  useEffect(() => {
    const onHash = () => {
      setRoute(location.hash || "#combats");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const combatIdMatch = route.match(/^#play\/([a-zA-Z0-9]+)$/);
    if (combatIdMatch) {
      const newCombatId = combatIdMatch[1];
      
      // Only load if it's a different combat or no combat is loaded
      if (newCombatId !== combatStateManager.state.combatId) {
        setIsLoading(true);
        combatStateManager.loadCombat(newCombatId).finally(() => {
          setIsLoading(false);
        });
      }
    } else {
      // Reset state when navigating back to combat list
      if (combatStateManager.state.combatId) {
        combatStateManager.resetState();
      }
    }
  }, [combatStateManager, route]);

  const open = (id: string) => {
    location.hash = `#play/${id}`;
  };

  if (!route.startsWith("#play")) {
    return (
      <CombatsPage onOpen={open} combatStateManager={combatStateManager} />
    );
  }

  if (isLoading) {
    return <div className="p-6 text-white">Loading combat…</div>;
  }

  return (
    <div>
      <CombatTrackerPage combatStateManager={combatStateManager} />
    </div>
  );
}

export default App;
