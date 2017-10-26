const { promisify } = require('util')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const { debug } = require('./debug')

const ensureDir = promisify(fs.ensureDir)

async function getPreviews (page, url, filter, viewport) {
  await goToUrl(page, url)

  return page.evaluate(getPreviewsInPage, filter, viewport)
}

function getPreviewsInPage (filters, viewport) {
  const shouldIncludePreview = (name) => {
    if (filters == null) {
      return true
    }

    return filters.some((filter) => {
      const regexp = new RegExp(filter.toLowerCase())
      return regexp.test(name.toLowerCase())
    })
  }

  const extractPreviewInfo = (memo, el) => {
    const url = el.nextSibling.querySelector('a[href][title]').href
    const name = el.dataset.preview
    const description = el.dataset.example

    if (!shouldIncludePreview(name)) {
      return memo
    }

    memo[name] = (memo[name] || []).concat({
      url,
      name,
      description,
      viewport
    })
    return memo
  }

  const result = document.querySelectorAll('[data-preview]')
  return Array.prototype.reduce.call(result, extractPreviewInfo, {})
}

async function takeNewScreenshotsOfPreviews (page, dir, previewMap) {
  await ensureDir(dir)

  for (const name of Object.keys(previewMap)) {
    const previewList = previewMap[name]

    let index = 0
    for (const preview of previewList) {
      const { url } = preview
      await goToHashUrl(page, url)
      await reload(page)
      await takeNewScreenshotOfPreview(page, dir, preview, ++index)
    }
  }
}

async function takeNewScreenshotOfPreview (page, dir, preview, index) {
  const { name, description, viewport } = preview
  const basename = `${name} ${description || index} ${viewport}`.replace(/[^0-9A-Z]+/gi, '_')
  const relativePath = path.join(dir, `${basename}.new.png`)

  const clip = await page.evaluate(() => {
    const el = document.querySelector('[data-preview]')
    return el.getBoundingClientRect()
  })

  debug('Storing screenshot of %s in %s', chalk.blue(name), chalk.cyan(relativePath))
  await page.screenshot({ clip, path: relativePath })
}

async function goToUrl (page, url) {
  debug('Navigating to URL %s', chalk.blue(url))
  return page.goto(url, { waitUntil: 'networkidle' })
}

async function goToHashUrl (page, url) {
  debug('Navigating to hash URL %s', chalk.blue(url))
  return page.evaluate(url => {
    window.location.href = url
  }, url)
}

async function reload (page) {
  debug('Reloading')
  return page.reload({ waitUntil: 'networkidle' })
}

module.exports = {
  getPreviews,
  takeNewScreenshotsOfPreviews
}
