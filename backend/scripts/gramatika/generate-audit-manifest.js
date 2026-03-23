/**
 * @fileoverview Hasilkan manifest audit Gramatika dari sumber data frontend,
 * markdown aktual, dan checklist audit yang sedang berjalan.
 */

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const gramatikaDataPath = path.join(repoRoot, 'frontend', 'src', 'constants', 'gramatikaData.js');
const checklistPath = path.join(repoRoot, '_docs', '202603', '202603231430_checklist-audit-gramatika-tbbbi.md');
const outputJsonPath = path.join(repoRoot, '_docs', '202603', '202603231545_manifest-audit-gramatika.json');
const outputMarkdownPath = path.join(repoRoot, '_docs', '202603', '202603231545_manifest-audit-gramatika.md');

const babConfig = {
  pendahuluan: {
    nomorBab: 'I',
    urutanBab: 1,
    folderSumber: 'bab-01',
    namaPdfBab: 'bab-01-pendahuluan.pdf',
    judulSumber: 'Pendahuluan',
    pdfAwal: 25,
    pdfAkhir: 46,
  },
  'tata-bahasa': {
    nomorBab: 'II',
    urutanBab: 2,
    folderSumber: 'bab-02',
    namaPdfBab: 'bab-02-tata-bahasa-tinjauan-selayang-pandang.pdf',
    judulSumber: 'Tata Bahasa: Tinjauan Selayang Pandang',
    pdfAwal: 47,
    pdfAkhir: 68,
  },
  'bunyi-bahasa': {
    nomorBab: 'III',
    urutanBab: 3,
    folderSumber: 'bab-03',
    namaPdfBab: 'bab-03-bunyi-bahasa-dan-tata-bunyi.pdf',
    judulSumber: 'Bunyi Bahasa dan Tata Bunyi',
    pdfAwal: 69,
    pdfAkhir: 118,
  },
  verba: {
    nomorBab: 'IV',
    urutanBab: 4,
    folderSumber: 'bab-04',
    namaPdfBab: 'bab-04-verba.pdf',
    judulSumber: 'Verba',
    pdfAwal: 119,
    pdfAkhir: 216,
  },
  adjektiva: {
    nomorBab: 'V',
    urutanBab: 5,
    folderSumber: 'bab-05',
    namaPdfBab: 'bab-05-adjektiva.pdf',
    judulSumber: 'Adjektiva',
    pdfAwal: 217,
    pdfAkhir: 257,
  },
  adverbia: {
    nomorBab: 'VI',
    urutanBab: 6,
    folderSumber: 'bab-06',
    namaPdfBab: 'bab-06-adverbia.pdf',
    judulSumber: 'Adverbia',
    pdfAwal: 258,
    pdfAkhir: 281,
  },
  nomina: {
    nomorBab: 'VII',
    urutanBab: 7,
    folderSumber: 'bab-07',
    namaPdfBab: 'bab-07-nomina-pronomina-dan-numeralia.pdf',
    judulSumber: 'Nomina, Pronomina, dan Numeralia',
    pdfAwal: 282,
    pdfAkhir: 395,
  },
  pronomina: {
    nomorBab: 'VII',
    urutanBab: 8,
    folderSumber: 'bab-07',
    namaPdfBab: 'bab-07-nomina-pronomina-dan-numeralia.pdf',
    judulSumber: 'Nomina, Pronomina, dan Numeralia',
    pdfAwal: 282,
    pdfAkhir: 395,
  },
  numeralia: {
    nomorBab: 'VII',
    urutanBab: 9,
    folderSumber: 'bab-07',
    namaPdfBab: 'bab-07-nomina-pronomina-dan-numeralia.pdf',
    judulSumber: 'Nomina, Pronomina, dan Numeralia',
    pdfAwal: 282,
    pdfAkhir: 395,
  },
  'kata-tugas': {
    nomorBab: 'VIII',
    urutanBab: 10,
    folderSumber: 'bab-08',
    namaPdfBab: 'bab-08-kata-tugas.pdf',
    judulSumber: 'Kata Tugas',
    pdfAwal: 396,
    pdfAkhir: 429,
  },
  kalimat: {
    nomorBab: 'IX',
    urutanBab: 11,
    folderSumber: 'bab-09',
    namaPdfBab: 'bab-09-kalimat.pdf',
    judulSumber: 'Kalimat',
    pdfAwal: 430,
    pdfAkhir: 534,
  },
  'hubungan-antarklausa': {
    nomorBab: 'X',
    urutanBab: 12,
    folderSumber: 'bab-10',
    namaPdfBab: 'bab-10-hubungan-antarklausa.pdf',
    judulSumber: 'Hubungan Antarklausa',
    pdfAwal: 535,
    pdfAkhir: 574,
  },
};

