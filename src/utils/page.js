const { promisify } = require('util')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const { debug } = require('./debug')

const ensureDir = promisify(fs.ensureDir)

async function getPreviews (page, { url, filter, viewport, navigationOptions }) {
  await goToUrl(page, url, navigationOptions)

  return page.evaluate(getPreviewsInPage, { filter, viewport })
}

function getPreviewsInPage ({ filter, viewport }) {
  const shouldIncludePreview = name => {
    if (filter == null) {
      return true
    }

    return [].concat(filter).some(str => {
      const regexp = new RegExp(str.toLowerCase())
      return regexp.test(name.toLowerCase())
    })
  }

  const extractPreviewInfo = (memo, el) => {
    const name = el.dataset.preview
    const description = el.dataset.description

    if (!shouldIncludePreview(name)) {
      return memo
    }

    memo[name] = (memo[name] || []).concat({
      name,
      description,
      viewport
    })
    return memo
  }

  const result = document.querySelectorAll('[data-preview]')
  return Array.from(result).reduce(extractPreviewInfo, {})
}

async function takeNewScreenshotsOfPreviews (page, previewMap, { dir, progress, navigationOptions }) {
  await ensureDir(dir)

  let progressIndex = 1
  const progressTotal = Object.keys(previewMap).reduce((memo, name) => memo + previewMap[name].length, 0)

  for (const name of Object.keys(previewMap)) {
    const previewList = previewMap[name]

    let previewIndex = 1

    for (const preview of previewList) {
      progress.update(progressIndex, progressTotal)

      await takeNewScreenshotOfPreview(page, preview, previewIndex, { dir })

      previewIndex += 1
      progressIndex += 1
    }
  }
}

async function takeNewScreenshotOfPreview (page, preview, index, { dir }) {
  const { name, description = `${index}`, viewport } = preview
  const basename = `${name} ${description.toLowerCase()} ${viewport.toLowerCase()}`.replace(/[^0-9A-Z]+/gi, '_')
  const relativePath = path.join(dir, `${basename}.new.png`)

  const clip = await page.evaluate((name, index) => {
    const el = document.querySelectorAll(`[data-preview="${name}"]`)[index - 1]

    // find nearest scrollable ancestor
    let scrollContainer = el
    // eslint-disable-next-line no-undef
    while (getComputedStyle(scrollContainer).overflowY !== 'auto' && scrollContainer) {
      scrollContainer = scrollContainer.parentElement
    }
    const { x, y, width, height } = el.getBoundingClientRect()
    scrollContainer.scrollTop += y

    return { x, y: 0, width, height }
  }, name, index)

  debug('Storing screenshot of %s in %s', chalk.blue(name), chalk.cyan(relativePath))
  await page.screenshot({ clip, path: relativePath })
}

async function goToUrl (page, url, navigationOptions) {
  debug('Navigating to URL %s', chalk.blue(url))
  return page.goto(url, navigationOptions)
}

module.exports = {
  getPreviews,
  takeNewScreenshotsOfPreviews
}
