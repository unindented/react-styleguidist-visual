const { promisify } = require('util')
const joi = require('joi')

const validate = promisify(joi.validate)

async function getOptions (options, defaults, schema) {
  const optionsWithDefaults = Object.assign({}, defaults, options)
  return validate(optionsWithDefaults, schema)
}

module.exports = {
  getOptions
}
