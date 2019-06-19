## ADR 001 - Adding Navigation Overrides

Originally Added: Feb 28, 2019

### Context

LRUD navigation trees already work very well when every component you need to render is included inside the same tree. e.g if you can render an entire page and all elements are inside the same tree, eventually pointing to the same root container.

The current SSR request/response system has to build multiple LRUD trees, however.

This is because the Partial Page Update System (PPUS) inside our mountains relys on a "Region" system (where each Region defines both its markup and LRUD navigation tree) and the ability to "hot swap" these Regions in and out of a page, along with their navigation nodes.

When new Regions are loaded in, there is a "primary tree" that is rebuilt from all the navigation nodes of each loaded-in Region.

Because this "primary tree" is made up purely from the concatonated nodes of the Region trees, none of the Regions have information about how they relate to _each other_. For example, no 2 Regions can currently be horizontally aligned next to each other.

Alongside this, there are _also_ situations arising where desired journeys around the page don't align exactly with the layout. For example, any given page may want to land on node "X" from node "Y" when the user presses "UP", even through in the navigation tree those 2 nodes are horizontally aligned next to each other (product/UX requirements, etc.)

### Decision

We want to implement an `overrides` system into an LRUD instance.

The overrides can live alongside the `navigation` object.

It will be an array of objects, each representing an override for a direction from a node to another node.

For example, a given override may represent "when on node 'X', and the user presses 'UP', go to node 'Y'"

Because the overrides live as a separate data item on an instance, and are checked at run time, they can be updated/added/removed as and when needed, based on app state.

### Status

Approved

### Consequences

- LRUD now "handles" more information than just a navigation tree. This is extra complexity, and as it is an extra data item, any LRUD implementation that currently moves data around will also have to move around the `overrides`

- naive overrides can cause unexpected behaviour in LRUD itself. For example, setting an override target to `X` will _actually_ cause the final focus to end up on the first focusable child of `X`. While this does make sense, it can be somewhat unintuitive at first
