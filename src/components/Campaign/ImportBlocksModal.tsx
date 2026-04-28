import { useState, useMemo, useRef, useCallback } from "react";
import { Upload, AlertCircle, FileUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  importBlocksFromYaml,
  type ImportedBlock,
} from "../../utils/campaignImporter";
import ImportPreviewNode from "./ImportPreviewNode";
import Modal from "../common/Modal";
import Button from "../common/Button";

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
    <Modal
      open={true}
      onClose={onCancel}
      title={t("campaigns:import.title")}
      size="lg"
    >
      <Modal.Body className="space-y-4">
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
            <span className="text-sm">{t("campaigns:import.pickFile")}</span>
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
      </Modal.Body>

      <Modal.Footer className="flex gap-3">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          {t("common:actions.cancel")}
        </Button>
        <Button
          variant="primary"
          onClick={() => result?.ok && onImport(result.blocks)}
          disabled={!result?.ok || result.blocks.length === 0}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {t("campaigns:import.confirm", {
            count: result?.ok ? result.blocks.length : 0,
          })}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
