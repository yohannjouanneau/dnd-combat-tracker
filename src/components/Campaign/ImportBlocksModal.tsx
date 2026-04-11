import { useState, useMemo, useRef, useCallback } from "react";
import { X, Upload, AlertCircle, FileUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  importBlocksFromYaml,
  type ImportedBlock,
} from "../../utils/campaignImporter";
import ImportPreviewNode from "./ImportPreviewNode";

type Props = {
  onImport: (blocks: ImportedBlock[]) => void;
  onCancel: () => void;
};

type ParseResult =
  | { ok: true; blocks: ImportedBlock[] }
  | { ok: false; error: string };

export default function ImportBlocksModal({ onImport, onCancel }: Props) {
  const { t } = useTranslation(["campaigns", "common"]);
  const [yaml, setYaml] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const result = useMemo<ParseResult | null>(() => {
    if (!yaml.trim()) return null;
    try {
      return { ok: true, blocks: importBlocksFromYaml(yaml) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }, [yaml]);

  const topLevelBlocks = result?.ok
    ? result.blocks.filter((b) => b.parentId === null)
    : [];

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setExpandedIds(new Set());
    const reader = new FileReader();
    reader.onload = (ev) => setYaml((ev.target?.result as string) ?? "");
    reader.readAsText(file);
  }

  return (
    <>
      <div
        className="!mt-0 fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
        <div className="bg-panel-bg rounded-lg border border-border-primary max-w-2xl w-full shadow-xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border-primary flex-shrink-0">
            <h2 className="text-xl font-bold text-text-primary">
              {t("campaigns:import.title")}
            </h2>
            <button
              onClick={onCancel}
              className="text-text-muted hover:text-text-primary transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".yaml,.yml"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border-primary hover:border-blue-500 rounded-lg p-8 text-text-muted hover:text-text-primary transition cursor-pointer"
            >
              <FileUp className="w-8 h-8" />
              {fileName ? (
                <span className="text-sm font-medium text-text-primary">
                  {fileName}
                </span>
              ) : (
                <span className="text-sm">
                  {t("campaigns:import.pickFile")}
                </span>
              )}
              <span className="text-xs text-text-muted">.yaml / .yml</span>
            </button>

            {result && !result.ok && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-mono">{result.error}</span>
              </div>
            )}

            {result?.ok && topLevelBlocks.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-secondary">
                  {t("campaigns:import.preview", {
                    count: result.blocks.length,
                  })}
                </p>
                <div className="bg-panel-secondary rounded p-2">
                  {topLevelBlocks.map((entry) => (
                    <ImportPreviewNode
                      key={entry.block.id}
                      entry={entry}
                      allBlocks={result.blocks}
                      depth={0}
                      expandedIds={expandedIds}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border-primary p-4 md:p-6 flex gap-3 flex-shrink-0">
            <button
              onClick={onCancel}
              className="flex-1 bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary px-4 py-2 rounded transition font-medium"
            >
              {t("common:actions.cancel")}
            </button>
            <button
              onClick={() => result?.ok && onImport(result.blocks)}
              disabled={!result?.ok || result.blocks.length === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition font-medium"
            >
              <Upload className="w-4 h-4" />
              {t("campaigns:import.confirm", {
                count: result?.ok ? result.blocks.length : 0,
              })}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
