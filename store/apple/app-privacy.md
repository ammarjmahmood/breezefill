# Apple App Privacy Answers

These answers match the current BreezeFill codebase as of April 30, 2026.

Apple’s privacy guidance says data processed only on device is not considered “collected.” BreezeFill stores autofill data locally and does not send it to a BreezeFill server, so the current submission answer should be:

## App Privacy summary

- Data collection: `No, this app does not collect data`
- Tracking: `No`

## Why this is the right answer

- BreezeFill stores profile values, remembered responses, and preferences locally using browser extension storage.
- BreezeFill does not operate a backend for account sync, analytics, advertising, or remote processing.
- The current app does not send saved autofill data off device to BreezeFill-controlled servers.

## Important caveat

Revisit these answers before any future release if you add:

- analytics
- crash reporting SDKs
- remote sync
- accounts or authentication
- cloud backups
- donation or payment SDKs inside the app
- support chat or embedded third-party forms

If any of those are added, App Privacy answers may change.

## Practical App Store Connect choice

When App Store Connect asks whether your app collects data from this app, choose:

`No`

## Tracking

When App Store Connect asks whether your app uses data for tracking, choose:

`No`

## Notes for reviewers

If App Review asks how the app handles user data, you can point them to:

- `https://breezefill.vercel.app/privacy/`
- [app-store-metadata.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/store/apple/app-store-metadata.md)

Official reference:

- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
