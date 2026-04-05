import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { BlockTypeDef } from "../../types/campaign";

export interface FilterState {
  searchQuery: string;
  selectedTypeIds: string[];
  selectedTags: string[];
}

interface Props {
  searchQuery: string;
  selectedTypeIds: string[];
  selectedTags: string[];
  blockTypes: BlockTypeDef[];
  allTags: string[];
  onChange: (patch: Partial<FilterState>) => void;
  onClear: () => void;
}

export default function CampaignFilterBar({
  searchQuery,
  selectedTypeIds,
  selectedTags,
  blockTypes,
  allTags,
  onChange,
  onClear,
}: Props) {
  const { t } = useTranslation(["campaigns", "common"]);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedTypeIds.length > 0 ||
    selectedTags.length > 0;

  const activeChipCount = selectedTypeIds.length + selectedTags.length;

  function toggleTypeId(id: string) {
    const next = selectedTypeIds.includes(id)
      ? selectedTypeIds.filter((x) => x !== id)
      : [...selectedTypeIds, id];
    onChange({ selectedTypeIds: next });
  }

  function toggleTag(tag: string) {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((x) => x !== tag)
      : [...selectedTags, tag];
    onChange({ selectedTags: next });
  }

  const chipsSection = (
    <div className="flex flex-wrap gap-1.5">
      {blockTypes.map((bt) => {
        const active = selectedTypeIds.includes(bt.id);
        return (
          <button
            key={bt.id}
            onClick={() => toggleTypeId(bt.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition ${
              active
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-panel-secondary border-border-secondary text-text-muted hover:text-text-primary hover:border-border-primary"
            }`}
          >
            <span>{bt.icon}</span>
            <span>
              {bt.isBuiltIn
                ? t(`campaigns:block.types.${bt.id}`, { defaultValue: bt.name })
                : bt.name}
            </span>
            {active && <X className="w-3 h-3" />}
          </button>
        );
      })}
      {allTags.map((tag) => {
        const active = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition ${
              active
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-panel-secondary border-border-secondary text-text-muted hover:text-text-primary hover:border-border-primary"
            }`}
          >
            <span className="text-text-muted">#</span>
            <span>{tag}</span>
            {active && <X className="w-3 h-3" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="mb-3 space-y-2">
      {/* Search row + mobile toggle */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
            placeholder={t("campaigns:filter.searchPlaceholder")}
            className="w-full bg-panel-secondary border border-border-secondary rounded pl-8 pr-7 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-primary"
          />
          {searchQuery && (
            <button
              onClick={() => {
                onChange({ searchQuery: "" });
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile: chips toggle */}
        {(blockTypes.length > 0 || allTags.length > 0) && (
          <button
            onClick={() => setMobileExpanded((v) => !v)}
            className={`sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm border transition ${
              activeChipCount > 0
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-panel-secondary border-border-secondary text-text-muted hover:text-text-primary"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {activeChipCount > 0 && (
              <span className="text-xs font-medium">{activeChipCount}</span>
            )}
          </button>
        )}

        {/* Clear all — desktop */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded text-sm bg-panel-secondary border border-border-secondary text-text-muted hover:text-text-primary transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t("campaigns:filter.clearAll")}</span>
          </button>
        )}
      </div>

      {/* Desktop: chips always visible */}
      {(blockTypes.length > 0 || allTags.length > 0) && (
        <div className="hidden sm:block">{chipsSection}</div>
      )}

      {/* Mobile: chips expanded */}
      {mobileExpanded && (blockTypes.length > 0 || allTags.length > 0) && (
        <div className="sm:hidden space-y-2">
          {chipsSection}
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-sm bg-panel-secondary border border-border-secondary text-text-muted hover:text-text-primary transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t("campaigns:filter.clearAll")}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
