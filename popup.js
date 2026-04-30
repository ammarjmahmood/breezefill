(() => {
  const breezeFill = globalThis.BreezeFill;

  const elements = {
    enabledToggle: document.getElementById("enabledToggle"),
    memoryCount: document.getElementById("memoryCount"),
    profileCount: document.getElementById("profileCount"),
    mutedCount: document.getElementById("mutedCount"),
    quickProfileForm: document.getElementById("quickProfileForm"),
    fullName: document.getElementById("fullName"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    openOptionsButton: document.getElementById("openOptionsButton"),
    clearMemoriesButton: document.getElementById("clearMemoriesButton"),
    statusMessage: document.getElementById("statusMessage")
  };

  function showStatus(message) {
    elements.statusMessage.textContent = message;
  }

  function render(state) {
    elements.enabledToggle.checked = state.settings.enabled;
    elements.fullName.value = state.profile.fullName;
    elements.email.value = state.profile.email;
    elements.phone.value = state.profile.phone;
    elements.memoryCount.textContent = String(breezeFill.storage.countMemories(state));
    elements.profileCount.textContent = `${breezeFill.storage.profileCompletion(
      state.profile
    )}/${breezeFill.constants.PROFILE_FIELD_META.length}`;
    elements.mutedCount.textContent = String(state.ignoredOrigins.length);
  }

  async function load() {
    const state = await breezeFill.storage.getState();
    render(state);
  }

  async function saveQuickProfile(event) {
    event.preventDefault();

    await breezeFill.storage.saveProfile({
      fullName: elements.fullName.value,
      email: elements.email.value,
      phone: elements.phone.value
    });

    showStatus("Quick profile saved.");
    await load();
  }

  async function toggleEnabled() {
    await breezeFill.storage.saveSettings({
      enabled: elements.enabledToggle.checked
    });

    showStatus(
      elements.enabledToggle.checked
        ? "BreezeFill is active."
        : "BreezeFill is paused."
    );
  }

  async function clearMemories() {
    if (!confirm("Clear all saved autofill responses?")) {
      return;
    }

    await breezeFill.storage.clearMemories();
    showStatus("Saved responses cleared.");
    await load();
  }

  async function openOptions() {
    chrome.runtime.openOptionsPage();
    window.close();
  }

  async function init() {
    await load();

    elements.quickProfileForm.addEventListener("submit", saveQuickProfile);
    elements.enabledToggle.addEventListener("change", toggleEnabled);
    elements.clearMemoriesButton.addEventListener("click", clearMemories);
    elements.openOptionsButton.addEventListener("click", openOptions);
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
