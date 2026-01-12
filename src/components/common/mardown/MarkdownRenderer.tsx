import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Dices } from 'lucide-react';
import { remarkCustomTags } from "./remarkCustomTags";
import {
  EDITOR_TAGS,
  MARKDOWN_LINK_PROTECTION_PREFIX,
  MARKDOWN_LINK_PROTECTION_SUFFIX,
  MARKDOWN_LINK_IN_TAG_REGEX,
  CUSTOM_TAG_PREFIX,
  DICE_NOTATION_PREFIX,
  TAG_COMPONENT_SEPARATOR,
  MARKDOWN_LINK_NOTATION_REGEX
} from "../../../constants";

type Props = {
  content: string;
};


export default function MarkdownRenderer({ content }: Props) {
  // Preprocess content to protect links inside custom tags
  // Use base64 encoding to completely hide the link from markdown parser
  // This is necessary because the markdown parser extracts [text](url) BEFORE plugins run
  const preprocessedContent = content.replace(
    MARKDOWN_LINK_IN_TAG_REGEX,
    (_match, tagName, linkText, linkUrl, rest) => {
      const linkData = btoa(`[${linkText}](${linkUrl})`);
      return `{${tagName}: ${MARKDOWN_LINK_PROTECTION_PREFIX}${linkData}${MARKDOWN_LINK_PROTECTION_SUFFIX}${rest}}`;
    }
  );

  const components: Components = {
    // Headings - smaller sizes for compact display
    h1: ({ children, ...props }) => (
      <h1 className="text-lg font-bold text-text-primary mt-3 mb-2 first:mt-0" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-base font-bold text-text-primary mt-2 mb-1.5 first:mt-0" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-sm font-semibold text-text-primary mt-2 mb-1 first:mt-0" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="text-sm font-semibold text-text-secondary mt-1.5 mb-1 first:mt-0" {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5 className="text-xs font-semibold text-text-secondary mt-1 mb-0.5 first:mt-0" {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6 className="text-xs font-semibold text-text-muted mt-1 mb-0.5 first:mt-0" {...props}>
        {children}
      </h6>
    ),

    // Paragraphs - compact spacing with dice notation processing
    p: ({ children, ...props }) => (
      <p className="text-sm text-text-secondary leading-relaxed mb-2 last:mb-0" {...props}>
        {children}
      </p>
    ),

    // Lists - tighter spacing
    ul: ({ ...props }) => (
      <ul className="list-disc list-inside text-sm text-text-secondary mb-2 space-y-0.5" {...props} />
    ),
    ol: ({ ...props }) => (
      <ol className="list-decimal list-inside text-sm text-text-secondary mb-2 space-y-0.5" {...props} />
    ),
    li: ({ children, ...props }) => (
      <li className="text-sm text-text-secondary" {...props}>
        {children}
      </li>
    ),

    // Links - safe and mobile-friendly
    a: ({ children, ...props }) => (
      <a
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline break-words"
        {...props}
      >
        {children}
      </a>
    ),

    // Code blocks - also handle our custom tags that are encoded as inlineCode
    code: ({ className, children, ...props }) => {
      const isInline = !className;

      if (isInline && typeof children === 'string') {
        // Check for custom tag prefix
        if (children.startsWith(`${CUSTOM_TAG_PREFIX}${TAG_COMPONENT_SEPARATOR}`)) {
          const parts = children.split(TAG_COMPONENT_SEPARATOR);
          const tagType = parts[1];
          const tagContent = parts[2];
          const tagClassName = parts.slice(3).join(TAG_COMPONENT_SEPARATOR); // Rejoin in case className had ::

          const tag = EDITOR_TAGS.find(t => {
            const pattern = t.pattern.source.toLowerCase();
            return pattern.includes(`{${tagType.toLowerCase()}:`);
          });

          const Icon = tag?.icon;

          // Parse markdown link notation [text](url) within tag content
          const linkMatch = tagContent?.match(MARKDOWN_LINK_NOTATION_REGEX);

          return (
            <span className={`inline-flex items-center gap-1 ${tagClassName || ''}`}>
              {Icon && <Icon className="w-3 h-3 inline" />}
              {linkMatch ? (
                <a
                  href={linkMatch[2]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-current underline"
                >
                  {linkMatch[1]}
                </a>
              ) : (
                tagContent
              )}
            </span>
          );
        }

        // Check for dice notation prefix
        if (children.startsWith(`${DICE_NOTATION_PREFIX}${TAG_COMPONENT_SEPARATOR}`)) {
          const diceValue = children.substring((DICE_NOTATION_PREFIX + TAG_COMPONENT_SEPARATOR).length);
          return (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <Dices className="w-3 h-3 inline" />
              {diceValue}
            </span>
          );
        }
      }

      // Regular code rendering
      if (isInline) {
        return (
          <code className="bg-panel-bg text-pink-400 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className="block bg-panel-bg text-text-secondary p-2 rounded text-xs font-mono overflow-x-auto mb-2" {...props}>
          {children}
        </code>
      );
    },

    // Blockquotes
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-border-secondary pl-3 py-1 my-2 italic text-text-muted text-sm" {...props}>
        {children}
      </blockquote>
    ),

    // Horizontal rules
    hr: ({ ...props }) => <hr className="border-border-primary my-3" {...props} />,

    // Tables - compact mobile-friendly
    table: ({ ...props }) => (
      <div className="overflow-x-auto mb-2">
        <table className="min-w-full text-xs border-collapse border border-border-primary" {...props} />
      </div>
    ),
    th: ({ children, ...props }) => (
      <th className="border border-border-primary bg-panel-bg px-2 py-1 text-left font-semibold text-text-primary" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border border-border-primary px-2 py-1 text-text-secondary" {...props}>
        {children}
      </td>
    ),

    // Strong/Bold
    strong: ({ children, ...props }) => (
      <strong className="font-bold text-text-primary" {...props}>
        {children}
      </strong>
    ),

    // Emphasis/Italic
    em: ({ children, ...props }) => (
      <em className="italic text-text-secondary" {...props}>
        {children}
      </em>
    ),

    // Strikethrough (GFM)
    del: ({ ...props }) => (
      <del className="line-through text-text-muted" {...props} />
    ),
  } as Components;

  return (
    <div className="text-left">
      <ReactMarkdown
        remarkPlugins={[remarkCustomTags, remarkGfm]}
        components={components}
      >
        {preprocessedContent}
      </ReactMarkdown>
    </div>
  );
}