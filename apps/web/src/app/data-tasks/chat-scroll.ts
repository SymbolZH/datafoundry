function isScrollableOverflow(overflowY: string): boolean {
  return overflowY === "auto" || overflowY === "scroll";
}

function readOverflowY(element: HTMLElement): string {
  const inlineOverflowY = element.style?.overflowY;
  if (inlineOverflowY) {
    return inlineOverflowY;
  }
  if (typeof getComputedStyle === "function") {
    return getComputedStyle(element).overflowY;
  }
  return "";
}

export function findCopilotChatScrollContainer(
  root: ParentNode = document,
): HTMLElement | null {
  const content = root.querySelector('[data-testid="copilot-scroll-content"]');
  if (!content || typeof content !== "object" || !("parentElement" in content)) {
    return null;
  }

  let element = (content as HTMLElement).parentElement;
  while (element) {
    if (isScrollableOverflow(readOverflowY(element))) {
      return element;
    }
    element = element.parentElement;
  }

  return null;
}

export function scrollCopilotChatToBottom(
  root: ParentNode = document,
  behavior: ScrollBehavior = "auto",
): boolean {
  const container = findCopilotChatScrollContainer(root);
  if (!container) {
    return false;
  }

  container.scrollTo({
    top: container.scrollHeight,
    behavior,
  });
  return true;
}

export function scrollCopilotChatToBottomWithRetries(input?: {
  root?: ParentNode;
  attempts?: number;
  intervalMs?: number;
  schedule?: (callback: () => void) => void;
  delay?: (callback: () => void, intervalMs: number) => number;
}): () => void {
  const {
    root = document,
    attempts = 8,
    intervalMs = 50,
    schedule = (callback) => requestAnimationFrame(callback),
    delay = (callback, waitMs) => window.setTimeout(callback, waitMs),
  } = input ?? {};

  let cancelled = false;
  let attempt = 0;

  const tick = () => {
    if (cancelled) {
      return;
    }
    scrollCopilotChatToBottom(root, "auto");
    attempt += 1;
    if (attempt < attempts) {
      delay(tick, intervalMs);
    }
  };

  schedule(tick);

  return () => {
    cancelled = true;
  };
}
