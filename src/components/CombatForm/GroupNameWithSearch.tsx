import { useTranslation } from "react-i18next";
import { Search, Loader2, Globe, BookOpen } from "lucide-react";
import { useCallback, useState } from "react";
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

export default function GroupNameWithSearch({
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

  const search = useCallback(async () => {
    if (!isSearching && onSearch && value.trim()) {
      setSearching(true);
      try {
        const results = await onSearch(value.trim());
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setSearching(false);
      }
    }
  }, [isSearching, onSearch, value]);

  const handleSearchClick = async () => {
    search();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSearch && value.trim()) {
      e.preventDefault();
      search();
    }
  };

  const getResultName = (result: SearchResult): string => {
    return result.monster.name;
  };

  const apiResults = searchResults.filter((r) => r.source === "api");
  const libraryResults = searchResults.filter((r) => r.source === "library");

  return (
    <div className="flex flex-col gap-1 relative">
      <label htmlFor={id} className="text-sm text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(false)}
          className="w-full bg-slate-700 text-white rounded px-3 py-2 pr-10 border border-slate-600 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSearchClick}
          disabled={!value.trim() || isSearching}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-400 disabled:text-slate-600 disabled:cursor-not-allowed transition p-1"
          title={
            value.trim()
              ? t("forms:combatant.searchMonster")
              : t("forms:combatant.enterNameToSearch")
          }
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
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
              {libraryResults.map((result, index) => (
                <button
                  key={`library-${index}`}
                  type="button"
                  onClick={() => {
                    onSelectResult(result);
                    setShowResults(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-600 transition text-white border-b border-slate-600 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>{getResultName(result)}</span>
                  </div>
                </button>
              ))}
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
              {apiResults.map((result, index) => (
                <button
                  key={`api-${index}`}
                  type="button"
                  onClick={() => {
                    onSelectResult(result);
                    setShowResults(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-600 transition text-white border-b border-slate-600 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>{getResultName(result)}</span>
                  </div>
                </button>
              ))}
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
