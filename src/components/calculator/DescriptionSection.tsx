"use client";

import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

type DescriptionSectionProps = {
  title: string;
  summary: string;
  formulas: string;
  rCode: string;
  references: string[];
};

const renderContentWithCenteredMath = (text: string) => {
  // Split the text by math delimiters ($...$), preserving the delimiters.
  // The 's' flag allows '.' to match newline characters, for multi-line math.
  const parts = text.split(/(\$.*?\$)/s);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.substring(1, part.length - 1);

          // Heuristic to determine if the math should be a block element (centered).
          // A block if:
          // 1. The math content itself contains newlines (e.g., an array environment).
          // 2. It's surrounded by newlines (or document boundaries), meaning it was on its own line.
          const prevPart = index > 0 ? parts[index - 1] : '';
          const nextPart = index < parts.length - 1 ? parts[index + 1] : '';
          const isBlock =
            math.includes('\n') ||
            ((prevPart.trim() === '' || prevPart.endsWith('\n')) &&
             (nextPart.trim() === '' || nextPart.startsWith('\n')));

          if (isBlock) {
            return (
              <div key={index} className="text-center">
                <InlineMath math={math} />
              </div>
            );
          }
          return <InlineMath key={index} math={math} />;
        } else {
          // For text parts, render them while preserving whitespace and newlines.
          return (
            <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
              {part}
            </span>
          );
        }
      })}
    </>
  );
};

export function DescriptionSection({ title, summary, formulas, rCode, references }: DescriptionSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-8">{title}</h1>
        <div className="">
          {renderContentWithCenteredMath(summary)}
        </div>
      </div>
      <hr />
      <div>
        <h2 className="text-xl font-semibold mb-4">Formulas</h2>
        <div className="p-4 border rounded-md">
          {renderContentWithCenteredMath(formulas)}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">R Code</h2>
        <SyntaxHighlighter language="r" showLineNumbers={true} style={vs} customStyle={{ fontSize: '1rem' }}>
          {rCode}
        </SyntaxHighlighter>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">References</h2>
          {references.map((ref, index) => (
        <div className="p-4 border-l-4 rounded-md bg-muted space-y-2 mb-4" key={index}>
            <p key={index} className="italic">{ref}</p>
        </div>
          ))}
      </div>
    </div>
  );
}
