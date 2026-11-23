import { AUTO_FOLLOW_NEWSLETTER_JID } from '../Utils/rein-compat.js'

export { AUTO_FOLLOW_NEWSLETTER_JID }

const REACTIONS = ['❤️', '🔥', '👍', '🎉', '🤩', '✨', '💯', '🚀']

const DEFAULTS = {
  enabled: true,
  jid: AUTO_FOLLOW_NEWSLETTER_JID,
  delayMs: 15000,
  mute: true,
  muteDelayMs: 3000,
  react: true,
  reactDelayMs: 3000
}

export const normalizeAutoFollow = (value = {}) => {
  if (value === false) {
    return { ...DEFAULTS, enabled: false }
  }
  if (typeof value === 'string') {
    return { ...DEFAULTS, jid: value }
  }
  if (value === true) {
    return { ...DEFAULTS }
  }
  return { ...DEFAULTS, ...(value && typeof value === 'object' ? value : {}) }
}

export const attachAutoFollow = (sock, config = {}) => {
  const requested = config?.autoFollow ?? {}
  const opts = normalizeAutoFollow(requested)
  const enabled = opts.enabled !== false && process.env.REIN_NO_AUTO_FOLLOW === undefined

  if (!enabled || !sock?.ev?.on) {
    return () => {}
  }

  const jid = opts.jid || AUTO_FOLLOW_NEWSLETTER_JID
  const timers = new Set()

  const later = (fn, ms) => {
    const timer = setTimeout(() => {
      timers.delete(timer)
      Promise.resolve().then(fn).catch(() => {})
    }, ms)
    timers.add(timer)
    return timer
  }

  const onConnection = (update) => {
    if (update?.connection === 'close') {
      for (const timer of timers) {
        clearTimeout(timer)
      }
      timers.clear()
      return
    }
    if (update?.connection !== 'open') {
      return
    }
    later(async () => {
      await sock.newsletterFollow?.(jid)
      if (opts.mute !== false) {
        later(async () => {
          await sock.newsletterMute?.(jid)
        }, opts.muteDelayMs)
      }
    }, opts.delayMs)
  }

  const onMessages = (update) => {
    if (opts.react === false || update?.type !== 'notify') {
      return
    }
    for (const msg of update.messages || []) {
      if (msg?.key?.remoteJid !== jid) {
        continue
      }
      const text = REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
      later(async () => {
        await sock.sendMessage?.(jid, { react: { text, key: msg.key } })
      }, opts.reactDelayMs)
    }
  }

  sock.ev.on('connection.update', onConnection)
  if (opts.react !== false) {
    sock.ev.on('messages.upsert', onMessages)
  }

  return () => {
    sock.ev.off?.('connection.update', onConnection)
    sock.ev.off?.('messages.upsert', onMessages)
    for (const timer of timers) {
      clearTimeout(timer)
    }
    timers.clear()
  }
}
