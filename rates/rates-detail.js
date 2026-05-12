const rateDetailRoot = document.getElementById("rateDetail");
const currentRateId = document.body.dataset.rateId;

const RATE_DETAILS = {
  fed: {
    title: "Fed Funds Rate",
    label: "ФРС",
    type: "Ключевая ставка США",
    source: "Federal Reserve / FRED",
    backHref: "../rates.html",
    definition: "Fed Funds Rate - базовая ставка денежного рынка США. Через нее ФРС задает стоимость краткосрочной долларовой ликвидности и управляет финансовыми условиями.",
    why: "Это главный якорь для всей долларовой кривой: краткосрочных Treasuries, ставок фондирования, кредитных условий, валютного рынка и оценки риск-активов.",
    howToRead: "Если рынок закладывает более высокую траекторию ставки, доллар и краткосрочные доходности обычно получают поддержку. Если ожидания смещаются к снижению ставки, финансовые условия смягчаются.",
    watch: [
      "Решения FOMC и dot plot.",
      "Риторику Пауэлла и членов ФРС.",
      "CPI, PCE, NFP и данные по рынку труда.",
      "Реакцию 2Y Treasuries - она быстрее всего отражает ожидания по ФРС."
    ],
    marketImpact: [
      "USD: жесткая ФРС обычно поддерживает доллар.",
      "Gold: рост реальных ставок часто давит на золото.",
      "Equities: высокая ставка ухудшает оценку growth-сегмента.",
      "Bonds: ожидания по ставке напрямую двигают короткий конец кривой."
    ]
  },

  ecb: {
    title: "ECB Deposit Rate",
    label: "ЕЦБ",
    type: "Ключевая ставка еврозоны",
    source: "European Central Bank / FRED",
    backHref: "../rates.html",
    definition: "Deposit Rate - ставка, под которую банки размещают избыточную ликвидность в ЕЦБ. Это главный практический ориентир денежной политики еврозоны.",
    why: "Показатель влияет на EUR/USD, европейские облигации, банковский сектор и разницу в ставках между США и еврозоной.",
    howToRead: "Если ЕЦБ звучит жестче ФРС, евро получает ставочную поддержку. Если ЕЦБ быстрее смягчает политику, процентное преимущество уходит в пользу доллара.",
    watch: [
      "Решения Governing Council.",
      "Инфляцию HICP и базовую инфляцию еврозоны.",
      "PMI, кредитную активность и слабость промышленности.",
      "Спред доходностей Germany-US."
    ],
    marketImpact: [
      "EUR/USD: ставка ЕЦБ влияет через дифференциал с ФРС.",
      "European bonds: ожидания смягчения поддерживают облигации.",
      "Banks: высокая ставка может поддерживать процентную маржу банков.",
      "Equities: слишком жесткая политика давит на циклические активы."
    ]
  },

  boe: {
    title: "Bank Rate",
    label: "BoE",
    type: "Ключевая ставка Великобритании",
    source: "Bank of England",
    backHref: "../rates.html",
    definition: "Bank Rate - ключевая ставка Банка Англии, через которую задается стоимость фунтовой ликвидности.",
    why: "Ставка важна для GBP/USD, британских облигаций, ипотечного рынка и оценки инфляционного давления в Великобритании.",
    howToRead: "Жесткая позиция BoE поддерживает фунт, если рынок верит в устойчивость экономики. Смягчение политики снижает ставочную поддержку GBP.",
    watch: [
      "Голосование членов MPC.",
      "CPI, wage growth и рынок труда.",
      "Данные по потреблению и недвижимости.",
      "Спред UK-US доходностей."
    ],
    marketImpact: [
      "GBP/USD: чувствителен к изменению ожиданий по BoE.",
      "Gilts: снижение ожидаемой ставки поддерживает цены облигаций.",
      "FTSE: слабый фунт может помогать экспортерам.",
      "Housing: высокая ставка давит на ипотеку и потребление."
    ]
  },

  boj: {
    title: "Policy Rate",
    label: "BoJ",
    type: "Ключевая ставка Японии",
    source: "FRED / OECD proxy",
    backHref: "../rates.html",
    definition: "Policy Rate Банка Японии показывает базовую цену иены и краткосрочной ликвидности в Японии. В автоматическом блоке используется близкий рыночный прокси по overnight/call money rate, потому что официальный ряд BoJ сложнее подключать напрямую.",
    why: "BoJ важен не только для JPY, но и для глобального carry trade. Дешевая иена часто используется как валюта фондирования.",
    howToRead: "Ужесточение BoJ поддерживает иену и может снижать интерес к carry trade. Мягкая политика обычно сохраняет давление на JPY.",
    watch: [
      "Решения BoJ и комментарии по нормализации политики.",
      "Японскую инфляцию и рост зарплат.",
      "JGB yields и интервенционные риски.",
      "Движение USD/JPY после заседаний."
    ],
    marketImpact: [
      "JPY: ужесточение BoJ обычно поддерживает иену.",
      "Carry trade: рост японских ставок снижает привлекательность заемной иены.",
      "Global risk: резкое укрепление JPY может вызвать deleveraging.",
      "Bonds: важна реакция рынка JGB."
    ]
  },

  us02y: {
    title: "US 2Y Yield",
    label: "2Y",
    type: "Краткий конец кривой США",
    source: "FRED / H.15 Selected Interest Rates",
    backHref: "../rates.html",
    definition: "Доходность 2-летних Treasuries - рыночный индикатор ожиданий по ставке ФРС на ближайшие несколько лет.",
    why: "2Y сильнее всего реагирует на CPI, NFP, FOMC и изменение ожиданий по траектории Fed Funds Rate.",
    howToRead: "Рост 2Y означает, что рынок закладывает более жесткую политику. Падение 2Y означает ожидание снижения ставки или ухудшения экономики.",
    watch: [
      "CPI, Core PCE и NFP.",
      "Fed speakers и FOMC minutes.",
      "Вероятности по FedWatch.",
      "Дивергенцию между 2Y и DXY."
    ],
    marketImpact: [
      "USD: рост 2Y часто поддерживает доллар.",
      "Gold: рост кратких реальных ставок негативен для золота.",
      "Equities: высокие краткие ставки ухудшают risk appetite.",
      "Curve: 2Y участвует в инверсии 10Y-2Y."
    ]
  },

  us10y: {
    title: "US 10Y Yield",
    label: "10Y",
    type: "Бенчмарк долгосрочных ставок",
    source: "FRED / H.15 Selected Interest Rates",
    backHref: "../rates.html",
    definition: "Доходность 10-летних Treasuries - глобальный ориентир долгосрочной стоимости капитала.",
    why: "10Y влияет на ипотеку, корпоративные ставки, оценку акций, золото, доллар и глобальные мультипликаторы риска.",
    howToRead: "Рост 10Y ужесточает финансовые условия. Падение 10Y обычно поддерживает облигации, золото и акции роста, если оно не связано с рецессионным страхом.",
    watch: [
      "Инфляционные ожидания.",
      "Дефицит бюджета США и объем размещений Treasuries.",
      "Спрос на аукционах.",
      "Связку 10Y + real yield + gold."
    ],
    marketImpact: [
      "Nasdaq: чувствителен к росту 10Y.",
      "Gold: часто негативно реагирует на рост реальных доходностей.",
      "USD: рост доходности может поддерживать доллар.",
      "Credit: высокая 10Y повышает стоимость долга."
    ]
  },

  us30y: {
    title: "US 30Y Yield",
    label: "30Y",
    type: "Дальний конец кривой США",
    source: "FRED / H.15 Selected Interest Rates",
    backHref: "../rates.html",
    definition: "Доходность 30-летних Treasuries отражает долгосрочную премию за срок, инфляционные риски и доверие к фискальной устойчивости США.",
    why: "30Y важна для пенсионных фондов, страховых компаний, ипотечного рынка и оценки долгосрочной долговой нагрузки.",
    howToRead: "Рост 30Y может говорить о росте term premium, инфляционных рисках или слабом спросе на длинный долг.",
    watch: [
      "Аукционы 30Y Treasuries.",
      "Term premium.",
      "Фискальные новости и дефицит бюджета США.",
      "Steepening или flattening кривой."
    ],
    marketImpact: [
      "Long bonds: рост 30Y давит на цены длинных облигаций.",
      "Mortgage: влияет на долгосрочные ставки.",
      "Equities: высокая дальняя ставка снижает мультипликаторы.",
      "Curve: важна для оценки bear steepening."
    ]
  },

  yieldcurve: {
    title: "US 10Y-2Y Spread",
    label: "Curve",
    type: "Кривая доходности США",
    source: "Расчет: FRED DGS10 - DGS2",
    backHref: "../rates.html",
    definition: "Спред 10Y-2Y показывает разницу между долгосрочной и краткосрочной доходностью Treasuries.",
    why: "Форма кривой помогает оценивать стадию цикла: жесткость политики, рецессионные риски и ожидания будущего снижения ставки.",
    howToRead: "Инверсия означает, что краткие ставки выше длинных. Это часто возникает, когда ФРС держит политику жесткой, а рынок ждет замедления экономики.",
    watch: [
      "Глубину инверсии.",
      "Скорость нормализации кривой.",
      "Что двигает спред: 2Y или 10Y.",
      "Контекст: recession fear или мягкая посадка."
    ],
    marketImpact: [
      "Banks: инверсия ухудшает классическую маржу банков.",
      "USD: зависит от того, падает ли 2Y или растет 10Y.",
      "Equities: резкая нормализация через падение 2Y может быть тревожным сигналом.",
      "Bonds: спред помогает понять режим кривой."
    ]
  },

  dxy: {
    title: "DXY",
    label: "USD",
    type: "Индекс доллара",
    source: "Stooq",
    backHref: "../rates.html",
    definition: "DXY измеряет силу доллара США против корзины основных валют.",
    why: "Доллар - центральная валюта глобальной ликвидности. Его рост часто ужесточает условия для сырья, EM-рынков и риск-активов.",
    howToRead: "Рост DXY может означать спрос на доллар, преимущество ставок США или risk-off. Падение DXY часто поддерживает commodities и risk-on.",
    watch: [
      "Связку DXY с US 2Y и US 10Y.",
      "EUR/USD, так как евро имеет большой вес в DXY.",
      "Risk sentiment на акциях.",
      "Золото и сырьевые валюты."
    ],
    marketImpact: [
      "FX: DXY задает общий долларовый фон.",
      "Gold: сильный доллар часто давит на золото.",
      "Oil/commodities: рост USD может ограничивать рост сырья.",
      "EM: сильный доллар ухудшает внешние условия."
    ]
  },

  realyield: {
    title: "US Real Yield",
    label: "Real",
    type: "Реальная доходность",
    source: "FRED / H.15 TIPS real yield",
    backHref: "../rates.html",
    definition: "Реальная доходность показывает номинальную доходность Treasuries за вычетом инфляционных ожиданий.",
    why: "Это один из главных индикаторов реальной стоимости денег. Он особенно важен для золота, Nasdaq и доллара.",
    howToRead: "Рост real yield делает деньги дороже в реальном выражении. Это обычно негативно для золота и активов с длинной дюрацией.",
    watch: [
      "Связку real yield и gold.",
      "Инфляционные ожидания breakeven.",
      "Движение 10Y TIPS.",
      "Реакцию Nasdaq на рост реальных ставок."
    ],
    marketImpact: [
      "Gold: чаще страдает от роста real yield.",
      "Growth stocks: высокая реальная ставка снижает текущую стоимость будущих cash flows.",
      "USD: рост real yield может поддерживать доллар.",
      "Bonds: отражает реальную цену капитала."
    ]
  },

  dollarfunding: {
    title: "Dollar Funding",
    label: "Funding",
    type: "Долларовое фондирование",
    source: "FRED / New York Fed SOFR",
    backHref: "../rates.html",
    definition: "Dollar Funding отражает стоимость краткосрочного доступа к долларовой ликвидности. В этой карточке используется SOFR как основной ориентир стоимости обеспеченного overnight-фондирования в долларах.",
    why: "Когда долларовое фондирование дорожает, финансовая система может испытывать напряжение. Это важно для банков, фондов и глобального carry trade.",
    howToRead: "Рост стоимости фондирования может указывать на дефицит долларовой ликвидности. Снижение означает более спокойные условия.",
    watch: [
      "SOFR и краткосрочные денежные ставки.",
      "Стресс в банковском секторе.",
      "Спрос на доллар в периоды risk-off.",
      "Расхождение фондирования с обычными ставочными ожиданиями."
    ],
    marketImpact: [
      "USD: дефицит фондирования может поддерживать доллар.",
      "Credit: высокая стоимость денег давит на кредит.",
      "Equities: funding stress ухудшает risk appetite.",
      "FX swaps: чувствительны к долларовой ликвидности."
    ]
  },

  move: {
    title: "MOVE Index",
    label: "MOVE",
    type: "Волатильность облигаций",
    source: "Yahoo Finance",
    backHref: "../rates.html",
    definition: "MOVE Index измеряет ожидаемую волатильность рынка US Treasuries.",
    why: "Когда рынок ставок нестабилен, инвесторы хуже оценивают стоимость капитала. Это часто снижает аппетит к риску.",
    howToRead: "Рост MOVE означает стресс или неопределенность в облигациях. Снижение MOVE делает среду стабильнее для risk assets.",
    watch: [
      "Резкие движения 2Y и 10Y.",
      "FOMC, CPI и payrolls.",
      "Связку MOVE с VIX.",
      "Реакцию Nasdaq и credit spreads."
    ],
    marketImpact: [
      "Bonds: высокий MOVE означает нестабильность ставок.",
      "Equities: рост волатильности ставок давит на мультипликаторы.",
      "USD: может получать поддержку в risk-off.",
      "Risk appetite: низкий MOVE обычно комфортнее для carry и risk-on."
    ]
  }
};

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

