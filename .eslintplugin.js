const enforceHyphenatedRoutes = require('./eslint-rules/enforce-hyphenated-routes');

module.exports = {
  rules: {
    'enforce-hyphenated-routes': enforceHyphenatedRoutes,
  },
};
