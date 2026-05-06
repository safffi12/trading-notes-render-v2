window.ratesData = {
  updatedAt: "—",

  highlights: ["fed", "ecb", "us10y", "dxy"],

  sections: [
    {
      id: "central-banks",
      eyebrow: "Central Banks",
      title: "Ключевые ставки ЦБ",
      description: "Базовые ставки центральных банков, через которые формируется стоимость денег в крупнейших экономиках.",
      items: ["fed", "ecb", "boe", "boj"]
    },
    {
      id: "us-yields",
      eyebrow: "US Yields",
      title: "Доходности США",
      description: "Рыночные ставки по казначейским облигациям США. Они часто двигаются быстрее, чем официальная ставка ФРС.",
      items: ["us02y", "us10y", "us30y", "yieldcurve"]
    },
    {
      id: "dollar-liquidity",
      eyebrow: "Dollar & Liquidity",
      title: "Доллар и ликвидность",
      description: "Индикаторы силы доллара, реальной доходности и стоимости долларового фондирования.",
      items: ["dxy", "realyield", "dollarfunding"]
    }
  ],

  items: {
    fed: {
      title: "Fed Funds Rate",
      shortTitle: "Fed",
      region: "США",
      type: "Ключевая ставка ЦБ",
      page: "fed.html",
      tvSymbol: "ECONOMICS:USINTR",
      currentValue: "—",
      change: "—",
      lastDecision: "—",
      nextMeeting: "См. календарь FOMC",
      sourceName: "Federal Reserve",
      sourceUrl: "https://www.federalreserve.gov/monetarypolicy.htm",

      summary:
        "Главный ориентир стоимости доллара. Влияет на доходности США, DXY, фондовый рынок, золото и глобальную ликвидность.",

      definition:
        "Fed Funds Rate — это целевой диапазон ставки, по которой банки США занимают друг у друга резервы на одну ночь.",

      importance:
        "Через эту ставку ФРС управляет стоимостью кредитования, охлаждает или стимулирует спрос, влияет на инфляционные ожидания и глобальный спрос на доллар.",

      watch: [
        "Само решение по ставке: повышение, пауза или снижение.",
        "Риторику ФРС: hawkish или dovish тон.",
        "Dot Plot и прогнозы членов FOMC.",
        "Пресс-конференцию председателя ФРС.",
        "Реакцию US02Y, US10Y, DXY, S&P 500 и золота."
      ],

      marketReaction: {
        hawkish:
          "Жестче ожиданий — обычно поддерживает доллар и доходности, но давит на акции, золото и риск-активы.",
        dovish:
          "Мягче ожиданий — обычно ослабляет доллар и доходности, но поддерживает акции, золото и risk-on."
      },

      related: ["US02Y", "US10Y", "DXY", "S&P 500", "Gold"]
    },

    ecb: {
      title: "ECB Rate",
      shortTitle: "ECB",
      region: "Еврозона",
      type: "Ключевая ставка ЦБ",
      page: "ecb.html",
      tvSymbol: "ECONOMICS:EUINTR",
      currentValue: "—",
      change: "—",
      lastDecision: "—",
      nextMeeting: "См. календарь ECB",
      sourceName: "European Central Bank",
      sourceUrl: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html",

      summary:
        "Ставка ЕЦБ определяет монетарный фон еврозоны и влияет на EUR/USD, европейские индексы и доходности облигаций.",

      definition:
        "ECB Rate — это набор ключевых ставок Европейского центрального банка, включая депозитную ставку, основную ставку рефинансирования и маржинальную ставку.",

      importance:
        "Для рынка особенно важна депозитная ставка ЕЦБ, потому что она влияет на стоимость евро, банковскую ликвидность и доходности европейских облигаций.",

      watch: [
        "Решение по ставке.",
        "Разницу между политикой ЕЦБ и ФРС.",
        "Прогнозы по инфляции и росту ВВП еврозоны.",
        "Риторику Лагард на пресс-конференции.",
        "Реакцию EUR/USD, DAX, Euro Stoxx 50 и европейских облигаций."
      ],

      marketReaction: {
        hawkish:
          "Жестче ожиданий — обычно поддерживает евро и европейские доходности, но может давить на акции еврозоны.",
        dovish:
          "Мягче ожиданий — обычно давит на евро, но может поддерживать европейские акции через ожидания более дешевых денег."
      },

      related: ["EUR/USD", "DAX", "Euro Stoxx 50", "Bund Yield"]
    },

    boe: {
      title: "BoE Rate",
      shortTitle: "BoE",
      region: "Великобритания",
      type: "Ключевая ставка ЦБ",
      page: "boe.html",
      tvSymbol: "ECONOMICS:GBINTR",
      currentValue: "—",
      change: "—",
      lastDecision: "—",
      nextMeeting: "См. календарь BoE",
      sourceName: "Bank of England",
      sourceUrl: "https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate",

      summary:
        "Ставка Банка Англии влияет на фунт, британские облигации, инфляционные ожидания и оценку экономики Великобритании.",

      definition:
        "BoE Bank Rate — это ключевая ставка Банка Англии, через которую он влияет на стоимость кредитования и денежные условия в экономике.",

      importance:
        "Фунт чувствителен не только к самому решению по ставке, но и к голосованию членов комитета, прогнозам инфляции и тону комментариев Банка Англии.",

      watch: [
        "Решение по ставке.",
        "Голоса членов MPC.",
        "Прогнозы по инфляции и рынку труда.",
        "Комментарий по будущей траектории ставки.",
        "Реакцию GBP/USD, EUR/GBP и доходностей Gilts."
      ],

      marketReaction: {
        hawkish:
          "Жестче ожиданий — обычно поддерживает GBP и доходности британских облигаций.",
        dovish:
          "Мягче ожиданий — обычно давит на GBP и снижает ожидания по будущей ставке."
      },

      related: ["GBP/USD", "EUR/GBP", "UK Gilts", "FTSE 100"]
    },

    boj: {
      title: "BoJ Rate",
      shortTitle: "BoJ",
      region: "Япония",
      type: "Ключевая ставка ЦБ",
      page: "boj.html",
      tvSymbol: "ECONOMICS:JPINTR",
      currentValue: "—",
      change: "—",
      lastDecision: "—",
      nextMeeting: "См. календарь BoJ",
      sourceName: "Bank of Japan",
      sourceUrl: "https://www.boj.or.jp/en/mopo/mpmdeci/index.htm",

      summary:
        "Политика Банка Японии важна для JPY, carry trade, глобальной ликвидности и потоков капитала между рынками.",

      definition:
        "BoJ Rate — это ключевая ставка Банка Японии. Она определяет краткосрочную стоимость иены и влияет на поведение японских инвесторов.",

      importance:
        "Япония долгое время была источником дешевой ликвидности. Поэтому изменение политики BoJ может влиять не только на иену, но и на глобальные carry trade позиции.",

      watch: [
        "Решение по ставке.",
        "Комментарии по инфляции и зарплатам.",
        "Сигналы по дальнейшему ужесточению.",
        "Реакцию USD/JPY и японских доходностей.",
        "Риск unwind carry trade."
      ],

      marketReaction: {
        hawkish:
          "Жестче ожиданий — обычно поддерживает JPY и может давить на carry trade.",
        dovish:
          "Мягче ожиданий — обычно ослабляет JPY и поддерживает стратегии заимствования в иене."
      },

      related: ["USD/JPY", "JPY Crosses", "Nikkei 225", "Carry Trade"]
    },

    us02y: {
      title: "US02Y",
      shortTitle: "US02Y",
      region: "США",
      type: "Доходность 2-летних облигаций",
      page: "us02y.html",
      tvSymbol: "TVC:US02Y",
      currentValue: "—",
      change: "—",
      lastDecision: "—",
      nextMeeting: "Рыночные данные",
      sourceName: "TradingView",
      sourceUrl: "https://www.tradingview.com/symbols/TVC-US02Y/",

      summary:
        "2-летняя доходность США сильнее всего отражает ожидания рынка по ставке ФРС на ближайшие кварталы.",

      definition:
        "US02Y — это доходность 2-летних казначейских облигаций США.",

      importance:
        "Короткий конец кривой доходности особенно чувствителен к ожиданиям по политике ФРС. Если рынок ждет более высокую ставку дольше, US02Y обычно растет.",

      watch: [
        "Реакцию после CPI, NFP и заседаний ФРС.",
        "Связь с ожиданиями по Fed Funds Rate.",
        "Расхождение между US02Y и US10Y.",
        "Реакцию DXY и золота.",
        "Скорость движения после макро-релизов."
      ],

      marketReaction: {
        hawkish:
          "Рост US02Y обычно означает ужесточение ожиданий по ФРС и поддерживает доллар.",
        dovish:
          "Падение US02Y часто означает рост ожиданий снижения ставки и может давить на доллар."
      },

      related: ["Fed Funds Rate", "DXY", "Gold", "EUR/USD"]
    },

    us10y: {
      title: "US10Y",
      shortTitle: "US10Y",
      region: "США",
      type: "Доходность 10-летних облигаций",
      page: "us10y.html",
      tvSymbol: "TVC:US10Y",
      currentValue: "—",
      change: "—",
      lastDecision: "—",
      nextMeeting: "Рыночные данные",
      sourceName: "TradingView",
      sourceUrl: "https://www.tradingview.com/symbols/TVC-US10Y/",

      summary:
        "10-летняя доходность США — один из главных ориентиров глобальной стоимости капитала.",

      definition:
        "US10Y — это доходность 10-летних казначейских облигаций США.",

      importance:
        "US10Y влияет на стоимость капитала, ипотечные ставки, оценку акций, золото, доллар и appetite к риску. Особенно важна для Nasdaq и growth stocks.",

      watch: [
        "Рост или падение после инфляционных данных.",
        "Связь с реальной доходностью.",
        "Реакцию Nasdaq и золота.",
        "Форму кривой доходности.",
        "Спрос на защитные активы."
      ],

      marketReaction: {
        hawkish:
          "Рост US10Y часто давит на акции роста и золото, особенно если растет реальная доходность.",
        dovish:
          "Снижение US10Y может поддерживать risk-on, если оно связано с мягкой ФРС, а не со страхом рецессии."
      },

      related: ["Nasdaq", "S&P 500", "Gold", "DXY", "Real Yield"]
    },

    us30y: {
      title: "US30Y",
      shortTitle: "US30Y",
      region: "США",
      type: "Доходность 30-летних облигаций",
      page: "us30y.html",
      tvSymbol: "TVC:US30Y",
      currentValue: "—",
      change: "—",
      lastDecision: "—",
      nextMeeting: "Рыночные данные",
      sourceName: "TradingView",
      sourceUrl: "https://www.tradingview.com/symbols/TVC-US30Y/",

      summary:
        "30-летняя доходность отражает длинный конец кривой, ожидания по инфляции, долгу и долгосрочной премии за срок.",

      definition:
        "US30Y — это доходность 30-летних казначейских облигаций США.",

      importance:
        "Длинный конец кривой важен для оценки долгосрочных инфляционных рисков, бюджетной устойчивости США и спроса инвесторов на длительные облигации.",

      watch: [
        "Движение относительно US10Y.",
        "Реакцию на аукционы казначейских облигаций.",
        "Инфляционные ожидания.",
        "Спрос иностранных инвесторов.",
        "Реакцию банковского сектора и недвижимости."
      ],

      marketReaction: {
        hawkish:
          "Рост US30Y может указывать на повышение долгосрочной премии за риск и давить на чувствительные к ставкам активы.",
        dovish:
          "Снижение US30Y может поддерживать активы с длинной дюрацией, если рынок не закладывает рецессию."
      },

      related: ["US10Y", "Yield Curve", "Mortgage Rates", "Gold"]
    },

    yieldcurve: {
      title: "2Y-10Y Spread",
      shortTitle: "Yield Curve",
      region: "США",
      type: "Кривая доходности",
      page: "yield-curve.html",
      tvSymbol: "TVC:US10Y",
      currentValue: "—",
      change: "—",
      lastDecision: "—",
      nextMeeting: "Рыночные данные",
      sourceName: "TradingView",
      sourceUrl: "https://www.tradingview.com/symbols/TVC-US10Y/",

      summary:
        "Спред между 10-летней и 2-летней доходностью показывает форму кривой и помогает оценивать ожидания по циклу экономики.",

      definition:
        "2Y-10Y Spread — это разница между доходностью 10-летних и 2-летних казначейских облигаций США.",

      importance:
        "Инверсия кривой часто означает, что рынок ждет замедления экономики и будущего снижения ставок. Нормализация кривой может происходить как через мягкую посадку, так и через рост рецессионных рисков.",

      watch: [
        "Инверсия или нормализация кривой.",
        "За счет чего движется спред: US02Y или US10Y.",
        "Реакцию после заседаний ФРС.",
        "Сигналы по рецессионным рискам.",
        "Связь с банковским сектором."
      ],

      marketReaction: {
        hawkish:
          "Углубление инверсии часто означает, что короткий конец кривой растет быстрее из-за ожиданий жесткой ФРС.",
        dovish:
          "Нормализация через падение US02Y может означать ожидания снижения ставки, но контекст рецессии критически важен."
      },

      related: ["US02Y", "US10Y", "Banks", "S&P 500"]
    },

    dxy: {
      title: "DXY",
      shortTitle: "DXY",
      region: "Доллар",
      type: "Индекс доллара",
      page: "dxy.html",
      tvSymbol: "TVC:DXY",
      currentValue: "—",
      change: "—",
      lastDecision: "—",
      nextMeeting: "Рыночные данные",
      sourceName: "TradingView",
      sourceUrl: "https://www.tradingview.com/symbols/TVC-DXY/",

      summary:
        "DXY показывает силу доллара относительно корзины основных валют. Важен для FX, сырья, золота и risk-on/risk-off режима.",

      definition:
        "DXY — индекс доллара США относительно корзины основных валют.",

      importance:
        "Сильный доллар часто давит на сырье, золото, emerging markets и валюты против USD. Слабый доллар часто поддерживает risk-on и commodities.",

      watch: [
        "Связь с доходностями США.",
        "Реакцию на CPI, NFP и ФРС.",
        "Движение EUR/USD, так как евро имеет большой вес в индексе.",
        "Реакцию золота и нефти.",
        "Пробой ключевых уровней на графике."
      ],

      marketReaction: {
        hawkish:
          "Рост DXY обычно означает спрос на доллар, жесткие ожидания по ФРС или risk-off.",
        dovish:
          "Падение DXY обычно поддерживает валюты против доллара, золото и часть risk-on активов."
      },

      related: ["EUR/USD", "Gold", "Oil", "US10Y", "Fed"]
    },

    realyield: {
      title: "Real Yield",
      shortTitle: "Real Yield",
      region: "США",
      type: "Реальная доходность",
      page: "real-yield.html",
      tvSymbol: "FRED:DFII10",
      currentValue: "—",
      change: "—",
      lastDecision: "—",
      nextMeeting: "Рыночные данные",
      sourceName: "TradingView",
      sourceUrl: "https://www.tradingview.com/",

      summary:
        "Реальная доходность показывает доходность облигаций с поправкой на инфляционные ожидания. Особенно важна для золота и акций роста.",

      definition:
        "Real Yield — это номинальная доходность за вычетом инфляционных ожиданий. Часто используют доходность 10-летних TIPS.",

      importance:
        "Когда реальная доходность растет, держать бездоходные активы вроде золота становится менее привлекательно. Для growth stocks это тоже может быть негативным фактором.",

      watch: [
        "Связь с US10Y.",
        "Реакцию золота.",
        "Реакцию Nasdaq.",
        "Движение инфляционных ожиданий.",
        "Изменение после данных по CPI и ФРС."
      ],

      marketReaction: {
        hawkish:
          "Рост реальной доходности часто давит на золото и акции роста.",
        dovish:
          "Снижение реальной доходности часто поддерживает золото и активы с длинной дюрацией."
      },

      related: ["Gold", "US10Y", "Nasdaq", "TIPS"]
    },

    dollarfunding: {
      title: "SOFR",
      shortTitle: "SOFR",
      region: "USD Liquidity",
      type: "Стоимость долларового фондирования",
      page: "dollar-funding.html",
      tvSymbol: "FRED:SOFR",
      currentValue: "—",
      change: "—",
      lastDecision: "—",
      nextMeeting: "Рыночные данные",
      sourceName: "TradingView",
      sourceUrl: "https://www.tradingview.com/",

      summary:
        "Стоимость долларового фондирования показывает, насколько дорогими становятся долларовые деньги для финансовой системы.",

      definition:
        "Dollar Funding — это общий термин для стоимости привлечения долларовой ликвидности. В качестве ориентира можно смотреть SOFR и другие ставки денежного рынка.",

      importance:
        "Если долларовое фондирование дорожает резко, это может указывать на стресс ликвидности. Для рынков это важный risk-off сигнал.",

      watch: [
        "Резкие скачки ставок денежного рынка.",
        "Расхождение с обычной динамикой Fed Funds Rate.",
        "Спрос на долларовую ликвидность.",
        "Реакцию банковского сектора.",
        "Связь с DXY и кредитными спредами."
      ],

      marketReaction: {
        hawkish:
          "Рост стоимости фондирования может усиливать стресс ликвидности и поддерживать спрос на доллар.",
        dovish:
          "Снижение стоимости фондирования обычно облегчает финансовые условия и поддерживает риск-активы."
      },

      related: ["DXY", "SOFR", "Credit Spreads", "Banks"]
    }
  }
};