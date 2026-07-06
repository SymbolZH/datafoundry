import { describe, expect, it } from "vitest";
import {
  findCopilotChatScrollContainer,
  scrollCopilotChatToBottom,
  scrollCopilotChatToBottomWithRetries,
} from "../chat-scroll";

function createScrollFixture() {
  const content = {
    dataset: { testid: "copilot-scroll-content" },
    parentElement: null as HTMLElement | null,
  } as unknown as HTMLElement;

  const scroll = {
    style: { overflowY: "auto" },
    scrollTop: 0,
    scrollHeight: 400,
    scrollTo({ top }: ScrollToOptions) {
      this.scrollTop = top ?? 0;
    },
    parentElement: null,
  } as unknown as HTMLElement;

  content.parentElement = scroll;
  const root = {
    querySelector(selector: string) {
      return selector === '[data-testid="copilot-scroll-content"]' ? content : null;
    },
  } as unknown as ParentNode;

  return { root, scroll };
}

describe("chat scroll helpers", () => {
  it("finds the scroll container above copilot-scroll-content", () => {
    const { root, scroll } = createScrollFixture();
    expect(findCopilotChatScrollContainer(root)).toBe(scroll);
  });

  it("scrolls the chat container to the bottom", () => {
    const { root, scroll } = createScrollFixture();
    expect(scrollCopilotChatToBottom(root)).toBe(true);
    expect(scroll.scrollTop).toBe(scroll.scrollHeight);
  });

  it("retries scrolling until attempts are exhausted", () => {
    const { root, scroll } = createScrollFixture();
    const calls: number[] = [];

    const cancel = scrollCopilotChatToBottomWithRetries({
      root,
      attempts: 3,
      intervalMs: 10,
      schedule: (callback) => {
        callback();
        return 0;
      },
      delay: (callback, waitMs) => {
        calls.push(waitMs);
        callback();
        return calls.length;
      },
    });

    expect(calls).toEqual([10, 10]);
    expect(scroll.scrollTop).toBe(scroll.scrollHeight);
    cancel();
  });
});
