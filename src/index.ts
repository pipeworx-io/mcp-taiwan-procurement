interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Taiwan Government Procurement MCP — 政府電子採購網 (PCC) tenders (keyless).
 *
 * Wraps the g0v community mirror of Taiwan's Public Construction Commission
 * e-procurement platform (政府電子採購網) at https://pcc-api.openfun.app
 * (formerly pcc.g0v.ronny.tw). Covers tender search by title, tender search by
 * awarded vendor/company name, a single tender's full detail (agency, budget,
 * award, deadlines), and a daily list of published tenders.
 *
 * NOTE: This is a THIRD-PARTY community mirror (g0v / openfun), not an official
 * government endpoint. Data freshness and uptime depend on the mirror; treat
 * amounts/dates as best-effort. Response labels are Chinese; keys are shaped to
 * English where practical, Chinese detail values are passed through.
 *
 * All tools return shaped, LLM-friendly objects (not raw API passthrough) and
 * never throw — fetch/parse failures resolve to { error }.
 */


const BASE = 'https://pcc-api.openfun.app/api';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'taiwan_search_tenders',
    description:
      "Search Taiwan government procurement tenders (政府電子採購網 / PCC) by title keyword, via the g0v community mirror. Pass a keyword (Chinese or English, e.g. \"電腦\", \"AI\", \"消防\"). Returns matching tenders with tender id (unit_id + job_number), title, agency (機關名稱), announcement type, date, and category. Use taiwan_get_tender with a result's unit_id + job_number for full detail. Third-party mirror; results are best-effort.",
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Title keyword to search, e.g. "電腦" (computer), "消防" (fire safety), "AI".' },
        page: { type: ['number', 'string'], description: 'Result page (1-based). Defaults to 1.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'taiwan_search_by_company',
    description:
      "Search Taiwan government procurement tenders (政府電子採購網 / PCC) by company / vendor name — finds tenders a company bid on or was awarded (得標/投標廠商), via the g0v community mirror. Pass a company name in Chinese (e.g. \"台積電\", \"中華電信\"). Returns matching tenders with tender id, title, agency, date, and the associated company names/IDs. Third-party mirror; results are best-effort.",
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Company / vendor name, typically Chinese, e.g. "中華電信".' },
        page: { type: ['number', 'string'], description: 'Result page (1-based). Defaults to 1.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'taiwan_get_tender',
    description:
      "Get full detail for one Taiwan government procurement tender (政府電子採購網 / PCC) via the g0v community mirror. Requires unit_id (機關代碼) and job_number (標案案號), both from a taiwan_search_tenders result. Returns agency contact info, procurement category, budget/award amount, deadlines, and status where available, plus a link to the official PCC page. Third-party mirror; some fields may be blank.",
    inputSchema: {
      type: 'object',
      properties: {
        unit_id: { type: 'string', description: 'Agency unit id (機關代碼), e.g. "3.76.49.2". From a search result.' },
        job_number: { type: 'string', description: 'Tender job/case number (標案案號), e.g. "c11511-1". From a search result.' },
      },
      required: ['unit_id', 'job_number'],
    },
  },
  {
    name: 'taiwan_list_by_date',
    description:
      "List Taiwan government procurement tenders (政府電子採購網 / PCC) published on a given date, via the g0v community mirror. Pass a date as YYYYMMDD (e.g. \"20260630\"); defaults to today. Returns tenders with id, title, agency, announcement type, and any associated companies. Third-party mirror; results are best-effort.",
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYYMMDD, e.g. "20260630". Omit for today.' },
      },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'taiwan_search_tenders':
        return await searchTenders(args);
      case 'taiwan_search_by_company':
        return await searchByCompany(args);
      case 'taiwan_get_tender':
        return await getTender(args);
      case 'taiwan_list_by_date':
        return await listByDate(args);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// Shape a raw record from search/list endpoints into a compact tender summary.
function shapeRecord(r: any): Record<string, unknown> {
  const brief = r?.brief ?? {};
  const companies = brief?.companies ?? {};
  const names: string[] = Array.isArray(companies?.names) ? companies.names : [];
  return {
    unit_id: r?.unit_id,
    job_number: r?.job_number,
    tender_id: r?.unit_id && r?.job_number ? `${r.unit_id}/${r.job_number}` : undefined,
    title: brief?.title,
    agency: r?.unit_name ?? brief?.unit_name,
    type: brief?.type,
    category: brief?.category,
    date: r?.date,
    companies: names.length ? names : undefined,
    filename: r?.filename,
  };
}

async function searchTenders(args: Record<string, unknown>): Promise<unknown> {
  const query = strArg(args.query);
  if (!query) throw new Error('taiwan_search_tenders requires "query" — a title keyword like "電腦".');
  const page = strArg(args.page) ?? '1';
  const data = (await pccGet(`/searchbytitle?query=${encodeURIComponent(query)}&page=${encodeURIComponent(page)}`)) as any;
  const records = (data.records ?? []).map(shapeRecord);
  return {
    query,
    page: Number(page) || 1,
    total_records: data.total_records,
    total_pages: data.total_pages,
    count: records.length,
    tenders: records,
  };
}

async function searchByCompany(args: Record<string, unknown>): Promise<unknown> {
  const query = strArg(args.query);
  if (!query) throw new Error('taiwan_search_by_company requires "query" — a company name like "中華電信".');
  const page = strArg(args.page) ?? '1';
  const data = (await pccGet(`/searchbycompanyname?query=${encodeURIComponent(query)}&page=${encodeURIComponent(page)}`)) as any;
  const records = (data.records ?? []).map(shapeRecord);
  return {
    query,
    page: Number(page) || 1,
    total_records: data.total_records,
    total_pages: data.total_pages,
    count: records.length,
    tenders: records,
  };
}

// Detail records carry Chinese "section:field" keys (e.g. "機關資料:機關名稱").
// Pull a handful of the most useful ones by suffix into English keys, and also
// return the full raw detail so nothing is lost.
function pickDetailBySuffix(detail: Record<string, unknown>, suffix: string): string | undefined {
  for (const [k, v] of Object.entries(detail)) {
    if (k.endsWith(suffix) && typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}

async function getTender(args: Record<string, unknown>): Promise<unknown> {
  const unitId = strArg(args.unit_id);
  const jobNumber = strArg(args.job_number);
  if (!unitId || !jobNumber) {
    throw new Error('taiwan_get_tender requires "unit_id" and "job_number" from a search result, e.g. unit_id "3.76.49.2", job_number "c11511-1".');
  }
  const data = (await pccGet(`/tender?unit_id=${encodeURIComponent(unitId)}&job_number=${encodeURIComponent(jobNumber)}`)) as any;
  const rec = (data.records ?? [])[0];
  if (!rec) return { error: 'tender not found', unit_id: unitId, job_number: jobNumber };
  const brief = rec.brief ?? {};
  const detail: Record<string, unknown> = rec.detail ?? {};
  const shaped = {
    unit_id: rec.unit_id ?? unitId,
    job_number: rec.job_number ?? jobNumber,
    title: brief.title ?? pickDetailBySuffix(detail, '標案名稱'),
    agency: data.unit_name ?? pickDetailBySuffix(detail, '機關名稱'),
    agency_address: pickDetailBySuffix(detail, '機關地址'),
    contact: pickDetailBySuffix(detail, '聯絡人'),
    contact_phone: pickDetailBySuffix(detail, '聯絡電話'),
    type: brief.type ?? (detail as any).type,
    category: brief.category ?? pickDetailBySuffix(detail, '標的分類'),
    procurement_nature: pickDetailBySuffix(detail, '財物採購性質'),
    budget_level: pickDetailBySuffix(detail, '採購金額級距'),
    legal_basis: pickDetailBySuffix(detail, '依據法條'),
    date: rec.date,
    official_url: (detail as any).url,
  };
  return { tender: shaped, detail };
}

async function listByDate(args: Record<string, unknown>): Promise<unknown> {
  const date = strArg(args.date) ?? todayYYYYMMDD();
  const data = (await pccGet(`/listbydate?date=${encodeURIComponent(date)}`)) as any;
  const records = (data.records ?? []).map(shapeRecord);
  return { date, count: records.length, tenders: records };
}

function todayYYYYMMDD(): string {
  const d = new Date();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${d.getUTCFullYear()}${m}${day}`;
}

async function pccGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) {
    const body = await res.text().then((t) => t.slice(0, 200)).catch(() => '');
    throw new Error(`PCC mirror (g0v): ${res.status} ${body}`.trim());
  }
  return res.json();
}

function strArg(v: unknown): string | undefined {
  if (typeof v === 'string') {
    const t = v.trim();
    return t ? t : undefined;
  }
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
