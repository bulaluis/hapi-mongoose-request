# hapi-mongoose-request

Set models in every request for Hapi.js

## Install

```bash
$ npm install hapi-mongoose-request
```

## Usage

```javascript
var Hapi = require('hapi');
var server = new Hapi.Server();
server.connection({ port: 8000 });

server.register([{
        register: require('hapi-mongoose-connect'),
        options: {
            mongooseUri: 'mongodb://localhost/my-database'
        }
    }, {
        register: require('hapi-mongoose-models'),
        options: {
            globPattern: './models/**/*.js',
            globOptions: {
                cwd: __dirname
            }
        }
    }, {
        register: require('hapi-mongoose-request'),
        options: {
            param: 'model',             // Default 'model'
            capitalize: true,           // Capitalize all the incoming route parameter, default true
            singularize: true           // Singularize all the incoming route parameter, default true
        }
    }], function (err) {

        if (err) {
            throw err;
        }

        server.route({
            method: 'GET',
            path: '/api/v1/{model}',     // The same is declared in the options
            method: function (request, reply) {

                if (request.Model) {
                    request.Model.find(function (err, docs) {
                        reply(err, docs);
                    });
                }
                else {
                    reply({ message: 'Not found' }).code(404);
                }
            }
        });

        server.start(function (err) {

            if (err) {
                throw err;
            }
            console.log('Server started at: ' + server.info.uri);
        });
    }
});
```

## Tests
Run comand `make test` or `npm test`. Include 100% test coverage.

# License
MIT
