var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

var index_exports = {};
__export(index_exports, {
  BRAND: () => BRAND,
  attachPairingNoticeListener: () => attachPairingNoticeListener,
  getBrandLines: () => getBrandLines,
  gradientText: () => gradientText,
  printBrand: () => printBrand,
  printPairingNotice: () => printPairingNotice,
  wrapPairingCodeNotice: () => wrapPairingCodeNotice
});
module.exports = __toCommonJS(index_exports);

var isEnabled = (config) => config?.brand?.pairingNotice !== false;
var attachPairingNoticeListener = (ev, config = {}, stream) => {
  if (!isEnabled(config)) {
    return () => {
    };
  }
  let lastQr;
  const listener = (update) => {
    if (update?.qr && update.qr !== lastQr) {
      lastQr = update.qr;
      printPairingNotice({ qr: update.qr, stream });
    }
  };
  ev.on("connection.update", listener);
  return () => ev.off("connection.update", listener);
};
var wrapPairingCodeNotice = (fn, config = {}, stream) => {
  return async function brandedRequestPairingCode(...args) {
    const code = await fn(...args);
    if (isEnabled(config) && code) {
      printPairingNotice({ pairingCode: code, stream });
    }
    return code;
  };
};

var PALETTE_HEX = ["#ff4d8d", "#a855f7", "#22d3ee"];
var BRAND = Object.freeze({
  name: "REIN BAILEYS",
  shortName: "REIN",
  version: "7.0.0-rc13.1",
  palette: PALETTE_HEX,
  boxWidth: 60
});
var hexToRgb = (hex) => {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16)
  ];
};
var noColor = () => {
  const force = process.env.FORCE_COLOR;
  if (force !== void 0) {
    return force === "0" || force === "";
  }
  if (process.env.NO_COLOR !== void 0) {
    return true;
  }
  return !process.stdout?.isTTY;
};
function gradientText(text, palette = PALETTE_HEX) {
  if (noColor()) return text;
  const stops = palette.map(hexToRgb);
  const chars = Array.from(text);
  return chars.map((char, i) => {
    const t = i / Math.max(1, chars.length - 1);
    const scaled = t * (stops.length - 1);
    const index = Math.min(stops.length - 2, Math.floor(scaled));
    const local = scaled - index;
    const from = stops[index];
    const to = stops[index + 1];
    const [r, g, b] = from.map((channel, k) => Math.round(channel + (to[k] - channel) * local));
    return `\x1B[38;2;${r};${g};${b}m${char}`;
  }).join("") + "\x1B[0m";
}
var innerWidth = BRAND.boxWidth - 2;
var border = (left, fill, right) => left + fill.repeat(innerWidth) + right;
var row = (content) => "\u2502" + content.padEnd(innerWidth).slice(0, innerWidth) + "\u2502";
function getBrandLines() {
  return [
    border("\u256D", "\u2500", "\u256E"),
    row("  \u2726  R E I N   B A I L E Y S"),
    border("\u251C", "\u2550", "\u2524"),
    row("  \u25C8  Fork rc13 \xB7 ESM + CJS \xB7 Multi-Device"),
    row("  \u25C8  v7.0.0-rc13.1 \xB7 Pure JavaScript WhatsApp API"),
    border("\u2570", "\u2500", "\u256F")
  ];
}
var write = (stream, text) => {
  const target = stream || process.stdout;
  if (target && typeof target.write === "function") target.write(text + "\n");
};
function printBrand(options = {}) {
  const guard = "__REIN_BAILEYS_BANNER__";
  if (globalThis[guard]) return false;
  globalThis[guard] = true;
  if (process.env.REIN_NO_BANNER === "1" || process.env.REINDIANDIKARC_NO_BANNER === "1") return false;
  const lines = getBrandLines(options);
  write(options.stream, lines.map((line) => gradientText(line)).join("\n"));
  return true;
}
function printPairingNotice(input = {}) {
  const { qr, pairingCode, stream } = input;
  let text;
  if (pairingCode) {
    text = `  \u25C6 REIN \u2022 PAIRING CODE  ${pairingCode}  \u25C6`;
  } else if (qr) {
    text = "  \u25C6 REIN \u2022 QR READY  \u25C6";
  } else {
    return;
  }
  write(stream, gradientText(text));
}
0 && (module.exports = {
  BRAND,
  attachPairingNoticeListener,
  getBrandLines,
  gradientText,
  printBrand,
  printPairingNotice,
  wrapPairingCodeNotice
});
