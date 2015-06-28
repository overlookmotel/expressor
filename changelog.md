# Changelog

## 0.0.1

* Initial release

## 0.0.2

* Update express dev dependency

## 0.0.3

* README for `parentAction`

## 0.0.4

* Support definition of actions in route definition
* Clear require cache before each test

## 1.0.0

* Hooks
* `wrapper` option
* Action's `pathPart` set to null for index action
* `treePath` set for all actions
* Tests for creation of express routes
* Refactor tests
* README `load` options
* README update

## 1.0.1

* Test code coverage & Travis sends to coveralls
* Test for bad `parentAction`

## 1.0.2

* `npm run cover` runs coverage tests
* README update

## 1.0.3

* Disable Travis dependency cache

## 2.0.0

* `parentAction` refers to action in same route
* Remove support for defining `path` in route
* Rename `action.params` attribute to `param`
* Rename `options.paramsAttribute` to `paramAttribute`
* Define actions' `pathPart` before beforePath hooks

Breaking changes:

* `parentAction` refers to action in same route (rather than parent route in v1.x.x)
* Remove support for defining `path` in route
* Rename `action.params` attribute to `param`
* Rename `options.paramsAttribute` to `paramAttribute`

## Next

* Changelog update
