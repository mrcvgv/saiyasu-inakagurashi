import { Listing } from "@/types/listing";
import { listings as dummyListings } from "./listings";

let liveListings: Listing[] | null = null;

try {
  // listings-live.json が存在すれば読み込む（ビルド時に解決）
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const liveData = require("./listings-live.json");
  if (Array.isArray(liveData) && liveData.length > 0) {
    liveListings = liveData as Listing[];
  }
} catch {
  // ファイルが存在しない場合はダミーデータにフォールバック
}

export const allListings: Listing[] = liveListings ?? dummyListings;
