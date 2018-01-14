# [sakurascript](http://github.com/Ikagaka/sakurascript)

[![npm](https://img.shields.io/npm/v/sakurascript.svg)](https://www.npmjs.com/package/sakurascript)
[![npm license](https://img.shields.io/npm/l/sakurascript.svg)](https://www.npmjs.com/package/sakurascript)
[![npm download total](https://img.shields.io/npm/dt/sakurascript.svg)](https://www.npmjs.com/package/sakurascript)
[![npm download by month](https://img.shields.io/npm/dm/sakurascript.svg)](https://www.npmjs.com/package/sakurascript)

[![Dependency Status](https://david-dm.org/Ikagaka/sakurascript/status.svg)](https://david-dm.org/Ikagaka/sakurascript)
[![devDependency Status](https://david-dm.org/Ikagaka/sakurascript/dev-status.svg)](https://david-dm.org/Ikagaka/sakurascript?type=dev)
[![Travis Build Status](https://travis-ci.org/Ikagaka/sakurascript.svg?branch=master)](https://travis-ci.org/Ikagaka/sakurascript)
[![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/github/Ikagaka/sakurascript?svg=true&branch=master)](https://ci.appveyor.com/project/Narazaka/sakurascript)
[![codecov.io](https://codecov.io/github/Ikagaka/sakurascript/coverage.svg?branch=master)](https://codecov.io/github/Ikagaka/sakurascript?branch=master)
[![Code Climate](https://codeclimate.com/github/Ikagaka/sakurascript/badges/gpa.svg)](https://codeclimate.com/github/Ikagaka/sakurascript)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/1f2c243fa5a443ba939855b17cb6f703)](https://www.codacy.com/app/narazaka/sakurascript?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Ikagaka/sakurascript&amp;utm_campaign=Badge_Grade)
[![Greenkeeper badge](https://badges.greenkeeper.io/Ikagaka/sakurascript.svg)](https://greenkeeper.io/)

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

This is released under [MIT License](http://narazaka.net/license/MIT?2016).
