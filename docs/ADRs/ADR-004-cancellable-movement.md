## ADR 003 - Handling duplicate node IDs

### Context

There has been interest from other teams using LRUD that the ability to _cancel_ a movement as it's happening would be useful.

For example, focussing on a node and pressing down would ordinarily take you to the specified node, but perhaps the developer wants to run some business logic at that point that would mean that _actually we don't want the move to happen._

### Decision

We have decided to implement this feature in LRUD. It will be useful for the specific team that requested the feature, and as further discussions have happened, all interested parties agree that there are valid use cases in many different scenarios for such a feature.

### Status

Approved

### Consequences

It makes LRUD internally more complex (and alongside that makes the final bundle larger too). However, it is only marginally increasing the bundle size, and we feel the complexity is managable and well understood.

### Further Reading

- [Github issue discussing topic of cancellable movement](https://github.com/bbc/lrud/issues/25)