function toPosix(value) {
  return String(value).replace(/\\/g, '/');
}

function readFrontmatter(markdownPath) {
  if (!fs.existsSync(markdownPath)) {
    return { exists: false, id: null, title: null };
  }

  const source = fs.readFileSync(markdownPath, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) {
    return { exists: true, id: null, title: null };
  }

  const lines = match[1].split(/\r?\n/);
  const data = { exists: true, id: null, title: null };

  for (const line of lines) {
    const idMatch = line.match(/^id:\s*(.+)$/);
    if (idMatch) {
      data.id = idMatch[1].trim();
    }

    const titleMatch = line.match(/^title:\s*(.+)$/);
    if (titleMatch) {
      data.title = titleMatch[1].trim();
    }
  }

  return data;
}

function parseNomorSubbab(titleFromFrontmatter) {
  if (!titleFromFrontmatter) {
    return null;
  }

  const match = titleFromFrontmatter.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : null;
}

function parseChecklistStatuses(markdownPath) {
  if (!fs.existsSync(markdownPath)) {
    return {};
  }

  const statusMap = {};
  const content = fs.readFileSync(markdownPath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\|\s*([^|]+?)\s*\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*\|$/);
    if (!match) {
      continue;
    }

    const file = match[2].trim();
    statusMap[file] = {
      itemLabel: match[1].trim(),
      halamanPdf: match[3].trim(),
      status: match[4].trim(),
      ringkasan: match[5].trim(),
    };
  }

  return statusMap;
}

function buildChapterSummary(items) {
  const map = new Map();

  for (const item of items) {
    if (!map.has(item.babSlug)) {
      map.set(item.babSlug, {
        babSlug: item.babSlug,
        judulBab: item.judulBab,
        nomorBab: item.nomorBab,
        urutanBab: item.urutanBab,
        total: 0,
        selesai: 0,
        revisi: 0,
        tunda: 0,
        sedang: 0,
        belum: 0,
      });
    }

    const summary = map.get(item.babSlug);
    summary.total += 1;

    if (item.statusAudit === 'OK') summary.selesai += 1;
    else if (item.statusAudit === 'Perlu Revisi') summary.revisi += 1;
    else if (item.statusAudit === 'Tunda') summary.tunda += 1;
    else if (item.statusAudit === 'Sedang') summary.sedang += 1;
    else summary.belum += 1;
  }

  return Array.from(map.values()).sort((a, b) => a.urutanBab - b.urutanBab);
}

function buildMarkdownReport(summaryByChapter, queue, manifest) {
  const lines = [];
  const push = (...parts) => lines.push(...parts);

  push(
    '# Manifest Audit Gramatika TBBBI',
    '',
    `Dibuat: ${manifest.generatedAt}`,
    '',
    'Dokumen ini dihasilkan otomatis dari `frontend/src/constants/gramatikaData.js`, file markdown Gramatika, dan checklist audit aktif.',
    '',
    '## Ringkasan',
    '',
    `- Total item audit: ${manifest.summary.totalItem}`,
    `- Sudah OK: ${manifest.summary.totalOk}`,
    `- Perlu revisi: ${manifest.summary.totalPerluRevisi}`,
    `- Tunda: ${manifest.summary.totalTunda}`,
    `- Sedang: ${manifest.summary.totalSedang}`,
    `- Belum: ${manifest.summary.totalBelum}`,
    '',
    '## Status per Bab',
    '',
    '| Bab | Total | OK | Revisi | Tunda | Sedang | Belum |',
    '|---|---:|---:|---:|---:|---:|---:|'
  );

  for (const chapter of summaryByChapter) {
    push(`| ${chapter.nomorBab} ${chapter.judulBab} | ${chapter.total} | ${chapter.selesai} | ${chapter.revisi} | ${chapter.tunda} | ${chapter.sedang} | ${chapter.belum} |`);
  }

  push('', '## Antrian Audit Berikutnya', '');

  for (const item of queue) {
    push(`- ${item.nomorBab} · ${item.labelAntrian} · ${item.judul} — ${item.fileMarkdown}`);
  }

  push(
    '',
    '## Output Terkait',
    '',
    `- JSON: \`${toPosix(path.relative(repoRoot, outputJsonPath))}\``,
    `- Checklist aktif: \`${toPosix(path.relative(repoRoot, checklistPath))}\``
  );

  return lines.join('\n');
}

