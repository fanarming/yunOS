# gulp-include-template [![Build Status](https://travis-ci.org/FroadUED/gulp-include-template.svg?branch=master)](https://travis-ci.org/FroadUED/gulp-include-template/)

[![NPM](https://nodei.co/npm/gulp-include-template.png?downloads=true&stars=true)](https://nodei.co/npm/gulp-include-template/)

This is a gulp plugin to extend artTemplate include function replacing &lt;% include() %> with compiled functions.
In 0.1.0 version, we add `includeNative` to include native html but not compiled html. The syntax is the same with `include` but without passing a `data` object.

## Usage

html/hello.html

```html
<!doctype html>
<body>
<% var data = { "hello": "world" }; %>
<% include('header.html', data); %>
<% include('footer.html', data); %>
</body>
</html>
```

html/header.html

```html
<header><%= hello %></header>
```

html/footer.html

```html
<footer><%= hello %></footer>
```

```javascript
var gulp = require("gulp"),
    gulpIncludeTemplate = require("gulp-include-template");


gulp.task("includeTemplate", function() {

    return gulp.src("../html/hello.html")
        // options is optional
        .pipe(gulpIncludeTemplate())
        .pipe(gulp.dest("./compiled"));
});
```
After running the includeTemplate task:

compiled/hello.html

```html
<!DOCTYPE html>
<html>
<body>
<% var data = { "hello": "world" }; %>
 <% (function($$data) {%>
 <% var hello=$$data.hello; %>
<header><%= hello %></header>
 <% })( data); %>
 <% (function($$data) {%>
 <% var hello=$$data.hello; %>
<footer><%= hello %></footer>
 <% })( data); %>
</body>
</html>
```
## Set the base

If we want to refer to the js/css with the absolute url starts with '/', you should set the base attribute
of gulp-include-template.

```javascript
var gulp = require("gulp"),
    gulpIncludeTemplate = require("gulp-include-template");

// if we set the base of gulp-include-template, we can access them the absolute url starts with '/'
gulpIncludeTemplate.config('base', 'path/to/html');
gulp.task("includeTemplate", function() {

    return gulp.src("../html/hello.html")
        // options is optional
        .pipe(gulpIncludeTemplate())
        .pipe(gulp.dest("./compiled"));
});
```
Html is like this.

```html
<!doctype html>
<body>
<% var data = { "hello": "world" }; %>
<% include('/dirUnderPathToHtml/header.html', data); %>
<% include('/dirUnderPathToHtml/footer.html', data); %>
</body>
</html>
```

The compiled hello.html can be directly used by the [artTemplate](https://github.com/aui/artTemplate) without loading the outer html in running time.


## Release log

1. 0.1.0 add `includeNative` to just include original content to template.

