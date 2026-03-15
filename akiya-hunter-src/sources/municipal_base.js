/**
 * municipal_base — reusable factory for creating listing + detail strategy
 * pairs for municipal akiya bank pages that follow common HTML patterns.
 *
 * Most Japanese municipal akiya banks use one of three formats:
 *   1. Bullet-point:  ・住所：value (like Yamakita)
 *   2. Table:         <th>住所</th><td>value</td>
 *   3. Definition list: <dt>住所</dt><dd>value</dd>
 *
 * This factory generates strategies from a config object, reducing the
 * boilerplate for each new municipal source to a few lines of config.
 */

const {
  registerListingStrategy,
  registerDetailStrategy
} = require('../source_registry');

const {
  extractAnchors,
  stripTags,
  decodeHtml,
  normalizeText,
  matchOne,
  parsePriceYen,
  parseAreaValue,
  parseAddressParts,
  parseConstructionYear,
  extractMetaContent
} = require('../parse_helpers');

// ---------------------------------------------------------------------------
// Value extraction by format
// ---------------------------------------------------------------------------

function extractBulletValue(text, label) {
  const regex = new RegExp(`・?${label}[：:]\\s*([^\n・]+)`);
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function extractTableValue(html, label) {
  const regex = new RegExp(
    `<th[^>]*>[\\s]*(?:<[^>]+>)*[\\s]*${label}[\\s]*(?:<[^>]+>)*[\\s]*</th>[\\s]*<td[^>]*>([\\s\\S]*?)</td>`,
    'i'
  );
  const match = html.match(regex);
  return match ? stripTags(match[1]).trim() : null;
}

function extractDlValue(html, label) {
  const regex = new RegExp(
    `<dt[^>]*>[\\s]*(?:<[^>]+>)*[\\s]*${label}[\\s]*(?:<[^>]+>)*[\\s]*</dt>[\\s]*<dd[^>]*>([\\s\\S]*?)</dd>`,
    'i'
  );
  const match = html.match(regex);
  return match ? stripTags(match[1]).trim() : null;
}

function extractTextValue(text, label) {
  const nextLabels = '所在地|住所|価格|売買価格|希望価格|間取り|敷地面積|土地面積|建物面積|延床面積|延べ床面積|建築面積|構造|建築時期|築年月|築年|建築年|設備|設\\s*備|駐車場|庭|畑|登録|登録番号|交通|取引|備考|種別|地目|区分|賃貸|売買|おすすめ|ポイント|利用状況|現在の利用状況|補修|補修の費用負担';

  const colonRegex = new RegExp(`${label}[\\s]*[：:]\\s*(.+?)(?=\\s+・?(?:${nextLabels})[\\s：:・]|$)`);
  const colonMatch = text.match(colonRegex);
  if (colonMatch) return colonMatch[1].trim();

  const spaceRegex = new RegExp(`${label}\\s+(.+?)(?=\\s+・?(?:${nextLabels})[\\s：:・]|$)`);
  const spaceMatch = text.match(spaceRegex);
  return spaceMatch ? spaceMatch[1].trim() : null;
}

function getExtractor(format) {
  if (format === 'table') return extractTableValue;
  if (format === 'dl') return extractDlValue;
  if (format === 'text') return extractTextValue;
  return extractBulletValue;
}

// ---------------------------------------------------------------------------
// Factory: createMunicipalListingStrategy
// ---------------------------------------------------------------------------

function createMunicipalListingStrategy(config) {
  const { prefecture, linkPattern, linkTextFilter, linkTextExclude, extractPrice } = config;

  return function municipalListing(html, baseUrl, sourceName) {
    const anchors = extractAnchors(html, baseUrl);
    const now = new Date().toISOString();
    const seen = new Set();
    const candidates = [];

    for (const anchor of anchors) {
      if (!linkPattern.test(anchor.url)) continue;
      if (linkTextFilter && !linkTextFilter.test(anchor.text)) continue;
      if (linkTextExclude && linkTextExclude.test(anchor.text)) continue;
      if (seen.has(anchor.url)) continue;
      seen.add(anchor.url);

      let priceRaw = null;
      if (extractPrice) {
        priceRaw = extractPrice(anchor.text);
      } else {
        const priceMatch = anchor.text.match(/([0-9,]+万円)/);
        priceRaw = priceMatch ? priceMatch[1] : null;
      }

      candidates.push({
        source_name: sourceName,
        listing_url: anchor.url,
        title: anchor.text || sourceName,
        price_raw: priceRaw,
        location_raw: prefecture,
        discovered_at: now
      });
    }

    return candidates;
  };
}

// ---------------------------------------------------------------------------
// Factory: createMunicipalDetailStrategy
// ---------------------------------------------------------------------------

function createMunicipalDetailStrategy(config) {
  const {
    sourceName,
    prefecture,
    city,
    format = 'bullet',
    labels = {},
    inquiryCodePattern
  } = config;

  const fieldLabels = {
    address: labels.address || '住所|所在地',
    price: labels.price || '価格|売買価格|希望価格',
    layout: labels.layout || '間取り',
    landArea: labels.landArea || '敷地面積|土地面積',
    buildingArea: labels.buildingArea || '建物面積|延床面積|延べ床面積|建物延床',
    structure: labels.structure || '構造',
    construction: labels.construction || '建築時期|築年月|築年|建築年'
  };

  const extract = getExtractor(format);

  function tryExtract(source, labelAlts) {
    for (const label of labelAlts.split('|')) {
      const val = extract(source, label);
      if (val) return normalizeText(val);
    }
    return null;
  }

  return function municipalDetail(html, url) {
    const decoded = decodeHtml(html);
    const bodyText = normalizeText(stripTags(decoded));
    const pageTitle = normalizeText(
      decodeHtml(
        extractMetaContent(html, 'og:title') ||
        matchOne(html, /<title>([^<]+)<\/title>/) ||
        ''
      )
    );

    const extractSource = (format === 'bullet' || format === 'text') ? bodyText : html;

    const addressRaw = tryExtract(extractSource, fieldLabels.address);
    const priceRaw = tryExtract(extractSource, fieldLabels.price);
    const layoutRaw = tryExtract(extractSource, fieldLabels.layout);
    const landRaw = tryExtract(extractSource, fieldLabels.landArea);
    const buildingRaw = tryExtract(extractSource, fieldLabels.buildingArea);
    const structureRaw = tryExtract(extractSource, fieldLabels.structure);
    const constructionRaw = tryExtract(extractSource, fieldLabels.construction);

    let fullAddress = addressRaw;
    if (addressRaw && !addressRaw.match(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/)) {
      fullAddress = `${prefecture}${addressRaw}`;
    }

    const parts = parseAddressParts(fullAddress);
    const layout = layoutRaw || matchOne(pageTitle, /(\d+[SLDKK]+|\d+LDK|\d+DK|\d+K|\d+R)/i);

    const constructionYear = parseConstructionYear(constructionRaw || pageTitle);
    const buildingAge = constructionYear ? (new Date().getFullYear() - constructionYear) : null;

    const isAkiya = /空き家/.test(pageTitle) || /空き家/.test(bodyText) || /_akiya$/.test(sourceName);
    const hasBuilding = Boolean(
      buildingRaw || layout ||
      /家屋|戸建|古民家|住宅|建物/.test(`${pageTitle} ${bodyText}`)
    );

    const imageUrls = [];
    const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const src = imgMatch[1];
      if (/\.(jpg|jpeg|png|gif)/i.test(src) && !/logo|icon|banner|header|nav/i.test(src)) {
        try {
          imageUrls.push(new URL(src, url).toString());
        } catch { /* skip invalid */ }
      }
    }

    let inquiryCode = null;
    if (inquiryCodePattern) {
      inquiryCode = matchOne(url, inquiryCodePattern);
    }

    return {
      url,
      source: sourceName,
      title: pageTitle || null,
      price_yen: parsePriceYen(priceRaw),
      price_raw: priceRaw || null,
      prefecture: parts.prefecture || prefecture,
      city: parts.city || city,
      address_raw: addressRaw || null,
      is_akiya: isAkiya,
      has_building: hasBuilding,
      layout: layout || null,
      building_area_sqm: parseAreaValue(buildingRaw),
      land_area_sqm: parseAreaValue(landRaw),
      building_age: buildingAge,
      notes: structureRaw ? `構造: ${structureRaw}` : null,
      contact: null,
      image_urls: imageUrls,
      inquiry_code: inquiryCode,
      status_text: null,
      scraped_at: new Date().toISOString()
    };
  };
}

// ---------------------------------------------------------------------------
// Convenience: register a complete municipal source
// ---------------------------------------------------------------------------

function registerMunicipalSource(config) {
  const listingStrategy = createMunicipalListingStrategy(config.listing);
  const detailStrategy = createMunicipalDetailStrategy(config.detail);

  registerListingStrategy(config.listingStrategyName, listingStrategy);
  registerDetailStrategy(config.detailStrategyName, detailStrategy);

  return { listingStrategy, detailStrategy };
}

module.exports = {
  createMunicipalListingStrategy,
  createMunicipalDetailStrategy,
  registerMunicipalSource,
  extractBulletValue,
  extractTableValue,
  extractDlValue,
  extractTextValue
};
