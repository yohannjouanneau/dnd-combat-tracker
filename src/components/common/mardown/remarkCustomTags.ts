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
 * 1. Works at parent level to reconstruct text that markdown parser splits across nodes
 * 2. Decodes base64-encoded links (protected by MarkdownRenderer preprocessing)
 * 3. Processes custom tags ({spell: ...}, {dmg: ...}, etc.) into inlineCode nodes
 * 4. Processes dice notation (2d6+3) into inlineCode nodes
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

      // Reconstruct text from all text children
      let fullText = '';
      let hasTextChildren = false;

      for (const child of parentNode.children) {
        if (child.type === 'text') {
          fullText += child.value;
          hasTextChildren = true;
        } else if (child.type === 'inlineCode' || child.type === 'code') {
          // Skip code blocks - don't process tags inside code
          return;
        }
      }

      // If no text content, skip this node
      if (!hasTextChildren || fullText.length === 0) return;

      // Decode base64-encoded links back to markdown link syntax
      // MarkdownRenderer uses base64 to protect [text](url) from being extracted by markdown parser
      fullText = fullText.replace(MARKDOWN_LINK_PROTECTION_REGEX, (_match, base64Data) => {
        try {
          return atob(base64Data);
        } catch (e) {
          console.error('[remarkCustomTags] Failed to decode base64:', base64Data, e);
          return _match; // Return original if decode fails
        }
      });

      // Check if this text contains any tags
      let hasTags = false;
      for (const tag of EDITOR_TAGS) {
        if (tag.pattern.test(fullText)) {
          hasTags = true;
          break;
        }
      }

      if (!hasTags && !DICE_NOTATION_TEST_REGEX.test(fullText)) {
        // No tags or dice notation found, skip
        return;
      }

      // Process the full reconstructed text
      let segments: (string | PhrasingContent)[] = [fullText];

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

      // Step 3: Convert remaining strings to text nodes
      const finalSegments: PhrasingContent[] = [];
      segments.forEach((segment) => {
        if (typeof segment === 'string') {
          // Only add non-empty text nodes
          if (segment.length > 0) {
            finalSegments.push({
              type: 'text',
              value: segment
            });
          }
        } else {
          finalSegments.push(segment);
        }
      });

      // Step 4: Replace parent's children with processed segments
      parentNode.children = finalSegments;

      // Don't visit children since we just replaced them
      return SKIP;
    });
  };
};
