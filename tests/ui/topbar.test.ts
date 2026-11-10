import { describe, expect, it } from "vitest";
import { formatClock, lovedFearedPercent } from "../../src/ui/topbar";

describe("formatClock", () => {
  it("formats minutes since midnight as h:mm", () => {
    expect(formatClock(360)).toBe("6:00");
    expect(formatClock(605)).toBe("10:05");
    expect(formatClock(1439)).toBe("23:59");
    expect(formatClock(0)).toBe("0:00");
  });

  it("wraps past midnight and floors fractional minutes", () => {
    expect(formatClock(1440 + 61)).toBe("1:01");
    expect(formatClock(360.9)).toBe("6:00");
  });
});

describe("lovedFearedPercent", () => {
  it("puts Loved (+100) at the left end and Feared (-100) at the right", () => {
    expect(lovedFearedPercent(100)).toBe(0);
    expect(lovedFearedPercent(-100)).toBe(100);
    expect(lovedFearedPercent(0)).toBe(50);
  });

  it("clamps out-of-range values and treats NaN as 0", () => {
    expect(lovedFearedPercent(250)).toBe(0);
    expect(lovedFearedPercent(-250)).toBe(100);
    expect(lovedFearedPercent(NaN)).toBe(50);
  });
});
