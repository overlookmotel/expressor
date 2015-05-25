// --------------------
// expressor module
// Tests
// --------------------

// modules
var chai = require('chai'),
	expect = chai.expect,
	pathModule = require('path'),
	express = require('express'),
	request = require('supertest'),
	sinon = require('sinon'),
	sinonChai = require('sinon-chai'),
	_ = require('lodash'),
	expressor = require('../lib/');

// init
chai.config.includeStack = true;
chai.use(sinonChai);

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
	var thisLoadPath = pathModule.join(loadPath, 'root');

	it.skip('(app)', function() {
		// can't test this
	});

	it('(app, path)', function() {
		expressor(app, thisLoadPath);
		expect(app.expressor.options.path).to.equal(thisLoadPath);
	});

	it('(app, options)', function() {
		expressor(app, {path: thisLoadPath});
		expect(app.expressor.options.path).to.equal(thisLoadPath);
	});

	it('(app, path, options)', function() {
		expressor(app, thisLoadPath, {foo: 'bar'});
		expect(app.expressor.options.path).to.equal(thisLoadPath);
		expect(app.expressor.options.foo).to.equal('bar');
	});
});

describe('Expressor stores', function() {
	var thisLoadPath = pathModule.join(loadPath, 'root');

	beforeEach(function() {
		expressor(app, thisLoadPath);
	});

	it('routes in express app', function() {
		expect(app.expressor.routes).to.be.ok;
	});

	it('options in express app', function() {
		expect(app.expressor.options).to.be.ok;
	});
});

describe('Expressor creates express routes for', function() {
	var thisLoadPath = pathModule.join(loadPath, 'express');

	beforeEach(function() {
		expressor(app, thisLoadPath);
	});

	it('GET method', function(cb) {
		request(app).get('/').expect('GET index', cb);
	});

	it('POST method', function(cb) {
		request(app).post('/').expect('POST index', cb);
	});
});

describe('Path correct for', function() {
	describe('root route', function() {
		var tree;
		beforeEach(function() {
			expressor(app, pathModule.join(loadPath, 'root'));
			tree = app.expressor.routes;
		});

		it('index action', function() {
			expect(tree.actions.index.path).to.equal('/');
		});

		it('other action', function() {
			expect(tree.actions.view.path).to.equal('/view');
		});
	});

	describe('nested routes', function() {
		var tree;
		beforeEach(function() {
			expressor(app, pathModule.join(loadPath, 'nested'));
			tree = app.expressor.routes;
		});

		describe('1st level', function() {
			it('index action', function() {
				expect(tree.routes.foo.actions.index.path).to.equal('/foo');
			});

			it('other action', function() {
				expect(tree.routes.foo.actions.view.path).to.equal('/foo/view');
			});
		});

		describe('2nd level', function() {
			it('index action', function() {
				expect(tree.routes.foo.routes.bar.actions.index.path).to.equal('/foo/bar');
			});

			it('other action', function() {
				expect(tree.routes.foo.routes.bar.actions.view.path).to.equal('/foo/bar/view');
			});
		});
	});

	describe('params', function() {
		var tree;
		beforeEach(function() {
			expressor(app, pathModule.join(loadPath, 'params'));
			tree = app.expressor.routes;
		});

		describe('root level', function() {
			it('single param action', function() {
				expect(tree.actions.view.path).to.equal('/:id/view');
			});

			it('multiple param action', function() {
				expect(tree.actions.multiple.path).to.equal('/:id1/:id2/multiple');
			});
		});

		describe('1st level', function() {
			it('single param action', function() {
				expect(tree.routes.foo.actions.view.path).to.equal('/foo/:id/view');
			});

			it('multiple param action', function() {
				expect(tree.routes.foo.actions.multiple.path).to.equal('/foo/:id1/:id2/multiple');
			});
		});
	});

	describe('parentAction', function() {
		var tree;
		beforeEach(function() {
			expressor(app, pathModule.join(loadPath, 'parentAction'));
			tree = app.expressor.routes;
		});

		describe('1st level', function() {
			it('index action', function() {
				expect(tree.routes.foo.actions.index.path).to.equal('/:id/view/foo');
			});

			it('other action', function() {
				expect(tree.routes.foo.actions.view.path).to.equal('/:id/view/foo/:fooId/view');
			});
		});

		describe('2nd level', function() {
			it('index action', function() {
				expect(tree.routes.foo.routes.bar.actions.index.path).to.equal('/:id/view/foo/:fooId/view/bar');
			});

			it('other action', function() {
				expect(tree.routes.foo.routes.bar.actions.view.path).to.equal('/:id/view/foo/:fooId/view/bar/:barId/view');
			});
		});
	});

	describe('pathPart', function() {
		var tree;
		beforeEach(function() {
			expressor(app, pathModule.join(loadPath, 'pathPart'));
			tree = app.expressor.routes;
		});

		describe('altered', function() {
			describe('on action', function() {
				it('root level', function() {
					expect(tree.actions.edit.path).to.equal('/update');
				});

				it('1st level', function() {
					expect(tree.routes.foo.actions.edit.path).to.equal('/foo/update');
				});

				it('1st level inherited using parentAction', function() {
					expect(tree.routes.foo.actions.inherit.path).to.equal('/update/foo/inherit');
				});
			});

			describe('on route', function() {
				it('index action', function() {
					expect(tree.routes.alter.actions.index.path).to.equal('/altered');
				});

				it('other action', function() {
					expect(tree.routes.alter.actions.view.path).to.equal('/altered/view');
				});
			});
		});

		describe('removed', function() {
			describe('on action', function() {
				it('root level', function() {
					expect(tree.actions.view.path).to.equal('/:id');
				});

				it('1st level', function() {
					expect(tree.routes.foo.actions.view.path).to.equal('/foo/:id');
				});
			});

			describe('on route', function() {
				it('index action', function() {
					expect(tree.routes.removed.actions.index.path).to.equal('/:id');
				});

				it('other action', function() {
					expect(tree.routes.removed.actions.view.path).to.equal('/:id/view');
				});
			});
		});
	});

	describe('path', function() {
		var tree;
		beforeEach(function() {
			expressor(app, pathModule.join(loadPath, 'path'));
			tree = app.expressor.routes;
		});

		describe('on action', function() {
			it('root level', function() {
				expect(tree.actions.edit.path).to.equal('/update');
			});

			it('1st level', function() {
				expect(tree.routes.foo.actions.edit.path).to.equal('/bar/update');
			});

			it('1st level inherited using parentAction', function() {
				expect(tree.routes.foo.actions.inherit.path).to.equal('/update/foo/inherit');
			});
		});

		describe('on route', function() {
			it('index action', function() {
				expect(tree.routes.alter.actions.index.path).to.equal('/altered');
			});

			it('other action', function() {
				expect(tree.routes.alter.actions.view.path).to.equal('/altered/view');
			});
		});
	});
});

