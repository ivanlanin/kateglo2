/**
 * @fileoverview Alat analisis teks lokal untuk menghitung statistik dan rincian teks.
 */

import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import KontenMarkdownStatis from '../../../components/tampilan/KontenMarkdownStatis';

const THRESHOLD = 25;
const contohTeks = `Bahasa berkembang bersama cara kita memakainya.

Sebuah paragraf bisa terdiri atas beberapa kalimat. Kerapian tanda baca juga memengaruhi cara mesin menghitungnya.`;

const formatAngka = new Intl.NumberFormat('id-ID');
const formatDesimal = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function escapeSingleQuotes(text = '') {
  return String(text).replace(/'/g, '\u2019');
}

function bersihkanTeks(text = '') {
  return String(text)
    .replace(/[()[\]{}]/g, '')
    .replace(/–/g, ' ')
    .replace(/[^a-zA-Z0-9\s'.!?%:-]/g, '');
}

function pecahKalimat(text = '') {
  return String(text)
    .split(/[.!?]+\s*/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function pecahKata(text = '') {
  return String(text)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function bagiAman(pembilang, penyebut) {
  return penyebut ? pembilang / penyebut : 0;
}

function getThresholdClass(value) {
  return value > THRESHOLD ? 'alat-stat-value-danger' : 'alat-stat-value-safe';
}

function getParagraphSummaryClass(isLong) {
  return `alat-paragraph-summary ${isLong ? 'alat-paragraph-summary-danger' : 'alat-paragraph-summary-safe'}`;
}

function getSentenceClass(sentence) {
  return `alat-sentence-item ${sentence.isLong ? 'alat-sentence-item-danger' : 'alat-sentence-item-safe'}${sentence.canToggle ? ' alat-sentence-item-toggle' : ''}`;
}

function bangunFrekuensiKata(sentences = []) {
  const wordFrequency = {};

  sentences.forEach((sentence) => {
    const sentenceWords = pecahKata(sentence);
    sentenceWords.forEach((originalWord, index) => {
      let word = originalWord;

      if (index === 0) {
        word = word.toLowerCase();
      } else if (word[0] === word[0].toUpperCase()) {
        word = originalWord;
      } else {
        word = word.toLowerCase();
      }

      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
  });

  return wordFrequency;
}

function kelompokkanFrekuensi(wordFrequency = {}) {
  const numbers = [];
  const properNouns = [];
  const commonWordsMoreThanOnce = [];
  const commonWordsOnce = [];

  Object.entries(wordFrequency)
    .sort((a, b) => {
      if (b[1] === a[1]) {
        return a[0].localeCompare(b[0], 'id');
      }

      return b[1] - a[1];
    })
    .forEach(([word, count]) => {
      const label = `${word} (${count})`;
      if (/^\d+([.,]\d+)?%?[.,!?]?$/.test(word) || /^\d{1,2}[:.]\d{2}[.,!?]?$/.test(word)) {
        numbers.push(label);
      } else if (word[0] === word[0].toUpperCase()) {
        properNouns.push(label);
      } else if (count > 1) {
        commonWordsMoreThanOnce.push(label);
      } else {
        commonWordsOnce.push(label);
      }
    });

  return {
    numbers,
    properNouns,
    commonWordsMoreThanOnce,
    commonWordsOnce,
  };
}

function analisisTeks(text = '') {
  const teksAsli = String(text || '').trim();
  if (!teksAsli) return null;

  const cleanedText = bersihkanTeks(teksAsli);
  const paragraphs = cleanedText.split(/\n+/).filter((paragraph) => paragraph.length > 0);
  const sentences = pecahKalimat(cleanedText);
  const words = pecahKata(cleanedText);
  const letters = words.join('').length;
  const wordFrequency = bangunFrekuensiKata(sentences);
  const frequency = kelompokkanFrekuensi(wordFrequency);

  const averageSentencesPerParagraphRaw = bagiAman(sentences.length, paragraphs.length);
  const averageWordsPerSentenceRaw = bagiAman(words.length, sentences.length);
  const averageLettersPerWordRaw = bagiAman(letters, words.length);

  const paragraphDetails = paragraphs.map((paragraph, paragraphIndex) => {
    const paragraphSentences = pecahKalimat(paragraph);
    const paragraphWords = pecahKata(paragraph);
    const firstTwoWords = paragraphWords.slice(0, 2).join(' ');
    const preview = paragraphWords.length > 2 ? `${firstTwoWords} ...` : firstTwoWords;
    const avgWordsPerSentenceRaw = paragraphSentences.length
      ? paragraphWords.length / paragraphSentences.length
      : 0;

    const sentenceList = paragraphSentences.map((sentence, sentenceIndex) => {
      const sentenceWords = pecahKata(sentence);
      const wordCount = sentenceWords.length;
      const sentencePreview = sentenceWords.length > 2
        ? `${sentenceWords.slice(0, 2).join(' ')} ....`
        : `${sentenceWords.join(' ')}.`;
      const fullSentence = `${sentence}.`;

      return {
        id: `${paragraphIndex}-${sentenceIndex}`,
        wordCount,
        preview: sentencePreview,
        fullSentence,
        isLong: wordCount > THRESHOLD,
        canToggle: sentenceWords.length > 2,
      };
    });

    return {
      id: `${paragraphIndex}`,
      sentences: paragraphSentences.length,
      words: paragraphWords.length,
      avgWordsPerSentenceRaw,
      preview,
      previewText: preview,
      isLong: avgWordsPerSentenceRaw > THRESHOLD,
      sentenceList,
      previewData: escapeSingleQuotes(preview),
    };
  });

  return {
    paragraphs,
    sentences,
    words,
    letters,
    averageSentencesPerParagraphRaw,
    averageWordsPerSentenceRaw,
    averageLettersPerWordRaw,
    averageSentencesPerParagraph: formatDesimal.format(averageSentencesPerParagraphRaw),
    averageWordsPerSentence: formatDesimal.format(averageWordsPerSentenceRaw),
    averageLettersPerWord: formatDesimal.format(averageLettersPerWordRaw),
    frequency,
    paragraphDetails,
  };
}

function AnalisisTeks() {
  const [teksMasukan, setTeksMasukan] = useState('');
  const [teksAnalisis, setTeksAnalisis] = useState('');
  const [pesanGalat, setPesanGalat] = useState('');
  const [tabHasilAktif, setTabHasilAktif] = useState('paragraf');
  const [panelInfoTerbuka, setPanelInfoTerbuka] = useState(false);

  const hasil = useMemo(() => analisisTeks(teksAnalisis), [teksAnalisis]);
  const adaHasil = Boolean(hasil);

  const handleAnalisis = (event) => {
    event.preventDefault();

    if (!teksMasukan.trim()) {
      setPesanGalat('Silakan masukkan teks terlebih dahulu.');
      return;
    }

    setPesanGalat('');
    setTeksAnalisis(teksMasukan);
    setTabHasilAktif('paragraf');
  };

  const handleBersihkan = () => {
    setTeksMasukan('');
    setTeksAnalisis('');
    setPesanGalat('');
    setTabHasilAktif('paragraf');
  };

  const handleIsiContoh = () => {
    setTeksMasukan(contohTeks);
    setTeksAnalisis(contohTeks);
    setPesanGalat('');
    setTabHasilAktif('paragraf');
  };

  return (
    <HalamanPublik
      judul="Analisis Teks"
      deskripsi="Alat untuk menghitung jumlah paragraf, kalimat, kata, huruf rata-rata, serta rincian frekuensi teks bahasa Indonesia."
      tampilkanJudul={false}
    >
      <div className="alat-page">
        <div className="alat-heading-row">
          <h1 className="alat-page-heading">Analisis Teks</h1>
          <button
            type="button"
            className="alat-heading-info-button"
            aria-label={panelInfoTerbuka ? 'Kembali ke alat' : 'Lihat informasi alat'}
            onClick={() => setPanelInfoTerbuka((value) => !value)}
          >
            <Info size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        {panelInfoTerbuka ? (
          <section className="alat-panel alat-info-panel">
            <KontenMarkdownStatis
              src="/halaman/alat/analisis-teks.md"
              className="halaman-markdown-content"
              loadingText="Memuat informasi alat ..."
              errorText="Gagal memuat informasi alat."
            />
          </section>
        ) : (
          <div className="alat-tool-layout">
          <section className="alat-panel" aria-labelledby="alat-input-title">
            <div className="alat-panel-header alat-panel-header-split">
              <h2 id="alat-input-title" className="alat-panel-title">Masukan</h2>
              <button type="button" className="alat-link-secondary alat-panel-action-button" onClick={handleIsiContoh}>Isi contoh</button>
            </div>

            <form onSubmit={handleAnalisis} className="alat-form">
              <label htmlFor="alat-teks" className="sr-only">Teks untuk dianalisis</label>
              <textarea
                id="alat-teks"
                className="alat-textarea"
                value={teksMasukan}
                onChange={(event) => setTeksMasukan(event.target.value)}
                placeholder="Tempel atau ketik teks di sini …"
                rows={14}
              />

              {pesanGalat ? <p className="alat-error-text">{pesanGalat}</p> : null}

              <div className="alat-actions">
                <button type="submit" className="alat-link-primary">Analisis</button>
                <button type="button" className="alat-link-secondary" onClick={handleBersihkan}>Bersihkan</button>
              </div>
            </form>
          </section>

          <section className="alat-panel" aria-labelledby="alat-output-title">
            <div className="alat-panel-header">
              <h2 id="alat-output-title" className="alat-panel-title">Hasil</h2>
            </div>

            <div className="alat-summary-stack" aria-label="Ringkasan analisis teks">
              <div className="alat-stat-grid-row">
                <article className="alat-stat-card">
                  <span className="alat-stat-label">Paragraf</span>
                  <strong className="alat-stat-value">{formatAngka.format(hasil?.paragraphs.length || 0)}</strong>
                </article>
                <article className="alat-stat-card">
                  <span className="alat-stat-label">Kalimat</span>
                  <strong className="alat-stat-value">{formatAngka.format(hasil?.sentences.length || 0)}</strong>
                </article>
                <article className="alat-stat-card">
                  <span className="alat-stat-label">Kata</span>
                  <strong className="alat-stat-value">{formatAngka.format(hasil?.words.length || 0)}</strong>
                </article>
              </div>
              <div className="alat-stat-grid-row alat-stat-grid-row-tight">
                <article className="alat-stat-card">
                  <span className="alat-stat-label">Kalimat/Paragraf</span>
                  <strong className={`alat-stat-value ${getThresholdClass(hasil?.averageSentencesPerParagraphRaw || 0)}`}>
                    {hasil?.averageSentencesPerParagraph || '0,00'}
                  </strong>
                </article>
                <article className="alat-stat-card">
                  <span className="alat-stat-label">Kata/Kalimat</span>
                  <strong className={`alat-stat-value ${getThresholdClass(hasil?.averageWordsPerSentenceRaw || 0)}`}>
                    {hasil?.averageWordsPerSentence || '0,00'}
                  </strong>
                </article>
                <article className="alat-stat-card">
                  <span className="alat-stat-label">Karakter/Kata</span>
                  <strong className="alat-stat-value">{hasil?.averageLettersPerWord || '0,00'}</strong>
                </article>
              </div>
            </div>

            <div className="alat-result-pills" role="tablist" aria-label="Kategori hasil analisis teks">
              <button
                id="alat-pill-paragraf"
                type="button"
                role="tab"
                aria-selected={tabHasilAktif === 'paragraf'}
                aria-controls="alat-hasil-paragraf"
                className={`alat-pill-button ${tabHasilAktif === 'paragraf' ? 'alat-pill-button-active' : ''}`}
                onClick={() => setTabHasilAktif('paragraf')}
              >
                Detail Paragraf
              </button>
              <button
                id="alat-pill-frekuensi"
                type="button"
                role="tab"
                aria-selected={tabHasilAktif === 'frekuensi'}
                aria-controls="alat-hasil-frekuensi"
                className={`alat-pill-button ${tabHasilAktif === 'frekuensi' ? 'alat-pill-button-active' : ''}`}
                onClick={() => setTabHasilAktif('frekuensi')}
              >
                Frekuensi Kata
              </button>
            </div>

            <div className="alat-result-stack">
              <section
                id="alat-hasil-paragraf"
                role="tabpanel"
                aria-labelledby="alat-pill-paragraf"
                hidden={tabHasilAktif !== 'paragraf'}
                className="alat-subpanel"
              >
                {adaHasil ? (
                  <ol className="alat-paragraph-list alat-subpanel-body">
                    {hasil.paragraphDetails.map((detail, index) => (
                      <li key={detail.id} className="alat-paragraph-item">
                        <article className={getParagraphSummaryClass(detail.isLong)}>
                          <div className="alat-paragraph-summary-header">
                            <span className="alat-paragraph-badge">Paragraf {index + 1}</span>
                            <div className="alat-paragraph-metrics" aria-label={`Ringkasan paragraf ${index + 1}`}>
                              <span className="alat-paragraph-metric">{formatAngka.format(detail.words)} kata</span>
                              <span className="alat-paragraph-metric">{formatAngka.format(detail.sentences)} kalimat</span>
                              <span className="alat-paragraph-metric">{formatDesimal.format(detail.avgWordsPerSentenceRaw)} kata/kalimat</span>
                            </div>
                          </div>
                          <p className="alat-paragraph-preview">{detail.previewText}</p>
                        </article>

                        {detail.sentenceList.length ? (
                          <details className="alat-paragraph-disclosure">
                            <summary className="alat-paragraph-disclosure-summary">
                              Lihat {formatAngka.format(detail.sentenceList.length)} kalimat
                            </summary>
                            <ol className="alat-sentence-list">
                              {detail.sentenceList.map((sentence, sentenceIndex) => (
                                <li key={sentence.id} className={getSentenceClass({ ...sentence, canToggle: false })}>
                                  <span className="alat-sentence-order">{sentenceIndex + 1}.</span>
                                  <span className="alat-sentence-count">{formatAngka.format(sentence.wordCount)} kata:</span>
                                  <span>{sentence.fullSentence}</span>
                                </li>
                              ))}
                            </ol>
                          </details>
                        ) : (
                          <p className="alat-empty-text alat-paragraph-empty">Belum ada kalimat yang terdeteksi pada paragraf ini.</p>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="alat-empty-text alat-subpanel-body">Belum ada rincian paragraf yang ditampilkan.</p>
                )}
              </section>

              <section
                id="alat-hasil-frekuensi"
                role="tabpanel"
                aria-labelledby="alat-pill-frekuensi"
                hidden={tabHasilAktif !== 'frekuensi'}
                className="alat-subpanel"
              >
                {adaHasil ? (
                  <div className="alat-frequency-groups alat-subpanel-body">
                    {hasil.frequency.commonWordsMoreThanOnce.length ? (
                      <div className="alat-frequency-group">
                        <strong>Kata (&gt;1x)</strong>
                        <p>{hasil.frequency.commonWordsMoreThanOnce.join(', ')}</p>
                      </div>
                    ) : null}
                    {hasil.frequency.commonWordsOnce.length ? (
                      <div className="alat-frequency-group">
                        <strong>Kata (1x)</strong>
                        <p>{hasil.frequency.commonWordsOnce.join(', ')}</p>
                      </div>
                    ) : null}
                    {hasil.frequency.numbers.length ? (
                      <div className="alat-frequency-group">
                        <strong>Angka</strong>
                        <p>{hasil.frequency.numbers.join(', ')}</p>
                      </div>
                    ) : null}
                    {hasil.frequency.properNouns.length ? (
                      <div className="alat-frequency-group">
                        <strong>Nama/Singkatan</strong>
                        <p>{hasil.frequency.properNouns.join(', ')}</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="alat-empty-text alat-subpanel-body">Belum ada frekuensi yang ditampilkan.</p>
                )}
              </section>
            </div>
          </section>
          </div>
        )}
      </div>
    </HalamanPublik>
  );
}

export const __private = {
  analisisTeks,
  kelompokkanFrekuensi,
  escapeSingleQuotes,
  bersihkanTeks,
  pecahKalimat,
  pecahKata,
  bagiAman,
  getThresholdClass,
  getParagraphSummaryClass,
  getSentenceClass,
};

export default AnalisisTeks;