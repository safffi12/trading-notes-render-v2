const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PORT = process.env.PORT || 3000;
const SERVER_VERSION = "RENDER_NODE_DYNAMIC_CALENDAR_OFFICIAL_SOURCES_V1";
const rootDir = path.resolve(__dirname);

/* =========================
   CONFIG
========================= */

const commodities = [
  { symbol: "BZ=F", name: "Brent Oil" },
  { symbol: "CL=F", name: "WTI Oil" },
  { symbol: "GC=F", name: "Gold" },
  { symbol: "SI=F", name: "Silver" },
  { symbol: "HG=F", name: "Copper" },
  { symbol: "NG=F", name: "Natural Gas" }
];

const RATES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CALENDAR_CACHE_TTL_MS = 3 * 60 * 60 * 1000;

const RATES_FALLBACK_FILE = path.join(rootDir, "rates", "rates-live-data.json");
const CALENDAR_FALLBACK_FILE = path.join(rootDir, "calendar", "calendar-data.js");

const ratesCache = { createdAt: 0, payload: null };
const calendarCache = { createdAt: 0, payload: null };

const FRED_SERIES = {
  fedUpper: "DFEDTARU",
  fedLower: "DFEDTARL",
  ecb: "ECBDFR",
  us02y: "DGS2",
  us10y: "DGS10",
  us30y: "DGS30",
  realyield: "DFII10",
  dollarfunding: "SOFR",
  bojProxy: "IRSTCI01JPM156N",
  gdpGrowth: "A191RL1Q225SBEA"
};

const BLS_SERIES = {
  cpiAllItems: "CUSR0000SA0",
  cpiCore: "CUSR0000SA0L1E",
  nonfarmPayrolls: "CES0000000001",
  unemploymentRate: "LNS14000000",
  averageHourlyEarnings: "CES0500000003"
};

const OFFICIAL_RELEASE_SCHEDULES = {
  cpi: [
    { period: "2026-M03", title: "Consumer Price Index for March 2026", date: "2026-04-10", time: "08:30 ET", importance: "Высокая" },
    { period: "2026-M04", title: "Consumer Price Index for April 2026", date: "2026-05-12", time: "08:30 ET", importance: "Высокая" },
    { period: "2026-M05", title: "Consumer Price Index for May 2026", date: "2026-06-10", time: "08:30 ET", importance: "Высокая" },
    { period: "2026-M06", title: "Consumer Price Index for June 2026", date: "2026-07-14", time: "08:30 ET", importance: "Высокая" },
    { period: "2026-M07", title: "Consumer Price Index for July 2026", date: "2026-08-12", time: "08:30 ET", importance: "Высокая" }
  ],
  nfp: [
    { period: "2026-M03", title: "Employment Situation for March 2026", date: "2026-04-03", time: "08:30 ET", importance: "Высокая" },
    { period: "2026-M04", title: "Employment Situation for April 2026", date: "2026-05-08", time: "08:30 ET", importance: "Высокая" },
    { period: "2026-M05", title: "Employment Situation for May 2026", date: "2026-06-05", time: "08:30 ET", importance: "Высокая" },
    { period: "2026-M06", title: "Employment Situation for June 2026", date: "2026-07-02", time: "08:30 ET", importance: "Высокая" },
    { period: "2026-M07", title: "Employment Situation for July 2026", date: "2026-08-07", time: "08:30 ET", importance: "Высокая" },
    { period: "2026-M08", title: "Employment Situation for August 2026", date: "2026-09-04", time: "08:30 ET", importance: "Высокая" }
  ],
  gdp: [
    { period: "2026-Q1", title: "GDP Q1 2026, advance estimate", date: "2026-04-30", time: "08:30 ET", importance: "Высокая" },
    { period: "2026-Q1", title: "GDP Q1 2026, second estimate", date: "2026-05-28", time: "08:30 ET", importance: "Средняя" },
    { period: "2026-Q1", title: "GDP Q1 2026, third estimate", date: "2026-06-25", time: "08:30 ET", importance: "Средняя" },
    { period: "2026-Q2", title: "GDP Q2 2026, advance estimate", date: "2026-07-30", time: "08:30 ET", importance: "Высокая" },
    { period: "2026-Q2", title: "GDP Q2 2026, second estimate", date: "2026-08-27", time: "08:30 ET", importance: "Средняя" }
  ],
  fomc: [
    { period: "2026-01", title: "FOMC Rate Decision", date: "2026-01-28", time: "14:00 ET", importance: "Высокая" },
    { period: "2026-03", title: "FOMC Rate Decision + SEP", date: "2026-03-18", time: "14:00 ET", importance: "Высокая" },
    { period: "2026-04", title: "FOMC Rate Decision", date: "2026-04-29", time: "14:00 ET", importance: "Высокая" },
    { period: "2026-06", title: "FOMC Rate Decision + SEP", date: "2026-06-17", time: "14:00 ET", importance: "Высокая" },
    { period: "2026-07", title: "FOMC Rate Decision", date: "2026-07-29", time: "14:00 ET", importance: "Высокая" },
    { period: "2026-09", title: "FOMC Rate Decision + SEP", date: "2026-09-16", time: "14:00 ET", importance: "Высокая" },
    { period: "2026-10", title: "FOMC Rate Decision", date: "2026-10-28", time: "14:00 ET", importance: "Высокая" },
    { period: "2026-12", title: "FOMC Rate Decision + SEP", date: "2026-12-09", time: "14:00 ET", importance: "Высокая" }
  ]
};

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

