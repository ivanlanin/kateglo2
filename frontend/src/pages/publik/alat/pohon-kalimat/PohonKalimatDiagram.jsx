/**
 * @fileoverview Komponen diagram SVG untuk merender pohon sintaksis kalimat.
 */

import { forwardRef } from 'react';
import { buatPohon } from './pohonKalimatModel';

const CHAR_W = 7.2;
const NODE_MIN_W = 64;
const SIBLING_GAP = 16;
const LEVEL_H = 68;
const FONT_SIZE = 13;
const FONT_FAMILY = 'Georgia, "Times New Roman", serif';
const PAD_X = 28;
const PAD_Y = 28;
const SVG_BG = '#ffffff';

function lebarNode(label) {
  return Math.max(NODE_MIN_W, label.length * CHAR_W);
}

function lebarSubpohon(node) {
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

  if (!node.anak || node.anak.length === 0) return;

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
  if (node.anak) {
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
  const maxY = daftarNode.reduce((max, node) => Math.max(max, node.y), 0);
  const svgW = maxX + PAD_X + NODE_MIN_W / 2;
  const svgH = maxY + PAD_Y + FONT_SIZE;

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
      {daftarEdge.map((edge, index) => (
        <line
          key={index}
          x1={edge.dari.x}
          y1={edge.dari.y + FONT_SIZE * 0.6}
          x2={edge.ke.x}
          y2={edge.ke.y - FONT_SIZE * 0.8}
          stroke="#d1d5db"
          strokeWidth="1"
        />
      ))}
      {daftarNode.map((node) => (
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
