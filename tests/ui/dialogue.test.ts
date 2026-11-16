import { describe, expect, it } from "vitest";
import { bubbleContent } from "../../src/ui/chatBubbles";
import { dialogueEdge } from "../../src/ui/dialogueBox";

describe("dialogueEdge", () => {
  it("sits at the bottom unless the speakers are low on screen", () => {
    expect(dialogueEdge(150, 400)).toBe("bottom");
    expect(dialogueEdge(230, 400)).toBe("bottom"); // just below the middle, where the camera keeps her
    expect(dialogueEdge(280, 400)).toBe("bottom");
    expect(dialogueEdge(281, 400)).toBe("top");
    expect(dialogueEdge(360, 400)).toBe("top");
  });
});

describe("bubbleContent", () => {
  it("shows the words up close and dots far away", () => {
    expect(bubbleContent("Hi.", 3, 4)).toEqual({ kind: "words", text: "Hi." });
    expect(bubbleContent("Hi.", 4, 4)).toEqual({ kind: "words", text: "Hi." });
    expect(bubbleContent("Hi.", 5, 4)).toEqual({ kind: "dots" });
  });
});
