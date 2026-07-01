import { EventType } from "@ag-ui/client";
import { describe, expect, it } from "vitest";

import {
  RunCompletionAnswerTracker,
} from "../../../../../api/src/run-completion-answer";
import {
  shouldReuseRecordedFileArtifactForPublish,
} from "../../../../../../packages/agent-runtime/src/tools/artifact-publish-policy";

describe("run completion answer tracker", () => {
  it("emits a short final assistant answer after a file-producing tool when no text followed it", () => {
    const tracker = new RunCompletionAnswerTracker();

    tracker.observe({
      type: EventType.TOOL_CALL_START,
      toolCallId: "tool-write-1",
      toolCallName: "write_file",
      args: { path: "weekly_comparison_report.md" },
    });
    tracker.observe({
      type: EventType.TOOL_CALL_RESULT,
      toolCallId: "tool-write-1",
      toolCallName: "write_file",
      result: JSON.stringify({ observation: "Wrote 4714 bytes to weekly_comparison_report.md" }),
    });

    const events = tracker.createFinalAnswerEvents({
      runId: "run-1",
      userInput: "生成一份对比分析报告",
    });

    expect(events.map((event) => event.type)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
    ]);
    expect(events[1]).toMatchObject({
      delta: expect.stringContaining("weekly_comparison_report.md"),
    });
  });

  it("does not emit a final answer when the model already produced text after the file tool", () => {
    const tracker = new RunCompletionAnswerTracker();

    tracker.observe({
      type: EventType.TOOL_CALL_RESULT,
      toolCallId: "tool-write-1",
      toolCallName: "write_file",
      result: JSON.stringify({ observation: "Wrote 2 bytes to report.md" }),
    });
    tracker.observe({
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId: "assistant-1",
      delta: "报告已生成。",
    });

    expect(
      tracker.createFinalAnswerEvents({
        runId: "run-1",
        userInput: "生成报告",
      }),
    ).toEqual([]);
  });
});

describe("artifact publish policy", () => {
  it("reuses an already recorded workspace file for markdown/html report publishes", () => {
    expect(shouldReuseRecordedFileArtifactForPublish({
      requestedType: "markdown",
      existingFileArtifact: true,
    })).toBe(true);
    expect(shouldReuseRecordedFileArtifactForPublish({
      requestedType: "html",
      existingFileArtifact: true,
    })).toBe(true);
  });

  it("keeps non-report publishes as distinct artifacts", () => {
    expect(shouldReuseRecordedFileArtifactForPublish({
      requestedType: "image",
      existingFileArtifact: true,
    })).toBe(false);
    expect(shouldReuseRecordedFileArtifactForPublish({
      requestedType: "markdown",
      existingFileArtifact: false,
    })).toBe(false);
  });
});
