/**
 * sakuho_akiya source — Sakuho town (佐久穂町, Nagano) akiya bank.
 *
 * Real site: https://www.town.sakuho.nagano.jp/iju/live/index.html
 * Detail pages: /iju/live/akiya/house/house_<id>.html (plain text format)
 * Status: trial (8 house listings verified 2026-03; text-format parser;
 *         linkPattern filters to house_ only, excluding land plots)
 */

const { registerMunicipalSource } = require('./municipal_base');

registerMunicipalSource({
  listingStrategyName: 'sakuho_listing',
  detailStrategyName: 'sakuho_detail',
  listing: {
    prefecture: '長野県',
    linkPattern: /akiya\/house\/house_\d+\.html/,
    linkTextFilter: /登録番号|万円|空き家/
  },
  detail: {
    sourceName: 'sakuho_akiya',
    prefecture: '長野県',
    city: '佐久穂町',
    format: 'text',
    labels: {
      construction: '築年月|築年|建築時期|建築年'
    },
    inquiryCodePattern: /house_(\d+)\.html/
  }
});
