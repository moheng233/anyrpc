// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import perfectionist from 'eslint-plugin-perfectionist';
import stylistic from '@stylistic/eslint-plugin';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  perfectionist.configs['recommended-natural'],
  stylistic.configs.customize({
    flat: true,
    indent: 4,
    quotes: "double",
    semi: true,
    braceStyle: "stroustrup",
    commaDangle: "only-multiline"
  }),
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      'perfectionist/sort-object-types': "off",
      'perfectionist/sort-interfaces': "off",
      'perfectionist/sort-classes': "off",
      'perfectionist/sort-objects': "off",
      'perfectionist/sort-enums': "off",
      'perfectionist/sort-sets': "off",
      'perfectionist/sort-maps': "off",
    }
  }
);
