export function formatPrice(price: number): string {
  if (price === 0) return "0円（無償譲渡）";
  if (price < 10000) return `${price.toLocaleString()}円`;
  const man = price / 10000;
  return `${man.toLocaleString()}万円`;
}

export function formatArea(area: number): string {
  const tsubo = Math.round(area * 0.3025 * 10) / 10;
  return `${area.toLocaleString()}㎡（約${tsubo}坪）`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
