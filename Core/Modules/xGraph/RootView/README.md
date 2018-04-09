### RootView

Version 1.0.0

Introspective Systems LLC.

---

A `RootView` is the most basic root container view, and is the starting
point for most view layouts. That is, it is the most basic view that can
attach itself to the DOM.

RootView builds and renders a page by reading and building the view
modules specified in the `"Layout"` parameter. RootView only works with
view modules, or any module who's Apex entity is a Viewify subclass.

#### Loading a single view

You can create a user interface with a single, customized, full screen
view by loading a custom built view in RootView using the `Layout`
parameter. In the example below, RootView will build and then render the
view module defined by `$MyView`.

``` json
{
    "Module": "xGraph.RootView",
    "Par": {
        "Layout": "$MyView"
    }
}
```


#### Loading multiple view modules

If you want to build a user interface using more than one view, then you
need to use a container view, such as [PanelView](./PanelView), to split
up the available screen space.

``` json
{
    "Module": "xGraph.RootView",
    "Par": {
        "Layout": {
            "View": "$Panel",
            "Children": [
                "$LeftView",
                "$RightView"
            ]
        }
    }
}
```

You can continue to add nested container views split up the available
space, and adding views that fill in the space, or render content, where
you want.

``` json
{
    "Module": "xGraph.RootView",
    "Par": {
        "Layout": {
            "View": "$Panel",
            "Children": [
                {
                    "View": "$Panel",
                    "Children": [
                        "$LeftView",
                        "$MiddleView"
                    ]
                },
                "$RightView"
            ]
        }
    }
}
```

### Module Interface

Below you can find all the details on how to interact with the RootView
module.

#### Module Definition Parameters

The following parameters are passed to the RootView module on
instantiation.

- **this.Par.Layout** : The view that will be built and rendered by
RootView.
- **this.Par.Layout.View** : The view module that will be RootView's
direct child.
- **this.Par.Layout.Children** : If the view module specified in the
"View" parameter can load child views, list he child views here.

---

#### Output Commands

