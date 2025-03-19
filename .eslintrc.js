module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    // 사용되지 않는 변수에 대한 경고 대신 오류를 내지 않도록 설정
    "no-unused-vars": [
      "warn",
      {
        vars: "all",
        args: "none",
        ignoreRestSiblings: true,
        varsIgnorePattern: "React",
      },
    ],

    // console.log 허용 (빌드 실패 방지)
    "no-console": "off",

    // React JSX Import 경고 방지 (Next.js 및 최신 React 버전에서 필요 없음)
    "react/react-in-jsx-scope": "off",

    // PropTypes 사용하지 않아도 경고하지 않음
    "react/prop-types": "off",
  },
  globals: {
    window: true,
    document: true,
  },
};
