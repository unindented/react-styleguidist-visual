#!/usr/bin/env node
const yargs = require('yargs')
const { test, approve } = require('.')

const configParser = configPath => require(configPath)

// eslint-disable-next-line no-unused-expressions
yargs
  .command('test', 'Take screenshots of all examples in the specified URL.', testArgs, testCommand)
  .command('approve', 'Approve all new screenshots.', approveArgs, approveCommand)
  .demandCommand()
  .help()
  .wrap(null)
  .argv

function testArgs (yargs) {
  yargs
    .option('url', {
      describe: 'URL to screenshot',
      type: 'string',
      requiresArg: true
    })
    .option('dir', {
      type: 'string',
      description: 'Directory where screenshots are stored',
      requiresArg: true
    })
    .option('filter', {
      type: 'array',
      description: 'Only collect screenshots for these components',
      requiresArg: true
    })
    .demandOption(['url'])
    .config('config', configParser)
    .example(
      '$0 test --url "https://react-styleguidist.js.org/examples/basic/"',
      '# Take screenshots of all examples in the page'
    )
    .example(
      '$0 test --url "https://react-styleguidist.js.org/examples/basic/" --filter "Button"',
      '# Take screenshots of all examples for the "Button" component'
    )
}

function approveArgs (yargs) {
  yargs
    .option('dir', {
      type: 'string',
      description: 'Directory where screenshots are stored'
    })
    .option('filter', {
      type: 'array',
      description: 'Only approve screenshots for these components'
    })
    .config('config', configParser)
    .example('$0 approve', '# Approve all new screenshots')
    .example(
      '$0 approve --filter "Button"',
      '# Approve all new screenshots for the "Button" component'
    )
}

function testCommand (argv) {
  const { url, dir, filter } = argv
  const options = cleanup({ url, dir, filter })
  test(options).catch(err => {
    console.log(err.message)
    process.exit(1)
  })
}

function approveCommand (argv) {
  const { dir, filter } = argv
  const options = cleanup({ dir, filter })
  approve(options).catch(err => {
    console.log(err.message)
    process.exit(1)
  })
}

function cleanup (obj) {
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined) {
      delete obj[key]
    }
  }
  return obj
}
