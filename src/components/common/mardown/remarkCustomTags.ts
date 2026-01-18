import { visit, SKIP } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, PhrasingContent, Parent, InlineCode } from 'mdast';
import {
  EDITOR_TAGS,
  DICE_NOTATION_REGEX,
  DICE_NOTATION_TEST_REGEX,
  MARKDOWN_LINK_PROTECTION_REGEX,
  CUSTOM_TAG_PREFIX,
  DICE_NOTATION_PREFIX,
  TAG_COMPONENT_SEPARATOR
} from '../../../constants';

/**
 * Remark plugin that processes custom D&D tags and dice notation
 *
 * How it works:
 * 1. Iterates through each child of parent nodes individually
 * 2. Preserves non-text nodes (strong, emphasis, link, etc.) as-is
 * 3. For text nodes: decodes base64-encoded links (protected by MarkdownRenderer preprocessing)
 * 4. Processes custom tags ({spell: ...}, {dmg: ...}, etc.) into inlineCode nodes
 * 5. Processes dice notation (2d6+3) into inlineCode nodes
 *
 * Note: Runs BEFORE remarkGfm, but base64 encoding is still needed because
 * the core markdown parser extracts links before ANY plugins run.
 */
export const remarkCustomTags: Plugin<[], Root> = () => {
  return (tree) => {
    // Visit parent nodes that can contain phrasing content
    visit(tree, (node) => {
      // Type guard: Only process nodes that are Parent types (have children)
      if (!('children' in node) || !Array.isArray(node.children) || node.children.length === 0) {
        return;
      }

      const parentNode = node as Parent;

      // Check if any child contains code (skip entire parent if so)
      for (const child of parentNode.children) {
        if (child.type === 'inlineCode' || child.type === 'code') {
          // Skip code blocks - don't process tags inside code
          return;
        }
      }

      // Check if there are any text children to process
      const hasTextChildren = parentNode.children.some(
        (child) => child.type === 'text' && 'value' in child
      );

      // If no text children, let visit continue to nested nodes
      if (!hasTextChildren) {
        return;
      }

      // Process each child individually, preserving non-text nodes (strong, emphasis, link, etc.)
      const newChildren: PhrasingContent[] = [];

      for (const child of parentNode.children) {
        // Only process text nodes - preserve everything else (strong, emphasis, link, etc.)
        if (child.type !== 'text' || !('value' in child)) {
          newChildren.push(child as PhrasingContent);
          continue;
        }

        // Process this text node for custom tags and dice notation
        let text = child.value as string;

        // Decode base64-encoded links back to markdown link syntax
        // MarkdownRenderer uses base64 to protect [text](url) from being extracted by markdown parser
        text = text.replace(MARKDOWN_LINK_PROTECTION_REGEX, (_match, base64Data) => {
          try {
            return atob(base64Data);
          } catch (e) {
            console.error('[remarkCustomTags] Failed to decode base64:', base64Data, e);
            return _match; // Return original if decode fails
          }
        });

        // Process this text segment for tags and dice notation
        let segments: (string | PhrasingContent)[] = [text];

        // Step 1: Process custom tags ({spell: content}, {dmg: content}, etc.)
        EDITOR_TAGS.forEach((tag) => {
          segments = segments.flatMap((segment): (string | PhrasingContent)[] => {
            // Only process string segments
            if (typeof segment !== 'string') return [segment];

            const parts: (string | InlineCode)[] = [];
            let lastIndex = 0;

            // CRITICAL: Reset lastIndex to 0 before each matchAll to avoid stale state
            tag.pattern.lastIndex = 0;
            const matches = [...segment.matchAll(tag.pattern)];

            // If no matches, return segment unchanged
            if (matches.length === 0) return [segment];

            // Process each match
            matches.forEach((match) => {
              const matchIndex = match.index!;
              const content = match[1].trim();

              // Add text before match
              if (matchIndex > lastIndex) {
                parts.push(segment.substring(lastIndex, matchIndex));
              }

              // Extract tag type from pattern (e.g., 'spell' from /\{spell:\s*([^}]+)\}/gi)
              const tagTypeMatch = tag.pattern.source.match(/\{(\w+):/);
              const tagType = tagTypeMatch ? tagTypeMatch[1] : 'unknown';

              // Create inlineCode node with special prefix that we can detect and render
              // ReactMarkdown DOES know how to render inlineCode nodes
              const codeNode: InlineCode = {
                type: 'inlineCode',
                value: `${CUSTOM_TAG_PREFIX}${TAG_COMPONENT_SEPARATOR}${tagType}${TAG_COMPONENT_SEPARATOR}${content}${TAG_COMPONENT_SEPARATOR}${tag.className}`,
              };

              parts.push(codeNode);
              lastIndex = matchIndex + match[0].length;
            });

            // Add remaining text after last match
            if (lastIndex < segment.length) {
              parts.push(segment.substring(lastIndex));
            }

            return parts;
          });
        });

        // Step 2: Process dice notation (2d6+3, 1d20, etc.)
        segments = segments.flatMap((segment): (string | PhrasingContent)[] => {
          // Only process string segments
          if (typeof segment !== 'string') return [segment];

          const parts = segment.split(DICE_NOTATION_REGEX);
          return parts.map((part): string | InlineCode => {
            if (DICE_NOTATION_TEST_REGEX.test(part)) {
              // Use inlineCode node with special prefix
              const diceNode: InlineCode = {
                type: 'inlineCode',
                value: `${DICE_NOTATION_PREFIX}${TAG_COMPONENT_SEPARATOR}${part}`,
              };
              return diceNode;
            }
            return part;
          });
        });

        // Step 3: Add processed segments to newChildren
        segments.forEach((segment) => {
          if (typeof segment === 'string') {
            // Only add non-empty text nodes
            if (segment.length > 0) {
              newChildren.push({ type: 'text', value: segment });
            }
          } else {
            newChildren.push(segment);
          }
        });
      }

      // Step 4: Replace parent's children with processed children
      parentNode.children = newChildren;

      // Don't visit children since we just replaced them
      return SKIP;
    });
  };
};
