# Visual Testing for React Styleguidist [![Version](https://img.shields.io/npm/v/react-styleguidist-visual.svg)](https://www.npmjs.com/package/react-styleguidist-visual) [![Build Status](https://img.shields.io/travis/unindented/react-styleguidist-visual.svg)](http://travis-ci.org/unindented/react-styleguidist-visual)

Allows you to do easy visual diffing of your [React Styleguidist](https://react-styleguidist.js.org/) examples.

![Demo of `react-styleguidist-visual`](docs/demo.gif)

## Installation

Add the dependency to your project:

```
$ npm install --save-dev react-styleguidist-visual
```

## Usage

Point the tool to your styleguide:

```
$ npx styleguidist-visual test --url "https://react-styleguidist.js.org/examples/basic/"
```

You can also test against your local style guide.
The following command will first build the style guide and then run the visual test.

```
$ npx styleguidist build && styleguidist-visual test --url \"file://$(pwd)/styleguide/index.html\"
```

The first time you run the tool, it will create reference screenshots for all examples in your styleguide, and store them in the `styleguide-visual` folder. If you run the same command again, it will take new screenshots, compare them to the reference ones, and show you the differences between them.

If the new screenshots look good, you can promote them to be the new reference files by running:

```
$ npx styleguidist-visual approve
```

### Options

You can see all possible options by appending the `--help` argument to any command:

```
$ npx styleguidist-visual --help
$ npx styleguidist-visual test --help
$ npx styleguidist-visual approve --help
```

### Action States

You can capture screenshots after simulating an action, by providing a `JSON.stringify`ed list of actions as props to the component wrapper like this:

````md
```js { "props": { "data-action-states": "[{\"action\":\"none\"},{\"action\":\"hover\",\"selector\":\".my-button\",\"wait\":\"1000\"},{\"action\":\"focus\",\"selector\":\".my-button\"},{\"action\":\"keyPress\",\"key\":\"Tab\"}]" } }
<Button className="my-button" />
```
````

Available actions are:

- `none` - Capture the component without performing an action.
- `hover` - Provide a `selector` to hover over.
- `focus` - Provide a `selector` to focus on.
- `click` - Provide a `selector` to click on.
- `mouseDown` - Provide a `selector` to mouse down on.
- `keyPress` - Provide a [`key`](https://github.com/GoogleChrome/puppeteer/blob/v1.4.0/lib/USKeyboardLayout.js) to press.
- `wait` - An optional time in ms to wait between performing the action and snapping the screenshot.

### Debugging

Use the `DEBUG` environment variable to see debugging statements:

```
$ DEBUG=react-styleguidist-visual npx styleguidist-visual test --url "https://react-styleguidist.js.org/examples/basic/"
```

## Meta

- Code: `git clone git://github.com/unindented/react-styleguidist-visual.git`
- Home: <https://github.com/unindented/react-styleguidist-visual/>

## Contributors

- Daniel Perez Alvarez ([unindented@gmail.com](mailto:unindented@gmail.com))

## License

Copyright (c) 2018 Daniel Perez Alvarez ([unindented.org](https://unindented.org/)). This is free software, and may be redistributed under the terms specified in the LICENSE file.
