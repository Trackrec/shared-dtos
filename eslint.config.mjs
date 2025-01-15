import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import preferArrow from 'eslint-plugin-prefer-arrow';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

// ✅ Custom Rule for Enforcing Hyphenated Routes
const customRules = {
    rules: {
      'enforce-hyphenated-routes': {
        meta: {
          type: 'problem',
          docs: {
            description: 'Ensure controller routes use hyphens instead of uppercase letters or underscores (excluding route parameters)',
            recommended: true,
          },
          messages: {
            enforceHyphen: 'Routes should use hyphens (e.g., "/api/my-route").',
          },
          schema: [],
        },
        create(context) {
          const routeDecorators = ['Controller','Get', 'Post', 'Put', 'Patch', 'Delete', 'Options', 'Head', 'All'];
  
          // ✅ Ignore segments starting with ":" (route parameters)
          const containsInvalidCharacters = (route) => {
            const segments = route.split('/');
            return segments.some(
              (segment) => !segment.startsWith(':') && /[A-Z_]/.test(segment)
            );
          };
  
          return {
            Decorator(node) {
              const decoratorName = node.expression.callee.name;
  
              if (routeDecorators.includes(decoratorName)) {
                const args = node.expression.arguments;
  
                if (args.length > 0 && args[0].type === 'Literal') {
                  const route = args[0].value;
  
                  if (typeof route === 'string' && containsInvalidCharacters(route)) {
                    context.report({
                      node: args[0],
                      messageId: 'enforceHyphen',
                    });
                  }
                }
              }
            },
          };
        },
      },
    },
  };
  
  

// ✅ ESLint Configuration
export default tseslint.config(
  {
    ignores: [
      '**/build/**',
      '**/dist/**',
      'eslint.config.mjs',
      '**/tests/**',
      'jest.config.ts',
      '**/coverage/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,   // ✅ Prettier plugin added
      custom: customRules,        // ✅ Custom rule registered
      'prefer-arrow': preferArrow,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      'prettier/prettier': 'error',  // ✅ Prettier formatting enabled

      // ✅ Naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variableLike',
          format: ['camelCase'],
        },
        {
          selector: 'function',
          format: ['camelCase'],
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
        },
      ],

      // ✅ Disable no-prototype-builtins globally
      'no-prototype-builtins': 'off',

      // ✅ Enforce arrow functions
      'prefer-arrow/prefer-arrow-functions': [
        'error',
        {
          disallowPrototype: true,
          singleReturnOnly: false,
          classPropertiesAllowed: false,
        },
      ],

      // ✅ Enable custom rule for hyphenated routes
      'custom/enforce-hyphenated-routes': 'error',
    },
  },
  {
    // ✅ Disable type-aware linting on JS files
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked, prettierConfig],  // ✅ Extending Prettier config
  }
);
