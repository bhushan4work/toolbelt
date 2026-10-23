import { describe, it, expect } from "vitest";
import { LosslessNumber, stringify } from "lossless-json";
import { runJsonPath } from "../jsonpath";
import { SAMPLE_JSON } from "../json-utils";

describe("runJsonPath", () => {
  it.each(["", " \t\n "])("rejects blank JSON %j", (raw) => {
    expect(runJsonPath(raw, "$..email")).toEqual({
      ok: false,
      matches: [],
      paths: [],
      error: "Paste JSON first",
    });
  });

  it.each(["", " \t\n "])("rejects a blank expression %j", (path) => {
    expect(runJsonPath(SAMPLE_JSON, path)).toEqual({
      ok: false,
      matches: [],
      paths: [],
      error: "Enter a JSONPath expression",
    });
  });

  it("reports invalid JSON without matches or paths", () => {
    expect(runJsonPath("{", "$..email")).toEqual({
      ok: false,
      matches: [],
      paths: [],
      error: expect.stringMatching(/^Invalid JSON: /),
    });
  });

  it("finds both email values with their matching paths", () => {
    expect(runJsonPath(SAMPLE_JSON, "$..email")).toEqual({
      ok: true,
      matches: ["ada@codercops.com", true],
      paths: [
        "$['user']['email']",
        "$['user']['preferences']['notifications']['email']",
      ],
    });
  });

  it("filters out inactive projects", () => {
    expect(runJsonPath(SAMPLE_JSON, "$.user.projects[?(@.active==true)]")).toEqual({
      ok: true,
      matches: [{ id: new LosslessNumber("1"), name: "Atlas", active: true }],
      paths: ["$['user']['projects'][0]"],
    });
  });

  it("keeps every digit of large integers and high-precision decimals", () => {
    const result = runJsonPath('{"a": 12345678901234567890, "b": 0.1000000000000000055511151231257827}', "$.*");
    expect(stringify(result.matches, null, 2)).toBe(
      "[\n  12345678901234567890,\n  0.1000000000000000055511151231257827\n]"
    );
  });

  it("returns nested matches once, without walking into the numbers", () => {
    expect(stringify(runJsonPath('{"a":1,"b":{"c":2}}', "$..*").matches)).toBe('[1,{"c":2},2]');
    expect(runJsonPath('{"a":5}', "$.a.value").matches).toEqual([]);
  });

  it.each(["$.items[?(@.p === 5)]", "$.items[?(@.p == @.q)]"])("filters on numbers with %s", (path) => {
    expect(stringify(runJsonPath('{"items":[{"p":5,"q":5},{"p":50,"q":1}]}', path).matches)).toBe(
      '[{"p":5,"q":5}]'
    );
  });

  it("resolves keys containing / and ~, and the root", () => {
    const raw = '{"a/b": 10000000000000000001, "c~d": {"e": 2}}';
    expect(stringify(runJsonPath(raw, '$["a/b"]').matches)).toBe("[10000000000000000001]");
    expect(stringify(runJsonPath(raw, '$["c~d"].e').matches)).toBe("[2]");
    expect(stringify(runJsonPath(raw, "$").matches)).toBe(`[${raw.replace(/ /g, "")}]`);
  });

  it("returns property names as names, not the values they point to", () => {
    expect(runJsonPath('{"a": 1, "b": 2}', "$.*~").matches).toEqual(["a", "b"]);
  });

  it("reports a duplicate key as an error instead of throwing", () => {
    expect(runJsonPath('{"a": 1, "a": 2}', "$.a")).toEqual({
      ok: false,
      matches: [],
      paths: [],
      error: "Invalid JSON: Duplicate key 'a' encountered at position 10",
    });
  });

  it("returns an empty successful result when nothing matches", () => {
    expect(runJsonPath(SAMPLE_JSON, "$.user.missing")).toEqual({
      ok: true,
      matches: [],
      paths: [],
    });
  });
});
