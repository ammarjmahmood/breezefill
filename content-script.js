(() => {
  const breezeFill = globalThis.BreezeFill;
  const SINGLE_FIELD_SAVE_KEYS = new Set([
    "email",
    "phone",
    "fullName",
    "linkedin",
    "github",
    "portfolio",
    "schoolName",
    "graduationInfo"
  ]);
  const pageState = {
    activeField: null,
    activeDescriptor: null,
    cachedState: breezeFill.storage.normalizeState({}),
    suggestions: [],
    selectedIndex: -1,
    suggestionRoot: null,
    suggestionList: null,
    promptRoot: null,
    promptCandidates: [],
    promptFingerprint: "",
    dismissedFingerprints: new Set(),
    formDrafts: new Map(),
    formTimers: new Map()
  };

  function runtimeMessage(payload) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(payload, (response) => {
        const error = chrome.runtime.lastError;

        if (error) {
          reject(new Error(error.message));
          return;
        }

        if (!response || !response.ok) {
          reject(new Error((response && response.error) || "Extension request failed."));
          return;
        }

        resolve(response);
      });
    });
  }

  function escapeHost(origin) {
    try {
      return new URL(origin).hostname || "this site";
    } catch (_error) {
      return "this site";
    }
  }

  async function refreshState() {
    pageState.cachedState = await breezeFill.storage.getState();

    if (!pageState.cachedState.settings.enabled) {
      hideSuggestions();
      hidePrompt();
    }
  }

  function createSuggestionShell() {
    const root = document.createElement("div");
    root.className = "breezefill-suggestions";
    root.hidden = true;

    const list = document.createElement("div");
    list.className = "breezefill-suggestions__list";

    root.appendChild(list);
    document.documentElement.appendChild(root);

    root.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });

    root.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-index]");
      if (!button) {
        return;
      }

      const index = Number(button.dataset.index);
      const suggestion = pageState.suggestions[index];
      if (suggestion && pageState.activeField) {
        applySuggestion(pageState.activeField, suggestion.value);
      }
    });

    pageState.suggestionRoot = root;
    pageState.suggestionList = list;
  }

  function createPromptShell() {
    const root = document.createElement("aside");
    root.className = "breezefill-prompt";
    root.hidden = true;
    document.documentElement.appendChild(root);

    root.addEventListener("click", async (event) => {
      const action = event.target.closest("[data-action]");
      if (!action) {
        return;
      }

      const actionName = action.dataset.action;

      if (actionName === "save") {
        const candidates = pageState.promptCandidates.slice();
        const fingerprint = pageState.promptFingerprint;
        await runtimeMessage({
          type: "SAVE_RESPONSE_SET",
          origin: location.origin,
          candidates
        });
        pageState.dismissedFingerprints.add(fingerprint);
        hidePrompt();
        await refreshState();
        showToast("Saved for next time.");
      }

      if (actionName === "dismiss") {
        pageState.dismissedFingerprints.add(pageState.promptFingerprint);
        hidePrompt();
      }

      if (actionName === "mute") {
        await runtimeMessage({
          type: "IGNORE_ORIGIN",
          origin: location.origin
        });
        hidePrompt();
        await refreshState();
        showToast(`Will stay quiet on ${escapeHost(location.origin)}.`);
      }
    });

    pageState.promptRoot = root;
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "breezefill-toast";
    toast.textContent = message;
    document.documentElement.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => {
        toast.remove();
      }, 180);
    }, 2200);
  }

  function normalizeValue(value) {
    return breezeFill.matchers.cleanText(value).toLowerCase();
  }

  function isSameValue(left, right) {
    return normalizeValue(left) === normalizeValue(right);
  }

  function summarizeFields(candidates) {
    const labels = Array.from(
      new Set(
        candidates
          .map((candidate) => breezeFill.matchers.cleanText(candidate.descriptor.label).toLowerCase())
          .filter(Boolean)
      )
    );

    if (!labels.length) {
      return "details";
    }

    if (labels.length === 1) {
      return labels[0];
    }

    if (labels.length === 2) {
      return `${labels[0]} and ${labels[1]}`;
    }

    return `${labels[0]}, ${labels[1]}, and ${labels.length - 2} more`;
  }

  function promptTitle(candidates) {
    return `Save your ${summarizeFields(candidates)} for next time?`;
  }

  function shouldAllowSingleFieldPrompt(candidates) {
    return candidates.some((candidate) =>
      SINGLE_FIELD_SAVE_KEYS.has(candidate.descriptor.semanticKey)
    );
  }

  function findFieldInPath(eventOrTarget) {
    const path =
      eventOrTarget && typeof eventOrTarget.composedPath === "function"
        ? eventOrTarget.composedPath()
        : [eventOrTarget];

    for (const node of path) {
      if (
        node instanceof HTMLInputElement ||
        node instanceof HTMLTextAreaElement ||
        node instanceof HTMLSelectElement
      ) {
        return node;
      }
    }

    return null;
  }

  function getFieldTarget(eventOrTarget) {
    const field = findFieldInPath(eventOrTarget);
    if (!field) {
      return null;
    }

    const descriptor = breezeFill.matchers.describeField(field);
    if (!descriptor || descriptor.sensitive) {
      return null;
    }

    return {
      field,
      descriptor
    };
  }

  function fieldValueSetter(field) {
    if (field instanceof HTMLSelectElement) {
      return null;
    }

    if (field instanceof HTMLTextAreaElement) {
      return Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value"
      );
    }

    return Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  }

  function applySuggestion(field, value) {
    if (field instanceof HTMLSelectElement) {
      const normalized = normalizeValue(value);
      const matchingOption = Array.from(field.options).find((option) => {
        return (
          normalizeValue(option.value) === normalized ||
          normalizeValue(option.textContent) === normalized
        );
      });

      if (matchingOption) {
        field.value = matchingOption.value;
      }
    } else {
      const setter = fieldValueSetter(field);
      if (setter && setter.set) {
        setter.set.call(field, value);
      } else {
        field.value = value;
      }
    }

    if (field instanceof HTMLSelectElement) {
      field.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    } else {
      field.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          composed: true,
          inputType: "insertReplacementText",
          data: value
        })
      );
    }

    field.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    field.focus();
    hideSuggestions();

    const descriptor = breezeFill.matchers.describeField(field);
    if (descriptor) {
      trackFieldDraft(field, descriptor);
    }
  }

  function hideSuggestions() {
    pageState.suggestions = [];
    pageState.selectedIndex = -1;
    pageState.activeField = null;
    pageState.activeDescriptor = null;

    if (pageState.suggestionRoot) {
      pageState.suggestionRoot.hidden = true;
    }
  }

  function updateSelectedSuggestion() {
    if (!pageState.suggestionList) {
      return;
    }

    const buttons = pageState.suggestionList.querySelectorAll("button[data-index]");
    buttons.forEach((button) => {
      button.classList.toggle(
        "is-active",
        Number(button.dataset.index) === pageState.selectedIndex
      );
    });
  }

  function positionSuggestionBox() {
    if (!pageState.activeField || !pageState.suggestionRoot || pageState.suggestionRoot.hidden) {
      return;
    }

    const rect = pageState.activeField.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportWidth = viewport ? viewport.width : window.innerWidth;
    const viewportHeight = viewport ? viewport.height : window.innerHeight;
    const width = Math.min(Math.max(rect.width, 240), 420);
    const boxHeight = pageState.suggestionRoot.offsetHeight || 180;
    const belowTop = rect.bottom + 8;
    const aboveTop = rect.top - boxHeight - 8;
    const preferredTop =
      belowTop + boxHeight <= viewportHeight - 12 || aboveTop < 12
        ? belowTop
        : aboveTop;
    const top = Math.max(12, Math.min(preferredTop, viewportHeight - boxHeight - 12));
    const left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12));

    pageState.suggestionRoot.style.width = `${width}px`;
    pageState.suggestionRoot.style.left = `${left}px`;
    pageState.suggestionRoot.style.top = `${top}px`;
  }

  function renderSuggestions() {
    const { suggestionList, suggestionRoot } = pageState;
    if (!suggestionList || !suggestionRoot) {
      return;
    }

    suggestionList.textContent = "";
    suggestionRoot.dataset.compact =
      pageState.suggestions.length <= 2 && pageState.activeDescriptor && pageState.activeDescriptor.semanticKey
        ? "true"
        : "false";

    pageState.suggestions.forEach((suggestion, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "breezefill-suggestion";
      button.dataset.index = String(index);

      const value = document.createElement("span");
      value.className = "breezefill-suggestion__value";
      value.textContent = suggestion.value;

      const meta = document.createElement("span");
      meta.className = "breezefill-suggestion__meta";

      const label = document.createElement("span");
      label.className = "breezefill-suggestion__label";
      label.textContent = suggestion.label;

      const badge = document.createElement("span");
      badge.className = "breezefill-suggestion__badge";
      badge.textContent = suggestion.source === "profile" ? "Autofill" : suggestion.note;

      meta.appendChild(label);
      meta.appendChild(badge);
      button.appendChild(value);
      button.appendChild(meta);
      suggestionList.appendChild(button);
    });

    pageState.selectedIndex = -1;
    suggestionRoot.hidden = pageState.suggestions.length === 0;
    positionSuggestionBox();
  }

  function promptFingerprint(candidates) {
    return candidates
      .map((candidate) => {
        return `${candidate.descriptor.siteKey}=${candidate.value.toLowerCase()}`;
      })
      .sort()
      .join("|");
  }

  function showPrompt(candidates) {
    if (!pageState.promptRoot) {
      return;
    }

    pageState.promptCandidates = candidates;
    pageState.promptFingerprint = promptFingerprint(candidates);

    const root = pageState.promptRoot;
    root.textContent = "";

    const title = document.createElement("div");
    title.className = "breezefill-prompt__title";
    title.textContent = promptTitle(candidates);

    const body = document.createElement("p");
    body.className = "breezefill-prompt__body";
    body.textContent = `Only when a form on ${escapeHost(location.origin)} asks for it.`;

    const actions = document.createElement("div");
    actions.className = "breezefill-prompt__actions";

    const save = document.createElement("button");
    save.type = "button";
    save.className = "breezefill-button breezefill-button--primary";
    save.dataset.action = "save";
    save.textContent = "Save";

    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "breezefill-button breezefill-button--ghost";
    dismiss.dataset.action = "dismiss";
    dismiss.textContent = "Not now";

    const mute = document.createElement("button");
    mute.type = "button";
    mute.className = "breezefill-button breezefill-button--ghost";
    mute.dataset.action = "mute";
    mute.textContent = "Never here";

    actions.appendChild(save);
    actions.appendChild(dismiss);
    actions.appendChild(mute);

    root.appendChild(title);
    root.appendChild(body);
    root.appendChild(actions);
    root.hidden = false;
  }

  function hidePrompt() {
    pageState.promptCandidates = [];
    pageState.promptFingerprint = "";

    if (pageState.promptRoot) {
      pageState.promptRoot.hidden = true;
      pageState.promptRoot.textContent = "";
    }
  }

  function getDraftBucket(field) {
    return field.form || document.body;
  }

  function trackFieldDraft(field, descriptor) {
    const value = breezeFill.matchers.cleanText(
      breezeFill.matchers.getFieldValue(field)
    );
    const bucket = getDraftBucket(field);
    const bucketMap = pageState.formDrafts.get(bucket) || new Map();

    if (!value) {
      bucketMap.delete(descriptor.siteKey);
    } else {
      bucketMap.set(descriptor.siteKey, {
        value,
        descriptor
      });
    }

    if (bucketMap.size) {
      pageState.formDrafts.set(bucket, bucketMap);
    } else {
      pageState.formDrafts.delete(bucket);
    }
  }

  function schedulePrompt(bucket, delay) {
    const existingTimer = pageState.formTimers.get(bucket);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    const timer = window.setTimeout(() => {
      pageState.formTimers.delete(bucket);
      maybeShowPrompt(bucket).catch(() => {
        return undefined;
      });
    }, delay || 750);

    pageState.formTimers.set(bucket, timer);
  }

  async function maybeShowPrompt(bucket) {
    const { cachedState } = pageState;
    if (
      !cachedState.settings.enabled ||
      !cachedState.settings.promptToSave ||
      cachedState.ignoredOrigins.includes(location.origin)
    ) {
      return;
    }

    const bucketMap = pageState.formDrafts.get(bucket);
    if (!bucketMap || !bucketMap.size) {
      return;
    }

    const candidates = breezeFill.storage.filterNewCandidates(
      cachedState,
      location.origin,
      Array.from(bucketMap.values())
    );

    if (!candidates.length) {
      return;
    }

    const meaningful =
      candidates.length > 1 || shouldAllowSingleFieldPrompt(candidates);

    if (!meaningful) {
      return;
    }

    const fingerprint = promptFingerprint(candidates);
    if (pageState.dismissedFingerprints.has(fingerprint)) {
      return;
    }

    showPrompt(candidates);
  }

  async function presentSuggestions(field, descriptor) {
    if (!pageState.cachedState.settings.enabled) {
      return;
    }

    const typedValue = breezeFill.matchers.cleanText(
      breezeFill.matchers.getFieldValue(field)
    );
    if (!descriptor.semanticKey && !typedValue) {
      hideSuggestions();
      return;
    }

    const suggestions = breezeFill.storage
      .buildSuggestions(
        pageState.cachedState,
        location.origin,
        descriptor,
        breezeFill.matchers.getFieldValue(field)
      )
      .filter((suggestion) => !typedValue || !isSameValue(suggestion.value, typedValue));

    if (!suggestions.length) {
      hideSuggestions();
      return;
    }

    pageState.activeField = field;
    pageState.activeDescriptor = descriptor;
    pageState.suggestions = suggestions;
    renderSuggestions();
  }

  async function onFocusIn(event) {
    const target = getFieldTarget(event);
    if (!target) {
      hideSuggestions();
      return;
    }

    await presentSuggestions(target.field, target.descriptor);
  }

  async function onInput(event) {
    const target = getFieldTarget(event);
    if (!target) {
      return;
    }

    trackFieldDraft(target.field, target.descriptor);
    await presentSuggestions(target.field, target.descriptor);
  }

  async function onChange(event) {
    const target = getFieldTarget(event);
    if (!target) {
      return;
    }

    trackFieldDraft(target.field, target.descriptor);
    await presentSuggestions(target.field, target.descriptor);
  }

  function getBucketForElement(element) {
    if (!(element instanceof Element)) {
      return null;
    }

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      return getDraftBucket(element);
    }

    return element.closest("form") || null;
  }

  function onFocusOut(event) {
    const target = getFieldTarget(event);
    if (!target) {
      return;
    }

    const currentBucket = getDraftBucket(target.field);
    const nextBucket = getBucketForElement(event.relatedTarget);

    if (currentBucket && currentBucket === nextBucket) {
      return;
    }

    schedulePrompt(currentBucket, 650);
  }

  function onKeyDown(event) {
    if (
      !pageState.suggestionRoot ||
      pageState.suggestionRoot.hidden ||
      event.target !== pageState.activeField
    ) {
      return;
    }

    if (event.key === "ArrowDown") {
      pageState.selectedIndex =
        (pageState.selectedIndex + 1) % pageState.suggestions.length;
      updateSelectedSuggestion();
      event.preventDefault();
    }

    if (event.key === "ArrowUp") {
      pageState.selectedIndex =
        (pageState.selectedIndex - 1 + pageState.suggestions.length) %
        pageState.suggestions.length;
      updateSelectedSuggestion();
      event.preventDefault();
    }

    if (event.key === "Enter" && pageState.selectedIndex >= 0) {
      applySuggestion(
        pageState.activeField,
        pageState.suggestions[pageState.selectedIndex].value
      );
      event.preventDefault();
    }

    if (event.key === "Escape") {
      hideSuggestions();
    }
  }

  function onMouseDown(event) {
    if (
      pageState.suggestionRoot &&
      !pageState.suggestionRoot.hidden &&
      !pageState.suggestionRoot.contains(event.target)
    ) {
      hideSuggestions();
    }
  }

  function onScrollOrResize() {
    positionSuggestionBox();
  }

  function onSubmit(event) {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form) {
      return;
    }

    schedulePrompt(form, 160);
  }

  async function init() {
    createSuggestionShell();
    createPromptShell();
    await refreshState();

    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onChange, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onScrollOrResize);
      window.visualViewport.addEventListener("scroll", onScrollOrResize);
    }
    chrome.storage.onChanged.addListener(() => {
      refreshState().catch(() => {
        return undefined;
      });
    });
  }

  init().catch(() => {
    return undefined;
  });
})();
