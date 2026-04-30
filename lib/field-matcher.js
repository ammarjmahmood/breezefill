globalThis.BreezeFill = globalThis.BreezeFill || {};

(() => {
  const { ELIGIBLE_INPUT_TYPES, SEMANTIC_FIELD_RULES, SENSITIVE_PATTERNS } =
    globalThis.BreezeFill.constants;

  function getActiveAdapter() {
    const adapterRegistry = globalThis.BreezeFill.adapters;
    if (!adapterRegistry || typeof adapterRegistry.getActiveAdapter !== "function") {
      return null;
    }

    return adapterRegistry.getActiveAdapter(window.location);
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function expandIdentifierText(value) {
    return cleanText(
      String(value || "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_:./-]+/g, " ")
    );
  }

  function getLookupRoot(field) {
    const root = field && typeof field.getRootNode === "function"
      ? field.getRootNode()
      : document;

    return root || document;
  }

  function getNodeById(field, id) {
    const root = getLookupRoot(field);

    if (root && typeof root.getElementById === "function") {
      return root.getElementById(id);
    }

    return document.getElementById(id);
  }

  function normalizeToken(value) {
    return expandIdentifierText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getAriaDescription(field) {
    const describedBy = cleanText(field.getAttribute("aria-describedby"));

    if (!describedBy) {
      return "";
    }

    return describedBy
      .split(/\s+/)
      .map((id) => getNodeById(field, id))
      .filter(Boolean)
      .map((node) => cleanText(node.textContent))
      .join(" ");
  }

  function getReferencedText(field, attributeName) {
    const value = cleanText(field.getAttribute(attributeName));

    if (!value) {
      return "";
    }

    return value
      .split(/\s+/)
      .map((id) => getNodeById(field, id))
      .filter(Boolean)
      .map((node) => cleanText(node.textContent))
      .filter(Boolean)
      .join(" ");
  }

  function findShortText(elements) {
    for (const element of elements) {
      const text = cleanText(element && element.textContent);
      if (text && text.length <= 120) {
        return text;
      }
    }

    return "";
  }

  function getNearbyTextLabel(field) {
    const labelledBy = getReferencedText(field, "aria-labelledby");
    if (labelledBy) {
      return labelledBy;
    }

    const previousSiblings = [];
    let sibling = field.previousElementSibling;

    while (sibling && previousSiblings.length < 3) {
      previousSiblings.push(sibling);
      sibling = sibling.previousElementSibling;
    }

    const siblingText = findShortText(previousSiblings);
    if (siblingText) {
      return siblingText;
    }

    const parent = field.parentElement;
    if (!parent) {
      return "";
    }

    const siblingChildren = Array.from(parent.children).filter((child) => {
      return child !== field && !child.contains(field);
    });
    const parentText = findShortText(siblingChildren);

    if (parentText) {
      return parentText;
    }

    return "";
  }

  function getInputHint(field) {
    return cleanText(
      [
        field.getAttribute("data-testid"),
        field.getAttribute("data-test-id"),
        field.getAttribute("data-qa"),
        field.getAttribute("data-test"),
        field.getAttribute("data-field"),
        field.getAttribute("data-name"),
        field.getAttribute("data-automation-id"),
        field.getAttribute("data-ph-at-id"),
        field.getAttribute("data-ui"),
        field.getAttribute("data-ui-id"),
        field.getAttribute("ph-a11y"),
        field.getAttribute("inputmode")
      ]
        .filter(Boolean)
        .map((value) => expandIdentifierText(value))
        .join(" ")
    );
  }

  function getFieldLabel(field) {
    if (field.labels && field.labels.length) {
      const joinedLabels = Array.from(field.labels)
        .map((label) => cleanText(label.textContent))
        .filter(Boolean)
        .join(" ");

      if (joinedLabels) {
        return joinedLabels;
      }
    }

    const closestLabel = field.closest("label");
    if (closestLabel) {
      const text = cleanText(closestLabel.textContent);
      if (text) {
        return text;
      }
    }

    const wrapper = field.closest("[data-field], .field, .form-field, .input-group");
    if (wrapper) {
      const label = wrapper.querySelector("label, legend, .label");
      if (label) {
        const text = cleanText(label.textContent);
        if (text) {
          return text;
        }
      }
    }

    const nearbyText = getNearbyTextLabel(field);
    if (nearbyText) {
      return nearbyText;
    }

    const ariaLabel = cleanText(field.getAttribute("aria-label"));
    if (ariaLabel) {
      return ariaLabel;
    }

    const placeholder = cleanText(field.getAttribute("placeholder"));
    if (placeholder) {
      return placeholder;
    }

    return "";
  }

  function isTextLikeField(field) {
    if (field instanceof HTMLSelectElement) {
      return true;
    }

    if (field instanceof HTMLTextAreaElement) {
      return true;
    }

    if (!(field instanceof HTMLInputElement)) {
      return false;
    }

    return ELIGIBLE_INPUT_TYPES.has((field.type || "").toLowerCase());
  }

  function getFieldValue(field) {
    if (field instanceof HTMLSelectElement) {
      const option = field.options[field.selectedIndex];
      return cleanText((option && option.textContent) || field.value);
    }

    if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
      return field.value;
    }

    return "";
  }

  function isSensitiveField(field, haystack) {
    if (field instanceof HTMLInputElement && field.type === "password") {
      return true;
    }

    return SENSITIVE_PATTERNS.some((pattern) => pattern.test(haystack));
  }

  function inferSemanticKey(haystack, autocomplete) {
    for (const rule of SEMANTIC_FIELD_RULES) {
      if (rule.autocomplete.includes(autocomplete)) {
        return rule.key;
      }

      if (rule.patterns.some((pattern) => pattern.test(haystack))) {
        return rule.key;
      }
    }

    return "";
  }

  function describeField(field) {
    if (!isTextLikeField(field) || field.disabled || field.readOnly) {
      return null;
    }

    const adapter = getActiveAdapter();
    const adapterLabel =
      adapter && typeof adapter.getFieldLabel === "function"
        ? cleanText(adapter.getFieldLabel(field))
        : "";
    const adapterHint =
      adapter && typeof adapter.getExtraHintText === "function"
        ? cleanText(adapter.getExtraHintText(field))
        : "";
    const label = getFieldLabel(field) || adapterLabel;
    const autocomplete = cleanText(field.getAttribute("autocomplete"))
      .split(/\s+/)
      .find(Boolean) || "";
    const hintText = cleanText(
      [
        label,
        expandIdentifierText(field.name),
        expandIdentifierText(field.id),
        field.placeholder,
        field.getAttribute("aria-label"),
        getReferencedText(field, "aria-labelledby"),
        getAriaDescription(field),
        getInputHint(field),
        adapterHint,
        autocomplete
      ]
        .filter(Boolean)
        .join(" ")
    ).toLowerCase();

    const sensitive = isSensitiveField(field, hintText);
    const inferredKey = inferSemanticKey(hintText, autocomplete.toLowerCase());
    const adapterKey =
      adapter && typeof adapter.inferSemanticKey === "function"
        ? cleanText(adapter.inferSemanticKey(field, hintText))
        : "";
    const semanticKey = adapterKey || inferredKey;
    const keySource = [
      expandIdentifierText(field.name),
      expandIdentifierText(field.id),
      label,
      field.placeholder,
      expandIdentifierText(field.getAttribute("data-testid")),
      expandIdentifierText(field.getAttribute("data-test-id")),
      expandIdentifierText(field.getAttribute("data-qa")),
      expandIdentifierText(field.getAttribute("data-field")),
      adapterHint,
      autocomplete
    ]
      .filter(Boolean)
      .join(" ");
    const siteKeyBase = normalizeToken(keySource) || "untitled-field";
    const tagName = field.tagName.toLowerCase();
    const inputType = field instanceof HTMLTextAreaElement
      ? "textarea"
      : field instanceof HTMLSelectElement
        ? "select"
        : field.type || "text";

    return {
      label: label || globalThis.BreezeFill.constants.SEMANTIC_LABELS[semanticKey] || "Saved field",
      semanticKey,
      siteKey: `${tagName}:${inputType}:${siteKeyBase}`,
      sensitive,
      inputType
    };
  }

  globalThis.BreezeFill.matchers = {
    cleanText,
    normalizeToken,
    getFieldLabel,
    getFieldValue,
    isTextLikeField,
    describeField
  };
})();
