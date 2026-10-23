import { describe, it, expect } from "vitest";
import { buildSiteVerification } from "../siteVerification";

describe("buildSiteVerification", () => {
  it("returns undefined when neither token is configured, so no verification metadata is emitted", () => {
    expect(buildSiteVerification(undefined, undefined)).toBeUndefined();
  });

  it("treats empty and whitespace-only tokens as unconfigured", () => {
    expect(buildSiteVerification("", "")).toBeUndefined();
    expect(buildSiteVerification("   ", "\t\n")).toBeUndefined();
  });

  it("emits only the Google tag when just the Google token is set", () => {
    expect(buildSiteVerification("google-token", undefined)).toEqual({
      google: "google-token",
    });
  });

  it("emits only the Bing msvalidate.01 tag when just the Bing token is set", () => {
    expect(buildSiteVerification(undefined, "bing-token")).toEqual({
      other: { "msvalidate.01": "bing-token" },
    });
  });

  it("emits both tags when both tokens are set", () => {
    expect(buildSiteVerification("google-token", "bing-token")).toEqual({
      google: "google-token",
      other: { "msvalidate.01": "bing-token" },
    });
  });

  it("trims surrounding whitespace from tokens", () => {
    expect(buildSiteVerification("  google-token  ", " bing-token ")).toEqual({
      google: "google-token",
      other: { "msvalidate.01": "bing-token" },
    });
  });
});
