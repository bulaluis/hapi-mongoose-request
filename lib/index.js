// Load modules

var Hoek = require('hoek');
var Joi = require('joi');
var Mongoose = require('mongoose');
var Inflection = require('inflection');


// Declare internals

var internals = {
    schema: Joi.object({
        param: Joi.string(),            // Route param name
        singularize: Joi.boolean(),     // Singularize all the incoming route parameter
        capitalize: Joi.boolean()       // Capitalize all the incoming route parameter
    }),
    defaults: {
        param: 'model',
        singularize: true,
        capitalize: true
    }
};


exports.register = function (server, options, next) {

    options = Hoek.applyToDefaults(internals.defaults, options);
    var results = Joi.validate(options, internals.schema);
    Hoek.assert(!results.error, results.error);
    var settings = results.value;

    // Others may need this information
    server.expose('settings', settings);

    server.ext('onPreHandler', function (request, reply) {

        var model = Hoek.reach(request, 'params.' + settings.param);
        if (!model) {
            // Allow especify model in route settings
            model = Hoek.reach(request, 'route.settings.plugins.hapi-mongoose-request.model');
        }
        else {
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

        return reply.continue();
    });

    next();
};


exports.register.attributes = {
    pkg: require('../package.json')
};
