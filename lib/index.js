// --------------------
// expressor module
// --------------------

// modules
var pathModule = require('path'),
    util = require('util'),
    requireFolderTree = require('require-folder-tree'),
    toposort = require('toposort'),
    _ = require('lodash');

// exports
var expressor = module.exports = function(app, path, options) {
    // parse options
    if (typeof path == 'object') {
        options = path;
        path = undefined;
    }

    options = _.extend({
        path: path || pathModule.join(process.cwd(), 'controllers'),
        methods: ['get', 'post'],
        endSlash: false,
        indexAction: 'index',
        routeFile: '_index.js',
        paramAttribute: 'param',
        //logger: undefined,
        //wrapper: undefined,
        hooks: {
            //treeBeforePath: undefined,
            //routeBeforePath: undefined,
            //actionBeforePath: undefined,
            //treeAfterPath: undefined,
            //routeAfterPath: undefined,
            //actionAfterPath: undefined,
        }
    }, options || {});

    options.load = _.extend({
        filterFiles: /^([^\._].*)\.js$/,
        filterFolders: /^([^\._].*)$/
    }, options.load || {});

    app.expressor = {options: options};

    // prepare logger
    var logger = options.logger || function() {};

    // load controllers
    var loadOptions = _.defaults({
        recurse: true,
        flatten: false,
        foldersKey: 'routes',
        filesKey: 'actions'
    }, options.load, {indexFile: options.routeFile});

    var routes = requireFolderTree(options.path, loadOptions);
    app.expressor.routes = routes;

    // define name, parent, pathPart and treePath for all routes
    // define name, route, pathPart, parentAction and treePath for all actions
    walkRoutesWithParams(routes, function(route, routeName, parent) {
        route.name = routeName;
        route.parent = parent;

        if (route.pathPart === undefined) route.pathPart = routeName;
        route.treePath = (parent ? parent.treePath + '/' + routeName : '');

        _.forIn(route.actions, function(action, actionName) {
            action.name = actionName;
            action.route = route;
            if (action.pathPart === undefined) action.pathPart = ((actionName == options.indexAction) ? null : actionName);

            if (!action.parentAction) {
                action.parentAction = ((actionName == options.indexAction) ? '../' : '') + options.indexAction;
            } else if (_.endsWith(action.parentAction, '../')) {
                action.parentAction += options.indexAction;
            }

            action.treePath = route.treePath + '/' + actionName;
        });
    }, null, null);

    // run beforePath hooks
    var hooks = options.hooks;
    if (hooks.treeBeforePath) hooks.treeBeforePath(routes, app);
    if (hooks.routeBeforePath) walkRoutes(routes, hooks.routeBeforePath, app);
    if (hooks.actionBeforePath) walkActions(routes, hooks.actionBeforePath, app);

    // define paths for all actions
    // process in order so that actions which act as parents for other actions are processed first
    walkRoutes(routes, function(route) {
        // identify dependencies between actions
        var actions = route.actions,
            actionNames = [],
            dependencies = [];

        _.forIn(actions, function(action, actionName) {
            actionNames.push(actionName);
            if (!_.startsWith(action.parentAction, '../')) dependencies.push([action.parentAction, actionName]);
        });

        // sort actions into dependency order
        try {
            actionNames = toposort.array(actionNames, dependencies);
        } catch (err) {
            var match = err.message.match(/^Cyclic dependency: "(.*)"$/);
            if (!match) throw err;

            var action = actions[match[1]];
            throw new expressor.Error("Cyclic dependency of parentActions for action " + action.treePath);
        }

        // create path for all actions
        actionNames.forEach(function(actionName) {
            var action = actions[actionName];
            action.path = makePath(action);
        });
    });

    // run afterPath hooks
    if (hooks.treeAfterPath) hooks.treeAfterPath(routes, app);
    if (hooks.routeAfterPath) walkRoutes(routes, hooks.routeAfterPath, app);
    if (hooks.actionAfterPath) walkActions(routes, hooks.actionAfterPath, app);

    // attach route actions to app

    // extract routes into array
    var actions = [];
    walkActions(routes, function(action) {
        actions.push(action);
    });

    // sort routes - so ':id' parts do not intercept other routes
    actions.sort(function(action1, action2) {
        if (action1.path == action2.path) return 0;

        var parts1 = action1.path.substr(1).split('/');
        var parts2 = action2.path.substr(1).split('/');

        var len = (parts1.length < parts2.length) ? parts1.length : parts2.length;

        for (var i = 0; i < len; i++) {
            if (parts1[i] == parts2[i]) continue;

            var id1 = _.startsWith(parts1[i], ':'),
                id2 = _.startsWith(parts2[i], ':');

            if (id1 && id2) continue;
            if (id1) return 1;
            if (id2) return -1;

            return (parts1[i] > parts2[i]) ? 1 : -1;
        }

        return (parts1.length > parts2.length) ? 1 : -1;
    });

    // attach routes to app
    actions.forEach(function(action) {
        options.methods.forEach(function(method) {
            var fn = action[method];
            if (!fn) return;

            if (options.wrapper) fn = options.wrapper(fn, method, action, app);

            app[method](action.path, fn);
            logger('Attached route:\t' + method + '\t' + action.path);
        });
    });

    // function to create action path
    function makePath(action) {
        if (action.path) return action.path;

        // get parentAction's path
        var route = action.route,
            parentRoute = action.route,
            parentAction = action.parentAction;

        while (_.startsWith(parentAction, '../')) {
            parentRoute = parentRoute.parent;
            parentAction = parentAction.slice(3);
        }

        var path;
        if (parentRoute) {
            parentAction = parentRoute.actions[parentAction];
            if (!parentAction) throw new expressor.Error("Cannot find parent action '" + action.parentAction + "' for action " + action.treePath);

            path = parentAction.path;
        } else {
            path = '';
        }

        // add route pathPart
        if (_.startsWith(action.parentAction, '../') && route.pathPart) {
            if (!_.endsWith(path, '/')) path += '/';
            path += route.pathPart;
        }

        // add params
        var params = action[options.paramAttribute];
        if (params instanceof Array && params.length == 0) params = action[options.paramAttribute] = null;
        if (params) {
            if (!(params instanceof Array)) params = action[options.paramAttribute] = [params];

            params.forEach(function(param) {
                if (!_.endsWith(path, '/')) path += '/';
                path += ':' + param;
            });
        }

        // add action pathPart
        if (action.pathPart) {
            if (!_.endsWith(path, '/')) path += '/';
            path += action.pathPart;
        } else if (options.endSlash) {
            if (!_.endsWith(path, '/')) path += '/';
        } else if (path == '') {
            path = '/';
        }

        // return complete path
        return path;
    }
};

// functions to iterate through route tree
function walkRoutesWithParams(route, fn, routeName, parent) {
    fn(route, routeName, parent);

    if (route.routes) {
        _.forIn(route.routes, function(childRoute, childRouteName) {
            walkRoutesWithParams(childRoute, fn, childRouteName, route);
        });
    }
}

function walkRoutes(route, fn, extra) {
    fn(route, extra);

    if (route.routes) {
        _.forIn(route.routes, function(childRoute, childRouteName) { // jshint ignore:line
            walkRoutes(childRoute, fn, extra);
        });
    }
}

function walkActions(route, fn, extra) {
    walkRoutes(route, function(route) {
        _.forIn(route.actions, function(action) {
            fn(action, extra);
        });
    });
}

// define error
expressor.Error = function(message) {
	var tmp = Error.call(this, message);
	tmp.name = this.name = 'ExpressorError';
    this.message = tmp.message;
    Error.captureStackTrace(this, this.constructor);
};
util.inherits(expressor.Error, Error);
