import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { BuildingBlock, Outcome, StatCheck } from "../../types/campaign";
import { generateId } from "../../utils/utils";

interface Props {
  statChecks: StatCheck[];
  allBlocks: BuildingBlock[];
  onChange: (statChecks: StatCheck[]) => void;
}

export default function StatCheckSection({ statChecks, allBlocks, onChange }: Props) {
  const { t } = useTranslation(["campaigns"]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addStatCheck = () => {
    const id = generateId();
    const newCheck: StatCheck = {
      id,
      label: "",
      difficulty: 10,
      outcomes: [
        { id: generateId(), label: "Success", description: "", linkedBlockId: undefined },
        { id: generateId(), label: "Failure", description: "", linkedBlockId: undefined },
      ],
    };
    onChange([...statChecks, newCheck]);
    setExpanded((prev) => ({ ...prev, [id]: true }));
  };

  const removeStatCheck = (checkId: string) => {
    onChange(statChecks.filter((c) => c.id !== checkId));
  };

  const updateCheck = (checkId: string, patch: Partial<StatCheck>) => {
    onChange(statChecks.map((c) => (c.id === checkId ? { ...c, ...patch } : c)));
  };

  const addOutcome = (checkId: string) => {
    const outcome: Outcome = { id: generateId(), label: "", description: "" };
    onChange(
      statChecks.map((c) =>
        c.id === checkId ? { ...c, outcomes: [...c.outcomes, outcome] } : c
      )
    );
  };

  const removeOutcome = (checkId: string, outcomeId: string) => {
    onChange(
      statChecks.map((c) =>
        c.id === checkId
          ? { ...c, outcomes: c.outcomes.filter((o) => o.id !== outcomeId) }
          : c
      )
    );
  };

  const updateOutcome = (checkId: string, outcomeId: string, patch: Partial<Outcome>) => {
    onChange(
      statChecks.map((c) =>
        c.id === checkId
          ? { ...c, outcomes: c.outcomes.map((o) => (o.id === outcomeId ? { ...o, ...patch } : o)) }
          : c
      )
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-secondary">
          {t("campaigns:block.statChecks")}
        </label>
        <button
          type="button"
          onClick={addStatCheck}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
        >
          <Plus className="w-3 h-3" />
          {t("campaigns:block.addStatCheck")}
        </button>
      </div>

      {statChecks.map((check) => (
        <div key={check.id} className="border border-border-secondary rounded bg-panel-secondary">
          <div
            className="flex items-center gap-2 p-2 cursor-pointer"
            onClick={() => toggleExpand(check.id)}
          >
            {expanded[check.id] ? (
              <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
            )}
            <input
              type="text"
              value={check.label}
              placeholder={t("campaigns:block.checkLabelPlaceholder")}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateCheck(check.id, { label: e.target.value })}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted focus:outline-none"
            />
            <input
              type="text"
              value={check.skill ?? ""}
              placeholder={t("campaigns:block.skillPlaceholder")}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateCheck(check.id, { skill: e.target.value || undefined })}
              className="w-24 bg-input-bg text-text-primary rounded px-2 py-0.5 text-xs border border-border-secondary focus:border-blue-500 focus:outline-none"
            />
            <span className="text-xs text-text-muted mr-1">{t("campaigns:block.difficulty")}</span>
            <input
              type="number"
              value={check.difficulty}
              min={1}
              max={30}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateCheck(check.id, { difficulty: parseInt(e.target.value) || 10 })}
              className="w-12 bg-input-bg text-text-primary rounded px-1 py-0.5 text-sm border border-border-secondary focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeStatCheck(check.id); }}
              className="text-red-400 hover:text-red-300 transition ml-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {expanded[check.id] && (
            <div className="px-3 pb-3 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-muted">{t("campaigns:block.outcomes")}</span>
                <button
                  type="button"
                  onClick={() => addOutcome(check.id)}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  <Plus className="w-3 h-3" />
                  {t("campaigns:block.addOutcome")}
                </button>
              </div>

              {check.outcomes.map((outcome) => (
                <div key={outcome.id} className="bg-panel-bg rounded p-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={outcome.label}
                      placeholder={t("campaigns:block.outcomeLabelPlaceholder")}
                      onChange={(e) => updateOutcome(check.id, outcome.id, { label: e.target.value })}
                      className="flex-1 bg-input-bg text-text-primary rounded px-2 py-1 text-xs border border-border-secondary focus:border-blue-500 focus:outline-none"
                    />
                    {check.outcomes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOutcome(check.id, outcome.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={outcome.description}
                    placeholder={t("campaigns:block.outcomeDescription")}
                    rows={2}
                    onChange={(e) => updateOutcome(check.id, outcome.id, { description: e.target.value })}
                    className="w-full bg-input-bg text-text-primary rounded px-2 py-1 text-xs border border-border-secondary focus:border-blue-500 focus:outline-none resize-none"
                  />
                  {allBlocks.length > 0 && (
                    <select
                      value={outcome.linkedBlockId ?? ""}
                      onChange={(e) =>
                        updateOutcome(check.id, outcome.id, {
                          linkedBlockId: e.target.value || undefined,
                        })
                      }
                      className="w-full bg-input-bg text-text-primary rounded px-2 py-1 text-xs border border-border-secondary focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">{t("campaigns:block.linkedBlock")} (none)</option>
                      {allBlocks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name || b.id}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
