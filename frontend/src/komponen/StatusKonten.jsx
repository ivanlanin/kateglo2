/**
 * @fileoverview Shared content state components for search pages
 */

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

export {
  QueryFeedback,
  EmptyInfoCard,
  EmptyResultText,
  TableResultCard,
};
