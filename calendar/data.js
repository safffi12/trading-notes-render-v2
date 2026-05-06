console.log("data.js подключился v8-tradingview-commodities");

const marketContent = document.getElementById("marketContent");
const refreshButton = document.getElementById("refreshButton");
const dataNote = document.getElementById("dataNote");

/* =========================
   Instruments
========================= */

const forexInstruments = [
  {
    symbol: "EUR/USD",
    name: "Euro / US Dollar",
    category: "Forex",
    decimals: 5
  },
  {
    symbol: "GBP/USD",
    name: "British Pound / US Dollar",
    category: "Forex",
    decimals: 5
  },
  {
    symbol: "AUD/CAD",
    name: "Australian Dollar / Canadian Dollar",
    category: "Forex",
    decimals: 5
  }
];

const commodityInstruments = [
  {
    symbol: "BRENT",
    name: "Brent Crude Oil",
    tradingViewSymbol: "TVC:UKOIL",
    category: "Commodity"
  },
  {
    symbol: "WTI",
    name: "WTI Crude Oil",
    tradingViewSymbol: "TVC:USOIL",
    category: "Commodity"
  },
  {
    symbol: "XAU/USD",
    name: "Gold",
    tradingViewSymbol: "TVC:GOLD",
    category: "Metals"
  },
  {
    symbol: "XAG/USD",
    name: "Silver",
    tradingViewSymbol: "TVC:SILVER",
    category: "Metals"
  },
  {
    symbol: "COPPER",
    name: "Copper",
    tradingViewSymbol: "COMEX:HG1!",
    category: "Metals"
  },
  {
    symbol: "NATGAS",
    name: "Natural Gas",
    tradingViewSymbol: "NYMEX:NG1!",
    category: "Commodity"
  }
];

const cryptoInstruments = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    category: "Crypto"
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    category: "Crypto"
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    category: "Crypto"
  },
  {
    id: "binancecoin",
    symbol: "BNB",
    name: "BNB",
    category: "Crypto"
  },
  {
    id: "cardano",
    symbol: "ADA",
    name: "Cardano",
    category: "Crypto"
  },
  {
    id: "ripple",
    symbol: "XRP",
    name: "XRP",
    category: "Crypto"
  }
];

const categories = [
  {
    id: "forex",
    title: "Forex",
    subtitle: "Основные валютные пары"
  },
  {
    id: "commodities",
    title: "Сырье и металлы",
    subtitle: "Brent, WTI, золото, серебро, медь и природный газ"
  },
  {
    id: "crypto",
    title: "Криптовалюты",
    subtitle: "BTC, ETH, SOL, BNB, ADA и XRP"
  }
];

/* =========================
   Main loading
========================= */

async function loadMarketData() {
  if (!marketContent || !refreshButton || !dataNote) {
    console.error("На странице не найдены marketContent, refreshButton или dataNote");
    return;
  }

  renderBaseLayout();

  refreshButton.disabled = true;
  refreshButton.textContent = "Загрузка...";

  dataNote.textContent =
    "Данные загружаются отдельно по категориям. Сырье и металлы отображаются через TradingView-виджеты.";

  const tasks = [
    loadCategory({
      categoryId: "forex",
      loader: loadForexData
    }),
    loadCategory({
      categoryId: "commodities",
      loader: loadCommoditiesData
    }),
    loadCategory({
      categoryId: "crypto",
      loader: loadCryptoData
    })
  ];

  await Promise.allSettled(tasks);

  refreshButton.disabled = false;
  refreshButton.textContent = "Обновить";

  dataNote.textContent =
    "Источники данных: ExchangeRate API / Frankfurter для Forex, TradingView для сырья и металлов, CoinGecko API для криптовалют.";
}

async function loadCategory({ categoryId, loader }) {
  try {
    const items = await loader();

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Источник вернул пустой список");
    }

    renderCategoryCards(categoryId, items);
  } catch (error) {
    console.error(`Ошибка в категории ${categoryId}:`, error);
    renderCategoryError(categoryId, error.message);
  }
}

/* =========================
   Base layout
========================= */

function renderBaseLayout() {
  marketContent.innerHTML = "";

  categories.forEach((category) => {
    const categoryBlock = document.createElement("section");
    categoryBlock.className = "market-category-block";
    categoryBlock.id = `category-${category.id}`;

    categoryBlock.innerHTML = `
      <header class="market-category-heading">
        <h2>${escapeHtml(category.title)}</h2>
        <p>${escapeHtml(category.subtitle)}</p>
      </header>

      <div class="market-grid" id="grid-${category.id}">
        <article class="market-card skeleton-card">
          <p class="loading-text">Загружаем данные...</p>
        </article>
      </div>
    `;

    marketContent.appendChild(categoryBlock);
  });
}

