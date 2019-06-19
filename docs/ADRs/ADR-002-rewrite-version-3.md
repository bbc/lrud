## ADR 002 - Adding Navigation Overrides

### Context

After much usage of LRUD V2, we (Lovely Horse 🐴) have ended up with a laundry list of things we want LRUD to do that V2 doesn't support. We also have a desire for a more maintainable codebase that utilises more up-to-date terminology for the expected behaviour of LRUD.

The list of desired functionality currently sits at;

- a real tree structure
- cleaner/easier to understand "grid" functionality
- supporting a concept of "column span"/"column width"
- real definition of which node is the “root” node
- all focusable nodes to maintain an "index" for easier understanding or sorting
- better handling of unregistering

### Decision

We have decided to re-write LRUD from the ground up, maintaining many of the concepts from V2, while addressing the list of desired functionality.

This will also give us an opportunity to re-write LRUD into Typescript, further increasing the maintainability of the codebase in future.

### Status

Approved

### Consequences

- user land usages of LRUD will need to update their code in order to make use of the new version. We are planning to keep breaking changes to a minimum, but some changes will be necessary.

- slightly increased library size, affecting response payload sizes. The increase in size is small enough (an increase of 2.6kb when minified) that we deem this acceptable. Furthermore, the changes mean that current "workaround" code in service land can be removed, reducing payload size in other areas.

- slightly increased runtime computation. Usage of a real tree in memory requires extra computation. Dedicated testing will take place to ensure LRUD is still performant enough on low powered devices, but initial testing of 92 test cases in 2.4s suggests this is well within limits.

### Further Reading

- [Paper Doc discussing what LRUD is and why we want to change some things](https://paper.dropbox.com/doc/SSR-Controller-Module-LRUD-V3--Aca6ZBsM4Uv8zEN44j5o4TsvAg-y0v9YqarEOXNP7R2151RK)