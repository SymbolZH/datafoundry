import { describe, expect, it } from "vitest";
import { workspaceConfigItemStatusBadge } from "../data-task-state";

describe("workspaceConfigItemStatusBadge", () => {
  it("shows not tested for builtin server-default before probe", () => {
    expect(
      workspaceConfigItemStatusBadge({
        id: "server-default",
        name: "default",
        description: "",
        enabled: true,
        builtin: true,
        status: "untested",
      }),
    ).toEqual({
      label: "Not tested",
      className: "bg-slate-100 text-slate-400",
    });
  });

  it("shows connected only after a successful probe", () => {
    expect(
      workspaceConfigItemStatusBadge({
        id: "qwen",
        name: "Qwen",
        description: "",
        enabled: true,
        status: "connected",
      }),
    ).toEqual({
      label: "Connected",
      className: "bg-emerald-50 text-emerald-700",
    });
  });

  it("shows failed after a failed probe", () => {
    expect(
      workspaceConfigItemStatusBadge({
        id: "qwen",
        name: "Qwen",
        description: "",
        enabled: true,
        status: "failed",
      }),
    ).toEqual({
      label: "Failed",
      className: "bg-rose-50 text-rose-700",
    });
  });
});
