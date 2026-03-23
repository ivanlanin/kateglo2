import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const gramatikaRoot = path.join(repoRoot, 'frontend', 'public', 'gramatika');
const reportPath = path.join(repoRoot, '_docs', '202603', '202603231530_audit-artefak-gramatika.md');

const babGroups = [
  { number: 1, label: 'Bab I Pendahuluan', folders: ['pendahuluan'] },
  { number: 2, label: 'Bab II Tata Bahasa', folders: ['tata-bahasa'] },
  { number: 3, label: 'Bab III Bunyi Bahasa', folders: ['bunyi-bahasa'] },
  { number: 4, label: 'Bab IV Verba', folders: ['verba'] },
  { number: 5, label: 'Bab V Adjektiva', folders: ['adjektiva'] },
  { number: 6, label: 'Bab VI Adverbia', folders: ['adverbia'] },
  { number: 7, label: 'Bab VII Nomina, Pronomina, dan Numeralia', folders: ['nomina', 'pronomina', 'numeralia'] },
  { number: 8, label: 'Bab VIII Kata Tugas', folders: ['kata-tugas'] },
  { number: 9, label: 'Bab IX Kalimat', folders: ['kalimat'] },
  { number: 10, label: 'Bab X Hubungan Antarklausa', folders: ['hubungan-antarklausa'] },
];

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    shouldWrite: args.has('--write'),
  };
}

function normalizeSubbabId(rawId, babNumber) {
  const trimmed = String(rawId || '').trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith(`${babNumber}.`)) {
    return trimmed;
  }

  return `${babNumber}.${trimmed}`;
}

function parseSubbabId(id) {
  const parts = String(id || '').split('.').map((value) => Number.parseInt(value, 10));
  if (parts.some((value) => Number.isNaN(value))) {
    return null;
  }
  return parts;
}

function compareIdParts(left, right) {
  const maxLength = Math.max(left.length, right.length);
  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = left[index] ?? -1;
    const rightValue = right[index] ?? -1;
    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }
  }
  return 0;
}

function sortSubbabIds(ids) {
  return [...ids].sort((left, right) => {
    const leftParts = parseSubbabId(left) ?? [];
    const rightParts = parseSubbabId(right) ?? [];
    return compareIdParts(leftParts, rightParts);
  });
}

function formatNumberSequence(numbers) {
  if (!numbers.length) {
    return '-';
  }

  const sorted = [...numbers].sort((left, right) => left - right);
  const ranges = [];
  let start = sorted[0];
  let previous = sorted[0];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }

    ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
    start = current;
    previous = current;
  }

  ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
  return ranges.join(', ');
}

function findMissingIntegers(numbers) {
  if (!numbers.length) {
    return [];
  }

  const sorted = [...new Set(numbers)].sort((left, right) => left - right);
  const missing = [];

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    for (let candidate = previous + 1; candidate < current; candidate += 1) {
      missing.push(candidate);
    }
  }

  return missing;
}

function formatDuplicateOccurrence(value, entries) {
  const fileList = [...new Set(entries.map((entry) => entry.file))].sort();
  const sourceList = [...new Set(entries.map((entry) => entry.source))].sort();
  const fileLabel = fileList.length === 1 ? fileList[0] : `${fileList.length} file`;
  return `${value} x${entries.length} [${sourceList.join('/')}] @ ${fileLabel}`;
}

function collectDuplicates(occurrences, expectedSources) {
  const grouped = new Map();

  for (const occurrence of occurrences) {
    const key = String(occurrence.value);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(occurrence);
  }

  const expected = [];
  const review = [];

  for (const [value, entries] of grouped.entries()) {
    if (entries.length < 2) {
      continue;
    }

    const files = new Set(entries.map((entry) => entry.file));
    const sources = new Set(entries.map((entry) => entry.source));
    const isExpectedDuplicate =
      files.size === 1
      && sources.size > 1
      && [...sources].every((source) => expectedSources.has(source));

    if (isExpectedDuplicate) {
      expected.push(formatDuplicateOccurrence(value, entries));
      continue;
    }

    review.push(formatDuplicateOccurrence(value, entries));
  }

  expected.sort();
  review.sort();

  return { expected, review };
}

