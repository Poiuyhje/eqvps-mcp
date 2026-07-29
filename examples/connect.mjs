#!/usr/bin/env node
/**
 * Example client for the EQVPS MCP server.
 *
 * EQVPS runs a HOSTED, remote MCP server at https://mcp.eqvps.com/mcp — you do NOT
 * run a server yourself. This script is a minimal example of CONNECTING to it and
 * calling a public tool (`list_plans`). Use it as a template for your own agent/client.
 *
 * Run:  npm install && node examples/connect.mjs
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const ENDPOINT = process.env.EQVPS_MCP_URL || "https://mcp.eqvps.com/mcp";

async function main() {
  const transport = new StreamableHTTPClientTransport(new URL(ENDPOINT));
  const client = new Client({ name: "eqvps-example-client", version: "1.0.3" }, { capabilities: {} });
  await client.connect(transport);

  // 1. Discover tools exposed by the hosted server
  const { tools } = await client.listTools();
  console.log(`Connected to ${ENDPOINT}\nTools (${tools.length}):`);
  for (const t of tools) console.log(`  - ${t.name}: ${t.description ?? ""}`);

  // 2. Call a PUBLIC tool (no auth): list_plans
  const plans = await client.callTool({ name: "list_plans", arguments: {} });
  console.log("\nlist_plans result:\n" + JSON.stringify(plans.content ?? plans, null, 2));

  // To go further (register_account -> topup_balance -> order_vps) you need a Bearer
  // token from register_account, then pass it via the client's auth. See README.

  await client.close();
}
main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
