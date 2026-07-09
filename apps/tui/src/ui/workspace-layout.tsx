import React from 'react';
import { Box, Text } from 'ink';

export type WorkspaceTab = 'chat' | 'stats' | 'config' | 'outputs';

export function WorkspaceFrame({
  rows,
  columns,
  scrollableRows,
  scrollable,
  bottom,
}: {
  rows: number;
  columns: number;
  scrollableRows: number;
  scrollable: React.ReactNode;
  bottom: React.ReactNode;
}) {
  const safeColumns = Math.max(1, Math.floor(columns));

  if (rows < 20) {
    return (
      <Box flexDirection="column" height={rows} width={safeColumns}>
        <Box paddingX={1} flexDirection="column">
          <Text color="yellow" bold>Terminal too small</Text>
          <Text color="gray">Resize to at least 80x20 for the DataFoundry TUI.</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height={rows} width={safeColumns}>
      <Box
        height={Math.max(0, Math.floor(scrollableRows))}
        width={safeColumns}
        overflowY="hidden"
        flexDirection="column"
        flexShrink={0}
      >
        {scrollable}
      </Box>
      <Box width={safeColumns} flexShrink={0} flexDirection="column">
        {bottom}
      </Box>
    </Box>
  );
}

export function estimateBottomRows(
  options: { commandNotice: boolean; activeTab: WorkspaceTab; homeScreen?: boolean },
): number {
  if (options.homeScreen) {
    return 1;
  }

  if (options.activeTab === 'chat') {
    return options.commandNotice ? 6 : 5;
  }
  return options.commandNotice ? 9 : 8;
}

/** Rows available for chat transcript inside the scrollable slot. */
export function chatViewportRows(
  terminalRows: number,
  bottomRows: number,
): number {
  return Math.max(0, terminalRows - Math.max(0, Math.floor(bottomRows)));
}