function findSubbabSiblingGaps(ids) {
  const groups = new Map();

  for (const id of ids) {
    const parts = parseSubbabId(id);
    if (!parts || parts.length < 2) {
      continue;
    }

    const parentKey = parts.slice(0, -1).join('.');
    const lastPart = parts[parts.length - 1];
    if (!groups.has(parentKey)) {
      groups.set(parentKey, []);
    }
    groups.get(parentKey).push(lastPart);
  }

  const gaps = [];
  for (const [parentKey, values] of groups.entries()) {
    const missing = findMissingIntegers(values);
    for (const item of missing) {
      gaps.push(`${parentKey}.${item}`);
    }
  }

  return sortSubbabIds(gaps);
}

function findArtifactGaps(labels, babNumber) {
  const suffixes = labels
    .map((label) => {
      const match = String(label).match(new RegExp(`^${babNumber}\\.(\\d+)$`));
      return match ? Number.parseInt(match[1], 10) : null;
    })
    .filter((value) => Number.isInteger(value));

  return findMissingIntegers(suffixes).map((value) => `${babNumber}.${value}`);
}

function summarizeList(items, limit = 12) {
  if (!items.length) {
    return '-';
  }

  if (items.length <= limit) {
    return items.join(', ');
  }

  return `${items.slice(0, limit).join(', ')}, ... (+${items.length - limit})`;
}

