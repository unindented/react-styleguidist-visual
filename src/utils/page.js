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

    if (!shouldIncludePreview(name)) {
      return memo
    }

    memo[name] = (memo[name] || []).concat({
      url,
      name,
      description,
      actionStates,
      viewport
    })

    return memo
  }

  const result = document.querySelectorAll('[data-preview]')
  return Array.prototype.reduce.call(result, extractPreviewInfo, {})
}

async function takeNewScreenshotsOfPreviews (page, previewMap, { dir, progress, navigationOptions, wait }) {
  await ensureDir(dir)

  let progressIndex = 1
  const progressTotal = Object.keys(previewMap).reduce((memo, name) => memo + previewMap[name].length, 0)

  for (const name of Object.keys(previewMap)) {
    const previewList = previewMap[name]

    let previewIndex = 1

    for (const preview of previewList) {
      const actionStateList = preview.actionStates ? JSON.parse(preview.actionStates) : [{ action: 'none'}]

      progress.update(progressIndex, progressTotal)

      const { url } = preview
      await goToHashUrl(page, url)

      for(const actionState of actionStateList) {
        await takeNewScreenshotOfPreview(page, preview, previewIndex, actionState, { dir, wait })
        previewIndex += 1
      }
      await resetMouseAndFocus(page)
      progressIndex += 1
    }
  }
}

async function takeNewScreenshotOfPreview (page, preview, index, actionState, { dir, delay: wait }) {
  const el = await page.$('[data-preview]')

  if (wait) {
    await sleep(wait)
  }

  const boundingBox = await el.boundingBox()

  await triggerAction(page, el, actionState)

  const path = await getRelativeFilepath(preview, index, actionState, dir)
  debug('Storing screenshot of %s in %s', chalk.blue(preview.name), chalk.cyan(path))
  await page.screenshot({ clip: boundingBox, path })
}

async function getRelativeFilepath(preview, index, actionState, dir) {
  const { name, description = `${index}`, actionSelector, viewport } = preview
  const { action = '', key = '' } = actionState
  const actionName = action === 'none' ? '' : action
  const baseName = name + ` ${description} ${actionName} ${key} ${viewport}`.toLowerCase()
  const underscoredName = baseName.replace(/[^0-9A-Z]+/gi, '_')

  return path.join(dir, `${underscoredName}.new.png`)
}

async function triggerAction(page, el, actionState) {
  const actionEl = actionState.selector ? await el.$(actionState.selector) || await page.$(actionState.selector) : el
  switch(actionState.action) {
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
    case 'keyPress':
      const key = actionState.key || 'a'
      await page.keyboard.press(key)
      break
  }
  await sleep(actionState.wait)
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  getPreviews,
  takeNewScreenshotsOfPreviews
}