describe('Option', function() {
	describe('methods', function() {
		var thisLoadPath = pathModule.join(loadPath, 'methods');

		it('creates routes for included methods', function() {
			var put = false;
			expressor(app, thisLoadPath, {methods: ['get', 'post', 'put'], logger: function(msg) {
				var parts = msg.split('\t');
				if (parts[1] == 'put' && parts[2] == '/') put = true;
			}});

			expect(put).to.be.true;
		});

		it('does not create routes for non-included methods', function() {
			var put = false;
			expressor(app, thisLoadPath, {logger: function(msg) {
				var parts = msg.split('\t');
				if (parts[1] == 'put' && parts[2] == '/') put = true;
			}});

			expect(put).to.be.false;
		});
	});

	it('endSlash', function() {
		expressor(app, pathModule.join(loadPath, 'resource'), {endSlash: true});
		var tree = app.expressor.routes;
		expect(tree.actions.index.path).to.equal('/');
		expect(tree.actions.foo.path).to.equal('/foo');
		expect(tree.routes.users.actions.index.path).to.equal('/users/');
		expect(tree.routes.users.actions.new.path).to.equal('/users/new');
		expect(tree.routes.users.actions.view.path).to.equal('/users/:id/');
		expect(tree.routes.users.actions.edit.path).to.equal('/users/:id/edit');
	});

	it('indexAction', function() {
		expressor(app, pathModule.join(loadPath, 'indexAction'), {indexAction: 'ind'});
		var tree = app.expressor.routes;
		expect(tree.actions.ind.path).to.equal('/');
		expect(tree.routes.foo.actions.ind.path).to.equal('/foo');
		expect(tree.routes.foo.actions.new.path).to.equal('/foo/new');
	});

	it('paramsAttribute', function() {
		expressor(app, pathModule.join(loadPath, 'paramsAttribute'), {paramsAttribute: 'paramsAlt'});
		var tree = app.expressor.routes;
		expect(tree.actions.index.path).to.equal('/:id');
	});

	it('logger', function() {
		var msgs = [];
		expressor(app, pathModule.join(loadPath, 'root'), {logger: function(msg) {msgs.push(msg);}});

		expect(msgs.length).to.be.ok;
		msgs.forEach(function(msg) {
			expect(msg).to.match(/^Attached route:\t(get|post)\t\/[^\t]*/);
		});
	});

	describe('wrapper', function() {
		var thisLoadPath = pathModule.join(loadPath, 'wrapper');

		it('is called with (fn, method, action, app)', function() {
			var spy = sinon.spy(function(fn) {return fn;});
			expressor(app, thisLoadPath, {wrapper: spy});

			expect(spy).has.been.calledOnce;
			expect(spy.firstCall).calledWithExactly(
				sinon.match.func,
				'get',
				app.expressor.routes.actions.index,
				app
			);
		});

		it('wraps route method function', function(cb) {
			expressor(app, thisLoadPath, {wrapper: function(fn, method, action, app) { // jshint ignore:line
				return function(req, res, next) {
					req.foo = 'bar';
					return fn(req, res, next);
				};
			}});

			request(app).get('/').expect('GET index bar', cb);
		});
	});
});

