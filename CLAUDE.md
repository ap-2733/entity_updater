# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A library for automatically updating RTK-Query cache entries in-place, without invalidation and refetch. It uses TypeScript AST analysis of the generated RTK-Query API to build a map of which queries can contain which entities, then dispatches Immer-based patch actions to update all matching cache entries at once.

## Commands

```bash
npm test                        # run all Jest tests
npx jest test/findEntity.test.ts  # run a single test file
npx jest -t "finds a user"     # run tests matching a name pattern
npm run lint                    # ESLint + tsc --noEmit
npx tsx src/scripts/generate.ts # regenerate src/store/generated/productApi.ts + utils.ts
npm run generate                # full pipeline: OpenAPI codegen → generateTypeSchema
npm run serve                   # start Express mock server (port 3000)
```

## Architecture

### Code generation pipeline

`src/scripts/generate.ts` orchestrates two steps:
1. **OpenAPI → RTK-Query** (`npm run generate` prefix): `@rtk-query/codegen-openapi` turns `src/store/schema.json` into `src/store/productApi.ts`
2. **TypeScript AST → maps + helpers** (`npx tsx src/scripts/generate.ts`): `generateTypeSchema` writes `src/store/generated/productApi.ts` and copies `src/scripts/utils.ts` to the same directory as `src/store/generated/utils.ts`

`src/scripts/ts-utils/generateTypeSchema.ts` is the core generator. It:
- Walks the AST of `productApi.ts` to extract query/mutation response types
- Builds `queryMap` (query name → response shape), `mutationsMap` (PUT/PATCH name → entity type), `entityIdFields` (entity → id field name), `entityQueries` (entity → list of queries that can contain it)
- Appends `updateEntity`, `deleteEntity`, and `setupMutationListeners` functions (sourced from `src/scripts/content/index.ts`)
- POST mutations are intentionally excluded from `mutationsMap` (they create new entities not yet in cache)

### Runtime utilities (`src/scripts/utils.ts`)

This file is also copied verbatim to the generated output dir. It exports:

- **`findEntityGenerator`** — generator that walks query cache data using the shape maps. Yields at time boundaries so the browser stays responsive (via `requestIdleCallback` + `promisifyGenerator`). Takes `entityIdFields`, `queryMap`, `entityQueries` as explicit parameters so it works both in development (from `src/scripts/utils.ts`) and in the generated output.
- **`findEntity`** — async wrapper around `findEntityGenerator`; navigates `state[reducerPath].queries` and returns `keyPaths` as `[queryCacheKey, "data", ...keypath]` arrays (full paths from the queries object).
- **`updateEntityInternal`** / **`deleteEntityInternal`** — Redux thunks that call `findEntity` then dispatch `api/queries/entitiesUpdated` or `api/queries/entitiesDeleted`.
- **`setupMutationListenersInternal`** — wires RTK `createListenerMiddleware` so every fulfilled PUT/PATCH mutation automatically calls `updateEntityInternal`.
- **`wrapApiReducer`** — higher-order reducer that intercepts the two custom action types and applies the patches using Immer.

### Action types and reducer

`wrapApiReducer` must wrap `productApi.reducer` in the Redux store configuration:

```typescript
reducer: { api: wrapApiReducer(productApi.reducer) }
```

It handles:
- `api/queries/entitiesUpdated` — `set(draft.queries, keyPath, updatedEntity)` for each keyPath
- `api/queries/entitiesDeleted` — `remove(draft.queries, keyPath)` for each keyPath

keyPaths are relative to the `queries` object (e.g., `["getUsers({})", "data", 0]`).

### Consumer API (`src/scripts/content/index.ts` / generated file)

The generated `src/store/generated/productApi.ts` re-exports everything from `utils.ts` with `"api"` hardcoded as the reducer path and the generated maps pre-bound:

```typescript
updateEntity(entityType, id, updater)     // → dispatch thunk
deleteEntity(entityType, id)              // → dispatch thunk
setupMutationListeners(listenerMiddleware, api)
```

## Testing

`test/setupTests.ts` calls `jest.useFakeTimers()` in `beforeEach`. This replaces `setTimeout` globally, so anything that depends on timers (including `requestIdleCallback` polyfills) must use `Promise.resolve()` microtask flushing instead.

Tests mock `requestIdleCallback` in each `beforeEach`:
```typescript
(global as any).requestIdleCallback = (cb) => { Promise.resolve().then(() => cb({ timeRemaining: () => Infinity, didTimeout: false })); return 0; };
```

`mutationListeners.test.ts` uses a real store but omits `productApi.middleware` to avoid network requests; it pre-populates the query cache via `preloadedState` and dispatches fulfilled mutation actions manually using the `api/executeMutation/fulfilled` action type.

`findEntityGenerator` requires `entityIdFields`, `queryMap`, and `entityQueries` as explicit arguments (imported from `@/src/store/generated/productApi`).

## Key constraints

- `src/store/productApi.ts` is auto-generated — do not edit it manually; modify `src/store/schema.json` and regenerate.
- `src/store/generated/productApi.ts` and `src/store/generated/utils.ts` are generated outputs — do not edit them directly; run `npx tsx src/scripts/generate.ts`.
- The `@/` path alias maps to the project root (`./`).