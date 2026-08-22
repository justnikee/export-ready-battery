import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import { isIssuedVC, vcDownloadFilename, vcErrorMessage } from "./passport-vc";

describe("isIssuedVC", () => {
  it("is true only for issued", () => {
    expect(isIssuedVC("issued")).toBe(true);
    expect(isIssuedVC("ISSUED")).toBe(true);
    expect(isIssuedVC("draft")).toBe(false);
    expect(isIssuedVC(undefined)).toBe(false);
  });
});

describe("vcDownloadFilename", () => {
  it("uses the serial and strips unsafe characters", () => {
    expect(vcDownloadFilename("IN-ABC-LFP-2026-00001")).toBe(
      "IN-ABC-LFP-2026-00001-vc.json",
    );
    expect(vcDownloadFilename("pack/01 serial")).toBe("pack-01-serial-vc.json");
    expect(vcDownloadFilename("   ")).toBe("passport-vc.json");
  });
});

describe("vcErrorMessage", () => {
  it("prefers API { error }", () => {
    const err = new AxiosError("boom");
    err.response = {
      data: { error: "Invalid passport ID" },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: err.config!,
    };
    expect(vcErrorMessage(err, "fallback")).toBe("Invalid passport ID");
  });

  it("falls back when the body is empty", () => {
    expect(vcErrorMessage(new Error("network"), "fallback")).toBe("network");
    expect(vcErrorMessage("nope", "fallback")).toBe("fallback");
  });
});
