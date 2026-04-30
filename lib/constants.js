globalThis.BreezeFill = globalThis.BreezeFill || {};

(() => {
  const DEFAULT_PROFILE = {
    fullName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    website: "",
    portfolio: "",
    linkedin: "",
    github: "",
    xProfile: "",
    schoolName: "",
    degree: "",
    programName: "",
    graduationInfo: ""
  };

  const DEFAULT_SETTINGS = {
    enabled: true,
    promptToSave: true,
    maxSuggestions: 4
  };

  const PROFILE_FIELD_META = [
    { key: "fullName", label: "Full name" },
    { key: "firstName", label: "First name" },
    { key: "lastName", label: "Last name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "company", label: "Company" },
    { key: "jobTitle", label: "Job title" },
    { key: "address1", label: "Address line 1" },
    { key: "address2", label: "Address line 2" },
    { key: "city", label: "City" },
    { key: "state", label: "State / Province" },
    { key: "zip", label: "ZIP / Postal code" },
    { key: "country", label: "Country" },
    { key: "website", label: "Website" },
    { key: "portfolio", label: "Portfolio website" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "github", label: "GitHub" },
    { key: "xProfile", label: "X / Twitter" },
    { key: "schoolName", label: "School / University" },
    { key: "degree", label: "Degree" },
    { key: "programName", label: "Program / Major" },
    { key: "graduationInfo", label: "Expected graduation" }
  ];

  const SEMANTIC_FIELD_RULES = [
    {
      key: "fullName",
      label: "Full name",
      autocomplete: ["name"],
      patterns: [/\bfull name\b/i, /\byour name\b/i, /\bcontact name\b/i]
    },
    {
      key: "firstName",
      label: "First name",
      autocomplete: ["given-name"],
      patterns: [/\bfirst name\b/i, /\bgiven name\b/i, /\bforename\b/i, /\bfname\b/i]
    },
    {
      key: "lastName",
      label: "Last name",
      autocomplete: ["family-name"],
      patterns: [/\blast name\b/i, /\bfamily name\b/i, /\bsurname\b/i, /\blname\b/i]
    },
    {
      key: "email",
      label: "Email",
      autocomplete: ["email"],
      patterns: [/\bemail\b/i, /\be-mail\b/i, /\bmail address\b/i]
    },
    {
      key: "phone",
      label: "Phone",
      autocomplete: ["tel", "tel-national"],
      patterns: [/\bphone\b/i, /\bmobile\b/i, /\btelephone\b/i, /\btel\b/i]
    },
    {
      key: "company",
      label: "Company",
      autocomplete: ["organization"],
      patterns: [/\bcompany\b/i, /\borganization\b/i, /\bbusiness\b/i, /\bemployer\b/i]
    },
    {
      key: "jobTitle",
      label: "Job title",
      autocomplete: [],
      patterns: [/\bjob title\b/i, /\btitle\b/i, /\brole\b/i, /\bposition\b/i]
    },
    {
      key: "address1",
      label: "Address",
      autocomplete: ["street-address", "address-line1"],
      patterns: [/\baddress\b/i, /\bstreet\b/i, /\baddress line 1\b/i]
    },
    {
      key: "address2",
      label: "Address line 2",
      autocomplete: ["address-line2"],
      patterns: [/\baddress line 2\b/i, /\bapt\b/i, /\bapartment\b/i, /\bsuite\b/i, /\bunit\b/i]
    },
    {
      key: "city",
      label: "City",
      autocomplete: ["address-level2"],
      patterns: [/\bcity\b/i, /\btown\b/i]
    },
    {
      key: "state",
      label: "State",
      autocomplete: ["address-level1"],
      patterns: [/\bstate\b/i, /\bprovince\b/i, /\bregion\b/i]
    },
    {
      key: "zip",
      label: "ZIP code",
      autocomplete: ["postal-code"],
      patterns: [/\bzip\b/i, /\bpostal\b/i, /\bpostcode\b/i]
    },
    {
      key: "country",
      label: "Country",
      autocomplete: ["country", "country-name"],
      patterns: [/\bcountry\b/i]
    },
    {
      key: "website",
      label: "Website",
      autocomplete: ["url"],
      patterns: [/\bwebsite\b/i, /\burl\b/i, /\bhomepage\b/i]
    },
    {
      key: "portfolio",
      label: "Portfolio website",
      autocomplete: [],
      patterns: [
        /\bportfolio\b/i,
        /\bpersonal website\b/i,
        /\bpersonal site\b/i,
        /\bportfolio website\b/i
      ]
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      autocomplete: [],
      patterns: [/\blinkedin\b/i, /\blinked in\b/i]
    },
    {
      key: "github",
      label: "GitHub",
      autocomplete: [],
      patterns: [/\bgithub\b/i, /\bgit hub\b/i]
    },
    {
      key: "xProfile",
      label: "X / Twitter",
      autocomplete: [],
      patterns: [
        /\bx\/twitter\b/i,
        /\btwitter\b/i,
        /\bx profile\b/i,
        /\bx handle\b/i,
        /\btwitter handle\b/i
      ]
    },
    {
      key: "schoolName",
      label: "School / University",
      autocomplete: [],
      patterns: [
        /\bschool\b/i,
        /\buniversity\b/i,
        /\bcollege\b/i,
        /\binstitution\b/i,
        /\beducational program\b/i
      ]
    },
    {
      key: "degree",
      label: "Degree",
      autocomplete: [],
      patterns: [
        /\bdegree\b/i,
        /\bbachelor'?s\b/i,
        /\bmaster'?s\b/i,
        /\bphd\b/i,
        /\bdoctorate\b/i
      ]
    },
    {
      key: "programName",
      label: "Program / Major",
      autocomplete: [],
      patterns: [
        /\bprogram\b/i,
        /\bprogram name\b/i,
        /\bmajor\b/i,
        /\bfield of study\b/i,
        /\bdiscipline\b/i,
        /\bconcentration\b/i
      ]
    },
    {
      key: "graduationInfo",
      label: "Expected graduation",
      autocomplete: [],
      patterns: [
        /\bgraduat/i,
        /\bexpected graduation\b/i,
        /\bgraduation year\b/i,
        /\bcompletion\b/i,
        /\bcomplete.*program\b/i,
        /\bmonth\/year\b/i,
        /\banticipated completing\b/i,
        /\bexpected completion\b/i
      ]
    }
  ];

  const SEMANTIC_LABELS = Object.fromEntries(
    SEMANTIC_FIELD_RULES.map((rule) => [rule.key, rule.label])
  );

  const ELIGIBLE_INPUT_TYPES = new Set([
    "",
    "text",
    "email",
    "tel",
    "url",
    "number",
    "search",
    "month"
  ]);

  const SENSITIVE_PATTERNS = [
    /\bpassword\b/i,
    /\bpasscode\b/i,
    /\bpin\b/i,
    /\bsecurity code\b/i,
    /\bcvc\b/i,
    /\bcvv\b/i,
    /\bone[- ]time\b/i,
    /\botp\b/i,
    /\bcredit\b/i,
    /\bcard\b/i,
    /\bssn\b/i,
    /\bsocial security\b/i,
    /\btax\b/i,
    /\brouting\b/i,
    /\biban\b/i,
    /\baccount number\b/i
  ];

  globalThis.BreezeFill.constants = {
    DEFAULT_PROFILE,
    DEFAULT_SETTINGS,
    PROFILE_FIELD_META,
    SEMANTIC_FIELD_RULES,
    SEMANTIC_LABELS,
    ELIGIBLE_INPUT_TYPES,
    SENSITIVE_PATTERNS,
    MAX_MEMORIES_PER_KEY: 8
  };
})();
