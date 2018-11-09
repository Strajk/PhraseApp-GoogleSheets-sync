require("dotenv").config()
const tabletop = require("tabletop")
const fs = require("fs")
const path = require("path")
const glob = require("glob")
const clipboardy = require('clipboardy');

function pullGoogleSheets() {
    tabletop.init({
        key: process.env.GOOGLE_SHEETS_URL,
        simpleSheet: true,
        // debug: true,
        callback(res) {
            /*
              [
                {"key": "abc", "en-GB": "…", "cs-CZ": "…"},
                {"key": "cba", "en-GB": "…", "cs-CZ": "…"},
              ]
            */

            const keys = Object.keys(res[0]) // "key", "en-GB", "cs-CZ", ...
            const locales = keys.slice(1) // "en-GB", "cs-CZ", ...
            const transposed = res.reduce((acc, val) => {
                const tkey = val.key
                locales.forEach(locale => {
                    if (!acc[locale]) acc[locale] = {}
                    acc[locale][tkey] = val[locale]
                })
                return acc
            }, {})

            /*
              {
                "en-GB": {"abc": "…", "cba": "…"}
                "cs-CZ": {"abc": "…", "cba": "…"}
              }
            */

            Object.keys(transposed)
                .forEach(locale => {
                    const content = transposed[locale]
                    fs.writeFileSync(`cache/${locale}.json`, JSON.stringify(content, null, "  "))
                    console.log(`Saved: ${locale}`)
                })
            console.log("Fetch from Google Spreadsheet done")
        },
    })
}

function pushGoogleSheets() {
    const res = {}
    glob("cache/*.json", {}, (er, files) => {
        files.forEach(file => {
            const locale = path.basename(file, ".json")
            res[locale] = require(`./${file}`)
        })

        const locales = Object.keys(res) // "en-GB", "cs-CZ", ...
        const keys = Object.keys(res["en-GB"])

        const OUTPUT = [
            ["key"].concat(locales).join("\t")
        ]

        keys.forEach(key => {
            OUTPUT.push(
                [key].concat(
                    locales.map(locale => res[locale][key])
                ).join("\t")
            )
        })

        clipboardy.writeSync(OUTPUT.join("\n"))
        console.log("🦄 Data in clipboard, just paste them into Google Sheets")
    })
}

module.exports = {
    pullGoogleSheets,
    pushGoogleSheets
}
