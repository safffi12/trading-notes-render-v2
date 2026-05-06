window.calendarData = {
  updatedAt: "29 апреля 2026",

  items: {
    cpi: {
      title: "CPI",
      label: "Инфляция",
      country: "США",
      page: "cpi.html",
      sourceName: "BLS",
      sourceUrl: "https://www.bls.gov/news.release/cpi.htm",

      lastRelease: {
        title: "CPI за март 2026",
        date: "10 апреля 2026",
        time: "08:30 ET"
      },

      nextRelease: {
        title: "CPI за апрель 2026",
        date: "12 мая 2026",
        time: "08:30 ET"
      },

      summary: "Главный инфляционный релиз США. Для рынка важны не только сами значения, но и отклонение факта от прогноза.",

      marketFocus: "CPI напрямую влияет на ожидания по ставке ФРС, поэтому сильная инфляция обычно поддерживает доллар и доходности облигаций. Для золота и фондовых индексов такой отчет часто становится негативным фактором, если рынок начинает закладывать более жесткую политику.",

      metrics: [
        {
          name: "CPI YoY",
          actual: "3,3%",
          previous: "2,4%",
          forecast: "3,4%"
        },
        {
          name: "CPI MoM",
          actual: "0,9%",
          previous: "0,3%",
          forecast: "1,0%"
        },
        {
          name: "Core CPI YoY",
          actual: "2,6%",
          previous: "2,5%",
          forecast: "2,7%"
        },
        {
          name: "Core CPI MoM",
          actual: "0,2%",
          previous: "0,2%",
          forecast: "0,3%"
        }
      ],

      upcomingEvents: [
        {
          name: "Публикация CPI за апрель 2026",
          date: "12 мая 2026",
          time: "08:30 ET",
          importance: "Высокая"
        },
        {
          name: "Публикация CPI за май 2026",
          date: "10 июня 2026",
          time: "08:30 ET",
          importance: "Высокая"
        }
      ]
    },

    nfp: {
      title: "NFP",
      label: "Рынок труда",
      country: "США",
      page: "nfp.html",
      sourceName: "BLS",
      sourceUrl: "https://www.bls.gov/news.release/empsit.htm",

      lastRelease: {
        title: "Employment Situation за март 2026",
        date: "3 апреля 2026",
        time: "08:30 ET"
      },

      nextRelease: {
        title: "Employment Situation за апрель 2026",
        date: "8 мая 2026",
        time: "08:30 ET"
      },

      summary: "Ключевой отчет по рынку труда США. Влияет на ожидания по ставке ФРС, доллар, доходности облигаций и индексы.",

      marketFocus: "NFP показывает, насколько устойчивым остается рынок труда и есть ли у ФРС пространство для смягчения политики. Сильная занятость обычно поддерживает доллар, а слабые данные могут усиливать ожидания снижения ставок и повышать интерес к рисковым активам.",

      metrics: [
        {
          name: "Nonfarm Payrolls",
          actual: "+178 тыс.",
          previous: "-133 тыс.",
          forecast: "+65 тыс."
        },
        {
          name: "Unemployment Rate",
          actual: "4,3%",
          previous: "Проверить в календаре",
          forecast: "Проверить в календаре"
        },
        {
          name: "Average Hourly Earnings MoM",
          actual: "0,2%",
          previous: "Проверить в календаре",
          forecast: "Проверить в календаре"
        },
        {
          name: "Average Hourly Earnings YoY",
          actual: "3,5%",
          previous: "Проверить в календаре",
          forecast: "Проверить в календаре"
        }
      ],

      upcomingEvents: [
        {
          name: "Employment Situation за апрель 2026",
          date: "8 мая 2026",
          time: "08:30 ET",
          importance: "Высокая"
        }
      ]
    },

    fomc: {
      title: "FOMC",
      label: "ФРС",
      country: "США",
      page: "fomc.html",
      sourceName: "Federal Reserve",
      sourceUrl: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",

      lastRelease: {
        title: "Заседание FOMC",
        date: "17-18 марта 2026",
        time: "14:00 ET"
      },

      nextRelease: {
        title: "Решение FOMC",
        date: "29 апреля 2026",
        time: "14:00 ET"
      },

      summary: "Главное событие по денежной политике США. Рынок смотрит не только на ставку, но и на тон заявления ФРС.",

      marketFocus: "Решение FOMC задает направление для всей долларовой ликвидности: валют, облигаций, золота и фондовых индексов. Даже при неизменной ставке рынок может резко переоценить ожидания, если заявление или пресс-конференция звучат жестче или мягче прогнозов.",

      metrics: [
        {
          name: "Fed Funds Target Range",
          actual: "3,50-3,75%",
          previous: "3,50-3,75%",
          forecast: "3,50-3,75%"
        },
        {
          name: "Решение по ставке",
          actual: "Без изменений",
          previous: "Без изменений",
          forecast: "Без изменений"
        },
        {
          name: "Следующий SEP / dot plot",
          actual: "Июнь 2026",
          previous: "Март 2026",
          forecast: "Июнь 2026"
        }
      ],

      upcomingEvents: [
        {
          name: "Решение FOMC",
          date: "29 апреля 2026",
          time: "14:00 ET",
          importance: "Высокая"
        },
        {
          name: "Пресс-конференция главы ФРС",
          date: "29 апреля 2026",
          time: "14:30 ET",
          importance: "Высокая"
        },
        {
          name: "Следующее заседание FOMC",
          date: "16-17 июня 2026",
          time: "14:00 ET",
          importance: "Высокая"
        }
      ]
    },

    gdp: {
      title: "GDP",
      label: "Экономический рост",
      country: "США",
      page: "gdp.html",
      sourceName: "BEA",
      sourceUrl: "https://www.bea.gov/data/gdp/gross-domestic-product",

      lastRelease: {
        title: "GDP Q4 2025, третья оценка",
        date: "9 апреля 2026",
        time: "08:30 ET"
      },

      nextRelease: {
        title: "GDP Q1 2026, advance estimate",
        date: "30 апреля 2026",
        time: "08:30 ET"
      },

      summary: "GDP показывает темп роста экономики. Для рынка важны скорость роста, структура ВВП и риск замедления делового цикла.",

      marketFocus: "GDP помогает оценить, экономика ускоряется или переходит в фазу охлаждения. Сильный рост может поддерживать акции и доллар, но если он сопровождается инфляционным давлением, рынок может воспринять его как аргумент против быстрого снижения ставок.",

      metrics: [
        {
          name: "Real GDP QoQ annualized",
          actual: "0,5%",
          previous: "4,4%",
          forecast: "0,7%"
        },
        {
          name: "Следующий релиз: Q1 2026 advance estimate",
          actual: "Еще не опубликован",
          previous: "0,5%",
          forecast: "2,2%"
        }
      ],

      upcomingEvents: [
        {
          name: "GDP Q1 2026, advance estimate",
          date: "30 апреля 2026",
          time: "08:30 ET",
          importance: "Высокая"
        },
        {
          name: "GDP Q1 2026, second estimate",
          date: "28 мая 2026",
          time: "08:30 ET",
          importance: "Средняя"
        }
      ]
    },

    rateDecisions: {
      title: "Решения по ставкам",
      label: "Центробанки",
      country: "Глобально",
      page: "rate-decisions.html",
      sourceName: "Central banks calendars",
      sourceUrl: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",

      lastRelease: {
        title: "Последние решения центробанков",
        date: "Апрель 2026",
        time: "Разное"
      },

      nextRelease: {
        title: "Ближайшие решения по ставкам",
        date: "29-30 апреля 2026",
        time: "Разное"
      },

      summary: "Раздел для отслеживания ближайших решений центробанков. Особенно важны ФРС, ЕЦБ, Банк Англии, Банк Японии и Банк Канады.",

      marketFocus: "Решения по ставкам определяют стоимость денег и напрямую влияют на валюты, облигации, фондовые индексы и сырьевые активы. Для рынка важна не только текущая ставка, но и сигнал о том, куда политика может двигаться дальше.",

      metrics: [
        {
          name: "ФРС",
          actual: "3,50-3,75%",
          previous: "3,50-3,75%",
          forecast: "3,50-3,75%"
        },
        {
          name: "Bank of England",
          actual: "3,75%",
          previous: "3,75%",
          forecast: "Проверить перед релизом"
        },
        {
          name: "Bank of Canada",
          actual: "2,25%",
          previous: "2,25%",
          forecast: "Проверить перед релизом"
        }
      ],

      upcomingEvents: [
        {
          name: "FOMC Rate Decision",
          date: "29 апреля 2026",
          time: "14:00 ET",
          importance: "Высокая"
        },
        {
          name: "ECB Rate Decision",
          date: "30 апреля 2026",
          time: "13:15 GMT",
          importance: "Высокая"
        },
        {
          name: "Bank of England Rate Decision",
          date: "30 апреля 2026",
          time: "12:00 UK",
          importance: "Высокая"
        },
        {
          name: "Bank of Canada Rate Decision",
          date: "10 июня 2026",
          time: "Уточнить",
          importance: "Средняя"
        }
      ]
    },

    speeches: {
      title: "Выступления",
      label: "Комментарии",
      country: "Глобально",
      page: "speeches.html",
      sourceName: "Federal Reserve / ECB / BoE calendars",
      sourceUrl: "https://www.federalreserve.gov/newsevents.htm",

      lastRelease: {
        title: "Последние выступления центробанков",
        date: "Апрель 2026",
        time: "Разное"
      },

      nextRelease: {
        title: "Ближайшая важная пресс-конференция",
        date: "29 апреля 2026",
        time: "14:30 ET"
      },

      summary: "Выступления глав центробанков могут менять ожидания рынка даже без изменения ставки.",

      marketFocus: "Комментарии центробанков часто двигают рынок через изменение ожиданий, а не через фактическое решение по ставке. Особенно сильная реакция возникает, когда риторика резко отличается от того, что рынок уже заложил в цены.",

      metrics: [
        {
          name: "Ближайшее событие",
          actual: "FOMC Press Conference",
          previous: "Предыдущее выступление ФРС",
          forecast: "Риторика ФРС"
        },
        {
          name: "Риск волатильности",
          actual: "Высокий",
          previous: "Средний",
          forecast: "Высокий"
        }
      ],

      upcomingEvents: [
        {
          name: "FOMC Press Conference",
          date: "29 апреля 2026",
          time: "14:30 ET",
          importance: "Высокая"
        },
        {
          name: "ECB Press Conference",
          date: "30 апреля 2026",
          time: "После решения по ставке",
          importance: "Высокая"
        }
      ]
    }
  }
};

console.log("calendar-data.js loaded", window.calendarData);