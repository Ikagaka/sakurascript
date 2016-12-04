const splitargs = (str: string) =>
  str
    .replace(/"((?:\\\\|\\"|[^"])*)"/g, (_, quoted) => quoted.replace(/,/g, "\0"))
    .split(/\s*\,\s*/)
    .map((arg) => arg.replace(/\0/g, ",").replace(/\\(.)/, "$1"));

const joinargs = (args: string[]) =>
  args
    .map((arg) => arg.replace(/\\/, "\\\\").replace(/\]/, "\\]"))
    .map((arg) => /[,"]/.test(arg) ? '"' + arg.replace(/"/, '\\"') + '"' : arg)
    .join(",");

const getClassName = (obj: any) => // for IE or some
  obj.constructor.name || (<RegExpMatchArray> obj.constructor.toString().slice(9).match(/^[^\s(]+/))[0];

/** Sakura Script Parser/Builder */
export class SakuraScript {
  /** make instance from SakuraScript object
   * @param json [object] SakuraScript object
   * @return [SakuraScript] SakuraScript
   */
  static fromObject(json: Array<{[name: string]: any}>) {
    const tokens: SakuraScriptToken[] = [];
    for (const token of json) {
      tokens.push(SakuraScriptToken.fromObject(token));
    }
    return new SakuraScript(tokens);
  }

  /**
   * make instance from SakuraScript string
   * @param script [string] SakuraScript string
   * @return [SakuraScript] SakuraScript
   */
  static parse(script: string) {
    const tokens: SakuraScriptToken[] = [];
    while (script.length) {
      for (const tag of SakuraScript.tagMatchers) {
        if (tag.re.test(script)) {
          script = script.replace(tag.re, (substring: string, ...args: string[]) => {
            const groups = args.slice(0, -2);
            tokens.push(tag.match([substring].concat(groups)));
            return ""; // delete matched
          });
          break;
        }
      }
    }
    return new SakuraScript(tokens);
  }

  /**
   * constructor
   * @param tokens [Array<SakuraScriptToken>] tokens
   */
  constructor(public tokens: SakuraScriptToken[] = []) {}

  /**
   * make SakuraScript object
   * @return [object] SakuraScript object
   */
  toObject() {
    return this.tokens.map((token) => token.toObject());
  }

  /**
   * make SakuraScript string
   * @return [string] SakuraScript string
   */
  toSakuraScript() {
    return this.tokens.map((token) => token.toSakuraScript()).join("");
  }
}

export abstract class SakuraScriptToken {
  /*
   * make instance from SakuraScript object
   * @param json [object] SakuraScript object
   * @return [SakuraScript] SakuraScript
   */
  static fromObject(json: {[name: string]: any}) {
    const tokenClass = json["namespace"] == null ?
      (<any> SakuraScriptToken)[json["class"]] :
      (<any> SakuraScriptToken)[json["namespace"]][json["class"]];
    const instance = <SakuraScriptToken> new tokenClass();
    for (const key of Object.keys(json)) {
      if (key !== "class") (<any> instance)[key] = json[key];
    }
    return instance;
  }

  /** namespace of the token class */
  readonly namespace?: string;

  /**
   * make SakuraScript object
   * @return [object] SakuraScript object
   */
  toObject() {
    const className = getClassName(this);
    const json: {[name: string]: any} = {class: className};
    for (const key of Object.keys(this)) {
      json[key] = (<any> this)[key];
    }
    return json;
  }

  /**
   * make SakuraScript string
   * @return [string] SakuraScript string
   */
  abstract toSakuraScript(): string;
}

export namespace SakuraScriptToken {
  /** \0 \h \1 \u \p0 \p[0] */
  export class Scope extends SakuraScriptToken {
    constructor(public scope: number, public view: "h" | "u" | "0" | "1" | "bracket" | "nobracket") { super(); }
    toSakuraScript() {
      switch (this.view) {
        case "bracket":
          return `\\p[${this.scope}]`;
        case "nobracket":
          return `\\p${this.scope}`;
        default:
          return `\\${this.view}`;
      }
    }
  }

  /** \s0 \s[0] */
  export class Surface extends SakuraScriptToken {
    constructor(public surface: number, public bracket: boolean) { super(); }
    toSakuraScript() {
      return this.bracket ? `\\s[${this.surface}]` : `\\s${this.surface}`;
    }
  }
  /** \s[smile] */
  export class SurfaceAlias extends SakuraScriptToken {
    constructor(public surfaceAlias: string) { super(); }
    toSakuraScript() { return `\\s[${joinargs([this.surfaceAlias])}]`; }
  }

  /** \b0 \b[0] */
  export class Balloon extends SakuraScriptToken {
    constructor(public balloon: number, public bracket: boolean) { super(); }
    toSakuraScript() {
      return this.bracket ? `\\b[${this.balloon}]` : `\\b${this.balloon}`;
    }
  }

  /** \i0 \i[0] */
  export class PlayAnimation extends SakuraScriptToken {
    constructor(public animation: number, public bracket: boolean) { super(); }
    toSakuraScript() {
      return this.bracket ? `\\i[${this.animation}]` : `\\i${this.animation}`;
    }
  }

  /** \i[0,wait] */
  export class PlayAnimationWait extends SakuraScriptToken {
    constructor(public animation: number) { super(); }
    toSakuraScript() { return `\\i[${this.animation},wait]`; }
  }

  /** \\w1 */
  export class SimpleWait extends SakuraScriptToken {
    constructor(public period: number) { super(); }
    toSakuraScript() { return `\\w${this.period}`; }
  }

  /** \\_w[1000] */
  export class PreciseWait extends SakuraScriptToken {
    constructor(public period: number) { super(); }
    toSakuraScript() { return `\\_w[${this.period}]`; }
  }

  /** \\__w[1000] */
  export class WaitFromBeginning extends SakuraScriptToken {
    constructor(public period: number) { super(); }
    toSakuraScript() { return `\\__w[${this.period}]`; }
  }

  /** \\__w[clear] */
  export class ResetBeginning extends SakuraScriptToken {
    toSakuraScript() { return `\\__w[clear]`; }
  }

  /** \\__w[animation,0] */
  export class WaitAnimationEnd extends SakuraScriptToken {
    constructor(public id: number) { super(); }
    toSakuraScript() { return `\\__w[animation,${this.id}]`; }
  }

  /** \\_q */
  export class ToggleQuick extends SakuraScriptToken {
    toSakuraScript() { return `\\_q`; }
  }

  /** \\_s \s[0,1] */
  export class ToggleSynchronize extends SakuraScriptToken {
    constructor(public scopes: number[] = []) { super(); }
    toSakuraScript() {
      return `\\_s` + (this.scopes.length ? `[${joinargs(this.scopes.map((scope) => scope.toString()))}]` : "");
    }
  }

  /** \\t */
  export class TimeCritical extends SakuraScriptToken {
    toSakuraScript() { return `\\t`; }
  }

  /** \\x \\x[noclear] */
  export class WaitClick extends SakuraScriptToken {
    constructor(public noclear = false) { super(); }
    toSakuraScript() { return `\\x`; }
  }

  /** \\* */
  export class NoChoiceTimeout extends SakuraScriptToken {
    toSakuraScript() { return `\\*`; }
  }

  /** \q[text,OnEvent,...] */
  export class EventChoice extends SakuraScriptToken {
    constructor(public text: string, public event: string, public references: string[]) { super(); }
    toSakuraScript() { return `\\q[${joinargs([this.text, this.event].concat(this.references))}]`; }
  }

  /** \q[text,id,...] */
  export class ReferencesChoice extends SakuraScriptToken {
    constructor(public text: string, public references: string[]) { super(); }
    toSakuraScript() { return `\\q[${joinargs([this.text].concat(this.references))}]`; }
  }

  /** \q[text,script:...] */
  export class ScriptChoice extends SakuraScriptToken {
    constructor(public text: string, public script: string) { super(); }
    toSakuraScript() { return `\\q[${joinargs([this.text, "script:" + this.script])}]`; }
  }

  /** \q[id][text] \q0[id][text] */
  export class OldReferenceChoice extends SakuraScriptToken {
    constructor(public text: string, public reference: string, public view: string) { super(); }
    toSakuraScript() { return `\\q${this.view || ""}[${joinargs([this.reference])}][${joinargs([this.text])}]`; }
  }

  /** \\__q[OnEvent,...] */
  export class BeginEventChoice extends SakuraScriptToken {
    constructor(public event: string, public references: string[]) { super(); }
    toSakuraScript() { return `\\__q[${joinargs([this.event].concat(this.references))}]`; }
  }

  /** \\__q[id,...] */
  export class BeginReferencesChoice extends SakuraScriptToken {
    constructor(public references: string[]) { super(); }
    toSakuraScript() { return `\\__q[${joinargs(this.references)}]`; }
  }

  /** \\__q[script:...] */
  export class BeginScriptChoice extends SakuraScriptToken {
    constructor(public script: string) { super(); }
    toSakuraScript() { return `\\__q[${joinargs(["script:" + this.script])}]`; }
  }

  /** \\__q */
  export class EndChoice extends SakuraScriptToken {
    toSakuraScript() { return `\\__q`; }
  }

  /** \\_a[OnEvent,...] */
  export class BeginEventAnchor extends SakuraScriptToken {
    constructor(public event: string, public references: string[]) { super(); }
    toSakuraScript() { return `\\_a[${joinargs([this.event].concat(this.references))}]`; }
  }

  /** \\_a[id,...] */
  export class BeginReferencesAnchor extends SakuraScriptToken {
    constructor(public references: string[]) { super(); }
    toSakuraScript() { return `\\_a[${joinargs(this.references)}]`; }
  }

  /** \\_a[script:...] */
  export class BeginScriptAnchor extends SakuraScriptToken {
    constructor(public script: string) { super(); }
    toSakuraScript() { return `\\_a[${joinargs(["script:" + this.script])}]`; }
  }

  /** \\_a */
  export class EndAnchor extends SakuraScriptToken {
    toSakuraScript() { return `\\_a`; }
  }

  /** \n */
  export class LineBreak extends SakuraScriptToken {
    toSakuraScript() { return `\\n`; }
  }

  /** \n[half] */
  export class HalfLineBreak extends SakuraScriptToken {
    toSakuraScript() { return `\\n[half]`; }
  }

  /** \n[100] */
  export class PercentLineBreak extends SakuraScriptToken {
    constructor(public percent: number) { super(); }
    toSakuraScript() { return `\\n[${this.percent}]`; }
  }

  /** \\_n */
  export class ToggleNoAutoLineBreak extends SakuraScriptToken {
    toSakuraScript() { return `\\_n`; }
  }

  /** \\_l[0,0] */
  export class Location extends SakuraScriptToken {
    constructor(public x: string, public y: string) { super(); }
    toSakuraScript() { return `\\_l[${[this.x, this.y].join(",")}]`; }
  }

  export abstract class ImageBase extends SakuraScriptToken {
    options: string[];

    get opaque() {
      return this.options.includes("opaque") || this.options.includes("--option=opaque");
    }

    get useSelfAlpha() {
      return this.options.includes("--option=use_self_alpha");
    }

    clipping() {
      for (const option of this.options) {
        const result = option.match(/--clipping=(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
        if (result) {
          return {
            left: Number(result[1]),
            top: Number(result[2]),
            right: Number(result[3]),
            bottom: Number(result[4]),
          };
        }
      }
      return;
    }
  }

  /** \\_b[path,0,0,...] */
  export class Image extends ImageBase {
    constructor(public path: string, public x: number, public y: number, public options: string[]) { super(); }

    toSakuraScript() { return `\\_b[${[this.path, this.x, this.y].concat(this.options).join(",")}]`; }

    get fixed() {
      return this.options.includes("--option=fixed");
    }

    get background() {
      return this.options.includes("--option=background");
    }

    get foreground() {
      return this.options.includes("--option=foreground");
    }
  }

  /** \\_b[path,inline,...] */
  export class InlineImage extends ImageBase {
    constructor(public path: string, public options: string[]) { super(); }
    toSakuraScript() { return `\\_b[${[this.path, "inline"].concat(this.options).join(",")}]`; }
  }

  /** \f[...] */
  export namespace Font {
    export abstract class FontBase extends SakuraScriptToken {
      readonly namespace = "Font";
    }

    /** \f[name,...] */
    export class Name extends FontBase {
      constructor(public names: string[]) { super(); }
      toSakuraScript() { return `\\f[name,${joinargs(this.names)}]`; }
    }

    /** \f[height,...] */
    export class Height extends FontBase {
      constructor(public height: string) { super(); }
      toSakuraScript() { return `\\f[height,${joinargs([this.height])}]`; }
    }

    export class ColorBase extends FontBase {
      constructor(public color: string[]) { super(); }

      colorAsCss() {
        if (this.color.length === 1) {
          return this.color[0];
        } else {
          return `rgb(${this.color.join(",")})`;
        }
      }

      toSakuraScript() { return `\\f[${getClassName(this).toLowerCase()},${joinargs(this.color)}]`; }
    }

    export type Style = "square" | "underline" | "square+underline" | "none" | "default";

    export class StyleBase extends FontBase {
      constructor(public style: Style) { super(); }
      toSakuraScript() { return `\\f[${getClassName(this).toLowerCase()},${joinargs([this.style])}]`; }
    }

    export class MethodBase extends FontBase {
      constructor(public method: string) { super(); }
      toSakuraScript() { return `\\f[${getClassName(this).toLowerCase()},${joinargs([this.method])}]`; }
    }

    export type FlagParameterFlag = boolean | 1 | 0 | "true" | "false" | "1" | "0" | "default";

    export class FlagParameter extends FontBase {
      constructor(public use: FlagParameterFlag) { super(); }

      get effective() { return Number(this.use) === 1 || this.use === "true"; }

      get default() { return this.use === "default"; }

      toSakuraScript() { return `\\f[${getClassName(this).toLowerCase()},${joinargs([this.use.toString()])}]`; }
    }

    /** \f[color,...] */
    export class Color extends ColorBase { }

    /** \f[shadowcolor,...] */
    export class ShadowColor extends ColorBase { }

    /** \f[outline,...] */
    export class Outline extends FlagParameter { }

    /** \f[anchor.font.color,...] */
    export class AnchorFontColorOld extends ColorBase {
      toSakuraScript() { return `\\f[anchor.font.color,${joinargs(this.color)}]`; }
    }

    /** \f[bold,...] */
    export class Bold extends FlagParameter { }

    /** \f[italic,...] */
    export class Italic extends FlagParameter { }

    /** \f[strike,...] */
    export class Strike extends FlagParameter { }

    /** \f[underline,...] */
    export class Underline extends FlagParameter { }

    /** \f[sub,...] */
    export class Sub extends FlagParameter { }

    /** \f[sup,...] */
    export class Sup extends FlagParameter { }

    /** \f[default] */
    export class Default extends FontBase {
      toSakuraScript() { return `\\f[default]`; }
    }

    /** \f[cursorstyle,...] */
    export class CursorStyle extends StyleBase { }

    /** \f[cursorcolor,...] */
    export class CursorColor extends ColorBase { }

    /** \f[cursorbrushcolor,...] */
    export class CursorBrushColor extends CursorColor { }

    /** \f[cursorpencolor,...] */
    export class CursorPenColor extends ColorBase { }

    /** \f[cursorfontcolor,...] */
    export class CursorFontColor extends ColorBase { }

    /** \f[cursormethod,...] */
    export class CursorMethod extends MethodBase { }

    /** \f[cursornotselectstyle,...] */
    export class CursorNotSelectStyle extends StyleBase { }

    /** \f[cursornotselectcolor,...] */
    export class CursorNotSelectColor extends ColorBase { }

    /** \f[cursornotselectbrushcolor,...] */
    export class CursorNotSelectBrushColor extends CursorNotSelectColor { }

    /** \f[cursornotselectpencolor,...] */
    export class CursorNotSelectPenColor extends ColorBase { }

    /** \f[cursornotselectfontcolor,...] */
    export class CursorNotSelectFontColor extends ColorBase { }

    /** \f[cursornotselectmethod,...] */
    export class CursorNotSelectMethod extends MethodBase { }

    /** \f[anchorstyle,...] */
    export class AnchorStyle extends StyleBase { }

    /** \f[anchorcolor,...] */
    export class AnchorColor extends ColorBase { }

    /** \f[anchorbrushcolor,...] */
    export class AnchorBrushColor extends AnchorColor { }

    /** \f[anchorpencolor,...] */
    export class AnchorPenColor extends ColorBase { }

    /** \f[anchorfontcolor,...] */
    export class AnchorFontColor extends ColorBase { }

    /** \f[anchormethod,...] */
    export class AnchorMethod extends MethodBase { }

    /** \f[anchornotselectstyle,...] */
    export class AnchorNotSelectStyle extends StyleBase { }

    /** \f[anchornotselectcolor,...] */
    export class AnchorNotSelectColor extends ColorBase { }

    /** \f[anchornotselectbrushcolor,...] */
    export class AnchorNotSelectBrushColor extends AnchorNotSelectColor { }

    /** \f[anchornotselectpencolor,...] */
    export class AnchorNotSelectPenColor extends ColorBase { }

    /** \f[anchornotselectfontcolor,...] */
    export class AnchorNotSelectFontColor extends ColorBase { }

    /** \f[anchornotselectmethod,...] */
    export class AnchorNotSelectMethod extends MethodBase { }

    /** \f[anchorvisitedstyle,...] */
    export class AnchorVisitedStyle extends StyleBase { }

    /** \f[anchorvisitedcolor,...] */
    export class AnchorVisitedColor extends ColorBase { }

    /** \f[anchorvisitedbrushcolor,...] */
    export class AnchorVisitedBrushColor extends AnchorVisitedColor { }

    /** \f[anchorvisitedpencolor,...] */
    export class AnchorVisitedPenColor extends ColorBase { }

    /** \f[anchorvisitedfontcolor,...] */
    export class AnchorVisitedFontColor extends ColorBase { }

    /** \f[anchorvisitedmethod,...] */
    export class AnchorVisitedMethod extends MethodBase { }
  }

  /** \\4 */
  export class BeFar extends SakuraScriptToken {
    toSakuraScript() { return `\\4`; }
  }

  /** \\5 */
  export class BeNear extends SakuraScriptToken {
    toSakuraScript() { return `\\5`; }
  }

  /** \\c */
  export class Clear extends SakuraScriptToken {
    toSakuraScript() { return `\\c`; }
  }

  /** \\e */
  export class End extends SakuraScriptToken {
    toSakuraScript() { return `\\e`; }
  }

  /** \\z */
  export class OldChoiceEnd extends SakuraScriptToken {
    toSakuraScript() { return `\\z`; }
  }

  /** \\__c */
  export class OpenCommunicateBox extends SakuraScriptToken {
    toSakuraScript() { return `\\__c`; }
  }

  /** \\__t */
  export class OpenTeachBox extends SakuraScriptToken {
    toSakuraScript() { return `\\__t`; }
  }

  /** \\- */
  export class Halt extends SakuraScriptToken {
    toSakuraScript() { return `\\-`; }
  }

  /** \\![*] */
  export class Marker extends SakuraScriptToken {
    toSakuraScript() { return `\\![*]`; }
  }

  /** char like */
  export abstract class Char extends SakuraScriptToken {
    readonly char: string;
  }

  /** a char */
  export class SimpleChar extends Char {
    constructor(public rawChar: string) { super(); }

    get char() {
      return this.rawChar.replace(/</, "&lt;").replace(/>/, "&gt;").replace(/&/, "&amp;");
    }

    toSakuraScript() { return this.rawChar; }
  }

  /** \\\\ */
  export class EscapeChar extends Char {
    constructor() { super(); }

    get char() { return "\\"; }

    toSakuraScript() { return `\\\\`; }
  }

  /** \\_u[0x01] */
  export class UCSChar extends Char {
    constructor(public codePoint: number) { super(); }

    get char() { return `&#${this.codePoint};`; }

    toSakuraScript() { return `\\_u[0x${this.codePoint.toString(16)}]`; }
  }

  /** \\_m[0x01] */
  export class AsciiChar extends Char {
    constructor(public codePoint: number) { super(); }

    get char() { return `&#${this.codePoint};`; }

    toSakuraScript() { return `\\_m[0x${this.codePoint.toString(16)}]`; }
  }

  /** \\&[amp] */
  export class EntityChar extends Char {
    constructor(public entity: string) { super(); }

    get char() { return `&${this.entity};`; }

    toSakuraScript() { return `\\&[${this.entity}]`; }
  }

  /** \\![anim,...] */
  export class Animation extends SakuraScriptToken {
    constructor(public command: string, public id: number, public args: string[]) { super(); }
    toSakuraScript() { return `\\![anim,${joinargs([this.command, this.id.toString()].concat(this.args))}]`; }
  }

  /** \\![bind,...] */
  export class Bind extends SakuraScriptToken {
    constructor(public category: string, public parts: string, public dressUp: boolean | null) { super(); }
    toSakuraScript() {
      return `\\![bind,${joinargs(
        [this.category, this.parts].concat(this.dressUp != null ? [Number(this.dressUp).toString()] : [])
      )}]`;
    }
  }

  /** \\![lock,paint] */
  export class LockRepaint extends SakuraScriptToken {
    toSakuraScript() { return `\\![lock,repaint]`; }
  }

  /** \\![unlock,paint] */
  export class UnlockRepaint extends SakuraScriptToken {
    toSakuraScript() { return `\\![unlock,repaint]`; }
  }

  /** \\![move,...] */
  export class Move extends SakuraScriptToken {
    constructor(
      public x: number,
      public y: number,
      public time?: number,
      public base?: string,
      public baseOffset?: string,
      public moveOffset?: string,
      public optionView = true,
    ) { super(); }

    toSakuraScript() {
      if (this.optionView) {
        return `\\![move,${joinargs(this._sakuraScriptOptionViewArgs())}]`;
      } else {
        return `\\![move,${joinargs(this._sakuraScriptArrayViewArgs())}]`;
      }
    }

    protected _sakuraScriptOptionViewArgs() {
      const args = [
        `--x=${this.x}`,
        `--y=${this.y}`,
      ];
      if (this.time) args.push(`--time=${this.time}`);
      if (this.base) args.push(`--base=${this.base}`);
      if (this.baseOffset) args.push(`--base-offset=${this.baseOffset}`);
      if (this.moveOffset) args.push(`--move-offset=${this.moveOffset}`);
      return args;
    }

    protected _sakuraScriptArrayViewArgs() {
      const args = [
        this.x,
        this.y,
        this.time,
        this.base,
        this.baseOffset,
        this.moveOffset,
      ].map((arg) => arg == null ? "" : arg.toString());
      return args;
    }
  }

  /** \\![moveasync,...] */
  export class MoveAsync extends Move {
    toSakuraScript() {
      if (this.optionView) {
        return `\\![moveasync,${joinargs(this._sakuraScriptOptionViewArgs())}]`;
      } else {
        return `\\![moveasync,${joinargs(this._sakuraScriptArrayViewArgs())}]`;
      }
    }
  }

  /** \\![moveasync,cancel] */
  export class MoveAsyncCancel extends SakuraScriptToken {
    toSakuraScript() { return `\\![moveasync,cancel]`; }
  }

  /** \\![raise,...] */
  export class Raise extends SakuraScriptToken {
    constructor(public event: string, public references: string[]) { super(); }
    toSakuraScript() { return `\\![raise,${joinargs([this.event].concat(this.references))}]`; }
  }

  /** \\![timerraise,...] */
  export class TimerRaise extends SakuraScriptToken {
    constructor(
      public period: number,
      public repeatCount = 0,
      public event = "",
      public references: string[]
    ) { super(); }
    toSakuraScript() {
      return `\\![timerraise,${joinargs(
        [this.period.toString(), this.repeatCount.toString(), this.event].concat(this.references)
      )}]`; }
  }

  /** \\![notify,...] */
  export class Notify extends SakuraScriptToken {
    constructor(public event: string, public references: string[]) { super(); }
    toSakuraScript() { return `\\![notify,${joinargs([this.event].concat(this.references))}]`; }
  }

  /** \\![set,...] */
  export class Set extends SakuraScriptToken {
    constructor(public id: string, public args: string[]) { super(); }
    toSakuraScript() { return `\\![set,${joinargs([this.id].concat(this.args))}]`; }
  }

  /** \\![open,...] */
  export class Open extends SakuraScriptToken {
    constructor(public command: string, public args: string[]) { super(); }
    toSakuraScript() { return `\\![open,${joinargs([this.command].concat(this.args))}]`; }
  }

  /** \\![close,...] */
  export class Close extends SakuraScriptToken {
    constructor(public command: string, public args: string[]) { super(); }
    toSakuraScript() { return `\\![close,${joinargs([this.command].concat(this.args))}]`; }
  }

  /** not impremented tags */
  export class NotImplemented extends SakuraScriptToken {
    constructor(public str: string) { super(); }
    toSakuraScript() { return this.str; }
  }
}

const fontClassHash: {[fontClassName: string]: new(...args: any[]) => SakuraScriptToken} = {};
for (const fontClassName of Object.keys(SakuraScriptToken.Font)) {
  fontClassHash[fontClassName.toLowerCase()] = (<any> SakuraScriptToken.Font)[fontClassName];
}

export namespace SakuraScript {

  export type TagMatcher = {re: RegExp, match: (group: string[]) => SakuraScriptToken};

  export const tagMatchers: TagMatcher[] = [
    {re: /^\\([h0])/, match: (group) => new SakuraScriptToken.Scope(0, <"h" | "0"> group[1])},
    {re: /^\\([u1])/, match: (group) => new SakuraScriptToken.Scope(1, <"u" | "1"> group[1])},
    {re: /^\\p\[(\d+)\]/, match: (group) => new SakuraScriptToken.Scope(Number(group[1]), "bracket")},
    {re: /^\\p(\d)/, match: (group) => new SakuraScriptToken.Scope(Number(group[1]), "nobracket")},
    {re: /^\\s(\d)/, match: (group) => new SakuraScriptToken.Surface(Number(group[1]), false)},
    {re: /^\\s\[([^\]]+)\]/, match: (group) =>
      isNaN(<any> group[1]) ?
      new SakuraScriptToken.SurfaceAlias(group[1]) :
      new SakuraScriptToken.Surface(Number(group[1]), true)
    },
    {re: /^\\b(\d)/, match: (group) => new SakuraScriptToken.Balloon(Number(group[1]), false)},
    {re: /^\\b\[([^\]]+)\]/, match: (group) => new SakuraScriptToken.Balloon(Number(group[1]), true)},
    {re: /^\\i(\d)/, match: (group) => new SakuraScriptToken.PlayAnimation(Number(group[1]), false)},
    {re: /^\\i\[(\d+)\]/, match: (group) => new SakuraScriptToken.PlayAnimation(Number(group[1]), true)},
    {re: /^\\i\[(\d+),wait\]/, match: (group) => new SakuraScriptToken.PlayAnimationWait(Number(group[1]))},
    {re: /^\\w(\d)/, match: (group) => new SakuraScriptToken.SimpleWait(Number(group[1]))},
    {re: /^\\_w\[(\d+)\]/, match: (group) => new SakuraScriptToken.PreciseWait(Number(group[1]))},
    {re: /^\\__w\[animation,(\d+)\]/, match: (group) => new SakuraScriptToken.WaitAnimationEnd(Number(group[1]))},
    {re: /^\\__w\[clear\]/, match: () => new SakuraScriptToken.ResetBeginning()},
    {re: /^\\__w\[(\d+)\]/, match: (group) => new SakuraScriptToken.WaitFromBeginning(Number(group[1]))},
    {re: /^\\_q/, match: () => new SakuraScriptToken.ToggleQuick()},
    {re: /^\\_s\[([^\]]+)\]/, match: (group) =>
      new SakuraScriptToken.ToggleSynchronize(splitargs(group[1]).map((n) => Number(n)))
    },
    {re: /^\\_s/, match: () => new SakuraScriptToken.ToggleSynchronize()},
    {re: /^\\t/, match: () => new SakuraScriptToken.TimeCritical()},
    {re: /^\\x(\[noclear\])?/, match: (group) => new SakuraScriptToken.WaitClick(Boolean(group[1])) },
    {re: /^\\\*/, match: () => new SakuraScriptToken.NoChoiceTimeout()},
    {re: /^\\q\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group) => {
      const args = splitargs(group[1]);
      if (/^On/.test(args[1])) {
        return new SakuraScriptToken.EventChoice(args[0], args[1], args.slice(2));
      } else if (/^script:/.test(args[1])) {
        return new SakuraScriptToken.ScriptChoice(args[0], args[1].replace(/^script:/, ""));
      } else {
        return new SakuraScriptToken.ReferencesChoice(args[0], args.slice(1));
      }
    }},
    {re: /^\\__q\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group) => {
      const args = splitargs(group[1]);
      if (/^On/.test(args[0])) {
        return new SakuraScriptToken.BeginEventChoice(args[0], args.slice(1));
      } else if (/^script:/.test(args[0])) {
        return new SakuraScriptToken.BeginScriptChoice(args[0].replace(/^script:/, ""));
      } else {
        return new SakuraScriptToken.BeginReferencesChoice(args);
      }
    }},
    {re: /^\\__q/, match: () => new SakuraScriptToken.EndChoice()},
    {re: /^\\q(\d*)\[((?:\\\\|\\\]|[^\]])+)\]\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group) =>
      new SakuraScriptToken.OldReferenceChoice(group[3], group[2], group[1])
    },
    {re: /^\\_a\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group) => {
      const args = splitargs(group[1]);
      if (/^On/.test(args[0])) {
        return new SakuraScriptToken.BeginEventAnchor(args[0], args.slice(1));
      } else if (/^script:/.test(args[0])) {
        return new SakuraScriptToken.BeginScriptAnchor(args[0].replace(/^script:/, ""));
      } else {
        return new SakuraScriptToken.BeginReferencesAnchor(args);
      }
    }},
    {re: /^\\_a/, match: () => new SakuraScriptToken.EndAnchor()},
    {re: /^\\n\[half\]/, match: () => new SakuraScriptToken.HalfLineBreak()},
    {re: /^\\n\[(\d+)\]/, match: (group) => new SakuraScriptToken.PercentLineBreak(Number(group[1]))},
    {re: /^\\n/, match: () => new SakuraScriptToken.LineBreak()},
    {re: /^\\_n/, match: () => new SakuraScriptToken.ToggleNoAutoLineBreak()},
    {re: /^\\_l\[([^\]]+)\]/, match: (group) => {
      const [x, y] = splitargs(group[1]);
      return new SakuraScriptToken.Location(x, y);
    }},
    {re: /^\\_b\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group) => {
      const args = splitargs(group[1]);
      if (args[1] === "inline") {
        return new SakuraScriptToken.InlineImage(args[0], args.slice(2));
      } else {
        return new SakuraScriptToken.Image(args[0], Number(args[1]), Number(args[2]), args.slice(3));
      }
    }},
    {re: /^\\f\[([^\]]+)\]/, match: (group) => {
      const [name, ...args] = splitargs(group[1]);
      switch (name) {
        case "name": return new SakuraScriptToken.Font.Name(args);
        case "height": return new SakuraScriptToken.Font.Height(args[0]);
        case "outline":
        case "bold":
        case "italic":
        case "strike":
        case "underline":
        case "sub":
        case "sup":
          return new fontClassHash[name](args[0]);
        case "default": return new SakuraScriptToken.Font.Default();
        case "anchor.font.color": return new SakuraScriptToken.Font.AnchorFontColorOld(args);
        default:
          if (/color$/.test(name)) {
            return new fontClassHash[name](args);
          } else { // style, method
            return new fontClassHash[name](args[0]);
          }
      }
    }},
    {re: /^\\4/, match: () => new SakuraScriptToken.BeFar()},
    {re: /^\\5/, match: () => new SakuraScriptToken.BeNear()},
    {re: /^\\c/, match: () => new SakuraScriptToken.Clear()},
    {re: /^\\e/, match: () => new SakuraScriptToken.End()},
    {re: /^\\z/, match: () => new SakuraScriptToken.OldChoiceEnd()},
    {re: /^\\-/, match: () => new SakuraScriptToken.Halt()},
    {re: /^\\\\/, match: () => new SakuraScriptToken.EscapeChar()},
    {re: /^\\!\[anim,((?:\\\\|\\\]|[^\]])+)\]/, match: (group) => {
      const [command, id, ...args] = splitargs(group[1]);
      return new SakuraScriptToken.Animation(command, Number(id), args);
    }},
    {re: /^\\!\[bind,((?:\\\\|\\\]|[^\]])+)\]/, match: (group) => {
      const [category, parts, dressUp] = splitargs(group[1]);
      return new SakuraScriptToken.Bind(category, parts, dressUp != null ? Number(dressUp) === 1 : null);
    }},
    {re: /^\\!\[moveasync,cancel\]/, match: () => new SakuraScriptToken.MoveAsyncCancel()},
    {re: /^\\!\[move(async)?,((?:\\\\|\\\]|[^\]])+)\]/, match: (group) => {
      const useClass = group[1] ? SakuraScriptToken.MoveAsync : SakuraScriptToken.Move;
      const args = splitargs(group[2]);
      if (/^--/.test(args[0])) { // new
        const argsHash: {[name: string]: string | undefined} = {};
        for (const arg of args) {
          const result = arg.match("\s*--([^=]+)=(.*?)\s*");
          if (result) {
            argsHash[result[1].toLowerCase()] = result[2];
          }
        }
        return new useClass(
          Number(argsHash["x"]),
          Number(argsHash["y"]),
          argsHash["time"] == null ? undefined : Number(argsHash["time"]),
          argsHash["base"],
          argsHash["base-offset"],
          argsHash["move-offset"],
          true,
        );
      } else { // old
        const [x, y, time, base, baseOffset, moveOffset] = args;
        return new useClass(
          Number(x),
          Number(y),
          time == null ? undefined : Number(time),
          base,
          baseOffset,
          moveOffset,
          false,
        );
      }
    }},
    {re: /^\\!\[lock,repaint\]/, match: () => new SakuraScriptToken.LockRepaint()},
    {re: /^\\!\[unlock,repaint\]/, match: () => new SakuraScriptToken.UnlockRepaint()},
    {re: /^\\!\[set,((?:\\\\|\\\]|[^\]])+)\]/, match: (group) => {
      const [id, ...args] = splitargs(group[1]);
      return new SakuraScriptToken.Set(id,  args);
    }},
    {re: /^\\!\[open,((?:\\\\|\\\]|[^\]])+)\]/, match: (group) => {
      const [command, ...args] = splitargs(group[1]);
      return new SakuraScriptToken.Open(command, args);
    }},
    {re: /^\\!\[close,((?:\\\\|\\\]|[^\]])+)\]/, match: (group) => {
      const [command, ...args] = splitargs(group[1]);
      return new SakuraScriptToken.Close(command, args);
    }},
    {re: /^\\__c/, match: () => new SakuraScriptToken.OpenCommunicateBox()},
    {re: /^\\__t/, match: () => new SakuraScriptToken.OpenTeachBox()},
    {re: /^\\!\[\s*raise\s*,\s*((?:\\\\|\\\]|[^\]])+)\]/, match: (group) => {
      const [event, ...references] = splitargs(group[1]);
      return new SakuraScriptToken.Raise(event, references);
    }},
    {re: /^\\!\[\s*timerraise\s*,\s*((?:\\\\|\\\]|[^\]])+)\]/, match: (group) => {
      const [period, repeatCount, event, ...args] = splitargs(group[1]);
      return new SakuraScriptToken.TimerRaise(Number(period), Number(repeatCount), event, args);
    }},
    {re: /^\\!\[\s*notify\s*,\s*((?:\\\\|\\\]|[^\]])+)\]/, match: (group) => {
      const [event, ...references] = splitargs(group[1]);
      return new SakuraScriptToken.Notify(event, references);
    }},
    {re: /^\\!\[\*\]/, match: () => new SakuraScriptToken.Marker()},
    {re: /^\\_u\[([A-Fa-fXx0-9]+)\]/, match: (group) => new SakuraScriptToken.UCSChar(Number(group[1]))},
    {re: /^\\_m\[([A-Fa-fXx0-9]+)\]/, match: (group) => new SakuraScriptToken.AsciiChar(Number(group[1]))},
    {re: /^\\&\[([A-Za-z0-9]+)\]/, match: (group) => new SakuraScriptToken.EntityChar(group[1])},
    {re: /^\\[C67+v8]/, match: (group) => new SakuraScriptToken.NotImplemented(group[0])}, // not implemented quick
    {re: /^\\_[+V]/, match: (group) => new SakuraScriptToken.NotImplemented(group[0])}, // not implemented quick
    {re: /^\\[8j]\[.*?\]/, match: (group) => new SakuraScriptToken.NotImplemented(group[0])}, // not implemented quick
    {re: /^\\_[!?v]\[.*?\]/, match: (group) => new SakuraScriptToken.NotImplemented(group[0])}, // not implemented quick
    {re: /^\\!\[.*?\]/, match: (group) => new SakuraScriptToken.NotImplemented(group[0])}, // not implemented quick
    {re: /^./, match: (group) => new SakuraScriptToken.SimpleChar(group[0])},
  ];
}
