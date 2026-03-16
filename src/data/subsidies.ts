import { Subsidy } from "@/types/subsidy";

export const subsidies: Subsidy[] = [
  {
    id: "s1",
    prefecture: "長野県",
    city: "飯山市",
    title: "飯山市移住支援金",
    summary:
      "東京圏から飯山市に移住した場合、単身60万円、世帯100万円の支援金を交付。",
    amount: "最大100万円",
    conditions: "東京23区在住または通勤者、5年以上居住の意思があること",
    sourceUrl: "https://www.city.iiyama.nagano.jp/",
    updatedAt: "2026-03-16",
  },
  {
    id: "s2",
    prefecture: "高知県",
    city: "四万十市",
    title: "四万十市移住奨励金",
    summary:
      "四万十市に移住し、空き家バンク物件を購入・改修した場合に奨励金を支給。",
    amount: "最大150万円（改修費補助含む）",
    conditions: "空き家バンク登録物件の購入、5年以上の定住意思",
    sourceUrl: "https://www.city.shimanto.lg.jp/",
    updatedAt: "2026-03-16",
  },
  {
    id: "s3",
    prefecture: "北海道",
    city: "深川市",
    title: "深川市定住促進助成金",
    summary:
      "深川市に住宅を取得して定住する方に助成金を交付。新築・中古ともに対象。",
    amount: "最大50万円",
    conditions: "市内に住宅を取得し、10年以上定住する意思があること",
    sourceUrl: "https://www.city.fukagawa.lg.jp/",
    updatedAt: "2026-03-16",
  },
  {
    id: "s4",
    prefecture: "千葉県",
    city: "南房総市",
    title: "南房総市空き家活用補助金",
    summary:
      "空き家バンク登録物件の改修費用を補助。移住促進と空き家解消を目的とする。",
    amount: "最大200万円（改修費の1/2）",
    conditions: "空き家バンク物件の購入者、改修後5年以上居住",
    sourceUrl: "https://www.city.minamiboso.chiba.jp/",
    updatedAt: "2026-03-16",
  },
  {
    id: "s5",
    prefecture: "秋田県",
    city: "横手市",
    title: "横手市移住・定住促進事業",
    summary:
      "横手市への移住者に対し、住宅取得費用や引越し費用の一部を補助。子育て世帯は加算あり。",
    amount: "最大120万円（子育て加算含む）",
    conditions: "市外からの転入者、3年以上定住の意思",
    sourceUrl: "https://www.city.yokote.lg.jp/",
    updatedAt: "2026-03-16",
  },
  {
    id: "s6",
    prefecture: "大分県",
    city: "竹田市",
    title: "竹田市移住者住宅改修支援",
    summary:
      "竹田市に移住し、空き家を改修して住む場合に改修費を補助。",
    amount: "最大100万円",
    conditions: "空き家バンク物件の活用、移住後3年以上の定住",
    sourceUrl: "https://www.city.taketa.oita.jp/",
    updatedAt: "2026-03-16",
  },
];

