import { X, ExternalLink, Loader2 } from "lucide-react";
import IconButton from "./IconButton";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useDebounce } from "../../hooks/useDebounce";

export type SearchSelectItem<T = unknown> = {
  id: string;
  label: string;
  group?: string;
  icon?: React.ReactNode;
  raw?: T;
};

type Props<T = unknown> = {
  // Static list (sync filtering) OR async search
  items?: SearchSelectItem<T>[];
  onSearch?: (query: string) => Promise<SearchSelectItem<T>[]>;

  // ID-select mode: chip when value is set
  value?: string;
  onChange?: (id: string | undefined) => void;

  // Text mode: input always visible, no chip (for CombatantNameWithSearch)
  textMode?: boolean;
  textValue?: string;
  onTextChange?: (text: string) => void;

  // Called on selection in both modes
  onSelectItem?: (item: SearchSelectItem<T>) => void;

  placeholder?: string;
  noResultsText?: string;
  // ExternalLink button shown in chip (ID mode only)
  onOpenSelected?: (id: string) => void;
  openSelectedTitle?: string;
};

export default function SearchSelect<T = unknown>({
  items,
  onSearch,
  value,
  onChange,
  textMode = false,
  textValue,
  onTextChange,
  onSelectItem,
  placeholder,
  noResultsText = "No results",
  onOpenSelected,
  openSelectedTitle,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [asyncResults, setAsyncResults] = useState<SearchSelectItem<T>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const justSelectedRef = useRef(false);

  // --- Async search ---
  const performSearch = useCallback(
    async (q: string) => {
      if (!onSearch || !q.trim()) return;
      setIsSearching(true);
      try {
        const results = await onSearch(q);
        setAsyncResults(results);
        setShowDropdown(true);
      } catch {
        setAsyncResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [onSearch],
  );

  const debouncedSearch = useDebounce(performSearch, 400);

  // Text-mode: sync query with textValue and trigger search
  const inputValue = textMode ? (textValue ?? "") : query;

  const handleInputChange = (v: string) => {
    if (textMode) {
      onTextChange?.(v);
    } else {
      setQuery(v);
    }

    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    if (!v.trim()) {
      setShowDropdown(false);
      setAsyncResults([]);
      return;
    }

    if (onSearch) {
      debouncedSearch(v);
    } else {
      setShowDropdown(true);
    }
  };

  // Sync dropdown visibility for text mode on textValue changes
  useEffect(() => {
    if (!textMode) return;
    if (!textValue?.trim()) {
      setShowDropdown(false);
      setAsyncResults([]);
    }
  }, [textMode, textValue]);

  // --- Compute displayed items ---
  const displayedItems = useMemo(() => {
    if (onSearch) return asyncResults;
    if (!items) return [];
    const q = inputValue.toLowerCase().trim();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, onSearch, asyncResults, inputValue]);

  // Group items
  const grouped = useMemo(() => {
    const groups: {
      group: string | undefined;
      items: SearchSelectItem<T>[];
    }[] = [];
    for (const item of displayedItems) {
      const last = groups[groups.length - 1];
      if (last && last.group === item.group) {
        last.items.push(item);
      } else {
        groups.push({ group: item.group, items: [item] });
      }
    }
    return groups;
  }, [displayedItems]);

  const flatItems = displayedItems;

  // --- Selection ---
  const handleSelect = useCallback(
    (item: SearchSelectItem<T>) => {
      justSelectedRef.current = true;
      if (textMode) {
        onTextChange?.(item.label);
      } else {
        setQuery("");
        onChange?.(item.id);
      }
      onSelectItem?.(item);
      setShowDropdown(false);
      setSelectedIndex(-1);
      setAsyncResults([]);
    },
    [textMode, onChange, onTextChange, onSelectItem],
  );

  const handleClear = () => {
    setQuery("");
    onChange?.(undefined);
    setShowDropdown(false);
  };

  // --- Keyboard nav ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || flatItems.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) handleSelect(flatItems[selectedIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Auto-scroll selected row into view
  useEffect(() => {
    if (selectedIndex >= 0) {
      resultsRef.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [displayedItems]);

  // Click-outside
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  // --- Chip: find label for current value ---
  const selectedLabel = useMemo(() => {
    if (!value) return undefined;
    return (
      items?.find((i) => i.id === value)?.label ??
      asyncResults.find((i) => i.id === value)?.label
    );
  }, [value, items, asyncResults]);

  // ID-select mode: show chip when value is set
  if (!textMode && value) {
    return (
      <div className="flex gap-2 items-center">
        <div className="flex-1 flex items-center gap-2 bg-input-bg border border-border-secondary rounded px-3 py-2 text-sm text-text-primary">
          <span className="flex-1 truncate">{selectedLabel ?? value}</span>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </IconButton>
        </div>
        {onOpenSelected && (
          <IconButton
            variant="filled"
            onClick={() => onOpenSelected(value)}
            title={openSelectedTitle}
          >
            <ExternalLink className="w-4 h-4" />
          </IconButton>
        )}
      </div>
    );
  }

  // Input + dropdown
  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim() && (flatItems.length > 0 || onSearch))
              setShowDropdown(true);
          }}
          onBlur={() => {
            setTimeout(() => setShowDropdown(false), 200);
          }}
          placeholder={placeholder}
          className="w-full bg-input-bg text-text-primary rounded px-3 py-2 pr-8 border border-border-secondary focus:border-blue-500 focus:outline-none text-sm"
        />
        {isSearching && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && flatItems.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-input-bg rounded border border-border-secondary shadow-lg z-10 max-h-60 overflow-y-auto">
          {grouped.map(({ group, items: groupItems }) => {
            const baseIndex = flatItems.indexOf(groupItems[0]);
            return (
              <div key={group ?? "_"}>
                {group && (
                  <div className="text-xs px-3 py-2 bg-panel-bg border-b border-border-secondary sticky top-0 text-text-muted font-semibold">
                    {group}
                  </div>
                )}
                {groupItems.map((item, i) => {
                  const globalIndex = baseIndex + i;
                  const isActive = selectedIndex === globalIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      ref={(el) => {
                        resultsRef.current[globalIndex] = el;
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(item);
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full text-left px-3 py-2 text-sm text-text-primary border-b border-border-secondary last:border-b-0 transition flex items-center gap-2 ${
                        isActive
                          ? "bg-panel-secondary"
                          : "hover:bg-panel-secondary/80"
                      }`}
                    >
                      {item.icon && (
                        <span className="flex-shrink-0">{item.icon}</span>
                      )}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {showDropdown &&
        !isSearching &&
        flatItems.length === 0 &&
        inputValue.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-input-bg rounded border border-border-secondary shadow-lg z-10">
            <div className="px-3 py-2 text-sm text-text-muted text-center">
              {noResultsText}
            </div>
          </div>
        )}
    </div>
  );
}
