/**
 * minamiboso_akiya source — Minamiboso city (南房総市, Chiba) akiya bank.
 *
 * Real site: https://www.minamibosocity-iju.jp/guide/house/vacant/
 * Detail pages: /vacant/<id>/ (definition list dt/dd format)
 * Covers Minamiboso city (千倉町, 富浦町, 和田町, etc.)
 * Status: live (12+ active listings; dl-format (dt/dd) parser validated;
 *         live page labels match fixture: 所在地, 価格, 間取り, 敷地面積, 延床面積, 築年月)
 */

const { registerMunicipalSource } = require('./municipal_base');

registerMunicipalSource({
  listingStrategyName: 'minamiboso_listing',
  detailStrategyName: 'minamiboso_detail',
  listing: {
    prefecture: '千葉県',
    linkPattern: /\/vacant\/\d+\//,
    linkTextFilter: /南房総|万円|物件|No\.|平屋|海/
  },
  detail: {
    sourceName: 'minamiboso_akiya',
    prefecture: '千葉県',
    city: '南房総市',
    format: 'dl',
    labels: {
      address: '所在地|住所',
      price: '価格|売買価格|賃貸価格',
      landArea: '敷地面積|土地面積',
      buildingArea: '延床面積|建物面積|建築面積',
      construction: '築年月|建築時期|建築年'
    },
    inquiryCodePattern: /\/vacant\/(\d+)\//
  }
});
