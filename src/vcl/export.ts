import type { GeneratedMolecule } from './types.ts';
import { NUMERIC_PROPERTIES } from './types.ts';

/**
 * Build an SDF holding every molecule with its predicted properties as data
 * fields.
 * @param molecules - Molecules to write, in the order they should appear.
 * @returns The SDF text, one `$$$$` terminated record per molecule.
 */
export function toSDF(molecules: readonly GeneratedMolecule[]): string {
  const chunks: string[] = [];
  for (const molecule of molecules) {
    chunks.push(normaliseMolfile(molecule.molfile));
    pushDataField(chunks, 'smiles', molecule.smiles);
    pushDataField(chunks, 'mf', molecule.mf);
    pushDataField(chunks, 'idCode', molecule.idCode);
    for (const property of NUMERIC_PROPERTIES) {
      pushDataField(
        chunks,
        property.key,
        molecule[property.key].toFixed(property.decimals),
      );
    }
    chunks.push('$$$$\n');
  }
  return chunks.join('');
}

/**
 * Build a newline separated SMILES list.
 * @param molecules - Molecules to write, in the order they should appear.
 * @returns One SMILES per line, the last line included.
 */
export function toSmilesList(molecules: readonly GeneratedMolecule[]): string {
  const chunks: string[] = [];
  for (const molecule of molecules) {
    chunks.push(molecule.smiles, '\n');
  }
  return chunks.join('');
}

/**
 * Build a CSV with a header row: smiles, mf, then every numeric property.
 * @param molecules - Molecules to write, in the order they should appear.
 * @returns The CSV text, header row included.
 */
export function toCSV(molecules: readonly GeneratedMolecule[]): string {
  const header: string[] = ['smiles', 'mf'];
  for (const property of NUMERIC_PROPERTIES) header.push(property.key);

  const chunks: string[] = [header.join(','), '\n'];
  for (const molecule of molecules) {
    chunks.push(
      escapeCSVValue(molecule.smiles),
      ',',
      escapeCSVValue(molecule.mf),
    );
    for (const property of NUMERIC_PROPERTIES) {
      chunks.push(',', molecule[property.key].toFixed(property.decimals));
    }
    chunks.push('\n');
  }
  return chunks.join('');
}

function normaliseMolfile(molfile: string): string {
  let end = molfile.length;
  while (end > 0) {
    const character = molfile[end - 1];
    if (character !== '\n' && character !== '\r') break;
    end--;
  }
  return `${molfile.slice(0, end)}\n`;
}

function pushDataField(chunks: string[], name: string, value: string): void {
  chunks.push('>  <', name, '>\n', value, '\n\n');
}

function escapeCSVValue(value: string): string {
  if (!/[\n\r",]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

/**
 * Trigger a browser download of some text.
 * @param filename - Name the browser gives to the saved file.
 * @param mimeType - MIME type of the content, e.g. `text/csv`.
 * @param content - Text to save.
 */
export function downloadText(
  filename: string,
  mimeType: string,
  content: string,
): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