async function getMarkdownFiles(folderPath) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(folderPath, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function extractExampleOccurrenceFromLine(line) {
  const directExampleMatch = line.match(/^\s*(?:-\s*)?\((\d+)([a-z])?\)/i);
  if (directExampleMatch) {
    return {
      value: Number.parseInt(directExampleMatch[1], 10),
      source: 'direct',
    };
  }

  const diagramExampleMatch = line.match(/\bDiagram\s*\((\d+)([a-z])?\)/i);
  if (diagramExampleMatch) {
    const source = /^\s*!\[/.test(line) ? 'diagram-image-alt' : 'diagram-inline';
    return {
      value: Number.parseInt(diagramExampleMatch[1], 10),
      source,
    };
  }

  return null;
}

function extractArtifactOccurrenceFromLine(line, kind) {
  const escapedKind = kind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    {
      pattern: new RegExp(`^\\s*!\\[[^\\]]*${escapedKind}\\s+(\\d+(?:\\.\\d+)*)\\b[^\\]]*\\]`, 'i'),
      source: 'image-alt',
    },
    {
      pattern: new RegExp(`^\\s*[*_]{1,2}${escapedKind}\\s+(\\d+(?:\\.\\d+)*)\\b.*[*_]{1,2}\\s*$`, 'i'),
      source: 'emphasis-caption',
    },
    {
      pattern: new RegExp(`^\\s*(?:[*_]{1,2})?${escapedKind}\\s+(\\d+(?:\\.\\d+)*)\\b`, 'i'),
      source: 'plain-caption',
    },
  ];

  for (const { pattern, source } of patterns) {
    const match = line.match(pattern);
    if (match) {
      return {
        value: match[1],
        source,
      };
    }
  }

  return null;
}

function extractSubbabIdsFromContent(content, babNumber) {
  const occurrences = [];

  const frontmatterIdMatch = content.match(/^id:\s*([^\n]+)$/m);
  if (frontmatterIdMatch) {
    const normalizedId = normalizeSubbabId(frontmatterIdMatch[1], babNumber);
    if (normalizedId) {
      occurrences.push({
        value: normalizedId,
        source: 'frontmatter',
      });
    }
  }

  const headingMatches = content.matchAll(/^#{1,6}\s+.*?\((\d+(?:\.\d+)+)\)\s*$/gm);
  for (const match of headingMatches) {
    const normalizedId = normalizeSubbabId(match[1], babNumber);
    if (normalizedId) {
      occurrences.push({
        value: normalizedId,
        source: 'heading',
      });
    }
  }

  return occurrences;
}

async function analyzeBabGroup(babGroup) {
  const subbabOccurrences = [];
  const exampleOccurrences = [];
  const tableOccurrences = [];
  const baganOccurrences = [];
  const sourceFiles = [];

  for (const folder of babGroup.folders) {
    const folderPath = path.join(gramatikaRoot, folder);
    const markdownFiles = await getMarkdownFiles(folderPath);

    for (const filePath of markdownFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      const relativeFilePath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
      sourceFiles.push(relativeFilePath);

      subbabOccurrences.push(
        ...extractSubbabIdsFromContent(content, babGroup.number).map((occurrence) => ({
          ...occurrence,
          file: relativeFilePath,
        }))
      );

      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const exampleOccurrence = extractExampleOccurrenceFromLine(line);
        if (exampleOccurrence !== null) {
          exampleOccurrences.push({
            ...exampleOccurrence,
            file: relativeFilePath,
          });
        }

        const tableOccurrence = extractArtifactOccurrenceFromLine(line, 'Tabel');
        if (tableOccurrence) {
          tableOccurrences.push({
            ...tableOccurrence,
            file: relativeFilePath,
          });
        }

        const baganOccurrence = extractArtifactOccurrenceFromLine(line, 'Bagan');
        if (baganOccurrence) {
          baganOccurrences.push({
            ...baganOccurrence,
            file: relativeFilePath,
          });
        }
      }
    }
  }

  const subbabIds = subbabOccurrences.map((occurrence) => occurrence.value);
  const exampleNumbers = exampleOccurrences.map((occurrence) => occurrence.value);
  const tableLabels = tableOccurrences.map((occurrence) => occurrence.value);
  const baganLabels = baganOccurrences.map((occurrence) => occurrence.value);

  const uniqueSubbabIds = sortSubbabIds([...new Set(subbabIds)]);
  const uniqueExampleNumbers = [...new Set(exampleNumbers)].sort((left, right) => left - right);
  const uniqueTableLabels = [...new Set(tableLabels)].sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const uniqueBaganLabels = [...new Set(baganLabels)].sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const duplicateSubbab = collectDuplicates(subbabOccurrences, new Set(['frontmatter', 'heading']));
  const duplicateExamples = collectDuplicates(exampleOccurrences, new Set(['direct', 'diagram-image-alt', 'diagram-inline']));
  const duplicateTables = collectDuplicates(tableOccurrences, new Set(['image-alt', 'emphasis-caption', 'plain-caption']));
  const duplicateBagan = collectDuplicates(baganOccurrences, new Set(['image-alt', 'emphasis-caption', 'plain-caption']));

  return {
    ...babGroup,
    sourceFiles,
    subbabIds: uniqueSubbabIds,
    exampleNumbers: uniqueExampleNumbers,
    tableLabels: uniqueTableLabels,
    baganLabels: uniqueBaganLabels,
    subbabCount: uniqueSubbabIds.length,
    exampleCount: uniqueExampleNumbers.length,
    tableCount: uniqueTableLabels.length,
    baganCount: uniqueBaganLabels.length,
    duplicateSubbabExpected: duplicateSubbab.expected,
    duplicateSubbabReview: duplicateSubbab.review,
    duplicateExamplesExpected: duplicateExamples.expected,
    duplicateExamplesReview: duplicateExamples.review,
    duplicateTablesExpected: duplicateTables.expected,
    duplicateTablesReview: duplicateTables.review,
    duplicateBaganExpected: duplicateBagan.expected,
    duplicateBaganReview: duplicateBagan.review,
    subbabGaps: findSubbabSiblingGaps(uniqueSubbabIds),
    exampleGaps: findMissingIntegers(uniqueExampleNumbers),
    tableGaps: findArtifactGaps(uniqueTableLabels, babGroup.number),
    baganGaps: findArtifactGaps(uniqueBaganLabels, babGroup.number),
  };
}

function renderSummaryTable(results) {
  const lines = [
    '| Bab | Subbab | Contoh | Tabel | Bagan | Gap? | Duplikat? |',
    '|---|---:|---:|---:|---:|---|---|',
  ];

  for (const result of results) {
    const hasGap = result.subbabGaps.length || result.exampleGaps.length || result.tableGaps.length || result.baganGaps.length;
    const hasDuplicate = result.duplicateSubbabReview.length || result.duplicateExamplesReview.length || result.duplicateTablesReview.length || result.duplicateBaganReview.length;
    lines.push(`| ${result.label} | ${result.subbabCount} | ${result.exampleCount} | ${result.tableCount} | ${result.baganCount} | ${hasGap ? 'Ya' : 'Tidak'} | ${hasDuplicate ? 'Ya' : 'Tidak'} |`);
  }

  return lines.join('\n');
}

function renderBabDetails(result) {
  return [
    `## ${result.label}`,
    '',
    `- Folder: ${result.folders.map((folder) => `\`${folder}\``).join(', ')}`,
    `- Jumlah subbab: ${result.subbabCount}`,
    `- Jumlah contoh: ${result.exampleCount}`,
    `- Jumlah tabel: ${result.tableCount}`,
    `- Jumlah bagan: ${result.baganCount}`,
    `- Rentang subbab: ${summarizeList(result.subbabIds)}`,
    `- Rentang contoh: ${formatNumberSequence(result.exampleNumbers)}`,
    `- Tabel: ${summarizeList(result.tableLabels)}`,
    `- Bagan: ${summarizeList(result.baganLabels)}`,
    `- Gap subbab: ${summarizeList(result.subbabGaps)}`,
    `- Gap contoh: ${formatNumberSequence(result.exampleGaps)}`,
    `- Gap tabel: ${summarizeList(result.tableGaps)}`,
    `- Gap bagan: ${summarizeList(result.baganGaps)}`,
    `- Duplikat subbab (representasional): ${summarizeList(result.duplicateSubbabExpected)}`,
    `- Duplikat subbab (perlu telaah): ${summarizeList(result.duplicateSubbabReview)}`,
    `- Duplikat contoh (representasional): ${summarizeList(result.duplicateExamplesExpected)}`,
    `- Duplikat contoh (perlu telaah): ${summarizeList(result.duplicateExamplesReview)}`,
    `- Duplikat tabel (representasional): ${summarizeList(result.duplicateTablesExpected)}`,
    `- Duplikat tabel (perlu telaah): ${summarizeList(result.duplicateTablesReview)}`,
    `- Duplikat bagan (representasional): ${summarizeList(result.duplicateBaganExpected)}`,
    `- Duplikat bagan (perlu telaah): ${summarizeList(result.duplicateBaganReview)}`,
    '',
    'File sumber:',
    '',
    ...result.sourceFiles.map((file) => `- \`${file}\``),
    '',
  ].join('\n');
}

