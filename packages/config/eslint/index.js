const { dirname } = require("path");
const { fileURLToPath } = require("url");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "react/no-unescaped-entities": "off",
  },
};
