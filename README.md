# Visual Testing for React Styleguidist

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

You can capture screenshots after simulating an action, by providing a JSON.stringified list of actions as props to the component wrapper like this:

```
  ```js { "props": { "data-action-states": "[{\"action\":\"none\"},{\"action\":\"hover\",\"selector\":\".my-button\"},{\"action\":\"focus\",\"selector\":\".my-button\"}]" } }
  <button classNames='my-button' />
```

Available actions are `none`, `hover`, `focus`, `click` and `mouseDown`.
`none` captures the component without performing an action.

### Debugging

Use the `DEBUG` environment variable to see debugging statements:

```
$ DEBUG=react-styleguidist-visual npx styleguidist-visual test --url "https://react-styleguidist.js.org/examples/basic/"
```


## Meta

* Code: `git clone git://github.com/unindented/react-styleguidist-visual.git`
* Home: <https://github.com/unindented/react-styleguidist-visual/>


## Contributors

* Daniel Perez Alvarez ([unindented@gmail.com](mailto:unindented@gmail.com))


## License

Copyright (c) 2017 Daniel Perez Alvarez ([unindented.org](https://unindented.org/)). This is free software, and may be redistributed under the terms specified in the LICENSE file.