async function fetchJsonWithTimeout(url, timeoutMs = 15000, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 TradingNotes/1.0",
        "Accept": "application/json,text/plain,*/*",
        ...(options.headers || {})
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

async function fetchTextWithTimeout(url, timeoutMs = 15000, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 TradingNotes/1.0",
        "Accept": "text/csv,text/plain,text/html,*/*",
        ...(options.headers || {})
      }
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 180)}`);
    }

    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}

/* =========================
   BASIC HELPERS
========================= */

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toFiniteNumber(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value)
    .replace("%", "")
    .replace(/\s+/g, "")
    .replace(",", ".")
    .trim();

  if (!normalized || normalized === "." || normalized === "—" || normalized === "-") {
    return null;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function formatDateYYYYMMDD(date) {
  return date.toISOString().slice(0, 10);
}

function formatHumanDateTime(date = new Date()) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin"
  }).format(date);
}

function formatPercent(value, decimals = 2) {
  const number = toFiniteNumber(value);
  return number === null ? "—" : `${number.toFixed(decimals)}%`;
}

function formatSignedPercent(value, decimals = 1) {
  const number = toFiniteNumber(value);

  if (number === null) {
    return "Нет данных";
  }

  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(decimals)}%`;
}

function formatPlainNumber(value, decimals = 2) {
  const number = toFiniteNumber(value);
  return number === null ? "—" : number.toFixed(decimals);
}

function formatPpChange(value, decimals = 2) {
  const number = toFiniteNumber(value);

  if (number === null) {
    return "Без изменений";
  }

  if (Math.abs(number) < 0.000001) {
    return "0.00 п.п.";
  }

  const sign = number > 0 ? "+" : "-";
  return `${sign}${Math.abs(number).toFixed(decimals)} п.п.`;
}

function formatBpChange(value) {
  const number = toFiniteNumber(value);

  if (number === null) {
    return "Без изменений";
  }

  const rounded = Math.round(number);

  if (rounded === 0) {
    return "0 б.п.";
  }

  const sign = rounded > 0 ? "+" : "-";
  return `${sign}${Math.abs(rounded)} б.п.`;
}

function getStateFromChange(value) {
  const number = toFiniteNumber(value);

  if (number === null || Math.abs(number) < 0.000001) {
    return "neutral";
  }

  return number > 0 ? "up" : "down";
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === "\"" && insideQuotes && nextChar === "\"") {
      current += "\"";
      i += 1;
      continue;
    }

    if (char === "\"") {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function parseCsvRows(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] === undefined ? "" : values[index];
    });

    return row;
  });
}

function getLatestAndPreviousObservations(rows, valueKey) {
  const valid = rows
    .map((row) => {
      const value = toFiniteNumber(row[valueKey]);
      const date = row.observation_date || row.DATE || row.Date || row.date || null;

      return {
        date,
        value
      };
    })
    .filter((row) => row.date && row.value !== null);

  if (valid.length === 0) {
    throw new Error(`Нет валидных наблюдений для ${valueKey}`);
  }

  return {
    latest: valid[valid.length - 1],
    previous: valid.length > 1 ? valid[valid.length - 2] : null,
    all: valid
  };
}

