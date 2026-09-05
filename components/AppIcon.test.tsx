import * as React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppIcon, type AppIconId } from "@/components/AppIcon";

const appIds: AppIconId[] = [
  "calculator",
  "notes",
  "ai",
  "music",
  "tasks",
  "settings",
];

describe("AppIcon", () => {
  it("renders each app as one simple decorative glyph without extra layers", () => {
    for (const app of appIds) {
      const { container, unmount } = render(<AppIcon app={app} />);
      const icon = container.querySelector(`[data-app-icon="${app}"]`);

      expect(icon?.querySelectorAll(":scope > span")).toHaveLength(0);
      expect(icon?.querySelectorAll(":scope > svg")).toHaveLength(1);
      expect(icon?.getAttribute("aria-hidden")).toBe("true");

      unmount();
    }
  });
});
