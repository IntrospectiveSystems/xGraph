# Viewify Getting Started


A **View** is defined as any Module who's Apex is an entity that returns a [*View Dispatch Table*](#view-dispatch-table).
All Views contain a jQuery wrapped base Div stored in `this.Vlt.div`. Any element that is added to this Div will be displayed in the View.

### Container Views

Container Views are Views which are designed primarily as a means of layout. Examples of Container Views include: `PanelView` and `GridView`.

### Root Container Views

A Root Container View is like a Container View, in that its primary purpose is a means of layout. However, Root Containers are required to attach Views to the DOM, and act as the controller for all descendants. Examples of Root Container Views include `RootView` and `PopupView`.


## Basic Preparation

For a View to work, the `Viewify.js` script needs to be included on your webpage. Typically, this is achieved by being included in the `Scripts.json` of the top level View ([*root container*](#root-container-views)) in `browser.json`. (Later on, when Viewify is more concrete, including it in every view would be ideal).

## this.super

When the first command is sent to your view (typically the Setup command), it injects `super` into the `this` context. `super` is used as a means to access shared View functionality, the Viewify base-class. A call to `this.Super` accepts two parameters: the command object `com`, and a callback function `fun`. The intended use is to maintain Base functionality while extending a command. 

For example, if you had your own setup process:

```javascript
function Setup(com, fun) {
    this.super(com, (err, cmd) => {
        console.log('--MyView/Setup');
        fun(null, com);
    });
}
```

## Schema

The View "Base Class" Utilizes both `Setup` and `Start` commands, so even if your view doesn't require them, any entity that returns a [*View Dispatch Table*](#view-dispatch-table) should include `Setup` and `Start` in its `schema.json`.

## View Dispatch Table

A *View Dispatch Table* is the core functionality that allows the View "Base Class" to define common & shared functionality. A *View Dispatch Table* is created by passing your Entity class or dispatch table into `Viewify`. The resulting object can be returned by the Entity's closure and used as its Mod. In practice, Defining an Entity with a *View Dispatch Table* looks like the following:

```javascript
(function MyView(){

    function MyCommand(com, fun) {
        console.log('--MyView/MyCommand');
        fun(null, com);
    }

    return Viewify({
        MyCommand: MyCommand
    });
})()
```

Alternatively, if you are using classes:

```javascript
(function MyView(){

    class MyView {
        MyCommand(com, fun) {
            console.log('--MyView/MyCommand');
            fun(null, com);
        }
    }

    return Viewify(MyView);
})()
```


## Setup
All Views receive a 'Setup' command before the first Render command is sent. This is a good place to setup the basic structure, or build elements that will not change.

## Render

The `Render` command is automatically sent to any entity who's children have changed. Before the command is dispatched to you, the array `this.Vlt.viewDivs` is populated with jQuery wrapped elements that are your View's children. If the View is not a Container View, you can safely ignore, and not implement the `Render` command.

A simple `Render` command override:

```javascript
function Render(com, fun) {
    for(let i = 0; i < this.Vlt.viewDivs.length; i++)
        this.Vlt.div.append(this.Vlt.viewDivs[i]);
    this.super(com, (err, cmd) => {
        fun(null, com);
    })
}
```

You'll notice that in this case, the super call is at the end. This is usually done, because the purpose of the super call is to cascade the `Render` command down the DOM

## DOMLoaded

`DOMLoaded` is sent to you when all Views in the local [*root container*](#root-container-views) have completed loading. This refers, for example, to all views under a `RootView` or `PopupView`.

Just like in `Render`, the purpose of the base class `DOMLoaded` command is to cascade the command down the DOM, so calling it after the view does what it needs to do is recommended.

```javascript
function DOMLoaded(com, fun) {
    alert('DOM Loaded!');
    this.super(com, (err, cmd) => {
        fun(null, com);
    })
}
```

# Viewify Changelog

## 3.0

- `this.super`
- `this.ascend`

### `this.super`

`this.super(com, fun)` is a way to pass commands to your view's base class. For example, you may define your own setup function, however Viewify's own setup still needs to run. in this case, you would call `this.super` in your setup function.

Example

``` javascript
(function MyView() {
    class MyView {
        Setup(com, fun) {
            // before base class setup
            this.super(com, (err, cmd) => {
                // after base class setup
            });
        }
    }

    return Viewify(MyView);
})();
```

### `this.ascend`

`this.ascend` is an asyncronous version of `this.send` with slightly different parameters. the signature is `this.ascend(command: string, options: object, destination: string): Promise<com: object || throws err: any>` 

Example

``` javascript
async asyncFunction() {
    try {
        let data = await this.ascend('GetData', {
            Type: 'Volume/Time'
        }, this.Par.DataSource);
        // data is the returned com
    } catch (err) {
        log.w(err)
    }
}
```

## 3.1

- Version Specificty
- Classes
- IDs

### Version Specificty

`Viewify` function now accepts a second parameter, `version` as type `string` that is the semantic version number the view was built in compliance with.

Example

``` javascript
(function MyView() {
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

## 3.2

- Drag and Drop

### Drag and Drop

`AttachDragListener` will make an element that you specify draggable. along with it, you can set some other data to be tied to the element / drop event (when it fires).

Example:

``` javascript
this.super({
    Cmd: 'AttachDragListener',
    To: myDraggableElement, //Native element, not jquery.
    Datatype: 'ItemList',
    Data: {
        Items: [5, 8, 2, 4, 1, 6, 8]
    }
});
```

To create an area where you can drop items, add the `dropArea` class to an element. the View that the Element belongs to will then get a `Drop` Event Command sent to it. the com will look like the following:

``` javascript
com = {
    Cmd: 'Drop',
    Data: {
        Items: [5, 8, 2, 4, 1, 6, 8]
    },
    DropArea: Native_HTML_Element,
    Datatype: 'ItemList',
    PageX: 463,
    PageY: 285,
    DivX: 463,
    DivY: 247
};
```

## 3.3

- updated ascend functionality
- debugger logging
- Cleanup / Destroy

### Update ascend Funtionality

If ascend throws an error, it will now be in the form of `[err, cmd]` such that you can still pull out the original com, even in the event of a rejection.

Example

``` javascript
try {
    let results = await this.ascend('CommandToFail', {}, this.Par.Somewhere);
} catch([err, cmd]) {
    // cmd = { Cmd: 'CommandToFail' }
    log.e(err);
}
```

### debugger loggging

If URL Parameters are supported by the server beingg used, you can append `?debug` or `&debug` to display the full Viewify command tree in the browser console.

Example

`http://localhost:80/login?debug`

`http://localhost:80/View?item=28884737749&debug`

### Cleanup / Destroy

Sending a `Destroy` command to a View will cause it to remove itself from the DOM and the entity cache, causing it to be garbage collected.

As a result, The `Cleanup` command will be sent to the module, before it is destroyed, in case it needs to perform some actions on exit.

As well, the parent of the destroyed view will be sent a Render command with an updated `Vlt.views` and `Vlt.viewDivs`

## 3.4

- `this.asuper`
- `this.genModuleAsync`
- `this.cdnImportCSS`
- `this.id`
- `this.evoke`

### `this.asuper`

`this.asuper(com: object): Promise<com: object || throws [err: any, cmd: object]>` is an asynchronous wrapper for `this.super(com: object, fun: (err: any, cmd: object) => void): void`

Example

``` javascript
(function MyView() {
    class MyView {
        Setup(com, fun) {
            // before base class setup
            this.super(com, (err, cmd) => {
                // after base class setup
            });
        }
    }

    return Viewify(MyView, '3.4');
})();
```

can be written asynchronously as

``` javascript
(function MyView() {
    class MyView {
        async Setup(com, fun) {
            // before base class setup
            com = await this.asuper(com);
            // after base class setup
        }
    }

    return Viewify(MyView, '3.4');
})();
```

### `this.genModuleAsync`

`this.genModuleAsync(modDef: {Module: string, Par: object, Source?: string}): Promise<apx: string || throws err: any>` is an asynchronous wrapper for `this.genModule(modDef: {Module: string, Par: object, Source?: string}, fun: (err: any, apx: string) => void): void`.

Example

``` javascript
(function MyView() {
    class MyView {
        CreateThing(com, fun) {
            this.genModule({
                Module: 'Custom.Module',
                Par: {
                    Link: this.Par.Link
                }
            }, function(err, apx) {
                com.Apx  = apx;
                fun(null, com);
            });
        }
    }

    return Viewify(MyView, '3.4');
})();
```

can be written asynchronously as

``` javascript
(function MyView() {
    class MyView {
        async CreateThing(com, fun) {
            let apx = await this.genModuleAsync({
                Module: 'Custom.Module',
                Par: {
                    Link: this.Par.Link
                }
            });
            com.Apx = apx;
            fun(null, com);
        }
    }

    return Viewify(MyView, '3.4');
})();
```

### `this.cdnImportCSS`

`this.cdnImportCSS(url: string): void` will Import a stylesheet from a CDN. This is useful generally only in development.

Example

``` javascript
this.cdnImportCss('//fonts.googleapis.com/icon?family=Material+Icons');
```

### `this.id`

`this.id(id: string): string` is a function that creates GUIDs based on the provided `id` and your View's `Pid`. The same `this.id` call in the same entity instance will always return the same GUID. This allows for a view to declare simple IDs like `id="${this.id('button')}"` in the DOM and avoid conflicts.

Example

``` javascript
(function MyView() {
    class MyView {
        Render(com, fun) {
            this.Vlt.div.append($(`
                <p id="${this.id('paragraphOne')}">
                    this paragraph's ID is actualy a GUID,
                    however within this entity, we can get
                    that GUID again, with this.id.
                </p>
                <p id="${this.id('paragraphTwo')}">
                    So your easy to remember IDs can exist
                    in the DOM's global scope without
                    conflict!
                </p>
            `));

            let paragraphOne = $(`#${this.id('paraGraphOne')}`);
            let paragraphTwo = $(`#${this.id('paraGraphTwo')}`);
            fun(null, com);
        }
    }

    return Viewify(MyView, '3.4');
})();

