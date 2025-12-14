import { useTranslation } from "react-i18next";
import { Loader2, Globe, BookOpen } from "lucide-react";
import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import type { SearchResult } from "../../types";

type Props = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => Promise<SearchResult[]>;
  onSelectResult: (result: SearchResult) => void;
};

export default function CombatantNameWithSearch({
  id,
  label,
  value,
  placeholder,
  onChange,
  onSearch,
  onSelectResult,
}: Props) {
  const { t } = useTranslation("forms");
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const debounceTimerRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const justSelectedRef = useRef(false);

  const performSearch = useCallback(async (query: string) => {
    if (isSearching || !onSearch) return;

    setSearching(true);
    try {
      const results = await onSearch(query);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [isSearching, onSearch]);

  // Debounce effect - auto-trigger search on value change
  useEffect(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setShowResults(false);
      setSelectedIndex(-1);
      return;
    }

    // Skip search if user just selected a result
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    debounceTimerRef.current = window.setTimeout(() => {
      if (onSearch && value.trim()) {
        performSearch(value.trim());
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, onSearch, performSearch]);

  const handleSelectResult = useCallback((result: SearchResult) => {
    justSelectedRef.current = true; // Mark that we just selected
    onSelectResult(result);
    setShowResults(false);
    setSelectedIndex(-1);
    setSearchResults([]);
  }, [onSelectResult]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || flatResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < flatResults.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
          handleSelectResult(flatResults[selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0 && value.trim()) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Delay to allow result clicks
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current[selectedIndex]) {
      resultsRef.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults]);

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showResults]);

  const getResultName = (result: SearchResult): string => {
    return result.monster.name;
  };

  const apiResults = searchResults.filter((r) => r.source === "api");
  const libraryResults = searchResults.filter((r) => r.source === "library");

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => {
    return [...libraryResults, ...apiResults];
  }, [libraryResults, apiResults]);

  return (
    <div className="flex flex-col gap-1 relative">
      <label htmlFor={id} className="text-sm text-slate-300">
        {label}
      </label>
      <div className="relative" ref={dropdownRef}>
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-full bg-slate-700 text-white rounded px-3 py-2 pr-10 border border-slate-600 focus:border-blue-500 focus:outline-none"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          </div>
        )}
      </div>

      {showResults && !isSearching && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded border border-slate-600 shadow-lg z-10 max-h-96 overflow-y-auto">
          {/* Library Results */}
          {libraryResults.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-400 px-3 py-2 bg-slate-800 border-b border-slate-600 sticky top-0">
                <BookOpen className="w-4 h-4" />
                <span className="font-semibold">
                  Your Library ({libraryResults.length})
                </span>
              </div>
              {libraryResults.map((result, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <button
                    key={`library-${index}`}
                    type="button"
                    ref={(el) => { resultsRef.current[index] = el; }}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur
                      handleSelectResult(result);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-3 py-2 transition text-white border-b border-slate-600 last:border-b-0 ${
                      isSelected ? 'bg-slate-500' : 'hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>{getResultName(result)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* API Results */}
          {apiResults.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs text-blue-400 px-3 py-2 bg-slate-800 border-b border-slate-600 sticky top-0">
                <Globe className="w-4 h-4" />
                <span className="font-semibold">
                  D&D API ({apiResults.length})
                </span>
              </div>
              {apiResults.map((result, index) => {
                const globalIndex = libraryResults.length + index;
                const isSelected = selectedIndex === globalIndex;
                return (
                  <button
                    key={`api-${index}`}
                    type="button"
                    ref={(el) => { resultsRef.current[globalIndex] = el; }}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur
                      handleSelectResult(result);
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full text-left px-3 py-2 transition text-white border-b border-slate-600 last:border-b-0 ${
                      isSelected ? 'bg-slate-500' : 'hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>{getResultName(result)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {showResults && !isSearching && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded border border-slate-600 shadow-lg z-10">
          <div className="p-3 text-center text-slate-400 text-sm">
            {t("forms:combatant.noResults", { query: value })}
          </div>
        </div>
      )}
    </div>
  );
}
