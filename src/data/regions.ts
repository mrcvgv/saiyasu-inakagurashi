export type Region = {
  slug: string;
  name: string;
  prefectures: string[]; // prefecture slugs
};

export const regions: Region[] = [
  { slug: "hokkaido", name: "北海道", prefectures: ["hokkaido"] },
  { slug: "tohoku", name: "東北", prefectures: ["aomori", "iwate", "miyagi", "akita", "yamagata", "fukushima"] },
  { slug: "kanto", name: "関東", prefectures: ["ibaraki", "tochigi", "gunma", "saitama", "chiba", "tokyo", "kanagawa"] },
  { slug: "chubu", name: "中部", prefectures: ["niigata", "toyama", "ishikawa", "fukui", "yamanashi", "nagano", "gifu", "shizuoka", "aichi"] },
  { slug: "kinki", name: "近畿", prefectures: ["mie", "shiga", "kyoto", "osaka", "hyogo", "nara", "wakayama"] },
  { slug: "chugoku", name: "中国", prefectures: ["tottori", "shimane", "okayama", "hiroshima", "yamaguchi"] },
  { slug: "shikoku", name: "四国", prefectures: ["tokushima", "kagawa", "ehime", "kochi"] },
  { slug: "kyushu", name: "九州・沖縄", prefectures: ["fukuoka", "saga", "nagasaki", "kumamoto", "oita", "miyazaki", "kagoshima", "okinawa"] },
];
