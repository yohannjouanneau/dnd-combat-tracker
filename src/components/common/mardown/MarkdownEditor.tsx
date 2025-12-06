import { useState, useRef } from 'react';
import { Eye, Edit3, Sword } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MarkdownHelpTooltip from './MarkdownHelpTooltip';
import MarkdownRenderer from './MarkdownRenderer';

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
  maxLength = 10000,
}: Props) {
  const { t } = useTranslation(['forms']);
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const defaultPlaceholder = t('forms:library.notes.placeholder');

  const wrapWithHit = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const scrollTop = textarea.scrollTop; // Save scroll position

    // If no text selected, insert placeholder
    const textToWrap = selectedText || '+0';

    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);
    const newText = beforeText + `{hit: ${textToWrap}}` + afterText;

    onChange(newText);

    // Restore focus, cursor position, and scroll position after the inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + `{hit: ${textToWrap}}`.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.scrollTop = scrollTop; // Restore scroll position
    }, 0);
  };

  return (
    <div className="space-y-2">
      {/* Header with tabs and help */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-300">
            {t('forms:library.notes.label')}
          </label>
          <MarkdownHelpTooltip />
        </div>

        {/* Action buttons and tabs */}
        <div className="flex gap-2">
          {/* Hit tag button - separate group */}
          <div className="flex gap-1 bg-slate-900 rounded p-1">
            <button
              type="button"
              onClick={wrapWithHit}
              disabled={isPreview}
              className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                isPreview
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
              }`}
              title={t('forms:library.notes.wrapHitButton')}
            >
              <Sword className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{`{hit:}`}</span>
            </button>
          </div>

          {/* Write/Preview tabs */}
          <div className="flex gap-1 bg-slate-900 rounded p-1">
            <button
              type="button"
              onClick={() => setIsPreview(false)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                !isPreview
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('forms:library.notes.write')}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPreview(true)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                isPreview
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('forms:library.notes.preview')}</span>
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
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none resize-y min-h-[120px] text-base"
            />
            {/* Character counter */}
            <div className="flex justify-end mt-1">
              <span
                className={`text-xs ${
                  value.length > maxLength * 0.9
                    ? 'text-orange-400'
                    : 'text-slate-500'
                }`}
              >
                {value.length} / {maxLength.toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          // Preview mode - Rendered markdown
          <div className="min-h-[120px] max-h-96 overflow-y-auto bg-slate-900 rounded px-3 py-2 border border-slate-600">
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-slate-500 text-sm italic">
                {t('forms:library.notes.emptyPreview')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}