function renderCategoryCards(categoryId, items) {
  const grid = document.getElementById(`grid-${categoryId}`);

  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  items.forEach((item) => {
    grid.appendChild(createMarketCard(item));
  });
}

function renderCategoryError(categoryId, message) {
  const grid = document.getElementById(`grid-${categoryId}`);

  if (!grid) {
    return;
  }

  grid.innerHTML = `
    <article class="market-card error-card">
      <h3>Данные не загрузились</h3>
      <p>Источник временно не отвечает или запрос не прошел.</p>
      <p class="loading-text">Причина: ${escapeHtml(message || "неизвестная ошибка")}</p>
    </article>
  `;
}

/* =========================
   Cards
========================= */

function createMarketCard(item) {
  if (item.type === "tradingview-widget") {
    return createTradingViewCommodityCard(item);
  }

  const card = document.createElement("article");
  card.className = "market-card";

  const metrics = Array.isArray(item.metrics) ? item.metrics : [];

  const metricsHtml = metrics
    .map((metric) => {
      return `
        <div class="market-meta-row">
          <span>${escapeHtml(metric.label)}</span>
          <strong class="${escapeHtml(metric.tone || "")}">${escapeHtml(metric.value)}</strong>
        </div>
      `;
    })
    .join("");

  card.innerHTML = `
    <div class="market-card-header">
      <div>
        <div class="market-symbol">${escapeHtml(item.symbol)}</div>
        <div class="market-name">${escapeHtml(item.name)}</div>
      </div>

      <span class="market-category">${escapeHtml(item.category)}</span>
    </div>

    <div class="market-price">
      ${escapeHtml(item.price)}
    </div>

    <div class="market-meta">
      ${metricsHtml}
    </div>
  `;

  return card;
}

function createTradingViewCommodityCard(item) {
  const card = document.createElement("article");
  card.className = "market-card market-widget-card";

  card.innerHTML = `
    <div class="market-card-header">
      <div>
        <div class="market-symbol">${escapeHtml(item.symbol)}</div>
        <div class="market-name">${escapeHtml(item.name)}</div>
      </div>

      <span class="market-category">${escapeHtml(item.category)}</span>
    </div>

    <div class="tv-mini-widget">
      <div class="tradingview-widget-container">
        <div class="tradingview-widget-container__widget"></div>
      </div>
    </div>

    <div class="market-meta market-widget-meta">
      <div class="market-meta-row">
        <span>Источник</span>
        <strong>TradingView</strong>
      </div>

      <div class="market-meta-row">
        <span>Тикер</span>
        <strong>${escapeHtml(item.tradingViewSymbol)}</strong>
      </div>
    </div>
  `;

  const container = card.querySelector(".tradingview-widget-container");

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
  script.async = true;

  script.textContent = JSON.stringify({
    symbol: item.tradingViewSymbol,
    width: "100%",
    height: 220,
    locale: "en",
    dateRange: "1D",
    colorTheme: "light",
    isTransparent: true,
    autosize: false,
    largeChartUrl: ""
  });

  container.appendChild(script);

  return card;
}

/* =========================
   Forex
========================= */

async function loadForexData() {
  const results = await Promise.allSettled(
    forexInstruments.map((instrument) => loadSingleForexInstrument(instrument))
  );

  const successfulItems = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  if (successfulItems.length === 0) {
    throw new Error("Forex-источники не отдали данные");
  }

  return successfulItems;
}

async function loadSingleForexInstrument(instrument) {
  try {
    return await loadForexFromExchangeRateApi(instrument);
  } catch (error) {
    console.warn(`ExchangeRate API не сработал для ${instrument.symbol}:`, error);
    return await loadForexFromFrankfurter(instrument);
  }
}

async function loadForexFromExchangeRateApi(instrument) {
  const [baseCurrency, quoteCurrency] = instrument.symbol.split("/");

  if (!baseCurrency || !quoteCurrency) {
    throw new Error(`Некорректный символ Forex: ${instrument.symbol}`);
  }

  const url = `https://open.er-api.com/v6/latest/${baseCurrency}`;
  const data = await fetchJson(url, 10000);

  if (data.result !== "success") {
    throw new Error(`Ошибка ExchangeRate API по ${instrument.symbol}`);
  }

  const price = data.rates?.[quoteCurrency];

  if (price === null || price === undefined) {
    throw new Error(`Нет курса ${instrument.symbol}`);
  }

  return {
    symbol: instrument.symbol,
    name: instrument.name,
    category: instrument.category,
    price: formatMarketPrice(price, instrument.decimals),
    metrics: [
      {
        label: "Базовая валюта",
        value: baseCurrency
      },
      {
        label: "Валюта котировки",
        value: quoteCurrency
      },
      {
        label: "Обновлено",
        value: formatUnixTime(data.time_last_update_unix)
      },
      {
        label: "Источник",
        value: "ExchangeRate API"
      }
    ]
  };
}

