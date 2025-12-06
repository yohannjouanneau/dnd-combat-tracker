import { Fragment } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { ReactNode } from "react";
import {
  Dices,
  Sword,
  Flame,
  Shield,
  Heart,
  ShieldCheck,
  Skull,
  Target,
  Wind,
  ShieldPlus,
  Sparkles,
  RotateCw,
  Star,
  ShieldX
} from "lucide-react";

type Props = {
  content: string;
};

type CustomTag = {
  pattern: RegExp;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
};

const CUSTOM_TAGS: CustomTag[] = [
  {
    pattern: /\{hit:\s*([^}]+)\}/gi,
    icon: Sword,
    className: "text-red-400 font-semibold",
  },
  {
    pattern: /\{dmg:\s*([^}]+)\}/gi,
    icon: Flame,
    className: "text-orange-400 font-semibold",
  },
  {
    pattern: /\{save:\s*([^}]+)\}/gi,
    icon: Shield,
    className: "text-blue-400 font-semibold",
  },
  {
    pattern: /\{heal:\s*([^}]+)\}/gi,
    icon: Heart,
    className: "text-green-400 font-semibold",
  },
  {
    pattern: /\{ac:\s*([^}]+)\}/gi,
    icon: ShieldCheck,
    className: "text-cyan-400 font-semibold",
  },
  {
    pattern: /\{cond:\s*([^}]+)\}/gi,
    icon: Skull,
    className: "text-yellow-400 font-semibold",
  },
  {
    pattern: /\{range:\s*([^}]+)\}/gi,
    icon: Target,
    className: "text-purple-400 font-semibold",
  },
  {
    pattern: /\{speed:\s*([^}]+)\}/gi,
    icon: Wind,
    className: "text-sky-400 font-semibold",
  },
  {
    pattern: /\{resist:\s*([^}]+)\}/gi,
    icon: ShieldPlus,
    className: "text-indigo-400 font-semibold",
  },
  {
    pattern: /\{spell:\s*([^}]+)\}/gi,
    icon: Sparkles,
    className: "text-pink-400 font-semibold",
  },
  {
    pattern: /\{recharge:\s*([^}]+)\}/gi,
    icon: RotateCw,
    className: "text-amber-400 font-semibold",
  },
  {
    pattern: /\{legendary:\s*([^}]+)\}/gi,
    icon: Star,
    className: "text-yellow-300 font-semibold",
  },
  {
    pattern: /\{vuln:\s*([^}]+)\}/gi,
    icon: ShieldX,
    className: "text-red-500 font-semibold",
  },
];

