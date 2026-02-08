import { CompiledEdge, CompiledFlow, CompiledNode, DrawflowExport, NodeType } from "./types";

const KNOWN_TYPES: NodeType[] = [
  "start",
  "end",
  "http",
  "openai_structured",
  "if",
  "while",
  "for_each",
  "transform",
  "set_var",
  "log",
  "delay",
  "json_parse",
  "json_stringify",
  "array_push",
  "template",
  "assert",
  "python_script",
  "typescript_script",
];

function toNodeType(name: string): NodeType {
  if (KNOWN_TYPES.includes(name as NodeType)) {
    return name as NodeType;
  }

  if (name === "for") return "for_each";
  if (name === "foreach") return "for_each";
  if (name === "openai") return "openai_structured";
  if (name === "wait") return "delay";
  if (name === "parse_json") return "json_parse";
  if (name === "stringify_json") return "json_stringify";
  if (name === "append") return "array_push";
  if (name === "python" || name === "py") return "python_script";
  if (name === "typescript" || name === "ts") return "typescript_script";

  return "transform";
}

function mapOutputToPort(type: NodeType, outputKey: string): string {
  if (outputKey === "output_1") {
    if (type === "if") return "true";
    if (type === "while") return "loop";
    if (type === "for_each") return "loop";
    return "next";
  }

  if (outputKey === "output_2") {
    if (type === "if") return "false";
    if (type === "while") return "done";
    if (type === "for_each") return "done";
    return "next_2";
  }

  return outputKey;
}

export function compileDrawflow(flowId: string, flowName: string, input: DrawflowExport): CompiledFlow {
  const moduleNames = Object.keys(input.drawflow || {});
  if (moduleNames.length === 0) {
    throw new Error("Drawflow is empty.");
  }

  const module = input.drawflow[moduleNames[0]];
  const rawNodes = module?.data ?? {};

  const nodes: Record<string, CompiledNode> = {};
  const edges: CompiledEdge[] = [];

  for (const [rawId, rawNode] of Object.entries(rawNodes)) {
    const id = String(rawId);
    const type = toNodeType(String(rawNode.name || "transform"));

    nodes[id] = {
      id,
      type,
      config: rawNode.data || {},
    };
  }

  for (const [rawId, rawNode] of Object.entries(rawNodes)) {
    const sourceId = String(rawId);
    const type = nodes[sourceId]?.type;
    if (!type) continue;

    const outputs = rawNode.outputs || {};
    for (const [outputKey, outputDef] of Object.entries(outputs)) {
      const connections = outputDef.connections || [];
      for (const connection of connections) {
        const maybeTargetId =
          (connection as Record<string, string>).node ||
          (connection as Record<string, string>).output ||
          (connection as Record<string, string>).target;
        if (!maybeTargetId) continue;

        const targetId = String(maybeTargetId);
        if (!nodes[targetId]) continue;

        edges.push({
          sourceId,
          sourcePort: mapOutputToPort(type, outputKey),
          targetId,
        });
      }
    }
  }

  const start = Object.values(nodes).find((n) => n.type === "start");
  const fallback = Object.keys(nodes).sort((a, b) => Number(a) - Number(b))[0];

  if (!start && !fallback) {
    throw new Error("Flow has no nodes.");
  }

  return {
    id: flowId,
    name: flowName,
    entryNodeId: start?.id ?? fallback,
    nodes,
    edges,
  };
}
