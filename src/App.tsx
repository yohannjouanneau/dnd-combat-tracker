import { useEffect, useState } from "react";
import "./App.css";
import CombatTrackerPage from "./pages/CombatTrackerPage";
import CombatsPage from "./pages/CombatsPage";
import CampaignListPage from "./pages/CampaignListPage";
import CampaignDetailPage from "./pages/CampaignDetailPage";
import LandingPage from "./pages/LandingPage";
import { useCombatState } from "./store/state";

function App() {
  const [route, setRoute] = useState<string>(location.hash || "");
  const [isLoading, setIsLoading] = useState(false);
  const [combatReturnHash, setCombatReturnHash] = useState<string>("#combats");
  const combatStateManager = useCombatState();

  useEffect(() => {
    const onHash = () => {
      setRoute(location.hash || "");
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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (combatStateManager.hasChanges && combatStateManager.state?.combatId) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [combatStateManager.hasChanges, combatStateManager.state?.combatId]);

  const openCombat = (id: string, returnHash = "#combats") => {
    setCombatReturnHash(returnHash);
    location.hash = `#play/${id}`;
  };

  const openCampaign = (id: string) => {
    location.hash = `#campaigns/${id}`;
  };

  // Campaign detail page
  const campaignDetailMatch = route.match(/^#campaigns\/([a-zA-Z0-9]+)$/);
  if (campaignDetailMatch) {
    return (
      <CampaignDetailPage
        campaignId={campaignDetailMatch[1]}
        combatStateManager={combatStateManager}
        onBack={() => {
          location.hash = "#campaigns";
        }}
        onOpenCombat={(combatId) =>
          openCombat(combatId, `#campaigns/${campaignDetailMatch[1]}`)
        }
      />
    );
  }

  // Campaigns list page
  if (route === "#campaigns") {
    return (
      <CampaignListPage
        onOpen={openCampaign}
        onBackToCombats={() => {
          location.hash = "";
        }}
        combatStateManager={combatStateManager}
      />
    );
  }

  // Combat tracker
  if (route.startsWith("#play")) {
    if (isLoading) {
      return <div className="p-6 text-white">Loading combat…</div>;
    }
    return (
      <div>
        <CombatTrackerPage
          combatStateManager={combatStateManager}
          returnHash={combatReturnHash}
        />
      </div>
    );
  }

  // Combats list
  if (route === "#combats") {
    return (
      <CombatsPage
        onOpen={openCombat}
        onBack={() => {
          location.hash = "";
        }}
        combatStateManager={combatStateManager}
      />
    );
  }

  // Default: landing page
  return (
    <LandingPage
      onOpenCombats={() => {
        location.hash = "#combats";
      }}
      onOpenCampaigns={() => {
        location.hash = "#campaigns";
      }}
      onOpenCombat={openCombat}
      onOpenCampaign={openCampaign}
      syncApi={combatStateManager.syncApi}
      combatStateManager={combatStateManager}
    />
  );
}

export default App;
