const joi = require('joi')
const { getOptions } = require('../utils/options')
const { promoteNewScreenshots } = require('../utils/image')
const { debug } = require('../utils/debug')

const approveSchema = joi.object().keys({
  dir: joi.string(),
  filter: joi.string()
})

const approveDefaults = {
  dir: 'styleguide-visual',
  filter: undefined
}

async function approve (options) {
  try {
    const { dir } = await getOptions(options, approveDefaults, approveSchema)

    await promoteNewScreenshots(dir)
  } catch (err) {
    debug(err)
    throw err
  }
}

module.exports = approve
