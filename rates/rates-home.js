const ratesRoot = document.getElementById("ratesRoot");

const RATE_META = {
  fed: {
    title: "Fed Funds Rate",
    label: "ФРС",
    type: "Ключевая ставка",
    href: "rates/fed.html",
    group: "centralBanks",
    shortDescription: "Базовая ставка США, через которую ФРС задает стоимость краткосрочного доллара.",
    marketMeaning: "Главный ориентир для доллара, Treasuries, золота, акций и общей стоимости глобальной ликвидности.",
    readSignal: "Жесткая ФРС обычно поддерживает доллар и доходности. Мягкая ФРС чаще поддерживает risk-on."
  },

  ecb: {
    title: "ECB Deposit Rate",
    label: "ЕЦБ",
    type: "Ключевая ставка",
    href: "rates/ecb.html",
    group: "centralBanks",
    shortDescription: "Депозитная ставка ЕЦБ показывает цену краткосрочной ликвидности в еврозоне.",
    marketMeaning: "Важна для EUR/USD, европейских облигаций, банковского сектора и спреда ставок США-Европа.",
    readSignal: "Рост ожиданий по ставке ЕЦБ обычно поддерживает евро. Смягчение политики ослабляет процентную опору EUR."
  },

  boe: {
    title: "Bank Rate",
    label: "BoE",
    type: "Ключевая ставка",
    href: "rates/boe.html",
    group: "centralBanks",
    shortDescription: "Ключевая ставка Банка Англии отражает стоимость фунтовой ликвидности.",
    marketMeaning: "Влияет на GBP/USD, Gilts, британские акции и ожидания по инфляции в Великобритании.",
    readSignal: "Жесткая позиция BoE поддерживает фунт через ставочный дифференциал. Мягкая позиция снижает привлекательность GBP."
  },

  boj: {
    title: "Policy Rate",
    label: "BoJ",
    type: "Ключевая ставка",
    href: "rates/boj.html",
    group: "centralBanks",
    shortDescription: "Ставка Банка Японии задает базовую цену иены и японской ликвидности.",
    marketMeaning: "Критична для USD/JPY, carry trade, японских облигаций и глобального risk sentiment.",
    readSignal: "Ужесточение BoJ обычно поддерживает JPY и может давить на carry trade. Мягкая политика поддерживает слабую иену."
  },

  us02y: {
    title: "US 2Y Yield",
    label: "2Y",
    type: "Краткий конец кривой",
    href: "rates/us02y.html",
    group: "treasuries",
    shortDescription: "Доходность двухлетних Treasuries отражает ожидания рынка по политике ФРС.",
    marketMeaning: "Один из самых чувствительных инструментов к CPI, NFP, FOMC и риторике ФРС.",
    readSignal: "Рост 2Y обычно означает более жесткие ожидания по ставкам. Падение 2Y - ожидания смягчения."
  },

  us10y: {
    title: "US 10Y Yield",
    label: "10Y",
    type: "Бенчмарк доходности",
    href: "rates/us10y.html",
    group: "treasuries",
    shortDescription: "Доходность десятилетних Treasuries - главный ориентир долгосрочной стоимости денег.",
    marketMeaning: "Влияет на акции роста, ипотечные ставки, золото, доллар и глобальные мультипликаторы риска.",
    readSignal: "Рост 10Y часто давит на золото и growth stocks. Падение 10Y обычно облегчает финансовые условия."
  },

  us30y: {
    title: "US 30Y Yield",
    label: "30Y",
    type: "Дальний конец кривой",
    href: "rates/us30y.html",
    group: "treasuries",
    shortDescription: "Доходность тридцатилетних Treasuries отражает долгосрочные ожидания по инфляции, долгу и премии за срок.",
    marketMeaning: "Важна для оценки доверия к долговой устойчивости США и долгосрочной инфляционной премии.",
    readSignal: "Рост 30Y может указывать на давление со стороны инфляции, дефицита бюджета или слабого спроса на длинный долг."
  },

  yieldcurve: {
    title: "US 10Y-2Y Spread",
    label: "Кривая",
    type: "Спред доходностей",
    href: "rates/yield-curve.html",
    group: "treasuries",
    shortDescription: "Разница между доходностью 10-летних и 2-летних Treasuries показывает форму кривой ставок.",
    marketMeaning: "Используется как индикатор ожиданий по циклу ФРС, рецессионным рискам и будущему смягчению политики.",
    readSignal: "Инверсия часто указывает на жесткую политику и риск замедления. Нормализация может идти через ожидания снижения ставок."
  },

  dxy: {
    title: "DXY",
    label: "USD",
    type: "Индекс доллара",
    href: "rates/dxy.html",
    group: "dollar",
    shortDescription: "DXY показывает силу доллара против корзины основных валют.",
    marketMeaning: "Важен для FX, сырья, золота, EM-активов и глобальных долларовых условий.",
    readSignal: "Рост DXY часто означает спрос на доллар, ужесточение финансовых условий или risk-off."
  },

  realyield: {
    title: "US Real Yield",
    label: "Real",
    type: "Реальная доходность",
    href: "rates/real-yield.html",
    group: "dollar",
    shortDescription: "Реальная доходность показывает доходность Treasuries после учета инфляционных ожиданий.",
    marketMeaning: "Один из ключевых факторов для золота, Nasdaq, доллара и оценки стоимости капитала.",
    readSignal: "Рост real yield обычно негативен для золота и risk assets. Снижение real yield поддерживает активы без доходности."
  },

  dollarfunding: {
    title: "Dollar Funding",
    label: "Funding",
    type: "Стоимость доллара",
    href: "rates/dollar-funding.html",
    group: "dollar",
    shortDescription: "Показатель отражает стоимость краткосрочного долларового фондирования.",
    marketMeaning: "Важен для банков, фондов, carry trade и оценки напряжения в долларовой ликвидности.",
    readSignal: "Рост стоимости фондирования может быть признаком дефицита долларовой ликвидности и усиления risk-off."
  },

  move: {
    title: "MOVE Index",
    label: "MOVE",
    type: "Волатильность облигаций",
    href: "rates/move.html",
    group: "dollar",
    shortDescription: "MOVE измеряет ожидаемую волатильность рынка US Treasuries.",
    marketMeaning: "Высокий MOVE означает нестабильность в ставках, что часто ухудшает аппетит к риску.",
    readSignal: "Рост MOVE обычно усиливает осторожность на рынке. Снижение MOVE делает среду комфортнее для risk-on."
  }
};

