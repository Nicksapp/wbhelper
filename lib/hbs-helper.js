const Handlebars = require('handlebars');

Handlebars.registerHelper("isEqual", function (a, b, options) {
  if (a === b) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});