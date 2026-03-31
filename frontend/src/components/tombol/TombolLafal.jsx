import { useCallback, useEffect, useRef, useState } from 'react';

function TombolLafal({ kata, size = 'default' }) {
  const [sedangBicara, setSedangBicara] = useState(false);
  const utteranceRef = useRef(null);

  const didukung = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const kelasUkuran = size === 'large' ? ' tombol-lafal-large' : '';
  const kelasIkon = size === 'large' ? 'h-6 w-6' : 'h-5 w-5';

  const ucapkan = useCallback(() => {
    if (!didukung || !kata) return;

    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
      setSedangBicara(false);
      return;
    }

    const kataBersih = String(kata).replace(/\s*\(\d+\)$/, '');
    const utterance = new SpeechSynthesisUtterance(kataBersih);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;

    const voices = synth.getVoices();
    const voiceId = voices.find((voice) => voice.lang.startsWith('id'));
    if (voiceId) {
      utterance.voice = voiceId;
    }

    utterance.onstart = () => setSedangBicara(true);
    utterance.onend = () => setSedangBicara(false);
    utterance.onerror = () => setSedangBicara(false);
    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [didukung, kata]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
      }
      utteranceRef.current = null;
    };
  }, []);

  if (!didukung || !kata) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={ucapkan}
      className={`tombol-lafal${kelasUkuran}`}
      aria-label={sedangBicara ? 'Hentikan pelafalan' : `Dengarkan pelafalan ${kata}`}
      title={sedangBicara ? 'Hentikan' : 'Dengarkan pelafalan'}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className={kelasIkon} aria-hidden="true">
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        <path
          d="M15.54 8.46a5 5 0 0 1 0 7.07"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={sedangBicara ? 'lafal-wave-1' : ''}
        />
        <path
          d="M19.07 4.93a10 10 0 0 1 0 14.14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={sedangBicara ? 'lafal-wave-2' : ''}
        />
      </svg>
    </button>
  );
}

export default TombolLafal;