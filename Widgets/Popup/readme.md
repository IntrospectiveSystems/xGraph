# Popup

Version 1.0.0

Introspective Systems, LLC.

---

A Popup is a form of [RootView](#), with some key differences.



## Basic Configuration

To create a webpage with just a single full screen view, all you need to do is have a root view, with your single view attached to it. It will automatically fill the space.

Example

``` json
{
    "Module": "xGraph.Views.RootView",
    "Par": {
        "Layout": "$MyView"
    }
}
```

## Advanced Configuration

If you want more than one view on the screen at a time, then we need to use something like a [PanelView](#), to split up the available screen space.

``` json
{
    "Module": "xGraph.Views.RootView",
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

You can continue this recursive pattern to keep splitting up the available space and adding views

``` json
{
    "Module": "xGraph.Views.RootView",
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