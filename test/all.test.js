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
});