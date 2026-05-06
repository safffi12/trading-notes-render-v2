import fs from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, "rates", "rates-live-data.json");

const SYMBOLS = {
  fed: {
    tvSymbol: "ECONOMICS:USINTR",
    type: "percent",
    label: "Fed"
  },
  ecb: {
    tvSymbol: "ECONOMICS:EUINTR",
    type: "percent",
    label: "ECB"
  },
  boe: {
    tvSymbol: "ECONOMICS:GBINTR",
    type: "percent",
    label: "BoE"
  },
  boj: {
    tvSymbol: "ECONOMICS:JPINTR",
    type: "percent",
    label: "BoJ"
  },
  us02y: {
    tvSymbol: "TVC:US02Y",
    type: "percent",
    label: "US02Y"
  },
  us10y: {
    tvSymbol: "TVC:US10Y",
    type: "percent",
    label: "US10Y"
  },
  us30y: {
    tvSymbol: "TVC:US30Y",
    type: "percent",
    label: "US30Y"
  },
  dxy: {
    tvSymbol: "TVC:DXY",
    type: "index",
    label: "DXY"
  },
  realyield: {
    tvSymbol: "FRED:DFII10",
    type: "percent",
    label: "Real Yield"
  },
  dollarfunding: {
    tvSymbol: "FRED:SOFR",
    type: "percent",
    label: "SOFR"
  },
  move: {
    tvSymbol: "TVC:MOVE",
    type: "index",
    label: "MOVE"
  }
};

function formatDateTimeRu(date = new Date()) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function toNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function formatValue(value, type) {
  const number = toNumber(value);

  if (number === null) {
    return "—";
  }

  if (type === "percent") {
    return `${number.toFixed(2)}%`;
  }

  if (type === "basisPoints") {
    return `${number.toFixed(0)} б.п.`;
  }

  return number.toFixed(2);
}

function formatChange(changeAbs, type) {
  const number = toNumber(changeAbs);

  if (number === null) {
    return "Без изменений";
  }

  const sign = number > 0 ? "+" : "";

  if (type === "percent") {
    return `${sign}${number.toFixed(2)} п.п.`;
  }

  if (type === "basisPoints") {
    return `${sign}${number.toFixed(0)} б.п.`;
  }

  return `${sign}${number.toFixed(2)}`;
}

function getState(changeAbs) {
  const number = toNumber(changeAbs);

  if (number === null || number === 0) {
    return "neutral";
  }

  return number > 0 ? "up" : "down";
}

async function fetchTradingViewSnapshot() {
  const tickers = Object.values(SYMBOLS).map((item) => item.tvSymbol);

  const response = await fetch("https://scanner.tradingview.com/global/scan", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 TradingNotes/1.0"
    },
    body: JSON.stringify({
      symbols: {
        tickers,
        query: {
          types: []
        }
      },
      columns: [
        "close",
        "change_abs",
        "change"
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`TradingView response: HTTP ${response.status}`);
  }

  return await response.json();
}

function normalizeTradingViewData(snapshot) {
  const bySymbol = new Map();

  if (Array.isArray(snapshot?.data)) {
    snapshot.data.forEach((row) => {
      bySymbol.set(row.s, {
        close: row.d?.[0],
        changeAbs: row.d?.[1],
        changePercent: row.d?.[2]
      });
    });
  }

  const now = formatDateTimeRu();
  const items = {};

  for (const [id, config] of Object.entries(SYMBOLS)) {
    const raw = bySymbol.get(config.tvSymbol);

    items[id] = {
      value: formatValue(raw?.close, config.type),
      change: formatChange(raw?.changeAbs, config.type),
      asOf: now,
      state: getState(raw?.changeAbs)
    };
  }

  const us10y = toNumber(bySymbol.get("TVC:US10Y")?.close);
  const us02y = toNumber(bySymbol.get("TVC:US02Y")?.close);
  const us10yChange = toNumber(bySymbol.get("TVC:US10Y")?.changeAbs);
  const us02yChange = toNumber(bySymbol.get("TVC:US02Y")?.changeAbs);

  if (us10y !== null && us02y !== null) {
    const curveBp = (us10y - us02y) * 100;
    const curveChangeBp =
      us10yChange !== null && us02yChange !== null
        ? (us10yChange - us02yChange) * 100
        : null;

    items.yieldcurve = {
      value: `${curveBp.toFixed(0)} б.п.`,
      change: formatChange(curveChangeBp, "basisPoints"),
      asOf: now,
      state: getState(curveChangeBp)
    };
  } else {
    items.yieldcurve = {
      value: "—",
      change: "Нет данных",
      asOf: now,
      state: "neutral"
    };
  }

  return {
    updatedAt: now,
    items
  };
}

async function main() {
  try {
    const snapshot = await fetchTradingViewSnapshot();
    const liveData = normalizeTradingViewData(snapshot);

    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(liveData, null, 2), "utf8");

    console.log(`Готово: ${OUTPUT_FILE}`);
    console.log(`Обновлено: ${liveData.updatedAt}`);
  } catch (error) {
    console.error("Не удалось обновить данные ставок:", error);
    process.exitCode = 1;
  }
}

main();