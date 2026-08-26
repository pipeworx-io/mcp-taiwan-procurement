# mcp-taiwan-procurement

Taiwan Government Procurement MCP — 政府電子採購網 (PCC) tenders (keyless).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `taiwan_search_tenders` | Search Taiwan government procurement tenders (政府電子採購網 / PCC) by title keyword, via the g0v community mirror. Pass a keyword (Chinese or English, e.g. "電腦", "AI", "消防"). Returns matching tenders with tender id (unit_id + job_number), title, agency (機關名稱), announcement type, date, and category. Use taiwan_get_tender with a result's unit_id + job_number for full detail. Third-party mirror; results are best-effort. |
| `taiwan_search_by_company` | Search Taiwan government procurement tenders (政府電子採購網 / PCC) by company / vendor name — finds tenders a company bid on or was awarded (得標/投標廠商), via the g0v community mirror. Pass a company name in Chinese (e.g. "台積電", "中華電信"). Returns matching tenders with tender id, title, agency, date, and the associated company names/IDs. Third-party mirror; results are best-effort. |
| `taiwan_get_tender` | Get full detail for one Taiwan government procurement tender (政府電子採購網 / PCC) via the g0v community mirror. Requires unit_id (機關代碼) and job_number (標案案號), both from a taiwan_search_tenders result. Returns agency contact info, procurement category, budget/award amount, deadlines, and status where available, plus a link to the official PCC page. Third-party mirror; some fields may be blank. |
| `taiwan_list_by_date` | List Taiwan government procurement tenders (政府電子採購網 / PCC) published on a given date, via the g0v community mirror. Pass a date as YYYYMMDD (e.g. "20260630"); defaults to today. Returns tenders with id, title, agency, announcement type, and any associated companies. Third-party mirror; results are best-effort. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "taiwan-procurement": {
      "url": "https://gateway.pipeworx.io/taiwan-procurement/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/taiwan-procurement/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Taiwan Procurement data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
