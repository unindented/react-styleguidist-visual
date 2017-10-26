const { promisify } = require('util')
const joi = require('joi')
const puppeteer = require('puppeteer')
const { compareNewScreenshotsToRefScreenshots, promoteNewScreenshots } = require('./utils/image')
const { getPreviews, takeNewScreenshotsOfPreviews } = require('./utils/page')
const { debug, spinner } = require('./utils/debug')

const validate = promisify(joi.validate)

const testSchema = joi.object().keys({
  url: joi.string().required(),
  dir: joi.string(),
  filter: joi.array().items(joi.string()),
  viewports: joi.object().pattern(/^.+$/, joi.object().keys({
    width: joi.number().integer().min(1),
    height: joi.number().integer().min(1)
  })),
  threshold: joi.number().min(0).max(1)
})

const approveSchema = joi.object().keys({
  dir: joi.string(),
  filter: joi.string()
})

const defaults = {
  url: undefined,
  dir: 'styleguide-visual',
  filter: undefined,
  viewports: {
    desktop: {
      width: 800,
      height: 600
    }
  },
  threshold: 0.001
}

async function test (options) {
  let browser

  try {
    const { url, dir, filter, viewports, threshold } = await getOptions(options, testSchema)

    browser = await puppeteer.launch()
    const page = await browser.newPage()

    for (const viewport of Object.keys(viewports)) {
      const viewportSpinner = spinner(`Taking screenshots for viewport ${viewport}`).start()
      await page.setViewport(viewports[viewport])
      const previews = await getPreviews(page, url, filter, viewport)
      await takeNewScreenshotsOfPreviews(page, dir, previews)
      viewportSpinner.stop()
    }

    await compareNewScreenshotsToRefScreenshots(dir, threshold)
  } catch (err) {
    debug(err)
    throw err
  } finally {
    if (browser != null) {
      await browser.close()
    }
  }
}

async function approve (options) {
  try {
    const { dir } = await getOptions(options, approveSchema)

    await promoteNewScreenshots(dir)
  } catch (err) {
    debug(err)
    throw err
  }
}

async function getOptions (options, schema) {
  const optionsWithDefaults = Object.assign({}, defaults, options)
  return validate(optionsWithDefaults, schema)
}

module.exports = {
  test,
  approve
}
