const debug = require('debug')('react-styleguidist-visual')
const chalk = require('chalk')
const ora = require('ora')
const { format } = require('util')

const fakeOra = () => {
  const fake = {}
  fake.start = () => fake
  fake.stop = () => fake
  return fake
}

const spinner = text => {
  if (debug.enabled) {
    return fakeOra()
  }
  return ora({ color: 'white', text })
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