async function main() {
  const { daftarItemGramatika } = await import(pathToFileURL(gramatikaDataPath).href);
  const checklistStatus = parseChecklistStatuses(checklistPath);

  const manifestItems = daftarItemGramatika.map((item, index) => {
    const config = babConfig[item.babSlug];
    if (!config) {
      throw new Error(`Konfigurasi bab tidak ditemukan untuk slug: ${item.babSlug}`);
    }

    const markdownRelativePath = toPosix(path.join('frontend', 'public', 'gramatika', item.dokumen));
    const markdownAbsolutePath = path.join(repoRoot, markdownRelativePath);
    const frontmatter = readFrontmatter(markdownAbsolutePath);
    const checklist = checklistStatus[markdownRelativePath] || null;
    const nomorSubbab = parseNomorSubbab(frontmatter.title);
    const babPdfRelativePath = toPosix(path.join('_data', 'gramatika', config.folderSumber, config.namaPdfBab));

    return {
      urutan: index + 1,
      nomorBab: config.nomorBab,
      urutanBab: config.urutanBab,
      judulBab: item.judulBab,
      babSlug: item.babSlug,
      judul: item.judul,
      slug: item.slug,
      tipe: item.tipe,
      nomorSubbab,
      frontmatterId: frontmatter.id,
      frontmatterTitle: frontmatter.title,
      fileMarkdown: markdownRelativePath,
      fileMarkdownAda: frontmatter.exists,
      statusAudit: checklist?.status || 'Belum',
      ringkasanAudit: checklist?.ringkasan || '',
      halamanPdf: checklist?.halamanPdf || null,
      sumber: {
        judulBabPdf: config.judulSumber,
        filePdfBab: babPdfRelativePath,
        folderJpg: toPosix(path.join('_data', 'gramatika', config.folderSumber)),
        rentangPdfBab: `${config.pdfAwal}-${config.pdfAkhir}`,
      },
      navigasi: {
        parentSlug: item.parentSlug || null,
        parentJudul: item.parentJudul || null,
        directParentSlug: item.directParentSlug || null,
        directParentJudul: item.directParentJudul || null,
        ancestorTrail: item.ancestorTrail || [],
      },
    };
  });

  const summaryByChapter = buildChapterSummary(manifestItems);
  const summary = {
    totalItem: manifestItems.length,
    totalOk: manifestItems.filter((item) => item.statusAudit === 'OK').length,
    totalPerluRevisi: manifestItems.filter((item) => item.statusAudit === 'Perlu Revisi').length,
    totalTunda: manifestItems.filter((item) => item.statusAudit === 'Tunda').length,
    totalSedang: manifestItems.filter((item) => item.statusAudit === 'Sedang').length,
    totalBelum: manifestItems.filter((item) => item.statusAudit === 'Belum').length,
  };

  const queue = manifestItems
    .filter((item) => item.statusAudit === 'Belum' && item.tipe !== 'bab')
    .slice(0, 25)
    .map((item) => ({
      nomorBab: item.nomorBab,
      nomorSubbab: item.nomorSubbab,
      labelAntrian: item.nomorSubbab || item.nomorBab,
      judul: item.judul,
      fileMarkdown: item.fileMarkdown,
    }));

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: {
      gramatikaData: toPosix(path.relative(repoRoot, gramatikaDataPath)),
      checklistAudit: toPosix(path.relative(repoRoot, checklistPath)),
    },
    summary,
    summaryByChapter,
    queue,
    items: manifestItems,
  };

  fs.writeFileSync(outputJsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(outputMarkdownPath, `${buildMarkdownReport(summaryByChapter, queue, manifest)}\n`, 'utf8');

  console.log(`Manifest JSON ditulis ke ${toPosix(path.relative(repoRoot, outputJsonPath))}`);
  console.log(`Manifest Markdown ditulis ke ${toPosix(path.relative(repoRoot, outputMarkdownPath))}`);
  console.log(`Total item: ${summary.totalItem}; OK: ${summary.totalOk}; Belum: ${summary.totalBelum}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});