function renderReport(results) {
  const generatedAt = new Date().toISOString();

  return [
    '# Audit Artefak Gramatika',
    '',
    `Dibuat: ${generatedAt}`,
    '',
    'Artefak yang diaudit:',
    '',
    '- Subbab: nomor pada `id:` frontmatter dan heading bernomor seperti `## ... (7.2.2.2)`, dinormalisasi ke nomor bab.',
    '- Contoh: nomor contoh berbentuk `(xx)` pada awal baris; varian huruf seperti `(72a)` dihitung ke basis nomor `72`.',
    '- Diagram bernomor seperti `Diagram (3)` diperlakukan sebagai bentuk penyajian contoh dan dihitung ke nomor contoh terkait.',
    '- Tabel: caption `Tabel ...`, termasuk yang muncul sebagai alt image atau baris miring/tebal.',
    '- Bagan: caption `Bagan ...`, termasuk yang muncul sebagai alt image atau baris miring/tebal.',
    '- Diagram tidak diaudit sebagai artefak tersendiri; diagram diperlakukan sebagai bentuk penyajian contoh.',
    '- Duplikat representasional dalam file yang sama (misalnya alt gambar + caption, atau frontmatter + heading) dipisahkan dari duplikat yang perlu ditelaah.',
    '',
    '## Ringkasan',
    '',
    renderSummaryTable(results),
    '',
    '## Detail per Bab',
    '',
    ...results.map((result) => renderBabDetails(result)),
  ].join('\n');
}

async function main() {
  const { shouldWrite } = parseArgs(process.argv);
  const results = [];

  for (const babGroup of babGroups) {
    results.push(await analyzeBabGroup(babGroup));
  }

  const report = renderReport(results);
  console.log(report);

  if (shouldWrite) {
    await fs.writeFile(reportPath, report, 'utf8');
    console.error(`\nReport written to ${path.relative(repoRoot, reportPath).replace(/\\/g, '/')}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});