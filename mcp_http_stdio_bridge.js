#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Minimal MCP HTTP (SSE) <-> stdio bridge.
 *
 * Reads newline-delimited JSON-RPC requests from stdin and POSTs them to an MCP
 * HTTP endpoint (commonly `http://127.0.0.1:<port>/mcp`), then writes the JSON-RPC
 * response (from SSE `data:` payload or JSON body) to stdout.
 *
 * Why this exists:
 * - Codex CLI expects MCP servers that speak over stdio (a child process it can spawn).
 * - Figma Desktop's Dev Mode MCP server speaks HTTP + Server-Sent Events (SSE).
 * - This script converts between the two transports.
 */

const readline = require("readline");

const getArg = (name) => {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
};

const url = getArg("--url");
if (!url) {
  console.error("Usage: node mcp_http_stdio_bridge.js --url <http://host:port/mcp>");
  process.exit(2);
}

/** @type {string | null} */
let sessionId = null;

const parseSseDataPayload = (text) => {
  const dataLines = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }
  if (dataLines.length === 0) return null;
  return dataLines.join("\n");
};

const postJsonRpc = async (jsonRpcRequest) => {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(jsonRpcRequest),
  });

  const responseSessionId = response.headers.get("mcp-session-id");
  // The MCP server may create a session ID on the first request; we keep it
  // and send it back on subsequent calls.
  if (responseSessionId) sessionId = responseSessionId;

  const contentType = response.headers.get("content-type") || "";
  const bodyText = await response.text();
  if (!bodyText.trim()) return null;

  if (contentType.includes("text/event-stream")) {
    const payload = parseSseDataPayload(bodyText);
    if (!payload) {
      throw new Error("No SSE data payload returned by server.");
    }
    return JSON.parse(payload);
  }

  return JSON.parse(bodyText);
};

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

let queue = Promise.resolve();

rl.on("line", async (line) => {
  queue = queue.then(async () => {
    // Important: MCP servers often require `initialize` to happen before other calls.
    // We serialize requests so callers can just stream JSON lines in order.
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const request = JSON.parse(trimmed);
      const response = await postJsonRpc(request);
      if (response !== null) {
        process.stdout.write(`${JSON.stringify(response)}\n`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const fallbackId = (() => {
        try {
          const parsed = JSON.parse(trimmed);
          return parsed?.id ?? null;
        } catch {
          return null;
        }
      })();

      process.stdout.write(
        `${JSON.stringify({
          jsonrpc: "2.0",
          id: fallbackId,
          error: { code: -32000, message },
        })}\n`
      );
    }
  });
});
