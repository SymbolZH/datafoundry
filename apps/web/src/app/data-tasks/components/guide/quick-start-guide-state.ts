import { getEnabledLlmItems, type WorkspaceConfigStore } from "../../data-task-state";
import type { LiveRunStatus } from "../../live-run-state";

export const QUICK_START_PROMPT_SEEN_STORAGE_KEY =
  "data-tasks:quick-start:first-prompt-seen:v1";

export const QUICK_START_DISMISSED_STORAGE_KEY =
  "data-tasks:quick-start:dismissed:v1";

export const QUICK_START_EXAMPLE_PROMPT =
  "Query total orders in the last 30 days, grouped by date";

export type QuickStartStepId =
  | "welcome"
  | "resources"
  | "model"
  | "datasource"
  | "query"
  | "send"
  | "console"
  | "output";

export const QUICK_START_STEP_ORDER: QuickStartStepId[] = [
  "welcome",
  "resources",
  "datasource",
  "model",
  "query",
  "send",
  "console",
  "output",
];

export type QuickStartStorage = Pick<Storage, "getItem" | "setItem">;

export type QuickStartReadiness = {
  hasModel: boolean;
  hasDatasource: boolean;
  preferredDatasourceId: string | null;
  canRun: boolean;
};

export type QuickStartStepPresentation = {
  id: QuickStartStepId;
  targetId: string;
  title: string;
  body: string;
  cta: string;
  blocked?: boolean;
};

export function hasSeenQuickStartPrompt(storage: QuickStartStorage | null): boolean {
  return storage?.getItem(QUICK_START_PROMPT_SEEN_STORAGE_KEY) === "true";
}

export function markQuickStartPromptSeen(storage: QuickStartStorage | null): void {
  storage?.setItem(QUICK_START_PROMPT_SEEN_STORAGE_KEY, "true");
}

export function markQuickStartDismissed(storage: QuickStartStorage | null): void {
  storage?.setItem(QUICK_START_DISMISSED_STORAGE_KEY, "true");
}

export function resolveQuickStartReadiness(
  workspaceConfig: WorkspaceConfigStore,
): QuickStartReadiness {
  const enabledLlms = getEnabledLlmItems(workspaceConfig);
  const availableDatasources = workspaceConfig.db.filter(
    (item) => item.enabled !== false,
  );
  const demoDatasource =
    availableDatasources.find((item) => item.id === "api-duckdb-demo") ?? null;
  const preferredDatasource = demoDatasource ?? availableDatasources[0] ?? null;
  const hasModel = enabledLlms.length > 0;
  const hasDatasource = preferredDatasource != null;

  return {
    hasModel,
    hasDatasource,
    preferredDatasourceId: preferredDatasource?.id ?? null,
    canRun: hasModel && hasDatasource,
  };
}

export function getQuickStartInitialStep(
  _readiness: QuickStartReadiness,
): QuickStartStepId {
  return "welcome";
}

export function resolveQuickStartStep(
  step: QuickStartStepId,
  {
    readiness,
    runStatus,
    hasSubmittedTask = runStatus !== "idle",
  }: {
    readiness: QuickStartReadiness;
    runStatus: LiveRunStatus;
    hasSubmittedTask?: boolean;
  },
): QuickStartStepPresentation {
  switch (step) {
    case "welcome":
      return {
        id: step,
        targetId: "workspace-layout",
        title: "Start with the workspace map",
        body: "Left is where you configure resources, middle is where you ask the data question, and right is where you watch the task run and review outputs.",
        cta: "Next",
      };
    case "resources":
      return {
        id: step,
        targetId: "workspace-resources",
        title: "Understand workspace resources",
        body: "The left panel covers Data Sources, Knowledge, Agent Tools / MCP, Skills, Models, and Assets / Files. These are the building blocks the agent can use for each task.",
        cta: "Next",
      };
    case "datasource":
      return {
        id: step,
        targetId: "datasource-config",
        title: "Confirm the datasource",
        body: readiness.preferredDatasourceId
          ? `A datasource is ready: ${readiness.preferredDatasourceId}. This is what the agent will query for the first task.`
          : "Add or enable a datasource before running the sample task. Open datasource config, create and test the connection, then return to this guide. The demo datasource is the fastest path when it is available.",
        cta: readiness.hasDatasource ? "Next" : "Open datasource config",
      };
    case "model":
      return {
        id: step,
        targetId: "model-picker",
        title: readiness.hasModel ? "Confirm the model" : "Connect a model",
        body: readiness.hasModel
          ? "A model profile is available. The model understands the request, helps generate SQL, and summarizes the result."
          : "Quick start needs an enabled LLM profile. Open model configuration, create and test a profile, then return to this guide.",
        cta: readiness.hasModel ? "Next" : "Open model config",
      };
    case "query":
      return {
        id: step,
        targetId: "chat-input",
        title: "Use a sample query",
        body: `Start with this sample query: ${QUICK_START_EXAMPLE_PROMPT}`,
        cta: "Use this query",
      };
    case "send":
      return {
        id: step,
        targetId: "chat-input",
        title: "Send the task",
        body: hasSubmittedTask
          ? "The task is submitted. Continue to the console to watch how the agent inspects the datasource and runs a read-only query."
          : "Review the sample task in the chat input, then use the send arrow. This step unlocks after the task is submitted.",
        cta: hasSubmittedTask ? "Next" : "Waiting for send",
        blocked: !hasSubmittedTask,
      };
    case "console":
      return {
        id: step,
        targetId: "run-console",
        title: runStatus === "running" ? "Watch the run" : "Open the run console",
        body: "The Task Console shows run status, steps, tool calls, traces, and generated outputs while the task is running.",
        cta: "Next",
      };
    case "output":
      return {
        id: step,
        targetId: "run-output",
        title: runStatus === "failed" ? "Check the failed run" : "Review the result",
        body:
          runStatus === "failed"
            ? "The run failed. Check the model and datasource configuration, then try the sample task again."
            : "When the run completes, review the answer and outputs here. You can ask a follow-up question or inspect the trace.",
        cta: "Finish",
      };
  }
}
