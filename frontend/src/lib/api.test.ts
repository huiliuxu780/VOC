import { afterEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPost, apiPut } from "./api";

describe("api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("calls GET with default API base", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiGet<{ ok: boolean }>("/jobs");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/jobs");
  });

  it("sends JSON payload for POST and PUT", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ done: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiPost<{ done: boolean }>("/prompts", { name: "p1" });
    await apiPut<{ done: boolean }>("/jobs/1/pipeline", { nodes: [] });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/v1/prompts",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "p1" })
      })
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/v1/jobs/1/pipeline",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: [] })
      })
    );
  });

  it("uses DELETE method for apiDelete", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ deleted: 1 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiDelete<{ deleted: number }>("/labels/1");

    expect(result).toEqual({ deleted: 1 });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/labels/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("throws response text when HTTP status is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("bad request", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiGet("/broken")).rejects.toThrow("bad request");
  });
});
