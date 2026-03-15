/**
 * saku_akiya source — Saku city (佐久市, Nagano) akiya bank.
 *
 * Real site: https://39ijyu.com/ (external portal "佐久にくらす")
 * Listing page: /all.php?kubun=IE
 * Detail pages: /detail.php?id=<id>&kubun=IE (plain text format)
 * Status: live (34 properties; text-format parser validated; rental listings
 *         excluded via linkTextExclude filter)
 */

const { registerMunicipalSource } = require('./municipal_base');

registerMunicipalSource({
  listingStrategyName: 'saku_listing',
  detailStrategyName: 'saku_detail',
  listing: {
    prefecture: '長野県',
    linkPattern: /detail\.php\?id=\d+/,
    linkTextFilter: /佐久|万円|物件|戸建/,
    linkTextExclude: /賃貸/
  },
  detail: {
    sourceName: 'saku_akiya',
    prefecture: '長野県',
    city: '佐久市',
    format: 'text',
    labels: {
      buildingArea: '延床面積|建物面積|建築面積'
    },
    inquiryCodePattern: /id=(\d+)/
  }
});