function isoDateToRussian(dateText) {
  const date = new Date(`${dateText}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return dateText || "Нет даты";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function getPastAndNextEvents(schedule, now = new Date()) {
  const sorted = schedule
    .slice()
    .sort((a, b) => new Date(`${a.date}T23:59:59Z`) - new Date(`${b.date}T23:59:59Z`));

  const nowTime = now.getTime();

  const past = sorted.filter((event) => {
    return new Date(`${event.date}T23:59:59Z`).getTime() <= nowTime;
  });

  const future = sorted.filter((event) => {
    return new Date(`${event.date}T23:59:59Z`).getTime() > nowTime;
  });

  return {
    last: past.length > 0 ? past[past.length - 1] : null,
    next: future.length > 0 ? future[0] : null,
    upcoming: future.slice(0, 6)
  };
}

function eventToRelease(event) {
  if (!event) {
    return {
      title: "Событие не найдено",
      date: "Ожидает обновления",
      time: "—"
    };
  }

  return {
    title: event.title,
    date: isoDateToRussian(event.date),
    time: event.time
  };
}

function eventToUpcoming(event) {
  return {
    name: event.title,
    date: isoDateToRussian(event.date),
    time: event.time,
    importance: event.importance || "Средняя"
  };
}

/* =========================
   FALLBACK READERS
========================= */

function readRatesFallbackData() {
  try {
    const content = fs.readFileSync(RATES_FALLBACK_FILE, "utf8");
    const parsed = JSON.parse(content);

    return {
      updatedAt: parsed.updatedAt || "Fallback JSON",
      items: parsed.items || {}
    };
  } catch (error) {
    return {
      updatedAt: "Fallback JSON не найден",
      items: {}
    };
  }
}

function readCalendarFallbackData() {
  try {
    const content = fs.readFileSync(CALENDAR_FALLBACK_FILE, "utf8");

    const sandbox = {
      window: {},
      console: {
        log: function () {},
        warn: function () {},
        error: function () {}
      }
    };

    sandbox.window.window = sandbox.window;

    vm.createContext(sandbox);
    vm.runInContext(content, sandbox, {
      filename: CALENDAR_FALLBACK_FILE,
      timeout: 1000
    });

    if (!sandbox.window.calendarData || !sandbox.window.calendarData.items) {
      throw new Error("window.calendarData не найден");
    }

    return clone(sandbox.window.calendarData);
  } catch (error) {
    return {
      updatedAt: "Fallback calendar-data.js не найден",
      items: {}
    };
  }
}

/* =========================
   FRED / RATES
========================= */

async function fetchFredSeries(seriesId) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}`;

  const text = await fetchTextWithTimeout(url, 15000, {
    headers: {
      "Accept": "text/csv,text/plain,*/*"
    }
  });

  const rows = parseCsvRows(text);

  if (rows.length === 0) {
    throw new Error(`FRED ${seriesId}: пустой CSV`);
  }

  return getLatestAndPreviousObservations(rows, seriesId);
}

function buildPercentRateItem(series, source, decimals = 2) {
  const latest = series.latest;
  const previous = series.previous;
  const change = previous ? latest.value - previous.value : 0;

  return {
    value: formatPercent(latest.value, decimals),
    change: formatPpChange(change, 2),
    asOf: latest.date,
    state: getStateFromChange(change),
    source
  };
}

function buildFedItem(lowerSeries, upperSeries) {
  const lower = lowerSeries.latest.value;
  const upper = upperSeries.latest.value;
  const previousUpper = upperSeries.previous ? upperSeries.previous.value : upper;
  const change = upper - previousUpper;

  const value = Math.abs(upper - lower) < 0.000001
    ? formatPercent(upper, 2)
    : `${lower.toFixed(2)}-${upper.toFixed(2)}%`;

  return {
    value,
    change: formatPpChange(change, 2),
    asOf: upperSeries.latest.date,
    state: getStateFromChange(change),
    source: "FRED / Federal Reserve, target range"
  };
}

function buildYieldCurveItem(us10ySeries, us02ySeries) {
  const latestSpread = (us10ySeries.latest.value - us02ySeries.latest.value) * 100;

  const previousSpread = us10ySeries.previous && us02ySeries.previous
    ? (us10ySeries.previous.value - us02ySeries.previous.value) * 100
    : latestSpread;

  const change = latestSpread - previousSpread;

  return {
    value: `${Math.round(latestSpread)} б.п.`,
    change: formatBpChange(change),
    asOf: us10ySeries.latest.date,
    state: getStateFromChange(change),
    source: "Расчет: FRED DGS10 - DGS2"
  };
}

async function fetchBoECurrentRate() {
  const url = "https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp";

  const html = await fetchTextWithTimeout(url, 15000, {
    headers: {
      "Accept": "text/html,*/*"
    }
  });

  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ");

  const currentMatch = text.match(/Current official Bank Rate\s+([0-9]+(?:\.[0-9]+)?)%/i);

  if (!currentMatch) {
    throw new Error("BoE Bank Rate: не удалось найти текущее значение");
  }

  return {
    value: formatPercent(currentMatch[1], 2),
    change: "Без изменений",
    asOf: formatHumanDateTime(new Date()),
    state: "neutral",
    source: "Bank of England"
  };
}

async function fetchStooqQuote(symbol) {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`;

  const text = await fetchTextWithTimeout(url, 15000, {
    headers: {
      "Accept": "text/csv,text/plain,*/*"
    }
  });

  const rows = parseCsvRows(text);

  if (rows.length === 0) {
    throw new Error(`Stooq ${symbol}: пустой CSV`);
  }

  const row = rows[0];
  const close = toFiniteNumber(row.Close);
  const open = toFiniteNumber(row.Open);

  if (close === null) {
    throw new Error(`Stooq ${symbol}: нет Close`);
  }

  const change = open === null ? 0 : close - open;

  return {
    value: formatPlainNumber(close, 2),
    change: Math.abs(change) < 0.000001
      ? "0.00"
      : `${change > 0 ? "+" : "-"}${Math.abs(change).toFixed(2)}`,
    asOf: row.Date || formatDateYYYYMMDD(new Date()),
    state: getStateFromChange(change),
    source: `Stooq ${symbol}`
  };
}

async function fetchYahooChartQuote(symbol) {
  const encodedSymbol = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?range=5d&interval=1d`;

  const json = await fetchJsonWithTimeout(url, 15000);
  const result = json && json.chart && json.chart.result && json.chart.result[0];

  if (!result) {
    throw new Error(`Yahoo ${symbol}: нет chart result`);
  }

  const quote = result.indicators && result.indicators.quote && result.indicators.quote[0]
    ? result.indicators.quote[0]
    : {};

  const closeArray = quote.close || [];
  const timestamps = result.timestamp || [];

  const valid = closeArray
    .map((value, index) => ({
      value,
      timestamp: timestamps[index]
    }))
    .filter((item) => typeof item.value === "number" && Number.isFinite(item.value));

  if (valid.length === 0) {
    throw new Error(`Yahoo ${symbol}: нет Close`);
  }

  const latest = valid[valid.length - 1];
  const previous = valid.length > 1 ? valid[valid.length - 2] : latest;
  const change = latest.value - previous.value;

  const asOfDate = latest.timestamp
    ? new Date(latest.timestamp * 1000).toISOString().slice(0, 10)
    : formatDateYYYYMMDD(new Date());

  return {
    value: formatPlainNumber(latest.value, 2),
    change: Math.abs(change) < 0.000001
      ? "0.00"
      : `${change > 0 ? "+" : "-"}${Math.abs(change).toFixed(2)}`,
    asOf: asOfDate,
    state: getStateFromChange(change),
    source: `Yahoo Finance ${symbol}`
  };
}

function applyFallbackItem(items, fallbackItems, id, error, errors) {
  errors.push(`${id}: ${error.message}`);

  if (fallbackItems[id]) {
    items[id] = {
      ...fallbackItems[id],
      source: "Fallback rates-live-data.json",
      warning: error.message
    };
  }
}

async function fetchRatesData() {
  const fallback = readRatesFallbackData();
  const fallbackItems = fallback.items || {};
  const items = { ...fallbackItems };
  const errors = [];

  const fredRequests = Object.entries(FRED_SERIES)
    .filter(([key]) => key !== "gdpGrowth")
    .map(async ([key, seriesId]) => {
      const data = await fetchFredSeries(seriesId);
      return [key, data];
    });

  const fredSettled = await Promise.allSettled(fredRequests);
  const fred = {};

  fredSettled.forEach((result) => {
    if (result.status === "fulfilled") {
      const [key, data] = result.value;
      fred[key] = data;
    } else {
      errors.push(`FRED: ${result.reason.message}`);
    }
  });

  try {
    if (!fred.fedLower || !fred.fedUpper) {
      throw new Error("не хватает DFEDTARL или DFEDTARU");
    }

    items.fed = buildFedItem(fred.fedLower, fred.fedUpper);
  } catch (error) {
    applyFallbackItem(items, fallbackItems, "fed", error, errors);
  }

  try {
    if (!fred.ecb) {
      throw new Error("не загружен ECBDFR");
    }

    items.ecb = buildPercentRateItem(fred.ecb, "FRED / European Central Bank", 2);
  } catch (error) {
    applyFallbackItem(items, fallbackItems, "ecb", error, errors);
  }

  try {
    items.boe = await fetchBoECurrentRate();
  } catch (error) {
    applyFallbackItem(items, fallbackItems, "boe", error, errors);
  }

  try {
    if (!fred.bojProxy) {
      throw new Error("не загружен IRSTCI01JPM156N");
    }

    items.boj = buildPercentRateItem(
      fred.bojProxy,
      "FRED / OECD, Japan overnight call money proxy",
      2
    );
  } catch (error) {
    applyFallbackItem(items, fallbackItems, "boj", error, errors);
  }

  try {
    if (!fred.us02y) {
      throw new Error("не загружен DGS2");
    }

    items.us02y = buildPercentRateItem(fred.us02y, "FRED / H.15 Selected Interest Rates", 2);
  } catch (error) {
    applyFallbackItem(items, fallbackItems, "us02y", error, errors);
  }

  try {
    if (!fred.us10y) {
      throw new Error("не загружен DGS10");
    }

    items.us10y = buildPercentRateItem(fred.us10y, "FRED / H.15 Selected Interest Rates", 2);
  } catch (error) {
    applyFallbackItem(items, fallbackItems, "us10y", error, errors);
  }

  try {
    if (!fred.us30y) {
      throw new Error("не загружен DGS30");
    }

    items.us30y = buildPercentRateItem(fred.us30y, "FRED / H.15 Selected Interest Rates", 2);
  } catch (error) {
    applyFallbackItem(items, fallbackItems, "us30y", error, errors);
  }

  try {
    if (!fred.us10y || !fred.us02y) {
      throw new Error("не хватает DGS10 или DGS2");
    }

    items.yieldcurve = buildYieldCurveItem(fred.us10y, fred.us02y);
  } catch (error) {
    applyFallbackItem(items, fallbackItems, "yieldcurve", error, errors);
  }

  try {
    items.dxy = await fetchStooqQuote("dx.f");
  } catch (error) {
    applyFallbackItem(items, fallbackItems, "dxy", error, errors);
  }

  try {
    if (!fred.realyield) {
      throw new Error("не загружен DFII10");
    }

    items.realyield = buildPercentRateItem(fred.realyield, "FRED / H.15 TIPS real yield", 2);
  } catch (error) {
    applyFallbackItem(items, fallbackItems, "realyield", error, errors);
  }

  try {
    if (!fred.dollarfunding) {
      throw new Error("не загружен SOFR");
    }

    items.dollarfunding = buildPercentRateItem(fred.dollarfunding, "FRED / New York Fed SOFR", 2);
  } catch (error) {
    applyFallbackItem(items, fallbackItems, "dollarfunding", error, errors);
  }

  try {
    items.move = await fetchYahooChartQuote("^MOVE");
  } catch (error) {
    applyFallbackItem(items, fallbackItems, "move", error, errors);
  }

  return {
    ok: true,
    serverVersion: SERVER_VERSION,
    source: "FRED / BoE / Stooq / Yahoo Finance with local fallback",
    updatedAt: formatHumanDateTime(new Date()),
    updatedAtISO: new Date().toISOString(),
    refreshInterval: "24h lazy server cache",
    items,
    errors
  };
}

async function getRatesDataWithCache(forceRefresh = false) {
  const now = Date.now();

  if (
    !forceRefresh &&
    ratesCache.payload &&
    now - ratesCache.createdAt < RATES_CACHE_TTL_MS
  ) {
    return {
      ...ratesCache.payload,
      cache: {
        status: "hit",
        ageSeconds: Math.round((now - ratesCache.createdAt) / 1000),
        ttlSeconds: Math.round(RATES_CACHE_TTL_MS / 1000)
      }
    };
  }

  try {
    const freshPayload = await fetchRatesData();

    ratesCache.payload = freshPayload;
    ratesCache.createdAt = now;

    return {
      ...freshPayload,
      cache: {
        status: "miss",
        ageSeconds: 0,
        ttlSeconds: Math.round(RATES_CACHE_TTL_MS / 1000)
      }
    };
  } catch (error) {
    if (ratesCache.payload) {
      return {
        ...ratesCache.payload,
        warning: "Источники ставок не ответили, отдан серверный кэш",
        cache: {
          status: "stale",
          ageSeconds: Math.round((now - ratesCache.createdAt) / 1000),
          ttlSeconds: Math.round(RATES_CACHE_TTL_MS / 1000)
        }
      };
    }

    const fallback = readRatesFallbackData();

    return {
      ok: true,
      serverVersion: SERVER_VERSION,
      source: "Fallback rates-live-data.json",
      updatedAt: fallback.updatedAt,
      items: fallback.items || {},
      warning: `Live-источники не ответили: ${error.message}`,
      cache: {
        status: "fallback",
        ageSeconds: null,
        ttlSeconds: Math.round(RATES_CACHE_TTL_MS / 1000)
      },
      errors: [error.message]
    };
  }
}

async function handleRates(req, res) {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const forceRefresh = requestUrl.searchParams.get("refresh") === "1";
    const data = await getRatesDataWithCache(forceRefresh);

    sendJson(res, 200, data);
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      serverVersion: SERVER_VERSION,
      updatedAt: new Date().toISOString(),
      message: "Ошибка сервера при загрузке ставок",
      error: error.message
    });
  }
}

