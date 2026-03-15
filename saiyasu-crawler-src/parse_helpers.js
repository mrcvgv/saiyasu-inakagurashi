const { PDFParse } = require('pdf-parse');

/**
 * Shared parsing utilities used by source strategy modules.
 *
 * Centralises HTML extraction, price/area/address parsing, anchor
 * enumeration, and PDF text extraction so each source module can import only
 * what it needs.
 */

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

function normalizeText(value) {
  return (value || '').normalize('NFKC').replace(/\u3000/g, ' ');
}

function stripTags(value) {
  return normalizeText((value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function decodeHtml(value) {
  return normalizeText((value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>'));
}

function matchOne(text, regex) {
  const match = (text || '').match(regex);
  if (!match) return null;
  const value = match.slice(1).find((part) => part != null);
  return value ? String(value).trim() : null;
}

// ---------------------------------------------------------------------------
// Anchor extraction
// ---------------------------------------------------------------------------

function absoluteUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractAnchors(html, baseUrl) {
  const anchors = [];
  const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const text = stripTags(match[2] || '');
    const url = absoluteUrl(baseUrl, href);

    if (!url) continue;
    anchors.push({ url, text });
  }

  return anchors;
}

function looksLikePropertyLink(anchor) {
  const text = `${anchor.text} ${anchor.url}`.toLowerCase();
  const keywords = [
    '空き家', '空家', 'akiya', 'property', 'estate',
    '物件', 'detail', 'house', '売家', '売地', '賃貸'
  ];
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function inferLocationRaw(text) {
  const prefectures = ['埼玉県', '千葉県', '長野県', '神奈川県', '東京都'];
  return prefectures.find((prefecture) => text.includes(prefecture)) || null;
}

// ---------------------------------------------------------------------------
// Meta tag extraction
// ---------------------------------------------------------------------------

function extractMetaContent(html, key) {
  const regex = new RegExp(`${key}"[^>]*content="([^"]+)"`);
  return matchOne(html, regex);
}

// ---------------------------------------------------------------------------
// Price parsing
// ---------------------------------------------------------------------------

function parsePriceYen(priceRaw) {
  if (!priceRaw) return null;
  const normalized = normalizeText(String(priceRaw))
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .replace(/^(売買|賃貸|約)/, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();
  if (/^\d+円$/.test(normalized)) return Number(normalized.replace('円', ''));
  if (/^\d+(\.\d+)?万円$/.test(normalized)) return Math.round(Number(normalized.replace('万円', '')) * 10000);
  if (/^\d+(\.\d+)?万$/.test(normalized)) return Math.round(Number(normalized.replace('万', '')) * 10000);
  return null;
}

// ---------------------------------------------------------------------------
// Area parsing
// ---------------------------------------------------------------------------

function parseAreaValue(raw) {
  if (!raw) return null;
  const match = normalizeText(raw).match(/([0-9]+(?:\.[0-9]+)?)/);
  return match ? Number(match[1]) : null;
}

// ---------------------------------------------------------------------------
// Address parsing
// ---------------------------------------------------------------------------

function parseAddressParts(addressRaw) {
  if (!addressRaw) {
    return { prefecture: null, city: null };
  }

  const normalized = normalizeText(addressRaw);
  const prefectureMatch = normalized.match(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/);
  const prefecture = prefectureMatch ? prefectureMatch[1] : null;
  const rest = prefecture ? normalized.slice(prefecture.length) : normalized;
  const cityMatch = rest.match(/^(.+?(?:市|区|町|村))/);
  const city = cityMatch ? cityMatch[1] : null;

  return { prefecture, city };
}

// ---------------------------------------------------------------------------
// Building age
// ---------------------------------------------------------------------------

function parseBuildingAge(text) {
  const yearMatch = normalizeText(text || '').match(/(19\d{2}|20\d{2})年築/);
  if (!yearMatch) return null;
  return new Date().getFullYear() - Number(yearMatch[1]);
}

/**
 * Parse Japanese era construction dates like "昭和48年9月" or "平成5年".
 * Returns the western calendar year or null.
 */
function parseConstructionYear(text) {
  if (!text) return null;
  const normalized = normalizeText(text);

  const westernMatch = normalized.match(/(19\d{2}|20\d{2})年/);
  if (westernMatch) return Number(westernMatch[1]);

  const eraMatch = normalized.match(/(明治|大正|昭和|平成|令和)(\d{1,2})年/);
  if (!eraMatch) return null;

  const eraBase = { '明治': 1868, '大正': 1912, '昭和': 1926, '平成': 1989, '令和': 2019 };
  const base = eraBase[eraMatch[1]];
  if (!base) return null;

  return base + Number(eraMatch[2]) - 1;
}

// ---------------------------------------------------------------------------
// PDF parsing
// ---------------------------------------------------------------------------

async function extractPdfText(buffer) {
  if (!buffer || buffer.length === 0) return '';

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return normalizeText((result.text || '').replace(/\r/g, '').trim());
  } finally {
    await parser.destroy();
  }
}

module.exports = {
  normalizeText,
  stripTags,
  decodeHtml,
  matchOne,
  absoluteUrl,
  extractAnchors,
  looksLikePropertyLink,
  inferLocationRaw,
  extractMetaContent,
  parsePriceYen,
  parseAreaValue,
  parseAddressParts,
  parseBuildingAge,
  parseConstructionYear,
  extractPdfText
};
