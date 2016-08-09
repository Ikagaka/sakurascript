# [sakurascript](http://github.com/Ikagaka/sakurascript)

[![npm](https://img.shields.io/npm/v/sakurascript.svg)](https://www.npmjs.com/package/sakurascript)
[![npm license](https://img.shields.io/npm/l/sakurascript.svg)](https://www.npmjs.com/package/sakurascript)
[![npm download total](https://img.shields.io/npm/dt/sakurascript.svg)](https://www.npmjs.com/package/sakurascript)
[![npm download by month](https://img.shields.io/npm/dm/sakurascript.svg)](https://www.npmjs.com/package/sakurascript)
[![Bower](https://img.shields.io/bower/v/sakurascript.svg)](https://github.com/Ikagaka/sakurascript)
[![Bower](https://img.shields.io/bower/l/sakurascript.svg)](https://github.com/Ikagaka/sakurascript)

[![Dependency Status](https://david-dm.org/Ikagaka/sakurascript.svg)](https://david-dm.org/Ikagaka/sakurascript)
[![devDependency Status](https://david-dm.org/Ikagaka/sakurascript/dev-status.svg)](https://david-dm.org/Ikagaka/sakurascript#info=devDependencies)
[![Build Status](https://travis-ci.org/Ikagaka/sakurascript.svg)](https://travis-ci.org/Ikagaka/sakurascript)
[![codecov.io](https://codecov.io/github/Ikagaka/sakurascript/coverage.svg?branch=master)](https://codecov.io/github/Ikagaka/sakurascript?branch=master)
[![Code Climate](https://codeclimate.com/github/Ikagaka/sakurascript/badges/gpa.svg)](https://codeclimate.com/github/Ikagaka/sakurascript)

SakuraScript Parser/Builder

## Usage

node.js:
```javascript
var sakurascript = require('sakurascript');
var SakuraScript = sakurascript.SakuraScript;
```

browser:
```html
<script src="sakurascript.js"></script>
```

```javascript
var script = '\\0\\s[0]Hello, \\w4world!\\e';
var ss = SakuraScript.parse(script);
var obj = ss.toObject();
console.log(script);
console.log(ss.toSakuraScript());
console.log(JSON.stringify(obj));
```

## API

[API Document](https://ikagaka.github.io/sakurascript/index.html)

## License

This is released under [MIT License](http://narazaka.net/license/MIT?2015).