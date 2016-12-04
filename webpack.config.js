const config = require("webpack-config-narazaka-ts-js").node;

config.entry.sakurascript = "./src/lib/sakurascript.ts";
config.output.library = "sakurascript";

module.exports = config;
