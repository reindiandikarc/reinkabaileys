import { printPairingNotice } from './index.js'

const isEnabled = (config) => config?.brand?.pairingNotice !== false

export const attachPairingNoticeListener = (ev, config = {}, stream) => {
  if (!isEnabled(config)) {
    return () => {}
  }

  let lastQr
  const listener = (update) => {
    if (update?.qr && update.qr !== lastQr) {
      lastQr = update.qr
      printPairingNotice({ qr: update.qr, stream })
    }
  }

  ev.on('connection.update', listener)
  return () => ev.off('connection.update', listener)
}

export const wrapPairingCodeNotice = (fn, config = {}, stream) => {
  return async function brandedRequestPairingCode (...args) {
    const code = await fn(...args)
    if (isEnabled(config) && code) {
      printPairingNotice({ pairingCode: code, stream })
    }
    return code
  }
}
