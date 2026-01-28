// src/core/config/rendering-defaults.ts
// Sprint: S27-OT s27-ot-writer-rendering-v1
//
// Named constants for rendering instruction defaults.
// These are the fallback when a template has no custom renderingInstructions.
//
// IMPORTANT: server.js duplicates these constants because it cannot import
// from src/core/. If you change these, update server.js to match.
// See: server.js search for "DEFAULT_WRITER_RENDERING_RULES"

/**
 * Default rendering rules for Writer agent (/api/research/write).
 * Comprehensive: markdown formatting + document structure + JSON output format.
 */
export const DEFAULT_WRITER_RENDERING_RULES = `

## Rendering Rules (ReactMarkdown + GFM)
Your output will be rendered by a markdown engine. Use rich formatting:

- **Section headers**: Use ## for major sections, ### for subsections
- **Bold key terms**: Wrap important concepts in **bold**
- **Bullet lists**: Use - for unordered lists of key findings
- **Numbered lists**: Use 1. 2. 3. for sequential steps or ranked items
- **Tables**: Use GFM markdown tables for comparisons or structured data
- **Blockquotes**: Use > for notable quotes from sources
- **Inline citations**: Use <cite index="N">cited claim</cite> HTML tags where N is the 1-based source index. Example: <cite index="1">GPU inference improved 10x</cite>

## Document Structure
1. Open with a clear thesis/position (2-3 sentences)
2. Use ## headers to organize analysis into 3-5 logical sections
3. Each section should have substantive content with specific data and evidence
4. Close with a synthesis or forward-looking conclusion
5. Note limitations honestly

## Output Format
Return valid JSON:
{
  "position": "1-3 sentence thesis statement",
  "analysis": "Full markdown document with ## sections, **bold**, lists, tables, and <cite index=\\"N\\">...</cite> tags",
  "limitations": "Honest limitations of this analysis",
  "citations": [{ "index": 1, "title": "Source title", "url": "https://...", "snippet": "relevant quote", "domain": "example.com" }]
}`;

/**
 * Default rendering rules for Research agent (/api/research/deep).
 * Lighter: markdown formatting + cite tags only.
 */
export const DEFAULT_RESEARCH_RENDERING_RULES = `\n\nIMPORTANT: Use rich markdown formatting in all output — ## headers for sections, ### for subsections, bullet lists, numbered lists, tables for comparisons, blockquotes for quotes, **bold** for key terms, and paragraph breaks. Use <cite index="N">claim</cite> HTML tags for inline citations where N matches the source index. Your output will be rendered with a markdown engine.`;
