// Load modules

var Lab = require('lab');
var Code = require('code');
var Hapi = require('hapi');
var Plugin = require('../lib');
var HapiMongooseModels = require('Hapi-mongoose-models');
var Mongoose = require('mongoose');


// Tests

var lab = exports.lab = Lab.script();
var request = {
	method: 'GET',
	url: '/tests'
};
var serverOne;
var serverTWo;


lab.before(function (done) {

	Mongoose.connect('mongodb://localhost/test-hapi-mongoose-request', function (err) {

		if (err) {
			return done(err);
		}

		var schema = new Mongoose.Schema({
			name: String
		});
		Mongoose.model('Test', schema);		// This model apply to capitalize

		var schema = new Mongoose.Schema({
			name: String
		});
		Mongoose.model('test', schema);

		return done();
	});
});


// Set two instances with diferent plugin options

lab.before(function (done) {

	serverOne = new Hapi.Server();
	serverOne.connection({ port: 3000});
	serverOne.register({
		register: Plugin,
		options: {}
	}, function (err) {

		if (err) {
			return done(err);
		}

		return done();
	});
});


lab.before(function (done) {

	serverTWo = new Hapi.Server();
	serverTWo.connection({ port: 3001});
	serverTWo.register([{
		register: Plugin,
		options: {
			singularize: false,
			capitalize: false
		}
	}, {
		register: HapiMongooseModels,
		options: {
			pattern: '../models/**/*.js',
			options: {
				cwd: __dirname
			}
		}
	}], function (err) {

		if (err) {
			return done(err);
		}

		return done();
	});
});


lab.experiment('Hapi-mongoose-request with default options', function () {

	lab.experiment('inject request with model param', function () {

		lab.before(function (done) {

			serverOne.route({
				method: 'GET',
				path: '/{model}',
				handler: function (request, reply) {
					reply(request.Model);
				}
			});

			return done();
		});

		lab.test('it returns mongoose model instance', function (done) {

			serverOne.inject(request, function (response) {

				Code.expect(response).to.be.a.object();

				return done();
			});
		});
	});

	lab.experiment('specifying the model in the configuration of the route', function () {

		lab.before(function (done) {

			serverOne.route({
				method: 'GET',
				path: '/tests',
				handler: function (request, reply) {
					reply(request.Model);
				},
				config: {
					plugins: {
						'Hapi-mongoose-request': {
							model: 'Test'
						}
					}
				}
			});

			return done();
		});

		lab.test('it returns mongoose model instance', function (done) {

			serverOne.inject(request, function (response) {

				Code.expect(response).to.be.a.object();

				return done();
			});
		});
	});
});


lab.experiment('Hapi-mongoose-request with plugin `hapi-mongoose-models`', function () {

	lab.experiment('inject request with model param', function () {

		lab.before(function (done) {

			serverTWo.route({
				method: 'GET',
				path: '/{model}',
				handler: function (request, reply) {
					reply(request.Model);
				}
			});

			return done();
		});

		lab.test('it returns mongoose model instance', function (done) {

			var request = {
				method: 'GET',
				url: '/test2'
			};

			serverTWo.inject(request, function (response) {

				Code.expect(response).to.be.a.object();

				return done();
			});
		});
	});
});


lab.after(function (done) {

	serverOne.stop(function () {

		serverTWo.stop(function () {

			return done();
		});	
	});
});
