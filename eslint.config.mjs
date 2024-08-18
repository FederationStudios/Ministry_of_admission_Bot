import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node, // This includes Node.js globals like `process` and `__dirname`
        ...globals.browser, // This includes browser globals if needed
      },
    },
    rules: {
      // Add specific rules you want to enforce
      "no-unused-vars": ["error", { "args": "none" }], // Ignore unused function arguments
      "no-undef": "error", // Ensure variables are defined
      // Add more rules as necessary
    },
  },
  pluginJs.configs.recommended,
];
