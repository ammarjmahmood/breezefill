globalThis.BreezeFill = globalThis.BreezeFill || {};

(() => {
  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function lower(value) {
    return cleanText(value).toLowerCase();
  }

  function expandIdentifierText(value) {
    return cleanText(
      String(value || "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_:./-]+/g, " ")
    );
  }

  function getAttributeText(field, attributeNames) {
    return cleanText(
      attributeNames
        .map((attributeName) => field.getAttribute(attributeName))
        .filter(Boolean)
        .map((value) => expandIdentifierText(value))
        .join(" ")
    );
  }

  function getDatasetText(field) {
    if (!field.dataset) {
      return "";
    }

    return cleanText(
      Object.entries(field.dataset)
        .flatMap(([key, value]) => [expandIdentifierText(key), expandIdentifierText(value)])
        .join(" ")
    );
  }

  function getAncestorText(field, depth) {
    let current = field;
    let steps = 0;

    while (current && steps < depth) {
      current = current.parentElement;
      steps += 1;

      if (!current) {
        break;
      }

      const text = cleanText(current.textContent);
      if (text && text.length <= 220) {
        return text;
      }
    }

    return "";
  }

  function findScopedText(field, selectors) {
    let current = field;
    let steps = 0;

    while (current && steps < 5) {
      current = current.parentElement;
      steps += 1;

      if (!current) {
        break;
      }

      for (const selector of selectors) {
        const node = current.matches(selector) ? current : current.querySelector(selector);
        const text = cleanText(node && node.textContent);

        if (text && text.length <= 260) {
          return text;
        }
      }
    }

    return "";
  }

  const APPLICATION_KEY_RULES = [
    {
      key: "linkedin",
      patterns: [/\blinkedin\b/, /\blinked in\b/, /\blinkedin profile\b/]
    },
    {
      key: "github",
      patterns: [/\bgithub\b/, /\bgit hub\b/]
    },
    {
      key: "xProfile",
      patterns: [/\btwitter\b/, /\bx profile\b/, /\bx handle\b/, /\btwitter handle\b/]
    },
    {
      key: "portfolio",
      patterns: [
        /\bportfolio\b/,
        /\bpersonal website\b/,
        /\bpersonal site\b/,
        /\bportfolio website\b/
      ]
    },
    {
      key: "website",
      patterns: [/\bwebsite\b/, /\bhomepage\b/, /\bpersonal url\b/, /\burl\b/]
    },
    {
      key: "email",
      patterns: [/\bemail\b/, /\be mail\b/, /\bemail address\b/, /\bmail address\b/]
    },
    {
      key: "phone",
      patterns: [/\bphone\b/, /\bphone number\b/, /\bmobile\b/, /\btelephone\b/, /\btel\b/]
    },
    {
      key: "schoolName",
      patterns: [/\bschool\b/, /\buniversity\b/, /\bcollege\b/, /\binstitution\b/]
    },
    {
      key: "degree",
      patterns: [/\bdegree\b/, /\bdegree level\b/, /\bbachelor'?s\b/, /\bmaster'?s\b/, /\bphd\b/]
    },
    {
      key: "programName",
      patterns: [
        /\bprogram\b/,
        /\bmajor\b/,
        /\bfield of study\b/,
        /\bdiscipline\b/,
        /\bconcentration\b/
      ]
    },
    {
      key: "graduationInfo",
      patterns: [
        /\bgraduat/,
        /\bgraduation year\b/,
        /\bexpected graduation\b/,
        /\bexpected completion\b/,
        /\bcompletion\b/,
        /\bmonth year\b/,
        /\banticipated completing\b/
      ]
    },
    {
      key: "address1",
      patterns: [/\baddress\b/, /\bstreet\b/, /\baddress line 1\b/]
    },
    {
      key: "address2",
      patterns: [/\baddress line 2\b/, /\bapartment\b/, /\bapt\b/, /\bsuite\b/, /\bunit\b/]
    },
    {
      key: "city",
      patterns: [/\bcity\b/, /\btown\b/]
    },
    {
      key: "state",
      patterns: [/\bstate\b/, /\bprovince\b/, /\bregion\b/]
    },
    {
      key: "zip",
      patterns: [/\bzip\b/, /\bpostal\b/, /\bpostcode\b/]
    },
    {
      key: "country",
      patterns: [/\bcountry\b/, /\bcountry region\b/]
    },
    {
      key: "company",
      patterns: [/\bcompany\b/, /\borganization\b/, /\bemployer\b/, /\bbusiness\b/]
    },
    {
      key: "jobTitle",
      patterns: [/\bjob title\b/, /\bcurrent title\b/, /\bposition\b/, /\brole\b/]
    },
    {
      key: "firstName",
      patterns: [/\bfirst name\b/, /\bgiven name\b/, /\bforename\b/]
    },
    {
      key: "lastName",
      patterns: [/\blast name\b/, /\bfamily name\b/, /\bsurname\b/]
    },
    {
      key: "fullName",
      patterns: [/\bfull name\b/, /\byour name\b/, /\bapplicant name\b/, /\bcandidate name\b/]
    }
  ];

  const COMMON_HINT_ATTRIBUTES = [
    "aria-label",
    "aria-describedby",
    "aria-labelledby",
    "autocomplete",
    "data-testid",
    "data-test-id",
    "data-test",
    "data-qa",
    "data-field",
    "data-name",
    "data-automation-id",
    "data-ph-at-id",
    "data-ui",
    "data-ui-id",
    "inputmode",
    "placeholder"
  ];

  const SHARED_APPLICATION_SELECTORS = [
    "label",
    "legend",
    ".label",
    ".field-label",
    ".form-field__label",
    ".question-label",
    ".application-label",
    ".application-question label",
    ".application-question__label",
    ".ats-question",
    "[data-field-label]",
    "[data-automation-id*='label']",
    "[data-qa*='label']",
    "[data-testid*='label']"
  ];

  function inferApplicationSemanticKey(field, hintText) {
    const name = lower(expandIdentifierText(field.name));
    const id = lower(expandIdentifierText(field.id));
    const type = lower(field.getAttribute("type"));
    const autocomplete = lower(expandIdentifierText(field.getAttribute("autocomplete")));
    const nearby = lower(getAncestorText(field, 4));
    const dataset = lower(getDatasetText(field));
    const attributes = lower(getAttributeText(field, COMMON_HINT_ATTRIBUTES));
    const combined = cleanText(
      [hintText, name, id, autocomplete, dataset, attributes, nearby].join(" ")
    ).toLowerCase();

    if (name.includes("systemfield email") || id.includes("systemfield email")) {
      return "email";
    }

    if (type === "email" || autocomplete.includes("email")) {
      return "email";
    }

    if (type === "tel" || autocomplete.includes("tel")) {
      return "phone";
    }

    for (const rule of APPLICATION_KEY_RULES) {
      if (rule.patterns.some((pattern) => pattern.test(combined))) {
        return rule.key;
      }
    }

    return "";
  }

  function buildApplicationHint(field, selectors) {
    return cleanText(
      [
        getAncestorText(field, 4),
        getDatasetText(field),
        getAttributeText(field, COMMON_HINT_ATTRIBUTES),
        findScopedText(field, selectors)
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  function createApplicationAdapter(config) {
    const selectors = config.selectors || SHARED_APPLICATION_SELECTORS;

    return {
      id: config.id,
      matches(locationObject) {
        const host = lower(locationObject.hostname);
        const path = lower(locationObject.pathname);
        const search = lower(locationObject.search);

        if ((config.hostnameFragments || []).some((fragment) => host.includes(lower(fragment)))) {
          return true;
        }

        if ((config.searchTokens || []).some((token) => search.includes(lower(token)))) {
          return true;
        }

        return (config.pathPatterns || []).some((pattern) => pattern.test(path));
      },
      inferSemanticKey(field, hintText) {
        const augmentedHint = cleanText([hintText, buildApplicationHint(field, selectors)].join(" "));
        return inferApplicationSemanticKey(field, augmentedHint);
      },
      getExtraHintText(field) {
        return buildApplicationHint(field, selectors);
      },
      getFieldLabel(field) {
        return findScopedText(field, selectors);
      }
    };
  }

  const adapters = [
    createApplicationAdapter({
      id: "ashby",
      hostnameFragments: ["ashbyhq.com"],
      searchTokens: ["ashby_jid="],
      pathPatterns: [/\/application\//]
    }),
    createApplicationAdapter({
      id: "greenhouse",
      hostnameFragments: ["greenhouse.io"],
      pathPatterns: [/\/job_app/, /\/embed\/job_app/]
    }),
    createApplicationAdapter({
      id: "lever",
      hostnameFragments: ["lever.co"],
      pathPatterns: [/\/apply/]
    }),
    createApplicationAdapter({
      id: "workday",
      hostnameFragments: ["myworkdayjobs.com", "workday.com"],
      pathPatterns: [/\/recruiting\//, /\/job\//]
    }),
    createApplicationAdapter({
      id: "smartrecruiters",
      hostnameFragments: ["smartrecruiters.com"],
      pathPatterns: [/\/job\//, /\/careers\//]
    }),
    createApplicationAdapter({
      id: "taleo",
      hostnameFragments: ["taleo.net"],
      pathPatterns: [/\/careersection\//]
    }),
    createApplicationAdapter({
      id: "oracle-candidate-experience",
      hostnameFragments: ["oraclecloud.com"],
      pathPatterns: [/candidateexperience/i, /hcmui/i]
    }),
    createApplicationAdapter({
      id: "jobvite",
      hostnameFragments: ["jobvite.com"],
      pathPatterns: [/\/job\//, /\/apply\//]
    }),
    createApplicationAdapter({
      id: "icims",
      hostnameFragments: ["icims.com"],
      pathPatterns: [/\/jobs\//, /\/job\//]
    }),
    createApplicationAdapter({
      id: "workable",
      hostnameFragments: ["workable.com"],
      pathPatterns: [/\/jobs\//, /\/j\//]
    })
  ];

  function getActiveAdapter(locationObject) {
    return adapters.find((adapter) => adapter.matches(locationObject)) || null;
  }

  globalThis.BreezeFill.adapters = {
    getActiveAdapter
  };
})();
