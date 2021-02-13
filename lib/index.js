// Load modules

var Hoek = require('@hapi/hoek');
var Joi = require('joi');
var Mongoose = require('mongoose');
var Inflection = require('inflection');


// Declare internals

var internals = {};

internals.schema = Joi.object({
    param: Joi.string(),            // Route param name
    singularize: Joi.boolean(),     // Singularize all the incoming route parameter
    capitalize: Joi.boolean(),       // Capitalize all the incoming route parameter,
    mongoose: Joi.object().optional()
});

internals.defaults = {
    param: 'model',
    singularize: true,
    capitalize: true
};

internals.pkg = require('../package.json');
internals.onPreHandler = (server, settings) => {
      server.ext('onPreHandler', async (request, h) => {
        
          var model = Hoek.reach(request, 'params.' + settings.param);
          if (!model) {
              // Allow especify model in route settings
              model = Hoek.reach(request, 'route.settings.plugins.hapi-mongoose-request.model');
          } else {
              if (settings.singularize) {
                  model = Inflection.singularize(model);
              }
              if (settings.capitalize) {
                  model = Inflection.capitalize(model);
              }
          }
          if (model) {              
              // Check if `hapi-mongoose-plugin` is present
              var plugin = server.plugins['hapi-mongoose-models'];
              if (!plugin) {
                plugin = Mongoose.models;
              }
              // Expose model instance for work in custom handler or other plugins
              // like `hapi-mongoose-errors` or `hapi-mongoose-handlers`
              request.Model = plugin[model];
          }
          return h.continue;
      });
};

module.exports = {
    pkg: internals.pkg,
    register: async (server, options) => {
        options = Hoek.applyToDefaults(internals.defaults, options);
        var results = internals.schema.validate(options);
        Hoek.assert(!results.error, results.error);
        var settings = results.value;
        server.expose('settings', settings);
        internals.onPreHandler(server, settings);
    }
};