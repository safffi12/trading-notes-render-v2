(async function () {
  const detailRoot = document.getElementById("ratesDetail");

  if (!detailRoot) {
    return;
  }

  function safeText(value, fallback = "—") {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }

    return String(value);
  }

  function escapeHtml(value) {
    return safeText(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderList(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return "<p>Нет данных.</p>";
    }

    return `
      <ul class="rate-detail-list">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    `;
  }

  function renderRelated(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return "<p>Нет связанных инструментов.</p>";
    }

    return `
      <div class="rate-related-list">
        ${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
    `;
  }

  function renderSource(item) {
    const sourceName = safeText(item.sourceName, "Источник");
    const sourceUrl = safeText(item.sourceUrl, "");

    if (!sourceUrl || sourceUrl === "—") {
      return `<p class="rate-source">Источник: ${escapeHtml(sourceName)}</p>`;
    }

    return `
      <p class="rate-source">
        Источник:
        <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(sourceName)}
        </a>
      </p>
    `;
  }

  if (window.loadRatesLiveData) {
  await window.loadRatesLiveData();
}

  const data = window.ratesData;

  if (!data || !data.items) {
    detailRoot.innerHTML = `
      <section class="rate-empty">
        <h1>Данные не загрузились</h1>
        <p>Файл rates-data.js не найден или подключен неправильно.</p>
        <a href="../rates.html" class="page-back">← Назад к ставкам</a>
      </section>
    `;
    return;
  }

  const key = document.body.dataset.rateKey;
  const item = data.items[key];

  if (!key || !item) {
    detailRoot.innerHTML = `
      <section class="rate-empty">
        <h1>Раздел не найден</h1>
        <p>Для этой страницы не найден ключ data-rate-key.</p>
        <a href="../rates.html" class="page-back">← Назад к ставкам</a>
      </section>
    `;
    return;
  }

  document.title = `${safeText(item.title)} - Trading Notes`;

  detailRoot.innerHTML = `
    <header class="rate-detail-hero">
      <div>
        <span class="rates-kicker">${escapeHtml(item.type)}</span>
        <h1>${escapeHtml(item.title)}</h1>
        <p>${escapeHtml(item.summary)}</p>
      </div>

      <div class="rate-detail-value-card">
        <span>${escapeHtml(item.region)}</span>
        <strong>${escapeHtml(item.currentValue)}</strong>
        <small>${escapeHtml(item.change)}</small>
      </div>
    </header>

    <section class="rate-facts-grid">
      <article class="rate-fact-card">
        <span>Регион</span>
        <strong>${escapeHtml(item.region)}</strong>
      </article>

      <article class="rate-fact-card">
        <span>Последнее решение</span>
        <strong>${escapeHtml(item.lastDecision)}</strong>
      </article>

      <article class="rate-fact-card">
        <span>Следующее событие</span>
        <strong>${escapeHtml(item.nextMeeting)}</strong>
      </article>

      <article class="rate-fact-card">
        <span>Обновлено</span>
        <strong>${escapeHtml(data.updatedAt)}</strong>
      </article>
    </section>

    <section class="rate-detail-section">
      <h2>Что это такое</h2>
      <p>${escapeHtml(item.definition)}</p>
    </section>

    <section class="rate-detail-section">
      <h2>Почему это важно</h2>
      <p>${escapeHtml(item.importance)}</p>
    </section>

    <section class="rate-detail-section">
      <h2>На что смотреть</h2>
      ${renderList(item.watch)}
    </section>

    <section class="rate-detail-section">
      <h2>Рыночная интерпретация</h2>

      <div class="rate-reaction-grid">
        <article class="rate-reaction-card">
          <span>Hawkish / жестче ожиданий</span>
          <p>${escapeHtml(item.marketReaction && item.marketReaction.hawkish)}</p>
        </article>

        <article class="rate-reaction-card">
          <span>Dovish / мягче ожиданий</span>
          <p>${escapeHtml(item.marketReaction && item.marketReaction.dovish)}</p>
        </article>
      </div>
    </section>

    <section class="rate-detail-section">
      <h2>Связанные инструменты</h2>
      ${renderRelated(item.related)}
    </section>

    ${renderSource(item)}

    <a href="../rates.html" class="page-back">← Назад к ставкам</a>
  `;
})();