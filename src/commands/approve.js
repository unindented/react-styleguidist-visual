const joi = require('joi')
const { getOptions } = require('../utils/options')
const { promoteNewScreenshots } = require('../utils/image')
const { debug } = require('../utils/debug')

const approveSchema = joi
  .object()
  .unknown()
  .keys({
    dir: joi.string(),
    filter: joi.array().items(joi.string())
  })

const approveDefaults = {
  dir: 'styleguide-visual',
  filter: undefined
}

async function approve (partialOptions) {
  try {
    const options = await getOptions(partialOptions, approveDefaults, approveSchema)
    const { dir, filter } = options

    await promoteNewScreenshots({ dir, filter })
  } catch (err) {
    debug(err)
    throw err
  }
}

module.exports = approve
