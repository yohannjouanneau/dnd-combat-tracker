import { Fragment } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { ReactNode } from "react";
import { Dices } from "lucide-react";
import { DICE_NOTATION_REGEX, DICE_NOTATION_TEST_REGEX, EDITOR_TAGS } from "../../../constants";

type Props = {
  content: string;
};


export default function MarkdownRenderer({ content }: Props) {

  /**
   * Process all children (handles both single child and arrays)
   * Processes both custom tags and dice notation simultaneously
   * @param children - React children
   * @returns Processed children with custom tags and dice notation
   */
  const processChildren = (children: ReactNode): ReactNode => {
    if (typeof children === 'string') {
      let segments: (string | ReactNode)[] = [children];

      // Process custom tags
      EDITOR_TAGS.forEach((tag, tagIndex) => {
        segments = segments.flatMap((segment, segmentIndex) => {
          if (typeof segment !== 'string') return [segment];

          const matches = Array.from(segment.matchAll(tag.pattern));
          if (matches.length === 0) return [segment];

          const result: (string | ReactNode)[] = [];
          let lastIndex = 0;

          for (const match of matches) {
            const matchIndex = match.index!;

            if (matchIndex > lastIndex) {
              result.push(segment.substring(lastIndex, matchIndex));
            }

            const Icon = tag.icon;
            result.push(
              <span
                key={`tag-${tagIndex}-${segmentIndex}-${matchIndex}`}
                className={`inline-flex items-center gap-1 ${tag.className}`}
              >
                <Icon className="w-3 h-3 inline" />
                {match[1].trim()}
              </span>
            );

            lastIndex = matchIndex + match[0].length;
          }

          if (lastIndex < segment.length) {
            result.push(segment.substring(lastIndex));
          }

          return result;
        });
      });

      // Process dice notation
      segments = segments.flatMap((segment) => {
        if (typeof segment !== 'string') return [segment];

        const parts = segment.split(DICE_NOTATION_REGEX);
        return parts.map((part, index) => {
          if (DICE_NOTATION_TEST_REGEX.test(part)) {
            return (
              <span key={`dice-${index}`} className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <Dices className="w-3 h-3 inline" />
                {part}
              </span>
            );
          }
          return part;
        }) as (string | React.JSX.Element)[];
      });

      return segments;
    }

    if (Array.isArray(children)) {
      return children.map((c, i) => (
        <Fragment key={i}>{processChildren(c)}</Fragment>
      ));
    }

    return children;
  };

  const components: Components = {
    // Headings - smaller sizes for compact display
    h1: ({ children, ...props }) => (
      <h1 className="text-lg font-bold text-text-primary mt-3 mb-2 first:mt-0" {...props}>
        {processChildren(children)}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-base font-bold text-text-primary mt-2 mb-1.5 first:mt-0" {...props}>
        {processChildren(children)}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-sm font-semibold text-text-primary mt-2 mb-1 first:mt-0" {...props}>
        {processChildren(children)}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="text-sm font-semibold text-text-secondary mt-1.5 mb-1 first:mt-0" {...props}>
        {processChildren(children)}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5 className="text-xs font-semibold text-text-secondary mt-1 mb-0.5 first:mt-0" {...props}>
        {processChildren(children)}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6 className="text-xs font-semibold text-text-muted mt-1 mb-0.5 first:mt-0" {...props}>
        {processChildren(children)}
      </h6>
    ),

    // Paragraphs - compact spacing with dice notation processing
    p: ({ children, ...props }) => (
      <p className="text-sm text-text-secondary leading-relaxed mb-2 last:mb-0" {...props}>
        {processChildren(children)}
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
        {processChildren(children)}
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
        {processChildren(children)}
      </a>
    ),

    // Code blocks
    code: ({ className, ...props }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="bg-panel-bg text-pink-400 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
        );
      }
      return (
        <code className="block bg-panel-bg text-text-secondary p-2 rounded text-xs font-mono overflow-x-auto mb-2" {...props} />
      );
    },

    // Blockquotes
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-border-secondary pl-3 py-1 my-2 italic text-text-muted text-sm" {...props}>
        {processChildren(children)}
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
        {processChildren(children)}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border border-border-primary px-2 py-1 text-text-secondary" {...props}>
        {processChildren(children)}
      </td>
    ),

    // Strong/Bold
    strong: ({ children, ...props }) => (
      <strong className="font-bold text-text-primary" {...props}>
        {processChildren(children)}
      </strong>
    ),

    // Emphasis/Italic
    em: ({ children, ...props }) => (
      <em className="italic text-text-secondary" {...props}>
        {processChildren(children)}
      </em>
    ),

    // Strikethrough (GFM)
    del: ({ ...props }) => (
      <del className="line-through text-text-muted" {...props} />
    ),
  };

  return (
    <div className="text-left">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}