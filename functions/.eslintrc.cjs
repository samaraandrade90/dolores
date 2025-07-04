module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parser: "@typescript-eslint/parser", // <--- ADICIONE ESTA LINHA
  parserOptions: {
    // "ecmaVersion": 2018, // Pode ser removido ou atualizado para 2020 ou 2022
    // Se você tem um tsconfig.json na pasta functions, aponte para ele
    project: ["./tsconfig.json"], // <--- ADICIONE ESTA LINHA (ajuste o caminho se tsconfig estiver em outro lugar)
    sourceType: "module",
    ecmaVersion: 2020, // <--- Sugestão: atualize para uma versão mais recente
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended", // <--- ADICIONE ESTA LINHA
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    // Se você tiver um código TS, pode precisar desativar algumas regras que o Google impõe e conflitam com TS
    // Ex: "@typescript-eslint/no-unused-vars": "off",
    //     "no-unused-vars": "off", // Desativa a regra JS padrão
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
    // Se você só tem testes TypeScript, pode precisar de outro override para eles
    // {
    //   files: ["**/*.ts", "**/*.tsx"], // Para arquivos TypeScript específicos
    //   parserOptions: {
    //     project: ["./tsconfig.json"], // Garante que o parser use o tsconfig correto
    //   },
    //   rules: {
    //     // Regras específicas para TS
    //   }
    // }
  ],
  globals: {},
};