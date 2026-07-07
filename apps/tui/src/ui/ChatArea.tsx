import React from 'react';
import { Box, Text } from 'ink';
import type { DataArtifact, DisplayMessage, LiveToolCallRecord } from '../state/index.js';
import {
  buildChatLines,
  chatContentWidth,
  countChatLines,
  type VisualLine,
  type StartupInfo,
} from './transcript-lines.js';

export { chatContentWidth, countChatLines };
export type { StartupInfo };

interface ChatAreaProps {
  messages: DisplayMessage[];
  artifacts: DataArtifact[];
  toolCalls?: LiveToolCallRecord[];
  totalMessageCount?: number;
  maxMessageContentLength?: number | undefined;
  viewportRows?: number;
  scrollbackRows?: number;
  columns?: number;
  startup?: StartupInfo | undefined;
}

function messageIDFromKey(key: string): string | undefined {
  if (!key.startsWith('m:')) return undefined;
  const end = key.indexOf(':', 2);
  if (end === -1) return undefined;
  return key.slice(2, end);
}

function snapTopToNearbyMessageStart(
  lines: VisualLine[],
  top: number,
  viewport: number,
): number {
  if (top <= 0 || top >= lines.length) return top;

  const currentID = messageIDFromKey(lines[top]?.key ?? '');
  if (!currentID) return top;

  const currentKey = lines[top]?.key;
  if (currentKey === `m:${currentID}:h` || currentKey === `m:${currentID}:after`) {
    return top;
  }

  let start = top;
  while (start > 0 && messageIDFromKey(lines[start - 1]?.key ?? '') === currentID) {
    start -= 1;
  }

  if (lines[start]?.key !== `m:${currentID}:h`) return top;

  // Preserve bottom anchoring for large blocks; fix the common case where the
  // slice starts one or two rows below a message header.
  const shift = top - start;
  if (shift <= Math.min(2, viewport - 1)) return start;
  return top;
}

/**
 * Chat transcript viewport.
 *
 * The transcript is rendered into a flat list of single-row lines (see
 * {@link buildChatLines}), then the visible window is an exact slice of that
 * list. Because each line is pre-wrapped to the content width, Ink renders one
 * terminal row per line and the row count is deterministic - so scrolling is a
 * pure integer slice with no height estimation and no negative-margin cropping.
 */
export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  artifacts,
  toolCalls = [],
  totalMessageCount,
  maxMessageContentLength,
  viewportRows,
  scrollbackRows = 0,
  columns = 100,
  startup,
}) => {
  const lines = buildChatLines({
    messages,
    artifacts,
    toolCalls,
    totalMessageCount,
    maxMessageContentLength,
    columns,
    startup,
  });

  if (viewportRows === undefined) {
    return (
      <Box flexDirection="column">
        {lines.map((line) => line.node)}
      </Box>
    );
  }

  const viewport = Math.max(1, viewportRows);
  const total = lines.length;
  const maxScroll = Math.max(0, total - viewport);
  const safeScroll = Math.max(0, Math.min(scrollbackRows, maxScroll));

  // Short conversations start at the top of the scroll viewport, matching
  // OpenCode's session page. Once content exceeds the viewport, keep the latest
  // rows visible unless the user has scrolled back.
  const messageCount = totalMessageCount ?? messages.length;
  const hasContent = messageCount > 0;

  let visible: typeof lines;

  if (!hasContent) {
    visible = lines.slice(0, viewport);
  } else if (total <= viewport) {
    visible = lines;
  } else {
    // Early sessions should not jump straight to the bottom when the startup
    // banner is replaced by the first messages. Later sessions stay anchored to
    // the latest row, unless that would hide a nearby message header.
    const shouldPinEarlyConversation = messageCount <= 3 && safeScroll === 0;

    if (shouldPinEarlyConversation) {
      visible = lines.slice(0, viewport);
    } else {
      const rawTop = Math.max(0, total - viewport - safeScroll);
      const top = safeScroll === 0
        ? snapTopToNearbyMessageStart(lines, rawTop, viewport)
        : rawTop;
      visible = lines.slice(top, top + viewport);
    }
  }

  const bottomPadding = Math.max(0, viewport - visible.length);

  return (
    <Box flexDirection="column" flexGrow={1} overflowY="hidden">
      <Box flexDirection="column" overflowY="hidden">
        {visible.map((line) => line.node)}
        {Array.from({ length: bottomPadding }, (_, index) => (
          <Text key={`pad-bottom:${index}`}> </Text>
        ))}
      </Box>
    </Box>
  );
};
