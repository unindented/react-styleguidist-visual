const joi = require('joi')
const puppeteer = require('puppeteer')
const { getOptions } = require('../utils/options')
const { compareNewScreenshotsToRefScreenshots } = require('../utils/image')
const { getPreviews, takeNewScreenshotsOfPreviews } = require('../utils/page')
const { debug, spinner } = require('../utils/debug')

const testSchema = joi.object().keys({
  url: joi.string().required(),
  sandbox: joi.boolean(),
  dir: joi.string(),
  filter: joi.array().items(joi.string()),
  threshold: joi
    .number()
    .min(0)
    .max(1),
  viewports: joi.object().pattern(
    /^.+$/,
    joi.object().keys({
      width: joi
        .number()
        .integer()
        .min(1),
      height: joi
        .number()
        .integer()
        .min(1)
    })
  )
})

const testDefaults = {
  url: undefined,
  sandbox: true,
  dir: 'styleguide-visual',
  filter: undefined,
  threshold: 0.001,
  viewports: {
    desktop: {
      width: 800,
      height: 600
    }
  }
}

async function test (options) {
  let browser

  try {
    const { url, sandbox, dir, filter, threshold, viewports } = await getOptions(
      options,
      testDefaults,
      testSchema
    )
    const args = sandbox ? [] : ['--no-sandbox', '--disable-setuid-sandbox']

    browser = await puppeteer.launch({ args })
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

module.exports = test
