# Site Matrix

| Family | Examples | Must-pass fields | Notes |
| --- | --- | --- | --- |
| Local regression page | `test-form.html` | Full name, email, phone, LinkedIn, GitHub, portfolio, school, degree, graduation, native select | Covers classic fields, save prompts, shadow DOM, and ATS-like markup. |
| Marketing / contact | Contact us, lead-gen, newsletter forms | Full name, email, phone, company, website | Expect quiet profile suggestions and clean save prompts. |
| SaaS signup / profile | Account creation, settings, profile editors | First name, last name, email, phone, company, job title | Check React-controlled inputs and field updates after autofill. |
| Checkout / customer info | Shipping/contact forms | Full name, email, phone, address, city, state, zip, country | Ignore payment fields; card data stays unsupported on purpose. |
| Embedded iframe forms | Vendor-hosted forms inside iframes | Email, phone, LinkedIn, company | Verifies `all_frames` injection and prompt timing. |
| Shadow DOM apps | Design systems using custom elements | Email, LinkedIn, website | Open shadow DOM should work. |
| Ashby | Application pages and embedded jobs | Email, phone, LinkedIn, school, degree, graduation | Trigger through `ashby_jid` pages or `ashbyhq.com` forms. |
| Greenhouse | Job applications | Email, phone, LinkedIn, school, degree | Check application question wrappers and nearby labels. |
| Lever | Job applications | Email, phone, LinkedIn, website | Common camelCase names and custom question labels. |
| Workday | Recruiting flows | Email, phone, address, school, graduation | Focus on slower SPA transitions and selects. |
| SmartRecruiters | Candidate applications | Email, phone, LinkedIn, school | Check iframe or routed application steps. |
| Taleo / Oracle candidate experience | Legacy enterprise applications | Email, phone, address, education | Expect rougher markup and verify prompt behavior manually. |
| Jobvite / iCIMS / Workable | Candidate applications | Email, phone, LinkedIn, graduation | Shared adapter logic should cover most of the heavy lifting. |
