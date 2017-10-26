const debug = require('debug')('react-styleguidist-visual')
const ora = require('ora')

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

module.exports = {
  debug,
  spinner
}
