import { describe, it, expect } from "vitest";
import { NAV_GROUP_LABEL_KEYS, NAV_ITEM_LABEL_KEYS } from "./nav-labels";
import en from "./en.json";
import hi from "./hi.json";
import gu from "./gu.json";
import ta from "./ta.json";

const locales: Record<string, Record<string, string>> = { en, hi, gu, ta };

describe("nav label translation keys", () => {
  const allKeys = [
    ...Object.values(NAV_GROUP_LABEL_KEYS),
    ...Object.values(NAV_ITEM_LABEL_KEYS),
  ];

  it("every mapped key exists in every dashboard locale (en/hi/gu/ta)", () => {
    for (const [localeName, dict] of Object.entries(locales)) {
      for (const key of allKeys) {
        expect(dict[key], `missing "${key}" in ${localeName}.json`).toBeTruthy();
      }
    }
  });
});
