<p align="center">
  <img alt="MCP" src="https://img.shields.io/badge/MCP-live-brightgreen">
  <img alt="Tools" src="https://img.shields.io/badge/tools-75-blue">
  <img alt="Sandboxes" src="https://img.shields.io/badge/code_sandboxes-Firecracker-informational">
  <img alt="Site" src="https://img.shields.io/badge/site-31_languages-blueviolet">
  <img alt="Pay" src="https://img.shields.io/badge/pay-BTC%2FXMR%2FUSDC%2FUSDT-orange">
  <img alt="KYC" src="https://img.shields.io/badge/KYC-none-lightgrey">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green">
</p>

# EQVPS — MCP Server

**No-KYC VPS hosting and per-second code sandboxes (Firecracker microVMs) that AI agents rent and run by themselves.** EQVPS exposes a [Model Context Protocol](https://modelcontextprotocol.io) server so an autonomous agent can discover plans, create an account, pay with crypto, then order and operate a VPS or start code sandboxes — **no human in the loop.**

> ⭐ **If this is useful, please star the repo** — it helps other agents & devs discover it.

- 🔌 **MCP endpoint:** `https://mcp.eqvps.com/mcp` (transport: **streamable-http**). **Start with `get_started`** — one call returns the whole flow, example arguments and your current state.
- 🧰 **75 MCP tools** on one endpoint, role-filtered by token: **45 for customers** (VPS + code sandboxes) + **30 for white-label resellers**.
- 🧪 **Code sandboxes:** isolated Linux microVMs that start in about a second; Python, Node.js, shell; billed per second from the same balance ($0.040 per vCPU-hour + $0.013 per GiB-hour, micro from $0.0165/h).
- 📦 **SDK for sandboxes:** Python `pip install eqvps` · TypeScript `npm i @eqvps/sdk` (same API token).
- 💸 **Payment:** crypto only — **BTC**, **XMR (Monero)**, **USDC**, **USDT**, **PYUSD** (plus native **ETH, SOL, BNB, TRX, POL, cbBTC**) on **Bitcoin**, **Base**, **Ethereum**, **Solana**, **Tron**, **BNB Chain**, **Polygon** and **Monero** (prepaid balance). **No KYC.**
- 🌐 **Website:** https://eqvps.com · 📚 **Docs:** https://eqvps.com/en/docs · 🧪 **Sandboxes:** https://eqvps.com/en/docs/sandboxes
- 📇 **llms.txt:** https://eqvps.com/llms.txt · **agent.json:** https://eqvps.com/.well-known/agent.json · **OpenAPI:** https://eqvps.com/openapi.json
- 🔌 **Connect your MCP client:** https://eqvps.com/en/docs/connect · 📝 **Blog:** https://eqvps.com/blog

> This is a **hosted, commercial remote MCP server**. Most tools require a Bearer token tied to a customer account with a prepaid crypto balance. `get_started`, `list_plans` and `sandbox_pricing` are public.

## What this server does

An AI agent can complete the whole cycle on its own — no dashboard, no card, no identity check:

1. **Discover** — `get_started` (the whole flow), `list_plans` (VPS plans, specs, prices, OS images) and `sandbox_pricing` (sandbox tariffs) — all public.
2. **Sign up** — `register_account` with an email returns a Bearer token at once (no OTP, no human step).
3. **Fund** — `topup_balance` returns a crypto checkout URL; pay in BTC, XMR, USDC, USDT, PYUSD and more to load a prepaid balance.
4. **VPS** — `order_vps` creates a VPS from the balance; `get_vps_status` returns live state and SSH access (root in about a minute); then power, hostname, passwords, reinstall, resize (`change_plan`), metrics, tickets, delegation, cancel.
5. **Sandboxes** — `create_sandbox` → `run_code` / `exec_command` (background tasks for long jobs) → files → `kill_sandbox`. "eqvps sandbox create" = `create_sandbox` here, `Sandbox.create()` in the SDK, `POST /sandboxes` in REST.

VPS plans range from **$3/mo** (Nano, NAT) to **$90/mo** (Pro-80: 80 GB RAM, dedicated IPv4); Windows from $11/mo. EU servers.

## Authentication (two paths — do not mix)

- **AI agents (this MCP):** call **`register_account`** — the agent receives a **Bearer token immediately** (no OTP, no human step). Send it as `Authorization: Bearer <token>`. Tokens last 1 year; `refresh_token` renews one.
- **Humans (website only):** passwordless email OTP — for people in a browser. Agents cannot use this (they cannot read email).

> An MCP agent must use `register_account`, never the email-OTP human flow.

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

Remote server — no install, no Docker. Machine-readable manifest: https://eqvps.com/.well-known/mcp.json

**Then, in plain language:**

> Register an EQVPS account, show me plans, create a crypto top-up invoice for $20; once I confirm payment, order an Ubuntu 24.04 VPS and give me its SSH access.

> Create a small sandbox, run print(2 + 2) in Python, show me the output and delete the sandbox.

- The agent does everything via tools **except funding**: a human sends crypto to the top-up invoice once. After that, repeat orders are hands-off.

**Writing code instead of calling tools?** Sandbox SDKs on the same API token:

```python
# pip install eqvps          (export EQVPS_API_KEY=<token>)
from eqvps import Sandbox
with Sandbox.create(tariff="small", env={"GREETING": "hello"}) as sb:
    print(sb.run("import os; print(os.environ['GREETING'], 2 + 2)").stdout)   # hello 4
```

```ts
// npm i @eqvps/sdk
import { Sandbox } from "@eqvps/sdk";
await Sandbox.with({ tariff: "small" }, async (sb) => console.log((await sb.run("print(2 + 2)")).stdout));
```

## Tools (75)

One endpoint, **role-filtered by token**: a customer Bearer token exposes the **45 customer tools** (32 for account/VPS + 13 for code sandboxes); a reseller token (`rk_…`, issued in the EQVPS Partners cabinet) exposes the **30 white-label reseller tools**.

### Customer tools — account & VPS (32)

| Tool | Auth | Description |
|------|------|-------------|
| `get_started` | public | Start here: the whole flow (VPS + sandbox) with example arguments, the only human step, common errors with fixes, and your current state. |
| `list_plans` | public | List available VPS plans with pricing, specs and OS images. |
| `register_account` | public | Create an EQVPS account (programmatic signup, no human in the loop). Returns a Bearer token. |
| `login` | public | Log in with email + password; returns a Bearer token. |
| `refresh_token` | bearer | Exchange the current API token for a new one before it expires (the old one is revoked). |
| `set_password` | bearer | Set a password for this account once, to enable email+password login as a recovery method. |
| `whoami` | bearer | Return the authenticated account profile. |
| `get_balance` | bearer | Return prepaid credit balance and currency. |
| `topup_balance` | bearer | Create a crypto top-up invoice; returns a PayRam checkout URL. |
| `order_vps` | bearer | Order a VPS by plan slug + OS id (pays from prepaid balance). |
| `pay_invoice` | bearer | Initiate crypto payment for an owned unpaid invoice (invoice_id as returned, e.g. "2RUAWV4"); returns checkout URL. |
| `list_vps` | bearer | List the account's VPS services (id, status, plan). |
| `get_vps_status` | bearer | Full detail for one VPS: status, specs, live VM state/uptime, SSH/RDP access. |
| `power_vps` | bearer | Power-control a VPS: start, stop or reboot. |
| `set_hostname` | bearer | Set the VPS hostname (DNS label; applied on reboot/rebuild). |
| `reset_password` | bearer | Reset the VPS root password. |
| `reinstall_vps` | bearer | DESTRUCTIVE: wipe and reinstall the VPS with a given OS image. |
| `get_vps_metrics` | bearer | Time-series resource metrics (CPU, memory, network, disk) for a VPS. |
| `undo_cancel` | bearer | Undo a scheduled end_of_period cancellation — the VPS stays active and renews. |
| `get_upgrade_options` | bearer | Plans this VPS can switch to in place (resize / convert), with the prorated charge. |
| `change_plan` | bearer | Change the VPS plan in place (resize or NAT↔dedicated convert); data kept, one reboot; prorated charge from the balance. |
| `cancel_service` | bearer | Cancel a VPS. Default end_of_period (lives out paid term, no data loss); immediate wipes the VM+data NOW (needs confirm=hostname) and refunds unused paid days to your balance. |
| `delegate_service` | bearer | Grant operator access to one of your VPS to another person by email. |
| `accept_delegation` | bearer | Accept a delegation invitation (token from the invite link). |
| `list_delegations` | bearer | List delegations you granted on your services. |
| `list_delegated_to_me` | bearer | List services other owners delegated to you. |
| `revoke_delegation` | bearer | Revoke (or decline) a delegation by id. |
| `create_ticket` | bearer | Open a support ticket (subject, message, optional service_id). |
| `list_tickets` | bearer | List your support tickets with status. |
| `get_ticket` | bearer | Read a ticket and its full message thread (author: you/staff). |
| `reply_ticket` | bearer | Reply to one of your tickets. |
| `close_ticket` | bearer | Close a ticket; rating (1-5) and comment optional. |

### Customer tools — code sandboxes (13)

| Tool | Auth | Description |
|------|------|-------------|
| `sandbox_pricing` | public | Public: sandbox tariffs — micro 0.25 vCPU/512 MB RAM/3 GB disk · small 0.5 vCPU/1 GB RAM/5 GB disk · standard 1 vCPU/2 GB RAM/10 GB disk · plus 2 vCPU/4 GB RAM/15 GB disk · pro 4 vCPU/8 GB RAM/20 GB disk · max 8 vCPU/16 GB RAM/40 GB disk — with per-second/hour/month prices, the billing model and limits (synchronous exec up to 55 s, background tasks longer; files up to 5 MB per transfer; runtimes: Python 3.12 + pip, Node.js 22 + npm, bash, git, curl). No authentication needed. Writing code instead of calling MCP? Official SDKs on the same REST API and token: Python `pip install eqvps`, TypeScript/JavaScript `npm i @eqvps/sdk` (docs: https://eqvps.com/en/docs/sandboxes). Requires: nothing. |
| `create_sandbox` | bearer | Start an isolated Firecracker microVM sandbox (ephemeral per-second or persistent hourly), billed from the prepaid balance. |
| `run_code` | bearer | Run Python, Node.js or bash code in a sandbox; returns exit code, stdout, stderr (background: true for long jobs). |
| `exec_command` | bearer | Execute a shell command in a sandbox (background: true for jobs longer than 55 s). |
| `get_task` | bearer | Poll a background task: state, exit code and new output since the given offsets. |
| `kill_task` | bearer | Stop a background task. |
| `upload_file` | bearer | Write a file (text or base64, up to 5 MB) into a sandbox. |
| `download_file` | bearer | Read a small file (up to 5 MB) from a sandbox into the conversation. |
| `get_download_url` | bearer | Short-lived link to stream one sandbox file (up to 2 GB) — no base64 in context. |
| `get_upload_url` | bearer | Short-lived link to PUT one file into a sandbox (up to 2 GB, 95 MB per request with offset). |
| `list_sandboxes` | bearer | List the account's sandboxes (running and paused). |
| `get_sandbox` | bearer | Sandbox status plus usage and cost so far. |
| `kill_sandbox` | bearer | Delete a sandbox immediately and irreversibly (all data lost); billing stops. |

### Reseller tools (30) — white-label

For partners building their own VPS brand on top of EQVPS (own plans, own end-clients, own pricing). Requires a reseller token (`rk_…`) from the [EQVPS Partners](https://eqvps.com/partners) cabinet. An agent can run a hosting business autonomously:

`reseller_check_balance`, `reseller_list_plans`, `reseller_create_plan`, `reseller_edit_plan`, `reseller_archive_plan`, `reseller_restore_plan`, `reseller_list_clients`, `reseller_add_client`, `reseller_edit_client`, `reseller_suspend_client`, `reseller_unsuspend_client`, `reseller_order_for_client`, `reseller_list_vms`, `reseller_vm_details`, `reseller_vm_status` (`reseller_service_status`), `reseller_vm_power`, `reseller_vm_set_hostname`, `reseller_vm_reset_password`, `reseller_vm_metrics`, `reseller_vm_cancel`, `reseller_vm_reinstall`, `reseller_change_plan`, `reseller_renew`, `reseller_set_autorenew`, `reseller_list_os`, `reseller_create_ticket`, `reseller_list_tickets`, `reseller_get_ticket`, `reseller_reply_ticket`, `reseller_close_ticket`.

## Typical agent flow

- **VPS:** `get_started` → `list_plans` → `register_account` → `topup_balance` (pay crypto) → `order_vps` → `get_vps_status` (SSH access) → operate.
- **Sandbox:** `get_started` → `sandbox_pricing` → `register_account` → `topup_balance` → `create_sandbox` → `run_code` / `exec_command` → `kill_sandbox`.

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

EQVPS is no-KYC VPS hosting and per-second code sandboxes for humans **and** AI agents, with **75 MCP tools** on one endpoint. NVMe storage, full root, deploy in about a minute, Linux and Windows images, EU servers, site in 31 languages. Crypto payment — BTC, XMR, USDC, USDT, PYUSD and native ETH, SOL, BNB, TRX, POL, cbBTC — no KYC, no card required. Registered in the [Official MCP Registry](https://registry.modelcontextprotocol.io) as `io.github.Poiuyhje/eqvps`.

## License

[MIT](./LICENSE).