const RATE_GROUPS = [
  {
    id: "centralBanks",
    kicker: "Central Banks",
    title: "Ключевые ставки центральных банков",
    text: "Базовый слой денежной политики. Эти ставки задают стоимость ликвидности и формируют ожидания по валютам, облигациям и риск-активам."
  },
  {
    id: "treasuries",
    kicker: "US Treasuries",
    title: "Доходности и кривая США",
    text: "Доходности Treasuries показывают, как рынок оценивает инфляцию, политику ФРС, рецессионные риски и премию за срок."
  },
  {
    id: "dollar",
    kicker: "Dollar Conditions",
    title: "Доллар и стоимость фондирования",
    text: "Этот блок показывает силу доллара, реальные ставки и напряжение в долларовой ликвидности."
  },
];

function safeText(value, fallback = "—") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function getChangeClass(state) {
  if (state === "up") {
    return "rates-change-up";
  }

  if (state === "down") {
    return "rates-change-down";
  }

  return "rates-change-neutral";
}

async function loadRatesLiveData() {
  try {
    const response = await fetch(`rates/rates-live-data.json?v=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Файл rates-live-data.json не найден. Статус: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Не удалось загрузить rates-live-data.json", error);

    return {
      updatedAt: "Данные временно недоступны",
      items: {}
    };
  }
}

function renderRateCard(id, liveItems) {
  const meta = RATE_META[id];
  const live = liveItems[id] || {};

  const value = safeText(live.value);
  const change = safeText(live.change, "Без изменений");
  const asOf = safeText(live.asOf, "Нет времени обновления");
  const changeClass = getChangeClass(live.state);

  return `
    <a class="rates-card" href="${meta.href}">
      <div class="rates-card-header">
        <div class="rates-card-heading">
          <span class="rates-pill">${meta.label}</span>
          <h3 class="rates-card-title">${meta.title}</h3>
        </div>

        <span class="rates-card-type">${meta.type}</span>
      </div>

      <div class="rates-value-box">
        <div class="rates-value">${value}</div>
        <div class="rates-change ${changeClass}">${change}</div>
        <div class="rates-asof">${asOf}</div>
      </div>

      <div class="rates-card-description">
        <div>
          <strong>Что показывает</strong>
          <p>${meta.shortDescription}</p>
        </div>

        <div>
          <strong>Рыночное значение</strong>
          <p>${meta.marketMeaning}</p>
        </div>

        <div>
          <strong>Как читать</strong>
          <p>${meta.readSignal}</p>
        </div>
      </div>

      <span class="rates-link">Открыть карточку →</span>
    </a>
  `;
}

function renderRatesPage(data) {
  const liveItems = data.items || {};
  const updatedAt = safeText(data.updatedAt, "Нет данных об обновлении");

  const sections = RATE_GROUPS.map((group) => {
    const cards = Object.keys(RATE_META)
      .filter((id) => RATE_META[id].group === group.id)
      .map((id) => renderRateCard(id, liveItems))
      .join("");

    return `
      <section class="rates-section">
        <header class="rates-section-header">
          <p class="rates-section-kicker">${group.kicker}</p>
          <h2 class="rates-section-title">${group.title}</h2>
          <p class="rates-section-text">${group.text}</p>
        </header>

        <div class="rates-grid">
          ${cards}
        </div>
      </section>
    `;
  }).join("");

  ratesRoot.innerHTML = `
    <section class="rates-hero">
      <p class="rates-eyebrow">Rates Dashboard</p>
      <h1 class="rates-title">Ставки, доходности и долларовая ликвидность</h1>
      <p class="rates-description">
        Раздел собирает ключевые процентные ориентиры: ставки центральных банков, доходности Treasuries,
        кривую США, индекс доллара, реальные ставки и волатильность облигационного рынка.
      </p>

      <div class="rates-updated">Обновлено: ${updatedAt}</div>
    </section>

    ${sections}

    <a href="index.html" class="page-back">← Назад на главную</a>
  `;
}

async function initRatesPage() {
  if (!ratesRoot) {
    return;
  }

  ratesRoot.innerHTML = `
    <section class="rates-hero">
      <p class="rates-eyebrow">Rates Dashboard</p>
      <h1 class="rates-title">Загружаем данные ставок...</h1>
      <p class="rates-description">Если данные не появятся, проверь файл rates/rates-live-data.json.</p>
    </section>
  `;

  const data = await loadRatesLiveData();
  renderRatesPage(data);
}

initRatesPage();