/* =========================
   BLS / CALENDAR
========================= */

async function fetchBlsSeries(seriesIds, startYear, endYear) {
  const url = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

  const json = await fetchJsonWithTimeout(url, 20000, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      seriesid: seriesIds,
      startyear: String(startYear),
      endyear: String(endYear),
      calculations: false
    })
  });

  if (
    !json ||
    json.status !== "REQUEST_SUCCEEDED" ||
    !json.Results ||
    !Array.isArray(json.Results.series)
  ) {
    throw new Error(
      `BLS API не вернул данные: ${
        json && json.message ? json.message.join("; ") : "unknown error"
      }`
    );
  }

  const result = {};

  json.Results.series.forEach((series) => {
    result[series.seriesID] = (series.data || [])
      .filter((row) => /^M\d{2}$/.test(row.period))
      .map((row) => {
        return {
          seriesId: series.seriesID,
          year: Number(row.year),
          period: row.period,
          month: Number(row.period.replace("M", "")),
          periodKey: `${row.year}-${row.period}`,
          value: toFiniteNumber(row.value),
          rawValue: row.value
        };
      })
      .filter((row) => row.value !== null)
      .sort((a, b) => {
        if (a.year !== b.year) {
          return a.year - b.year;
        }

        return a.month - b.month;
      });
  });

  return result;
}

function latestSeriesRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      latest: null,
      previous: null,
      yearAgo: null
    };
  }

  const latest = rows[rows.length - 1];
  const previous = rows.length > 1 ? rows[rows.length - 2] : null;

  const yearAgo = rows.find((row) => {
    return row.year === latest.year - 1 && row.month === latest.month;
  }) || null;

  return {
    latest,
    previous,
    yearAgo
  };
}

function monthOverMonthPercent(latest, previous) {
  if (!latest || !previous || previous.value === 0) {
    return null;
  }

  return ((latest.value / previous.value) - 1) * 100;
}

function yearOverYearPercent(latest, yearAgo) {
  if (!latest || !yearAgo || yearAgo.value === 0) {
    return null;
  }

  return ((latest.value / yearAgo.value) - 1) * 100;
}

function findScheduleByPeriod(schedule, periodKey) {
  return schedule.find((event) => event.period === periodKey) || null;
}

function buildCpiCalendarItem(baseItem, blsData) {
  const allItems = latestSeriesRows(blsData[BLS_SERIES.cpiAllItems]);
  const core = latestSeriesRows(blsData[BLS_SERIES.cpiCore]);

  if (!allItems.latest || !core.latest) {
    throw new Error("BLS CPI: нет последних наблюдений");
  }

  const currentPeriod = allItems.latest.periodKey;
  const releaseEvents = getPastAndNextEvents(OFFICIAL_RELEASE_SCHEDULES.cpi);
  const currentRelease = findScheduleByPeriod(OFFICIAL_RELEASE_SCHEDULES.cpi, currentPeriod) || releaseEvents.last;

  return {
    ...baseItem,
    sourceName: "BLS",
    sourceUrl: "https://www.bls.gov/news.release/cpi.htm",
    lastRelease: eventToRelease(currentRelease),
    nextRelease: eventToRelease(releaseEvents.next),
    metrics: [
      {
        name: "CPI YoY",
        actual: formatSignedPercent(yearOverYearPercent(allItems.latest, allItems.yearAgo), 1),
        previous: "Нет данных",
        forecast: "См. консенсус перед релизом"
      },
      {
        name: "CPI MoM",
        actual: formatSignedPercent(monthOverMonthPercent(allItems.latest, allItems.previous), 1),
        previous: "Нет данных",
        forecast: "См. консенсус перед релизом"
      },
      {
        name: "Core CPI YoY",
        actual: formatSignedPercent(yearOverYearPercent(core.latest, core.yearAgo), 1),
        previous: "Нет данных",
        forecast: "См. консенсус перед релизом"
      },
      {
        name: "Core CPI MoM",
        actual: formatSignedPercent(monthOverMonthPercent(core.latest, core.previous), 1),
        previous: "Нет данных",
        forecast: "См. консенсус перед релизом"
      }
    ],
    upcomingEvents: releaseEvents.upcoming.map(eventToUpcoming),
    _liveStatus: "fresh",
    _liveSource: "BLS API",
    _liveUpdatedAt: new Date().toISOString()
  };
}

