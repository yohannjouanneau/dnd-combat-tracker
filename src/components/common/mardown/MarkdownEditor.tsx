import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { Eye, Edit3, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import MarkdownHelpTooltip from "./MarkdownHelpTooltip";
import MarkdownRenderer from "./MarkdownRenderer";
import { MarkdownEditorTagMenu } from "./MarkdownEditorTagMenu";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
};

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  maxLength = 5000,
}: Props) {
  const { t } = useTranslation(["forms"]);
  const [isPreview, setIsPreview] = useState(false);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const [newCursorPos, setNewCursorPos] = useState<number | undefined>();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsTagMenuOpen(false);
      }
    };

    if (isTagMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTagMenuOpen]);

  const defaultPlaceholder = t("forms:library.notes.placeholder");

  // Generic wrap function for any tag
  const wrapWithTag = useCallback(
    (tagName: string, placeholder: string = "") => {
      const textarea = textareaRef?.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToWrap = selectedText || placeholder;
      const beforeText = value.substring(0, start);
      const afterText = value.substring(end);
      const newText = beforeText + `{${tagName}: ${textToWrap}}` + afterText;

      onChange(newText);
      textarea.focus();
      const newPos = start + `{${tagName}: ${textToWrap}}`.length;
      setNewCursorPos(newPos)
      setIsTagMenuOpen(false);
    },
    [onChange, value]
  );

  useLayoutEffect(() => {
    const textarea = textareaRef?.current;
    if (!textarea || !newCursorPos) return;

    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  }, [newCursorPos]);

  return (
    <div className="space-y-2">
      {/* Header with tabs and help */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-text-secondary">
            {t("forms:library.notes.label")}
          </label>
          <MarkdownHelpTooltip />
        </div>

        {/* Action buttons and tabs */}
        <div className="flex gap-2">
          {/* Tag dropdown menu - separate group */}
          <div
            className="flex gap-1 bg-app-bg rounded p-1 relative"
            ref={dropdownRef}
          >
            <button
              type="button"
              onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
              disabled={isPreview}
              className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                isPreview
                  ? "text-text-muted cursor-not-allowed"
                  : "text-text-muted hover:text-text-secondary hover:bg-panel-bg"
              }`}
              title={t("forms:library.notes.tagMenu")}
            >
              <span className="hidden sm:inline">
                {t("forms:library.notes.tagsLabel")}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Dropdown Menu */}
            {isTagMenuOpen && !isPreview && (
              <MarkdownEditorTagMenu wrapWithTag={wrapWithTag} />
            )}
          </div>

          {/* Write/Preview tabs */}
          <div className="flex gap-1 bg-panel-secondary rounded p-1">
            <button
              type="button"
              onClick={() => setIsPreview(false)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                !isPreview
                  ? "bg-panel-secondary text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {t("forms:library.notes.write")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsPreview(true)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                isPreview
                  ? "bg-panel-secondary text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {t("forms:library.notes.preview")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor or Preview */}
      <div className="relative">
        {!isPreview ? (
          // Write mode - Textarea
          <div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder ?? defaultPlaceholder}
              maxLength={maxLength}
              rows={8}
              className="w-full bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none resize-y min-h-[120px] text-base"
            />
            {/* Character counter */}
            <div className="flex justify-end mt-1">
              <span
                className={`text-xs ${
                  value.length > maxLength * 0.9
                    ? "text-orange-400"
                    : "text-text-muted"
                }`}
              >
                {value.length} / {maxLength.toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          // Preview mode - Rendered markdown
          <div className="min-h-[120px] max-h-96 overflow-y-auto bg-app-bg rounded px-3 py-2 border border-border-secondary">
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-text-muted text-sm italic">
                {t("forms:library.notes.emptyPreview")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
