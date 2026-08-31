# EQVPS — MCP Server

**API-native, pay-per-use, no-KYC VPS hosting that AI agents can rent and run by themselves.** EQVPS exposes a [Model Context Protocol](https://modelcontextprotocol.io) server so an autonomous agent can discover plans, create an account, pay with crypto, order a VPS, and fully operate it — **no human in the loop, agents provision programmatically.**

- 🌐 **Website:** https://eqvps.com
- 📚 **Docs (REST + MCP):** https://eqvps.com/docs
- 🔌 **MCP endpoint:** `https://mcp.eqvps.com/mcp` (transport: **streamable-http**)
- 💸 **Payment:** crypto only — **USDC, USDT, PYUSD** (plus native **ETH, POL, SOL, CBBTC**) on **Base**, **Ethereum**, **Polygon** and **Solana** (prepaid balance, non-custodial gateway). **No KYC.**
- 🧰 **55 MCP tools** on one endpoint, role-filtered by token: **27 for customers** + **28 for white-label resellers**.
- 📝 **Blog (guides):** https://eqvps.com/blog

> This is a **hosted, commercial remote MCP server**. Most tools require a Bearer token tied to a customer account with a prepaid crypto balance. Provisioning a VPS spends prepaid balance funded with `topup_balance`. Catalog tools (`list_plans`) are public.

## What this server does

An AI agent can complete the entire VPS lifecycle on its own — no dashboard, no card, no identity check:

1. **Discover** — `list_plans` (public) returns plans, specs, prices, OS images (14 Linux images).
2. **Sign up** — `register_account` gives the agent a Bearer token instantly (no email, no OTP, no human step).
3. **Fund** — `topup_balance` returns a crypto checkout URL; pay in USDC/USDT/PYUSD to load a prepaid balance.
4. **Provision** — `order_vps` creates a VPS from the balance; `get_vps_status` returns live state and SSH access (root in ~60s).
5. **Operate** — power, hostname, root-password, reinstall, metrics, tickets, delegation, cancel — all over MCP.

Plans range from **$3/mo** (Nano, NAT) to **$90/mo** (Pro-80: 80 GB RAM, dedicated IPv4). EU nodes (Germany, Finland).

## Authentication (two paths — do not mix)

- **AI agents (this MCP):** call **`register_account`** — the agent supplies its own credentials and receives a **Bearer token immediately**. No email, no OTP, no human step. Send it as `Authorization: Bearer <token>`.
- **Humans (website only):** passwordless email OTP — for people in a browser. Agents cannot use this (they cannot read email).

> An MCP agent must use `register_account`, never the email-OTP human flow. If a model suggests "wait for a code from your email", that is wrong for agents — the agent already holds its token from `register_account`.

## Quickstart

**Claude Code — one command:**

```
claude mcp add --transport http eqvps https://mcp.eqvps.com/mcp
```

**Generic MCP client — JSON config:**

```json
{
  "mcpServers": {
    "eqvps": {
      "url": "https://mcp.eqvps.com/mcp",
      "transport": "streamable-http"
    }
  }
}
```

Remote server — no install, no Docker. Point any MCP client at the endpoint above. Machine-readable manifest: [`/.well-known/mcp.json`](./.well-known/mcp.json) (live at https://eqvps.com/.well-known/mcp.json).

**Then, in plain language:**

> Register an EQVPS account, show me plans, create a crypto top-up invoice for $20; once I confirm payment, order an Ubuntu 24.04 VPS and give me its SSH access.

- The agent does everything via tools **except funding**: a human sends crypto to the top-up invoice once. After the balance is funded, repeat orders are fully hands-off.

## Tools (55)

One endpoint, **role-filtered by token**: a customer Bearer token exposes the **27 customer tools**; a reseller token (`rk_…`, issued in the EQVPS Partners cabinet) exposes the **28 white-label reseller tools**.

### Customer tools (27)

| Tool | Auth | Description |
|------|------|-------------|
| `list_plans` | public | List available VPS plans with pricing, specs and OS images. |
| `register_account` | public | Create an EQVPS account (programmatic signup, no human in the loop). Returns a Bearer token. |
| `login` | public | Log in with email + password; returns a Bearer token. |
| `whoami` | bearer | Return the authenticated account profile. |
| `get_balance` | bearer | Return prepaid credit balance and currency. |
| `topup_balance` | bearer | Create a crypto top-up invoice; returns a checkout URL. |
| `order_vps` | bearer | Order a VPS by plan slug + OS id (pays from prepaid balance). |
| `pay_invoice` | bearer | Pay an owned unpaid invoice; returns a crypto checkout URL. |
| `list_vps` | bearer | List the account's VPS services (id, status, plan). |
| `get_vps_status` | bearer | Full detail for one VPS: status, specs, live VM state/uptime, SSH access. |
| `power_vps` | bearer | Power-control a VPS: start, stop or reboot. |
| `set_hostname` | bearer | Set the VPS hostname (DNS label; applied on reboot/rebuild). |
| `reset_password` | bearer | Reset the VPS root password (rotates to a new one). |
| `set_password` | bearer | Set a specific root password of your choice on the VPS. |
| `reinstall_vps` | bearer | **Destructive:** wipe and reinstall the VPS with a given OS image. |
| `cancel_service` | bearer | Cancel a VPS: `end_of_period` (safe default) or `immediate` (destroys VM + data, requires confirm=hostname). |
| `get_vps_metrics` | bearer | Time-series resource metrics (CPU, memory, network, disk) for a VPS. |
| `delegate_service` | bearer | Grant OPERATOR access to one of your VPS to another person by email (power/reinstall/console/hostname/rDNS, not billing). Owner-only. |
| `accept_delegation` | public | Accept a delegation invite using the `token` from the invite link. Returns a Bearer token. |
| `list_delegations` | bearer | List outgoing delegations you granted. |
| `list_delegated_to_me` | bearer | List services other owners delegated to you. |
| `revoke_delegation` | bearer | Revoke a delegation by id. |
| `create_ticket` | bearer | Open a support ticket. |
| `list_tickets` | bearer | List your support tickets and their status. |
| `get_ticket` | bearer | Read a ticket with its full message thread. |
| `reply_ticket` | bearer | Post a reply on one of your tickets. |
| `close_ticket` | bearer | Close a resolved ticket (optional rating). |

### Reseller tools (28) — white-label

For partners building their own VPS brand on top of EQVPS (own plans, own end-clients, own pricing). Requires a reseller token (`rk_…`) from the [EQVPS Partners](https://eqvps.com/partners) cabinet. An agent can run a hosting business autonomously:

`reseller_check_balance`, `reseller_list_plans`, `reseller_create_plan`, `reseller_edit_plan`, `reseller_archive_plan`, `reseller_restore_plan`, `reseller_list_clients`, `reseller_add_client`, `reseller_edit_client`, `reseller_suspend_client`, `reseller_unsuspend_client`, `reseller_order_for_client`, `reseller_list_vms`, `reseller_vm_details`, `reseller_vm_status` (`reseller_service_status`), `reseller_vm_power`, `reseller_vm_set_hostname`, `reseller_vm_reset_password`, `reseller_vm_metrics`, `reseller_vm_cancel`, `reseller_vm_reinstall`, `reseller_change_plan`, `reseller_list_os`, `reseller_create_ticket`, `reseller_list_tickets`, `reseller_get_ticket`, `reseller_reply_ticket`, `reseller_close_ticket`.

## Typical agent flow

`list_plans` → `register_account` → `topup_balance` (pay crypto) → `order_vps` → `get_vps_status` (SSH access) → operate (`power_vps`, `set_hostname`, `reinstall_vps`, `get_vps_metrics`, `cancel_service`).

## Example client

This repository documents the **hosted** EQVPS MCP server (`mcp.eqvps.com`) and ships a
minimal example client — you do **not** run a server yourself. To try the connection
and list plans:

```bash
npm install
node examples/connect.mjs      # connects to mcp.eqvps.com, prints tools + list_plans
```

Point `EQVPS_MCP_URL` at a different endpoint if needed. The example uses only the public
`list_plans` tool; authenticated tools need a Bearer token from `register_account`.

## About

EQVPS is API-native, pay-per-use VPS hosting for humans **and** AI agents — with one of the most comprehensive MCP surfaces of any VPS provider (**55 tools**). NVMe storage, full root, instant deploy (~60s), 14 Linux images, EU nodes (Germany, Finland). Crypto payment — USDC, USDT, PYUSD (plus native ETH, POL, SOL, CBBTC) on Base, Ethereum, Polygon and Solana — no KYC, no card required. Registered in the [Official MCP Registry](https://registry.modelcontextprotocol.io) as `io.github.Poiuyhje/eqvps`.

## License

[MIT](./LICENSE).