async function fetchJsonNoStore(url) {
  const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`${url} вернул статус ${response.status}`);
  }

  return await response.json();
}

async function loadRateLiveData() {
  try {
    return await fetchJsonNoStore("/api/rates");
  } catch (apiError) {
    console.warn("Не удалось загрузить /api/rates, пробуем локальный JSON", apiError);

    try {
      return await fetchJsonNoStore("rates-live-data.json");
    } catch (jsonError) {
      console.warn("Не удалось загрузить rates-live-data.json", jsonError);

      return {
        updatedAt: "Данные временно недоступны",
        items: {},
        errors: [apiError.message, jsonError.message]
      };
    }
  }
}

function renderList(items) {
  return items.map((item) => `<li>${item}</li>`).join("");
}

function renderRateDetail(meta, live, data) {
  const value = safeText(live.value);
  const change = safeText(live.change, "Без изменений");
  const asOf = safeText(live.asOf, "Нет времени обновления");
  const source = safeText(live.source || meta.source, meta.source);
  const changeClass = getChangeClass(live.state);
  const cacheStatus = data && data.cache && data.cache.status
    ? `Режим: ${data.cache.status}`
    : "Режим: live/fallback";

  rateDetailRoot.innerHTML = `
    <section class="rates-detail-hero">
      <a href="${meta.backHref}" class="rates-detail-back">← Назад к ставкам</a>

      <div class="rates-detail-title-row">
        <div>
          <p class="rates-eyebrow">${meta.label}</p>
          <h1 class="rates-detail-title">${meta.title}</h1>
          <p class="rates-detail-subtitle">${meta.type}</p>
        </div>

        <div class="rates-detail-source">
          <span>Источник</span>
          <strong>${source}</strong>
        </div>
      </div>

      <div class="rates-detail-value-card">
        <div>
          <span>Текущее значение</span>
          <strong class="rates-detail-value">${value}</strong>
        </div>

        <div class="rates-detail-value-meta">
          <div class="rates-change ${changeClass}">${change}</div>
          <div class="rates-asof">${asOf}</div>
          <div class="rates-asof">${cacheStatus}</div>
        </div>
      </div>
    </section>

    <section class="rates-detail-grid">
      <article class="rates-detail-panel">
        <h2>Что показывает</h2>
        <p>${meta.definition}</p>
      </article>

      <article class="rates-detail-panel">
        <h2>Почему важно</h2>
        <p>${meta.why}</p>
      </article>

      <article class="rates-detail-panel rates-detail-panel-wide">
        <h2>Как читать показатель</h2>
        <p>${meta.howToRead}</p>
      </article>

      <article class="rates-detail-panel">
        <h2>На что смотреть</h2>
        <ul class="rates-detail-list">
          ${renderList(meta.watch)}
        </ul>
      </article>

      <article class="rates-detail-panel">
        <h2>Рыночная реакция</h2>
        <ul class="rates-detail-list">
          ${renderList(meta.marketImpact)}
        </ul>
      </article>
    </section>

    <div class="rates-detail-actions">
      <a href="${meta.backHref}" class="btn btn-secondary">← Все ставки</a>
      <a href="../index.html" class="btn btn-primary">На главную</a>
    </div>
  `;
}

function renderEmptyState() {
  rateDetailRoot.innerHTML = `
    <section class="rates-detail-empty">
      <h1>Карточка не найдена</h1>
      <p>Проверь значение data-rate-id в HTML-файле этой страницы.</p>
      <a href="../rates.html" class="btn btn-primary">Вернуться к ставкам</a>
    </section>
  `;
}

async function initRateDetail() {
  if (!rateDetailRoot) {
    return;
  }

  const meta = RATE_DETAILS[currentRateId];

  if (!meta) {
    renderEmptyState();
    return;
  }

  rateDetailRoot.innerHTML = `
    <section class="rates-detail-hero">
      <p class="rates-eyebrow">${meta.label}</p>
      <h1 class="rates-detail-title">Загружаем карточку...</h1>
    </section>
  `;

  const data = await loadRateLiveData();
  const live = (data.items || {})[currentRateId] || {};

  renderRateDetail(meta, live, data);
}

initRateDetail();