# mcp-common-crawl

> Built by **[Artur Ferreira](https://github.com/arturseo-geo)** @ **The GEO Lab** · [𝕏 @TheGEO\_Lab](https://x.com/TheGEO_Lab) · [LinkedIn](https://linkedin.com/in/arturgeo) · [Reddit](https://www.reddit.com/user/Alternative_Teach_74/)

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Licence](https://img.shields.io/badge/licence-MIT-green)
![Claude Code](https://img.shields.io/badge/Claude_Code-MCP_Server-blueviolet)

MCP server for Common Crawl CDX — backlink discovery, expired domain finder, competitor gap analysis. Free alternative to Ahrefs/Semrush backlink APIs ($100+/month).

## Tools

| Tool | Description |
|------|-------------|
| `discover_backlinks` | Find backlinks to any domain across 3 CC indexes |
| `find_expired` | Search for expired/parked domains in a niche via CC CDX |
| `check_domain` | Deep single domain check — live/expired/parked + CC page count |
| `competitor_gap` | Find domains linking to competitors but not to you |

## Features

✅ **Production-tested** — patterns used in production at [**TheGEOLab**](https://thegeolab.net)

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

---

## Attributions & Licence

Built and maintained by **[Artur Ferreira](https://github.com/arturseo-geo)** @ **[TheGEOLab](https://thegeolab.net)**.

Email: artur@thegeolab.net

### Best Practice Attribution

This MCP server was built following the open source Best Practice Approach —
reading community work for inspiration, then writing original content,
and crediting every source.

**Based on:**
- [Model Context Protocol specification](https://modelcontextprotocol.io) by Anthropic
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) (MIT)

**Data source:**
- [Common Crawl](https://commoncrawl.org/) — free, open web archive (non-profit)
- [Common Crawl CDX API](https://index.commoncrawl.org/) — index search endpoint

**Backlink analysis concepts inspired by:**
- [Ahrefs](https://ahrefs.com/) — backlink discovery and competitor gap methodology
- [Semrush](https://semrush.com/) — backlink analytics and domain comparison
- [Majestic](https://majestic.com/) — historic backlink index concepts

**Technical decisions:**
- Native `fetch()` used instead of axios for CC CDX queries (axios returns 404 on CC CDX from inside Express — persistent debugging issue documented in geolab-backlinks)

All server code is original writing. No files were copied or adapted from any source. MIT licence.

---

Found this useful? ⭐ Star the repo and connect:
[🌐 thegeolab.net](https://thegeolab.net) · [𝕏 @TheGEO_Lab](https://x.com/TheGEO_Lab) · [LinkedIn](https://linkedin.com/in/arturgeo) · [Reddit](https://www.reddit.com/user/Alternative_Teach_74/)

## Licence

MIT — see LICENSE

---

Built and maintained by **[Artur Ferreira](https://github.com/arturseo-geo)** @ **[TheGEOLab](https://thegeolab.net)** · [MIT License](LICENSE)
