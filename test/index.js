// Load modules

var Lab = require('@hapi/lab');
var Code = require('@hapi/code');
var Hapi = require('@hapi/hapi');
var Plugin = require('../lib');
var HapiMongooseModels = require('hapi-mongoose-models');
var Mongoose = require('mongoose');


// Tests

var lab = exports.lab = Lab.script();
var routes = [{
      method: 'GET',
      path: '/{model}',
      handler: (request, h) => {
        return {model: request.Model};
      }
  }, {
      method: 'GET',
      path: '/no_param',
      handler: (request, h) => {
        return {model: request.Model};
      },
      config: {
          plugins: {
              'hapi-mongoose-request': {
                  model: 'Test'
              }
          }
      }
  }, {
      method: 'GET',
      path: '/no_model_and_param_else',
      handler: (request, h) => h.response({ message: 'not found'}).code(404)
}];

lab.before(async () => {
    return Mongoose.connect('mongodb://localhost/test-hapi-mongoose-request')
    .then(() => {
        Mongoose.model('Test', new Mongoose.Schema({
            name: String
        }));
        Mongoose.model('test', new Mongoose.Schema({
            name: String
        }));
    });
});

lab.experiment('hapi-mongoose-request', () => {

    lab.experiment('with default options', () => {

        var server;

        lab.before(() => {
          server = Hapi.server({ port: 3000 });
          return server.start();
        });

        lab.test('successfully registered', async () => {
            return server.register(Plugin).then(() => server.route(routes));
        });

        lab.experiment('inject request', () => {
            lab.test('`GET /tests` it returns model instance', async () => {
                var request = {
                    url: '/tests',
                    method: 'GET'
                };
                return server.inject(request).then((response) => {
                  Code.expect(response.result).to.include('model');
                  Code.expect(response.result.model.modelName).to.be.equal('Test');
                });
            });

            lab.test('`GET /no_param` it returns model instance', async () => {
                var request = {
                    url: '/no_param',
                    method: 'GET'
                };
                return server.inject(request).then((response) => {
                  Code.expect(response.result).to.include('model');
                  Code.expect(response.result.model.modelName).to.be.equal('Test');
                });
            });
        });

        lab.after(() => server.stop());
    });

    lab.experiment('with `singularize: false, capitalize: false` and `hapi-mongoose-models` support', () => {

        var server;

        lab.before(() => {
          server = Hapi.server({ port: 3000 });  
          return server.start();
        });

        lab.test('successfully registered', async () => {
            return server.register([
              {
                plugin: HapiMongooseModels,
                options: {
                    globPattern: '../models/**/*.js',
                    globOptions: {
                        cwd: __dirname
                    }
                }
              },
              {
                plugin: Plugin,
                options: {
                  capitalize: false,
                  singularize: false
                }
              }
            ])
            .then(() => server.route(routes));
        });

        lab.experiment('inject request', () => {
            lab.test('`GET /test2` it returns model instance', async () => {
                var request = {
                    url: '/test2',
                    method: 'GET'
                };
                return server.inject(request).then((response) => {
                  Code.expect(response.result).to.include('model');
                  Code.expect(response.result.model.modelName).to.be.equal('test2');
                });
            });
            lab.test('`GET /no_model_and_param_else` it returns Boom object with statusCode 404', async () => {
                var request = {
                    url: '/no_model_and_param_else',
                    method: 'GET'
                };
                return server.inject(request).then((response) => {
                  Code.expect(response.statusCode).to.be.equal(404);
                  Code.expect(response.result.isBoom).to.be.true;
                });
            });
        });

        lab.after(() => server.stop());
    });
});
