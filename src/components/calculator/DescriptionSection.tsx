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
  return text.split('\n').map((line, index) => {
    const trimmedLine = line.trim();
    // Check if the line contains only a single KaTeX expression
    if (trimmedLine.startsWith('$') && trimmedLine.endsWith('$') && trimmedLine.match(/\$/g)?.length === 2) {
      const math = trimmedLine.substring(1, trimmedLine.length - 1);
      return (
        <div key={index} className="text-center">
          <InlineMath math={math} />
        </div>
      );
    }

    // Otherwise, render the line with possible inline math
    return (
      <div key={index}>
        {line.split('$').map((part, i) =>
          i % 2 === 1 ? (
            <InlineMath key={i} math={part} />
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </div>
    );
  });
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
        <SyntaxHighlighter language="r" style={vs} customStyle={{ fontSize: '1rem' }}>
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