async function loadForexFromFrankfurter(instrument) {
  const [baseCurrency, quoteCurrency] = instrument.symbol.split("/");

  if (!baseCurrency || !quoteCurrency) {
    throw new Error(`Некорректный символ Forex: ${instrument.symbol}`);
  }

  const url =
    `https://api.frankfurter.app/latest` +
    `?from=${encodeURIComponent(baseCurrency)}` +
    `&to=${encodeURIComponent(quoteCurrency)}`;

  const data = await fetchJson(url, 10000);
  const price = data.rates?.[quoteCurrency];

  if (price === null || price === undefined) {
    throw new Error(`Нет курса ${instrument.symbol}`);
  }

  return {
    symbol: instrument.symbol,
    name: instrument.name,
    category: instrument.category,
    price: formatMarketPrice(price, instrument.decimals),
    metrics: [
      {
        label: "Базовая валюта",
        value: baseCurrency
      },
      {
        label: "Валюта котировки",
        value: quoteCurrency
      },
      {
        label: "Обновлено",
        value: data.date || "н/д"
      },
      {
        label: "Источник",
        value: "Frankfurter"
      }
    ]
  };
}

/* =========================
   Commodities / TradingView
========================= */

async function loadCommoditiesData() {
  return commodityInstruments.map((instrument) => {
    return {
      type: "tradingview-widget",
      symbol: instrument.symbol,
      name: instrument.name,
      category: instrument.category,
      tradingViewSymbol: instrument.tradingViewSymbol
    };
  });
}

/* =========================
   Crypto
========================= */

async function loadCryptoData() {
  const ids = cryptoInstruments.map((instrument) => instrument.id).join(",");

  const url =
    `https://api.coingecko.com/api/v3/simple/price` +
    `?ids=${encodeURIComponent(ids)}` +
    `&vs_currencies=usd` +
    `&include_market_cap=true` +
    `&include_24hr_vol=true` +
    `&include_24hr_change=true` +
    `&include_last_updated_at=true`;

  const data = await fetchJson(url, 12000);

  const items = cryptoInstruments
    .map((instrument) => {
      const item = data[instrument.id];

      if (!item || item.usd === undefined) {
        return null;
      }

      const change = item.usd_24h_change;

      return {
        symbol: instrument.symbol,
        name: instrument.name,
        category: instrument.category,
        price: `$${formatCryptoPrice(item.usd)}`,
        metrics: [
          {
            label: "Изм. 24ч",
            value: formatSignedPercent(change),
            tone: getTone(change)
          },
          {
            label: "Капитализация",
            value: `$${formatCompact(item.usd_market_cap)}`
          },
          {
            label: "Объем 24ч",
            value: `$${formatCompact(item.usd_24h_vol)}`
          },
          {
            label: "Источник",
            value: "CoinGecko"
          }
        ]
      };
    })
    .filter(Boolean);

  if (items.length === 0) {
    throw new Error("CoinGecko не отдал данные по криптовалютам");
  }

  return items;
}

/* =========================
   Fetch helpers
========================= */

async function fetchJson(url, timeoutMs = 12000) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Превышено время ожидания запроса");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/* =========================
   Format helpers
========================= */

function formatCryptoPrice(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "н/д";
  }

  if (value >= 1000) {
    return Number(value).toLocaleString("en-US", {
      maximumFractionDigits: 0
    });
  }

  if (value >= 1) {
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6
  });
}

function formatMarketPrice(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "н/д";
  }

  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatSignedPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "н/д";
  }

  const sign = value >= 0 ? "+" : "";

  return `${sign}${Number(value).toFixed(2)}%`;
}

function formatCompact(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "н/д";
  }

  return Number(value).toLocaleString("en-US", {
    notation: "compact",
    maximumFractionDigits: 2
  });
}

function formatUnixTime(unixTime) {
  if (!unixTime) {
    return "н/д";
  }

  const date = new Date(unixTime * 1000);

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getTone(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "";
  }

  return value >= 0 ? "positive" : "negative";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   Init
========================= */

if (refreshButton) {
  refreshButton.addEventListener("click", loadMarketData);
}

loadMarketData();