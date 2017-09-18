# Viewify Changelog

## 3.0

- Literally everything

The normal Viewify we have right now, list features at some point.

## 3.1

- Version Specificty
- Classes
- IDs

### Version Specificty

`Viewify` function now accepts a second parameter, `version` as type `string` that is the semantic version number the view was built in compliance with.

Example

``` javascript
(function MyView(){
	class MyView {
		//Contents
	}

	return Viewify(MyView, '3.0');
})();
```

### Classes

Each View's userland div, `this.Vlt.div`, is now given a class name equal to the last token in the dot separated `this.Par.Module`.

### IDs

Each View, in its Config Par, Can now declared and `ID` key. If present, the value of the key will be used as the value of the `ID` attribute on `this.Vlt.div`.

## 4.0

- Version Specificty
- `this.Par.Layout`
- `this.Par.Root`
- LayoutView and RootView Deprecated.

### Version Specificity

Version specificity is now required, anything that does not state a version, or a states a version that is incompatible with the current version, will throw an error.

### `this.Par.Layout`

`this.Par.Layout` is now standard for all Views. (See: RootView Layout Par for Example usage). this means you can either declaratively create your layout, all in one module's Layout Par, You could have each view only declare its children, or anything in between.

### `this.Par.Root`

`this.Par.Root` is an optional boolean in the View's Par that if true, declares that this View should be appended to the body of the page directly.

If a View attempts to `AddChild` or `SetChild` a View with `this.Par.Root` set to true, the Command will return a `cmd.err = 'Roots cannot be children'`.

All Root Views will, upon being added to the page, be appended to a linked list, of all other Root Views. This can be used to determine `z-index` order for overlapping Root Views.

### LayoutView and RootView Deprecation

LayoutView served as a means to add more to a layout, when a dead end had been reached in the View tree. However, now that all views can declare a `this.Par.Layout`, LayoutView is no longer needed, and as such is deprecated. it will exist in `Widgets/4_0`, However it will throw a warning on setup, about its deprecation. It will be obselete in Version 5.0

RootView served as a way to create a static page layout, however now that all views can self declare themselves to be a root view, the need for a helper view no longer exists. Same as before, the view will exist in `Widgets/4_0` with a warning on setup, and will not be included in v5.0