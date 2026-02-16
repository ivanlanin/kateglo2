/**
 * @fileoverview Shared content state components for search pages
 */

import { Link } from 'react-router-dom';

function QueryFeedback({ isLoading, isError, loadingText, errorText }) {
  return (
    <>
      {isLoading && <p className="secondary-text">{loadingText}</p>}
      {isError && <p className="error-text">{errorText}</p>}
    </>
  );
}

function EmptyInfoCard({ text }) {
  return (
    <div className="content-card p-6">
      <p className="muted-text">{text}</p>
    </div>
  );
}

function EmptyResultText({ text, padded = false }) {
  return <p className={`muted-text${padded ? ' p-4' : ''}`}>{text}</p>;
}

function TableResultCard({ isEmpty, emptyText, children, footer }) {
  return (
    <div className="content-card overflow-hidden">
      {isEmpty ? <EmptyResultText text={emptyText} padded /> : children}
      {!isEmpty && footer}
    </div>
  );
}

function PesanTidakDitemukan({ saran = [] }) {
  return (
    <p className="muted-text">
      Entri tersebut belum tersedia di Kateglo.
      {saran.length > 0 && (
        <span>
          {' '}Mungkin mau lihat{' '}
          {saran.map((kata, i) => (
            <span key={kata}>
              <Link
                to={`/kamus/detail/${encodeURIComponent(kata)}`}
                className="link-action font-semibold"
              >
                {kata}
              </Link>
              {i < saran.length - 2 && ', '}
              {i === saran.length - 2 && ', atau '}
            </span>
          ))}
          ?
        </span>
      )}
    </p>
  );
}

export {
  QueryFeedback,
  EmptyInfoCard,
  EmptyResultText,
  PesanTidakDitemukan,
  TableResultCard,
};
