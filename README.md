# LRUD [![Build Status](https://travis-ci.org/bbc/lrud.svg?branch=master)](https://travis-ci.org/bbc/lrud)

A spatial navigation library for devices with input via directional controls

## Upgrading from V2

**v3 is a major rewrite, covering many new features. However, it unfortunately breaks some backwards compatibility.**

We are currently in the process of writing more detailed docs for an upgrade process. However, the main things to note at the minute at;

- changes in events, which ones are emitted and what they are emitted with
- removal of `grid` in favour of `isIndexAligned` behaviour

## Getting Started

```bash
git clone git@github.com:bbc/lrud.git lrud
cd lrud
npm install
```

Lrud is written in [Typescript](https://www.typescriptlang.org/) and makes use of [mitt](https://github.com/developit/mitt).

## Usage

```bash
npm install lrud
```

```js
const { Lrud } = require('Lrud')

// create an instance, register some nodes and assign a default focus
var navigation = new Lrud()
navigation
  .registerNode('root', { orientation: 'vertical' })
  .registerNode('item-a', { parent: 'root', isFocusable: true })
  .registerNode('item-b', { parent: 'root', isFocusable: true })
  .assignFocus('item-a')

// handle a key event
document.addEventListener('keypress', (event) => {
  navigation.handleKeyEvent(event)
});

// Lrud will output an event when it handles a move
navigation.on('move', (moveEvent) => {
  myApp.doSomethingOnNodeFocus(moveEvent.enter)
})
```

See [usage docs](./docs/usage.md) for details full API details.

For more "full" examples, covering common use cases, check [the recipes](./docs/recipes.md)

## Running the tests

All code is written in Typescript, so we make use of a `tsconfig.json` and `jest.config.js` to ensure tests run correctly.

Test files are split up fairly arbitrarily, aiming to have larger sets of tests broken into their own file. 

```bash
npm test
```

To run a specific test file, use `npx jest` from the project root.

```bash
npx jest src/lrud.test.js
```

You can also run all the tests with verbose output. This is useful for listing out test scenarios to ensure that behaviour is covered.

```bash
npm run test:verbose
```

You can also run all the tests with coverage output

```bash
npm run test:coverage
```

Several of the tests have associated diagrams, in order to better explain what is being tested. These can be found in `./docs/test-diagrams`.

We also have a specific test file (`src/build.test.js`) in order to ensure that we haven't broken the Typescript/rollup.js build.

## Versioning

```bash
npm version <patch:minor:major>
npm publish
```

## Built with

- [Typescript](https://www.typescriptlang.org/)
- [rollup.js](https://rollupjs.org/)
- [mitt](https://github.com/developit/mitt)

## Inspiration

* [BBC - TV Application Layer (TAL)](http://bbc.github.io/tal/widgets/focus-management.html)
* [Netflix - Pass the Remote](https://medium.com/netflix-techblog/pass-the-remote-user-input-on-tv-devices-923f6920c9a8)
* [Mozilla - Implementing TV remote control navigation](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_OS_for_TV/TV_remote_control_navigation)

## Alternatives

* [tal](https://github.com/bbc/tal)
* [react-tv-navigation](https://github.com/react-tv/react-tv-navigation)
* [react-key-navigation](https://github.com/dead/react-key-navigation)
* [js-spatial-navigation](https://github.com/luke-chang/js-spatial-navigation)

# License


LRUD is part of the BBC TAL libraries, and available to everyone under the terms of the Apache 2 open source licence (Apache-2.0). Take a look at the LICENSE file in the code.

Copyright (c) 2018 BBC

