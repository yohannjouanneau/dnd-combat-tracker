import { HelpCircle, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function MarkdownHelpTooltip() {
  const { t } = useTranslation(['forms']);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-text-muted hover:text-text-secondary transition p-1"
        title={t('forms:library.notes.help.title')}
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
          <div className="absolute left-0 top-8 z-50 w-80 max-w-[calc(100vw-2rem)] bg-panel-bg border border-border-primary rounded-lg shadow-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary">
                {t('forms:library.notes.help.header')}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-text-muted hover:text-text-primary transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-2 text-xs text-text-secondary">
              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  # Heading 1
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.help.heading1')}</span>
              </div>
              
              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  ## Heading 2
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.help.heading2')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  **bold**
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.help.bold')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  *italic*
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.help.italic')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  ~~strikethrough~~
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.help.strikethrough')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  - List item
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.help.bulletList')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  1. Numbered
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.help.numberedList')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  [Link](url)
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.help.hyperlink')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  `code`
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.help.inlineCode')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded block mt-1">
                  &gt; Quote
                </code>
                <span className="text-text-muted">{t('forms:library.notes.help.blockquote')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  ---
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.help.horizontalLine')}</span>
              </div>

              {/* D&D specific notations */}
              <div className="mt-3 pt-3 border-t border-border-primary">
                <div className="font-semibold text-text-secondary mb-2">
                  {t('forms:library.notes.help.dndNotations')}
                </div>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  2d6+3
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.help.diceNotation')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  {`{hit: +5}`}
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.tags.hit')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  {`{dmg: 2d6+3 fire}`}
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.tags.dmg')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  {`{save: DC 15 Dex}`}
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.tags.save')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  {`{heal: 2d8+4}`}
                </code>
                <span className="text-text-muted ml-2">{t('forms:library.notes.tags.heal')}</span>
              </div>

              <div>
                <code className="bg-panel-secondary px-1.5 py-0.5 rounded">
                  {`{ac: 18}, {range: 60 ft.}, {speed: 30 ft.}`}
                </code>
                <span className="text-text-muted ml-2">+9 more tags...</span>
              </div>
            </div>

            {/* Footer tip */}
            <div className="mt-3 pt-3 border-t border-border-primary text-xs text-text-muted">
              {t('forms:library.notes.help.tip')}
            </div>
          </div>
        </>
      )}
    </div>
  );
}