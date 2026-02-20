/**
 * @fileoverview Shared content state components for search pages
 */

import { Link } from 'react-router-dom';
import { buatPathDetailKamus } from '../../utils/paramUtils';

function resolveErrorText(error, defaultText) {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (status === 429) {
    return 'Untuk menjaga stabilitas dan keadilan layanan, permintaan per pengguna dibatasi 60 kali/15 menit. Harap coba lagi nanti, ya.';
  }

  if (status === 400 && typeof serverMessage === 'string' && serverMessage.includes('Offset maksimal')) {
    return 'Jangkauan halaman sudah melebihi batas. Silakan kembali ke halaman sebelumnya atau ulangi pencarian.';
  }

  if (typeof serverMessage === 'string' && serverMessage.trim()) {
    return serverMessage;
  }

  return defaultText;
}

function QueryFeedback({ isLoading, isError, error, loadingText, errorText }) {
  const resolvedErrorText = resolveErrorText(error, errorText);

  return (
    <>
      {isLoading && <p className="secondary-text">{loadingText}</p>}
      {isError && <p className="error-text">{resolvedErrorText}</p>}
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
                to={buatPathDetailKamus(kata)}
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
