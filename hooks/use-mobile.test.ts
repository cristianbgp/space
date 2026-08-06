import { describe, expect, it } from "vitest";

import { isMobileViewport } from "@/hooks/use-mobile";

describe("isMobileViewport", () => {
  it.each([
    { height: 812, mobile: true, width: 375 },
    { height: 375, mobile: true, width: 812 },
    { height: 800, mobile: false, width: 812 },
    { height: 700, mobile: false, width: 1200 },
  ])(
    "classifies $width x $height as mobile=$mobile",
    ({ height, mobile, width }) => {
      expect(isMobileViewport(width, height)).toBe(mobile);
    }
  );
});
