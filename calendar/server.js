const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const SERVER_VERSION = "RENDER_NODE_DYNAMIC_INVESTING_CALENDAR_TEST_NO_DEPS_V1";

const rootDir = __dirname;

/* =========================
   COMMODITIES CONFIG
========================= */

const commodities = [
  { symbol: "BZ=F", name: "Brent Oil" },
  { symbol: "CL=F", name: "WTI Oil" },
  { symbol: "GC=F", name: "Gold" },
  { symbol: "SI=F", name: "Silver" },
  { symbol: "HG=F", name: "Copper" },
  { symbol: "NG=F", name: "Natural Gas" }
];

/* =========================
   INVESTING CALENDAR CONFIG
========================= */

const INVESTING_BASE_URL = "https://www.investing.com";
const INVESTING_CALENDAR_PAGE_URL = `${INVESTING_BASE_URL}/economic-calendar/`;
const INVESTING_CALENDAR_API_URL =
  `${INVESTING_BASE_URL}/economic-calendar/Service/getCalendarFilteredData`;

const INVESTING_CALENDAR_CACHE_TTL_MS = 30 * 60 * 1000;

const investingCalendarCache = {
  createdAt: 0,
  payload: null
};

const investingCookieCache = {
  expiresAt: 0,
  value: ""
};

/*
  Коды стран Investing.com:
  5  - United States
  72 - Euro Zone
  4  - United Kingdom
  35 - Japan
  6  - Canada
  25 - Australia
  43 - New Zealand
  12 - Switzerland
  17 - Germany
  22 - France
  37 - China
*/
const investingCountryIds = [
  "5",
  "72",
  "4",
  "35",
  "6",
  "25",
  "43",
  "12",
  "17",
  "22",
  "37"
];

/* =========================
   MIME TYPES
========================= */

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf"
};

/* =========================
   RESPONSE HELPERS
========================= */

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });

  res.end(JSON.stringify(data, null, 2));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });

  res.end(text);
}

/* =========================
   FETCH HELPERS
========================= */

async function fetchJsonWithTimeout(url, timeoutMs = 12000) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 TradingNotes/1.0",
        "Accept": "application/json,text/plain,*/*"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchTextResponseWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    const text = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type") || "",
      headers: response.headers,
      text
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function getInvestingBrowserHeaders(extraHeaders = {}) {
  return {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,text/javascript,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
    "Connection": "keep-alive",
    ...extraHeaders
  };
}

function extractCookieHeader(headers) {
  if (!headers) {
    return "";
  }

  if (typeof headers.getSetCookie === "function") {
    const cookies = headers.getSetCookie();

    if (Array.isArray(cookies) && cookies.length > 0) {
      return cookies
        .map((cookie) => cookie.split(";")[0])
        .filter(Boolean)
        .join("; ");
    }
  }

  const singleCookieHeader = headers.get("set-cookie");

  if (!singleCookieHeader) {
    return "";
  }

  return singleCookieHeader
    .split(",")
    .map((cookie) => cookie.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function getInvestingCookies() {
  const now = Date.now();

  if (investingCookieCache.value && investingCookieCache.expiresAt > now) {
    return investingCookieCache.value;
  }

  try {
    const response = await fetchTextResponseWithTimeout(
      INVESTING_CALENDAR_PAGE_URL,
      {
        method: "GET",
        headers: getInvestingBrowserHeaders({
          "Referer": INVESTING_BASE_URL
        })
      },
      15000
    );

    const cookieHeader = extractCookieHeader(response.headers);

    investingCookieCache.value = cookieHeader;
    investingCookieCache.expiresAt = now + 6 * 60 * 60 * 1000;

    return cookieHeader;
  } catch (error) {
    return "";
  }
}

/* =========================
   DATE HELPERS
========================= */

function addDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function formatDateYYYYMMDD(date) {
  return date.toISOString().slice(0, 10);
}

/* =========================
   BASIC HTML PARSER HELPERS
========================= */

function decodeHtmlEntities(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, function (_, code) {
      return String.fromCharCode(Number(code));
    })
    .replace(/&#x([0-9a-fA-F]+);/g, function (_, code) {
      return String.fromCharCode(parseInt(code, 16));
    });
}

