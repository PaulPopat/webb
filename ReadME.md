# @paulpopat/webb

Webb is a new format for making web components. It has state, shadow DOM styles, and event handlers. More examples to come.

## Setup

This is a webpack loader. To set up a simple project that loads all of the .webb files into a bundle, run these commands.

`npm install glob webpack webpack-cli --save-dev`

`npm install @paulpopat/webb --save`

Then create a `webpack.config.js` file at the top level of the directory with this contents.

```JavaScript
module.exports = {
  entry: require("glob").sync("./src/**/*.webb"),
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
    path: require("path").resolve(__dirname, "dist"),
  },
};
```

Lastly create a script in your package.json with the content of `webpack`. This is your compile script.

You can also add the loader to another webpack project and import .webb files to include the components in a larger project.