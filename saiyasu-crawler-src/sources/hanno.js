/**
 * hanno_akiya source — Hanno city (飯能市, Saitama) municipal akiya bank.
 *
 * Real listing: https://www.city.hanno.lg.jp/kurashi_seikatsukankyo/akiya_reform/akiyabank/3962.html
 * Detail pages may be PDF documents (e.g. S4-6_.pdf). The shared fetch layer now
 * extracts PDF text before handing it to the standard municipal text parser.
 */

const { registerMunicipalSource } = require('./municipal_base');

registerMunicipalSource({
  listingStrategyName: 'hanno_listing',
  detailStrategyName: 'hanno_detail',
  listing: {
    prefecture: '埼玉県',
    linkPattern: /akiya.*\d+|\/\d+\.html|\/[A-Z]\d+-\d+_?\.pdf/i,
    linkTextFilter: /空き家バンク|物件/
  },
  detail: {
    sourceName: 'hanno_akiya',
    prefecture: '埼玉県',
    city: '飯能市',
    format: 'text',
    inquiryCodePattern: /([A-Z]\d+-\d+)_?\.pdf|akiya[_-]?(\w+)|\/(\d+)\.html/i
  }
});
