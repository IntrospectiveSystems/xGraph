# Popup

Version 1.0.0

Introspective Systems, LLC.

---

## Getting Started

`View` is the only required Parameter, and is a Module Address. It will define the Module to generate and show inside the popup.

Example

``` javascript
this.genModule({
    Module: 'xGraph.Popup',
    Par: {
        View: 'Project.Views.CustomView'
    }
}, (err, apex) => {

});
```

The only other accepted Parameter is `Par`, which are the parameters passed to the gen module of `Par.View`.

``` javascript
this.genModule({
    Module: 'xGraph.Popup',
    Par: {
        View: 'Project.Views.CustomView',
        Par: {
            Information: 'Additional Data!',
            OtherModule: this.Par.OtherModule
        }
    }
}, (err, apex) => {

});
```