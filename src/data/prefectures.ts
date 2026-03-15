export type PrefectureData = {
  slug: string;
  name: string;
  region: string;
};

export const prefectures: PrefectureData[] = [
  { slug: "hokkaido", name: "北海道", region: "hokkaido" },
  { slug: "aomori", name: "青森県", region: "tohoku" },
  { slug: "iwate", name: "岩手県", region: "tohoku" },
  { slug: "miyagi", name: "宮城県", region: "tohoku" },
  { slug: "akita", name: "秋田県", region: "tohoku" },
  { slug: "yamagata", name: "山形県", region: "tohoku" },
  { slug: "fukushima", name: "福島県", region: "tohoku" },
  { slug: "ibaraki", name: "茨城県", region: "kanto" },
  { slug: "tochigi", name: "栃木県", region: "kanto" },
  { slug: "gunma", name: "群馬県", region: "kanto" },
  { slug: "saitama", name: "埼玉県", region: "kanto" },
  { slug: "chiba", name: "千葉県", region: "kanto" },
  { slug: "tokyo", name: "東京都", region: "kanto" },
  { slug: "kanagawa", name: "神奈川県", region: "kanto" },
  { slug: "niigata", name: "新潟県", region: "chubu" },
  { slug: "toyama", name: "富山県", region: "chubu" },
  { slug: "ishikawa", name: "石川県", region: "chubu" },
  { slug: "fukui", name: "福井県", region: "chubu" },
  { slug: "yamanashi", name: "山梨県", region: "chubu" },
  { slug: "nagano", name: "長野県", region: "chubu" },
  { slug: "gifu", name: "岐阜県", region: "chubu" },
  { slug: "shizuoka", name: "静岡県", region: "chubu" },
  { slug: "aichi", name: "愛知県", region: "chubu" },
  { slug: "mie", name: "三重県", region: "kinki" },
  { slug: "shiga", name: "滋賀県", region: "kinki" },
  { slug: "kyoto", name: "京都府", region: "kinki" },
  { slug: "osaka", name: "大阪府", region: "kinki" },
  { slug: "hyogo", name: "兵庫県", region: "kinki" },
  { slug: "nara", name: "奈良県", region: "kinki" },
  { slug: "wakayama", name: "和歌山県", region: "kinki" },
  { slug: "tottori", name: "鳥取県", region: "chugoku" },
  { slug: "shimane", name: "島根県", region: "chugoku" },
  { slug: "okayama", name: "岡山県", region: "chugoku" },
  { slug: "hiroshima", name: "広島県", region: "chugoku" },
  { slug: "yamaguchi", name: "山口県", region: "chugoku" },
  { slug: "tokushima", name: "徳島県", region: "shikoku" },
  { slug: "kagawa", name: "香川県", region: "shikoku" },
  { slug: "ehime", name: "愛媛県", region: "shikoku" },
  { slug: "kochi", name: "高知県", region: "shikoku" },
  { slug: "fukuoka", name: "福岡県", region: "kyushu" },
  { slug: "saga", name: "佐賀県", region: "kyushu" },
  { slug: "nagasaki", name: "長崎県", region: "kyushu" },
  { slug: "kumamoto", name: "熊本県", region: "kyushu" },
  { slug: "oita", name: "大分県", region: "kyushu" },
  { slug: "miyazaki", name: "宮崎県", region: "kyushu" },
  { slug: "kagoshima", name: "鹿児島県", region: "kyushu" },
  { slug: "okinawa", name: "沖縄県", region: "kyushu" },
];

export function getPrefectureBySlug(slug: string) {
  return prefectures.find((p) => p.slug === slug);
}

export function getPrefectureByName(name: string) {
  return prefectures.find((p) => p.name === name);
}
