/**
 * @fileoverview Komponen diagram SVG untuk merender pohon sintaksis kalimat.
 */

import { forwardRef } from 'react';
import { buatPohon } from './pohonKalimatModel';

const CHAR_W = 7.2;
const NODE_MIN_W = 48;
const SIBLING_GAP = 16;
const LEVEL_H = 68;
const FONT_SIZE = 13;
const FONT_FAMILY = 'Georgia, "Times New Roman", serif';
const PAD_X = 28;
const PAD_Y = 28;
const SVG_BG = '#ffffff';
const TRIANGLE_H = 36;
const LEGEND_FONT = 10;
const LEGEND_LINE_H = 16;
const LEGEND_PAD = 24;
const LEGEND_MIN_W = 520;

const BARIS_LEGENDA = [
  'S = Subjek · P = Predikat · O = Objek · Pel = Pelengkap · Ket = Keterangan · Konj = Konjungsi',
  'FN = Frasa Nominal · FV = Frasa Verbal · FAdj = Frasa Adjektival · FAdv = Frasa Adverbial · FNum = Frasa Numeralia · FPrep = Frasa Preposisional',
  'V = Verba · N = Nomina · Adj = Adjektiva · Adv = Adverbia · Pron = Pronomina',
];

function lebarNode(label) {
  return Math.max(NODE_MIN_W, label.length * CHAR_W + 8);
}

function lebarSubpohon(node) {
  if (node.segitiga) {
    return Math.max(lebarNode(node.label), lebarNode(node.teksSegitiga || '') + 24);
  }
  if (!node.anak || node.anak.length === 0) {
    return lebarNode(node.label);
  }
  const totalAnak = node.anak.reduce((sum, child) => sum + lebarSubpohon(child), 0);
  const gap = (node.anak.length - 1) * SIBLING_GAP;
  return Math.max(lebarNode(node.label), totalAnak + gap);
}

function tetapkanPosisi(node, xMulai, y, lebar) {
  node.x = xMulai + lebar / 2;
  node.y = y;

  if (!node.anak || node.anak.length === 0 || node.segitiga) return;

  const lebarAnak = node.anak.map(lebarSubpohon);
  const totalAnak = lebarAnak.reduce((sum, width) => sum + width, 0);
  const totalGap = (node.anak.length - 1) * SIBLING_GAP;

  let xCursor = xMulai + (lebar - totalAnak - totalGap) / 2;
  node.anak.forEach((child, index) => {
    tetapkanPosisi(child, xCursor, y + LEVEL_H, lebarAnak[index]);
    xCursor += lebarAnak[index] + SIBLING_GAP;
  });
}

function kumpulkanNode(node, daftarNode = [], daftarEdge = []) {
  daftarNode.push(node);
  if (node.anak && !node.segitiga) {
    node.anak.forEach((child) => {
      daftarEdge.push({ dari: node, ke: child });
      kumpulkanNode(child, daftarNode, daftarEdge);
    });
  }
  return { daftarNode, daftarEdge };
}

function hitungLayout(rootMentah) {
  const root = JSON.parse(JSON.stringify(rootMentah));
  const lebar = lebarSubpohon(root);
  tetapkanPosisi(root, PAD_X, PAD_Y + FONT_SIZE / 2, lebar);
  return kumpulkanNode(root);
}

const PohonKalimatDiagram = forwardRef(function PohonKalimatDiagram({ state, berwarna }, ref) {
  const rootMentah = buatPohon(state, berwarna);
  const { daftarNode, daftarEdge } = hitungLayout(rootMentah);

  const maxX = daftarNode.reduce((max, node) => Math.max(max, node.x), 0);
  const maxYBrut = daftarNode.reduce((max, node) => {
    if (node.segitiga) return Math.max(max, node.y + TRIANGLE_H + FONT_SIZE * 2);
    return Math.max(max, node.y);
  }, 0);

  const treeSvgH = maxYBrut + PAD_Y + FONT_SIZE;
  const legendH = LEGEND_PAD + LEGEND_LINE_H * BARIS_LEGENDA.length + 8;
  const svgW = Math.max(maxX + PAD_X + NODE_MIN_W / 2, LEGEND_MIN_W);
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

      {/* Garis penghubung */}
      {daftarEdge.map((edge, index) => {
        const keY = edge.ke.segitiga
          ? edge.ke.y + FONT_SIZE * 0.6
          : edge.ke.y - FONT_SIZE * 0.8;
        return (
          <line
            key={index}
            x1={edge.dari.x}
            y1={edge.dari.y + FONT_SIZE * 0.6}
            x2={edge.ke.x}
            y2={keY}
            stroke="#d1d5db"
            strokeWidth="1"
          />
        );
      })}

      {/* Node */}
      {daftarNode.map((node) => {
        if (node.segitiga) {
          const bw = Math.max(80, lebarNode(node.teksSegitiga || '') + 24);
          const ay = node.y + FONT_SIZE * 0.6;
          const by = ay + TRIANGLE_H;
          return (
            <g key={node.id}>
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={FONT_SIZE}
                fontFamily={FONT_FAMILY}
                fill={node.warna}
              >
                {node.label}
              </text>
              <polygon
                points={`${node.x},${ay} ${node.x - bw / 2},${by} ${node.x + bw / 2},${by}`}
                fill="none"
                stroke="#d1d5db"
                strokeWidth="1"
              />
              <text
                x={node.x}
                y={by + FONT_SIZE * 1.4}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={FONT_SIZE}
                fontFamily={FONT_FAMILY}
                fill="#111827"
              >
                {node.teksSegitiga}
              </text>
            </g>
          );
        }
        return (
          <text
            key={node.id}
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={FONT_SIZE}
            fontFamily={FONT_FAMILY}
            fill={node.warna}
          >
            {node.label}
          </text>
        );
      })}

      {/* Legenda */}
      <line
        x1={PAD_X}
        y1={treeSvgH + 8}
        x2={svgW - PAD_X}
        y2={treeSvgH + 8}
        stroke="#e5e7eb"
        strokeWidth="1"
      />
      {BARIS_LEGENDA.map((baris, i) => (
        <text
          key={i}
          x={PAD_X}
          y={treeSvgH + LEGEND_PAD + i * LEGEND_LINE_H}
          textAnchor="start"
          dominantBaseline="middle"
          fontSize={LEGEND_FONT}
          fontFamily={FONT_FAMILY}
          fill="#6b7280"
        >
          {baris}
        </text>
      ))}
    </svg>
  );
});

export default PohonKalimatDiagram;

export function unduSvg(svgEl, namaFile = 'pohon-kalimat.svg') {
  const data = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = namaFile;
  anchor.click();
  URL.revokeObjectURL(url);
}

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
