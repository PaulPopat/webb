const Path = require("path");
const Glob = require("glob");

module.exports = {
  entry: Glob.sync("./src/**/*.webb"),
  module: {
    rules: [
      {
        test: /\.webb/,
        use: ["@paulpopat/webb"],
      },
    ],
  },
  output: {
    filename: "bundle.js",
    path: Path.resolve(__dirname, "dist"),
  },
};