function stripTags(html) {
  return decodeHtmlEntities(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text || null;
}

function extractAttr(html, attrName) {
  const pattern = new RegExp(`${attrName}\\s*=\\s*["']([^"']*)["']`, "i");
  const match = String(html || "").match(pattern);

  return match ? decodeHtmlEntities(match[1]).trim() : null;
}

function extractCellByClass(rowHtml, className) {
  const pattern = new RegExp(
    `<td\\b(?=[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'])[^>]*>([\\s\\S]*?)<\\/td>`,
    "i"
  );

  const match = String(rowHtml || "").match(pattern);

  return match ? match[1] : "";
}

function extractCountryFromFlagCell(flagCellHtml) {
  const titleMatch = String(flagCellHtml || "").match(
    /<span\b[^>]*title=["']([^"']+)["'][^>]*>/i
  );

  if (titleMatch) {
    return normalizeText(decodeHtmlEntities(titleMatch[1]));
  }

  return normalizeText(stripTags(flagCellHtml));
}

function parseInvestingImportance(rowHtml) {
  const sentimentCell = extractCellByClass(rowHtml, "sentiment");
  const title = extractAttr(sentimentCell, "title") || "";
  const fullIconCount = (sentimentCell.match(/grayFullBullishIcon/gi) || []).length;

  let level = 1;

  if (fullIconCount >= 3) {
    level = 3;
  } else if (fullIconCount === 2) {
    level = 2;
  } else if (/high/i.test(title) || /высок/i.test(title)) {
    level = 3;
  } else if (/medium/i.test(title) || /сред/i.test(title)) {
    level = 2;
  }

  const label =
    level >= 3
      ? "Высокая"
      : level === 2
        ? "Средняя"
        : "Низкая";

  return {
    level,
    label
  };
}

function extractInvestingCalendarHtml(responseText) {
  try {
    const json = JSON.parse(responseText);

    if (json && typeof json.data === "string") {
      return {
        html: json.data,
        responseType: "json",
        jsonKeys: Object.keys(json)
      };
    }

    if (json && typeof json.html === "string") {
      return {
        html: json.html,
        responseType: "json",
        jsonKeys: Object.keys(json)
      };
    }

    return {
      html: responseText,
      responseType: "json-without-html",
      jsonKeys: Object.keys(json || {})
    };
  } catch (error) {
    return {
      html: responseText,
      responseType: "html",
      jsonKeys: []
    };
  }
}

function detectInvestingBlock(html) {
  const lower = String(html || "").toLowerCase();

  if (lower.includes("captcha")) {
    return "captcha";
  }

  if (lower.includes("access denied")) {
    return "access denied";
  }

  if (lower.includes("blocked")) {
    return "blocked";
  }

  if (lower.includes("cloudflare")) {
    return "cloudflare";
  }

  return null;
}

function parseInvestingCalendarRows(html) {
  const events = [];
  const sourceHtml = String(html || "");

  const rowMatches = sourceHtml.match(
    /<tr\b(?=[^>]*(?:js-event-item|eventRowId_))[^>]*>[\s\S]*?<\/tr>/gi
  );

  if (!rowMatches) {
    return events;
  }

  rowMatches.forEach((rowHtml, index) => {
    const rowId = extractAttr(rowHtml, "id") || `event-${index + 1}`;

    const dateTime =
      extractAttr(rowHtml, "data-event-datetime") ||
      extractAttr(rowHtml, "data-event-datetime-local");

    const timeCell = extractCellByClass(rowHtml, "time");
    const flagCell = extractCellByClass(rowHtml, "flagCur");
    const eventCell = extractCellByClass(rowHtml, "event");
    const actualCell = extractCellByClass(rowHtml, "act");
    const forecastCell = extractCellByClass(rowHtml, "fore");
    const previousCell = extractCellByClass(rowHtml, "prev");

    const time = normalizeText(stripTags(timeCell));
    const country = extractCountryFromFlagCell(flagCell);
    const event = normalizeText(stripTags(eventCell));
    const actual = normalizeText(stripTags(actualCell));
    const forecast = normalizeText(stripTags(forecastCell));
    const previous = normalizeText(stripTags(previousCell));

    const importance = parseInvestingImportance(rowHtml);

    if (!event) {
      return;
    }

    events.push({
      id: rowId,
      dateTime,
      time,
      country,
      event,
      actual,
      forecast,
      previous,
      importance: importance.label,
      importanceLevel: importance.level
    });
  });

  return events;
}

/* =========================
   INVESTING CALENDAR FETCH
========================= */

function buildInvestingCalendarBody() {
  const today = new Date();

  const dateFrom = formatDateYYYYMMDD(addDays(today, -3));
  const dateTo = formatDateYYYYMMDD(addDays(today, 180));

  const params = new URLSearchParams();

  params.append("dateFrom", dateFrom);
  params.append("dateTo", dateTo);
  params.append("timeZone", "55");
  params.append("timeFilter", "timeRemain");
  params.append("currentTab", "custom");
  params.append("limit_from", "0");
  params.append("submitFilters", "1");

  investingCountryIds.forEach((countryId) => {
    params.append("country[]", countryId);
  });

  params.append("importance[]", "1");
  params.append("importance[]", "2");
  params.append("importance[]", "3");

  return {
    body: params.toString(),
    dateFrom,
    dateTo
  };
}

async function fetchInvestingCalendarData() {
  const request = buildInvestingCalendarBody();
  const cookies = await getInvestingCookies();

  const headers = getInvestingBrowserHeaders({
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": INVESTING_BASE_URL,
    "Referer": INVESTING_CALENDAR_PAGE_URL,
    "X-Requested-With": "XMLHttpRequest"
  });

  if (cookies) {
    headers.Cookie = cookies;
  }

  const response = await fetchTextResponseWithTimeout(
    INVESTING_CALENDAR_API_URL,
    {
      method: "POST",
      headers,
      body: request.body
    },
    20000
  );

  const extracted = extractInvestingCalendarHtml(response.text);
  const blockReason = detectInvestingBlock(extracted.html);

  if (!response.ok) {
    throw new Error(
      `Investing.com вернул HTTP ${response.status}. Фрагмент ответа: ${response.text.slice(0, 220)}`
    );
  }

  if (blockReason) {
    throw new Error(
      `Investing.com заблокировал запрос. Причина: ${blockReason}. Фрагмент ответа: ${response.text.slice(0, 220)}`
    );
  }

  const events = parseInvestingCalendarRows(extracted.html);

  return {
    ok: true,
    serverVersion: SERVER_VERSION,
    source: "Investing.com",
    updatedAt: new Date().toISOString(),
    request: {
      dateFrom: request.dateFrom,
      dateTo: request.dateTo,
      countryIds: investingCountryIds,
      endpoint: "/economic-calendar/Service/getCalendarFilteredData"
    },
    responseMeta: {
      status: response.status,
      contentType: response.contentType,
      responseType: extracted.responseType,
      jsonKeys: extracted.jsonKeys,
      htmlLength: extracted.html.length
    },
    rowsFound: events.length,
    items: events
  };
}

async function getInvestingCalendarDataWithCache(forceRefresh = false) {
  const now = Date.now();

  if (
    !forceRefresh &&
    investingCalendarCache.payload &&
    now - investingCalendarCache.createdAt < INVESTING_CALENDAR_CACHE_TTL_MS
  ) {
    return {
      ...investingCalendarCache.payload,
      cache: {
        status: "hit",
        ageSeconds: Math.round((now - investingCalendarCache.createdAt) / 1000)
      }
    };
  }

  const freshPayload = await fetchInvestingCalendarData();

  investingCalendarCache.payload = freshPayload;
  investingCalendarCache.createdAt = now;

  return {
    ...freshPayload,
    cache: {
      status: "miss",
      ageSeconds: 0
    }
  };
}

async function handleInvestingCalendarTest(req, res) {
  try {
    const data = await getInvestingCalendarDataWithCache(true);

    sendJson(res, 200, {
      ok: true,
      serverVersion: SERVER_VERSION,
      source: data.source,
      updatedAt: data.updatedAt,
      request: data.request,
      responseMeta: data.responseMeta,
      rowsFound: data.rowsFound,
      sample: data.items.slice(0, 15)
    });
  } catch (error) {
    sendJson(res, 502, {
      ok: false,
      serverVersion: SERVER_VERSION,
      source: "Investing.com",
      updatedAt: new Date().toISOString(),
      message: "Не удалось получить календарь Investing.com",
      error: error.message,
      nextStep:
        "Если здесь 403, captcha, cloudflare или access denied — Investing.com блокирует запрос с сервера."
    });
  }
}

async function handleInvestingCalendarLive(req, res) {
  try {
    const data = await getInvestingCalendarDataWithCache(false);
    sendJson(res, 200, data);
  } catch (error) {
    if (investingCalendarCache.payload) {
      sendJson(res, 200, {
        ...investingCalendarCache.payload,
        ok: true,
        warning: "Источник не ответил, отдан старый кэш",
        cache: {
          status: "stale",
          ageSeconds: Math.round(
            (Date.now() - investingCalendarCache.createdAt) / 1000
          )
        }
      });

      return;
    }

    sendJson(res, 502, {
      ok: false,
      serverVersion: SERVER_VERSION,
      source: "Investing.com",
      updatedAt: new Date().toISOString(),
      message: "Не удалось получить live-календарь Investing.com",
      error: error.message
    });
  }
}

/* =========================
   COMMODITIES HELPERS
========================= */

function getLastValidNumber(array) {
  if (!Array.isArray(array)) {
    return null;
  }

  for (let i = array.length - 1; i >= 0; i -= 1) {
    const value = array[i];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function getPreviousValidNumber(array) {
  if (!Array.isArray(array)) {
    return null;
  }

  let foundLast = false;

  for (let i = array.length - 1; i >= 0; i -= 1) {
    const value = array[i];

    if (typeof value === "number" && Number.isFinite(value)) {
      if (!foundLast) {
        foundLast = true;
      } else {
        return value;
      }
    }
  }

  return null;
}

async function fetchYahooCommodity(item) {
  const encodedSymbol = encodeURIComponent(item.symbol);

  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?range=5d&interval=1d`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?range=5d&interval=1d`
  ];

  let lastError = null;

  for (const url of urls) {
    try {
      const json = await fetchJsonWithTimeout(url);

      const result = json?.chart?.result?.[0];

      if (!result) {
        throw new Error(`Yahoo did not return chart data for ${item.symbol}`);
      }

      const meta = result.meta || {};
      const quote = result?.indicators?.quote?.[0] || {};

      const closeArray = quote.close || [];
      const openArray = quote.open || [];
      const highArray = quote.high || [];
      const lowArray = quote.low || [];
      const volumeArray = quote.volume || [];

      const lastCloseFromChart = getLastValidNumber(closeArray);
      const previousCloseFromChart = getPreviousValidNumber(closeArray);

      const price =
        typeof meta.regularMarketPrice === "number"
          ? meta.regularMarketPrice
          : lastCloseFromChart;

      const previousClose =
        typeof meta.chartPreviousClose === "number"
          ? meta.chartPreviousClose
          : previousCloseFromChart;

      const open = getLastValidNumber(openArray);
      const high = getLastValidNumber(highArray);
      const low = getLastValidNumber(lowArray);
      const volume = getLastValidNumber(volumeArray);

      if (price === null || price === undefined || !Number.isFinite(price)) {
        throw new Error(`No price for ${item.symbol}`);
      }

      let change = null;
      let changePercent = null;

      if (
        previousClose !== null &&
        previousClose !== undefined &&
        Number.isFinite(previousClose) &&
        previousClose !== 0
      ) {
        change = price - previousClose;
        changePercent = (change / previousClose) * 100;
      }

      return {
        symbol: item.symbol,
        name: item.name,
        price,
        open,
        high,
        low,
        volume,
        previousClose,
        change,
        changePercent,
        currency: meta.currency || "USD",
        exchangeName: meta.exchangeName || "",
        source: "Yahoo Finance"
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `${item.symbol}: ${lastError ? lastError.message : "fetch failed"}`
  );
}

async function handleCommodities(req, res) {
  try {
    const results = await Promise.allSettled(
      commodities.map((item) => fetchYahooCommodity(item))
    );

    const items = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    const errors = results
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason.message);

    if (items.length === 0) {
      sendJson(res, 502, {
        ok: false,
        serverVersion: SERVER_VERSION,
        updatedAt: new Date().toISOString(),
        message: "Источники не отдали данные по сырью",
        errors
      });

      return;
    }

    sendJson(res, 200, {
      ok: true,
      serverVersion: SERVER_VERSION,
      updatedAt: new Date().toISOString(),
      items,
      errors
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      serverVersion: SERVER_VERSION,
      updatedAt: new Date().toISOString(),
      message: "Ошибка сервера при загрузке сырья",
      error: error.message
    });
  }
}

/* =========================
   HEALTH / HEARTBEAT
========================= */

function handleHealth(req, res) {
  sendJson(res, 200, {
    ok: true,
    serverVersion: SERVER_VERSION,
    status: "running",
    time: new Date().toISOString()
  });
}

function handleHeartbeat(req, res) {
  sendJson(res, 200, {
    ok: true,
    serverVersion: SERVER_VERSION,
    status: "heartbeat accepted",
    time: new Date().toISOString()
  });
}

/* =========================
   STATIC FILE SERVER
========================= */

function resolveStaticPath(requestedPath) {
  if (requestedPath === "/") {
    return path.join(rootDir, "index.html");
  }

  const cleanPath = requestedPath.replace(/^\/+/, "");
  const directPath = path.resolve(rootDir, cleanPath);

  if (!directPath.startsWith(rootDir)) {
    return null;
  }

  return directPath;
}

function sendStaticFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendText(res, 404, "File not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    const headers = {
      "Content-Type": contentType
    };

    if (ext === ".html" || ext === ".json" || ext === ".js" || ext === ".css") {
      headers["Cache-Control"] = "no-store";
    }

    res.writeHead(200, headers);
    res.end(content);
  });
}

