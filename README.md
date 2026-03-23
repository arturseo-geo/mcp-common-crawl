# mcp-common-crawl

MCP server for Common Crawl CDX — backlink discovery, expired domain finder, competitor gap analysis. Free alternative to Ahrefs/Semrush backlink APIs ($100+/month).

## Tools

| Tool | Description |
|------|-------------|
| `discover_backlinks` | Find backlinks to any domain across 3 CC indexes |
| `find_expired` | Search for expired/parked domains in a niche via CC CDX |
| `check_domain` | Deep single domain check — live/expired/parked + CC page count |
| `competitor_gap` | Find domains linking to competitors but not to you |

## Install

```bash
# Claude Code
claude mcp add common-crawl -- npx mcp-common-crawl

# Or in .mcp.json
{
  "mcpServers": {
    "common-crawl": {
      "command": "npx",
      "args": ["mcp-common-crawl"]
    }
  }
}
```

## No API Keys Required

Common Crawl is a free, open web archive. No API keys, no rate limits, no paid tiers.

## Usage

```
> find backlinks to thegeolab.net using Common Crawl
> search for expired domains in the "seo tools" niche
> check if example.com is expired or parked
> find link gap between my site and competitors
```

## Important Notes

- Uses native `fetch()` for CC CDX (axios returns 404 on CC CDX — known issue)
- Queries the 3 most recent CC indexes for best coverage
- Expired domain detection: ECONNREFUSED/ENOTFOUND = expired, parked page pattern matching for parked domains
- Results cached in-memory per session

## By [The GEO Lab](https://thegeolab.net)

Built by Artur Ferreira. Part of the GEO Lab SEO intelligence toolkit.