function buildNfpCalendarItem(baseItem, blsData) {
  const payrolls = latestSeriesRows(blsData[BLS_SERIES.nonfarmPayrolls]);
  const unemployment = latestSeriesRows(blsData[BLS_SERIES.unemploymentRate]);
  const earnings = latestSeriesRows(blsData[BLS_SERIES.averageHourlyEarnings]);

  if (!payrolls.latest || !unemployment.latest || !earnings.latest) {
    throw new Error("BLS NFP: нет последних наблюдений");
  }

  const payrollRows = blsData[BLS_SERIES.nonfarmPayrolls] || [];
  const payrollChange = payrolls.previous ? payrolls.latest.value - payrolls.previous.value : null;

  const previousPayrollChange =
    payrolls.previous && payrollRows.length > 2
      ? payrolls.previous.value - payrollRows[payrollRows.length - 3].value
      : null;

  const currentPeriod = payrolls.latest.periodKey;
  const releaseEvents = getPastAndNextEvents(OFFICIAL_RELEASE_SCHEDULES.nfp);
  const currentRelease = findScheduleByPeriod(OFFICIAL_RELEASE_SCHEDULES.nfp, currentPeriod) || releaseEvents.last;

  return {
    ...baseItem,
    sourceName: "BLS",
    sourceUrl: "https://www.bls.gov/news.release/empsit.htm",
    lastRelease: eventToRelease(currentRelease),
    nextRelease: eventToRelease(releaseEvents.next),
    metrics: [
      {
        name: "Nonfarm Payrolls",
        actual: payrollChange === null
          ? "Нет данных"
          : `${payrollChange >= 0 ? "+" : ""}${Math.round(payrollChange)} тыс.`,
        previous: previousPayrollChange === null
          ? "Нет данных"
          : `${previousPayrollChange >= 0 ? "+" : ""}${Math.round(previousPayrollChange)} тыс.`,
        forecast: "См. консенсус перед релизом"
      },
      {
        name: "Unemployment Rate",
        actual: formatPercent(unemployment.latest.value, 1),
        previous: unemployment.previous ? formatPercent(unemployment.previous.value, 1) : "Нет данных",
        forecast: "См. консенсус перед релизом"
      },
      {
        name: "Average Hourly Earnings MoM",
        actual: formatSignedPercent(monthOverMonthPercent(earnings.latest, earnings.previous), 1),
        previous: "Нет данных",
        forecast: "См. консенсус перед релизом"
      },
      {
        name: "Average Hourly Earnings YoY",
        actual: formatSignedPercent(yearOverYearPercent(earnings.latest, earnings.yearAgo), 1),
        previous: "Нет данных",
        forecast: "См. консенсус перед релизом"
      }
    ],
    upcomingEvents: releaseEvents.upcoming.map(eventToUpcoming),
    _liveStatus: "fresh",
    _liveSource: "BLS API",
    _liveUpdatedAt: new Date().toISOString()
  };
}

function buildGdpCalendarItem(baseItem, gdpSeries) {
  const latest = gdpSeries.latest;
  const previous = gdpSeries.previous;
  const releaseEvents = getPastAndNextEvents(OFFICIAL_RELEASE_SCHEDULES.gdp);

  return {
    ...baseItem,
    sourceName: "FRED / BEA",
    sourceUrl: "https://fred.stlouisfed.org/series/A191RL1Q225SBEA",
    lastRelease: eventToRelease(releaseEvents.last),
    nextRelease: eventToRelease(releaseEvents.next),
    metrics: [
      {
        name: "Real GDP QoQ annualized",
        actual: formatSignedPercent(latest.value, 1),
        previous: previous ? formatSignedPercent(previous.value, 1) : "Нет данных",
        forecast: "См. консенсус перед релизом"
      },
      {
        name: "Последнее наблюдение FRED",
        actual: latest.date,
        previous: previous ? previous.date : "Нет данных",
        forecast: "BEA schedule"
      }
    ],
    upcomingEvents: releaseEvents.upcoming.map(eventToUpcoming),
    _liveStatus: "fresh",
    _liveSource: "FRED / BEA",
    _liveUpdatedAt: new Date().toISOString()
  };
}

function buildFomcCalendarItem(baseItem, ratesData) {
  const releaseEvents = getPastAndNextEvents(OFFICIAL_RELEASE_SCHEDULES.fomc);
  const fedRate = ratesData && ratesData.items && ratesData.items.fed
    ? ratesData.items.fed.value
    : "Нет данных";

  const upcoming = releaseEvents.upcoming.map(eventToUpcoming);

  if (releaseEvents.next) {
    upcoming.unshift({
      name: "FOMC Press Conference",
      date: isoDateToRussian(releaseEvents.next.date),
      time: "14:30 ET",
      importance: "Высокая"
    });
  }

  return {
    ...baseItem,
    sourceName: "Federal Reserve",
    sourceUrl: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    lastRelease: eventToRelease(releaseEvents.last),
    nextRelease: eventToRelease(releaseEvents.next),
    metrics: [
      {
        name: "Fed Funds Target Range",
        actual: fedRate,
        previous: fedRate,
        forecast: "См. CME/FedWatch перед заседанием"
      },
      {
        name: "Решение по ставке",
        actual: "По последнему заседанию",
        previous: "—",
        forecast: "Зависит от ожиданий рынка"
      },
      {
        name: "Следующий SEP / dot plot",
        actual: "Июнь 2026",
        previous: "Март 2026",
        forecast: "Июнь 2026"
      }
    ],
    upcomingEvents: upcoming.slice(0, 6),
    _liveStatus: "fresh",
    _liveSource: "Federal Reserve / FRED",
    _liveUpdatedAt: new Date().toISOString()
  };
}

