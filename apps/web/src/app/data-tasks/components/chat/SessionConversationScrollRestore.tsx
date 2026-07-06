"use client";

import { useAgent, useCopilotChatConfiguration } from "@copilotkit/react-core/v2";
import { useLayoutEffect, useRef } from "react";
import { scrollCopilotChatToBottomWithRetries } from "../../chat-scroll";
import { useConversationRestoreGate } from "../../use-data-foundry-run";

/**
 * After a historical thread is restored (switch session or full page refresh),
 * CopilotKit's pin-to-bottom does not always follow batch-loaded messages.
 * Pin the chat viewport to the latest message once restore settles.
 */
export function SessionConversationScrollRestore({
  agentId,
}: {
  agentId: string;
}) {
  const chatConfig = useCopilotChatConfiguration();
  const threadId = chatConfig?.threadId;
  const { agent } = useAgent({ agentId });
  const { isRestoringConversation } = useConversationRestoreGate();
  const prevRestoringRef = useRef(isRestoringConversation);
  const activeThreadRef = useRef<string | null>(null);
  const pendingScrollRef = useRef(false);
  const cancelScrollRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    cancelScrollRef.current?.();
    cancelScrollRef.current = null;

    if (!threadId) {
      return;
    }

    if (activeThreadRef.current !== threadId) {
      activeThreadRef.current = threadId;
      pendingScrollRef.current = true;
    }

    if (isRestoringConversation) {
      prevRestoringRef.current = isRestoringConversation;
      return;
    }

    const messageCount = agent.messages?.length ?? 0;
    const restoreCompleted =
      prevRestoringRef.current && !isRestoringConversation;

    if (messageCount > 0 && (restoreCompleted || pendingScrollRef.current)) {
      cancelScrollRef.current = scrollCopilotChatToBottomWithRetries();
      pendingScrollRef.current = false;
    }

    prevRestoringRef.current = isRestoringConversation;

    return () => {
      cancelScrollRef.current?.();
      cancelScrollRef.current = null;
    };
  }, [agent.messages, isRestoringConversation, threadId]);

  return null;
}
