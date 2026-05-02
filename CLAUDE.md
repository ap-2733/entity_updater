# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                   # run all tests
npm test -- --testPathPattern=products   # run a single test file
npm run lint               # eslint
npm run generate           # regenerate src/store/productApi.ts from src/store/schema.json
npm run mapping            # regenerate src/store/mapping.ts and src/store/updaters.ts from productApi.ts
```

## Architecture

This is a demo of **cache-update-without-invalidation** for RTK Query. The problem: when a shared entity (e.g. `Product`) appears in multiple cached queries, updating it normally requires invalidating all those queries, causing unnecessary refetches. This project solves it by patching cached data in place across all queries simultaneously.

### Two-phase design

**Phase 1 — Code generation** (`src/scripts/`): A build-time pipeline that analyzes the generated RTK Query API file using the TypeScript compiler API and produces two files:

- `src/store/mapping.ts` — maps each entity type name to the query names and key-paths where it appears in the response shape, e.g.:
  ```ts
  Product: {
    getProducts: [["[]"]],          // array root
    getProductsById: [["product"]], // nested under "product" key
  }
  ```
- `src/store/updaters.ts` — one `createAsyncThunk` per entity type (e.g. `updateProductEntity`), each accepting `{ filter, update }`.

The pipeline: `generate.ts` → `buildMapping` → `findQueries` (walks the TS AST for `.query<T>()` calls) → `visitTypes` (recursively traverses the response type, recording key paths) → `isEntityType` (identifies named object alias types as entities).

**Phase 2 — Runtime** (`src/store/updateEntity.ts`): `updateEntity()` iterates all live RTK Query cache entries, looks up each query name in the mapping, and calls `api.util.updateQueryData` to walk the response along the recorded key-paths and patch any object matching the filter fields.

### File roles

| File | Role |
|---|---|
| `src/store/schema.json` | OpenAPI schema (source of truth for the API) |
| `src/store/emptyApi.ts` | Base RTK Query API split — input to codegen |
| `src/store/productApi.ts` | Generated RTK Query API (do not edit manually) |
| `src/store/mapping.ts` | Generated entity→query mapping (do not edit manually) |
| `src/store/updaters.ts` | Generated async thunks per entity (do not edit manually) |
| `src/store/updateEntity.ts` | Core runtime logic for patching the cache |
| `src/scripts/` | Build-time codegen pipeline using the TS compiler API |
| `test/server.ts` | MSW mock server used by tests |

### Key path notation

Key paths in `mapping.ts` use `"[]"` to mean "iterate over array elements". A path of `["product"]` means `response.product`; `["reviews", "[]"]` means `response.reviews[i]`.

### Adding a new entity type

1. Update `src/store/schema.json` with the new OpenAPI spec.
2. Run `npm run generate` to regenerate `productApi.ts`.
3. Run `npm run mapping` to regenerate `mapping.ts` and `updaters.ts`.

The `isEntityType` heuristic identifies an entity as any named (`aliasSymbol`) non-array object type with at least one property.