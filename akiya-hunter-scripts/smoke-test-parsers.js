#!/usr/bin/env node
/**
 * smoke-test-parsers — runs listing + detail parsers against HTML fixtures
 * and asserts basic expectations.
 *
 * Usage: node scripts/smoke-test-parsers.js
 */

const fs = require('fs');
const path = require('path');

// Load all source strategies
require('../src/sources');
const { getListingStrategy, getDetailStrategy } = require('../src/source_registry');

const fixtureRoot = path.join(__dirname, '..', 'tests', 'fixtures', 'sources');
let passes = 0;
let failures = 0;

function assert(condition, msg) {
  if (condition) {
    passes++;
    console.log(`  ✓ ${msg}`);
  } else {
    failures++;
    console.error(`  ✗ ${msg}`);
  }
}

function readFixture(source, file) {
  const p = path.join(fixtureRoot, source, file);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

// ===================================================================
// ieichiba
// ===================================================================

console.log('\n── ieichiba listing parser ──');
{
  const html = readFixture('ieichiba', 'listing.html');
  const strategy = getListingStrategy('ieichiba_home');
  assert(strategy, 'ieichiba_home strategy is registered');

  if (html && strategy) {
    const candidates = strategy(html, 'https://www.ieichiba.com/', 'ieichiba');
    assert(candidates.length === 3, `extracted 3 candidates (got ${candidates.length})`);
    assert(candidates[0].listing_url.includes('/project/P12345'), 'first URL contains /project/P12345');
    assert(candidates[0].source_name === 'ieichiba', 'source_name is ieichiba');
    assert(candidates[0].location_raw === '埼玉県', 'inferred 埼玉県 from text');
    assert(candidates[1].location_raw === '長野県', 'inferred 長野県 from text');
    assert(candidates[2].location_raw === '東京都', 'inferred 東京都 from text');

    // Deduplication: P12345 appears twice but should be extracted once
    const p12345 = candidates.filter((c) => c.listing_url.includes('P12345'));
    assert(p12345.length === 1, 'deduplicates P12345');
  }
}

console.log('\n── ieichiba detail parser ──');
{
  const html = readFixture('ieichiba', 'detail.html');
  const strategy = getDetailStrategy('ieichiba_detail');
  assert(strategy, 'ieichiba_detail strategy is registered');

  if (html && strategy) {
    const prop = strategy(html, 'https://www.ieichiba.com/project/P12345');
    assert(prop.source === 'ieichiba', 'source is ieichiba');
    assert(prop.title && prop.title.includes('秩父市'), 'title contains 秩父市');
    assert(prop.price_yen === 500000, `price_yen is 500000 (got ${prop.price_yen})`);
    assert(prop.prefecture === '埼玉県', `prefecture is 埼玉県 (got ${prop.prefecture})`);
    assert(prop.city === '秩父市', `city is 秩父市 (got ${prop.city})`);
    assert(prop.land_area_sqm === 330.5, `land_area is 330.5 (got ${prop.land_area_sqm})`);
    assert(prop.building_area_sqm === 85.2, `building_area is 85.2 (got ${prop.building_area_sqm})`);
    assert(prop.layout === '2DK', `layout is 2DK (got ${prop.layout})`);
    assert(prop.is_akiya === true, 'is_akiya is true');
    assert(prop.has_building === true, 'has_building is true');
    assert(prop.inquiry_code === 'P12345', `inquiry_code is P12345 (got ${prop.inquiry_code})`);
    assert(prop.status_text === '空き家', `status_text is 空き家 (got ${prop.status_text})`);
    assert(prop.image_urls.length === 1, `1 image URL (got ${prop.image_urls.length})`);
  }
}

// ===================================================================
// yamakita
// ===================================================================

console.log('\n── yamakita listing parser ──');
{
  const html = readFixture('yamakita_akiya', 'listing.html');
  const strategy = getListingStrategy('yamakita_listing');
  assert(strategy, 'yamakita_listing strategy is registered');

  if (html && strategy) {
    const candidates = strategy(html, 'https://www.town.yamakita.kanagawa.jp/', 'yamakita_akiya');
    assert(candidates.length === 4, `extracted 4 candidates (got ${candidates.length})`);
    assert(candidates[0].listing_url.includes('/0000006964.html'), 'first URL is 0000006964');
    assert(candidates[0].source_name === 'yamakita_akiya', 'source_name is yamakita_akiya');
    assert(candidates[0].location_raw === '神奈川県', 'location_raw is 神奈川県');
    assert(candidates[0].price_raw === '450万円', `price_raw is 450万円 after ⇒ (got ${candidates[0].price_raw})`);
    assert(candidates[1].price_raw === '980万円', `price_raw is 980万円 (got ${candidates[1].price_raw})`);
  }
}

console.log('\n── yamakita detail parser ──');
{
  const html = readFixture('yamakita_akiya', 'detail.html');
  const strategy = getDetailStrategy('yamakita_detail');
  assert(strategy, 'yamakita_detail strategy is registered');

  if (html && strategy) {
    const prop = strategy(html, 'https://www.town.yamakita.kanagawa.jp/0000006964.html');
    assert(prop.source === 'yamakita_akiya', 'source is yamakita_akiya');
    assert(prop.price_yen === 4500000, `price_yen is 4500000 (got ${prop.price_yen})`);
    assert(prop.prefecture === '神奈川県', `prefecture is 神奈川県 (got ${prop.prefecture})`);
    assert(prop.city === '山北町', `city is 山北町 (got ${prop.city})`);
    // Note: city may be 足柄上郡山北町 when full address is used; either is acceptable
    assert(prop.layout === '2DK', `layout is 2DK (got ${prop.layout})`);
    assert(prop.land_area_sqm === 320, `land_area is 320 (got ${prop.land_area_sqm})`);
    assert(prop.building_area_sqm === 53.82, `building_area is 53.82 (got ${prop.building_area_sqm})`);
    assert(prop.building_age !== null, `building_age is computed (got ${prop.building_age})`);
    assert(prop.is_akiya === true, 'is_akiya is true');
    assert(prop.has_building === true, 'has_building is true');
    assert(prop.inquiry_code === '0000006964', `inquiry_code is 0000006964 (got ${prop.inquiry_code})`);
    assert(prop.image_urls.length === 2, `2 image URLs (got ${prop.image_urls.length})`);
    assert(prop.address_raw === '山北町中川649-8', `address_raw (got ${prop.address_raw})`);
  }
}

// ===================================================================
// hanno (bullet-point format via municipal_base)
// ===================================================================

console.log('\n── hanno listing parser ──');
{
  const html = readFixture('hanno_akiya', 'listing.html');
  const strategy = getListingStrategy('hanno_listing');
  assert(strategy, 'hanno_listing strategy is registered');

  if (html && strategy) {
    const candidates = strategy(html, 'https://www.city.hanno.lg.jp/', 'hanno_akiya');
    assert(candidates.length === 3, `extracted 3 candidates (got ${candidates.length})`);
    assert(candidates[0].listing_url.includes('/akiya_001.html'), 'first URL contains akiya_001');
    assert(candidates[0].source_name === 'hanno_akiya', 'source_name is hanno_akiya');
    assert(candidates[0].location_raw === '埼玉県', 'location_raw is 埼玉県');
    assert(candidates[0].price_raw === '380万円', `price_raw is 380万円 (got ${candidates[0].price_raw})`);
    assert(candidates[1].price_raw === '250万円', `price_raw is 250万円 (got ${candidates[1].price_raw})`);
  }
}

console.log('\n── hanno detail parser ──');
{
  const html = readFixture('hanno_akiya', 'detail.html');
  const strategy = getDetailStrategy('hanno_detail');
  assert(strategy, 'hanno_detail strategy is registered');

  if (html && strategy) {
    const prop = strategy(html, 'https://www.city.hanno.lg.jp/akiya_001.html');
    assert(prop.source === 'hanno_akiya', 'source is hanno_akiya');
    assert(prop.price_yen === 3800000, `price_yen is 3800000 (got ${prop.price_yen})`);
    assert(prop.prefecture === '埼玉県', `prefecture is 埼玉県 (got ${prop.prefecture})`);
    assert(prop.city === '飯能市', `city is 飯能市 (got ${prop.city})`);
    assert(prop.layout === '3DK', `layout is 3DK (got ${prop.layout})`);
    assert(prop.land_area_sqm === 265, `land_area is 265 (got ${prop.land_area_sqm})`);
    assert(prop.building_area_sqm === 89.5, `building_area is 89.5 (got ${prop.building_area_sqm})`);
    assert(prop.building_age !== null, `building_age is computed (got ${prop.building_age})`);
    assert(prop.is_akiya === true, 'is_akiya is true');
    assert(prop.has_building === true, 'has_building is true');
    assert(prop.image_urls.length === 2, `2 image URLs (got ${prop.image_urls.length})`);
    assert(prop.address_raw === '飯能市上名栗350-2', `address_raw (got ${prop.address_raw})`);
  }
}

// ===================================================================
// saku (text format via municipal_base — real portal: 39ijyu.com)
// ===================================================================

console.log('\n── saku listing parser ──');
{
  const html = readFixture('saku_akiya', 'listing.html');
  const strategy = getListingStrategy('saku_listing');
  assert(strategy, 'saku_listing strategy is registered');

  if (html && strategy) {
    const candidates = strategy(html, 'https://39ijyu.com/', 'saku_akiya');
    assert(candidates.length === 2, `extracted 2 candidates — rental excluded (got ${candidates.length})`);
    assert(candidates[0].listing_url.includes('detail.php?id=257'), 'first URL contains detail.php?id=257');
    assert(candidates[0].source_name === 'saku_akiya', 'source_name is saku_akiya');
    assert(candidates[0].location_raw === '長野県', 'location_raw is 長野県');
    assert(candidates[0].price_raw === '480万円', `price_raw is 480万円 (got ${candidates[0].price_raw})`);
    // Verify rental listing (id=255, 戸建賃貸) is excluded
    const rentalUrls = candidates.filter(c => c.listing_url.includes('id=255'));
    assert(rentalUrls.length === 0, 'rental listing id=255 excluded by linkTextExclude');
  }
}

console.log('\n── saku detail parser ──');
{
  const html = readFixture('saku_akiya', 'detail.html');
  const strategy = getDetailStrategy('saku_detail');
  assert(strategy, 'saku_detail strategy is registered');

  if (html && strategy) {
    const prop = strategy(html, 'https://39ijyu.com/detail.php?id=257&kubun=IE');
    assert(prop.source === 'saku_akiya', 'source is saku_akiya');
    assert(prop.price_yen === 4800000, `price_yen is 4800000 (got ${prop.price_yen})`);
    assert(prop.prefecture === '長野県', `prefecture is 長野県 (got ${prop.prefecture})`);
    assert(prop.city === '佐久市', `city is 佐久市 (got ${prop.city})`);
    assert(prop.layout === '4DK', `layout is 4DK (got ${prop.layout})`);
    assert(prop.land_area_sqm === 412.35, `land_area is 412.35 (got ${prop.land_area_sqm})`);
    assert(prop.building_area_sqm === 102.5, `building_area is 102.5 (got ${prop.building_area_sqm})`);
    assert(prop.building_age !== null, `building_age is computed (got ${prop.building_age})`);
    assert(prop.is_akiya === true, 'is_akiya is true');
    assert(prop.has_building === true, 'has_building is true');
    assert(prop.inquiry_code === '257', `inquiry_code is 257 (got ${prop.inquiry_code})`);
    assert(prop.image_urls.length === 1, `1 image URL (got ${prop.image_urls.length})`);
    assert(prop.address_raw === '佐久市望月263-1', `address_raw (got ${prop.address_raw})`);
  }
}

// ===================================================================
// kamogawa (text format via municipal_base — real site: kamogawa.lg.jp/site/iju/)
// ===================================================================

console.log('\n── kamogawa listing parser ──');
{
  const html = readFixture('kamogawa_akiya', 'listing.html');
  const strategy = getListingStrategy('kamogawa_listing');
  assert(strategy, 'kamogawa_listing strategy is registered');

  if (html && strategy) {
    const candidates = strategy(html, 'https://www.city.kamogawa.lg.jp/', 'kamogawa_akiya');
    assert(candidates.length === 3, `extracted 3 candidates (got ${candidates.length})`);
    assert(candidates[0].listing_url.includes('/site/iju/38742.html'), 'first URL contains /site/iju/38742');
    assert(candidates[0].source_name === 'kamogawa_akiya', 'source_name is kamogawa_akiya');
    assert(candidates[0].location_raw === '千葉県', 'location_raw is 千葉県');
    assert(candidates[0].price_raw === '100万円', `price_raw is 100万円 (got ${candidates[0].price_raw})`);
  }
}

console.log('\n── kamogawa detail parser ──');
{
  const html = readFixture('kamogawa_akiya', 'detail.html');
  const strategy = getDetailStrategy('kamogawa_detail');
  assert(strategy, 'kamogawa_detail strategy is registered');

  if (html && strategy) {
    const prop = strategy(html, 'https://www.city.kamogawa.lg.jp/site/iju/38742.html');
    assert(prop.source === 'kamogawa_akiya', 'source is kamogawa_akiya');
    assert(prop.price_yen === 1000000, `price_yen is 1000000 (got ${prop.price_yen})`);
    assert(prop.prefecture === '千葉県', `prefecture is 千葉県 (got ${prop.prefecture})`);
    assert(prop.city === '鴨川市', `city is 鴨川市 (got ${prop.city})`);
    assert(prop.layout === '3SDK', `layout is 3SDK (got ${prop.layout})`);
    assert(prop.land_area_sqm === 185.12, `land_area is 185.12 (got ${prop.land_area_sqm})`);
    assert(prop.building_area_sqm === 51.23, `building_area is 51.23 (got ${prop.building_area_sqm})`);
    assert(prop.building_age !== null, `building_age is computed (got ${prop.building_age})`);
    assert(prop.is_akiya === true, 'is_akiya is true');
    assert(prop.has_building === true, 'has_building is true');
    assert(prop.inquiry_code === '38742', `inquiry_code is 38742 (got ${prop.inquiry_code})`);
    assert(prop.image_urls.length === 2, `2 image URLs (got ${prop.image_urls.length})`);
    assert(prop.address_raw === '鴨川市天津1205', `address_raw (got ${prop.address_raw})`);
  }
}

// ===================================================================
// chichibu (text format via municipal_base — real site: chichibuakiyabank.com)
// ===================================================================

console.log('\n── chichibu listing parser ──');
{
  const html = readFixture('chichibu_akiya', 'listing.html');
  const strategy = getListingStrategy('chichibu_listing');
  assert(strategy, 'chichibu_listing strategy is registered');

  if (html && strategy) {
    const candidates = strategy(html, 'https://www.chichibuakiyabank.com/', 'chichibu_akiya');
    assert(candidates.length === 3, `extracted 3 candidates (got ${candidates.length})`);
    assert(candidates[0].listing_url.includes('/property/22561'), 'first URL contains /property/22561');
    assert(candidates[0].source_name === 'chichibu_akiya', 'source_name is chichibu_akiya');
    assert(candidates[0].location_raw === '埼玉県', 'location_raw is 埼玉県');
    assert(candidates[0].price_raw === '480万円', `price_raw is 480万円 (got ${candidates[0].price_raw})`);
  }
}

console.log('\n── chichibu detail parser ──');
{
  const html = readFixture('chichibu_akiya', 'detail.html');
  const strategy = getDetailStrategy('chichibu_detail');
  assert(strategy, 'chichibu_detail strategy is registered');

  if (html && strategy) {
    const prop = strategy(html, 'https://www.chichibuakiyabank.com/property/22561');
    assert(prop.source === 'chichibu_akiya', 'source is chichibu_akiya');
    assert(prop.price_yen === 4800000, `price_yen is 4800000 (got ${prop.price_yen})`);
    assert(prop.prefecture === '埼玉県', `prefecture is 埼玉県 (got ${prop.prefecture})`);
    assert(prop.city === '秩父郡皆野町', `city is 秩父郡皆野町 from address (got ${prop.city})`);
    assert(prop.layout === '4DK', `layout is 4DK (got ${prop.layout})`);
    assert(prop.land_area_sqm === 308, `land_area is 308 (got ${prop.land_area_sqm})`);
    assert(prop.building_area_sqm === 113, `building_area is 113 (got ${prop.building_area_sqm})`);
    assert(prop.building_age !== null, `building_age is computed (got ${prop.building_age})`);
    assert(prop.is_akiya === true, 'is_akiya is true');
    assert(prop.has_building === true, 'has_building is true');
    assert(prop.inquiry_code === '22561', `inquiry_code is 22561 (got ${prop.inquiry_code})`);
    assert(prop.image_urls.length === 2, `2 image URLs (got ${prop.image_urls.length})`);
  }
}

// ===================================================================
// minamiboso (dl format via municipal_base — real site: minamibosocity-iju.jp)
// ===================================================================

console.log('\n── minamiboso listing parser ──');
{
  const html = readFixture('minamiboso_akiya', 'listing.html');
  const strategy = getListingStrategy('minamiboso_listing');
  assert(strategy, 'minamiboso_listing strategy is registered');

  if (html && strategy) {
    const candidates = strategy(html, 'https://www.minamibosocity-iju.jp/', 'minamiboso_akiya');
    assert(candidates.length === 3, `extracted 3 candidates (got ${candidates.length})`);
    assert(candidates[0].listing_url.includes('/vacant/4414/'), 'first URL contains /vacant/4414/');
    assert(candidates[0].source_name === 'minamiboso_akiya', 'source_name is minamiboso_akiya');
    assert(candidates[0].location_raw === '千葉県', 'location_raw is 千葉県');
    assert(candidates[0].price_raw === '980万円', `price_raw is 980万円 (got ${candidates[0].price_raw})`);
  }
}

console.log('\n── minamiboso detail parser ──');
{
  const html = readFixture('minamiboso_akiya', 'detail.html');
  const strategy = getDetailStrategy('minamiboso_detail');
  assert(strategy, 'minamiboso_detail strategy is registered');

  if (html && strategy) {
    const prop = strategy(html, 'https://www.minamibosocity-iju.jp/vacant/4414/');
    assert(prop.source === 'minamiboso_akiya', 'source is minamiboso_akiya');
    assert(prop.price_yen === 9800000, `price_yen is 9800000 (got ${prop.price_yen})`);
    assert(prop.prefecture === '千葉県', `prefecture is 千葉県 (got ${prop.prefecture})`);
    assert(prop.city === '南房総市', `city is 南房総市 (got ${prop.city})`);
    assert(prop.layout === '5DK', `layout is 5DK (got ${prop.layout})`);
    assert(prop.land_area_sqm === 75.36, `land_area is 75.36 (got ${prop.land_area_sqm})`);
    assert(prop.building_area_sqm === 117.02, `building_area is 117.02 (got ${prop.building_area_sqm})`);
    assert(prop.building_age !== null, `building_age is computed (got ${prop.building_age})`);
    assert(prop.is_akiya === true, 'is_akiya is true');
    assert(prop.has_building === true, 'has_building is true');
    assert(prop.inquiry_code === '4414', `inquiry_code is 4414 (got ${prop.inquiry_code})`);
    assert(prop.image_urls.length === 3, `3 image URLs (got ${prop.image_urls.length})`);
    assert(prop.address_raw && prop.address_raw.includes('南房総市千倉町白間津'), `address_raw contains 南房総市千倉町白間津 (got ${prop.address_raw})`);
  }
}

// ===================================================================
// sakuho (text format via municipal_base — real site: town.sakuho.nagano.jp)
// ===================================================================

console.log('\n── sakuho listing parser ──');
{
  const html = readFixture('sakuho_akiya', 'listing.html');
  const strategy = getListingStrategy('sakuho_listing');
  assert(strategy, 'sakuho_listing strategy is registered');

  if (html && strategy) {
    const candidates = strategy(html, 'https://www.town.sakuho.nagano.jp/', 'sakuho_akiya');
    assert(candidates.length === 3, `extracted 3 house candidates — land excluded (got ${candidates.length})`);
    assert(candidates[0].listing_url.includes('/house/house_3806.html'), 'first URL contains house_3806');
    assert(candidates[0].source_name === 'sakuho_akiya', 'source_name is sakuho_akiya');
    assert(candidates[0].location_raw === '長野県', 'location_raw is 長野県');
    assert(candidates[0].price_raw === '1,000万円', `price_raw is 1,000万円 (got ${candidates[0].price_raw})`);
    // Verify land listing is excluded by linkPattern
    const landUrls = candidates.filter(c => c.listing_url.includes('/land/'));
    assert(landUrls.length === 0, 'land listings excluded by linkPattern');
  }
}

console.log('\n── sakuho detail parser ──');
{
  const html = readFixture('sakuho_akiya', 'detail.html');
  const strategy = getDetailStrategy('sakuho_detail');
  assert(strategy, 'sakuho_detail strategy is registered');

  if (html && strategy) {
    const prop = strategy(html, 'https://www.town.sakuho.nagano.jp/iju/live/akiya/house/house_3806.html');
    assert(prop.source === 'sakuho_akiya', 'source is sakuho_akiya');
    assert(prop.price_yen === 10000000, `price_yen is 10000000 (got ${prop.price_yen})`);
    assert(prop.prefecture === '長野県', `prefecture is 長野県 (got ${prop.prefecture})`);
    assert(prop.city === '佐久穂町', `city is 佐久穂町 (got ${prop.city})`);
    assert(prop.layout === '4DK', `layout is 4DK (got ${prop.layout})`);
    assert(prop.land_area_sqm === 481, `land_area is 481 (got ${prop.land_area_sqm})`);
    assert(prop.building_area_sqm === 48.02, `building_area is 48.02 (got ${prop.building_area_sqm})`);
    assert(prop.building_age !== null, `building_age is computed (got ${prop.building_age})`);
    assert(prop.is_akiya === true, 'is_akiya is true');
    assert(prop.has_building === true, 'has_building is true');
    assert(prop.inquiry_code === '3806', `inquiry_code is 3806 (got ${prop.inquiry_code})`);
    assert(prop.image_urls.length === 2, `2 image URLs (got ${prop.image_urls.length})`);
    assert(prop.address_raw === '佐久穂町大字海瀬1046-2', `address_raw (got ${prop.address_raw})`);
  }
}

// ===================================================================
// zero_estate (0-yen portal — th/th table detail format)
// ===================================================================

console.log('\n── zero_estate listing parser ──');
{
  const html = readFixture('zero_estate', 'listing.html');
  const strategy = getListingStrategy('zero_estate_listing');
  assert(strategy, 'zero_estate_listing strategy is registered');

  if (html && strategy) {
    const candidates = strategy(html, 'https://zero.estate/category/zero/kanto/chiba/', 'zero_estate_chiba');
    assert(candidates.length >= 10, `extracted ≥10 candidates (got ${candidates.length})`);
    assert(candidates[0].listing_url.includes('/zero/kanto/'), 'first URL contains /zero/kanto/');
    assert(candidates[0].source_name === 'zero_estate_chiba', 'source_name is zero_estate_chiba');
    assert(candidates[0].price_raw === '0円', 'price_raw is 0円');
    // Ensure no category links are included
    const categoryLinks = candidates.filter(c => c.listing_url.includes('/category/'));
    assert(categoryLinks.length === 0, 'no category links included');
  }
}

console.log('\n── zero_estate detail parser ──');
{
  const html = readFixture('zero_estate', 'detail.html');
  const strategy = getDetailStrategy('zero_estate_detail');
  assert(strategy, 'zero_estate_detail strategy is registered');

  if (html && strategy) {
    const prop = strategy(html, 'https://zero.estate/zero/kanto/3131_sosa/');
    assert(prop.source === 'zero_estate', 'source is zero_estate');
    assert(prop.price_yen === 0, `price_yen is 0 (got ${prop.price_yen})`);
    assert(prop.prefecture === '千葉県', `prefecture is 千葉県 (got ${prop.prefecture})`);
    assert(prop.city === '匝瑳市', `city is 匝瑳市 (got ${prop.city})`);
    assert(prop.land_area_sqm === 2454, `land_area is 2454 (got ${prop.land_area_sqm})`);
    assert(prop.inquiry_code === '3131', `inquiry_code is 3131 (got ${prop.inquiry_code})`);
    assert(prop.address_raw === '千葉県匝瑳市平木', `address_raw (got ${prop.address_raw})`);
    assert(prop.image_urls.length >= 10, `≥10 image URLs (got ${prop.image_urls.length})`);
  }
}

// ===================================================================
// saihoku (埼北空き家バンク — li.title/li.text detail format)
// ===================================================================

console.log('\n── saihoku listing parser ──');
{
  const html = readFixture('saihoku', 'listing.html');
  const strategy = getListingStrategy('saihoku_listing');
  assert(strategy, 'saihoku_listing strategy is registered');

  if (html && strategy) {
    const candidates = strategy(html, 'https://akiyabank.saihoku-ijuu.com/', 'saihoku');
    assert(candidates.length >= 1, `extracted ≥1 candidates (got ${candidates.length})`);
    assert(candidates[0].listing_url.includes('/property/'), 'first URL contains /property/');
    assert(candidates[0].source_name === 'saihoku', 'source_name is saihoku');
    assert(candidates[0].location_raw === '埼玉県', 'location_raw is 埼玉県');
    assert(candidates[0].price_raw === '1000万円', `price_raw is 1000万円 (got ${candidates[0].price_raw})`);
  }
}

console.log('\n── saihoku detail parser ──');
{
  const html = readFixture('saihoku', 'detail.html');
  const strategy = getDetailStrategy('saihoku_detail');
  assert(strategy, 'saihoku_detail strategy is registered');

  if (html && strategy) {
    const prop = strategy(html, 'https://akiyabank.saihoku-ijuu.com/property/kamikawa/2996');
    assert(prop.source === 'saihoku', 'source is saihoku');
    assert(prop.price_yen === 10000000, `price_yen is 10000000 (got ${prop.price_yen})`);
    assert(prop.prefecture === '埼玉県', `prefecture is 埼玉県 (got ${prop.prefecture})`);
    assert(prop.city === '神川町', `city is 神川町 (got ${prop.city})`);
    assert(prop.layout === '4LDK+S', `layout is 4LDK+S (got ${prop.layout})`);
    assert(prop.land_area_sqm === 1169.78, `land_area is 1169.78 (got ${prop.land_area_sqm})`);
    assert(prop.building_area_sqm === 116.42, `building_area is 116.42 (got ${prop.building_area_sqm})`);
    assert(prop.building_age !== null, `building_age is computed (got ${prop.building_age})`);
    assert(prop.is_akiya === true, 'is_akiya is true');
    assert(prop.has_building === true, 'has_building is true');
    assert(prop.inquiry_code === '2996', `inquiry_code is 2996 (got ${prop.inquiry_code})`);
    assert(prop.image_urls.length >= 4, `≥4 image URLs (got ${prop.image_urls.length})`);
    assert(prop.address_raw && prop.address_raw.includes('神川町肥土'), `address_raw contains 神川町肥土 (got ${prop.address_raw})`);
  }
}

// ===================================================================
// tokigawa (td/td table detail format)
// ===================================================================

console.log('\n── tokigawa listing parser ──');
{
  const html = readFixture('tokigawa_akiya', 'listing.html');
  const strategy = getListingStrategy('tokigawa_listing');
  assert(strategy, 'tokigawa_listing strategy is registered');

  if (html && strategy) {
    const candidates = strategy(html, 'https://www.town.tokigawa.lg.jp/', 'tokigawa_akiya');
    assert(candidates.length >= 3, `extracted ≥3 candidates (got ${candidates.length})`);
    assert(candidates[0].listing_url.includes('/Info/'), 'first URL contains /Info/');
    assert(candidates[0].source_name === 'tokigawa_akiya', 'source_name is tokigawa_akiya');
    assert(candidates[0].location_raw === '埼玉県', 'location_raw is 埼玉県');
  }
}

console.log('\n── tokigawa detail parser ──');
{
  const html = readFixture('tokigawa_akiya', 'detail.html');
  const strategy = getDetailStrategy('tokigawa_detail');
  assert(strategy, 'tokigawa_detail strategy is registered');

  if (html && strategy) {
    const prop = strategy(html, 'https://www.town.tokigawa.lg.jp/Info/1548');
    assert(prop.source === 'tokigawa_akiya', 'source is tokigawa_akiya');
    assert(prop.price_yen === 7500000, `price_yen is 7500000 (got ${prop.price_yen})`);
    assert(prop.prefecture === '埼玉県', `prefecture is 埼玉県 (got ${prop.prefecture})`);
    assert(prop.city === 'ときがわ町', `city is ときがわ町 (got ${prop.city})`);
    assert(prop.land_area_sqm === 211.96, `land_area is 211.96 (got ${prop.land_area_sqm})`);
    assert(prop.is_akiya === true, 'is_akiya is true');
    assert(prop.inquiry_code === '1548', `inquiry_code is 1548 (got ${prop.inquiry_code})`);
    assert(prop.image_urls.length >= 1, `≥1 image URLs (got ${prop.image_urls.length})`);
    assert(prop.address_raw === 'ときがわ町大字玉川', `address_raw (got ${prop.address_raw})`);
  }
}

// ===================================================================
// municipal_base unit tests
// ===================================================================

console.log('\n── municipal_base extractors ──');
{
  const { extractBulletValue, extractTableValue, extractDlValue, extractTextValue } = require('../src/sources/municipal_base');

  // Bullet extraction
  assert(extractBulletValue('・住所：飯能市上名栗350', '住所') === '飯能市上名栗350', 'bullet: extracts address');
  assert(extractBulletValue('・価格：380万円', '価格') === '380万円', 'bullet: extracts price');
  assert(extractBulletValue('no match here', '住所') === null, 'bullet: returns null on miss');

  // Table extraction
  const tableHtml = '<tr><th>所在地</th><td>佐久市望月263</td></tr>';
  assert(extractTableValue(tableHtml, '所在地') === '佐久市望月263', 'table: extracts value from th/td');
  assert(extractTableValue(tableHtml, '間取り') === null, 'table: returns null on miss');

  // DL extraction
  const dlHtml = '<dt>所在地</dt><dd>鴨川市西条1205</dd>';
  assert(extractDlValue(dlHtml, '所在地') === '鴨川市西条1205', 'dl: extracts value from dt/dd');
  assert(extractDlValue(dlHtml, '間取り') === null, 'dl: returns null on miss');

  // Text extraction (colon-separated and space-separated)
  assert(extractTextValue('所在地：鴨川市天津1205', '所在地') === '鴨川市天津1205', 'text: extracts colon-separated');
  assert(extractTextValue('価格 480万円 間取り 4DK', '価格') === '480万円', 'text: extracts space-separated with lookahead');
  assert(extractTextValue('no match here', '所在地') === null, 'text: returns null on miss');
}

// ===================================================================
// PDF extraction helper
// ===================================================================

console.log('\n── PDF extraction helper ──');
(async () => {
  const { extractPdfText } = require('../src/parse_helpers');
  const simplePdf = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 24 Tf
100 100 Td
(Hello PDF) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000063 00000 n 
0000000122 00000 n 
0000000248 00000 n 
0000000342 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
412
%%EOF`, 'utf8');
  const extractedPdfText = await extractPdfText(simplePdf);
  assert(extractedPdfText.includes('Hello PDF'), 'pdf: extracts text from simple PDF buffer');

  // ===================================================================
  // generic fallback
  // ===================================================================

  console.log('\n── generic_anchor fallback ──');
  {
    const strategy = getListingStrategy('generic_anchor');
    assert(strategy, 'generic_anchor strategy is registered');

    if (strategy) {
      const html = '<a href="/property/1">空き家物件A</a><a href="/about">About</a>';
      const candidates = strategy(html, 'https://example.com/', 'test_source', { prefecture: '東京都' });
      assert(candidates.length === 1, `extracted 1 candidate from keyword match (got ${candidates.length})`);
      assert(candidates[0].location_raw === '東京都', 'location_raw from source.prefecture');
    }
  }

  // ===================================================================
  // Summary
  // ===================================================================

  console.log(`\n── Summary: ${passes} passed, ${failures} failed ──\n`);
  process.exit(failures > 0 ? 1 : 0);
})().catch((error) => {
  failures++;
  console.error(error);
  console.log(`\n── Summary: ${passes} passed, ${failures} failed ──\n`);
  process.exit(1);
});

