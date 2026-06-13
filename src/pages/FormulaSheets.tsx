import React from 'react';
import { Link } from 'react-router-dom';

const FORMULA_PDF_PATH = '/downloads/solutions/Important Formulas.pdf';

const FormulaSheets: React.FC = () => {
  return (
    <section className="min-h-screen bg-zinc-900 text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Past Papers</p>
            <h1 className="mt-2 text-3xl font-semibold">Formula Sheets</h1>
          </div>
          <Link
            to="/pastpapers"
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Back
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
          <iframe
            title="Important Formulas PDF"
            src={FORMULA_PDF_PATH}
            className="h-[80vh] w-full"
          />
        </div>

        <p className="mt-3 text-sm text-zinc-400">
          If preview fails in your browser, open directly:
          {' '}
          <a className="text-emerald-300 hover:text-emerald-200" href={FORMULA_PDF_PATH} target="_blank" rel="noreferrer">
            Important Formulas.pdf
          </a>
        </p>
      </div>
    </section>
  );
};

export default FormulaSheets;
