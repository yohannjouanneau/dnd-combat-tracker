import { Heart, Shield, Hourglass } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AbilityScores } from "../../types";
import { getAbilityModifier, getHpColorClass } from "../../utils/utils";
import { AbilityScore } from "./AbilityScore";
import DerivedStatsPanel, {
  type DerivedStatsInput,
} from "../CombatantDetailPanel/DerivedStatsPanel";

type Props = {
  hp?: number;
  maxHp?: number;
  ac?: number;
  initiative?: number;
  scores?: AbilityScores;
  derivedStats?: DerivedStatsInput;
  mode?: "large" | "compact";
};

const ABILITY_KEYS: (keyof AbilityScores)[] = [
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
];
const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

export default function StatsBlock({
  hp,
  maxHp,
  ac,
  initiative,
  scores,
  derivedStats,
  mode = "large",
}: Props) {
  const { t } = useTranslation("combat");

  if (mode === "compact") {
    return (
      <div className="space-y-2">
        {/* Compact stat row */}
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-panel-secondary rounded px-2.5 py-1.5 flex-1 justify-center">
            <Heart className="w-3 h-3 text-text-muted flex-shrink-0" />
            <span
              className={`text-sm font-bold ${getHpColorClass(hp ?? 0, maxHp ?? 1)}`}
            >
              {hp ?? 0}/{maxHp ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-panel-secondary rounded px-2.5 py-1.5 flex-1 justify-center">
            <Shield className="w-3 h-3 text-text-muted flex-shrink-0" />
            <span className="text-sm font-bold text-blue-400">{ac ?? 0}</span>
          </div>
          {initiative !== undefined && (
            <div className="flex items-center gap-1.5 bg-panel-secondary rounded px-2.5 py-1.5 flex-1 justify-center">
              <Hourglass className="w-3 h-3 text-text-muted flex-shrink-0" />
              <span className="text-sm font-bold text-blue-400">
                {initiative >= 0 ? `+${initiative}` : initiative}
              </span>
            </div>
          )}
        </div>

        {/* Compact ability scores */}
        {scores && (
          <div className="grid grid-cols-6 gap-1">
            {ABILITY_KEYS.map((key) => {
              const val = scores[key] ?? 0;
              return (
                <div
                  key={key}
                  className="bg-panel-secondary rounded px-1 py-1.5 text-center"
                >
                  <div className="text-xs text-text-muted leading-none">
                    {ABILITY_LABELS[key]}
                  </div>
                  <div className="text-sm font-semibold text-text-primary leading-none mt-1">
                    {val}
                  </div>
                  <div className="text-xs text-blue-400 leading-none mt-0.5">
                    {getAbilityModifier(val)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {derivedStats && (
          <DerivedStatsPanel combatant={derivedStats} mode="compact" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HP / AC / Initiative */}
      <div className="flex gap-2 md:gap-4">
        <div className="bg-panel-secondary rounded-lg p-2 md:p-4 flex-1 flex flex-col items-center">
          <div className="text-xs md:text-sm text-text-muted mb-1 flex items-center gap-1 md:gap-2">
            <Heart className="w-3 h-3 md:w-4 md:h-4" />
            {t("combatant.details.hitPoints")}
          </div>
          <div
            className={`text-2xl md:text-3xl font-bold ${getHpColorClass(hp ?? 0, maxHp ?? 1)}`}
          >
            {hp ?? 0} / {maxHp ?? 0}
          </div>
        </div>

        <div className="bg-panel-secondary rounded-lg p-2 md:p-4 flex-1 flex flex-col items-center">
          <div className="text-xs md:text-sm text-text-muted mb-1 flex items-center gap-1 md:gap-2">
            <Shield className="w-3 h-3 md:w-4 md:h-4" />
            {t("combatant.details.armorClass")}
          </div>
          <div className="text-2xl md:text-3xl font-bold text-blue-400">
            {ac ?? 0}
          </div>
        </div>

        {initiative !== undefined && (
          <div className="bg-panel-secondary rounded-lg p-2 md:p-4 flex-1 flex flex-col items-center">
            <div className="text-xs md:text-sm text-text-muted mb-1 flex items-center gap-1 md:gap-2">
              <Hourglass className="w-3 h-3 md:w-4 md:h-4" />
              {t("combatant.details.initiative")}
            </div>
            <div className="text-2xl md:text-3xl font-bold text-blue-400">
              {initiative}
            </div>
          </div>
        )}
      </div>

      {/* Ability scores */}
      {scores && <AbilityScore type="combatant_details" scores={scores} />}

      {derivedStats && <DerivedStatsPanel combatant={derivedStats} />}
    </div>
  );
}
