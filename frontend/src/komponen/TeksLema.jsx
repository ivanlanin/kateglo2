/**
 * @fileoverview Komponen formatter lema: "lema (1)" -> "lema¹" (superskrip)
 */

function pisahNomorHomonim(lema = '') {
  const teks = String(lema || '').trim();
  const match = teks.match(/^(.*)\s\((\d+)\)\s*$/);

  if (!match) {
    return { dasar: teks, nomor: null };
  }

  return {
    dasar: match[1],
    nomor: match[2],
  };
}

function TeksLema({ lema }) {
  const { dasar, nomor } = pisahNomorHomonim(lema);

  if (!nomor) {
    return dasar;
  }

  return (
    <>
      {dasar}
      <sup>{nomor}</sup>
    </>
  );
}

export default TeksLema;
