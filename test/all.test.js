// --------------------
// expressor module
// Tests
// --------------------

// modules
var chai = require('chai'),
	expect = chai.expect,
	pathModule = require('path'),
	express = require('express'),
	_ = require('lodash'),
	expressor = require('../lib/');

// init
chai.config.includeStack = true;

// tests

/* jshint expr: true */
/* global describe, it, beforeEach */

var app,
	loadPath = pathModule.join(__dirname, 'example');

beforeEach(function() {
	// clear require cache
	_.forIn(require.cache, function(obj, key) { // jshint ignore:line
		if (_.startsWith(key, loadPath)) delete require.cache[key];
	});

	// init express app
	app = express();
});

describe('Expressor can be called with', function() {
	it.skip('(app)', function() {
		// can't test this
	});

	it('(app, path)', function() {
		expressor(app, loadPath);
		expect(app.expressor.options.path).to.equal(loadPath);
	});

	it('(app, options)', function() {
		expressor(app, {path: loadPath});
		expect(app.expressor.options.path).to.equal(loadPath);
	});

	it('(app, path, options)', function() {
		expressor(app, loadPath, {foo: 'bar'});
		expect(app.expressor.options.path).to.equal(loadPath);
		expect(app.expressor.options.foo).to.equal('bar');
	});
});

describe('Expressor stores', function() {
	beforeEach(function() {
		expressor(app, loadPath);
	});

	it('routes in express app', function() {
		expect(app.expressor.routes).to.be.ok;
	});

	it('options in express app', function() {
		expect(app.expressor.options).to.be.ok;
	});
});

describe('Path', function() {
	var tree;
	beforeEach(function() {
		expressor(app, loadPath);
		tree = app.expressor.routes;
	});

	it('correct for root index action', function() {
		expect(tree.actions.index.path).to.equal('/');
	});

	it('correct for root other action', function() {
		expect(tree.actions.view.path).to.equal('/view');
	});

	it('correct for route index action', function() {
		expect(tree.routes.users.actions.index.path).to.equal('/users');
	});

	it('correct for route other action', function() {
		expect(tree.routes.users.actions.new.path).to.equal('/users/new');
	});

	it('correct for route other action with params', function() {
		expect(tree.routes.users.actions.edit.path).to.equal('/users/:id/edit');
	});

	it('correct for nested route index action', function() {
		expect(tree.routes.users.routes.permissions.actions.index.path).to.equal('/users/permissions');
	});

	it('correct for nested route index action', function() {
		expect(tree.routes.users.routes.permissions.actions.index.path).to.equal('/users/permissions');
	});

	it('correct for nested route action with parentAction', function() {
		expect(tree.routes.users.routes.permissions.actions.list.path).to.equal('/users/:id/permissions/list');
	});

	it('correct for nested route action with parentAction and params', function() {
		expect(tree.routes.users.routes.permissions.actions.edit.path).to.equal('/users/:id/permissions/:permissionId/edit');
	});

	it('uses route pathPart in index action', function() {
		expect(tree.routes.foo.actions.index.path).to.equal('/bar');
	});

	it('uses route pathPart in other action', function() {
		expect(tree.routes.foo.actions.boo.path).to.equal('/bar/boo');
	});

	it('uses action pathPart', function() {
		expect(tree.actions.old.path).to.equal('/new');
	});

	it('uses action pathPart in child action', function() {
		expect(tree.routes.foo.actions.bam.path).to.equal('/new/bar/bam');
	});

	it('uses empty route pathPart', function() {
		expect(tree.routes.orgs.actions.view.path).to.equal('/:orgId');
	});

	it('uses empty route pathPart in child action', function() {
		expect(tree.routes.orgs.routes.repos.actions.list.path).to.equal('/:orgId/list');
	});

	it('uses empty route pathPart x2 in child action', function() {
		expect(tree.routes.orgs.routes.repos.actions.view.path).to.equal('/:orgId/:repoId');
	});

	it('uses multiple params', function() {
		expect(tree.actions.params.path).to.equal('/:a/:b/params');
	});

	it('overriden by route path', function() {
		expect(tree.routes.zoo.routes.creatures.actions.donkey.path).to.equal('/animals/donkey');
	});

	it('overriden by action path', function() {
		expect(tree.routes.zoo.routes.creatures.actions.monkey.path).to.equal('/baboon');
	});
});

describe('Option', function() {
	describe('methods', function() {
		it('creates routes for included methods', function() {
			var put = false;
			expressor(app, loadPath, {methods: ['get', 'post', 'put'], logger: function(msg) {
				var parts = msg.split('\t');
				if (parts[1] == 'put' && parts[2] == '/users') put = true;
			}});

			expect(put).to.be.true;
		});

		it('does not create routes for non-included methods', function() {
			var put = false;
			expressor(app, loadPath, {logger: function(msg) {
				var parts = msg.split('\t');
				if (parts[1] == 'put' && parts[2] == '/users') put = true;
			}});

			expect(put).to.be.false;
		});
	});

	it('endSlash', function() {
		expressor(app, loadPath, {endSlash: true});
		var tree = app.expressor.routes;
		expect(tree.routes.users.actions.index.path).to.equal('/users/');
		expect(tree.routes.users.actions.new.path).to.equal('/users/new');
		expect(tree.routes.users.actions.view.path).to.equal('/users/:id/');
		expect(tree.routes.users.actions.edit.path).to.equal('/users/:id/edit');
	});

	it('indexAction', function() {
		expressor(app, loadPath, {indexAction: 'view'});
		var tree = app.expressor.routes;
		expect(tree.actions.view.path).to.equal('/');
	});

	it('paramsAttribute', function() {
		expressor(app, loadPath, {paramsAttribute: 'paramsAlt'});
		var tree = app.expressor.routes;
		expect(tree.actions.params.path).to.equal('/:x/params');
	});

	it('logger', function() {
		var msgs = [];
		expressor(app, loadPath, {logger: function(msg) {msgs.push(msg);}});

		expect(msgs.length).to.be.ok;
		msgs.forEach(function(msg) {
			expect(msg).to.match(/^Attached route:\t(get|post)\t\/[^\t]*/);
		});
	});
});