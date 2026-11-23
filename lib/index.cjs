'use strict'

const core = require('./index.bundle.cjs')
const brand = require('./cjs/brand.cjs')
const ported = require('./cjs/ported.cjs')

const api = { ...core, ...ported, ...brand }
api.default = core.default || core.makeWASocket

module.exports = api
