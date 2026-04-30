globalThis.BreezeFill = globalThis.BreezeFill || {};

(() => {
  const {
    DEFAULT_PROFILE,
    DEFAULT_SETTINGS,
    PROFILE_FIELD_META,
    SEMANTIC_LABELS,
    MAX_MEMORIES_PER_KEY
  } = globalThis.BreezeFill.constants;

  function storageGet(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }

        resolve(result);
      });
    });
  }

  function storageSet(payload) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(payload, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }

        resolve();
      });
    });
  }

  function createDefaultMemories() {
    return {
      global: {},
      byOrigin: {}
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeValue(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeCompareValue(value) {
    return normalizeValue(value).toLowerCase();
  }

  function splitFullName(profile) {
    const source = normalizeValue(profile.fullName);
    if (!source) {
      return { firstName: "", lastName: "" };
    }

    const parts = source.split(" ");
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "" };
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" ")
    };
  }

  function profileValueForKey(profile, key) {
    const directValue = normalizeValue(profile[key]);
    if (directValue) {
      return directValue;
    }

    const split = splitFullName(profile);

    if (key === "firstName") {
      return split.firstName;
    }

    if (key === "lastName") {
      return split.lastName;
    }

    if (key === "fullName") {
      return normalizeValue([profile.firstName, profile.lastName].filter(Boolean).join(" "));
    }

    return "";
  }

  function normalizeMemoryList(list) {
    if (!Array.isArray(list)) {
      return [];
    }

    return list
      .map((item) => ({
        value: normalizeValue(item && item.value),
        label: normalizeValue(item && item.label),
        count: Number(item && item.count) || 1,
        updatedAt: Number(item && item.updatedAt) || Date.now()
      }))
      .filter((item) => item.value);
  }

  function normalizeMemories(memories) {
    const next = createDefaultMemories();

    if (!memories || typeof memories !== "object") {
      return next;
    }

    if (memories.global && typeof memories.global === "object") {
      for (const [key, list] of Object.entries(memories.global)) {
        const normalizedList = normalizeMemoryList(list);
        if (normalizedList.length) {
          next.global[key] = normalizedList;
        }
      }
    }

    if (memories.byOrigin && typeof memories.byOrigin === "object") {
      for (const [origin, groups] of Object.entries(memories.byOrigin)) {
        if (!groups || typeof groups !== "object") {
          continue;
        }

        const normalizedGroups = {};
        for (const [key, list] of Object.entries(groups)) {
          const normalizedList = normalizeMemoryList(list);
          if (normalizedList.length) {
            normalizedGroups[key] = normalizedList;
          }
        }

        if (Object.keys(normalizedGroups).length) {
          next.byOrigin[origin] = normalizedGroups;
        }
      }
    }

    return next;
  }

  function safeHost(origin) {
    try {
      return new URL(origin).hostname || "Saved site";
    } catch (_error) {
      return "Saved site";
    }
  }

  function normalizeState(raw) {
    return {
      profile: { ...DEFAULT_PROFILE, ...(raw.profile || {}) },
      settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) },
      memories: normalizeMemories(raw.memories),
      ignoredOrigins: Array.isArray(raw.ignoredOrigins)
        ? raw.ignoredOrigins.filter(Boolean)
        : []
    };
  }

  function profileCompletion(profile) {
    return PROFILE_FIELD_META.reduce((count, field) => {
      return count + (normalizeValue(profile[field.key]) ? 1 : 0);
    }, 0);
  }

  function countMemories(state) {
    let total = 0;

    Object.values(state.memories.global).forEach((list) => {
      total += list.length;
    });

    Object.values(state.memories.byOrigin).forEach((group) => {
      Object.values(group).forEach((list) => {
        total += list.length;
      });
    });

    return total;
  }

  function compareWithQuery(candidate, query) {
    if (!query) {
      return 0;
    }

    const normalizedQuery = normalizeCompareValue(query);
    const normalizedValue = normalizeCompareValue(candidate.value);
    const normalizedLabel = normalizeCompareValue(candidate.label);

    if (normalizedValue.startsWith(normalizedQuery)) {
      return 30;
    }

    if (normalizedValue.includes(normalizedQuery)) {
      return 18;
    }

    if (normalizedLabel.includes(normalizedQuery)) {
      return 10;
    }

    return -25;
  }

  function buildSuggestions(state, origin, descriptor, query) {
    const suggestions = [];
    const dedupe = new Set();

    function pushSuggestion(value, source, note, priority, extraLabel) {
      const normalized = normalizeCompareValue(value);
      if (!normalized || dedupe.has(normalized)) {
        return;
      }

      dedupe.add(normalized);
      suggestions.push({
        value: normalizeValue(value),
        label: extraLabel || descriptor.label || SEMANTIC_LABELS[descriptor.semanticKey] || "Saved field",
        source,
        note,
        score: priority
      });
    }

    const siteMatches =
      (state.memories.byOrigin[origin] &&
        state.memories.byOrigin[origin][descriptor.siteKey]) ||
      [];

    siteMatches.forEach((entry) => {
      pushSuggestion(
        entry.value,
        "site",
        "Saved on this site",
        100 + entry.count,
        entry.label
      );
    });

    if (descriptor.semanticKey) {
      const profileValue = profileValueForKey(state.profile, descriptor.semanticKey);
      if (profileValue) {
        pushSuggestion(
          profileValue,
          "profile",
          "From your profile",
          80,
          descriptor.label
        );
      }

      const globalMatches = state.memories.global[descriptor.semanticKey] || [];
      globalMatches.forEach((entry) => {
        pushSuggestion(
          entry.value,
          "global",
          "Saved response",
          60 + entry.count,
          entry.label || descriptor.label
        );
      });
    }

    return suggestions
      .map((suggestion) => ({
        ...suggestion,
        score: suggestion.score + compareWithQuery(suggestion, query)
      }))
      .filter((suggestion) => suggestion.score >= 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, state.settings.maxSuggestions);
  }

  function hasExistingValue(state, origin, descriptor, value) {
    const normalized = normalizeCompareValue(value);

    const siteValues =
      (state.memories.byOrigin[origin] &&
        state.memories.byOrigin[origin][descriptor.siteKey]) ||
      [];

    if (siteValues.some((item) => normalizeCompareValue(item.value) === normalized)) {
      return true;
    }

    if (descriptor.semanticKey) {
      const globalValues = state.memories.global[descriptor.semanticKey] || [];
      if (
        globalValues.some((item) => normalizeCompareValue(item.value) === normalized) ||
        normalizeCompareValue(profileValueForKey(state.profile, descriptor.semanticKey)) === normalized
      ) {
        return true;
      }
    }

    return false;
  }

  function filterNewCandidates(state, origin, candidates) {
    const seen = new Set();

    return candidates.filter((candidate) => {
      const value = normalizeValue(candidate.value);
      if (!value) {
        return false;
      }

      const isGeneric = !candidate.descriptor.semanticKey;
      if (isGeneric && value.length < 3) {
        return false;
      }

      const fingerprint = `${candidate.descriptor.siteKey}:${normalizeCompareValue(value)}`;
      if (seen.has(fingerprint)) {
        return false;
      }

      seen.add(fingerprint);
      return !hasExistingValue(state, origin, candidate.descriptor, value);
    });
  }

  function upsertMemory(list, value, label, now) {
    const normalized = normalizeCompareValue(value);
    const next = normalizeMemoryList(list);
    const existing = next.find((entry) => normalizeCompareValue(entry.value) === normalized);

    if (existing) {
      existing.value = normalizeValue(value);
      existing.label = normalizeValue(label) || existing.label;
      existing.count += 1;
      existing.updatedAt = now;
    } else {
      next.unshift({
        value: normalizeValue(value),
        label: normalizeValue(label),
        count: 1,
        updatedAt: now
      });
    }

    return next
      .sort((left, right) => {
        if (right.updatedAt !== left.updatedAt) {
          return right.updatedAt - left.updatedAt;
        }

        return right.count - left.count;
      })
      .slice(0, MAX_MEMORIES_PER_KEY);
  }

  function listMemories(state, limit) {
    const rows = [];

    Object.entries(state.memories.global).forEach(([semanticKey, list]) => {
      list.forEach((entry) => {
        rows.push({
          scope: "global",
          key: semanticKey,
          label: entry.label || SEMANTIC_LABELS[semanticKey] || "Saved field",
          value: entry.value,
          updatedAt: entry.updatedAt,
          badge: "Everywhere"
        });
      });
    });

    Object.entries(state.memories.byOrigin).forEach(([origin, groups]) => {
      Object.entries(groups).forEach(([siteKey, list]) => {
        list.forEach((entry) => {
          rows.push({
            scope: "site",
            key: siteKey,
            origin,
            label: entry.label || "Saved field",
            value: entry.value,
            updatedAt: entry.updatedAt,
            badge: safeHost(origin)
          });
        });
      });
    });

    return rows
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, limit || 50);
  }

  async function getState() {
    const state = await storageGet([
      "profile",
      "settings",
      "memories",
      "ignoredOrigins"
    ]);

    return normalizeState(state);
  }

  async function ensureDefaults() {
    const state = await getState();
    await storageSet(state);
    return state;
  }

  async function saveProfile(profilePatch) {
    const state = await getState();
    const profile = { ...state.profile, ...(profilePatch || {}) };
    await storageSet({ profile });
    return { ...state, profile };
  }

  async function saveSettings(settingsPatch) {
    const state = await getState();
    const settings = { ...state.settings, ...(settingsPatch || {}) };
    await storageSet({ settings });
    return { ...state, settings };
  }

  async function saveCandidates(origin, candidates) {
    const state = await getState();
    const filtered = filterNewCandidates(state, origin, candidates || []);

    if (!filtered.length) {
      return state;
    }

    const memories = clone(state.memories);
    const siteGroups = memories.byOrigin[origin] || {};
    const now = Date.now();

    filtered.forEach((candidate) => {
      const value = normalizeValue(candidate.value);
      if (!value) {
        return;
      }

      siteGroups[candidate.descriptor.siteKey] = upsertMemory(
        siteGroups[candidate.descriptor.siteKey],
        value,
        candidate.descriptor.label,
        now
      );

      if (candidate.descriptor.semanticKey) {
        memories.global[candidate.descriptor.semanticKey] = upsertMemory(
          memories.global[candidate.descriptor.semanticKey],
          value,
          candidate.descriptor.label,
          now
        );
      }
    });

    memories.byOrigin[origin] = siteGroups;
    await storageSet({ memories });

    return {
      ...state,
      memories
    };
  }

  async function ignoreOrigin(origin) {
    const state = await getState();
    const ignoredOrigins = Array.from(new Set([...state.ignoredOrigins, origin]));
    await storageSet({ ignoredOrigins });
    return {
      ...state,
      ignoredOrigins
    };
  }

  async function clearIgnoredOrigins() {
    await storageSet({ ignoredOrigins: [] });
  }

  async function clearMemories() {
    const memories = createDefaultMemories();
    await storageSet({ memories });
    return memories;
  }

  async function removeMemory(entry) {
    const state = await getState();
    const memories = clone(state.memories);
    const targetValue = normalizeCompareValue(entry.value);

    if (entry.scope === "global") {
      const next = (memories.global[entry.key] || []).filter(
        (item) => normalizeCompareValue(item.value) !== targetValue
      );

      if (next.length) {
        memories.global[entry.key] = next;
      } else {
        delete memories.global[entry.key];
      }
    }

    if (entry.scope === "site" && entry.origin) {
      const originGroup = memories.byOrigin[entry.origin] || {};
      const next = (originGroup[entry.key] || []).filter(
        (item) => normalizeCompareValue(item.value) !== targetValue
      );

      if (next.length) {
        originGroup[entry.key] = next;
      } else {
        delete originGroup[entry.key];
      }

      if (Object.keys(originGroup).length) {
        memories.byOrigin[entry.origin] = originGroup;
      } else {
        delete memories.byOrigin[entry.origin];
      }
    }

    await storageSet({ memories });
    return {
      ...state,
      memories
    };
  }

  globalThis.BreezeFill.storage = {
    ensureDefaults,
    getState,
    saveProfile,
    saveSettings,
    saveCandidates,
    ignoreOrigin,
    clearIgnoredOrigins,
    clearMemories,
    removeMemory,
    normalizeState,
    buildSuggestions,
    filterNewCandidates,
    listMemories,
    countMemories,
    profileCompletion,
    profileValueForKey
  };
})();
