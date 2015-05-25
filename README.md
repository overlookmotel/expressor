# expressor.js

# Easy definition of express routes from a folder structure

## Current status

[![NPM version](https://img.shields.io/npm/v/expressor.svg)](https://www.npmjs.com/package/expressor)
[![Build Status](https://img.shields.io/travis/overlookmotel/expressor/master.svg)](http://travis-ci.org/overlookmotel/expressor)
[![Dependency Status](https://img.shields.io/david/overlookmotel/expressor.svg)](https://david-dm.org/overlookmotel/expressor)
[![Dev dependency Status](https://img.shields.io/david/dev/overlookmotel/expressor.svg)](https://david-dm.org/overlookmotel/expressor)

API is not yet stable and breaking changes are possible in v0.1.0. There are tests covering all options.

## What is it for?

[Express](https://www.npmjs.com/package/express) is a brilliant and simple web framework for node. But most of the time having to define controllers and then manually link them to routes is unnecessary work.

This module allows routes to be defined by placing controllers in files in a folder structure, and then creates express routes for them automatically, based on the folder structure.

## Installation

    npm install expressor

## Basic usage

### `expressor( app, [path], [options] )`

```js
var express = require('express');
var expressor = require('expressor');
var path = require('path');

var app = express();
expressor(app, path.join(__dirname, 'controllers'));

var server = app.listen(3000, function () {
    console.log('Server started');
};

```

If path is omitted, `process.cwd() + 'controllers'` will be used. This isn't foolproof, so best to specify the path manually.

#### With options

```js
expressor(app, '/path/to/controllers', { /* options */ });
```

or:

```js
expressor(app, {
    path: '/path/to/controllers',
    /* options */
});
```

### Controller definitions

If you want to define the following routes:

```
/
/help
/users
/users/new
/users/:id
/users/:id/edit
/users/:id/delete
```

create the following file structure:

```
controllers/index.js
controllers/help/index.js
controllers/users/index.js
controllers/users/new.js
controllers/users/view.js
controllers/users/edit.js
controllers/users/delete.js
```

Controller definitions would be as follows:

#### controllers/index.js

```js
// creates routing '/'
module.exports = {
    get: function (req, res, next) {
        res.send('Welcome to my website');
    }
};
```

#### controllers/help/index.js

```js
// creates routing '/help'
module.exports = {
    get: function (req, res, next) {
        res.send('Help page');
    }
};
```

#### controllers/users/index.js

```js
// creates routing '/users'
module.exports = {
    get: function (req, res, next) {
        // code to print list of users
    }
};
```

#### controllers/users/new.js

```js
// creates routing '/users/new'
module.exports = {
    get: function (req, res, next) {
        // code to print form for new user
    },
    post: function (req, res, next) {
        // code to process form submission
    }
};
```

#### controllers/users/view.js

```js
// creates routing '/users/:id'
module.exports = {
    params: 'id',
    pathPart: null, // routes to /users/:id rather than /users/:id/view
    get: function (req, res, next) {
        // code to print details of user
    }
};
```

#### controllers/users/edit.js

```js
// creates routing '/users/:id/edit'
module.exports = {
    params: 'id',
    get: function (req, res, next) {
        // code to print form for editing user
    },
    post: function (req, res, next) {
        // code to process form submission
    }
};
```

#### controllers/users/delete.js

```js
// creates routing '/users/:id/delete'
module.exports = {
    params: 'id',
    get: function (req, res, next) {
        // code to print confirmation form for deleting user
    },
    post: function (req, res, next) {
        // code to process form submission
    }
};
```

### Routes & actions

Expressor has the concepts of "routes", "actions" and "methods".

* A route is defined by a folder in the folder structure. e.g. `controllers/users/` folder is the `users` route
* An action is the controller, defined by a file in the folder structure. e.g. `controllers/users/edit.js` is the `edit` action on the `users` route.
* A method is defined by a key on the action object e.g. `get` or `post`

### Route definitions

In addition to defining actions in files, you can also define attributes of the route (i.e. a group of controllers) by placing a file `_index.js` in the route folder.

```js
// controllers/users/_index.js
module.exports = {
    path: '/accounts'
};
```

Actions can be defined in this file rather than one controller per file if preferred:

```js
// controllers/users/_index.js
module.exports = {
    actions: {
        index: {
            get: function (req, res, next) { /* ... */ }
        },
        new: { /* ... */ },
        view: { /* ... */ },
        edit: { /* ... */ },
        delete: { /* ... */ }
    }
};

```

### Routing paths

By default routing paths are created as follows:

* Take the path of the parent route's `index` action
* Add the route name (e.g. `users`)
* Add the action's params e.g. `params: 'id'` adds `:id` to the path
* Add the action name (e.g. `edit`)

#### Overriding/customizing the path

The path can be customized in various ways.

##### Define in route definition

```js
// controllers/users/_index.js
module.exports = {
    path: '/accounts'
};
```

The route path is used as the base of the paths for all the route's actions. i.e. the `edit` action becomes routed as `/accounts/:id/edit`

##### Define in action definition

```js
// controllers/users/index.js
module.exports = {
    path: '/accounts',
    /* rest of action definition */
};
```

##### Change `pathPart` in route definition

`pathPath` by default inherit's the route's name (the folder name) and is used in constructing the path.

```js
// controllers/users/_index.js
module.exports = {
    pathPart: 'accounts'
};
```

This achieves the same as the above examples.

##### Change `pathPart` in action definition

`pathPath` by default inherit's the action's name (the file name) and is used in constructing the path.

```js
// controllers/users/view.js
module.exports = {
    pathPart: null
};
```

##### Params

To create a route `/users/:userId/:profileId`:

```js
// controllers/users/view.js
module.exports = {
    params: ['userId', 'profileId']
};
```

##### parentAction

Sit this action on top of another action in the parent route.

e.g. for /users/:userId/permissions/:permissionId

```js
// controllers/users/permissions/view.js
module.exports = {
    parentAction: 'view',
    pathPart: null,
    params: 'permissionId',
    get: function(req, res) { /* etc etc */ }
};
```

Setting parentAction in the above example sits the route on top of the `users/view` action rather than the default `users/index`. i.e. makes the route path start `/users/:userId/` rather than `/users/`.

#### Path tricks

To make github-style routes `/:organisation/:repo`:

* Create a route folder `controllers/organisations`
* Set `pathPart: null` in organisations route controller (`controllers/organisations/_index.js`)
* Set `pathPath: null` in organisations view action (`controllers/organisations/view.js`)
* Create a route folder `controllers/organisations/repos`
* Set `pathPart: null` in repos route controller (`controllers/organisations/repos/_index.js`)
* Set `pathPath: null` in repos view action (`controllers/organisations/repos/view.js`)
* Set `parentAction: 'view'` in repos view action (`controllers/organisations/repos/view.js`)

The file `controllers/organisations/repos/view.js` will then map to '/:organisation/:repo'.

## Advanced usage

### Options

Options should be passed to `expressor(app, options)` or `expressor(app, path, options)`.

#### methods

Set what methods can be used on actions. Defaults to `['get', 'post']`.

```js
expressor(app, path, { methods: [ 'get', 'post', 'put', 'delete' ] });
```

#### endSlash

Controls whether to add a trailing `/` on the end of routes with empty action `pathPart`. Defaults to `false`.

Routings with `endSlash = false`:

```
/users
/users/new
/users/:id
/users/:id/edit
/users/:id/delete
```

With `endSlash = true`:

```
/users/
/users/new
/users/:id/
/users/:id/edit
/users/:id/delete
```

(NB only `/users/` and `/users/:id/` are affected)

#### indexAction

Set what action is the "index" action i.e. the default action of a route. Defaults to `'index'`.

#### paramsAttribute

Changes attribute of actions that contains params names. Defaults to `'params'`.

#### logger

If a function is provided as `options.logger`, it is called for each route which is attached to express with a message in format 'Attached route: <method> <path>'.

```js
expressor(app, path, {logger: console.log});
```

#### wrapper

A function that wraps all controller method functions. Wrapper is called with `(fn, method, action, app)` and should return a function which will be set as the controller method function in place of the original.

e.g. If you want to write your controller functions to return promises rather than use callbacks:

```js
expressor(app, path, {
    wrapper: function(fn, method, action, app) {
        return function(req, res, next) {
            fn(req, res).then(function() {
                console.log('Request handled: ' + req.url);
            }).catch(function(err) {
                next(err);
            });
        };
    }
});
```

Then an action might be as defined as follows:

```js
// controllers/users/index.js
module.exports = {
    get: function(req, res) {
        return User.findAll().then(function(users) {
            res.json(users);
        });
    }
};
```

### Hooks

To allow customization, hooks can be set to run on the tree of routes, either before paths of each action are defined or after.

Hooks are defined in `options.hooks`.

Hook functions are:

##### treeBeforePath / treeAfterPath

Called with params `(tree, app)` where `tree` is the complete tree of routes. `app` is the express app.

##### routeBeforePath / routeAfterPath

Called on each route in the entire routing tree, with params `(route, app)`.

##### actionBeforePath / actionAfterPath

Called on each action in the entire routing tree, with params `(action, app)`.

#### Example

This example sets the `params` field of each action where params is defined as `true` to '[route name]Id', so that routings are defined like `/users/:userId/permissions/:permissionId`

```js
expressor(app, path, {
    hooks: {
        actionBeforePath: function(action, app) {
            if (action.params === true) {
                action.params = inflection.singularize(action.route.name) + 'Id';
            }
        }
    }
});
```

NB [inflection](https://www.npmjs.com/package/inflection) is a package for converting words between singular and plural.

## Tests

Use `npm test` to run the tests.

## Changelog

See changelog.md

## Issues

If you discover a bug, please raise an issue on Github. https://github.com/overlookmotel/expressor/issues

## Contribution

Pull requests are very welcome. Please:

* ensure all tests pass before submitting PR
* add an entry to changelog
* add tests for new features
* document new functionality/API additions in README
