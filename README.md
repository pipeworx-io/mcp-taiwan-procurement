# mcp-taiwan-procurement

Taiwan Government Procurement MCP — 政府電子採購網 (PCC) tenders (keyless).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Taiwan Procurement data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
