import { describe, it, expect } from "vitest";
import { parseExport } from "../src/importExport";

describe("parseExport", () => {
  it("accepts a valid export and preserves tasks", () => {
    const data = {
      format: "beautytasks", version: 1, exportedAt: "2026-07-05T00:00:00Z",
      taskCount: 1, labels: ["work"], tasks: [{ id: "t1", title: "A", labels: [] }],
    };
    const parsed = parseExport(JSON.stringify(data));
    expect(parsed).not.toBeNull();
    expect(parsed!.tasks).toHaveLength(1);
    expect(parsed!.tasks[0].id).toBe("t1");
  });

  it("preserves the lists manifest (with area type)", () => {
    const data = {
      format: "beautytasks", version: 2, exportedAt: "2026-07-05T00:00:00Z", taskCount: 0,
      lists: [{ name: "Abos", type: "area", color: null, archived: false }], labels: [], tasks: [],
    };
    const parsed = parseExport(JSON.stringify(data));
    expect(parsed).not.toBeNull();
    expect(parsed!.lists[0]).toMatchObject({ name: "Abos", type: "area" });
  });

  it("rejects invalid JSON", () => { expect(parseExport("{not json")).toBeNull(); });
  it("rejects a wrong format tag", () => { expect(parseExport(JSON.stringify({ format: "other", tasks: [] }))).toBeNull(); });
  it("rejects a missing tasks array", () => { expect(parseExport(JSON.stringify({ format: "beautytasks" }))).toBeNull(); });
  it("rejects a non-object", () => { expect(parseExport("42")).toBeNull(); });
});
