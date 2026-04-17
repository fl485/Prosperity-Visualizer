# Contributing

Thanks for thinking about contributing! The project is small and the code is
intentionally boring so it's easy to fork.

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # tsc --noEmit
npm run test         # vitest unit tests
npm run build        # production build into dist/
npm run preview      # serve the built dist/
```

## Ground rules

- **No telemetry.** Not even privacy-respecting telemetry. Ever.
- **No external scripts loaded at runtime** (CDN fonts/CSS are fine; tracking
  pixels and analytics SDKs are not).
- **Keep the parsed data in-memory-only by default.** The IndexedDB
  persistence toggle must stay opt-in.
- **Don't hardcode product names.** Derive them from `activitiesLog`.

## Adding a new Prosperity season

Two touchpoints for a new season:

1. **Position limits.** Edit `src/lib/positionLimits.ts` and add entries for
   the new symbols. The UI lets users override at runtime too, so this is a
   quality-of-life default rather than a correctness gate.
2. **Anything else?** Usually nothing. Product names, timestamps, and the log
   schema have been stable across seasons. If IMC changes the CSV schema,
   update `src/lib/parser.ts::parseActivitiesCsv` and the `ProductTickRow`
   type in `src/types.ts`.

## Filing issues

If the visualizer chokes on a log, a reduced `.log` attached to the issue is
worth a thousand words — but remember that logs may contain algorithm output
you consider private. A redacted or synthetic minimal reproducer is always
fine.

## Code style

- Prettier defaults, TypeScript strict, no ESLint drama.
- Keep panels small. New panels go under `src/components/panels/` and get
  registered in `Dashboard.tsx`.
