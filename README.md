![GitHub tag (latest SemVer pre-release)](https://img.shields.io/github/v/tag/devkimson/uniton?include_prereleases&label=release%40latest&sort=semver&style=social)
![GitHub all releases](https://img.shields.io/github/downloads/devkimson/uniton/total?style=social)

# Uniton

# Purpose

Make HTML usable as templates.

## Notice

Uniton is a project started to make static web pages convenient.
Implemented if and for statements with html tags, and made it possible to use templates.

## Usage

### Script Usage & CDN

```html
<!DOCTYPE html>
<html lang="ko">

    <head>

    </head>

    <body>
        <script src="assets/js/uniton.js"></script>
        <script>
            const uniton = Uniton.init({
                // Into Custom Options...
                apiDataPath: "apiData.json",
                postpath: "_posts",
                unitonTemplate: true,
                unitonAnchor: false,
                unitonComponent: true,
            });
        </script>
        <!-- Please write before the end of the body tag -> </body> -->
    </body>

</html>
```

If you want to use it as a cdn, you can copy and use the following.

```html
<!-- ... -->
<script src="https://cdn.jsdelivr.net/gh/devkimson/Uniton@v0.1.5/assets/js/uniton.js" integrity="sha384-rVqrmnLaqt9DH7x5OLCNKE/u/hAy8iSXipsmnGNXzC/7GBIlFzw2k4H3yUF/454A" crossorigin="anonymous"></script>
<script>
    const uniton = Uniton.init({
        // Into Custom Options...
        apiDataPath: "apiData.json",
        postpath: "_posts",
        unitonTemplate: true,
        unitonAnchor: false,
        unitonComponent: true,
    });
</script>
<!-- ... -->
```

If you use cdn, there should be apiData.json and _includs, _pages, _posts, _templates folders, and layout.html in _templates folder.

index.html is the driving part, and layout.html is the template.

```html
<!-- layout.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- your css or meta -->
    <title>Document</title>
</head>
<body>

    <!-- Module Page -->
    <div data-uniton-type="body">
        <!-- 
            Here, the pages in the _posts folder will appear according to the path.
    
            The path mapping refers to the files in the _posts folder. If the path is /home, the home.html file is displayed, and if the path is /album, the album.html file appears where the data attribute uniton-type="body" is.
        -->
    </div>
    <!-- Module Page -->

    <!-- your scripts -->
</body>
</html>
```

Paste the html file of the include as `{#insert _includes/nav.html#}`.

### Options Usage

uniton.js must be declared first. And I add options while initializing Uniton.

Currently available options are apiDataPath, postpath, and privateComponent of template.

| num | option |function|usage|
|---|---|---|---|
|1|apiDataPath|Contains information about the target being operated. If you are creating a blog, you just need to write the blog information.|json file path|
|2|postpath|It is the path of the folder from which the text is to be read. In our example, we entered a path called _posts. All files in the _posts folder are read. (can't read child folder)|posts path name|
|3|unitonComponent|The use of u-* tags, which are uniton components, is prohibited.|true (default) \| false|
|4|unitonAnchor|Coordinates linking in a "Uniton" way.|true\| false (default)|
|5|unitonTemplate|Set whether to use templates.|true \| false (default)|

### Components Usage

There are currently two ready tags.

|#|tag|function|usage|
|---|---|---|---|
|1|u-if|You can show or hide the content wrapped in tags depending on true or false.|"**test**"|
|2|u-for|You can repeat the contents covered by the tag through a number or an array object.|"**var**", "**target**"|

```html
<!-- This is an example of a u-if tag. -->
<u-if test="5>3">
    You will see this content.
</u-if>
<u-if test="5<3">
    But you won't see this.
</u-if>

<!-- This is an example u-for tag. -->
<u-for var="test" target="[1,2,3,4,5,'tom']">
    <div>
        ${test}
    </div>
    <div>
        If you want to add a link when tom is printed, you can nest u-if statements.
        <u-if test="${test=='tom'}">
            <a href="/test">testLink</a>
        </u-if>
    </div>
    <div>
        This will be repeated 6 times, and the array can be retrieved one by one with the name test.
    </div>
</u-for>

<u-if test="3>2">
    <u-for var="a" target="3">
        ${a}
    </u-for>
</u-if>
```


You must use `${...}` only when using variables in the for statement.

### Uniton Regex Usage

The 'Uniton' expression is simple. Use as `{# ... #}`. The method is the same as writing JavaScript syntax. To comment, put an exclamation point after the first #. like this `{#! ... #}`. Then it will not be output to the screen. inserts are likewise ignored.

```html
<div>
    what time is it?
    {# new Date().toLocalString() #}

    <!-- or -->
    {#
        new Date().toLocalString()
    #}
</div>
```

Of course, it can be used interchangeably with u-if and u-for tags.

### Global Variable

An `API` variable is created in the global variable. This is possible with `{# ... #}` or `u-*` tags.

1. API : Variable with API data set by user
2. PostList : A variable in which the file read by referring to the path name in the postpath is converted into an object and stored

### Quick use

```javascript
// index.js

const uniton = Uniton.init({
    // Into Custom Options...
    apiDataPath: "apiData.json",
    postpath: "_posts",
    // If true, files of the form _templates/layout.html are required.
    unitonTemplate: true,
    // If true, files of the form _pages/*.html are required.
    // And in your layout.html you should have a tag with attribute data-uniton-type="body".
    unitonAnchor: true,
    unitonComponent: true,
});
```

```html
<!-- layout.html -->
<!DOCTYPE html>
<html lang="{# navigator.language.split('-')[1] #}">

    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <!-- Bootstrap CSS -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet"
            integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
        <title>{# API.title #}</title>
    </head>

    <body>

        {#insert _includes/nav.html#}

        <!-- Module Page -->
        <div data-uniton-type="body">

        </div>
        <!-- Module Page -->

        {#insert _includes/footer.html#}

        <!-- Option 1: Bootstrap Bundle with Popper -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
            integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous">
        </script>
    </body>

</html>
```