export default function MarkdownRenderer({ content }: Props) {
  // Regex pattern for dice notation (e.g., 2d12+4, 2d12 + 4, 1d6, 3d8-2, 3d8 - 2)
  const DICE_NOTATION_REGEX = /(\d+d\d+(?:\s*[+-]\s*\d+)?)/gi;
  const DICE_NOTATION_TEST_REGEX = /^\d+d\d+(?:\s*[+-]\s*\d+)?$/i;

  /**
   * Process children to detect and render dice notation with icons
   * @param child - React child element or string
   * @returns Processed child with dice notation wrapped in styled spans
   */
  const processDiceNotation = (child: ReactNode): ReactNode => {
    if (typeof child === 'string') {
      // Split by dice notation pattern
      const parts = child.split(DICE_NOTATION_REGEX);
      return parts.map((part, index) => {
        // Check if this part matches dice notation
        if (DICE_NOTATION_TEST_REGEX.test(part)) {
          return (
            <span key={index} className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <Dices className="w-3 h-3 inline" />
              {part}
            </span>
          );
        }
        return part;
      });
    }

    // Handle arrays (from custom tag processing)
    if (Array.isArray(child)) {
      return child.map((c, i) => (
        <Fragment key={i}>{processDiceNotation(c)}</Fragment>
      ));
    }

    return child;
  };

  /**
   * Process custom tags (e.g., {hit: +5}, {dmg: 2d6}, etc.)
   * @param child - React child element or string
   * @returns Processed child with custom tags wrapped in styled spans
   */
  const processCustomTags = (child: ReactNode): ReactNode => {
    if (typeof child === 'string') {
      let segments: (string | ReactNode)[] = [child];

      // Process each custom tag
      CUSTOM_TAGS.forEach((tag, tagIndex) => {
        segments = segments.flatMap(segment => {
          if (typeof segment !== 'string') return segment;

          const parts = segment.split(tag.pattern);
          return parts.map((part, index) => {
            // Check if this is a captured group (odd indices after split with capture groups)
            if (index % 2 === 1) {
              const Icon = tag.icon;
              return (
                <span
                  key={`tag-${tagIndex}-${index}`}
                  className={`inline-flex items-center gap-1 ${tag.className}`}
                >
                  <Icon className="w-3 h-3 inline" />
                  {part.trim()}
                </span>
              );
            }
            return part;
          });
        });
      });

      return segments;
    }

    if (Array.isArray(child)) {
      return child.map((c, i) => (
        <Fragment key={i}>{processCustomTags(c)}</Fragment>
      ));
    }

    return child;
  };

  /**
   * Process all children (handles both single child and arrays)
   * Processes custom tags first, then dice notation
   * @param children - React children
   * @returns Processed children with custom tags and dice notation
   */
  const processChildren = (children: ReactNode): ReactNode => {
    // First process custom tags
    const afterTags = processCustomTags(children);
    // Then process dice notation
    return processDiceNotation(afterTags);
  };

  const components: Components = {
    // Headings - smaller sizes for compact display
    h1: ({ children, ...props }) => (
      <h1 className="text-lg font-bold text-slate-200 mt-3 mb-2 first:mt-0" {...props}>
        {processChildren(children)}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-base font-bold text-slate-200 mt-2 mb-1.5 first:mt-0" {...props}>
        {processChildren(children)}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-sm font-semibold text-slate-200 mt-2 mb-1 first:mt-0" {...props}>
        {processChildren(children)}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="text-sm font-semibold text-slate-300 mt-1.5 mb-1 first:mt-0" {...props}>
        {processChildren(children)}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5 className="text-xs font-semibold text-slate-300 mt-1 mb-0.5 first:mt-0" {...props}>
        {processChildren(children)}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6 className="text-xs font-semibold text-slate-400 mt-1 mb-0.5 first:mt-0" {...props}>
        {processChildren(children)}
      </h6>
    ),

    // Paragraphs - compact spacing with dice notation processing
    p: ({ children, ...props }) => (
      <p className="text-sm text-slate-300 leading-relaxed mb-2 last:mb-0" {...props}>
        {processChildren(children)}
      </p>
    ),

    // Lists - tighter spacing
    ul: ({ ...props }) => (
      <ul className="list-disc list-inside text-sm text-slate-300 mb-2 space-y-0.5" {...props} />
    ),
    ol: ({ ...props }) => (
      <ol className="list-decimal list-inside text-sm text-slate-300 mb-2 space-y-0.5" {...props} />
    ),
    li: ({ children, ...props }) => (
      <li className="text-sm text-slate-300" {...props}>
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
          <code className="bg-slate-800 text-pink-400 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
        );
      }
      return (
        <code className="block bg-slate-800 text-slate-300 p-2 rounded text-xs font-mono overflow-x-auto mb-2" {...props} />
      );
    },

    // Blockquotes
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-slate-600 pl-3 py-1 my-2 italic text-slate-400 text-sm" {...props}>
        {processChildren(children)}
      </blockquote>
    ),

    // Horizontal rules
    hr: ({ ...props }) => <hr className="border-slate-700 my-3" {...props} />,

    // Tables - compact mobile-friendly
    table: ({ ...props }) => (
      <div className="overflow-x-auto mb-2">
        <table className="min-w-full text-xs border-collapse border border-slate-700" {...props} />
      </div>
    ),
    th: ({ children, ...props }) => (
      <th className="border border-slate-700 bg-slate-800 px-2 py-1 text-left font-semibold text-slate-200" {...props}>
        {processChildren(children)}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border border-slate-700 px-2 py-1 text-slate-300" {...props}>
        {processChildren(children)}
      </td>
    ),

    // Strong/Bold
    strong: ({ children, ...props }) => (
      <strong className="font-bold text-slate-200" {...props}>
        {processChildren(children)}
      </strong>
    ),

    // Emphasis/Italic
    em: ({ children, ...props }) => (
      <em className="italic text-slate-300" {...props}>
        {processChildren(children)}
      </em>
    ),

    // Strikethrough (GFM)
    del: ({ ...props }) => (
      <del className="line-through text-slate-500" {...props} />
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