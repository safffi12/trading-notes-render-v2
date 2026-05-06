(function () {
  "use strict";

  const CALENDAR_ORDER = [
    "cpi",
    "nfp",
    "fomc",
    "gdp",
    "rateDecisions",
    "speeches"
  ];

  const LIVE_CALENDAR_API_URL = "/api/investing-calendar-live";
  const LIVE_FETCH_TIMEOUT_MS = 20000;

  const RUSSIAN_MONTHS = {
    января: 0,
    февраля: 1,
    марта: 2,
    апреля: 3,
    мая: 4,
    июня: 5,
    июля: 6,
    августа: 7,
    сентября: 8,
    октября: 9,
    ноября: 10,
    декабря: 11
  };

  const RUSSIAN_MONTH_NAMES = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря"
  ];

  let activeCalendarData = null;
  let liveCalendarLoaded = false;
  let liveCalendarError = null;

  function getBaseCalendarData() {
    if (!window.calendarData || !window.calendarData.items) {
      return null;
    }

    return window.calendarData;
  }

  function getCalendarData() {
    return activeCalendarData || getBaseCalendarData();
  }

  function getCalendarItems() {
    const data = getCalendarData();

    if (!data) {
      return {};
    }

    return data.items;
  }

  function getOrderedCalendarEntries() {
    const items = getCalendarItems();

    const knownEntries = CALENDAR_ORDER
      .filter((key) => Boolean(items[key]))
      .map((key) => [key, items[key]]);

    const extraEntries = Object.keys(items)
      .filter((key) => !CALENDAR_ORDER.includes(key))
      .map((key) => [key, items[key]]);

    return knownEntries.concat(extraEntries);
  }

  function safeText(value, fallback = "Нет данных") {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }

    return String(value);
  }

  function escapeHtml(value) {
    return safeText(value, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function normalizeText(value) {
    return safeText(value, "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function getImportanceLevel(importance) {
    if (importance === "Высокая") {
      return 3;
    }

    if (importance === "Средняя") {
      return 2;
    }

    return 1;
  }

  function getImportanceClass(importance) {
    if (importance === "Высокая") {
      return "calendar-importance-high";
    }

    if (importance === "Средняя") {
      return "calendar-importance-medium";
    }

    return "calendar-importance-low";
  }

  function renderImportanceIcons(importance) {
    const level = getImportanceLevel(importance);
    let icons = "";

    for (let i = 1; i <= 3; i += 1) {
      const activeClass = i <= level ? " calendar-importance-check-active" : "";

      icons += `<span class="calendar-importance-check${activeClass}" aria-hidden="true">✓</span>`;
    }

    return `
      <span class="calendar-importance-icons" aria-label="Важность: ${escapeAttribute(safeText(importance))}">
        ${icons}
      </span>
    `;
  }

  function renderImportance(importance) {
    const safeImportance = safeText(importance, "Низкая");

    return `
      <div class="calendar-importance-wrap">
        ${renderImportanceIcons(safeImportance)}
        <span class="calendar-importance ${getImportanceClass(safeImportance)}">
          ${escapeHtml(safeImportance)}
        </span>
      </div>
    `;
  }

  function hasPlaceholderValue(value) {
    const normalized = normalizeText(value);

    if (!normalized) {
      return true;
    }

    return (
      normalized === "-" ||
      normalized.includes("проверить") ||
      normalized.includes("уточнить") ||
      normalized.includes("еще не опубликован") ||
      normalized.includes("ещё не опубликован") ||
      normalized.includes("нет данных")
    );
  }

  function parseRussianDate(value) {
    const text = safeText(value, "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[–—]/g, "-");

    const monthNames = Object.keys(RUSSIAN_MONTHS).join("|");
    const regexp = new RegExp(
      `(\\d{1,2})(?:\\s*-\\s*(\\d{1,2}))?\\s+(${monthNames})\\s+(\\d{4})`
    );

    const match = text.match(regexp);

    if (!match) {
      return null;
    }

    const startDay = Number(match[1]);
    const endDay = match[2] ? Number(match[2]) : startDay;
    const month = RUSSIAN_MONTHS[match[3]];
    const year = Number(match[4]);

    if (
      !Number.isFinite(startDay) ||
      !Number.isFinite(endDay) ||
      !Number.isFinite(month) ||
      !Number.isFinite(year)
    ) {
      return null;
    }

    return new Date(year, month, endDay, 23, 59, 59, 999);
  }

  function isPastDate(dateText) {
    const date = parseRussianDate(dateText);

    if (!date) {
      return false;
    }

    return date.getTime() < Date.now();
  }

  function itemNeedsUpdate(item) {
    if (!item) {
      return true;
    }

    if (item._liveStatus === "fresh") {
      return false;
    }

    const metrics = Array.isArray(item.metrics) ? item.metrics : [];

    const hasPlaceholderMetric = metrics.some((metric) => {
      return (
        hasPlaceholderValue(metric.actual) ||
        hasPlaceholderValue(metric.previous) ||
        hasPlaceholderValue(metric.forecast)
      );
    });

    if (hasPlaceholderMetric) {
      return true;
    }

    if (item.nextRelease && isPastDate(item.nextRelease.date)) {
      return true;
    }

    return false;
  }

  function getItemStatus(item) {
    if (!item) {
      return {
        className: "calendar-data-status-error",
        label: "Сервер не отвечает"
      };
    }

    if (item._liveStatus === "fresh") {
      return {
        className: "calendar-data-status-fresh",
        label: "Данные актуальны"
      };
    }

    if (itemNeedsUpdate(item)) {
      return {
        className: "calendar-data-status-stale",
        label: "Требуют обновления"
      };
    }

    return {
      className: "calendar-data-status-fresh",
      label: "Данные актуальны"
    };
  }

  function renderDataStatus(item) {
    const status = getItemStatus(item);

    return `
      <div class="calendar-data-status ${status.className}">
        <span class="calendar-data-status-dot" aria-hidden="true"></span>
        <span>${escapeHtml(status.label)}</span>
      </div>
    `;
  }

  function getFirstMetrics(item, limit = 3) {
    if (!item || !Array.isArray(item.metrics)) {
      return [];
    }

    return item.metrics.slice(0, limit);
  }

  function isEventObjectPast(event) {
  if (!event || !event.date) {
    return false;
  }

  return isPastDate(event.date);
}

function getNextEvent(item) {
  if (item && Array.isArray(item.upcomingEvents) && item.upcomingEvents.length > 0) {
    const futureEvents = item.upcomingEvents.filter((event) => {
      return !isEventObjectPast(event);
    });

    if (futureEvents.length > 0) {
      return futureEvents[0];
    }
  }

  if (item && item.nextRelease && !isPastDate(item.nextRelease.date)) {
    return {
      name: item.nextRelease.title,
      date: item.nextRelease.date,
      time: item.nextRelease.time,
      importance: "Средняя"
    };
  }

  return null;
}

function getDisplayNextRelease(item) {
  if (item && item.nextRelease && !isPastDate(item.nextRelease.date)) {
    return item.nextRelease;
  }

  const nextEvent = getNextEvent(item);

  if (nextEvent) {
    return {
      title: nextEvent.name,
      date: nextEvent.date,
      time: nextEvent.time
    };
  }

  return {
    title: "Следующее событие не найдено",
    date: "Ожидает обновления",
    time: "—"
  };
}

  function getOverviewFallbackValue(item, usedLabels) {
  const firstMetric = Array.isArray(item.metrics) ? item.metrics[0] : null;
  const nextEvent = getNextEvent(item);

  if (
    firstMetric &&
    firstMetric.forecast &&
    !hasPlaceholderValue(firstMetric.forecast) &&
    !usedLabels.has("Прогноз")
  ) {
    usedLabels.add("Прогноз");

    return {
      name: "Прогноз",
      actual: firstMetric.forecast
    };
  }

  if (
    firstMetric &&
    firstMetric.previous &&
    !hasPlaceholderValue(firstMetric.previous) &&
    !usedLabels.has("Предыдущее")
  ) {
    usedLabels.add("Предыдущее");

    return {
      name: "Предыдущее",
      actual: firstMetric.previous
    };
  }

  if (nextEvent && !usedLabels.has("Дата события")) {
    usedLabels.add("Дата события");

    return {
      name: "Дата события",
      actual: nextEvent.date
    };
  }

  if (nextEvent && !usedLabels.has("Время")) {
    usedLabels.add("Время");

    return {
      name: "Время",
      actual: nextEvent.time
    };
  }

  if (nextEvent && !usedLabels.has("Важность")) {
    usedLabels.add("Важность");

    return {
      name: "Важность",
      actual: nextEvent.importance || "Средняя"
    };
  }

  return {
    name: "Статус",
    actual: "Ожидается"
  };
}

function getOverviewMetricCells(item) {
  const rawMetrics = Array.isArray(item.metrics) ? item.metrics : [];

  const metrics = rawMetrics.filter((metric) => {
    const metricName = normalizeText(metric.name);

    if (metricName.includes("следующий релиз")) {
      return false;
    }

    if (metricName.includes("следующее событие")) {
      return false;
    }

    return true;
  });

  const cells = [];
  const usedLabels = new Set();

  metrics.slice(0, 3).forEach((metric) => {
    const name = safeText(metric.name, "Показатель");

    usedLabels.add(name);

    cells.push({
      name,
      actual: safeText(metric.actual, "Нет данных")
    });
  });

  while (cells.length < 3) {
    cells.push(getOverviewFallbackValue(item, usedLabels));
  }

  return cells.slice(0, 3);
}

function renderOverviewMetrics(item) {
  if (!item) {
    return "";
  }

  const metrics = getOverviewMetricCells(item);

  if (metrics.length === 0) {
    return "";
  }

  const metricHtml = metrics
    .map((metric) => {
      return `
        <div>
          <span>${escapeHtml(metric.name)}</span>
          <strong>${escapeHtml(metric.actual)}</strong>
        </div>
      `;
    })
    .join("");

  return `<div class="calendar-card-metrics">${metricHtml}</div>`;
}

  function renderOverviewNextEvent(item) {
    const event = getNextEvent(item);

    if (!event) {
      return "";
    }

    return `
      <div class="calendar-next-event">
        <span>Ближайшее событие</span>
        <strong>${escapeHtml(event.name)}</strong>
        <small>${escapeHtml(event.date)} · ${escapeHtml(event.time)}</small>
      </div>
    `;
  }

  function renderOverviewCard(key, item) {
    const href = item.page || `${key}.html`;

    return `
      <a href="${escapeAttribute(href)}" class="calendar-overview-card">
        <div class="calendar-card-top">
          <span class="calendar-country">${escapeHtml(item.country)}</span>
          <span class="data-label">${escapeHtml(item.label)}</span>
        </div>

        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.summary)}</p>

        ${renderOverviewMetrics(item)}
        ${renderOverviewNextEvent(item)}
        ${renderDataStatus(item)}
      </a>
    `;
  }

  function renderErrorCard(title, message) {
    return `
      <article class="calendar-overview-card error-card">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(message)}</p>
        ${renderDataStatus(null)}
      </article>
    `;
  }

  function renderCalendarPage() {
    const container =
      document.getElementById("calendarContent") ||
      document.getElementById("calendarDashboard") ||
      document.getElementById("calendarGrid") ||
      document.getElementById("calendarItems");

    if (!container) {
      return;
    }

    const data = getCalendarData();

    if (!data) {
      container.innerHTML = renderErrorCard(
        "Календарь не загрузился",
        "Файл calendar-data.js не подключился или содержит ошибку. Проверь путь к файлу и синтаксис JavaScript."
      );
      return;
    }

    const entries = getOrderedCalendarEntries();

    if (entries.length === 0) {
      container.innerHTML = renderErrorCard(
        "Нет событий",
        "В window.calendarData.items пока нет данных для отображения."
      );
      return;
    }

    container.innerHTML = entries
      .map(([key, item]) => renderOverviewCard(key, item))
      .join("");
  }

  function renderReleaseCard(label, release, isPrimary = false) {
    const primaryClass = isPrimary ? " calendar-release-card-primary" : "";

    return `
      <article class="calendar-release-card${primaryClass}">
        <span>${escapeHtml(label)}</span>
        <h2>${escapeHtml(release && release.title)}</h2>
        <p>${escapeHtml(release && release.date)} · ${escapeHtml(release && release.time)}</p>
      </article>
    `;
  }

  function renderMetricsTable(item) {
    const metrics = Array.isArray(item.metrics) ? item.metrics : [];

    if (metrics.length === 0) {
      return renderErrorCard(
        "Нет таблицы данных",
        "Для этого события пока не добавлены значения actual, previous и forecast."
      );
    }

    const rows = metrics
      .map((metric) => {
        return `
          <tr>
            <td>${escapeHtml(metric.name)}</td>
            <td>${escapeHtml(metric.actual)}</td>
            <td>${escapeHtml(metric.previous)}</td>
            <td>${escapeHtml(metric.forecast)}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <div class="calendar-table-wrap">
        <table class="calendar-table">
          <thead>
            <tr>
              <th>Показатель</th>
              <th>Факт</th>
              <th>Предыдущее</th>
              <th>Прогноз</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderEventsList(item) {
    const events = Array.isArray(item.upcomingEvents) ? item.upcomingEvents : [];

    if (events.length === 0) {
      return renderErrorCard(
        "Нет ближайших событий",
        "Для этого показателя пока не добавлены даты следующих публикаций."
      );
    }

    const eventCards = events
      .map((event) => {
        return `
          <article class="calendar-event-card">
            <div>
              <h3>${escapeHtml(event.name)}</h3>
              <p>${escapeHtml(event.date)} · ${escapeHtml(event.time)}</p>
            </div>

            ${renderImportance(event.importance)}
          </article>
        `;
      })
      .join("");

    return `<div class="calendar-events-list">${eventCards}</div>`;
  }

  function renderSource(item) {
    if (!item.sourceName && !item.sourceUrl) {
      return "";
    }

    if (item.sourceUrl) {
      return `
        <p class="calendar-source">
          Источник:
          <a href="${escapeAttribute(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(item.sourceName || item.sourceUrl)}
          </a>
        </p>
      `;
    }

    return `<p class="calendar-source">Источник: ${escapeHtml(item.sourceName)}</p>`;
  }

  function renderDetailPage() {
    const detailContainer = document.getElementById("calendarDetail");

    if (!detailContainer) {
      return;
    }

    const data = getCalendarData();

    if (!data) {
      detailContainer.innerHTML = `
        <a href="calendar-page.html" class="back-pill">Назад к календарю</a>
        ${renderReleaseCard("Последний релиз", item.lastRelease, false)}
        ${renderReleaseCard("Следующий релиз", getDisplayNextRelease(item), true)}
      `;
      return;
    }

    const key = document.body.dataset.calendarKey;
    const item = data.items[key];

    if (!key || !item) {
      detailContainer.innerHTML = `
        <a href="calendar-page.html" class="back-pill">Назад к календарю</a>
        ${renderErrorCard(
          "Событие не найдено",
          "Для этой страницы не найден ключ data-calendar-key или такого ключа нет в calendar-data.js."
        )}
      `;
      return;
    }

    detailContainer.innerHTML = `
      <a href="calendar-page.html" class="back-pill">Назад к календарю</a>

      <header class="calendar-detail-header">
        <span class="calendar-page-label">
          ${escapeHtml(item.label)} · ${escapeHtml(item.country)}
        </span>

        <h1 class="page-title">${escapeHtml(item.title)}</h1>

        <p class="page-subtitle">
          ${escapeHtml(item.summary)}
        </p>

        ${renderDataStatus(item)}
      </header>

      <section class="calendar-release-grid" aria-label="Последний и следующий релиз">
        ${renderReleaseCard("Последний релиз", item.lastRelease, false)}
        ${renderReleaseCard("Следующий релиз", item.nextRelease, true)}
      </section>

      <section class="calendar-data-section">
        <h2 class="calendar-section-title">Последние данные</h2>
        ${renderMetricsTable(item)}
      </section>

      <section class="calendar-data-section">
        <h2 class="calendar-section-title">Ближайшие события</h2>
        ${renderEventsList(item)}
      </section>

      <section class="calendar-info-box">
        <h2>Рыночное значение</h2>
        <p>${escapeHtml(item.marketFocus || item.summary)}</p>
      </section>

      ${renderSource(item)}
    `;
  }

  function parseInvestingDateTime(value) {
    const text = safeText(value, "").trim();

    const match = text.match(
      /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/
    );

    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      const hour = Number(match[4]);
      const minute = Number(match[5]);
      const second = match[6] ? Number(match[6]) : 0;

      const date = new Date(year, month, day, hour, minute, second);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    const fallbackDate = new Date(text);

    if (!Number.isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }

    return null;
  }

  function formatRussianDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return "Нет даты";
    }

    return `${date.getDate()} ${RUSSIAN_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  }

  function formatLiveUpdateDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return safeText(value, "Автообновление");
    }

    const day = date.getDate();
    const month = RUSSIAN_MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  }

  function isSameCalendarDay(firstDate, secondDate) {
    if (!firstDate || !secondDate) {
      return false;
    }

    return (
      firstDate.getFullYear() === secondDate.getFullYear() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getDate() === secondDate.getDate()
    );
  }

  function hasAnyValue(event) {
    return Boolean(event.actual || event.previous || event.forecast);
  }

  function isHolidayEvent(event) {
    const text = normalizeText(event.event);

    if (!text) {
      return true;
    }

    const looksLikeHoliday =
      text.includes("holiday") ||
      text.includes("bank holiday") ||
      text.includes("labor day") ||
      text.includes("greenery day") ||
      text.includes("memorial day");

    return looksLikeHoliday && !hasAnyValue(event);
  }

  function normalizeLiveEvent(rawEvent) {
    const date = parseInvestingDateTime(rawEvent.dateTime);

    if (!date) {
      return null;
    }

    const event = safeText(rawEvent.event, "").trim();
    const country = safeText(rawEvent.country, "").trim();

    if (!event) {
      return null;
    }

    const normalizedEvent = {
      id: safeText(rawEvent.id, ""),
      date,
      timestamp: date.getTime(),
      dateTime: rawEvent.dateTime,
      time: safeText(rawEvent.time, ""),
      country,
      event,
      actual: normalizeNullableValue(rawEvent.actual),
      forecast: normalizeNullableValue(rawEvent.forecast),
      previous: normalizeNullableValue(rawEvent.previous),
      importance: safeText(rawEvent.importance, "Низкая"),
      importanceLevel: Number(rawEvent.importanceLevel) || 1
    };

    if (isHolidayEvent(normalizedEvent)) {
      return null;
    }

    return normalizedEvent;
  }

  function normalizeNullableValue(value) {
    const text = safeText(value, "").trim();

    if (!text || text === "-" || text === "—") {
      return null;
    }

    return text;
  }

  function prepareLiveEvents(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    const seen = new Set();
    const events = [];

    items.forEach((rawEvent) => {
      const event = normalizeLiveEvent(rawEvent);

      if (!event) {
        return;
      }

      const fingerprint = [
        event.id,
        event.dateTime,
        event.country,
        event.event
      ].join("|");

      if (seen.has(fingerprint)) {
        return;
      }

      seen.add(fingerprint);
      events.push(event);
    });

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  function eventText(event) {
    return `${event.country || ""} ${event.event || ""}`.toLowerCase();
  }

  function isUnitedStates(event) {
    return normalizeText(event.country) === "united states";
  }

  function matchesCalendarKey(key, event) {
    const text = eventText(event);

    if (key === "cpi") {
      return (
        isUnitedStates(event) &&
        (
          /\bcpi\b/i.test(event.event) ||
          /consumer price index/i.test(event.event)
        ) &&
        !/\bppi\b/i.test(event.event)
      );
    }

    if (key === "nfp") {
      return (
        isUnitedStates(event) &&
        (
          /nonfarm payrolls/i.test(event.event) ||
          /non-farm payrolls/i.test(event.event) ||
          /unemployment rate/i.test(event.event) ||
          /average hourly earnings/i.test(event.event) ||
          /participation rate/i.test(event.event)
        )
      );
    }

    if (key === "fomc") {
  const noisyFedStats =
    /reserve balances/i.test(event.event) ||
    /federal reserve banks/i.test(event.event) ||
    /h\.4\.1/i.test(event.event) ||
    /commercial paper/i.test(event.event) ||
    /consumer credit/i.test(event.event) ||
    /money supply/i.test(event.event);

  if (noisyFedStats) {
    return false;
  }

  return (
    isUnitedStates(event) &&
    (
      /fomc/i.test(event.event) ||
      /fed interest rate decision/i.test(event.event) ||
      /federal open market committee/i.test(event.event) ||
      /monetary policy statement/i.test(event.event) ||
      /fed press conference/i.test(event.event) ||
      /fomc minutes/i.test(event.event)
    )
  );
}

    if (key === "gdp") {
      return (
        isUnitedStates(event) &&
        (
          /\bgdp\b/i.test(event.event) ||
          /gross domestic product/i.test(event.event)
        )
      );
    }

    if (key === "rateDecisions") {
      return (
        /interest rate decision/i.test(event.event) ||
        /rate decision/i.test(event.event) ||
        /fed interest rate/i.test(text) ||
        /ecb interest rate/i.test(text) ||
        /boe interest rate/i.test(text) ||
        /boj interest rate/i.test(text) ||
        /bank of canada interest rate/i.test(text) ||
        /rba interest rate/i.test(text) ||
        /rbnz interest rate/i.test(text) ||
        /snb interest rate/i.test(text)
      );
    }

    if (key === "speeches") {
      return (
        /press conference/i.test(event.event) ||
        /speaks/i.test(event.event) ||
        /speech/i.test(event.event) ||
        /testifies/i.test(event.event) ||
        /meeting minutes/i.test(event.event) ||
        /fomc minutes/i.test(event.event) ||
        /ecb minutes/i.test(event.event) ||
        /fed chair/i.test(event.event) ||
        /ecb president/i.test(event.event) ||
        /boe governor/i.test(event.event) ||
        /boj governor/i.test(event.event) ||
        /powell/i.test(event.event) ||
        /lagarde/i.test(event.event)
      );
    }

    return false;
  }

  function getMetricPriority(key, event) {
    const name = normalizeText(event.event);

    if (key === "cpi") {
      if (name.includes("core cpi") && name.includes("yoy")) return 1;
      if (name.includes("core cpi") && name.includes("mom")) return 2;
      if (name.includes("cpi") && name.includes("yoy")) return 3;
      if (name.includes("cpi") && name.includes("mom")) return 4;
      return 9;
    }

    if (key === "nfp") {
      if (name.includes("nonfarm payrolls")) return 1;
      if (name.includes("unemployment rate")) return 2;
      if (name.includes("average hourly earnings") && name.includes("mom")) return 3;
      if (name.includes("average hourly earnings") && name.includes("yoy")) return 4;
      return 9;
    }

    if (key === "fomc") {
      if (name.includes("interest rate decision")) return 1;
      if (name.includes("fomc statement")) return 2;
      if (name.includes("press conference")) return 3;
      return 9;
    }

    if (key === "gdp") {
      if (name.includes("gdp") && name.includes("qoq")) return 1;
      if (name.includes("gdp") && name.includes("annualized")) return 2;
      if (name.includes("gdp price index")) return 3;
      return 9;
    }

    if (key === "rateDecisions") {
      if (name.includes("fed")) return 1;
      if (name.includes("ecb")) return 2;
      if (name.includes("boe")) return 3;
      if (name.includes("boj")) return 4;
      return 9;
    }

    return 9;
  }

  function selectMetricEvents(key, matchedEvents) {
    const now = Date.now();

    const pastEvents = matchedEvents
      .filter((event) => event.timestamp <= now && hasAnyValue(event))
      .sort((a, b) => b.timestamp - a.timestamp);

    const futureEvents = matchedEvents
      .filter((event) => event.timestamp > now && hasAnyValue(event))
      .sort((a, b) => a.timestamp - b.timestamp);

    if (key === "rateDecisions") {
      const sourceEvents = pastEvents.length > 0 ? pastEvents : futureEvents;

      return sourceEvents
        .slice()
        .sort((a, b) => {
          const priorityDiff = getMetricPriority(key, a) - getMetricPriority(key, b);

          if (priorityDiff !== 0) {
            return priorityDiff;
          }

          return b.timestamp - a.timestamp;
        })
        .slice(0, 6);
    }

    const sourceEvents = pastEvents.length > 0 ? pastEvents : futureEvents;

    if (sourceEvents.length === 0) {
      return [];
    }

    const anchorEvent = sourceEvents[0];

    const sameDayEvents = sourceEvents.filter((event) => {
      return isSameCalendarDay(event.date, anchorEvent.date);
    });

    return sameDayEvents
      .sort((a, b) => {
        const priorityDiff = getMetricPriority(key, a) - getMetricPriority(key, b);

        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        return a.timestamp - b.timestamp;
      })
      .slice(0, 6);
  }

  function selectUpcomingEvents(key, matchedEvents) {
    const now = Date.now();

    return matchedEvents
      .filter((event) => event.timestamp > now)
      .sort((a, b) => {
        const priorityDiff = getMetricPriority(key, a) - getMetricPriority(key, b);

        if (key !== "rateDecisions" && priorityDiff !== 0) {
          return a.timestamp - b.timestamp;
        }

        return a.timestamp - b.timestamp;
      })
      .slice(0, 8);
  }

  function eventToMetric(event) {
    return {
      name: event.event,
      actual: event.actual || "Еще не опубликован",
      previous: event.previous || "Нет данных",
      forecast: event.forecast || "Нет данных"
    };
  }

  function eventToUpcomingEvent(event) {
    return {
      name: event.event,
      date: formatRussianDate(event.date),
      time: event.time || "Нет времени",
      importance: event.importance || "Низкая"
    };
  }

  function eventToRelease(event) {
    return {
      title: event.event,
      date: formatRussianDate(event.date),
      time: event.time || "Нет времени"
    };
  }

  function buildLivePatchForItem(key, item, matchedEvents, livePayload) {
    const now = Date.now();

    const sortedEvents = matchedEvents
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp);

    const pastEvents = sortedEvents
      .filter((event) => event.timestamp <= now)
      .sort((a, b) => b.timestamp - a.timestamp);

    const futureEvents = sortedEvents
      .filter((event) => event.timestamp > now)
      .sort((a, b) => a.timestamp - b.timestamp);

    const metricEvents = selectMetricEvents(key, sortedEvents);
    const upcomingEvents = selectUpcomingEvents(key, sortedEvents);

    const lastReleaseEvent =
      pastEvents.find((event) => hasAnyValue(event)) ||
      pastEvents[0] ||
      null;

    const nextReleaseEvent = futureEvents[0] || null;

    const patch = {
      _liveStatus: "fresh",
      _liveSource: livePayload.source || "Investing.com",
      _liveUpdatedAt: livePayload.updatedAt || new Date().toISOString()
    };

    if (metricEvents.length > 0) {
      patch.metrics = metricEvents.map(eventToMetric);
    }

    if (upcomingEvents.length > 0) {
      patch.upcomingEvents = upcomingEvents.map(eventToUpcomingEvent);
    }

    if (lastReleaseEvent) {
      patch.lastRelease = eventToRelease(lastReleaseEvent);
    }

    if (nextReleaseEvent) {
      patch.nextRelease = eventToRelease(nextReleaseEvent);
    }

    return patch;
  }

  function mergeCalendarWithLiveData(baseData, livePayload) {
    const clonedData = cloneData(baseData);
    const liveEvents = prepareLiveEvents(livePayload.items);

    if (!clonedData.items || liveEvents.length === 0) {
      return clonedData;
    }

    Object.keys(clonedData.items).forEach((key) => {
      const item = clonedData.items[key];

      const matchedEvents = liveEvents.filter((event) => {
        return matchesCalendarKey(key, event);
      });

      if (matchedEvents.length === 0) {
        item._liveStatus = "missing";
        return;
      }

      const patch = buildLivePatchForItem(key, item, matchedEvents, livePayload);

      clonedData.items[key] = {
        ...item,
        ...patch
      };
    });

    clonedData.updatedAt = formatLiveUpdateDate(livePayload.updatedAt);
    clonedData.liveSource = livePayload.source || "Investing.com";
    clonedData.liveRowsFound = livePayload.rowsFound || liveEvents.length;

    return clonedData;
  }

  async function fetchLiveCalendarData() {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, LIVE_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(LIVE_CALENDAR_API_URL, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "Accept": "application/json"
        }
      });

      const data = await response.json();

      if (!response.ok || !data || data.ok === false) {
        throw new Error(data && data.error ? data.error : `HTTP ${response.status}`);
      }

      return data;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function rerenderCalendar() {
    renderCalendarPage();
    renderDetailPage();
  }

  async function loadLiveCalendarData() {
    const baseData = getBaseCalendarData();

    if (!baseData || liveCalendarLoaded) {
      return;
    }

    try {
      const livePayload = await fetchLiveCalendarData();

      activeCalendarData = mergeCalendarWithLiveData(baseData, livePayload);
      liveCalendarLoaded = true;
      liveCalendarError = null;

      rerenderCalendar();

      console.log("calendar live data loaded", {
        source: livePayload.source,
        rowsFound: livePayload.rowsFound,
        updatedAt: livePayload.updatedAt
      });
    } catch (error) {
      liveCalendarError = error;
      console.warn("calendar live data failed", error);
    }
  }

  function initCalendarRender() {
    rerenderCalendar();
    loadLiveCalendarData();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCalendarRender);
  } else {
    initCalendarRender();
  }

  window.calendarRender = {
    renderCalendarPage,
    renderDetailPage,
    getCalendarItems,
    loadLiveCalendarData,
    getLiveStatus: function () {
      return {
        loaded: liveCalendarLoaded,
        error: liveCalendarError ? liveCalendarError.message : null,
        source: activeCalendarData ? activeCalendarData.liveSource : null,
        updatedAt: activeCalendarData ? activeCalendarData.updatedAt : null
      };
    }
  };
}());
