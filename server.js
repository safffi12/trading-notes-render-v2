const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const SERVER_VERSION = "RENDER_NODE_DYNAMIC_V1";

const rootDir = __dirname;

const commodities = [
  { symbol: "BZ=F", name: "Brent Oil" },
  { symbol: "CL=F", name: "WTI Oil" },
  { symbol: "GC=F", name: "Gold" },
  { symbol: "SI=F", name: "Silver" },
  { symbol: "HG=F", name: "Copper" },
  { symbol: "NG=F", name: "Natural Gas" }
];

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

function handleHealth(req, res) {
  sendJson(res, 200, {
    ok: true,
    serverVersion: SERVER_VERSION,
    status: "running",
    time: new Date().toISOString()
  });
}

function handleHeartbeat(req, res) {
  /*
    Этот endpoint оставлен только для совместимости со старым site-session.js.
    На Render сервер НЕ должен автоматически выключаться.
  */
  sendJson(res, 200, {
    ok: true,
    serverVersion: SERVER_VERSION,
    status: "heartbeat accepted",
    time: new Date().toISOString()
  });
}

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

  serveStaticFile(req, res);
});

server.listen(PORT, () => {
  console.log("======================================");
  console.log(`Server version: ${SERVER_VERSION}`);
  console.log(`Server is running on port: ${PORT}`);
  console.log(`Health check: /api/health`);
  console.log(`Commodities API: /api/commodities`);
  console.log("Auto-shutdown: disabled for Render");
  console.log("======================================");
});