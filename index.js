#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');
const cheerio = require('cheerio');

const CC_INDEXES = ['CC-MAIN-2025-50', 'CC-MAIN-2025-43', 'CC-MAIN-2025-36'];

const server = new Server(
  { name: 'mcp-common-crawl', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'discover_backlinks',
      description: 'Discover backlinks to a domain using Common Crawl CDX API (3 indexes). Returns source URLs, anchor text, link context. Free alternative to Ahrefs/Semrush backlink API.',
      inputSchema: { type: 'object', properties: { domain: { type: 'string', description: 'Target domain (e.g. thegeolab.net)' }, limit: { type: 'number', description: 'Max results per index (default 50)', default: 50 } }, required: ['domain'] }
    },
    {
      name: 'find_expired',
      description: 'Find expired or parked domains in a niche using Common Crawl. Searches CC CDX for domains matching keywords, checks liveness. Returns domain status (expired/parked/live).',
      inputSchema: { type: 'object', properties: { keywords: { type: 'array', items: { type: 'string' }, description: 'Niche keywords to search for' }, limit: { type: 'number', description: 'Max domains to check (default 20)', default: 20 } }, required: ['keywords'] }
    },
    {
      name: 'check_domain',
      description: 'Deep check a single domain — liveness, parked page detection, Common Crawl page count, last seen date.',
      inputSchema: { type: 'object', properties: { domain: { type: 'string', description: 'Domain to check' } }, required: ['domain'] }
    },
    {
      name: 'competitor_gap',
      description: 'Find domains linking to competitors but not to you. Queries Common Crawl for backlinks to each competitor, diffs against your domain.',
      inputSchema: { type: 'object', properties: { your_domain: { type: 'string', description: 'Your domain' }, competitors: { type: 'array', items: { type: 'string' }, description: 'Competitor domains (max 5)' } }, required: ['your_domain', 'competitors'] }
    }
  ]
}));

async function ccQuery(domain, index, limit) {
  try {
    const url = `https://index.commoncrawl.org/${index}-index?url=*.${domain}&output=json&limit=${limit}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) return [];
    const text = await r.text();
    return text.trim().split('\n').filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'discover_backlinks') {
      const domain = args.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const limit = args.limit || 50;
      const allResults = [];
      const seen = new Set();

      for (const index of CC_INDEXES) {
        const entries = await ccQuery(domain, index, limit);
        entries.forEach(e => {
          const sourceUrl = e.url || '';
          if (!seen.has(sourceUrl) && !sourceUrl.includes(domain)) {
            seen.add(sourceUrl);
            allResults.push({
              source_url: sourceUrl,
              timestamp: e.timestamp || '',
              status: e.status || '',
              mime: e.mime || '',
              index
            });
          }
        });
      }

      return { content: [{ type: 'text', text: JSON.stringify({
        domain, total: allResults.length, indexes_searched: CC_INDEXES.length,
        backlinks: allResults.slice(0, 100)
      }, null, 2) }] };
    }

    if (name === 'find_expired') {
      const keywords = args.keywords.slice(0, 5);
      const limit = args.limit || 20;
      const found = [];
      const seen = new Set();

      for (const keyword of keywords) {
        const ccUrl = `https://index.commoncrawl.org/${CC_INDEXES[0]}-index?url=*.com&output=json&filter=~url:.*${encodeURIComponent(keyword)}.*&limit=${limit}`;
        try {
          const r = await fetch(ccUrl, { signal: AbortSignal.timeout(15000) });
          if (!r.ok) continue;
          const text = await r.text();
          const lines = text.trim().split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              const url = new URL(entry.url.startsWith('http') ? entry.url : 'https://' + entry.url);
              const domain = url.hostname;
              if (seen.has(domain)) continue;
              seen.add(domain);

              let status = 'live';
              try {
                const check = await axios.head(`https://${domain}`, { timeout: 5000, maxRedirects: 3, validateStatus: () => true });
                if (check.status >= 400) status = 'dead';
                if (check.status === 200) {
                  try {
                    const page = await axios.get(`https://${domain}`, { timeout: 5000, maxRedirects: 3 });
                    if (/domain is for sale|buy this domain|parked|domain parking|godaddy/i.test(page.data || '')) status = 'parked';
                  } catch {}
                }
              } catch (e) {
                status = (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' || e.code === 'ETIMEDOUT') ? 'expired' : 'error';
              }

              if (status !== 'live') found.push({ domain, status, last_seen: entry.timestamp || 'unknown', keyword });
              if (found.length >= limit) break;
            } catch {}
          }
        } catch {}
        if (found.length >= limit) break;
      }

      return { content: [{ type: 'text', text: JSON.stringify({ total: found.length, domains: found }, null, 2) }] };
    }

    if (name === 'check_domain') {
      const domain = args.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      let status = 'unknown', pages = 0;

      try {
        const r = await axios.head(`https://${domain}`, { timeout: 5000, validateStatus: () => true });
        status = r.status < 400 ? 'live' : 'dead';
        if (r.status === 200) {
          try {
            const page = await axios.get(`https://${domain}`, { timeout: 5000 });
            if (/domain is for sale|buy this domain|parked|domain parking/i.test(page.data || '')) status = 'parked';
          } catch {}
        }
      } catch (e) {
        status = (e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED') ? 'expired' : 'error';
      }

      try {
        const ccUrl = `https://index.commoncrawl.org/${CC_INDEXES[0]}-index?url=${domain}/*&output=json&limit=200`;
        const r = await fetch(ccUrl, { signal: AbortSignal.timeout(15000) });
        if (r.ok) pages = (await r.text()).trim().split('\n').filter(Boolean).length;
      } catch {}

      return { content: [{ type: 'text', text: JSON.stringify({ domain, status, pages_in_cc: pages, checked_at: new Date().toISOString() }, null, 2) }] };
    }

    if (name === 'competitor_gap') {
      const yourDomain = args.your_domain.replace(/^https?:\/\//, '');
      const competitors = args.competitors.slice(0, 5).map(d => d.replace(/^https?:\/\//, ''));

      const yourSources = new Set();
      for (const index of CC_INDEXES.slice(0, 1)) {
        const entries = await ccQuery(yourDomain, index, 100);
        entries.forEach(e => {
          try { yourSources.add(new URL(e.url.startsWith('http') ? e.url : 'https://' + e.url).hostname); } catch {}
        });
      }

      const gaps = [];
      for (const comp of competitors) {
        for (const index of CC_INDEXES.slice(0, 1)) {
          const entries = await ccQuery(comp, index, 100);
          entries.forEach(e => {
            try {
              const host = new URL(e.url.startsWith('http') ? e.url : 'https://' + e.url).hostname;
              if (!yourSources.has(host) && host !== comp && host !== yourDomain) {
                gaps.push({ source_domain: host, links_to: comp, url: e.url });
              }
            } catch {}
          });
        }
      }

      const unique = [...new Map(gaps.map(g => [g.source_domain, g])).values()];
      return { content: [{ type: 'text', text: JSON.stringify({
        your_domain: yourDomain, competitors, your_linking_domains: yourSources.size,
        gap_opportunities: unique.length, gaps: unique.slice(0, 50)
      }, null, 2) }] };
    }

    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('mcp-common-crawl running on stdio');
}

main().catch(console.error);
