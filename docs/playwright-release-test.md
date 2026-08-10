# Playwright phone release test

## What Playwright is

[Playwright Test](https://playwright.dev/docs/intro) controls a real browser in
the same way a person uses the application: it opens pages, finds visible
controls, enters text, clicks buttons, and checks what appears next.

This is an **end-to-end test**. Unlike the Vitest tests, which check individual
components and application services in isolation, this test crosses the whole
deployed system:

```text
Browser → Vercel application → Railway PostgreSQL
                            → OpenAI generation API
```

That makes it useful as a final release check. It can catch deployment problems
that a unit test cannot, such as missing Vercel variables, an unreachable
database, broken redirects, or controls that do not work at a phone-sized
viewport.

## The two Playwright files

- [`playwright.config.ts`](../playwright.config.ts) defines where tests live,
  which browser profile to use, the time limits, and the deployed URL.
- [`tests/e2e/phone-release.spec.ts`](../tests/e2e/phone-release.spec.ts)
  describes the actions performed during the release journey.

The package is installed with the project, but its Chromium browser executable
is installed separately. Keeping browser installation separate avoids adding a
large browser download to an ordinary dependency installation.

## How this project configures Playwright

The configuration requires `RELEASE_BASE_URL`. For example:

```bash
RELEASE_BASE_URL=https://your-preview.vercel.app bun run test:e2e:release
```

The value applies only to that command. It tells Playwright which deployment to
open. Test code can then use paths such as `/generate` and `/study`; Playwright
combines each path with the base URL.

Other important settings are:

- `testDir: "./tests/e2e"` keeps deployed browser tests separate from Vitest.
- `devices["iPhone 13"]` supplies a phone-sized viewport, touch support, and a
  mobile browser profile. The test still runs in Chromium; it is an emulation,
  not a physical iPhone or a complete Safari compatibility test.
- `timeout: 180_000` allows up to three minutes because the real generation API
  and deployed network are slower than local code.
- `expect: { timeout: 10_000 }` allows an individual visible result up to ten
  seconds to appear.
- `trace: "retain-on-failure"` keeps a detailed browser recording when the test
  fails and removes it after a successful run.
- `forbidOnly: true` prevents an accidentally committed `test.only(...)` from
  silently skipping the rest of a release suite.

Playwright runs headlessly by default, meaning the browser has no visible
window. This is faster and works in automation environments.

## What the phone journey does

The test performs one complete workflow:

1. It creates four manual Flashcards. These guarantee that the scheduler has at
   least three alternatives for the Retry Gap.
2. It opens `/generate`, pastes Norwegian Source Text, and waits for the real
   configured provider to return Card Drafts.
3. It edits the first draft to a unique Norwegian Front and English Back. The
   unique suffix prevents data from an earlier run being mistaken for the new
   card.
4. It saves the edit, adds all remaining drafts, and confirms that the edited
   Flashcard appears in the collection.
5. It opens `/study` and answers other cards until the generated target card is
   selected.
6. It reveals the target's English Back and records an Incorrect result.
7. It checks that the next three studied positions are different Flashcards.
8. It continues studying until the target appears again, proving that it became
   eligible after its three-card Retry Gap.

The scheduler is intentionally random, so the test allows up to 80 selections
when looking for the target. A clean Preview database keeps this fast and makes
the result reliable. A database containing hundreds of unrelated cards could
make the test hit that limit even when the scheduler is correct.

The test finds controls primarily by their accessible label or role, such as
`Norwegian Front` or the `Save Flashcard` button. This resembles how assistive
technology understands the page and is more stable than selecting elements by
CSS class names. Playwright's web-first assertions automatically wait for
results such as redirects or visible buttons instead of relying on fixed sleep
delays.

## Safe setup and execution

Use a dedicated Vercel Preview deployment connected to a disposable Railway
database. Do not point the test at the production learning collection: it calls
OpenAI and permanently creates Source Text, Card Drafts, Flashcards, and Study
Results.

Prepare the Preview environment and install Chromium once:

```bash
vercel env run -e preview -- bun run release:prepare
bunx playwright install chromium
```

Then deploy the Preview and run:

```bash
RELEASE_BASE_URL=https://your-preview.vercel.app bun run test:e2e:release
```

A successful run ends with one passing `phone-chromium` test. Reset or replace
the disposable database before repeated release runs if it has accumulated
test cards.

This test is intentionally excluded from `bun run test`. Normal continuous
integration therefore needs neither a deployed URL nor live OpenAI access.

## Watching or debugging the test

To watch the browser perform the journey:

```bash
RELEASE_BASE_URL=https://your-preview.vercel.app bun run test:e2e:release --headed
```

To pause execution with the Playwright Inspector and step through actions:

```bash
RELEASE_BASE_URL=https://your-preview.vercel.app bun run test:e2e:release --debug
```

On failure, Playwright writes artifacts under `test-results/`. Open the reported
`trace.zip` to inspect the action timeline, page snapshots, console messages,
and network activity:

```bash
bunx playwright show-trace test-results/path-from-the-failure/trace.zip
```

Both `test-results/` and `playwright-report/` are ignored by Git.

## Common failures

- **`RELEASE_BASE_URL is required`**: provide the complete Preview URL on the
  same command line as the test.
- **Browser executable is missing**: run `bunx playwright install chromium`.
- **Generation times out or returns a failure page**: verify Preview's
  `OPENAI_API_KEY`, `OPENAI_MODEL`, provider credit, and Vercel server logs.
- **A database page fails**: run the release preparation command and verify that
  Preview uses Railway's public connection URL.
- **The target card is not found within 80 positions**: reset the disposable
  Preview database. A large pre-existing collection reduces the chance of any
  particular card being selected quickly.
- **A locator cannot find a button or field**: first inspect the trace. The UI's
  accessible label may have changed, in which case the test should be updated
  to match the wording a learner now sees.

## What this test does not replace

The emulated journey does not prove behavior on every physical phone, test
Safari rendering, or cover every feature. Complete the manual phone/desktop and
failure-log checks in [`release-checklist.md`](release-checklist.md) before the
production rollout.
