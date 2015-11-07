splitargs = (str) ->
  str
    .replace /"((?:\\\\|\\"|[^"])*)"/g, (all, quoted) -> quoted.replace(/,/g,'\0')
    .split /\s*\,\s*/
    .map (arg) -> arg.replace(/\0/g, ',').replace(/\\(.)/, '$1')
joinargs = (args) ->
  args
    .map (arg) -> arg.replace(/\\/, '\\\\').replace(/\]/, '\\]')
    .map (arg) -> if /[,"]/.test(arg) then '"' + arg.replace(/"/, '\\"') + '"' else arg
    .join ','

# Sakura Script Parser/Builder
class SakuraScript
  # make instance from SakuraScript object
  # @param json [object] SakuraScript object
  # @return [SakuraScript] SakuraScript
  @fromObject: (json) ->
    tokens = []
    for token in json
      tokens.push SakuraScriptToken.fromObject token
    new SakuraScript tokens

  # make instance from SakuraScript string
  # @param script [string] SakuraScript string
  # @return [SakuraScript] SakuraScript
  @parse: (script) ->
    tokens = []
    while script.length
      tag = null
      for tag in SakuraScript.tags
        if tag.re.test(script)
          break
      script = script.replace tag.re, (group..., offset, all) =>
        tokens.push tag.match.call @, group
        return '' # delete matched
    new SakuraScript tokens

  # constructor
  # @param tokens [Array<SakuraScriptToken>] tokens
  constructor: (@tokens = []) ->

  # make SakuraScript object
  # @return [object] SakuraScript object
  toObject: ->
    for token in @tokens
      token.toObject()

  # make SakuraScript string
  # @return [string] SakuraScript string
  toSakuraScript: ->
    (token.toSakuraScript() for token in @tokens).join ''

class SakuraScriptToken
  # make instance from SakuraScript object
  # @param json [object] SakuraScript object
  # @return [SakuraScript] SakuraScript
  @fromObject: (json) ->
    instance = new SakuraScriptToken[json.class]()
    for key in Object.keys(json) when key != "class"
      instance[key] = json[key]
    instance

  # constructor
  constructor: () ->

  # make SakuraScript object
  # @return [object] SakuraScript object
  toObject: ->
    class_name = @constructor.toString().slice(9).match(/^[^\s(]+/)[0]
    json = {class: class_name}
    for key in Object.keys(@)
      json[key] = @[key]
    json

  # make SakuraScript string
  # @return [string] SakuraScript string
  toSakuraScript: -> throw new Error "not implemented"

# \0 \h \1 \u \p0 \p[0]
class SakuraScriptToken.Scope extends SakuraScriptToken
  constructor: (@scope, @view) ->
  toSakuraScript: ->
    switch @view
      when "bracket"
        "\\p[#{@scope}]"
      when "nobracket"
        "\\p#{@scope}"
      else
        "\\#{@view}"
# \s0 \s[0]
class SakuraScriptToken.Surface extends SakuraScriptToken
  constructor: (@surface, @view) ->
  toSakuraScript: ->
    switch @view
      when "bracket"
        "\\s[#{@surface}]"
      when "nobracket"
        "\\s#{@surface}"
# \s[smile]
class SakuraScriptToken.SurfaceAlias extends SakuraScriptToken
  constructor: (@surface_alias) ->
  toSakuraScript: -> "\\s[#{joinargs [@surface_alias]}]"
# \b0 \b[0]
class SakuraScriptToken.Balloon extends SakuraScriptToken
  constructor: (@balloon, @view) ->
  toSakuraScript: ->
    switch @view
      when "bracket"
        "\\b[#{@balloon}]"
      when "nobracket"
        "\\b#{@balloon}"
# \i0 \i[0]
class SakuraScriptToken.PlayAnimation extends SakuraScriptToken
  constructor: (@animation, @view) ->
  toSakuraScript: ->
    switch @view
      when "bracket"
        "\\i[#{@animation}]"
      when "nobracket"
        "\\i#{@animation}"
# \i[0,wait]
class SakuraScriptToken.PlayAnimationWait extends SakuraScriptToken
  constructor: (@animation) ->
  toSakuraScript: -> "\\i[#{@animation},wait]"
# \\w1
class SakuraScriptToken.SimpleWait extends SakuraScriptToken
  constructor: (@period) ->
  toSakuraScript: -> "\\w#{@period}"
# \\_w[1000]
class SakuraScriptToken.PreciseWait extends SakuraScriptToken
  constructor: (@period) ->
  toSakuraScript: -> "\\_w[#{@period}]"
# \\__w[1000]
class SakuraScriptToken.WaitFromBeginning extends SakuraScriptToken
  constructor: (@period) ->
  toSakuraScript: -> "\\__w[#{@period}]"
# \\__w[clear]
class SakuraScriptToken.ResetBeginning extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\__w[clear]"
# \\__w[animation,0]
class SakuraScriptToken.WaitAnimationEnd extends SakuraScriptToken
  constructor: (@id) ->
  toSakuraScript: -> "\\__w[animation,#{@id}]"
# \\_q
class SakuraScriptToken.ToggleQuick extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\_q"
# \\_s \s[0,1]
class SakuraScriptToken.ToggleSynchronize extends SakuraScriptToken
  constructor: (@scopes = []) ->
  toSakuraScript: -> "\\_s" + if @scopes.length then "[#{joinargs @scopes}]" else ""
# \\t
class SakuraScriptToken.TimeCritical extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\t"
# \\x
class SakuraScriptToken.WaitClick extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\x"
# \\*
class SakuraScriptToken.NoChoiceTimeout extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\*"
# \q[text,OnEvent,...]
class SakuraScriptToken.EventChoice extends SakuraScriptToken
  constructor: (@text, @event, @references) ->
  toSakuraScript: -> "\\q[#{joinargs [@text, @event].concat(@references)}]"
# \q[text,id,...]
class SakuraScriptToken.ReferencesChoice extends SakuraScriptToken
  constructor: (@text, @references) ->
  toSakuraScript: -> "\\q[#{joinargs [@text].concat(@references)}]"
# \q[text,script:...]
class SakuraScriptToken.ScriptChoice extends SakuraScriptToken
  constructor: (@text, @script) ->
  toSakuraScript: -> "\\q[#{joinargs [@text, "script:" + @script]}]"
# \q[id][text] \q0[id][text]
class SakuraScriptToken.OldReferenceChoice extends SakuraScriptToken
  constructor: (@text, @reference, @view) ->
  toSakuraScript: -> "\\q#{@view || ''}[#{joinargs [@reference]}][#{joinargs [@text]}]"
# \\__q[OnEvent,...]
class SakuraScriptToken.BeginEventChoice extends SakuraScriptToken
  constructor: (@event, @references) ->
  toSakuraScript: -> "\\__q[#{joinargs [@event].concat(@references)}]"
# \\__q[id,...]
class SakuraScriptToken.BeginReferencesChoice extends SakuraScriptToken
  constructor: (@references) ->
  toSakuraScript: -> "\\__q[#{joinargs @references}]"
# \\__q[script:...]
class SakuraScriptToken.BeginScriptChoice extends SakuraScriptToken
  constructor: (@script) ->
  toSakuraScript: -> "\\__q[#{joinargs ["script:" + @script]}]"
# \\__q
class SakuraScriptToken.EndChoice extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\__q"
# \\_a[OnEvent,...]
class SakuraScriptToken.BeginEventAnchor extends SakuraScriptToken
  constructor: (@event, @references) ->
  toSakuraScript: -> "\\_a[#{joinargs [@event].concat(@references)}]"
# \\_a[id,...]
class SakuraScriptToken.BeginReferencesAnchor extends SakuraScriptToken
  constructor: (@references) ->
  toSakuraScript: -> "\\_a[#{joinargs @references}]"
# \\_a[script:...]
class SakuraScriptToken.BeginScriptAnchor extends SakuraScriptToken
  constructor: (@script) ->
  toSakuraScript: -> "\\_a[#{joinargs ["script:" + @script]}]"
# \\_a
class SakuraScriptToken.EndAnchor extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\_a"
# \n
class SakuraScriptToken.LineBreak extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\n"
# \n[half]
class SakuraScriptToken.HalfLineBreak extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\n[half]"
# \n[100]
class SakuraScriptToken.PercentLineBreak extends SakuraScriptToken
  constructor: (@percent) ->
  toSakuraScript: -> "\\n[#{@percent}]"
# \\_n
class SakuraScriptToken.ToggleNoAutoLineBreak extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\_n"
# \\_l[0,0]
class SakuraScriptToken.Location extends SakuraScriptToken
  constructor: (@x, @y) ->
  toSakuraScript: -> "\\_l[#{[@x, @y].join(',')}]"
# \\_b[path,0,0,...]
class SakuraScriptToken.Image extends SakuraScriptToken
  constructor: (@path, @x, @y, @args) ->
  toSakuraScript: -> "\\_b[#{[@path, @x, @y].concat(@args).join(',')}]"
# \\_b[path,inline,...]
class SakuraScriptToken.InlineImage extends SakuraScriptToken
  constructor: (@path, @x, @y, @args) ->
  toSakuraScript: -> "\\_b[#{[@path, 'inline'].concat(@args).join(',')}]"
# \f[...]
class SakuraScriptToken.Font extends SakuraScriptToken
  constructor: (@name, @args) ->
  toSakuraScript: -> "\\f[#{joinargs [@name].concat(@args)}]"
# \\4
class SakuraScriptToken.BeFar extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\4"
# \\5
class SakuraScriptToken.BeNear extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\5"
# \\c
class SakuraScriptToken.Clear extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\c"
# \\e
class SakuraScriptToken.End extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\e"
# \\z
class SakuraScriptToken.OldChoiceEnd extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\z"
# \\__c
class SakuraScriptToken.OpenCommunicateBox extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\__c"
# \\__t
class SakuraScriptToken.OpenTeachBox extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\__t"
# \\-
class SakuraScriptToken.Halt extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\-"
# \\![*]
class SakuraScriptToken.Marker extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\![*]"
# a char
class SakuraScriptToken.Char extends SakuraScriptToken
  constructor: (@char) ->
  toSakuraScript: -> @char
# \\\\
class SakuraScriptToken.EscapeChar extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\\\"
# \\_u[0x01]
class SakuraScriptToken.UCSChar extends SakuraScriptToken
  constructor: (@char) ->
  toSakuraScript: -> "\\_u[0x#{@char.toString(16)}]"
# \\_m[0x01]
class SakuraScriptToken.AsciiChar extends SakuraScriptToken
  constructor: (@char) ->
  toSakuraScript: -> "\\_m[0x#{@char.toString(16)}]"
# \\&[amp]
class SakuraScriptToken.EntityChar extends SakuraScriptToken
  constructor: (@char) ->
  toSakuraScript: -> "\\&[#{@char}]"
# \\![anim,...]
class SakuraScriptToken.Animation extends SakuraScriptToken
  constructor: (@command, @id, @args) ->
  toSakuraScript: -> "\\![anim,#{joinargs [@command, @id].concat(@args)}]"
# \\![bind,...]
class SakuraScriptToken.Bind extends SakuraScriptToken
  constructor: (@category, @parts, @dress_up) ->
  toSakuraScript: -> "\\![bind,#{joinargs [@category, @parts, @dress_up]}]"
# \\![lock,paint]
class SakuraScriptToken.LockRepaint extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\![lock,repaint]"
# \\![unlock,paint]
class SakuraScriptToken.UnlockRepaint extends SakuraScriptToken
  constructor: ->
  toSakuraScript: -> "\\![unlock,repaint]"
# \\![move,...]
class SakuraScriptToken.Move extends SakuraScriptToken
  constructor: (@x, @y, @duration, @origin_type, @source_origin, @target_origin) ->
  toSakuraScript: -> "\\![move,#{joinargs [@x, @y, @duration, @origin_type, @source_origin, @target_origin]}]"
# \\![moveasync,...]
class SakuraScriptToken.MoveAsync extends SakuraScriptToken.Move
  toSakuraScript: -> "\\![moveasync,#{joinargs [@x, @y, @duration, @origin_type, @source_origin, @target_origin]}]"
# \\![moveasync,cancel]
class SakuraScriptToken.MoveAsyncCancel extends SakuraScriptToken.Move
  constructor: ->
  toSakuraScript: -> "\\![moveasync,cancel]"
# \\![raise,...]
class SakuraScriptToken.Raise extends SakuraScriptToken
  constructor: (@event, @references) ->
  toSakuraScript: -> "\\![raise,#{joinargs [@event].concat(@references)}]"
# \\![set,...]
class SakuraScriptToken.Set extends SakuraScriptToken
  constructor: (@id, @args) ->
  toSakuraScript: -> "\\![set,#{joinargs [@id].concat(@args)}]"
# \\![open,...]
class SakuraScriptToken.Open extends SakuraScriptToken
  constructor: (@id, @args) ->
  toSakuraScript: -> "\\![open,#{joinargs [@id].concat(@args)}]"
# not impremented tags
class SakuraScriptToken.NotImplemented extends SakuraScriptToken
  constructor: (@str) ->
  toSakuraScript: -> @str

SakuraScript.tags = [
  {re: /^\\([h0])/, match: (group, state) -> new SakuraScriptToken.Scope 0, group[1]}
  {re: /^\\([u1])/, match: (group, state) -> new SakuraScriptToken.Scope 1, group[1]}
  {re: /^\\p\[(\d+)\]/, match: (group, state) -> new SakuraScriptToken.Scope Number(group[1]), "bracket"}
  {re: /^\\p(\d)/, match: (group, state) -> new SakuraScriptToken.Scope Number(group[1]), "nobracket"}
  {re: /^\\s(\d)/, match: (group, state) -> new SakuraScriptToken.Surface Number(group[1]), "nobracket"}
  {re: /^\\s\[([^\]]+)\]/, match: (group, state) -> if isNaN(group[1]) then new SakuraScriptToken.SurfaceAlias group[1] else new SakuraScriptToken.Surface Number(group[1]), "bracket"}
  {re: /^\\b(\d)/, match: (group, state) -> new SakuraScriptToken.Balloon Number(group[1]), "nobracket"}
  {re: /^\\b\[([^\]]+)\]/, match: (group, state) -> new SakuraScriptToken.Balloon Number(group[1]), "bracket"}
  {re: /^\\i(\d)/, match: (group, state) -> new SakuraScriptToken.PlayAnimation Number(group[1]), "nobracket"}
  {re: /^\\i\[(\d+)\]/, match: (group, state) -> new SakuraScriptToken.PlayAnimation Number(group[1]), "bracket"}
  {re: /^\\i\[(\d+),wait\]/, match: (group, state) -> new SakuraScriptToken.PlayAnimationWait Number(group[1])}
  {re: /^\\w(\d)/, match: (group, state) -> new SakuraScriptToken.SimpleWait Number group[1]}
  {re: /^\\_w\[(\d+)\]/, match: (group, state) -> new SakuraScriptToken.PreciseWait Number group[1]}
  {re: /^\\__w\[animation,(\d+)\]/, match: (group, state) -> new SakuraScriptToken.WaitAnimationEnd Number group[1]}
  {re: /^\\__w\[clear\]/, match: (group, state) -> new SakuraScriptToken.ResetBeginning()}
  {re: /^\\__w\[(\d+)\]/, match: (group, state) -> new SakuraScriptToken.WaitFromBeginning Number group[1]}
  {re: /^\\_q/, match: (group, state) -> new SakuraScriptToken.ToggleQuick()}
  {re: /^\\_s\[([^\]]+)\]/, match: (group, state) -> new SakuraScriptToken.ToggleSynchronize splitargs(group[1]).map (n) -> Number(n)}
  {re: /^\\_s/, match: (group, state) -> new SakuraScriptToken.ToggleSynchronize()}
  {re: /^\\t/, match: (group, state) -> new SakuraScriptToken.TimeCritical()}
  {re: /^\\x/, match: (group, state) -> new SakuraScriptToken.WaitClick() }
  {re: /^\\\*/, match: (group, state) -> new SakuraScriptToken.NoChoiceTimeout()}
  {re: /^\\q\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) ->
    args = splitargs(group[1])
    if /^On/.test args[1]
      new SakuraScriptToken.EventChoice args[0], args[1], args.slice(2)
    else if /^script:/.test args[1]
      new SakuraScriptToken.ScriptChoice args[0], args[1].replace(/^script:/, '')
    else
      new SakuraScriptToken.ReferencesChoice args[0], args.slice(1)
  }
  {re: /^\\__q\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) ->
    args = splitargs(group[1])
    if /^On/.test args[0]
      new SakuraScriptToken.BeginEventChoice args[0], args.slice(1)
    else if /^script:/.test args[0]
      new SakuraScriptToken.BeginScriptChoice args[0].replace(/^script:/, '')
    else
      new SakuraScriptToken.BeginReferencesChoice args
  }
  {re: /^\\__q/, match: (group, state) -> new SakuraScriptToken.EndChoice()}
  {re: /^\\q(\d*)\[((?:\\\\|\\\]|[^\]])+)\]\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) -> new SakuraScriptToken.OldReferenceChoice group[3], group[2], group[1]}
  {re: /^\\_a\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) ->
    args = splitargs(group[1])
    if /^On/.test args[0]
      new SakuraScriptToken.BeginEventAnchor args[0], args.slice(1)
    else if /^script:/.test args[0]
      new SakuraScriptToken.BeginScriptAnchor args[0].replace(/^script:/, '')
    else
      new SakuraScriptToken.BeginReferencesAnchor args
  }
  {re: /^\\_a/, match: (group, state) -> new SakuraScriptToken.EndAnchor()}
  {re: /^\\n\[half\]/, match: (group, state) -> new SakuraScriptToken.HalfLineBreak()}
  {re: /^\\n\[(\d+)\]/, match: (group, state) -> new SakuraScriptToken.PercentLineBreak Number(group[1])}
  {re: /^\\n/, match: (group, state) -> new SakuraScriptToken.LineBreak()}
  {re: /^\\_n/, match: (group, state) -> new SakuraScriptToken.ToggleNoAutoLineBreak()}
  {re: /^\\_l\[([^\]]+)\]/, match: (group, state) -> [x, y] = splitargs(group[1]); new SakuraScriptToken.Location x, y}
  {re: /^\\_b\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) ->
    args = splitargs(group[1])
    if args[1] == "inline"
      new SakuraScriptToken.InlineImage args[0], args.slice(2)
    else
      new SakuraScriptToken.Image args[0], args[1], args[2], args.slice(3)
  }
  {re: /^\\f\[([^\]]+)\]/, match: (group, state) -> args = splitargs(group[1]); new SakuraScriptToken.Font args[0], args.slice(1)}
  {re: /^\\4/, match: (group, state) -> new SakuraScriptToken.BeFar()}
  {re: /^\\5/, match: (group, state) -> new SakuraScriptToken.BeNear()}
  {re: /^\\c/, match: (group, state) -> new SakuraScriptToken.Clear()}
  {re: /^\\e/, match: (group, state) -> new SakuraScriptToken.End()}
  {re: /^\\z/, match: (group, state) -> new SakuraScriptToken.OldChoiceEnd()}
  {re: /^\\-/, match: (group, state) -> new SakuraScriptToken.Halt()}
  {re: /^\\\\/, match: (group, state) -> new SakuraScriptToken.EscapeChar()}
  {re: /^\\!\[anim,((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) -> args = splitargs(group[1]); new SakuraScriptToken.Animation args[0], args[1], args.slice(2)}
  {re: /^\\!\[bind,((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) -> args = splitargs(group[1]); new SakuraScriptToken.Bind args[0], args[1], args[2]}
  {re: /^\\!\[moveasync,cancel\]/, match: (group, state) -> new SakuraScriptToken.MoveAsyncCancel()}
  {re: /^\\!\[move(async)?,((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) ->
    use_class = if group[1] then SakuraScriptToken.MoveAsync else SakuraScriptToken.Move
    args = splitargs(group[2])
    new use_class args[0], args[1], args[2], args[3], args[4], args[5]
  }
  {re: /^\\!\[lock,repaint\]/, match: (group, state) -> new SakuraScriptToken.LockRepaint()}
  {re: /^\\!\[unlock,repaint\]/, match: (group, state) -> new SakuraScriptToken.UnlockRepaint()}
  {re: /^\\!\[set,((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) -> args = splitargs(group[1]); new SakuraScriptToken.Set args[0], args.slice(1)}
  {re: /^\\!\[open,((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) -> args = splitargs(group[1]); new SakuraScriptToken.Open args[0], args.slice(1)}
  {re: /^\\__c/, match: (group, state) -> new SakuraScriptToken.OpenCommunicateBox()}
  {re: /^\\__t/, match: (group, state) -> new SakuraScriptToken.OpenTeachBox()}
  {re: /^\\!\[\s*raise\s*,\s*((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) -> args = splitargs(group[1]); new SakuraScriptToken.Raise args[0], args.slice(1)}
  {re: /^\\!\[\*\]/, match: (group, state) -> new SakuraScriptToken.Marker()}
  {re: /^\\_u\[([A-Fa-fXx0-9]+)\]/, match: (group, state) -> new SakuraScriptToken.UCSChar Number(group[1])}
  {re: /^\\_m\[([A-Fa-fXx0-9]+)\]/, match: (group, state) -> new SakuraScriptToken.AsciiChar Number(group[1])}
  {re: /^\\&\[([A-Za-z0-9]+)\]/, match: (group, state) -> new SakuraScriptToken.EntityChar group[1]}
  {re: /^\\[C67+v8]/, match: (group, state) -> new SakuraScriptToken.NotImplemented group[0]} # not implemented quick
  {re: /^\\_[+V]/, match: (group, state) -> new SakuraScriptToken.NotImplemented group[0]} # not implemented quick
  {re: /^\\[8j]\[.*?\]/, match: (group, state) -> new SakuraScriptToken.NotImplemented group[0]} # not implemented quick
  {re: /^\\_[!?v]\[.*?\]/, match: (group, state) -> new SakuraScriptToken.NotImplemented group[0]} # not implemented quick
  {re: /^\\!\[.*?\]/, match: (group, state) -> new SakuraScriptToken.NotImplemented group[0]} # not implemented quick
  {re: /^./, match: (group, state) -> new SakuraScriptToken.Char group[0]}
]

if module?.exports?
  module.exports =
    SakuraScript: SakuraScript
    SakuraScriptToken: SakuraScriptToken
else
  @SakuraScript = SakuraScript
  @SakuraScriptToken = SakuraScriptToken
