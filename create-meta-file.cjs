/* eslint-disable @typescript-eslint/no-require-imports */
const esbuildMeta = require('./meta.json')
const fs = require('fs')
const path = require('path')

const jsFilePath = Object.keys(esbuildMeta.outputs).find(output => output.endsWith('.js'))
const cssFilePath = Object.keys(esbuildMeta.outputs).find(output => output.endsWith('.css'))
const meta = {
  js: jsFilePath.split('/').pop(),
  css: cssFilePath.split('/').pop(),
}

fs.writeFileSync(path.join(path.dirname(jsFilePath), 'meta.json'), JSON.stringify(meta, null, 2))
