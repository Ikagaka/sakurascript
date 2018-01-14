const path = require("path");
const tsconfig = require("./tsconfig.json");

module.exports = {
  entry:  {sakurascript: "./lib/sakurascript.ts"},
  output: {
    library:       "sakurascript",
    libraryTarget: "umd",
    path:          path.resolve("."),
    filename:      "dist/lib/[name].js",
  },
  module: {
    rules: [
      {
        test:    /\.ts$/,
        loader:  "ts-loader",
        exclude: /node_modules/,
        options: {compilerOptions: tsconfig.compilerOptions},
      },
    ],
  },
  resolve: {
    extensions: [
      ".ts",
      ".js",
    ],
  },
  devtool: "source-map",
};
