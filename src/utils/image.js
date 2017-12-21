const { promisify } = require('util')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const globby = require('glob')
const pixelmatch = require('pixelmatch')
const { PNG } = require('pngjs')
const termImg = require('term-img')
const { debug } = require('./debug')

const move = promisify(fs.move)
const pathExists = promisify(fs.pathExists)
const glob = promisify(globby)

function filterOnRegex (filter) {
  if (!filter) { return array => array; }
  const filterRegex = new RegExp(filter);
  return array => array.filter(value => filterRegex.test(value));
}

async function compareNewScreenshotsToRefScreenshots ({ dir, filter, threshold }) {
  const newImgs = filterOnRegex(filter)(await glob(path.join(dir, `*.new.png`)))

  let diffCount = 0

  for (const newImg of newImgs) {
    const refImg = newImg.replace(/\.new\.png$/, '.png')
    const diffImg = newImg.replace(/\.new\.png$/, '.diff.png')

    const refImgExists = await pathExists(refImg)
    if (!refImgExists) {
      await promoteNewScreenshot(newImg)
    } else {
      const pixels = await diffScreenshots(newImg, refImg, diffImg, threshold)
      if (pixels > 0) {
        console.log(
          'Screenshots %s and %s differ in %s pixels',
          chalk.cyan(newImg),
          chalk.cyan(refImg),
          chalk.red(pixels)
        )
        termImg(diffImg, {
          fallback: () => {
            console.log('Check out the diff at %s', chalk.cyan(diffImg))
          }
        })
        diffCount++
      }
    }
  }

  if (diffCount > 0) {
    throw new Error('One or more new screenshots differ from their references!')
  }
}

async function promoteNewScreenshots ({ dir, filter }) {
  const newImgs = filterOnRegex(filter)(await glob(path.join(dir, `*.new.png`)))

  for (const newImg of newImgs) {
    await promoteNewScreenshot(newImg)
  }
}

async function promoteNewScreenshot (newImg) {
  const refImg = newImg.replace(/\.new\.png$/, '.png')

  debug('Promoting screenshot from %s to %s', chalk.cyan(newImg), chalk.cyan(refImg))

  return move(newImg, refImg, { overwrite: true })
}

async function diffScreenshots (img1, img2, output, threshold = 0.001) {
  debug('Diffing screenshots %s and %s', chalk.cyan(img1), chalk.cyan(img2))

  const [data1, data2] = await Promise.all([readScreenshot(img1), readScreenshot(img2)])
  const diff = new PNG({ width: data1.width, height: data1.height })
  const pixels = pixelmatch(data1.data, data2.data, diff.data, data1.width, data1.height, {
    threshold
  })

  debug(
    'Screenshots %s and %s differ in %s pixels',
    chalk.cyan(img1),
    chalk.cyan(img2),
    chalk.red(pixels)
  )

  return new Promise((resolve, reject) => {
    diff
      .pack()
      .pipe(fs.createWriteStream(output))
      .on('finish', function () {
        resolve(pixels)
      })
      .on('error', reject)
  })
}

async function readScreenshot (img) {
  return new Promise((resolve, reject) => {
    fs
      .createReadStream(img)
      .pipe(new PNG())
      .on('parsed', function () {
        resolve(this)
      })
      .on('error', reject)
  })
}

module.exports = {
  compareNewScreenshotsToRefScreenshots,
  promoteNewScreenshots
}
