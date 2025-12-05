import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

type Props = {
  content: string;
  className?: string;
};

export default function MarkdownRenderer({ content }: Props) {
  const components: Components = {
    // Headings - smaller sizes for compact display
    h1: ({ ...props }) => (
      <h1 className="text-lg font-bold text-slate-200 mt-3 mb-2 first:mt-0" {...props} />
    ),
    h2: ({ ...props }) => (
      <h2 className="text-base font-bold text-slate-200 mt-2 mb-1.5 first:mt-0" {...props} />
    ),
    h3: ({ ...props }) => (
      <h3 className="text-sm font-semibold text-slate-200 mt-2 mb-1 first:mt-0" {...props} />
    ),
    h4: ({ ...props }) => (
      <h4 className="text-sm font-semibold text-slate-300 mt-1.5 mb-1 first:mt-0" {...props} />
    ),
    h5: ({ ...props }) => (
      <h5 className="text-xs font-semibold text-slate-300 mt-1 mb-0.5 first:mt-0" {...props} />
    ),
    h6: ({ ...props }) => (
      <h6 className="text-xs font-semibold text-slate-400 mt-1 mb-0.5 first:mt-0" {...props} />
    ),

    // Paragraphs - compact spacing
    p: ({ ...props }) => (
      <p className="text-sm text-slate-300 leading-relaxed mb-2 last:mb-0" {...props} />
    ),

    // Lists - tighter spacing
    ul: ({ ...props }) => (
      <ul className="list-disc list-inside text-sm text-slate-300 mb-2 space-y-0.5" {...props} />
    ),
    ol: ({ ...props }) => (
      <ol className="list-decimal list-inside text-sm text-slate-300 mb-2 space-y-0.5" {...props} />
    ),
    li: ({ ...props }) => (
      <li className="text-sm text-slate-300" {...props} />
    ),

    // Links - safe and mobile-friendly
    a: ({ ...props }) => (
      <a
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline break-words"
        {...props}
      />
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
    blockquote: ({ ...props }) => (
      <blockquote className="border-l-4 border-slate-600 pl-3 py-1 my-2 italic text-slate-400 text-sm" {...props} />
    ),

    // Horizontal rules
    hr: ({ ...props }) => <hr className="border-slate-700 my-3" {...props} />,

    // Tables - compact mobile-friendly
    table: ({ ...props }) => (
      <div className="overflow-x-auto mb-2">
        <table className="min-w-full text-xs border-collapse border border-slate-700" {...props} />
      </div>
    ),
    th: ({ ...props }) => (
      <th className="border border-slate-700 bg-slate-800 px-2 py-1 text-left font-semibold text-slate-200" {...props} />
    ),
    td: ({ ...props }) => (
      <td className="border border-slate-700 px-2 py-1 text-slate-300" {...props} />
    ),

    // Strong/Bold
    strong: ({ ...props }) => (
      <strong className="font-bold text-slate-200" {...props} />
    ),

    // Emphasis/Italic
    em: ({ ...props }) => (
      <em className="italic text-slate-300" {...props} />
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
