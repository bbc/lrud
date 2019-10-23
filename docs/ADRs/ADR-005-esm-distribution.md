## ADR 005 - ESM Distribution

### Context

We want to use Lrud as a `tap-static` module, which requires converting to `amd` format. To do so we use `esm-2-amd`, which means we need to distribute lrud as ESM. Currently it's not possible as it's only built to CJS.

### Decision

The distribution folder structure will change with two subfolders, `cjs` and `esm`. The type definitions will also be distributed in another subfolder, `types`. Rollup will still be used to create the CJS and ESM format.

### Status

Approved

### Consequences

The final distribution size will increase.

This change won't affect how current users consume lrud, as the package `main` is updated to point to the CJS min file.
