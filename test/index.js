// Load modules

var Lab = require('lab');
var Code = require('code');
var Hapi = require('hapi');
var Plugin = require('../lib');
var HapiMongooseModels = require('Hapi-mongoose-models');
var Mongoose = require('mongoose');


// Tests

var lab = exports.lab = Lab.script();
var routes = [{
    method: 'GET',
    path: '/{model}',
    handler: function (request, reply) {

        reply({model: request.Model});
    }
}, {
    method: 'GET',
    path: '/no_param',
    handler: function (request, reply) {

        reply({model: request.Model});
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
    handler: function (request, reply) {

        reply({ message: 'not found'}).code(404);
    }
}];

lab.before(function (done) {

    Mongoose.connect('mongodb://localhost/test-hapi-mongoose-request', function (err) {

        if (err) {
            return done(err);
        }

        Mongoose.model('Test', new Mongoose.Schema({
            name: String
        }));

        Mongoose.model('test', new Mongoose.Schema({
            name: String
        }));

        return done();
    });
});

lab.experiment('hapi-mongoose-request', function () {

    lab.experiment('with default options', function () {

        var server;

        lab.before(function (done) {

            server = new Hapi.Server();
            server.connection({ port: 3000 });
            return done();
        });

        lab.test('successfully registered', function (done) {

            server.register(Plugin, function (err) {

                Code.expect(err).to.not.exist();
                server.route(routes);
                return done();
            });
        });

        lab.experiment('inject request', function () {

            lab.test('`GET /tests` it returns model instance', function (done) {

                var request = {
                    url: '/tests',
                    method: 'GET'
                };
                server.inject(request, function (response) {

                    Code.expect(response.result).to.include('model');
                    Code.expect(response.result.model.modelName).to.be.equal('Test');
                    return done();
                });
            });

            lab.test('`GET /no_param` it returns model instance', function (done) {

                var request = {
                    url: '/no_param',
                    method: 'GET'
                };
                server.inject(request, function (response) {

                    Code.expect(response.result).to.include('model');
                    Code.expect(response.result.model.modelName).to.be.equal('Test');
                    return done();
                });
            });
        });
    });

    lab.experiment('with `singularize: false, capitalize: false` and `hapi-mongoose-models` support', function () {

        var server;

        lab.before(function (done) {

            server = new Hapi.Server();
            server.connection({ port: 3000 });
            return done();
        });

        lab.test('successfully registered', function (done) {

            server.register([{
                register: HapiMongooseModels,
                options: {
                    globPattern: '../models/**/*.js',
                    globOptions: {
                        cwd: __dirname
                    }
                }
            }, {
                register: Plugin,
                options: {
                    capitalize: false,
                    singularize: false
                }
            }], function (err) {

                Code.expect(err).to.not.exist();
                server.route(routes);
                return done();
            });
        });

        lab.experiment('inject request', function () {

            lab.test('`GET /test2` it returns model instance', function (done) {

                var request = {
                    url: '/test2',
                    method: 'GET'
                };
                server.inject(request, function (response) {

                    Code.expect(response.result).to.include('model');
                    Code.expect(response.result.model.modelName).to.be.equal('test2');
                    return done();
                });
            });

            lab.test('`GET /no_model_and_param_else` it returns Boom object with statusCode 404', function (done) {

                var request = {
                    url: '/no_model_and_param_else',
                    method: 'GET'
                };
                server.inject(request, function (response) {

                    Code.expect(response.statusCode).to.be.equal(404);
                    Code.expect(response.result.isBoom).to.be.true;
                    return done();
                });
            });
        });
    });
});
