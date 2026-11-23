import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

/**
 * Custom CodeBlock with interactive Copy to Clipboard button.
 */
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLang = (language || 'code').toUpperCase();

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-sm text-left">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono font-medium">
          <Terminal className="w-3.5 h-3.5 text-brand-400" />
          <span>{displayLang}</span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px] font-medium"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed selection:bg-brand-600 selection:text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Format inline markdown tokens: bold, italic, inline code.
 */
function renderInline(text) {
  if (!text) return '';

  // Tokenize `code`, **bold**, *italic*
  const tokens = [];
  let remaining = text;
  let key = 0;

  // Regex for inline patterns: `code`, **bold**, *italic*
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      tokens.push(<span key={key++}>{text.substring(lastIndex, match.index)}</span>);
    }

    const chunk = match[0];
    if (chunk.startsWith('`') && chunk.endsWith('`')) {
      tokens.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-brand-700 font-mono text-[11px] border border-slate-200/80 font-medium"
        >
          {chunk.slice(1, -1)}
        </code>
      );
    } else if (chunk.startsWith('**') && chunk.endsWith('**')) {
      tokens.push(
        <strong key={key++} className="font-semibold text-slate-900">
          {chunk.slice(2, -2)}
        </strong>
      );
    } else if (chunk.startsWith('*') && chunk.endsWith('*')) {
      tokens.push(
        <em key={key++} className="italic text-slate-800">
          {chunk.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(<span key={key++}>{text.substring(lastIndex)}</span>);
  }

  return tokens.length > 0 ? tokens : text;
}

/**
 * Renders a Markdown table into styled responsive HTML table.
 */
function MarkdownTable({ tableLines }) {
  if (!tableLines || tableLines.length < 2) return null;

  const parseRow = (line) => {
    return line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
  };

  const headerRow = parseRow(tableLines[0]);
  // Line 1 is usually separator like |---|---|
  const dataRows = tableLines.slice(2).map(parseRow);

  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-slate-200/90 shadow-2xs">
      <table className="min-w-full text-xs divide-y divide-slate-200">
        <thead className="bg-slate-100 text-slate-800 font-semibold text-left">
          <tr>
            {headerRow.map((h, i) => (
              <th key={i} className="px-3.5 py-2.5 font-semibold text-slate-900">
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {dataRows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className={rIdx % 2 === 0 ? 'bg-white hover:bg-slate-50/70' : 'bg-slate-50/50 hover:bg-slate-50'}
            >
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3.5 py-2 text-slate-700 leading-normal">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Complete Academic Markdown Message Renderer.
 */
export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  // 1. Separate code blocks from non-code text
  const parts = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: content.substring(lastIndex, match.index) });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'code',
      code: match[2].trimEnd()
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.substring(lastIndex) });
  }

  return (
    <div className="space-y-2 text-left leading-relaxed">
      {parts.map((part, pIdx) => {
        if (part.type === 'code') {
          return <CodeBlock key={pIdx} language={part.language} code={part.code} />;
        }

        // Process text chunk lines
        const lines = part.text.split('\n');
        const elements = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];
          const trimmed = line.trim();

          if (!trimmed) {
            i++;
            continue;
          }

          // Markdown Table detection: starts with '|'
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            const tableLines = [];
            while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
              tableLines.push(lines[i].trim());
              i++;
            }
            elements.push(<MarkdownTable key={`table-${i}`} tableLines={tableLines} />);
            continue;
          }

          // Headings
          if (trimmed.startsWith('### ')) {
            elements.push(
              <h3 key={`h3-${i}`} className="text-xs sm:text-sm font-bold text-slate-900 mt-3 mb-1">
                {renderInline(trimmed.replace(/^###\s+/, ''))}
              </h3>
            );
            i++;
            continue;
          }
          if (trimmed.startsWith('## ')) {
            elements.push(
              <h2 key={`h2-${i}`} className="text-sm sm:text-base font-bold text-slate-900 mt-3.5 mb-1.5 pb-1 border-b border-slate-200/60">
                {renderInline(trimmed.replace(/^##\s+/, ''))}
              </h2>
            );
            i++;
            continue;
          }
          if (trimmed.startsWith('# ')) {
            elements.push(
              <h1 key={`h1-${i}`} className="text-base sm:text-lg font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200">
                {renderInline(trimmed.replace(/^#\s+/, ''))}
              </h1>
            );
            i++;
            continue;
          }

          // Bullet List: * or -
          if (/^[-*]\s+/.test(trimmed)) {
            const listItems = [];
            while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
              listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
              i++;
            }
            elements.push(
              <ul key={`ul-${i}`} className="space-y-1 my-1.5 pl-1">
                {listItems.map((item, lIdx) => (
                  <li key={lIdx} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <span>{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
            continue;
          }

          // Numbered List: 1. 2. etc.
          if (/^\d+\.\s+/.test(trimmed)) {
            const numItems = [];
            while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
              const itemMatch = lines[i].trim().match(/^(\d+)\.\s+(.*)$/);
              if (itemMatch) {
                numItems.push({ num: itemMatch[1], text: itemMatch[2] });
              }
              i++;
            }
            elements.push(
              <ol key={`ol-${i}`} className="space-y-1 my-1.5 pl-1">
                {numItems.map((item, nIdx) => (
                  <li key={nIdx} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="font-mono font-bold text-brand-600 text-[11px] shrink-0">
                      {item.num}.
                    </span>
                    <span>{renderInline(item.text)}</span>
                  </li>
                ))}
              </ol>
            );
            continue;
          }

          // Regular paragraph
          elements.push(
            <p key={`p-${i}`} className="text-xs text-slate-700 my-1 leading-relaxed">
              {renderInline(trimmed)}
            </p>
          );
          i++;
        }

        return <div key={pIdx} className="space-y-1">{elements}</div>;
      })}
    </div>
  );
}
