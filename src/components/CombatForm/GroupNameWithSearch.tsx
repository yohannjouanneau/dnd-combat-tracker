import { Search, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Monster } from "../../api/types";

type Props = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => Promise<Monster[]>;
  onSelectMonster: (monster: Monster) => void;
};

export default function GroupNameWithSearch({
  id,
  label,
  value,
  placeholder,
  onChange,
  onSearch,
  onSelectMonster,
}: Props) {
  const [showResults, setShowResults] = useState(false);
  const [monsterResults, setMonsterResults] = useState<Monster[]>([]);
  const [isSearching, setSearching] = useState(false);

  const handleSearchClick = async () => {
    if (onSearch && value.trim()) {
      setSearching(true);
      const monsters = await onSearch(value.trim());
      setMonsterResults(monsters);
      setShowResults(true);
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSearch && value.trim()) {
      e.preventDefault();
      onSearch(value.trim());
      setShowResults(true);
    }
  };

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
              ? "Search API for this creature"
              : "Enter a name to search"
          }
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>

      {showResults && !isSearching && monsterResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded border border-slate-600 shadow-lg z-10 max-h-64 overflow-y-auto">
          <div className="text-xs text-slate-400 px-3 py-2 border-b border-slate-600">
            {monsterResults.length} result
            {monsterResults.length !== 1 ? "s" : ""} found
          </div>
          {monsterResults.map((monster, index) => (
            <button
              key={`${monster.name}-${index}`}
              type="button"
              onClick={() => {
                onSelectMonster(monster);
                setShowResults(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-600 transition text-white border-b border-slate-600 last:border-b-0"
            >
              {monster.name}
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {showResults && !isSearching && monsterResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded border border-slate-600 shadow-lg z-10">
          <div className="p-3 text-center text-slate-400 text-sm">
            No monsters found for "{value}"
          </div>
        </div>
      )}
    </div>
  );
}