function serveStaticFile(req, res) {
  let requestedPath;

  try {
    requestedPath = decodeURIComponent(req.url.split("?")[0]);
  } catch (error) {
    sendText(res, 400, "Bad request");
    return;
  }

  const filePath = resolveStaticPath(requestedPath);

  if (!filePath) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendStaticFile(res, filePath);
      return;
    }

    if (!error && stats.isDirectory()) {
      const indexPath = path.join(filePath, "index.html");

      fs.stat(indexPath, (indexError, indexStats) => {
        if (!indexError && indexStats.isFile()) {
          sendStaticFile(res, indexPath);
          return;
        }

        sendText(res, 404, "File not found");
      });

      return;
    }

    const ext = path.extname(filePath);

    if (!ext) {
      const htmlPath = `${filePath}.html`;

      fs.stat(htmlPath, (htmlError, htmlStats) => {
        if (!htmlError && htmlStats.isFile()) {
          sendStaticFile(res, htmlPath);
          return;
        }

        sendText(res, 404, "File not found");
      });

      return;
    }

    sendText(res, 404, "File not found");
  });
}

/* =========================
   SERVER ROUTER
========================= */

const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (url === "/api/health") {
    handleHealth(req, res);
    return;
  }

  if (url === "/api/site-heartbeat") {
    handleHeartbeat(req, res);
    return;
  }

  if (url.startsWith("/api/commodities")) {
    handleCommodities(req, res);
    return;
  }

  if (url.startsWith("/api/investing-calendar-test")) {
    handleInvestingCalendarTest(req, res);
    return;
  }

  if (url.startsWith("/api/investing-calendar-live")) {
    handleInvestingCalendarLive(req, res);
    return;
  }

  serveStaticFile(req, res);
});

server.listen(PORT, () => {
  console.log("======================================");
  console.log(`Server version: ${SERVER_VERSION}`);
  console.log(`Server is running on port: ${PORT}`);
  console.log(`Health check: /api/health`);
  console.log(`Commodities API: /api/commodities`);
  console.log(`Investing Calendar Test API: /api/investing-calendar-test`);
  console.log(`Investing Calendar Live API: /api/investing-calendar-live`);
  console.log("Auto-shutdown: disabled for Render");
  console.log("======================================");
});