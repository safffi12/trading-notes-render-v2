document.addEventListener("DOMContentLoaded", () => {
  const data = window.ARTICLES_DATA;

  if (!data || !Array.isArray(data.sections) || !Array.isArray(data.articles)) {
    return;
  }

  renderTopNavigation(data);
  renderArticleLists(data);
});

function renderTopNavigation(data) {
  const navContainers = document.querySelectorAll(".nav-links");

  navContainers.forEach((nav) => {
    nav.innerHTML = data.sections
      .map((section) => {
        const articles = data.articles.filter((article) => article.category === section.id);

        const dropdownItems = articles.length
          ? articles
              .map((article) => {
                return `<a href="${article.href}">${article.title}</a>`;
              })
              .join("")
          : `<a href="${section.href}">Все статьи</a>`;

        return `
          <div class="nav-item">
            <a href="${section.href}" class="nav-link">${section.title}</a>

            <div class="dropdown-menu">
              ${dropdownItems}
            </div>
          </div>
        `;
      })
      .join("");
  });
}

function renderArticleLists(data) {
  const articleLists = document.querySelectorAll("[data-article-list]");

  articleLists.forEach((list) => {
    const category = list.dataset.articleList;
    const articles = data.articles.filter((article) => article.category === category);

    if (!articles.length) {
      list.innerHTML = `<p class="empty-articles">В этом разделе пока нет статей.</p>`;
      return;
    }

    list.innerHTML = articles
      .map((article) => {
        return `
          <a href="${article.href}" class="article-list-item">
            <h2>${article.title}</h2>
          </a>
        `;
      })
      .join("");
  });
}