# Chrome Web Store Review Notes

## Single purpose

BreezeFill has one purpose: suggest saved autofill values on web forms and remember new values only after the user explicitly chooses to save them.

## Why it needs `storage`

The extension stores profile values, remembered responses, muted sites, and user settings locally in the browser so suggestions are available on future forms.

## Why it needs access to all websites

BreezeFill only works when it can detect form fields on the websites where the user wants autofill suggestions. Because users can encounter forms on nearly any website, the extension needs page access broadly enough to inspect those forms and show suggestions in context.

The extension does not use this access for advertising, tracking, analytics, or remote data collection.

## Data handling

- User data is stored locally using browser extension storage.
- No backend service is used to sync or process saved autofill data.
- No user-entered autofill data is sold or shared with third parties.

## Reviewer testing

1. Load the extension and open the options page.
2. Save profile values for email, phone, LinkedIn, and education fields.
3. Open `test-form.html` and focus a matching field to see the suggestion UI.
4. Submit a new GitHub value to see the save prompt.
5. Reopen the same field and confirm the remembered value appears.
6. Open `test-form.html?ashby_jid=demo` and verify ATS-style application fields also match.
