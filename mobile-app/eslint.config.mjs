// install eslint: npm init @eslint/config@latest
import globals from "globals"
import pluginJs from "@eslint/js"


export default [
  {
    languageOptions: { globals: globals.browser },
    rules: {
      semi: ["error", "never"],
      indent: ["error", 2]
    },
    ignores: ['**/node_modules', '**/tempo']
  },
  pluginJs.configs.recommended,
]