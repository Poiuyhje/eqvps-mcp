#!/usr/bin/env node
/**
 * EQVPS MCP — interface-manifest stdio server (for directory introspection).
 *
 * The REAL EQVPS MCP server is HOSTED and REMOTE at https://mcp.eqvps.com/mcp
 * (transport: streamable-http). This tiny stdio server exists ONLY so that MCP
 * directories (e.g. Glama) that build a container and introspect it over stdio
 * can discover the EQVPS tool surface and index the listing.
 *
 * It advertises the exact tool set of the hosted server via `tools/list`.
 * It performs NO backend calls: `tools/call` returns a notice pointing to the
 * hosted endpoint. It never contacts mcp.eqvps.com, never creates an account,
 * never provisions anything. Safe to build and run in a sandbox.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const RO = { readOnlyHint: true };            // read-only, no side effects
const DESTRUCTIVE = { destructiveHint: true };// wipes/destroys data

const S = (properties = {}, required = []) => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
  additionalProperties: false,
});

const str = (description) => ({ type: "string", description });

const tools = [
  { name: "list_plans", annotations: RO,
    description: "List available VPS plans with pricing, specs and OS images. Public — no auth.",
    inputSchema: S() },
  { name: "register_account",
    description: "Create an EQVPS account programmatically (no human/KYC/OTP step). Returns a Bearer token.",
    inputSchema: S({ email: str("Account email (any address; no verification)."), password: str("Account password.") }, ["email", "password"]) },
  { name: "login",
    description: "Log in with email + password; returns a Bearer token.",
    inputSchema: S({ email: str("Account email."), password: str("Account password.") }, ["email", "password"]) },
  { name: "whoami", annotations: RO,
    description: "Return the authenticated account profile.",
    inputSchema: S() },
  { name: "get_balance", annotations: RO,
    description: "Return prepaid credit balance and currency.",
    inputSchema: S() },
  { name: "topup_balance",
    description: "Create a crypto top-up invoice; returns a PayRam checkout URL. Pay in USDC/USDT on Base or Ethereum.",
    inputSchema: S({ amount_usd: { type: "number", description: "Top-up amount in USD." } }, ["amount_usd"]) },
  { name: "order_vps",
    description: "Order a VPS by plan slug + OS id (pays from prepaid balance).",
    inputSchema: S({ plan: str("Plan slug, e.g. 'nano'."), os: str("OS image id, e.g. 'ubuntu-24.04'."), hostname: str("Optional hostname.") }, ["plan", "os"]) },
  { name: "pay_invoice",
    description: "Initiate crypto payment for an owned unpaid invoice; returns a checkout URL.",
    inputSchema: S({ invoice_id: str("Invoice id to pay.") }, ["invoice_id"]) },
  { name: "list_vps", annotations: RO,
    description: "List the account's VPS services (id, status, plan).",
    inputSchema: S() },
  { name: "get_vps_status", annotations: RO,
    description: "Full detail for one VPS: status, specs, live VM state/uptime, SSH access.",
    inputSchema: S({ service_id: str("VPS service id.") }, ["service_id"]) },
  { name: "power_vps",
    description: "Power-control a VPS: start, stop or reboot.",
    inputSchema: S({ service_id: str("VPS service id."), action: { type: "string", enum: ["start", "stop", "reboot"], description: "Power action." } }, ["service_id", "action"]) },
  { name: "set_hostname",
    description: "Set the VPS hostname (DNS label; applied on reboot/rebuild).",
    inputSchema: S({ service_id: str("VPS service id."), hostname: str("New hostname.") }, ["service_id", "hostname"]) },
  { name: "reset_password",
    description: "Reset the VPS root password.",
    inputSchema: S({ service_id: str("VPS service id.") }, ["service_id"]) },
  { name: "reinstall_vps", annotations: DESTRUCTIVE,
    description: "DESTRUCTIVE: wipe and reinstall the VPS with a given OS image.",
    inputSchema: S({ service_id: str("VPS service id."), os: str("OS image id to install."), confirm: str("Hostname confirmation string.") }, ["service_id", "os"]) },
  { name: "cancel_service", annotations: DESTRUCTIVE,
    description: "Cancel a VPS: 'end_of_period' (safe default — runs until the paid period ends) or 'immediate' (destroys VM + data, requires confirm=hostname).",
    inputSchema: S({ service_id: str("VPS service id."), mode: { type: "string", enum: ["end_of_period", "immediate"], description: "Cancellation mode." }, confirm: str("Hostname, required for immediate.") }, ["service_id"]) },
  { name: "get_vps_metrics", annotations: RO,
    description: "Time-series resource metrics (CPU, memory, network, disk) for a VPS.",
    inputSchema: S({ service_id: str("VPS service id."), range: str("Optional time range, e.g. '1h', '24h'.") }, ["service_id"]) },
  { name: "delegate_service",
    description: "Grant OPERATOR access to one of your VPS to another person by email (power/reinstall/console/hostname/rDNS, not billing). Sends an invite; optional time limit. Owner-only.",
    inputSchema: S({ service_id: str("VPS service id."), email: str("Delegate's email."), expires_at: str("Optional ISO expiry.") }, ["service_id", "email"]) },
  { name: "accept_delegation",
    description: "Accept a delegation invite using the token from the invite link. Returns a Bearer token for the delegated account.",
    inputSchema: S({ token: str("Invite token.") }, ["token"]) },
  { name: "list_delegations", annotations: RO,
    description: "List outgoing delegations you granted — who has operator access to what, and its status.",
    inputSchema: S() },
  { name: "list_delegated_to_me", annotations: RO,
    description: "List services other owners delegated operator access to you.",
    inputSchema: S() },
  { name: "revoke_delegation",
    description: "Revoke a delegation by id (owner revokes, or delegate declines). The other side is notified.",
    inputSchema: S({ delegation_id: str("Delegation id to revoke.") }, ["delegation_id"]) },
];

const server = new Server(
  { name: "eqvps", version: "1.0.3" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

// Not an error: return a normal (successful) result whose text points to the
// hosted endpoint. This container is an interface manifest for directory
// introspection only; it deliberately performs no backend work. Returning a
// success result (rather than isError) keeps the server "healthy" for any
// directory that samples a call, while still doing nothing on the backend.
server.setRequestHandler(CallToolRequestSchema, async (req) => ({
  content: [
    {
      type: "text",
      text:
        `EQVPS MCP is a hosted, remote server. This stdio build is an interface ` +
        `manifest for directory listing only and does not execute tools. ` +
        `To actually call '${req.params.name}', connect an MCP client to the live ` +
        `endpoint https://mcp.eqvps.com/mcp (transport: streamable-http).`,
    },
  ],
}));

await server.connect(new StdioServerTransport());
console.error("eqvps interface-manifest stdio server ready (" + tools.length + " tools)");