describe('Hooks', function() {
	var thisLoadPath = pathModule.join(loadPath, 'hooks');

	describe('before', function() {
		describe('tree', function() {
			it('is called with (tree, app)', function() {
				var spy = sinon.spy();
				expressor(app, thisLoadPath, {hooks: {treeBeforePath: spy}});

				expect(spy).has.been.calledOnce;
				expect(spy).has.been.calledWithExactly(app.expressor.routes, app);
			});

			it('acts on tree', function() {
				expressor(app, thisLoadPath, {hooks: {treeBeforePath: function(tree, app) { // jshint ignore:line
					tree.actions.index.pathPart = 'foo';
				}}});

				expect(app.expressor.routes.actions.index.path).to.equal('/foo');
			});
		});

		describe('route', function() {
			it('is called on every route with (route, app)', function() {
				var spy = sinon.spy();
				expressor(app, thisLoadPath, {hooks: {routeBeforePath: spy}});

				expect(spy).has.been.calledTwice;
				expect(spy.firstCall).calledWithExactly(app.expressor.routes, app);
				expect(spy.secondCall).calledWithExactly(app.expressor.routes.routes.foo, app);
			});

			it('acts on every route', function() {
				expressor(app, thisLoadPath, {hooks: {routeBeforePath: function(route, app) { // jshint ignore:line
					route.actions.index.pathPart = 'bar';
				}}});

				expect(app.expressor.routes.actions.index.path).to.equal('/bar');
				expect(app.expressor.routes.routes.foo.actions.index.path).to.equal('/bar/foo/bar');
			});
		});

		describe('action', function() {
			it('is called on every action with (action, app)', function() {
				var spy = sinon.spy();
				expressor(app, thisLoadPath, {hooks: {actionBeforePath: spy}});

				expect(spy).has.been.calledTwice;
				expect(spy.firstCall).calledWithExactly(app.expressor.routes.actions.index, app);
				expect(spy.secondCall).calledWithExactly(app.expressor.routes.routes.foo.actions.index, app);
			});

			it('acts on every action', function() {
				expressor(app, thisLoadPath, {hooks: {actionBeforePath: function(action, app) { // jshint ignore:line
					action.pathPart = 'bar';
				}}});

				expect(app.expressor.routes.actions.index.path).to.equal('/bar');
				expect(app.expressor.routes.routes.foo.actions.index.path).to.equal('/bar/foo/bar');
			});
		});
	});

	describe('after', function() {
		describe('tree', function() {
			it('is called with (tree, app)', function() {
				var spy = sinon.spy();
				expressor(app, thisLoadPath, {hooks: {treeAfterPath: spy}});

				expect(spy).has.been.calledOnce;
				expect(spy).has.been.calledWithExactly(app.expressor.routes, app);
			});

			it('acts on tree', function() {
				expressor(app, thisLoadPath, {hooks: {treeAfterPath: function(tree, app) { // jshint ignore:line
					tree.actions.index.path = '/foo';
				}}});

				expect(app.expressor.routes.actions.index.path).to.equal('/foo');
			});
		});

		describe('route', function() {
			it('is called on every route with (route, app)', function() {
				var spy = sinon.spy();
				expressor(app, thisLoadPath, {hooks: {routeAfterPath: spy}});

				expect(spy).has.been.calledTwice;
				expect(spy.firstCall).calledWithExactly(app.expressor.routes, app);
				expect(spy.secondCall).calledWithExactly(app.expressor.routes.routes.foo, app);
			});

			it('acts on every route', function() {
				expressor(app, thisLoadPath, {hooks: {routeAfterPath: function(route, app) { // jshint ignore:line
					route.actions.index.path = '/prefix' + route.actions.index.path;
				}}});

				expect(app.expressor.routes.actions.index.path).to.equal('/prefix/');
				expect(app.expressor.routes.routes.foo.actions.index.path).to.equal('/prefix/foo');
			});
		});

		describe('action', function() {
			it('is called on every action with (action, app)', function() {
				var spy = sinon.spy();
				expressor(app, thisLoadPath, {hooks: {actionAfterPath: spy}});

				expect(spy).has.been.calledTwice;
				expect(spy.firstCall).calledWithExactly(app.expressor.routes.actions.index, app);
				expect(spy.secondCall).calledWithExactly(app.expressor.routes.routes.foo.actions.index, app);
			});

			it('acts on every action', function() {
				expressor(app, thisLoadPath, {hooks: {actionAfterPath: function(action, app) { // jshint ignore:line
					action.path = '/prefix' + action.path;
				}}});

				expect(app.expressor.routes.actions.index.path).to.equal('/prefix/');
				expect(app.expressor.routes.routes.foo.actions.index.path).to.equal('/prefix/foo');
			});
		});
	});
});
