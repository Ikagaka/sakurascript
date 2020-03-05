/// <reference types="mocha" />
import * as assert from "power-assert";
import { SakuraScript } from "../lib/sakurascript";

const scripts = [
  "\\0\\s[0]\\t\\_shello\\w[10], \\w4world!\\_s\\e",
  "\\0\\s[1]\\b[-1]hello\\n\\n[half]\\n[20]world!\\e",
  '\\i[10,wait]\\*\\![*]\\q[text,ref0]\\__q[OnAnyEvent,"hello, world!"]aa\\\\a\\__q',
  "\\_l[100,@2em]\\_n\\_q\\_u[0x20]\\_m[0x20]\\&[amp]\\_q\\_na\\x\\c\\![raise,OnEvent,1]\\-",
  "\\4",
  "\\f[name,Meiryo,foo.ttf]\\f[height,+10]\\f[color,red]\\f[strike,true]\\f[default]",
  "\\f[cursorcolor,0%,0%,100%]\\f[cursorfontcolor,255,0,0]\\f[cursormethod,copypen]\\f[cursorstyle,underline]",
  "\\__c\\__t",
  "\\5",
  "\\+",
];

describe("SakuraScript", () => {
  it("can be inited", () => {
    assert(new SakuraScript());
  });
  it("will parse sakura script", () => {
    for (const script of scripts) {
      const ss = SakuraScript.parse(script);
      // console.log(script);
      // console.log(ss.toObject());
      assert(ss.toSakuraScript() === script);
      assert(ss.tokens.length < script.length);
    }
  });
  it("will restore sakura script object", () => {
    for (const script of scripts) {
      const ss = SakuraScript.parse(script);
      const obj = ss.toObject();
      const ss2 = SakuraScript.fromObject(obj);
      assert(ss.toSakuraScript() === ss2.toSakuraScript());
    }
  });
});
