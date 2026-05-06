(function () {
  function createSymbolInfoWidget(container, symbol) {
    if (!container || !symbol) {
      return;
    }

    if (container.dataset.tvLoaded === "true") {
      return;
    }

    container.dataset.tvLoaded = "true";
    container.innerHTML = "";

    const widgetBox = document.createElement("div");
    widgetBox.className = "tradingview-widget-container__widget";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";
    script.async = true;

    script.text = JSON.stringify({
      symbol: symbol,
      width: "100%",
      locale: "ru",
      colorTheme: "light",
      isTransparent: true
    });

    container.appendChild(widgetBox);
    container.appendChild(script);
  }

  window.renderTradingViewRateWidgets = function renderTradingViewRateWidgets() {
    const widgets = document.querySelectorAll("[data-tv-symbol]");

    widgets.forEach((container) => {
      const symbol = container.dataset.tvSymbol;
      createSymbolInfoWidget(container, symbol);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.renderTradingViewRateWidgets);
  } else {
    window.renderTradingViewRateWidgets();
  }
})();