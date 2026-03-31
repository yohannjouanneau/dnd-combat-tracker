import { BookOpen, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SearchResult } from "../../types";
import SearchSelect, { type SearchSelectItem } from "../common/SearchSelect";

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
  const handleSearch = onSearch
    ? async (query: string): Promise<SearchSelectItem<SearchResult>[]> => {
        const results = await onSearch(query);
        return results.map((r) => ({
          id: r.monster.name + "_" + r.source,
          label: r.monster.name,
          group: r.source === "api" ? "D&D API" : "Your Library",
          icon:
            r.source === "api" ? (
              <Globe className="w-4 h-4 text-blue-400" />
            ) : (
              <BookOpen className="w-4 h-4 text-amber-400" />
            ),
          raw: r,
        }));
      }
    : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-text-secondary">
        {label}
      </label>
      <SearchSelect<SearchResult>
        textMode
        textValue={value}
        onTextChange={onChange}
        onSearch={handleSearch}
        onSelectItem={(item) => item.raw && onSelectResult(item.raw)}
        placeholder={placeholder}
        noResultsText={t("monster.noResults", { query: value })}
      />
    </div>
  );
}
