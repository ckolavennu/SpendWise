# Transaction entry and dashboard prerequisite

Inspected main at `8afffd5` for issues #11 and #12.

## Existing architecture

The transactions page already provides add/edit/delete forms and list filtering. It subscribes to Firebase Auth's `currentUser` store, then holds transactions and custom categories in local Svelte reactive state. There is no separate transaction store, HTTP API, or local-storage persistence. The `Transaction` and `CreateTransactionInput` types describe the existing document contract; they do not validate runtime data.

Persistence is through the browser Firestore SDK:

- Create: `addDoc` under `users/{uid}/transactions/{autoId}`.
- Edit: `updateDoc` on the same user-scoped document; preserves `createdAt`.
- Delete: `deleteDoc` on that document.
- Read: `onSnapshot`, ordered by `transactionDate` descending; cleanup unsubscribes on user change/unmount.
- Custom categories: `users/{uid}/categories`; defaults are merged from `types/category.ts`.
- Budget: `users/{uid}/settings/budget`, with an existing RM 1,200 fallback.

The admin service reads all transaction subcollections with `collectionGroup`. Its coercion/fallback logic is not data validation and does not repair stored records.

## Changes for #11

A shared validator runs in the form and again before create/edit writes. Updates now require a full entry so partial edits cannot bypass cross-field checks. Only known input fields are persisted.

- Type: income or expense.
- Amount: finite positive number, at most two decimal places, bounded to safe integer cents; rejects zero, negatives, NaN and infinity.
- Category: exact available default or user custom category name, compatible with the transaction type (or `both`). The service re-reads custom categories before each write.
- Date: real calendar date in `YYYY-MM-DD`, years 0001–9999. Future dates remain allowed; issue #11 specifies no future-date restriction.
- Payment: cash, card, bank_transfer, e_wallet or other.
- Note: text, trimmed; remains optional as an empty string.

Default/reset dates now use local calendar dates. Saving disables the form and record actions, with a handler guard against duplicate submission. Save/update/delete feedback survives form reset; failed writes preserve form values. Transaction subscription errors are displayed.

## Exact prerequisite for #12

Complete and verify #11's user-scoped, validated write → persisted document → subscription round trip before relying on transaction amounts/types/dates for metrics. Page/type/service presence alone does not establish that prerequisite. New service writes are now validated, but existing records and direct SDK writes are not covered by this client change.

Before declaring dashboard totals trustworthy in production:

1. Verify deployed Firestore rules enforce authenticated ownership and document validation. No Firestore rules or emulator configuration are tracked in this repository; client validation is bypassable.
2. Audit existing documents for invalid amounts, dates and types, including records missing `transactionDate` (Firestore's ordered query excludes these). Do not silently coerce them to zero/defaults.
3. Verify create/edit/reload/delete and denied-write behavior against the configured Firebase project or an emulator with an authenticated test account. Unit tests mock the SDK and do not prove deployed rules or network persistence.

`utils/dashboard.ts` already calculates totals and current-month expenses; the dashboard already subtracts expenses from the budget. #12 still needs daily average spend, an explicit averaging denominator/reporting period, local timezone month boundaries (the current helper uses UTC), validated budget settings, and loading/error states so unavailable data is not presented as zero spending. These are outside this transaction-entry patch.

## Verification

- `npm test`: 26 validation and mocked service tests pass.
- `npm run build`: passes (existing chunk-size/adapter notices).
- ESLint on changed code and Prettier on changed files: pass.
- `npm run check`: blocked by the existing `src/lib/firebase/client.ts` FirebaseOptions error: dynamic public environment values can be undefined under `exactOptionalPropertyTypes`. No diagnostics in transaction changes.
- Live authenticated UI/Firestore round-trip and deployed rules were not tested.
