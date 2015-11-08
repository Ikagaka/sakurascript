if require?
  assert = require 'power-assert'
  sakurascript = require '../src/lib/sakurascript'
  SakuraScript = sakurascript.SakuraScript

scripts = [
  '\\0\\s[0]\\t\\_shello\\w[10], \\w4world!\\_s\\e'
  '\\0\\s[1]\\b[-1]hello\\n\\n[half]\\n[20]world!\\e'
  '\\i[10,wait]\\*\\![*]\\q[text,ref0]\\__q[OnAnyEvent,"hello, world!"]aa\\\\a\\__q'
  '\\_l[100,@2em]\\_n\\_q\\_u[0x20]\\_m[0x20]\\&[amp]\\_q\\_na\\x\\c\\![raise,OnEvent,1]\\-'
  '\\4'
  '\\__c\\__t'
  '\\5'
  '\\+'
]

describe 'SakuraScript', ->
  it 'can be inited', ->
    assert new SakuraScript()
  it 'will parse sakura script', ->
    for script in scripts
      ss = SakuraScript.parse(script)
      #console.log script
      #console.log ss.toObject()
      assert ss.toSakuraScript() == script
      assert ss.tokens.length < script.length
  it 'will restore sakura script object', ->
    for script in scripts
      ss = SakuraScript.parse(script)
      obj = ss.toObject()
      ss2 = SakuraScript.fromObject(obj)
      assert ss.toSakuraScript() == ss2.toSakuraScript()
