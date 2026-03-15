/**
 * chichibu_akiya source — Chichibu region (秩父地域, Saitama) akiya bank.
 *
 * Real site: https://www.chichibuakiyabank.com/
 * Detail pages: /property/<id> (plain text label/value format)
 * Covers Chichibu city + surrounding towns (皆野町, 長瀞町, 横瀬町, etc.)
 * Status: live (6+ properties verified 2026-03; text-format parser
 *         validated against live HTML — detail pages use label：value format)
 */

const { registerMunicipalSource } = require('./municipal_base');

registerMunicipalSource({
  listingStrategyName: 'chichibu_listing',
  detailStrategyName: 'chichibu_detail',
  listing: {
    prefecture: '埼玉県',
    linkPattern: /\/property\/\d+/,
    linkTextFilter: /秩父|皆野|長瀞|横瀬|小鹿野|万円|物件/
  },
  detail: {
    sourceName: 'chichibu_akiya',
    prefecture: '埼玉県',
    city: '秩父市',
    format: 'text',
    labels: {
      address: '所在地|住所',
      price: '価格|売買価格',
      landArea: '敷地面積|土地面積',
      buildingArea: '建物面積|延床面積|建築面積',
      construction: '築年月|建築時期|建築年'
    },
    inquiryCodePattern: /\/property\/(\d+)/
  }
});
