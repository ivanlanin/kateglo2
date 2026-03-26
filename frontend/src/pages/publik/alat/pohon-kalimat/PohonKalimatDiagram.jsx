/**
 * @fileoverview Komponen diagram SVG untuk merender pohon sintaksis kalimat.
 */

import { forwardRef } from 'react';
import { buatPohon, JENIS_FRASA, PERAN } from './pohonKalimatModel';

const CHAR_W = 7.2;
const NODUS_MIN_W = 48;
const SIBLING_GAP = 16;
const LEVEL_H = 68;
const FONT_SIZE = 13;
const FONT_FAMILY = 'Georgia, "Times New Roman", serif';
const PAD_X = 28;
const PAD_Y = 28;
const SVG_BG = '#ffffff';
const LEGEND_FONT = 10;
const LEGEND_LINE_H = 16;
const LEGEND_PAD = 24;

const KETERANGAN_SINGKATAN = new Map([
  ...PERAN.map((item) => [item.kode, item.label]),
  ...JENIS_FRASA.map((item) => [item.kode, item.label]),
]);

function susunBarisLegenda(entri, batasPanjang = 92) {
  const baris = [];
  let saatIni = '';

  entri.forEach((item) => {
    const kandidat = saatIni ? `${saatIni} · ${item}` : item;
    if (saatIni && kandidat.length > batasPanjang) {
      baris.push(saatIni);
      saatIni = item;
      return;
    }
    saatIni = kandidat;
  });

  if (saatIni) baris.push(saatIni);
  return baris;
}

function kumpulkanLegendaTerpakai(root) {
  const terpakai = new Set();

  function telusuri(nodus) {
    if (KETERANGAN_SINGKATAN.has(nodus.label)) {
      terpakai.add(`${nodus.label} = ${KETERANGAN_SINGKATAN.get(nodus.label)}`);
    }
    nodus.anak?.forEach(telusuri);
  }

  telusuri(root);
  return susunBarisLegenda(Array.from(terpakai));
}

function lebarNodus(label) {
  return Math.max(NODUS_MIN_W, label.length * CHAR_W + 8);
}

function lebarSubpohon(nodus) {
  if (!nodus.anak || nodus.anak.length === 0) {
    return lebarNodus(nodus.label);
  }
  const totalAnak = nodus.anak.reduce((sum, child) => sum + lebarSubpohon(child), 0);
  const gap = (nodus.anak.length - 1) * SIBLING_GAP;
  return Math.max(lebarNodus(nodus.label), totalAnak + gap);
}

function tetapkanPosisi(nodus, xMulai, y, lebar) {
  nodus.x = xMulai + lebar / 2;
  nodus.y = y;

  if (!nodus.anak || nodus.anak.length === 0) return;

  const lebarAnak = nodus.anak.map(lebarSubpohon);
  const totalAnak = lebarAnak.reduce((sum, width) => sum + width, 0);
  const totalGap = (nodus.anak.length - 1) * SIBLING_GAP;

  let xCursor = xMulai + (lebar - totalAnak - totalGap) / 2;
  nodus.anak.forEach((child, index) => {
    tetapkanPosisi(child, xCursor, y + LEVEL_H, lebarAnak[index]);
    xCursor += lebarAnak[index] + SIBLING_GAP;
  });
}

function kumpulkanNodus(nodus, daftarNodus = [], daftarSisi = []) {
  daftarNodus.push(nodus);
  if (nodus.anak) {
    nodus.anak.forEach((child) => {
      daftarSisi.push({ dari: nodus, ke: child });
      kumpulkanNodus(child, daftarNodus, daftarSisi);
    });
  }
  return { daftarNodus, daftarSisi };
}

function hitungLayout(rootMentah) {
  const root = JSON.parse(JSON.stringify(rootMentah));
  const lebar = lebarSubpohon(root);
  tetapkanPosisi(root, PAD_X, PAD_Y + FONT_SIZE / 2, lebar);
  return kumpulkanNodus(root);
}

const PohonKalimatDiagram = forwardRef(function PohonKalimatDiagram({ state, berwarna }, ref) {
  const rootMentah = buatPohon(state, berwarna);
  const { daftarNodus, daftarSisi } = hitungLayout(rootMentah);
  const barisLegenda = kumpulkanLegendaTerpakai(rootMentah);

  const maxX = daftarNodus.reduce((max, nodus) => Math.max(max, nodus.x), 0);
  const maxYBrut = daftarNodus.reduce((max, nodus) => Math.max(max, nodus.y), 0);

  const treeSvgH = maxYBrut + PAD_Y + FONT_SIZE;
  const legendH = barisLegenda.length ? LEGEND_PAD + LEGEND_LINE_H * barisLegenda.length + 8 : 0;
  const legendW = barisLegenda.reduce((max, baris) => Math.max(max, baris.length * (LEGEND_FONT * 0.62)), 0);
  const svgW = Math.max(maxX + PAD_X + NODUS_MIN_W / 2, legendW + PAD_X * 2);
  const svgH = treeSvgH + legendH;

  return (
    <svg
      ref={ref}
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: SVG_BG, display: 'block' }}
      aria-label="Pohon sintaksis kalimat"
    >
      <rect width={svgW} height={svgH} fill={SVG_BG} />

      {daftarSisi.map((sisi, index) => {
        return (
          <line
            key={index}
            x1={sisi.dari.x}
            y1={sisi.dari.y + FONT_SIZE * 0.6}
            x2={sisi.ke.x}
            y2={sisi.ke.y - FONT_SIZE * 0.8}
            stroke="#d1d5db"
            strokeWidth="1"
          />
        );
      })}

      {daftarNodus.map((nodus) => {
        return (
          <text
            key={nodus.id}
            x={nodus.x}
            y={nodus.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={FONT_SIZE}
            fontFamily={FONT_FAMILY}
            fill={nodus.warna}
          >
            {nodus.label}
          </text>
        );
      })}

      {barisLegenda.length > 0 && (
        <>
          <line
            x1={PAD_X}
            y1={treeSvgH + 8}
            x2={svgW - PAD_X}
            y2={treeSvgH + 8}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          {barisLegenda.map((baris, index) => (
            <text
              key={index}
              x={PAD_X}
              y={treeSvgH + LEGEND_PAD + index * LEGEND_LINE_H}
              textAnchor="start"
              dominantBaseline="middle"
              fontSize={LEGEND_FONT}
              fontFamily={FONT_FAMILY}
              fill="#6b7280"
            >
              {baris}
            </text>
          ))}
        </>
      )}
    </svg>
  );
});

export default PohonKalimatDiagram;

export function unduPng(svgEl, namaFile = 'pohon-kalimat.png') {
  const data = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const skala = 2;
    const lebar = svgEl.viewBox.baseVal.width * skala;
    const tinggi = svgEl.viewBox.baseVal.height * skala;
    const canvas = document.createElement('canvas');
    canvas.width = lebar;
    canvas.height = tinggi;
    const ctx = canvas.getContext('2d');
    ctx.scale(skala, skala);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, lebar, tinggi);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((pngBlob) => {
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(pngBlob);
      anchor.download = namaFile;
      anchor.click();
    });
    URL.revokeObjectURL(url);
  };
  img.src = url;
}
