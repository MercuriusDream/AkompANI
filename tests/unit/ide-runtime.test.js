import { describe, expect, it } from "vitest";

describe("AKOMPANI_IDE core runtime utilities", () => {
  it("parses and de-duplicates model names", () => {
    const models = window.AKOMPANI_IDE.parseModelText(" gpt-4o-mini,\nGPT-4O-mini\n claude-3.7-sonnet ");
    expect(models).toEqual(["gpt-4o-mini", "claude-3.7-sonnet"]);
  });

  it("falls back to default deploy target for unknown ids", () => {
    const fallback = window.AKOMPANI_IDE.getDeployTargetById("unknown_target");
    expect(fallback.id).toBe("cloudflare_workers_elysia_bun");
  });

  it("builds cloudflare deploy object with normalized KV/D1/DO bindings", () => {
    const drawflow = {
      drawflow: {
        Home: {
          data: {
            "1": { name: "http" },
            "2": { name: "cache" },
            "3": { name: "cache" },
          },
        },
      },
    };

    const deployObject = window.AKOMPANI_IDE.buildDeployObject({
      target: "cloudflare_workers_elysia_bun",
      agentName: "Companion Agent",
      endpointMode: "chat",
      drawflow,
      cloudflareConfig: {
        d1Binding: "my d1 db",
        d1DatabaseId: "db_123",
        d1DatabaseName: "agent-db",
        doBinding: "session object",
        doClassName: "Session-Object",
        doScriptName: "session-runtime",
      },
    });

    expect(deployObject.target).toBe("cloudflare_workers_elysia_bun");
    expect(deployObject.summary.flow.nodeCount).toBe(3);
    expect(deployObject.summary.flow.nodeTypeCounts.cache).toBe(2);

    const wranglerToml = deployObject.files.find((file) => file.path === "wrangler.toml");
    expect(wranglerToml).toBeTruthy();
    expect(wranglerToml.content).toContain('binding = "MY_D1_DB"');
    expect(wranglerToml.content).toContain('name = "SESSION_OBJECT"');
    expect(wranglerToml.content).toContain('class_name = "Session_Object"');
    expect(wranglerToml.content).toContain('script_name = "session-runtime"');
  });
});
