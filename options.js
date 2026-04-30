(() => {
  const breezeFill = globalThis.BreezeFill;

  const profileKeys = breezeFill.constants.PROFILE_FIELD_META.map((field) => field.key);
  let statusTimer = null;

  const elements = {
    statProfile: document.getElementById("statProfile"),
    statMemories: document.getElementById("statMemories"),
    statMuted: document.getElementById("statMuted"),
    profileForm: document.getElementById("profileForm"),
    saveProfileButton: document.getElementById("saveProfileButton"),
    enabled: document.getElementById("setting-enabled"),
    promptToSave: document.getElementById("setting-promptToSave"),
    maxSuggestions: document.getElementById("setting-maxSuggestions"),
    clearMemoriesButton: document.getElementById("clearMemoriesButton"),
    clearMutedButton: document.getElementById("clearMutedButton"),
    memoryList: document.getElementById("memoryList"),
    memoryEmptyState: document.getElementById("memoryEmptyState"),
    statusBanner: document.getElementById("statusBanner"),
    tabButtons: Array.from(document.querySelectorAll("[data-tab]")),
    tabPanels: Array.from(document.querySelectorAll("[data-panel]"))
  };

  function showStatus(message) {
    elements.statusBanner.textContent = message;
    elements.statusBanner.classList.add("is-visible");

    if (statusTimer) {
      window.clearTimeout(statusTimer);
    }

    statusTimer = window.setTimeout(() => {
      elements.statusBanner.classList.remove("is-visible");
    }, 2400);
  }

  function profileDataFromForm() {
    const formData = new FormData(elements.profileForm);
    return Object.fromEntries(profileKeys.map((key) => [key, formData.get(key) || ""]));
  }

  function fillProfile(profile) {
    profileKeys.forEach((key) => {
      const input = document.getElementById(`profile-${key}`);
      if (input) {
        input.value = profile[key] || "";
      }
    });
  }

  function renderMetrics(state) {
    elements.statProfile.textContent = `${breezeFill.storage.profileCompletion(
      state.profile
    )}/${profileKeys.length}`;
    elements.statMemories.textContent = String(breezeFill.storage.countMemories(state));
    elements.statMuted.textContent = String(state.ignoredOrigins.length);
  }

  function renderSettings(settings) {
    elements.enabled.checked = settings.enabled;
    elements.promptToSave.checked = settings.promptToSave;
    elements.maxSuggestions.value = String(settings.maxSuggestions);
  }

  function setActiveTab(tabName) {
    elements.tabButtons.forEach((button) => {
      const active = button.dataset.tab === tabName;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });

    elements.tabPanels.forEach((panel) => {
      const active = panel.dataset.panel === tabName;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
  }

  function renderMemories(state) {
    const rows = breezeFill.storage.listMemories(state, 60);
    elements.memoryList.textContent = "";
    elements.memoryEmptyState.hidden = rows.length > 0;

    rows.forEach((row) => {
      const item = document.createElement("div");
      item.className = "memory-row";

      const content = document.createElement("div");

      const label = document.createElement("div");
      label.className = "memory-row__label";
      label.textContent = row.label;

      const badge = document.createElement("span");
      badge.className = "memory-row__badge";
      badge.textContent = row.badge;
      label.appendChild(badge);

      const value = document.createElement("div");
      value.className = "memory-row__value";
      value.textContent = row.value;

      content.appendChild(label);
      content.appendChild(value);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "button button--ghost memory-row__remove";
      removeButton.textContent = "Remove";
      removeButton.dataset.scope = row.scope;
      removeButton.dataset.key = row.key;
      removeButton.dataset.value = row.value;

      if (row.origin) {
        removeButton.dataset.origin = row.origin;
      }

      item.appendChild(content);
      item.appendChild(removeButton);
      elements.memoryList.appendChild(item);
    });
  }

  async function load() {
    const state = await breezeFill.storage.getState();
    fillProfile(state.profile);
    renderMetrics(state);
    renderSettings(state.settings);
    renderMemories(state);
  }

  async function saveProfile(event) {
    event.preventDefault();
    await breezeFill.storage.saveProfile(profileDataFromForm());
    showStatus("Profile saved.");
    await load();
  }

  async function updateSettings() {
    await breezeFill.storage.saveSettings({
      enabled: elements.enabled.checked,
      promptToSave: elements.promptToSave.checked,
      maxSuggestions: Number(elements.maxSuggestions.value)
    });

    showStatus("Settings updated.");
    await load();
  }

  async function clearMemories() {
    if (!confirm("Clear all saved autofill responses?")) {
      return;
    }

    await breezeFill.storage.clearMemories();
    showStatus("All saved responses cleared.");
    await load();
  }

  async function clearMutedSites() {
    if (!confirm("Allow BreezeFill to ask again on every muted site?")) {
      return;
    }

    await breezeFill.storage.clearIgnoredOrigins();
    showStatus("Muted sites cleared.");
    await load();
  }

  async function onMemoryAction(event) {
    const button = event.target.closest("button[data-scope]");
    if (!button) {
      return;
    }

    await breezeFill.storage.removeMemory({
      scope: button.dataset.scope,
      key: button.dataset.key,
      origin: button.dataset.origin,
      value: button.dataset.value
    });

    showStatus("Saved response removed.");
    await load();
  }

  async function init() {
    await load();
    setActiveTab("personal");

    elements.profileForm.addEventListener("submit", saveProfile);
    elements.tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setActiveTab(button.dataset.tab);
      });
    });
    elements.enabled.addEventListener("change", updateSettings);
    elements.promptToSave.addEventListener("change", updateSettings);
    elements.maxSuggestions.addEventListener("change", updateSettings);
    elements.clearMemoriesButton.addEventListener("click", clearMemories);
    elements.clearMutedButton.addEventListener("click", clearMutedSites);
    elements.memoryList.addEventListener("click", onMemoryAction);
    chrome.storage.onChanged.addListener(() => {
      load().catch(() => {
        return undefined;
      });
    });
  }

  init().catch((error) => {
    showStatus(error.message);
  });
})();