function buildRateDecisionsCalendarItem(baseItem, ratesData) {
  const rates = ratesData && ratesData.items ? ratesData.items : {};
  const fomcEvents = getPastAndNextEvents(OFFICIAL_RELEASE_SCHEDULES.fomc);

  return {
    ...baseItem,
    sourceName: "FRED / Federal Reserve / ECB / BoE / BoJ",
    sourceUrl: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    lastRelease: {
      title: "Последние решения центробанков",
      date: formatHumanDateTime(new Date()),
      time: "Автообновление"
    },
    nextRelease: eventToRelease(fomcEvents.next),
    metrics: [
      {
        name: "ФРС",
        actual: rates.fed ? rates.fed.value : "Нет данных",
        previous: rates.fed ? rates.fed.change : "Нет данных",
        forecast: "См. ожидания перед заседанием"
      },
      {
        name: "ЕЦБ",
        actual: rates.ecb ? rates.ecb.value : "Нет данных",
        previous: rates.ecb ? rates.ecb.change : "Нет данных",
        forecast: "См. ожидания перед заседанием"
      },
      {
        name: "Bank of England",
        actual: rates.boe ? rates.boe.value : "Нет данных",
        previous: rates.boe ? rates.boe.change : "Нет данных",
        forecast: "См. ожидания перед заседанием"
      },
      {
        name: "Bank of Japan",
        actual: rates.boj ? rates.boj.value : "Нет данных",
        previous: rates.boj ? rates.boj.change : "Нет данных",
        forecast: "См. ожидания перед заседанием"
      }
    ],
    upcomingEvents: fomcEvents.upcoming.map(eventToUpcoming),
    _liveStatus: "fresh",
    _liveSource: "Rates API / FRED",
    _liveUpdatedAt: new Date().toISOString()
  };
}

function buildSpeechesCalendarItem(baseItem) {
  const fomcEvents = getPastAndNextEvents(OFFICIAL_RELEASE_SCHEDULES.fomc);

  const upcoming = [];

  if (fomcEvents.next) {
    upcoming.push({
      name: "FOMC Press Conference",
      date: isoDateToRussian(fomcEvents.next.date),
      time: "14:30 ET",
      importance: "Высокая"
    });
  }

  fomcEvents.upcoming.slice(0, 4).forEach((event) => {
    upcoming.push({
      name: `${event.title} / возможные комментарии ФРС`,
      date: isoDateToRussian(event.date),
      time: event.time,
      importance: event.importance
    });
  });

  return {
    ...baseItem,
    sourceName: "Federal Reserve / ECB / BoE calendars",
    sourceUrl: "https://www.federalreserve.gov/newsevents.htm",
    nextRelease: upcoming[0]
      ? {
          title: upcoming[0].name,
          date: upcoming[0].date,
          time: upcoming[0].time
        }
      : baseItem.nextRelease,
    metrics: [
      {
        name: "Ближайшее событие",
        actual: upcoming[0] ? upcoming[0].name : "Нет данных",
        previous: "—",
        forecast: "Риторика центробанков"
      },
      {
        name: "Риск волатильности",
        actual: "Высокий на FOMC / CPI / NFP",
        previous: "Средний",
        forecast: "Зависит от календаря"
      }
    ],
    upcomingEvents: upcoming,
    _liveStatus: "fresh",
    _liveSource: "Federal Reserve calendar",
    _liveUpdatedAt: new Date().toISOString()
  };
}

async function fetchCalendarData() {
  const fallback = readCalendarFallbackData();
  const items = clone(fallback.items || {});
  const errors = [];

  const currentYear = new Date().getUTCFullYear();
  const startYear = Math.max(2024, currentYear - 2);
  const endYear = Math.max(2026, currentYear);

  const [blsSettled, gdpSettled, ratesSettled] = await Promise.allSettled([
    fetchBlsSeries(Object.values(BLS_SERIES), startYear, endYear),
    fetchFredSeries(FRED_SERIES.gdpGrowth),
    getRatesDataWithCache(false)
  ]);

  let blsData = null;
  let gdpSeries = null;
  let ratesData = null;

  if (blsSettled.status === "fulfilled") {
    blsData = blsSettled.value;
  } else {
    errors.push(`BLS: ${blsSettled.reason.message}`);
  }

  if (gdpSettled.status === "fulfilled") {
    gdpSeries = gdpSettled.value;
  } else {
    errors.push(`FRED GDP: ${gdpSettled.reason.message}`);
  }

  if (ratesSettled.status === "fulfilled") {
    ratesData = ratesSettled.value;
  } else {
    errors.push(`Rates: ${ratesSettled.reason.message}`);
  }

  try {
    if (!blsData) {
      throw new Error("BLS не ответил");
    }

    items.cpi = buildCpiCalendarItem(items.cpi || {}, blsData);
  } catch (error) {
    errors.push(`cpi: ${error.message}`);

    if (items.cpi) {
      items.cpi._liveStatus = "error";
    }
  }

  try {
    if (!blsData) {
      throw new Error("BLS не ответил");
    }

    items.nfp = buildNfpCalendarItem(items.nfp || {}, blsData);
  } catch (error) {
    errors.push(`nfp: ${error.message}`);

    if (items.nfp) {
      items.nfp._liveStatus = "error";
    }
  }

  try {
    if (!gdpSeries) {
      throw new Error("FRED GDP не ответил");
    }

    items.gdp = buildGdpCalendarItem(items.gdp || {}, gdpSeries);
  } catch (error) {
    errors.push(`gdp: ${error.message}`);

    if (items.gdp) {
      items.gdp._liveStatus = "error";
    }
  }

  try {
    items.fomc = buildFomcCalendarItem(items.fomc || {}, ratesData);
  } catch (error) {
    errors.push(`fomc: ${error.message}`);

    if (items.fomc) {
      items.fomc._liveStatus = "error";
    }
  }

  try {
    items.rateDecisions = buildRateDecisionsCalendarItem(items.rateDecisions || {}, ratesData);
  } catch (error) {
    errors.push(`rateDecisions: ${error.message}`);

    if (items.rateDecisions) {
      items.rateDecisions._liveStatus = "error";
    }
  }

  try {
    items.speeches = buildSpeechesCalendarItem(items.speeches || {});
  } catch (error) {
    errors.push(`speeches: ${error.message}`);

    if (items.speeches) {
      items.speeches._liveStatus = "error";
    }
  }

  return {
    ok: true,
    serverVersion: SERVER_VERSION,
    source: "BLS / FRED / Federal Reserve / Rates API with local fallback",
    updatedAt: formatHumanDateTime(new Date()),
    updatedAtISO: new Date().toISOString(),
    refreshInterval: "3h lazy server cache",
    items,
    errors
  };
}

