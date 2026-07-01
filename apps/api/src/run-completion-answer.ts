import { EventType, type BaseEvent } from "@ag-ui/client";

const FILE_COMPLETION_TOOLS = new Set([
  "write_file",
  "edit_file",
  "execute_command",
  "publish_artifact",
]);

type ToolStartMeta = {
  path: string | undefined;
  toolName: string | undefined;
};

type FileToolResult = {
  path: string | undefined;
  toolCallId: string;
  toolName: string;
};

export class RunCompletionAnswerTracker {
  private readonly toolStarts = new Map<string, ToolStartMeta>();
  private lastFileToolResult: FileToolResult | undefined;
  private textAfterLastFileTool = false;

  observe(event: BaseEvent): void {
    if (event.type === EventType.TOOL_CALL_START) {
      const toolCallId = stringField(event, "toolCallId");
      if (!toolCallId) return;
      this.toolStarts.set(toolCallId, {
        toolName: toolNameFromEvent(event),
        path: pathFromArgs(recordField(event, "args") ?? recordField(event, "parameters")),
      });
      return;
    }

    if (event.type === EventType.TOOL_CALL_RESULT) {
      const toolName = toolNameFromEvent(event);
      const toolCallId = stringField(event, "toolCallId");
      if (!toolName || !toolCallId || !FILE_COMPLETION_TOOLS.has(toolName)) {
        return;
      }
      if (toolResultLooksFailed(event)) {
        return;
      }
      const started = this.toolStarts.get(toolCallId);
      this.lastFileToolResult = {
        toolCallId,
        toolName,
        path: started?.path ?? pathFromToolResult(event),
      };
      this.textAfterLastFileTool = false;
      return;
    }

    if (
      (event.type === EventType.TEXT_MESSAGE_CONTENT || event.type === EventType.TEXT_MESSAGE_CHUNK) &&
      stringField(event, "delta")?.trim()
    ) {
      this.textAfterLastFileTool = true;
    }
  }

  createFinalAnswerEvents(input: { runId: string; userInput: string }): BaseEvent[] {
    if (!this.lastFileToolResult || this.textAfterLastFileTool) {
      return [];
    }

    const messageId = `${input.runId}:file-completion-answer`;
    const timestamp = Date.now();
    const content = finalAnswerText(input.userInput, this.lastFileToolResult.path);
    this.textAfterLastFileTool = true;

    return [
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId,
        role: "assistant",
        timestamp,
      } as BaseEvent,
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId,
        role: "assistant",
        delta: content,
        timestamp,
      } as BaseEvent,
      {
        type: EventType.TEXT_MESSAGE_END,
        messageId,
        timestamp,
      } as BaseEvent,
    ];
  }
}

const finalAnswerText = (userInput: string, path?: string): string => {
  const target = path ? ` \`${path}\`` : "";
  if (/[\u4e00-\u9fff]/u.test(userInput)) {
    return `文件已生成${target}，可在右侧 Outputs 中预览或下载。`;
  }
  return `The output file${target} has been generated and is available in Outputs for preview or download.`;
};

const toolNameFromEvent = (event: BaseEvent): string | undefined =>
  stringField(event, "toolCallName") ?? stringField(event, "toolName");

const pathFromArgs = (args: Record<string, unknown> | undefined): string | undefined =>
  stringValue(args?.path);

const pathFromToolResult = (event: BaseEvent): string | undefined => {
  const parsed = parseToolResult(event);
  const directPath =
    stringValue(parsed?.path) ??
    stringValue(parsed?.name) ??
    stringValue(recordValue(parsed?.artifact)?.name);
  if (directPath) return directPath;

  const observation = stringValue(parsed?.observation) ?? stringField(event, "result") ?? stringField(event, "content");
  if (!observation) return undefined;
  const firstLine = observation.split("\n")[0]?.trim() ?? observation.trim();
  return /^Wrote \d+ bytes to (.+)$/u.exec(firstLine)?.[1]?.trim();
};

const toolResultLooksFailed = (event: BaseEvent): boolean => {
  const parsed = parseToolResult(event);
  return parsed?.isError === true || typeof parsed?.error === "string";
};

const parseToolResult = (event: BaseEvent): Record<string, unknown> | undefined => {
  const raw = stringField(event, "result") ?? stringField(event, "content");
  if (!raw) return undefined;
  try {
    return recordValue(JSON.parse(raw));
  } catch {
    return { observation: raw };
  }
};

const recordField = (event: BaseEvent, key: string): Record<string, unknown> | undefined =>
  recordValue((event as Record<string, unknown>)[key]);

const stringField = (event: BaseEvent, key: string): string | undefined =>
  stringValue((event as Record<string, unknown>)[key]);

const recordValue = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;
