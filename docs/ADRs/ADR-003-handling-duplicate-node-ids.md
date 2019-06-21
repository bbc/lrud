## ADR 003 - Handling duplicate node IDs

### Context

The registration of a node requires an ID to be given.

This ID is then used internally in LRUD for retrieving/manipulating the specific Node.

IDs are also "surfaced" and used as part of the API, in functions such as `getNode(<node id>)`.

Questions have been raised around whether or not LRUD should support _duplicate_ IDs.

**Is it technically feasible?**

Yes. The actual "internal" ID of a node could be the combination of its own ID and all its parents. This means we could handle duplicate IDs as long as no 2 IDs were both duplicates _and_ siblings.

OR, we could make it so all IDs that are registered are actually registered as the ID concatonated with a UUID, etc.

So the question is, should we?

**Pros**

- the data that is used to build a navigation tree can be even dumber, in that it can allow internal IDs in itself. For example, 2 footers on the same page but under different parents would be valid, e.g

```js
nav.registerNode('footer', { parent: 'left_column' })
nav.registerNode('footer', { parent: 'right_column' })
```

**Cons**

- Implicit confusion. By allowing duplicate IDs, the tree is now filled with multiple of the same ID at different levels. This will add confusion to any process attempting to parse the tree (both human and machine process)
- Complicates the surface of the API. For example, the user can currently call `getNode(<node id>)`. If duplicate IDs exist in the tree, these methods must handle this.
- Complicates service-land code that makes use of LRUD. Lots of code exists in services that do something along the lines of "register a node with ID x and then later on, use the ID of X to get that node back out". This is done using calls such as `getNode()` (as explained above). This means service land will now need to start keeping track of which nodes live under which parents, etc. which immediately becomes a huge headache.
- Complicates the internal state and processes of LRUD. It means that the internal pathing mechanisms and state of LRUD must complicate to handle duplicate IDs across different parents.

### Decision

We have decided that until the need arrises, we will _not_ allow duplicate IDs.

If `registerNode()` is called with an ID that has already been registered against the navigation instance, an exception will be thrown.

### Status

Approved

### Consequences

As discussed above, it means the registration data and processes of registering must ensure that no duplicate IDs are used.
