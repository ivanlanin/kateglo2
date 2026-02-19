/**
 * @fileoverview Utilitas cursor pagination (encode/decode token)
 */

function encodeCursor(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const json = JSON.stringify(payload);
  return Buffer.from(json, 'utf8').toString('base64url');
}

function decodeCursor(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

module.exports = {
  encodeCursor,
  decodeCursor,
};
