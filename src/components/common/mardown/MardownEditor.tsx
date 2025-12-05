import { useState } from 'react';
import { Eye, Edit3 } from 'lucide-react';
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
  placeholder = 'Add notes... (Markdown supported)',
  maxLength = 10000,
}: Props) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="space-y-2">
      {/* Header with tabs and help */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-300">
            Notes
          </label>
          <MarkdownHelpTooltip />
        </div>

        {/* Tab buttons */}
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
            <span className="hidden sm:inline">Write</span>
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
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
      </div>

      {/* Editor or Preview */}
      <div className="relative">
        {!isPreview ? (
          // Write mode - Textarea
          <div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
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
                Nothing to preview. Switch to Write mode to add notes.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}