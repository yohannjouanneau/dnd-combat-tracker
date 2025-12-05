import { HelpCircle, X } from 'lucide-react';
import { useState } from 'react';

export default function MarkdownHelpTooltip() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-400 hover:text-slate-300 transition p-1"
        title="Markdown syntax help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Tooltip */}
          <div className="absolute left-0 top-8 z-50 w-80 max-w-[calc(100vw-2rem)] bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200">
                Markdown Syntax
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-2 text-xs text-slate-300">
              <div>
                <code className="bg-slate-900 px-1.5 py-0.5 rounded">
                  # Heading 1
                </code>
                <span className="text-slate-500 ml-2">Large heading</span>
              </div>
              
              <div>
                <code className="bg-slate-900 px-1.5 py-0.5 rounded">
                  ## Heading 2
                </code>
                <span className="text-slate-500 ml-2">Medium heading</span>
              </div>

              <div>
                <code className="bg-slate-900 px-1.5 py-0.5 rounded">
                  **bold**
                </code>
                <span className="text-slate-500 ml-2">Bold text</span>
              </div>

              <div>
                <code className="bg-slate-900 px-1.5 py-0.5 rounded">
                  *italic*
                </code>
                <span className="text-slate-500 ml-2">Italic text</span>
              </div>

              <div>
                <code className="bg-slate-900 px-1.5 py-0.5 rounded">
                  ~~strikethrough~~
                </code>
                <span className="text-slate-500 ml-2">Crossed out</span>
              </div>

              <div>
                <code className="bg-slate-900 px-1.5 py-0.5 rounded">
                  - List item
                </code>
                <span className="text-slate-500 ml-2">Bullet list</span>
              </div>

              <div>
                <code className="bg-slate-900 px-1.5 py-0.5 rounded">
                  1. Numbered
                </code>
                <span className="text-slate-500 ml-2">Numbered list</span>
              </div>

              <div>
                <code className="bg-slate-900 px-1.5 py-0.5 rounded">
                  [Link](url)
                </code>
                <span className="text-slate-500 ml-2">Hyperlink</span>
              </div>

              <div>
                <code className="bg-slate-900 px-1.5 py-0.5 rounded">
                  `code`
                </code>
                <span className="text-slate-500 ml-2">Inline code</span>
              </div>

              <div>
                <code className="bg-slate-900 px-1.5 py-0.5 rounded block mt-1">
                  &gt; Quote
                </code>
                <span className="text-slate-500">Blockquote</span>
              </div>

              <div>
                <code className="bg-slate-900 px-1.5 py-0.5 rounded">
                  ---
                </code>
                <span className="text-slate-500 ml-2">Horizontal line</span>
              </div>
            </div>

            {/* Footer tip */}
            <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
              💡 Tip: Use blank lines to separate paragraphs
            </div>
          </div>
        </>
      )}
    </div>
  );
}