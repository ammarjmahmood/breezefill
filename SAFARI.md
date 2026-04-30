# Safari Packaging

## Convert the extension

From the project root:

```bash
npm run safari:convert
```

That generates a Safari Web Extension Xcode project under `build/safari/BreezeFill`.

## Useful variants

Only macOS:

```bash
bash scripts/package-safari.sh --macos-only
```

Only iOS:

```bash
bash scripts/package-safari.sh --ios-only
```

Rebuild an existing generated project after updating the web extension files:

```bash
npm run safari:rebuild
```

## Notes

- The converter uses `xcrun safari-web-extension-converter`.
- The default script keeps the Safari project pointed at the source extension files, which avoids recursive copy issues when the output lives inside this repo.
- If you want a self-contained generated project, pass `--copy-resources` with an output path outside the extension directory.
- Final App Store packaging, signing, and distribution still happen in Xcode.