async function getCalendarDataWithCache(forceRefresh = false) {
  const now = Date.now();

  if (
    !forceRefresh &&
    calendarCache.payload &&
    now - calendarCache.createdAt < CALENDAR_CACHE_TTL_MS
  ) {
    return {
      ...calendarCache.payload,
      cache: {
        status: "hit",
        ageSeconds: Math.round((now - calendarCache.createdAt) / 1000),
        ttlSeconds: Math.round(CALENDAR_CACHE_TTL_MS / 1000)
      }
    };
  }

  try {
    const freshPayload = await fetchCalendarData();

    calendarCache.payload = freshPayload;
    calendarCache.createdAt = now;

    return {
      ...freshPayload,
      cache: {
        status: "miss",
        ageSeconds: 0,
        ttlSeconds: Math.round(CALENDAR_CACHE_TTL_MS / 1000)
      }
    };
  } catch (error) {
    if (calendarCache.payload) {
      return {
        ...calendarCache.payload,
        warning: "Источники календаря не ответили, отдан серверный кэш",
        cache: {
          status: "stale",
          ageSeconds: Math.round((now - calendarCache.createdAt) / 1000),
          ttlSeconds: Math.round(CALENDAR_CACHE_TTL_MS / 1000)
        }
      };
    }

    const fallback = readCalendarFallbackData();

    return {
      ok: true,
      serverVersion: SERVER_VERSION,
      source: "Fallback calendar-data.js",
      updatedAt: fallback.updatedAt || "Fallback",
      updatedAtISO: new Date().toISOString(),
      items: fallback.items || {},
      warning: `Live-источники не ответили: ${error.message}`,
      cache: {
        status: "fallback",
        ageSeconds: null,
        ttlSeconds: Math.round(CALENDAR_CACHE_TTL_MS / 1000)
      },
      errors: [error.message]
    };
  }
}

async function handleCalendar(req, res) {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const forceRefresh = requestUrl.searchParams.get("refresh") === "1";
    const data = await getCalendarDataWithCache(forceRefresh);

    sendJson(res, 200, data);
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      serverVersion: SERVER_VERSION,
      updatedAt: new Date().toISOString(),
      message: "Ошибка сервера при загрузке календаря",
      error: error.message
    });
  }
}

/* =========================
   COMMODITIES
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
      const json = await fetchJsonWithTimeout(url, 15000);
      const result = json && json.chart && json.chart.result && json.chart.result[0];

      if (!result) {
        throw new Error(`Yahoo did not return chart data for ${item.symbol}`);
      }

      const meta = result.meta || {};
      const quote = result.indicators && result.indicators.quote && result.indicators.quote[0]
        ? result.indicators.quote[0]
        : {};

      const closeArray = quote.close || [];
      const openArray = quote.open || [];
      const highArray = quote.high || [];
      const lowArray = quote.low || [];
      const volumeArray = quote.volume || [];

      const lastCloseFromChart = getLastValidNumber(closeArray);
      const previousCloseFromChart = getPreviousValidNumber(closeArray);

      const price = typeof meta.regularMarketPrice === "number"
        ? meta.regularMarketPrice
        : lastCloseFromChart;

      const previousClose = typeof meta.chartPreviousClose === "number"
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
   HEALTH / LEGACY ROUTES
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

async function handleLegacyInvestingCalendar(req, res) {
  const data = await getCalendarDataWithCache(false);

  sendJson(res, 200, {
    ok: true,
    serverVersion: SERVER_VERSION,
    source: "Official calendar replacement for legacy Investing endpoint",
    updatedAt: data.updatedAtISO || new Date().toISOString(),
    rowsFound: Object.keys(data.items || {}).length,
    items: data.items || {},
    warning: "Этот endpoint оставлен для совместимости. Основной endpoint: /api/calendar."
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

  if (directPath !== rootDir && !directPath.startsWith(rootDir + path.sep)) {
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

  if (url.startsWith("/api/calendar")) {
    handleCalendar(req, res);
    return;
  }

  if (url.startsWith("/api/rates")) {
    handleRates(req, res);
    return;
  }

  if (url.startsWith("/api/commodities")) {
    handleCommodities(req, res);
    return;
  }

  if (
    url.startsWith("/api/investing-calendar-live") ||
    url.startsWith("/api/investing-calendar-test")
  ) {
    handleLegacyInvestingCalendar(req, res);
    return;
  }

  serveStaticFile(req, res);
});

server.listen(PORT, () => {
  console.log("======================================");
  console.log(`Server version: ${SERVER_VERSION}`);
  console.log(`Server is running on port: ${PORT}`);
  console.log("Health check: /api/health");
  console.log("Calendar API: /api/calendar");
  console.log("Calendar API force refresh: /api/calendar?refresh=1");
  console.log("Rates API: /api/rates");
  console.log("Rates API force refresh: /api/rates?refresh=1");
  console.log("Commodities API: /api/commodities");
  console.log("Auto-shutdown: disabled for Render");
  console.log("======================================");
});