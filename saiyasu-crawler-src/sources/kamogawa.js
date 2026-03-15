/**
 * kamogawa_akiya source — Kamogawa city (鴨川市, Chiba) municipal akiya bank.
 *
 * Real site: https://www.city.kamogawa.lg.jp/site/iju/list34-104.html
 * Detail pages: /site/iju/<id>.html (plain text label/value format)
 * Status: live (43 properties verified 2026-03; text-format parser
 *         validated against live HTML — detail pages use label：value format)
 */

const { registerMunicipalSource } = require('./municipal_base');

registerMunicipalSource({
  listingStrategyName: 'kamogawa_listing',
  detailStrategyName: 'kamogawa_detail',
  listing: {
    prefecture: '千葉県',
    linkPattern: /\/site\/iju\/\d+\.html/,
    linkTextFilter: /万円|物件/
  },
  detail: {
    sourceName: 'kamogawa_akiya',
    prefecture: '千葉県',
    city: '鴨川市',
    format: 'text',
    labels: {
      buildingArea: '建築面積|建物面積|延床面積'
    },
    inquiryCodePattern: /\/(\d+)\.html/
  }
});
