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

  const LIVE_CALENDAR_API_URL = "/api/calendar";
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
    return data && data.items ? data.items : {};
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

  function hasPlaceholderValue(value) {
    const normalized = normalizeText(value);

    if (!normalized) {
      return true;
    }

    return (
      normalized === "-" ||
      normalized === "—" ||
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

  function isEventObjectPast(event) {
    if (!event || !event.date) {
      return false;
    }

    return isPastDate(event.date);
  }

  function getImportanceLevel(importance) {
    if (importance === "Высокая") return 3;
    if (importance === "Средняя") return 2;
    return 1;
  }

  function getImportanceClass(importance) {
    if (importance === "Высокая") return "calendar-importance-high";
    if (importance === "Средняя") return "calendar-importance-medium";
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

  function itemNeedsUpdate(item) {
    if (!item) {
      return true;
    }

    if (item._liveStatus === "fresh") {
      return false;
    }

    if (item._liveStatus === "error") {
      return true;
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

  function getNextEvent(item) {
    if (item && Array.isArray(item.upcomingEvents) && item.upcomingEvents.length > 0) {
      const futureEvents = item.upcomingEvents.filter((event) => !isEventObjectPast(event));

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
      return !metricName.includes("следующий релиз") && !metricName.includes("следующее событие");
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

    if (!data || !data.items) {
      detailContainer.innerHTML = `
        <a href="calendar-page.html" class="back-pill">Назад к календарю</a>
        ${renderErrorCard(
          "Календарь не загрузился",
          "Файл calendar-data.js не подключился или содержит ошибку. Проверь путь к файлу и синтаксис JavaScript."
        )}
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
        ${renderReleaseCard("Следующий релиз", getDisplayNextRelease(item), true)}
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

  async function fetchLiveCalendarData() {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), LIVE_FETCH_TIMEOUT_MS);

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

      if (!data.items) {
        throw new Error("API календаря не вернул items");
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

      activeCalendarData = {
        ...baseData,
        ...livePayload,
        items: {
          ...baseData.items,
          ...livePayload.items
        }
      };

      liveCalendarLoaded = true;
      liveCalendarError = null;
      rerenderCalendar();

      console.log("calendar live data loaded", {
        source: livePayload.source,
        updatedAt: livePayload.updatedAt,
        cache: livePayload.cache
      });
    } catch (error) {
      liveCalendarError = error;
      console.warn("calendar live data failed", error);
      rerenderCalendar();
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
        source: activeCalendarData ? activeCalendarData.source : null,
        updatedAt: activeCalendarData ? activeCalendarData.updatedAt : null
      };
    }
  };
}());