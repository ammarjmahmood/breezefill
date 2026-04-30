const config = {
  chromeStoreUrl: "",
  githubRepoUrl: "https://github.com/ammarjmahmood/breezefill",
  githubZipUrl: "https://github.com/ammarjmahmood/breezefill/archive/refs/heads/main.zip"
};

function setInstallLink() {
  const primaryLink = document.querySelector("[data-install-link]");
  const storeTab = document.querySelector('[data-tab="store"]');
  const githubTab = document.querySelector('[data-tab="github"]');
  const storePanel = document.querySelector('[data-panel="store"]');
  const githubPanel = document.querySelector('[data-panel="github"]');

  if (!primaryLink) {
    return;
  }

  if (config.chromeStoreUrl) {
    primaryLink.href = config.chromeStoreUrl;
    primaryLink.textContent = "Add to Chrome";

    if (storeTab && githubTab && storePanel && githubPanel) {
      storeTab.classList.add("is-active");
      storeTab.setAttribute("aria-selected", "true");
      githubTab.classList.remove("is-active");
      githubTab.setAttribute("aria-selected", "false");
      storePanel.hidden = false;
      storePanel.classList.add("is-active");
      githubPanel.hidden = true;
      githubPanel.classList.remove("is-active");
    }

    return;
  }

  primaryLink.href = config.githubZipUrl;
  primaryLink.textContent = "Install from GitHub";
}

function initTabs() {
  const buttons = Array.from(document.querySelectorAll("[data-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-panel]"));

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.tab;

      buttons.forEach((item) => {
        const active = item.dataset.tab === target;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });

      panels.forEach((panel) => {
        const active = panel.dataset.panel === target;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });
    });
  });
}

function initReveal() {
  const sections = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => {
      section.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15
    }
  );

  sections.forEach((section) => {
    observer.observe(section);
  });
}

setInstallLink();
initTabs();
initReveal();
