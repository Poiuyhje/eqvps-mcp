# EQVPS — MCP Server

**Crypto-native VPS hosting that AI agents can rent and run by themselves.** EQVPS exposes a
[Model Context Protocol](https://modelcontextprotocol.io) server so an autonomous agent can
discover plans, create an account, pay with crypto, order a VPS, and fully operate it —
**no human, no KYC, no card.**

- 🌐 **Website:** https://eqvps.com
- 📚 **Docs (REST + MCP):** https://eqvps.com/docs
- 🔌 **MCP endpoint:** `https://mcp.eqvps.com/mcp` (transport: **streamable-http**)
- 💸 **Payment:** crypto only — USDC/USDT on Base, Ethereum, Polygon + USDT on Tron (via PayRam). No KYC.

> This is a **hosted, commercial remote MCP server** — not a no-auth public toy. Most tools
> require a Bearer token tied to a customer account with a prepaid crypto balance. Provisioning
> a VPS spends prepaid balance funded with `topup_balance`. Catalog tools (`list_plans`) are public.

## Authentication paths (do not mix)

- **AI AGENTS (this MCP):** call **`register_account`** — the agent itself supplies credentials
  and gets a **Bearer token immediately**. **No email, no OTP code, no human step.** This is the
  path for autonomous agents. Send the token as `Authorization: Bearer <token>`.
- **HUMANS (website [eqvps.com](https://eqvps.com)):** passwordless **email OTP code** — for
  people in a browser only. **Agents cannot use this** (they cannot read email).

> **An MCP agent must use `register_account`, never the email-OTP human flow.** If a model
> suggests "wait for a code from your email", that is wrong for agents — the agent already has
> its token from `register_account`.

## Connect

Remote server (no install, no Docker) — point any MCP client at the endpoint:

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

Machine-readable manifest: [`/.well-known/mcp.json`](./.well-known/mcp.json) ·
live at https://eqvps.com/.well-known/mcp.json

## Tools (15)

| Tool | Auth | Description |
|------|------|-------------|
| `list_plans` | public | List available VPS plans with pricing, specs and OS images. |
| `register_account` | public | Create an EQVPS account (no human/KYC step). Returns a Bearer token. |
| `login` | public | Log in with email + password; returns a Bearer token. |
| `whoami` | bearer | Return the authenticated account profile. |
| `get_balance` | bearer | Return prepaid credit balance and currency. |
| `topup_balance` | bearer | Create a crypto top-up invoice; returns a PayRam checkout URL. |
| `order_vps` | bearer | Order a VPS by plan slug + OS id (pays from prepaid balance). |
| `pay_invoice` | bearer | Pay an owned unpaid invoice; returns a crypto checkout URL. |
| `list_vps` | bearer | List the account's VPS services (id, status, plan). |
| `get_vps_status` | bearer | Full detail for one VPS: status, specs, live VM state/uptime, SSH access. |
| `power_vps` | bearer | Power-control a VPS: start, stop or reboot. |
| `set_hostname` | bearer | Set the VPS hostname (DNS label; applied on reboot/rebuild). |
| `reset_password` | bearer | Reset the VPS root password. |
| `reinstall_vps` | bearer | **Destructive:** wipe and reinstall the VPS with a given OS image. |
| `get_vps_metrics` | bearer | Time-series resource metrics (CPU, memory, network, disk) for a VPS. |

## Typical agent flow

`list_plans` → `register_account` → `topup_balance` (pay crypto) → `order_vps` →
`get_vps_status` (SSH access) → operate (`power_vps`, `set_hostname`, `reinstall_vps`, `get_vps_metrics`).

## About

EQVPS is crypto-native VPS hosting for humans **and** AI agents. NVMe, full root, instant deploy.
The MCP server is a thin, hosted gateway to the EQVPS REST API — this repository is the public
listing/manifest only; no server code or credentials are published here.

## License

[MIT](./LICENSE) — covers this repository's public listing content (README + manifest).
