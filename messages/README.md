# Messages

`en.json` is the source language. Every other file holds the same keys, translated.

A key that is missing from a locale falls back to English at runtime, so a partial
file is never a broken screen — but a partial locale is **not offered in the language
picker**. A locale appears only when it is complete, because a screen that switches
language halfway through is worse for a low-literacy reader than one that does not
switch at all.

`tl.json` (Tagalog) and `id.json` (Bahasa Indonesia) are empty on purpose. They are
waiting for translators from the community partner organisations, and they are in the
repository from the first commit so that every layout is built and tested against
longer text rather than retrofitted for it.

Workflow:

1. `npm run content:export` writes a CSV with one column per locale.
2. Translators fill in their column in the shared sheet.
3. `npm run content:import` writes the strings back into these files.
4. `npm run qa:messages` recomputes `status.json` and fails if it is stale.

Never machine-translate a string into these files. Every line here is read by someone
deciding what to do with money they cannot afford to lose.
