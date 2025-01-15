module.exports = {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Ensure controller routes use hyphens instead of uppercase letters or underscores',
        recommended: false,
      },
      fixable: 'code',
      messages: {
        enforceHyphen: 'Controller routes should use hyphens (e.g., "/api/my-route").',
      },
      schema: [],
    },
    create(context) {
      const filename = context.getFilename();
  
      // Apply rule only to controller files
      if (!filename.endsWith('.controller.ts')) {
        return {};
      }
  
      const routeDecorators = ['Get', 'Post', 'Put', 'Patch', 'Delete', 'Options', 'Head', 'All'];
  
      const containsInvalidCharacters = (route) => /[A-Z_]/.test(route);
  
      const fixRouteString = (route) =>
        route.replace(/_/g, '-').toLowerCase();
  
      return {
        Decorator(node) {
          if (
            node.expression &&
            routeDecorators.includes(node.expression.callee.name) &&
            node.expression.arguments.length
          ) {
            const arg = node.expression.arguments[0];
  
            if (arg.type === 'Literal' && typeof arg.value === 'string') {
              const route = arg.value;
  
              if (containsInvalidCharacters(route)) {
                context.report({
                  node: arg,
                  messageId: 'enforceHyphen',
                  fix(fixer) {
                    const fixedRoute = fixRouteString(route);
                    return fixer.replaceText(arg, `'${fixedRoute}'`);
                  },
                });
              }
            }
          }
        },
      };
    },
  };
  