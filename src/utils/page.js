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
    const url = el.nextSibling.querySelector('a[href][title]').href
    const name = el.dataset.preview
    const description = el.dataset.description
    const actionStates = el.dataset.actionStates
    const actionSelector = el.dataset.actionSelector

    if (!shouldIncludePreview(name)) {
      return memo
    }

    memo[name] = (memo[name] || []).concat({
      url,
      name,
      description,
      actionStates,
      actionSelector,
      viewport
    })

    return memo
  }

  const result = document.querySelectorAll('[data-preview]')
  return Array.prototype.reduce.call(result, extractPreviewInfo, {})
}

async function takeNewScreenshotsOfPreviews (page, previewMap, { dir, progress, navigationOptions }) {
  await ensureDir(dir)

  let progressIndex = 1
  const progressTotal = Object.keys(previewMap).reduce((memo, name) => memo + previewMap[name].length, 0)

  for (const name of Object.keys(previewMap)) {
    const previewList = previewMap[name]

    let previewIndex = 1

    for (const preview of previewList) {
      const actionStateList = preview.actionStates ? preview.actionStates.split(',') : ['base']

      progress.update(progressIndex, progressTotal)

      const { url } = preview
      await goToHashUrl(page, url)

      for(const actionState of actionStateList) {
        await takeNewScreenshotOfPreview(page, preview, previewIndex, actionState, { dir })
        previewIndex += 1
      }

      progressIndex += 1
    }
  }
}

async function takeNewScreenshotOfPreview (page, preview, index, actionState, { dir }) {
  const { name, description = `${index}`, actionSelector, viewport } = preview
  const actionStateForFilename = actionState === 'base' ? ' ' : ` ${actionState} `
  const basename = `${name} ${description.toLowerCase()}${actionStateForFilename}${viewport.toLowerCase()}`.replace(/[^0-9A-Z]+/gi, '_')
  const relativePath = path.join(dir, `${basename}.new.png`)

  const el = await page.$('[data-preview]')
  const boundingBox = await el.boundingBox()

  await triggerAction(page, el, actionState, actionSelector)

  debug('Storing screenshot of %s in %s', chalk.blue(name), chalk.cyan(relativePath))
  await page.screenshot({ clip: boundingBox, path: relativePath })
  await resetMouseAndFocus(page)
}

async function triggerAction(page, el, action, actionSelector) {
  const actionEl = await el.$(actionSelector)
  switch(action) {
    case 'hover':
      await actionEl.hover()
      break
    case 'click':
      await actionEl.click()
      break
    case 'mouseDown':
      const box = await actionEl.boundingBox()
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      break
    case 'focus':
      await actionEl.focus()
      break
  }
}

async function resetMouseAndFocus(page) {
  await page.focus('body')
  await page.mouse.up()
  await page.mouse.move(0,0)
}

async function goToUrl (page, url, navigationOptions) {
  debug('Navigating to URL %s', chalk.blue(url))
  return page.goto(url, navigationOptions)
}

async function goToHashUrl (page, url) {
  debug('Navigating to hash URL %s', chalk.blue(url))
  return page.evaluate(url => {
    window.location.href = url
  }, url)
}

module.exports = {
  getPreviews,
  takeNewScreenshotsOfPreviews
}
