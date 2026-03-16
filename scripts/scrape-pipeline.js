#!/usr/bin/env node
/**
 * Unified scraping pipeline — Playwright for JS-heavy portals, fetch for static sites.
 * Stores results in SQLite (data/akiya_hunter_v1.sqlite).
 *
 * Targets: SUUMO rent, HOMES rent, athome rent (Playwright, ≤6万円)
 *          jmty, inakanet, inakagurashi (fetch, semantic extraction)
 *
 * Enforces ~10s timeout per site, skips 403/failures gracefully.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'data', 'akiya_hunter_v1.sqlite');
const SCHEMA_PATH = path.join(ROOT, 'saiyasu-crawler-schema.sql');
const REPORT_PATH = path.join(ROOT, 'data', 'scrape-report-pipeline.json');
const SITE_TIMEOUT = 12000; // 12s per site (includes network)

const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県'
];

// ─── SQLite helpers ───
function openDb() {
  return new DatabaseSync(DB_PATH);
}

function initDb() {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const db = openDb();
  db.exec(schema);
  db.close();
}

function insertRows(rows) {
  if (rows.length === 0) return 0;
  const db = openDb();
  const stmt = db.prepare(`
    INSERT INTO properties (
      url, source, title, prefecture, city, address_raw,
      price_yen, price_raw, is_akiya, has_building, layout,
      building_area_sqm, land_area_sqm, building_age, notes,
      image_urls_json, first_seen_at, last_seen_at, created_at, updated_at
    ) VALUES (
      @url, @source, @title, @prefecture, @city, @address_raw,
      @price_yen, @price_raw, @is_akiya, @has_building, @layout,
      @building_area_sqm, @land_area_sqm, @building_age, @notes,
      @image_urls_json, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT(url) DO UPDATE SET
      source = excluded.source,
      title = excluded.title,
      prefecture = excluded.prefecture,
      city = excluded.city,
      address_raw = excluded.address_raw,
      price_yen = excluded.price_yen,
      price_raw = excluded.price_raw,
      is_akiya = excluded.is_akiya,
      has_building = excluded.has_building,
      layout = excluded.layout,
      building_area_sqm = excluded.building_area_sqm,
      land_area_sqm = excluded.land_area_sqm,
      building_age = excluded.building_age,
      notes = excluded.notes,
      image_urls_json = excluded.image_urls_json,
      last_seen_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `);

  let inserted = 0;
  for (const row of rows) {
    try {
      stmt.run({
        url: row.url,
        source: row.source,
        title: row.title || null,
        prefecture: row.prefecture || null,
        city: row.city || null,
        address_raw: row.address_raw || null,
        price_yen: row.price_yen ?? null,
        price_raw: row.price_raw || null,
        is_akiya: row.is_akiya ? 1 : 0,
        has_building: row.has_building ? 1 : 0,
        layout: row.layout || null,
        building_area_sqm: row.building_area_sqm ?? null,
        land_area_sqm: row.land_area_sqm ?? null,
        building_age: row.building_age ?? null,
        notes: row.notes || null,
        image_urls_json: JSON.stringify(row.image_urls || []),
      });
      inserted += 1;
    } catch {}
  }

  db.close();
  return inserted;
}

function getDbCount() {
  const db = openDb();
  const row = db.prepare('SELECT COUNT(*) AS count FROM properties').get();
  db.close();
  return row?.count || 0;
}

// ─── Helpers ───
function findPrefecture(text) {
  return PREFECTURES.find(p => text.includes(p)) || null;
}

function findCity(text, pref) {
  if (!pref) return null;
  const after = text.slice(text.indexOf(pref) + pref.length);
  const m = after.match(/^([^\s、,。\n]{1,20}(?:市|区|町|村|郡[^\s、,。\n]{1,20}(?:町|村)))/);
  return m ? m[1] : null;
}

function parsePrice(text) {
  const s = (text || '').replace(/,/g, '').replace(/　/g, ' ');
  // Monthly rent patterns
  const rentMan = s.match(/(\d+(?:\.\d+)?)\s*万円/);
  if (rentMan) return { yen: Math.round(Number(rentMan[1]) * 10000), raw: `${rentMan[1]}万円` };
  const rentYen = s.match(/(\d{4,7})\s*円/);
  if (rentYen) return { yen: Number(rentYen[1]), raw: `${rentYen[1]}円` };
  return { yen: null, raw: null };
}

function parseLayout(text) {
  const m = (text || '').match(/(\d+[SLDKR]+(?:\+S)?)/i);
  return m ? m[1] : null;
}

function parseArea(text, labels) {
  for (const label of labels) {
    const m = text.match(new RegExp(`${label}[^\\d]{0,15}(\\d+(?:\\.\\d+)?)\\s*(?:m|㎡)`, 'i'));
    if (m) return Number(m[1]);
  }
  return null;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
  ]);
}

// ─── Playwright scrapers ───
// Each returns { source, listings: [{url, source, title, prefecture, city, address_raw, price_yen, price_raw, layout, notes, image_urls}], error }

async function scrapeSuumoRent(browser) {
  const source = 'suumo_rent';
  const listings = [];
  let page;
  try {
    page = await browser.newPage();
    // SUUMO cheap rent search — Kanto area, ≤5万円 rent
    // ar=030 = Kanto, ct=5.0 = max 5万円
    const urls = [
      'https://suumo.jp/jj/chintai/ichiran/FR301FC001/?ar=030&bs=040&ct=5.0&cb=0.0&md=02&md=03&md=04&md=05&md=06&md=07',
      'https://suumo.jp/jj/chintai/ichiran/FR301FC001/?ar=040&bs=040&ct=5.0&cb=0.0&md=02&md=03&md=04&md=05&md=06&md=07',
      'https://suumo.jp/jj/chintai/ichiran/FR301FC001/?ar=050&bs=040&ct=5.0&cb=0.0&md=02&md=03&md=04&md=05&md=06&md=07',
    ];
    for (const url of urls) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(2000);
        const items = await page.$$eval('.cassetteitem', (cards) => {
          return cards.map(card => {
            const title = card.querySelector('.cassetteitem_content-title')?.textContent?.trim() || '';
            const address = card.querySelector('.cassetteitem_detail-col1')?.textContent?.trim() || '';
            // Get all room rows
            const rooms = card.querySelectorAll('.js-cassette_link');
            const results = [];
            for (const room of rooms) {
              const priceEl = room.querySelector('.cassetteitem_price--rent');
              const price = priceEl?.textContent?.trim() || '';
              const layout = room.querySelector('.cassetteitem_madori')?.textContent?.trim() || '';
              const area = room.querySelector('.cassetteitem_menseki')?.textContent?.trim() || '';
              const link = room.querySelector('a[href*="/chintai/"]')?.href || '';
              results.push({ title, address, price, layout, area, link });
            }
            if (results.length === 0) {
              const priceEl = card.querySelector('.cassetteitem_price--rent');
              results.push({
                title, address,
                price: priceEl?.textContent?.trim() || '',
                layout: card.querySelector('.cassetteitem_madori')?.textContent?.trim() || '',
                area: card.querySelector('.cassetteitem_menseki')?.textContent?.trim() || '',
                link: card.querySelector('a[href*="/chintai/"]')?.href || ''
              });
            }
            return results;
          }).flat();
        });

        for (const item of items) {
          if (!item.link && !item.address) continue;
          const pref = findPrefecture(item.address);
          const { yen, raw } = parsePrice(item.price);
          listings.push({
            url: item.link || `https://suumo.jp/chintai/#${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
            source,
            title: item.title || '賃貸物件',
            prefecture: pref,
            city: findCity(item.address, pref),
            address_raw: item.address || null,
            price_yen: yen,
            price_raw: raw,
            is_akiya: false,
            has_building: true,
            layout: item.layout || parseLayout(item.title),
            building_area_sqm: parseArea(item.area || '', ['専有面積', '']),
            notes: `賃貸 ${item.price} ${item.layout} ${item.area}`.trim(),
            image_urls: [],
          });
        }
      } catch (e) {
        // skip this URL, continue to next
      }
    }
    return { source, listings, error: null };
  } catch (error) {
    return { source, listings, error: error.message };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

async function scrapeHomesRent(browser) {
  const source = 'homes_rent';
  const listings = [];
  let page;
  try {
    page = await browser.newPage();
    // LIFULL HOME'S cheap rent — multiple regions
    const urls = [
      'https://www.homes.co.jp/chintai/b-1340/price-lower/',
      'https://www.homes.co.jp/chintai/b-1100/price-lower/',
      'https://www.homes.co.jp/chintai/b-2000/price-lower/',
    ];
    for (const url of urls) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(2000);
        const items = await page.$$eval('[class*="mod-mergeBuilding"], [class*="mod-building"], .prg-building', (cards) => {
          return cards.slice(0, 50).map(card => {
            const title = card.querySelector('[class*="building"] h2, [class*="bukkenName"], .prg-buildingName')?.textContent?.trim() || '';
            const address = card.querySelector('[class*="address"], [class*="detailInfo"], .prg-detailInfo')?.textContent?.trim() || '';
            const price = card.querySelector('[class*="price"], [class*="rent"], .prg-rent')?.textContent?.trim() || '';
            const layout = card.querySelector('[class*="type"], [class*="madori"], .prg-layout')?.textContent?.trim() || '';
            const link = card.querySelector('a')?.href || '';
            return { title, address, price, layout, link };
          });
        });

        for (const item of items) {
          const fullText = `${item.title} ${item.address}`;
          const pref = findPrefecture(fullText);
          const { yen, raw } = parsePrice(item.price);
          if (!pref && !item.link) continue;
          listings.push({
            url: item.link || `https://www.homes.co.jp/#${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
            source,
            title: item.title || '賃貸物件',
            prefecture: pref,
            city: findCity(fullText, pref),
            address_raw: item.address || null,
            price_yen: yen,
            price_raw: raw,
            is_akiya: false,
            has_building: true,
            layout: parseLayout(item.layout || item.title),
            notes: `賃貸 ${item.price} ${item.layout}`.trim(),
            image_urls: [],
          });
        }
      } catch (e) {
        // skip
      }
    }
    return { source, listings, error: null };
  } catch (error) {
    return { source, listings, error: error.message };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

async function scrapeAthomeRent(browser) {
  const source = 'athome_rent';
  const listings = [];
  let page;
  try {
    page = await browser.newPage();
    // athome cheap rent pages
    const urls = [
      'https://www.athome.co.jp/chintai/tokyo/list/?RENT_LOW=&RENT_HIGH=50000&FLOOR_PLAN=20&FLOOR_PLAN=30&FLOOR_PLAN=40&FLOOR_PLAN=50',
      'https://www.athome.co.jp/chintai/saitama/list/?RENT_LOW=&RENT_HIGH=50000&FLOOR_PLAN=20&FLOOR_PLAN=30&FLOOR_PLAN=40',
      'https://www.athome.co.jp/chintai/chiba/list/?RENT_LOW=&RENT_HIGH=50000&FLOOR_PLAN=20&FLOOR_PLAN=30&FLOOR_PLAN=40',
    ];
    for (const url of urls) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(2000);
        const items = await page.$$eval('[class*="p-property"], [data-property], .property-data, .p-buildingCard, table.propertyBlock, .newlistBlock, div[id^="buildingBlock"]', (cards) => {
          return cards.slice(0, 50).map(card => {
            const title = card.querySelector('h2, [class*="name"], [class*="title"]')?.textContent?.trim() || '';
            const address = card.querySelector('[class*="address"], [class*="location"]')?.textContent?.trim() || '';
            const price = card.querySelector('[class*="price"], [class*="rent"]')?.textContent?.trim() || '';
            const layout = card.querySelector('[class*="layout"], [class*="madori"]')?.textContent?.trim() || '';
            const link = card.querySelector('a')?.href || '';
            return { title, address, price, layout, link };
          });
        });

        for (const item of items) {
          const fullText = `${item.title} ${item.address}`;
          const pref = findPrefecture(fullText);
          const { yen, raw } = parsePrice(item.price);
          if (!pref && !item.link) continue;
          listings.push({
            url: item.link || `https://www.athome.co.jp/#${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
            source,
            title: item.title || '賃貸物件',
            prefecture: pref,
            city: findCity(fullText, pref),
            address_raw: item.address || null,
            price_yen: yen,
            price_raw: raw,
            is_akiya: false,
            has_building: true,
            layout: parseLayout(item.layout || item.title),
            notes: `賃貸 ${item.price} ${item.layout}`.trim(),
            image_urls: [],
          });
        }
      } catch (e) {
        // skip
      }
    }
    return { source, listings, error: null };
  } catch (error) {
    return { source, listings, error: error.message };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

// ─── Fetch-based scrapers (reusing semantic extraction patterns) ───
function decodeHtmlBuffer(buffer, contentType = '') {
  const sniff = buffer.subarray(0, 2048).toString('ascii');
  const charset = (
    contentType.match(/charset=([^;\s]+)/i)?.[1]
    || sniff.match(/charset=['\"]?([A-Za-z0-9_\-]+)/i)?.[1]
    || 'utf-8'
  ).toLowerCase();

  const normalized = charset.replace(/_/g, '-');
  const candidates = [normalized];
  if (normalized === 'shift-jis' || normalized === 'shift_jis' || normalized === 'sjis' || normalized === 'x-sjis') {
    candidates.unshift('shift_jis');
  }

  for (const enc of candidates) {
    try {
      return new TextDecoder(enc, { fatal: false }).decode(buffer);
    } catch {}
  }
  return buffer.toString('utf8');
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
      signal: controller.signal,
    });
    const buffer = Buffer.from(await res.arrayBuffer());
    clearTimeout(timer);
    return {
      ok: res.ok,
      status: res.status,
      url: res.url,
      text: decodeHtmlBuffer(buffer, res.headers.get('content-type') || ''),
    };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, status: 0, url, text: '', error: e.message };
  }
}

function stripTags(html) {
  return (html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

function extractAnchors(html, baseUrl) {
  const out = [];
  const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    try {
      out.push({ url: new URL(m[1], baseUrl).toString(), text: stripTags(m[2]) });
    } catch {}
  }
  return out;
}

function extractImages(html, baseUrl) {
  const imgs = [];
  const regex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    try {
      const src = new URL(m[1], baseUrl).toString();
      if (!/logo|icon|banner|sprite|button|header|footer|loading|blank/i.test(src) && !imgs.includes(src)) imgs.push(src);
    } catch {}
  }
  return imgs.slice(0, 5);
}

function titleFromHtml(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? stripTags(m[1]) : '';
}

function parseBuiltYear(text) {
  const y = text.match(/((?:19|20)\d{2})年/);
  if (y) return Number(y[1]);
  const s = text.match(/昭和\s*(\d+)年/);
  if (s) return 1925 + Number(s[1]);
  const h = text.match(/平成\s*(\d+)年/);
  if (h) return 1988 + Number(h[1]);
  const r = text.match(/令和\s*(\d+)年/);
  if (r) return 2018 + Number(r[1]);
  return null;
}

function semanticExtract(html, pageUrl, sourceName) {
  const text = stripTags(html);
  const title = titleFromHtml(html);
  const { yen, raw } = parsePrice(`${title} ${text}`);
  const pref = findPrefecture(text);
  const city = findCity(text, pref);
  const layout = parseLayout(`${title} ${text}`);
  const landArea = parseArea(text, ['土地面積', '敷地面積']);
  const buildArea = parseArea(text, ['建物面積', '延床面積', '専有面積']);
  const builtYear = parseBuiltYear(text);
  const images = extractImages(html, pageUrl);
  const age = builtYear ? new Date().getFullYear() - builtYear : null;

  return {
    url: pageUrl,
    source: sourceName,
    title: title || '物件情報',
    prefecture: pref,
    city,
    address_raw: pref ? text.match(new RegExp(`${pref}[^\\n]{0,80}`))?.[0]?.trim() : null,
    price_yen: yen,
    price_raw: raw,
    is_akiya: /空き家/.test(text),
    has_building: true,
    layout,
    building_area_sqm: buildArea,
    land_area_sqm: landArea,
    building_age: age,
    notes: text.slice(0, 300),
    image_urls: images,
  };
}

async function scrapeJmty() {
  const source = 'jmty_realestate';
  const listings = [];
  try {
    // Fetch listing pages
    const seedUrls = [
      'https://jmty.jp/all/est',
      'https://jmty.jp/all/est?page=2',
      'https://jmty.jp/all/est?page=3',
    ];
    const detailUrls = new Set();
    for (const seedUrl of seedUrls) {
      const res = await fetchText(seedUrl);
      if (!res.ok) continue;
      const anchors = extractAnchors(res.text, res.url);
      for (const a of anchors) {
        if (/\/article-|alliance-h_/.test(a.url) && !/(\/all\/|\/est-kw-|\/g-\d+|\/s-\d+)/.test(a.url)) {
          detailUrls.add(a.url);
        }
      }
    }

    // Fetch up to 30 detail pages
    const details = [...detailUrls].slice(0, 30);
    for (const url of details) {
      try {
        const res = await fetchText(url);
        if (!res.ok) continue;
        const listing = semanticExtract(res.text, res.url, source);
        if (listing.prefecture || listing.title !== '物件情報') listings.push(listing);
      } catch {}
    }
    return { source, listings, error: null };
  } catch (error) {
    return { source, listings, error: error.message };
  }
}

async function scrapeInakanet() {
  const source = 'inakanet';
  const listings = [];
  try {
    const res = await fetchText('https://www.inakanet.jp/');
    if (!res.ok) return { source, listings, error: `HTTP ${res.status}` };

    const anchors = extractAnchors(res.text, res.url);
    const detailUrls = new Set();
    for (const a of anchors) {
      if (/DataNum=\d+/.test(a.url)) detailUrls.add(a.url);
    }

    // Also check listing pages
    const listAnchors = anchors.filter(a => /\/search\/|\/list\/|page/.test(a.url));
    for (const la of listAnchors.slice(0, 3)) {
      try {
        const res2 = await fetchText(la.url);
        if (res2.ok) {
          for (const a of extractAnchors(res2.text, res2.url)) {
            if (/DataNum=\d+/.test(a.url)) detailUrls.add(a.url);
          }
        }
      } catch {}
    }

    for (const url of [...detailUrls].slice(0, 25)) {
      try {
        const res2 = await fetchText(url);
        if (!res2.ok) continue;
        const listing = semanticExtract(res2.text, res2.url, source);
        if (listing.prefecture) listings.push(listing);
      } catch {}
    }
    return { source, listings, error: null };
  } catch (error) {
    return { source, listings, error: error.message };
  }
}

async function scrapeInakagurashi() {
  const source = 'inakagurashi';
  const listings = [];
  try {
    const seeds = [
      'https://www.inakagurashi.jp/',
      'https://www.inakagurashi.jp/estate/',
    ];
    const detailUrls = new Set();
    for (const seedUrl of seeds) {
      try {
        const res = await fetchText(seedUrl);
        if (!res.ok) continue;
        const anchors = extractAnchors(res.text, res.url);
        for (const a of anchors) {
          if (/\/estate\//.test(a.url) && new URL(a.url).host.includes('inakagurashi')) {
            detailUrls.add(a.url);
          }
        }
      } catch {}
    }

    for (const url of [...detailUrls].slice(0, 25)) {
      try {
        const res = await fetchText(url);
        if (!res.ok) continue;
        const listing = semanticExtract(res.text, res.url, source);
        if (listing.prefecture) listings.push(listing);
      } catch {}
    }
    return { source, listings, error: null };
  } catch (error) {
    return { source, listings, error: error.message };
  }
}

// ─── Main pipeline ───
async function main() {
  console.log('=== Scrape Pipeline Start ===');
  console.log(`DB: ${DB_PATH}`);

  // Init DB
  initDb();
  const countBefore = getDbCount();
  console.log(`DB rows before: ${countBefore}`);

  const results = [];
  let browser;

  const playwrightScrapers = [
    { name: 'suumo_rent', fn: () => withTimeout(scrapeSuumoRent(browser), SITE_TIMEOUT) },
    { name: 'homes_rent', fn: () => withTimeout(scrapeHomesRent(browser), SITE_TIMEOUT) },
    { name: 'athome_rent', fn: () => withTimeout(scrapeAthomeRent(browser), SITE_TIMEOUT) },
  ];

  try {
    // Launch browser for Playwright scrapers
    console.log('\nLaunching Playwright browser...');
    browser = await chromium.launch({ headless: true });

    // Run Playwright scrapers sequentially (share browser)

    for (const scraper of playwrightScrapers) {
      console.log(`\n[Playwright] Scraping ${scraper.name}...`);
      try {
        const result = await scraper.fn();
        console.log(`  -> ${result.listings.length} listings ${result.error ? `(error: ${result.error})` : ''}`);
        results.push(result);
        // Insert to DB immediately
        if (result.listings.length > 0) {
          const inserted = insertRows(result.listings);
          console.log(`  -> ${inserted} inserted/updated in DB`);
        }
      } catch (error) {
        console.log(`  -> FAILED: ${error.message}`);
        results.push({ source: scraper.name, listings: [], error: error.message });
      }
    }

    await browser.close();
    browser = null;
  } catch (e) {
    console.log(`Browser launch failed: ${e.message}`);
    for (const scraper of playwrightScrapers) {
      results.push({ source: scraper.name, listings: [], error: `browser launch failed: ${e.message}` });
    }
    if (browser) await browser.close().catch(() => {});
  }

  // Run fetch-based scrapers concurrently
  console.log('\n[Fetch] Scraping jmty, inakanet, inakagurashi...');
  const fetchScrapers = [
    withTimeout(scrapeJmty(), SITE_TIMEOUT * 3).catch(e => ({ source: 'jmty_realestate', listings: [], error: e.message })),
    withTimeout(scrapeInakanet(), SITE_TIMEOUT * 2).catch(e => ({ source: 'inakanet', listings: [], error: e.message })),
    withTimeout(scrapeInakagurashi(), SITE_TIMEOUT * 2).catch(e => ({ source: 'inakagurashi', listings: [], error: e.message })),
  ];

  const fetchResults = await Promise.all(fetchScrapers);
  for (const result of fetchResults) {
    console.log(`  [${result.source}] ${result.listings.length} listings ${result.error ? `(error: ${result.error})` : ''}`);
    results.push(result);
    if (result.listings.length > 0) {
      const inserted = insertRows(result.listings);
      console.log(`    -> ${inserted} inserted/updated in DB`);
    }
  }

  // Summary
  const countAfter = getDbCount();
  const totalScraped = results.reduce((sum, r) => sum + r.listings.length, 0);
  const failedSites = results.filter(r => r.listings.length === 0);

  const report = {
    executedAt: new Date().toISOString(),
    dbPath: DB_PATH,
    dbRowsBefore: countBefore,
    dbRowsAfter: countAfter,
    newRows: countAfter - countBefore,
    totalScraped,
    sites: results.map(r => ({
      source: r.source,
      count: r.listings.length,
      error: r.error || null,
    })),
    failedSites: failedSites.map(r => r.source),
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');

  console.log('\n=== Pipeline Complete ===');
  console.log(`Total scraped: ${totalScraped}`);
  console.log(`DB rows: ${countBefore} -> ${countAfter} (+${countAfter - countBefore})`);
  console.log(`Failed sites: ${failedSites.length > 0 ? failedSites.map(r => r.source).join(', ') : 'none'}`);
  console.log(`Report: ${REPORT_PATH}`);

  return report;
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
