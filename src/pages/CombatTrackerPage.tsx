import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sword } from "lucide-react";
import ParkedGroupsPanel from "../components/ParkedGroups/ParkedGroupsPanel";
import AddCombatantForm from "../components/CombatForm/AddCombatantForm";
import GroupsOverview from "../components/GroupsOverview/GroupsOverview";
import TurnControls from "../components/TurnControls/TurnControls";
import CombatantsList from "../components/CombatantsList/CombatantsList";
import type {
  GroupSummary,
  SavedPlayer,
  NewCombatant,
  PlayerCombatant,
} from "../types";
import type { CombatStateManager } from "../state";
import SavedPlayersPanel from "../components/CombatForm/SavedPlayerPanel";
import logo from "../assets/logo.png";
import SaveBar from "../components/SaveBar";
import { HP_BAR_ID_PREFIX } from "../constants";
import MonsterLibraryModal from "../components/MonsterLibrary/MonsterLibraryModal";

type Props = {
  combatStateManager: CombatStateManager;
};

export default function CombatTrackerPage({ combatStateManager }: Props) {
  const { t } = useTranslation("combat");
  const formRef = useRef<HTMLDivElement>(null);
  const combatListRef = useRef<HTMLDivElement>(null);
  const combatants = combatStateManager.state.combatants;
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isFightModifierEnabled, setEnableFightModifier] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  // Keyboard shortcuts for turn navigation, focus mode and fight mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      const isHpBarInput = target.id.startsWith(HP_BAR_ID_PREFIX);
      if (
        !event.altKey &&
        !isHpBarInput &&
        ((target.tagName && target.tagName === "INPUT") ||
          target.tagName === "TEXTAREA" ||
          combatants.length === 0)
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        combatStateManager.nextTurn();
      } else if (event.key === "ArrowLeft") {
        // Block previous turn if on first combatant of round 1
        const isAtStart =
          combatStateManager.state.round === 1 &&
          combatStateManager.state.currentTurn === 0;
        if (!isAtStart) {
          event.preventDefault();
          combatStateManager.prevTurn();
        }
      } else if (event.key === "f" || event.key === "F") {
        // Toggle focus mode with F key
        event.preventDefault();
        setIsFocusMode((prev) => !prev);
      } else if (event.altKey) {
        // Park / Save player and Fight button switch on Alt
        event.preventDefault();
        setEnableFightModifier(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [combatants.length, combatStateManager]);

  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.altKey) {
        // Park / Save player and Fight button switch on Alt
        event.preventDefault();
        setEnableFightModifier(false);
      }
    };

    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [combatants.length, combatStateManager]);

  const handleIncludeParked = (combatant: NewCombatant) => {
    combatStateManager.includeParkedGroup(combatant);
    if (formRef.current) {
      setFormCollapsed(false); // Auto-expand
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const includeToFight = (combatant: NewCombatant) => {
    combatStateManager.addCombatant(combatant);
    if (combatListRef.current) {
      combatListRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const includePlayerToForm = (player: SavedPlayer) => {
    combatStateManager.includePlayer(player);
    if (formRef.current) {
      setFormCollapsed(false); // Auto-expand
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const includePlayerToFight = (player: SavedPlayer) => {
    const playerCombattant: PlayerCombatant = {
      type: "player",
      name: player.name,
      initiativeGroups: player.initiativeGroups,
      hp: player.hp,
      maxHp: player.maxHp,
      ac: player.ac,
      color: player.color,
      imageUrl: player.imageUrl,
      initBonus: player.initBonus,
      externalResourceUrl: player.externalResourceUrl,
    };
    combatStateManager.addCombatant(playerCombattant);
    if (combatListRef.current) {
      combatListRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const stagedFromParkedGroups = combatStateManager.state.parkedGroups.find(
    (group) => group.name === combatStateManager.state.newCombatant.name
  )?.name;
  const stagedPlayer = combatStateManager.savedPlayers.find(
    (group) => group.name === combatStateManager.state.newCombatant.name
  )?.name;
  const stagedFrom = stagedFromParkedGroups ?? stagedPlayer;
  const back = () => {
    location.hash = "#combats";
  };

  return (
    <div className="rounded-lg min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Wrapper with transition for hidden elements */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            isFocusMode
              ? "max-h-0 opacity-0 overflow-hidden pointer-events-none"
              : "max-h-[5000px] opacity-100"
          }`}
        >
          {/* Logo - Mobile only, centered at top */}
          <div className="flex justify-center mb-4 md:hidden">
            <img
              src={logo}
              alt="D&D Combat Tracker Logo"
              className="w-16 h-16 object-contain"
            />
          </div>

          <div className="flex items-center gap-3 mb-8">
            {/* Logo - Desktop only */}
            <div className="hidden md:flex md:mb-6">
              <img
                src={logo}
                alt="D&D Combat Tracker Logo"
                className="w-24 h-24 object-contain"
              />
            </div>
            <div className="flex-1">
              <SaveBar
                name={combatStateManager.state.combatName ?? ""}
                description={combatStateManager.state.combatDescription ?? ""}
                onChange={(patch) =>
                  combatStateManager.updateCombat(
                    patch.name ?? "",
                    patch.description ?? ""
                  )
                }
                onBack={back}
                onSave={async () => {
                  if (!combatStateManager.state) return;
                  await combatStateManager.saveCombat({
                    name: combatStateManager.state.combatName,
                    description: combatStateManager.state.combatDescription,
                    data: combatStateManager.state,
                    updatedAt: Date.now(),
                  });
                }}
                hasChanges={combatStateManager.hasChanges}
                onOpenLibrary={() => setShowLibrary(true)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SavedPlayersPanel
              savedPlayers={combatStateManager.savedPlayers}
              onInclude={includePlayerToForm}
              onFight={includePlayerToFight}
              onRemove={combatStateManager.removePlayer}
            />

            <ParkedGroupsPanel
              parkedGroups={combatStateManager.state.parkedGroups}
              onInclude={handleIncludeParked}
              onFight={includeToFight}
              onRemove={combatStateManager.removeParkedGroup}
            />
          </div>

          <AddCombatantForm
            formRef={formRef}
            value={combatStateManager.state.newCombatant}
            stagedFrom={stagedFrom}
            totalCount={combatStateManager.getTotalCombatantCount()}
            isCollapsed={formCollapsed}
            isFightModeEnabled={isFightModifierEnabled}
            onToggleCollapse={setFormCollapsed}
            onChange={combatStateManager.updateNewCombatant}
            onSubmit={() => {
              combatStateManager.addCombatant();
            }}
            onAddGroup={() =>
              combatStateManager.addParkedGroup(isFightModifierEnabled)
            }
            onSaveAsPlayer={() =>
              combatStateManager.addPlayerFromForm(isFightModifierEnabled)
            }
            onAddInitiativeGroup={combatStateManager.addInitiativeGroup}
            onRemoveInitiativeGroup={combatStateManager.removeInitiativeGroup}
            onUpdateInitiativeGroup={combatStateManager.updateInitiativeGroup}
            onSearchMonsters={combatStateManager.searchWithLibrary}
            onSelectSearchResult={combatStateManager.loadMonsterToForm}
            onAddToLibrary={combatStateManager.addCombatantToLibrary}
          />

          {combatants.length > 0 && (
            <GroupsOverview
              groups={combatStateManager.getUniqueGroups() as GroupSummary[]}
              onRemoveGroup={combatStateManager.removeGroup}
            />
          )}
        </div>

        <div
          className={`flex gap-2 mb-6 ${
            isFocusMode ? "sticky top-0 z-10 pt-6" : ""
          }`}
        >
          <div className="flex-1">
            <TurnControls
              round={combatStateManager.state.round}
              currentTurn={combatStateManager.state.currentTurn}
              isFocusMode={isFocusMode}
              combatantCount={combatants.length}
              onPrev={combatStateManager.prevTurn}
              onNext={combatStateManager.nextTurn}
              onToggleFocus={() => setIsFocusMode((prev) => !prev)}
            />
          </div>
        </div>

        <CombatantsList
          combatListRef={combatListRef}
          combatants={combatants}
          currentTurn={combatStateManager.state.currentTurn}
          onRemove={combatStateManager.removeCombatant}
          onDeltaHp={combatStateManager.updateHP}
          onDeathSaves={combatStateManager.updateDeathSave}
          onToggleConcentration={combatStateManager.toggleConcentration}
          onToggleCondition={combatStateManager.toggleCondition}
          onUpdateInitiative={combatStateManager.updateInitiative}
          isFocusMode={isFocusMode}
        />

        {combatants.length === 0 && (
          <div className="text-center text-slate-400 py-12">
            <Sword className="text-lime-400 w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">{t("combat:combatant.noCombatants")}</p>
          </div>
        )}

        {/* Monster Library Modal */}
        <MonsterLibraryModal
          isOpen={showLibrary}
          monsters={combatStateManager.monsters}
          canLoadToForm={true}
          onClose={() => setShowLibrary(false)}
          onLoadToForm={(monster) => {
            combatStateManager.loadMonsterToForm({
              source: "library",
              monster: monster,
            });
            setShowLibrary(false);
            if (formRef.current) {
              setFormCollapsed(false);
              formRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }}
          onCreate={combatStateManager.createMonster}
          onDelete={combatStateManager.removeMonster}
          onUpdate={combatStateManager.updateMonster}
          onSearchMonsters={(query: string) => {
            return combatStateManager.searchWithLibrary(query, "api");
          }}
        />
      </div>
    </div>
  );
}
