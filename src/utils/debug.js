const debug = require('debug')('react-styleguidist-visual')
const chalk = require('chalk')
const ora = require('ora')
const { format } = require('util')

const spinner = ({ start, update, stop }) => {
  const instance = ora({ color: 'white', text: start, enabled: debug.enabled ? false : undefined })

  return {
    start: () => {
      instance.text = start
      instance.start()
    },
    update: (curr, total) => {
      instance.text = format(update, curr, total)
    },
    stop: () => {
      instance.text = stop
      instance.stop()
    }
  }
}

const info = (text, ...args) => {
  console.log(`  ${text}`, ...args)
}

const success = (text, ...args) => {
  console.log(format(`%s ${text}`, chalk.green('✔'), ...args))
}

const failure = (text, ...args) => {
  console.log(format(`%s ${text}`, chalk.red('✖'), ...args))
}

module.exports = {
  debug,
  spinner,
  info,
  success,
  failure
}
