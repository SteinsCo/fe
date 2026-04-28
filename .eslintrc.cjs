/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
  settings: {
    react: { version: "detect" },
    "import/resolver": {
      typescript: true,
      node: true,
    },
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  plugins: ["@typescript-eslint", "react", "react-hooks", "jsx-a11y", "import", "react-refresh"],
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
    "import/order": [
      "error",
      {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object", "type"],
        pathGroups: [{ pattern: "@/**", group: "internal", position: "before" }],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      },
    ],
    "import/no-default-export": "off",
  },
  overrides: [
    {
      files: ["src/pages/**/*Page.tsx"],
      rules: { "import/no-default-export": "off" },
    },
    {
      files: ["test/**/*.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-non-null-assertion": "off",
      },
    },
    {
      files: ["*.config.{ts,js,cjs}", "vite.config.ts", "vitest.config.ts", "tailwind.config.ts"],
      rules: { "import/no-default-export": "off" },
    },
  ],
  ignorePatterns: [
    "dist",
    "node_modules",
    "coverage",
    "*.cjs",
    "vite.config.ts",
    "vitest.config.ts",
    "tailwind.config.ts",
    "postcss.config.js",
  ],
};
