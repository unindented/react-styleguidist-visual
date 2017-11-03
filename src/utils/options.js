const { promisify } = require('util')
const joi = require('joi')

const validate = promisify(joi.validate)

async function getOptions (options, defaults, schema) {
  const optionsWithDefaults = Object.assign({}, cleanOptions(defaults), cleanOptions(options))
  return validate(optionsWithDefaults, schema)
}

function cleanOptions (options) {
  return Object.keys(options).reduce((memo, key) => {
    if (options[key] != null) {
      memo[key] = options[key]
    }
    return memo
  }, {})
}

module.exports = {
  getOptions
}
