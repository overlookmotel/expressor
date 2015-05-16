// --------------------
// expressor module
// --------------------

// modules
var pathModule = require('path'),
    util = require('util'),
    requireFolderTree = require('require-folder-tree'),
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
        paramsAttribute: 'params'
        //logger: undefined
    }, options || {});

    options.load = _.extend({
        filterFiles: /^([^\._].*)\.js$/,
        filterFolders: /^([^\._].*)$/,
        indexFile: '_index.js'
    }, options.load || {});

    app.expressor = {options: options};

    // prepare logger
    var logger = options.logger || function() {};

    // load controllers
    var loadOptions = _.defaults({
        recurse: true,
        fileNameAttribute: 'name',
        folderNameAttribute: 'name',
        fileParentAttribute: 'route',
        folderParentAttribute: 'parent',
        flatten: false,
        foldersKey: 'routes',
        filesKey: 'actions'
    }, options.load);

    var routes = requireFolderTree(options.path, loadOptions);
    app.expressor.routes = routes;

    // define pathPart and treePath for all routes
    walkRoutes(routes, function(route) {
        if (route.pathPart === undefined) route.pathPart = route.name;
        route.treePath = (route.parent ? route.parent.treePath : '') + '/' + route.name;
    });

    // define paths for all actions
    walkActions(routes, function(action) {
        action.path = makePath(action);
    });

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
            if (action[method]) {
                app[method](action.path, action[method]);
                logger('Attached route:\t' + method + '\t' + action.path);
            }
        });
    });

    // function to create action path
    function makePath(action) {
        if (action.path) return action.path;

        // get route path
        var route = action.route,
            path = route.path;

        action.treePath = route.treePath + '/' + action.name;

        if (path === undefined) {
            // get parent action path
            if (route.parent) {
                if (!action.parentAction) action.parentAction = options.indexAction;

                var parentAction = route.parent.actions[action.parentAction];
                if (!parentAction) throw new expressor.Error("Cannot find parent action '" + action.parentAction + "' for action " + action.treePath);

                path = parentAction.path;
            } else {
                path = '';
            }

            // add route name/pathPart
            if (route.pathPart) {
                if (!_.endsWith(path, '/')) path += '/';
                path += route.pathPart;
            }
        }

        // add params
        var params = action[options.paramsAttribute];
        if (params instanceof Array && params.length == 0) params = action[options.paramsAttribute] = null;
        if (params) {
            if (!(params instanceof Array)) params = action[options.paramsAttribute] = [params];

            params.forEach(function(param) {
                if (!_.endsWith(path, '/')) path += '/';
                path += ':' + param;
            });
        }

        // add action name/pathPart
        if (action.pathPart === undefined) action.pathPart = (action.name == options.indexAction) ? '' : action.name;

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
function walkRoutes(route, fn) {
    fn(route);

    if (route.routes) {
        _.forIn(route.routes, function(childRoute) {
            walkRoutes(childRoute, fn);
        });
    }
}

function walkActions(route, fn) {
    walkRoutes(route, function(route) {
        _.forIn(route.actions, function(action) {
            fn(action);
        });
    });
}

// define error
expressor.Error = function(message) {
	this.name = 'ExpressorError';
	this.message = message;
};
util.inherits(expressor.Error, Error);