```

### `this.evoke`

`this.evoke(pid: string): Promise<void>` will send an evoke to a pid, and take action on the response. This is used to standardize the way that a module declares its visualization. 

Example

In a server side module

``` javascript

```

## 4.0 (Not included in Astro Boy)

- `this.Par.Layout`
- `this.Par.Root`
- LayoutView and RootView Deprecated.

### `this.Par.Layout`

`this.Par.Layout` is now standard for all Views. (See: RootView Layout Par for Example usage). this means you can either declaratively create your layout, all in one module's Layout Par, You could have each view only declare its children, or anything in between.

### `this.Par.Root`

`this.Par.Root` is an optional boolean in the View's Par that if true, declares that this View should be appended to the body of the page directly.

If a View attempts to `AddChild` or `SetChild` a View with `this.Par.Root` set to true, the Command will return a `cmd.err = 'Roots cannot be children'`.

All Root Views will, upon being added to the page, be appended to a linked list, of all other Root Views. This can be used to determine `z-index` order for overlapping Root Views.

### LayoutView and RootView Deprecation

LayoutView served as a means to add more to a layout, when a dead end had been reached in the View tree. However, now that all views can declare a `this.Par.Layout`, LayoutView is no longer needed, and as such is deprecated. it will exist in `Widgets/4_0`, However it will throw a warning on setup, about its deprecation. It will be obselete in Version 5.0

RootView served as a way to create a static page layout, however now that all views can self declare themselves to be a root view, the need for a helper view no longer exists. Same as before, the view will exist in `Widgets/4_0` with a warning on setup, and will not be included in v5.0