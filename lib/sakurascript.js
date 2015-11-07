(function() {
  var SakuraScript, SakuraScriptToken, joinargs, splitargs,
    slice = [].slice,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  splitargs = function(str) {
    return str.replace(/"((?:\\\\|\\"|[^"])*)"/g, function(all, quoted) {
      return quoted.replace(/,/g, '\0');
    }).split(/\s*\,\s*/).map(function(arg) {
      return arg.replace(/\0/g, ',').replace(/\\(.)/, '$1');
    });
  };

  joinargs = function(args) {
    return args.map(function(arg) {
      return arg.replace(/\\/, '\\\\').replace(/\]/, '\\]');
    }).map(function(arg) {
      if (/[,"]/.test(arg)) {
        return '"' + arg.replace(/"/, '\\"') + '"';
      } else {
        return arg;
      }
    }).join(',');
  };

  SakuraScript = (function() {
    SakuraScript.fromObject = function(json) {
      var i, len, token, tokens;
      tokens = [];
      for (i = 0, len = json.length; i < len; i++) {
        token = json[i];
        tokens.push(SakuraScriptToken.fromObject(token));
      }
      return new SakuraScript(tokens);
    };

    SakuraScript.parse = function(script) {
      var i, len, ref, tag, tokens;
      tokens = [];
      while (script.length) {
        tag = null;
        ref = SakuraScript.tags;
        for (i = 0, len = ref.length; i < len; i++) {
          tag = ref[i];
          if (tag.re.test(script)) {
            break;
          }
        }
        script = script.replace(tag.re, (function(_this) {
          return function() {
            var all, group, j, offset;
            group = 3 <= arguments.length ? slice.call(arguments, 0, j = arguments.length - 2) : (j = 0, []), offset = arguments[j++], all = arguments[j++];
            tokens.push(tag.match.call(_this, group));
            return '';
          };
        })(this));
      }
      return new SakuraScript(tokens);
    };

    function SakuraScript(tokens1) {
      this.tokens = tokens1 != null ? tokens1 : [];
    }

    SakuraScript.prototype.toObject = function() {
      var i, len, ref, results, token;
      ref = this.tokens;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        token = ref[i];
        results.push(token.toObject());
      }
      return results;
    };

    SakuraScript.prototype.toSakuraScript = function() {
      var token;
      return ((function() {
        var i, len, ref, results;
        ref = this.tokens;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          token = ref[i];
          results.push(token.toSakuraScript());
        }
        return results;
      }).call(this)).join('');
    };

    return SakuraScript;

  })();

  SakuraScriptToken = (function() {
    SakuraScriptToken.fromObject = function(json) {
      var i, instance, key, len, ref;
      instance = new SakuraScriptToken[json["class"]]();
      ref = Object.keys(json);
      for (i = 0, len = ref.length; i < len; i++) {
        key = ref[i];
        if (key !== "class") {
          instance[key] = json[key];
        }
      }
      return instance;
    };

    function SakuraScriptToken() {}

    SakuraScriptToken.prototype.toObject = function() {
      var class_name, i, json, key, len, ref;
      class_name = this.constructor.toString().slice(9).match(/^[^\s(]+/)[0];
      json = {
        "class": class_name
      };
      ref = Object.keys(this);
      for (i = 0, len = ref.length; i < len; i++) {
        key = ref[i];
        json[key] = this[key];
      }
      return json;
    };

    SakuraScriptToken.prototype.toSakuraScript = function() {
      throw new Error("not implemented");
    };

    return SakuraScriptToken;

  })();

  SakuraScriptToken.Scope = (function(superClass) {
    extend(Scope, superClass);

    function Scope(scope, view) {
      this.scope = scope;
      this.view = view;
    }

    Scope.prototype.toSakuraScript = function() {
      switch (this.view) {
        case "bracket":
          return "\\p[" + this.scope + "]";
        case "nobracket":
          return "\\p" + this.scope;
        default:
          return "\\" + this.view;
      }
    };

    return Scope;

  })(SakuraScriptToken);

  SakuraScriptToken.Surface = (function(superClass) {
    extend(Surface, superClass);

    function Surface(surface, view) {
      this.surface = surface;
      this.view = view;
    }

    Surface.prototype.toSakuraScript = function() {
      switch (this.view) {
        case "bracket":
          return "\\s[" + this.surface + "]";
        case "nobracket":
          return "\\s" + this.surface;
      }
    };

    return Surface;

  })(SakuraScriptToken);

  SakuraScriptToken.SurfaceAlias = (function(superClass) {
    extend(SurfaceAlias, superClass);

    function SurfaceAlias(surface_alias) {
      this.surface_alias = surface_alias;
    }

    SurfaceAlias.prototype.toSakuraScript = function() {
      return "\\s[" + (joinargs([this.surface_alias])) + "]";
    };

    return SurfaceAlias;

  })(SakuraScriptToken);

  SakuraScriptToken.Balloon = (function(superClass) {
    extend(Balloon, superClass);

    function Balloon(balloon, view) {
      this.balloon = balloon;
      this.view = view;
    }

    Balloon.prototype.toSakuraScript = function() {
      switch (this.view) {
        case "bracket":
          return "\\b[" + this.balloon + "]";
        case "nobracket":
          return "\\b" + this.balloon;
      }
    };

    return Balloon;

  })(SakuraScriptToken);

  SakuraScriptToken.PlayAnimation = (function(superClass) {
    extend(PlayAnimation, superClass);

    function PlayAnimation(animation, view) {
      this.animation = animation;
      this.view = view;
    }

    PlayAnimation.prototype.toSakuraScript = function() {
      switch (this.view) {
        case "bracket":
          return "\\i[" + this.animation + "]";
        case "nobracket":
          return "\\i" + this.animation;
      }
    };

    return PlayAnimation;

  })(SakuraScriptToken);

  SakuraScriptToken.PlayAnimationWait = (function(superClass) {
    extend(PlayAnimationWait, superClass);

    function PlayAnimationWait(animation) {
      this.animation = animation;
    }

    PlayAnimationWait.prototype.toSakuraScript = function() {
      return "\\i[" + this.animation + ",wait]";
    };

    return PlayAnimationWait;

  })(SakuraScriptToken);

  SakuraScriptToken.SimpleWait = (function(superClass) {
    extend(SimpleWait, superClass);

    function SimpleWait(period) {
      this.period = period;
    }

    SimpleWait.prototype.toSakuraScript = function() {
      return "\\w" + this.period;
    };

    return SimpleWait;

  })(SakuraScriptToken);

  SakuraScriptToken.PreciseWait = (function(superClass) {
    extend(PreciseWait, superClass);

    function PreciseWait(period) {
      this.period = period;
    }

    PreciseWait.prototype.toSakuraScript = function() {
      return "\\_w[" + this.period + "]";
    };

    return PreciseWait;

  })(SakuraScriptToken);

  SakuraScriptToken.WaitFromBeginning = (function(superClass) {
    extend(WaitFromBeginning, superClass);

    function WaitFromBeginning(period) {
      this.period = period;
    }

    WaitFromBeginning.prototype.toSakuraScript = function() {
      return "\\__w[" + this.period + "]";
    };

    return WaitFromBeginning;

  })(SakuraScriptToken);

  SakuraScriptToken.ResetBeginning = (function(superClass) {
    extend(ResetBeginning, superClass);

    function ResetBeginning() {}

    ResetBeginning.prototype.toSakuraScript = function() {
      return "\\__w[clear]";
    };

    return ResetBeginning;

  })(SakuraScriptToken);

  SakuraScriptToken.WaitAnimationEnd = (function(superClass) {
    extend(WaitAnimationEnd, superClass);

    function WaitAnimationEnd(id) {
      this.id = id;
    }

    WaitAnimationEnd.prototype.toSakuraScript = function() {
      return "\\__w[animation," + this.id + "]";
    };

    return WaitAnimationEnd;

  })(SakuraScriptToken);

  SakuraScriptToken.ToggleQuick = (function(superClass) {
    extend(ToggleQuick, superClass);

    function ToggleQuick() {}

    ToggleQuick.prototype.toSakuraScript = function() {
      return "\\_q";
    };

    return ToggleQuick;

  })(SakuraScriptToken);

  SakuraScriptToken.ToggleSynchronize = (function(superClass) {
    extend(ToggleSynchronize, superClass);

    function ToggleSynchronize(scopes) {
      this.scopes = scopes != null ? scopes : [];
    }

    ToggleSynchronize.prototype.toSakuraScript = function() {
      return "\\_s" + (this.scopes.length ? "[" + (joinargs(this.scopes)) + "]" : "");
    };

    return ToggleSynchronize;

  })(SakuraScriptToken);

  SakuraScriptToken.TimeCritical = (function(superClass) {
    extend(TimeCritical, superClass);

    function TimeCritical() {}

    TimeCritical.prototype.toSakuraScript = function() {
      return "\\t";
    };

    return TimeCritical;

  })(SakuraScriptToken);

  SakuraScriptToken.WaitClick = (function(superClass) {
    extend(WaitClick, superClass);

    function WaitClick() {}

    WaitClick.prototype.toSakuraScript = function() {
      return "\\x";
    };

    return WaitClick;

  })(SakuraScriptToken);

  SakuraScriptToken.NoChoiceTimeout = (function(superClass) {
    extend(NoChoiceTimeout, superClass);

    function NoChoiceTimeout() {}

    NoChoiceTimeout.prototype.toSakuraScript = function() {
      return "\\*";
    };

    return NoChoiceTimeout;

  })(SakuraScriptToken);

  SakuraScriptToken.EventChoice = (function(superClass) {
    extend(EventChoice, superClass);

    function EventChoice(text, event, references) {
      this.text = text;
      this.event = event;
      this.references = references;
    }

    EventChoice.prototype.toSakuraScript = function() {
      return "\\q[" + (joinargs([this.text, this.event].concat(this.references))) + "]";
    };

    return EventChoice;

  })(SakuraScriptToken);

  SakuraScriptToken.ReferencesChoice = (function(superClass) {
    extend(ReferencesChoice, superClass);

    function ReferencesChoice(text, references) {
      this.text = text;
      this.references = references;
    }

    ReferencesChoice.prototype.toSakuraScript = function() {
      return "\\q[" + (joinargs([this.text].concat(this.references))) + "]";
    };

    return ReferencesChoice;

  })(SakuraScriptToken);

  SakuraScriptToken.ScriptChoice = (function(superClass) {
    extend(ScriptChoice, superClass);

    function ScriptChoice(text, script1) {
      this.text = text;
      this.script = script1;
    }

    ScriptChoice.prototype.toSakuraScript = function() {
      return "\\q[" + (joinargs([this.text, "script:" + this.script])) + "]";
    };

    return ScriptChoice;

  })(SakuraScriptToken);

  SakuraScriptToken.OldReferenceChoice = (function(superClass) {
    extend(OldReferenceChoice, superClass);

    function OldReferenceChoice(text, reference, view) {
      this.text = text;
      this.reference = reference;
      this.view = view;
    }

    OldReferenceChoice.prototype.toSakuraScript = function() {
      return "\\q" + (this.view || '') + "[" + (joinargs([this.reference])) + "][" + (joinargs([this.text])) + "]";
    };

    return OldReferenceChoice;

  })(SakuraScriptToken);

  SakuraScriptToken.BeginEventChoice = (function(superClass) {
    extend(BeginEventChoice, superClass);

    function BeginEventChoice(event, references) {
      this.event = event;
      this.references = references;
    }

    BeginEventChoice.prototype.toSakuraScript = function() {
      return "\\__q[" + (joinargs([this.event].concat(this.references))) + "]";
    };

    return BeginEventChoice;

  })(SakuraScriptToken);

  SakuraScriptToken.BeginReferencesChoice = (function(superClass) {
    extend(BeginReferencesChoice, superClass);

    function BeginReferencesChoice(references) {
      this.references = references;
    }

    BeginReferencesChoice.prototype.toSakuraScript = function() {
      return "\\__q[" + (joinargs(this.references)) + "]";
    };

    return BeginReferencesChoice;

  })(SakuraScriptToken);

  SakuraScriptToken.BeginScriptChoice = (function(superClass) {
    extend(BeginScriptChoice, superClass);

    function BeginScriptChoice(script1) {
      this.script = script1;
    }

    BeginScriptChoice.prototype.toSakuraScript = function() {
      return "\\__q[" + (joinargs(["script:" + this.script])) + "]";
    };

    return BeginScriptChoice;

  })(SakuraScriptToken);

  SakuraScriptToken.EndChoice = (function(superClass) {
    extend(EndChoice, superClass);

    function EndChoice() {}

    EndChoice.prototype.toSakuraScript = function() {
      return "\\__q";
    };

    return EndChoice;

  })(SakuraScriptToken);

  SakuraScriptToken.BeginEventAnchor = (function(superClass) {
    extend(BeginEventAnchor, superClass);

    function BeginEventAnchor(event, references) {
      this.event = event;
      this.references = references;
    }

    BeginEventAnchor.prototype.toSakuraScript = function() {
      return "\\_a[" + (joinargs([this.event].concat(this.references))) + "]";
    };

    return BeginEventAnchor;

  })(SakuraScriptToken);

  SakuraScriptToken.BeginReferencesAnchor = (function(superClass) {
    extend(BeginReferencesAnchor, superClass);

    function BeginReferencesAnchor(references) {
      this.references = references;
    }

    BeginReferencesAnchor.prototype.toSakuraScript = function() {
      return "\\_a[" + (joinargs(this.references)) + "]";
    };

    return BeginReferencesAnchor;

  })(SakuraScriptToken);

  SakuraScriptToken.BeginScriptAnchor = (function(superClass) {
    extend(BeginScriptAnchor, superClass);

    function BeginScriptAnchor(script1) {
      this.script = script1;
    }

    BeginScriptAnchor.prototype.toSakuraScript = function() {
      return "\\_a[" + (joinargs(["script:" + this.script])) + "]";
    };

    return BeginScriptAnchor;

  })(SakuraScriptToken);

  SakuraScriptToken.EndAnchor = (function(superClass) {
    extend(EndAnchor, superClass);

    function EndAnchor() {}

    EndAnchor.prototype.toSakuraScript = function() {
      return "\\_a";
    };

    return EndAnchor;

  })(SakuraScriptToken);

  SakuraScriptToken.LineBreak = (function(superClass) {
    extend(LineBreak, superClass);

    function LineBreak() {}

    LineBreak.prototype.toSakuraScript = function() {
      return "\\n";
    };

    return LineBreak;

  })(SakuraScriptToken);

  SakuraScriptToken.HalfLineBreak = (function(superClass) {
    extend(HalfLineBreak, superClass);

    function HalfLineBreak() {}

    HalfLineBreak.prototype.toSakuraScript = function() {
      return "\\n[half]";
    };

    return HalfLineBreak;

  })(SakuraScriptToken);

  SakuraScriptToken.PercentLineBreak = (function(superClass) {
    extend(PercentLineBreak, superClass);

    function PercentLineBreak(percent) {
      this.percent = percent;
    }

    PercentLineBreak.prototype.toSakuraScript = function() {
      return "\\n[" + this.percent + "]";
    };

    return PercentLineBreak;

  })(SakuraScriptToken);

  SakuraScriptToken.ToggleNoAutoLineBreak = (function(superClass) {
    extend(ToggleNoAutoLineBreak, superClass);

    function ToggleNoAutoLineBreak() {}

    ToggleNoAutoLineBreak.prototype.toSakuraScript = function() {
      return "\\_n";
    };

    return ToggleNoAutoLineBreak;

  })(SakuraScriptToken);

  SakuraScriptToken.Location = (function(superClass) {
    extend(Location, superClass);

    function Location(x1, y1) {
      this.x = x1;
      this.y = y1;
    }

    Location.prototype.toSakuraScript = function() {
      return "\\_l[" + ([this.x, this.y].join(',')) + "]";
    };

    return Location;

  })(SakuraScriptToken);

  SakuraScriptToken.Image = (function(superClass) {
    extend(Image, superClass);

    function Image(path, x1, y1, args1) {
      this.path = path;
      this.x = x1;
      this.y = y1;
      this.args = args1;
    }

    Image.prototype.toSakuraScript = function() {
      return "\\_b[" + ([this.path, this.x, this.y].concat(this.args).join(',')) + "]";
    };

    return Image;

  })(SakuraScriptToken);

  SakuraScriptToken.InlineImage = (function(superClass) {
    extend(InlineImage, superClass);

    function InlineImage(path, x1, y1, args1) {
      this.path = path;
      this.x = x1;
      this.y = y1;
      this.args = args1;
    }

    InlineImage.prototype.toSakuraScript = function() {
      return "\\_b[" + ([this.path, 'inline'].concat(this.args).join(',')) + "]";
    };

    return InlineImage;

  })(SakuraScriptToken);

  SakuraScriptToken.Font = (function(superClass) {
    extend(Font, superClass);

    function Font(name, args1) {
      this.name = name;
      this.args = args1;
    }

    Font.prototype.toSakuraScript = function() {
      return "\\f[" + (joinargs([this.name].concat(this.args))) + "]";
    };

    return Font;

  })(SakuraScriptToken);

  SakuraScriptToken.BeFar = (function(superClass) {
    extend(BeFar, superClass);

    function BeFar() {}

    BeFar.prototype.toSakuraScript = function() {
      return "\\4";
    };

    return BeFar;

  })(SakuraScriptToken);

  SakuraScriptToken.BeNear = (function(superClass) {
    extend(BeNear, superClass);

    function BeNear() {}

    BeNear.prototype.toSakuraScript = function() {
      return "\\5";
    };

    return BeNear;

  })(SakuraScriptToken);

  SakuraScriptToken.Clear = (function(superClass) {
    extend(Clear, superClass);

    function Clear() {}

    Clear.prototype.toSakuraScript = function() {
      return "\\c";
    };

    return Clear;

  })(SakuraScriptToken);

  SakuraScriptToken.End = (function(superClass) {
    extend(End, superClass);

    function End() {}

    End.prototype.toSakuraScript = function() {
      return "\\e";
    };

    return End;

  })(SakuraScriptToken);

  SakuraScriptToken.OldChoiceEnd = (function(superClass) {
    extend(OldChoiceEnd, superClass);

    function OldChoiceEnd() {}

    OldChoiceEnd.prototype.toSakuraScript = function() {
      return "\\z";
    };

    return OldChoiceEnd;

  })(SakuraScriptToken);

  SakuraScriptToken.OpenCommunicateBox = (function(superClass) {
    extend(OpenCommunicateBox, superClass);

    function OpenCommunicateBox() {}

    OpenCommunicateBox.prototype.toSakuraScript = function() {
      return "\\__c";
    };

    return OpenCommunicateBox;

  })(SakuraScriptToken);

  SakuraScriptToken.OpenTeachBox = (function(superClass) {
    extend(OpenTeachBox, superClass);

    function OpenTeachBox() {}

    OpenTeachBox.prototype.toSakuraScript = function() {
      return "\\__t";
    };

    return OpenTeachBox;

  })(SakuraScriptToken);

  SakuraScriptToken.Halt = (function(superClass) {
    extend(Halt, superClass);

    function Halt() {}

    Halt.prototype.toSakuraScript = function() {
      return "\\-";
    };

    return Halt;

  })(SakuraScriptToken);

  SakuraScriptToken.Marker = (function(superClass) {
    extend(Marker, superClass);

    function Marker() {}

    Marker.prototype.toSakuraScript = function() {
      return "\\![*]";
    };

    return Marker;

  })(SakuraScriptToken);

  SakuraScriptToken.Char = (function(superClass) {
    extend(Char, superClass);

    function Char(char) {
      this.char = char;
    }

    Char.prototype.toSakuraScript = function() {
      return this.char;
    };

    return Char;

  })(SakuraScriptToken);

  SakuraScriptToken.EscapeChar = (function(superClass) {
    extend(EscapeChar, superClass);

    function EscapeChar() {}

    EscapeChar.prototype.toSakuraScript = function() {
      return "\\\\";
    };

    return EscapeChar;

  })(SakuraScriptToken);

  SakuraScriptToken.UCSChar = (function(superClass) {
    extend(UCSChar, superClass);

    function UCSChar(char) {
      this.char = char;
    }

    UCSChar.prototype.toSakuraScript = function() {
      return "\\_u[0x" + (this.char.toString(16)) + "]";
    };

    return UCSChar;

  })(SakuraScriptToken);

  SakuraScriptToken.AsciiChar = (function(superClass) {
    extend(AsciiChar, superClass);

    function AsciiChar(char) {
      this.char = char;
    }

    AsciiChar.prototype.toSakuraScript = function() {
      return "\\_m[0x" + (this.char.toString(16)) + "]";
    };

    return AsciiChar;

  })(SakuraScriptToken);

  SakuraScriptToken.EntityChar = (function(superClass) {
    extend(EntityChar, superClass);

    function EntityChar(char) {
      this.char = char;
    }

    EntityChar.prototype.toSakuraScript = function() {
      return "\\&[" + this.char + "]";
    };

    return EntityChar;

  })(SakuraScriptToken);

  SakuraScriptToken.Animation = (function(superClass) {
    extend(Animation, superClass);

    function Animation(command, id, args1) {
      this.command = command;
      this.id = id;
      this.args = args1;
    }

    Animation.prototype.toSakuraScript = function() {
      return "\\![anim," + (joinargs([this.command, this.id].concat(this.args))) + "]";
    };

    return Animation;

  })(SakuraScriptToken);

  SakuraScriptToken.Bind = (function(superClass) {
    extend(Bind, superClass);

    function Bind(category, parts, dress_up) {
      this.category = category;
      this.parts = parts;
      this.dress_up = dress_up;
    }

    Bind.prototype.toSakuraScript = function() {
      return "\\![bind," + (joinargs([this.category, this.parts, this.dress_up])) + "]";
    };

    return Bind;

  })(SakuraScriptToken);

  SakuraScriptToken.LockRepaint = (function(superClass) {
    extend(LockRepaint, superClass);

    function LockRepaint() {}

    LockRepaint.prototype.toSakuraScript = function() {
      return "\\![lock,repaint]";
    };

    return LockRepaint;

  })(SakuraScriptToken);

  SakuraScriptToken.UnlockRepaint = (function(superClass) {
    extend(UnlockRepaint, superClass);

    function UnlockRepaint() {}

    UnlockRepaint.prototype.toSakuraScript = function() {
      return "\\![unlock,repaint]";
    };

    return UnlockRepaint;

  })(SakuraScriptToken);

  SakuraScriptToken.Move = (function(superClass) {
    extend(Move, superClass);

    function Move(x1, y1, duration, origin_type, source_origin, target_origin) {
      this.x = x1;
      this.y = y1;
      this.duration = duration;
      this.origin_type = origin_type;
      this.source_origin = source_origin;
      this.target_origin = target_origin;
    }

    Move.prototype.toSakuraScript = function() {
      return "\\![move," + (joinargs([this.x, this.y, this.duration, this.origin_type, this.source_origin, this.target_origin])) + "]";
    };

    return Move;

  })(SakuraScriptToken);

  SakuraScriptToken.MoveAsync = (function(superClass) {
    extend(MoveAsync, superClass);

    function MoveAsync() {
      return MoveAsync.__super__.constructor.apply(this, arguments);
    }

    MoveAsync.prototype.toSakuraScript = function() {
      return "\\![moveasync," + (joinargs([this.x, this.y, this.duration, this.origin_type, this.source_origin, this.target_origin])) + "]";
    };

    return MoveAsync;

  })(SakuraScriptToken.Move);

  SakuraScriptToken.MoveAsyncCancel = (function(superClass) {
    extend(MoveAsyncCancel, superClass);

    function MoveAsyncCancel() {}

    MoveAsyncCancel.prototype.toSakuraScript = function() {
      return "\\![moveasync,cancel]";
    };

    return MoveAsyncCancel;

  })(SakuraScriptToken.Move);

  SakuraScriptToken.Raise = (function(superClass) {
    extend(Raise, superClass);

    function Raise(event, references) {
      this.event = event;
      this.references = references;
    }

    Raise.prototype.toSakuraScript = function() {
      return "\\![raise," + (joinargs([this.event].concat(this.references))) + "]";
    };

    return Raise;

  })(SakuraScriptToken);

  SakuraScriptToken.Set = (function(superClass) {
    extend(Set, superClass);

    function Set(id, args1) {
      this.id = id;
      this.args = args1;
    }

    Set.prototype.toSakuraScript = function() {
      return "\\![set," + (joinargs([this.id].concat(this.args))) + "]";
    };

    return Set;

  })(SakuraScriptToken);

  SakuraScriptToken.Open = (function(superClass) {
    extend(Open, superClass);

    function Open(id, args1) {
      this.id = id;
      this.args = args1;
    }

    Open.prototype.toSakuraScript = function() {
      return "\\![open," + (joinargs([this.id].concat(this.args))) + "]";
    };

    return Open;

  })(SakuraScriptToken);

  SakuraScriptToken.NotImplemented = (function(superClass) {
    extend(NotImplemented, superClass);

    function NotImplemented(str1) {
      this.str = str1;
    }

    NotImplemented.prototype.toSakuraScript = function() {
      return this.str;
    };

    return NotImplemented;

  })(SakuraScriptToken);

  SakuraScript.tags = [
    {
      re: /^\\([h0])/,
      match: function(group, state) {
        return new SakuraScriptToken.Scope(0, group[1]);
      }
    }, {
      re: /^\\([u1])/,
      match: function(group, state) {
        return new SakuraScriptToken.Scope(1, group[1]);
      }
    }, {
      re: /^\\p\[(\d+)\]/,
      match: function(group, state) {
        return new SakuraScriptToken.Scope(Number(group[1]), "bracket");
      }
    }, {
      re: /^\\p(\d)/,
      match: function(group, state) {
        return new SakuraScriptToken.Scope(Number(group[1]), "nobracket");
      }
    }, {
      re: /^\\s(\d)/,
      match: function(group, state) {
        return new SakuraScriptToken.Surface(Number(group[1]), "nobracket");
      }
    }, {
      re: /^\\s\[([^\]]+)\]/,
      match: function(group, state) {
        if (isNaN(group[1])) {
          return new SakuraScriptToken.SurfaceAlias(group[1]);
        } else {
          return new SakuraScriptToken.Surface(Number(group[1]), "bracket");
        }
      }
    }, {
      re: /^\\b(\d)/,
      match: function(group, state) {
        return new SakuraScriptToken.Balloon(Number(group[1]), "nobracket");
      }
    }, {
      re: /^\\b\[([^\]]+)\]/,
      match: function(group, state) {
        return new SakuraScriptToken.Balloon(Number(group[1]), "bracket");
      }
    }, {
      re: /^\\i(\d)/,
      match: function(group, state) {
        return new SakuraScriptToken.PlayAnimation(Number(group[1]), "nobracket");
      }
    }, {
      re: /^\\i\[(\d+)\]/,
      match: function(group, state) {
        return new SakuraScriptToken.PlayAnimation(Number(group[1]), "bracket");
      }
    }, {
      re: /^\\i\[(\d+),wait\]/,
      match: function(group, state) {
        return new SakuraScriptToken.PlayAnimationWait(Number(group[1]));
      }
    }, {
      re: /^\\w(\d)/,
      match: function(group, state) {
        return new SakuraScriptToken.SimpleWait(Number(group[1]));
      }
    }, {
      re: /^\\_w\[(\d+)\]/,
      match: function(group, state) {
        return new SakuraScriptToken.PreciseWait(Number(group[1]));
      }
    }, {
      re: /^\\__w\[animation,(\d+)\]/,
      match: function(group, state) {
        return new SakuraScriptToken.WaitAnimationEnd(Number(group[1]));
      }
    }, {
      re: /^\\__w\[clear\]/,
      match: function(group, state) {
        return new SakuraScriptToken.ResetBeginning();
      }
    }, {
      re: /^\\__w\[(\d+)\]/,
      match: function(group, state) {
        return new SakuraScriptToken.WaitFromBeginning(Number(group[1]));
      }
    }, {
      re: /^\\_q/,
      match: function(group, state) {
        return new SakuraScriptToken.ToggleQuick();
      }
    }, {
      re: /^\\_s\[([^\]]+)\]/,
      match: function(group, state) {
        return new SakuraScriptToken.ToggleSynchronize(splitargs(group[1]).map(function(n) {
          return Number(n);
        }));
      }
    }, {
      re: /^\\_s/,
      match: function(group, state) {
        return new SakuraScriptToken.ToggleSynchronize();
      }
    }, {
      re: /^\\t/,
      match: function(group, state) {
        return new SakuraScriptToken.TimeCritical();
      }
    }, {
      re: /^\\x/,
      match: function(group, state) {
        return new SakuraScriptToken.WaitClick();
      }
    }, {
      re: /^\\\*/,
      match: function(group, state) {
        return new SakuraScriptToken.NoChoiceTimeout();
      }
    }, {
      re: /^\\q\[((?:\\\\|\\\]|[^\]])+)\]/,
      match: function(group, state) {
        var args;
        args = splitargs(group[1]);
        if (/^On/.test(args[1])) {
          return new SakuraScriptToken.EventChoice(args[0], args[1], args.slice(2));
        } else if (/^script:/.test(args[1])) {
          return new SakuraScriptToken.ScriptChoice(args[0], args[1].replace(/^script:/, ''));
        } else {
          return new SakuraScriptToken.ReferencesChoice(args[0], args.slice(1));
        }
      }
    }, {
      re: /^\\__q\[((?:\\\\|\\\]|[^\]])+)\]/,
      match: function(group, state) {
        var args;
        args = splitargs(group[1]);
        if (/^On/.test(args[0])) {
          return new SakuraScriptToken.BeginEventChoice(args[0], args.slice(1));
        } else if (/^script:/.test(args[0])) {
          return new SakuraScriptToken.BeginScriptChoice(args[0].replace(/^script:/, ''));
        } else {
          return new SakuraScriptToken.BeginReferencesChoice(args);
        }
      }
    }, {
      re: /^\\__q/,
      match: function(group, state) {
        return new SakuraScriptToken.EndChoice();
      }
    }, {
      re: /^\\q(\d*)\[((?:\\\\|\\\]|[^\]])+)\]\[((?:\\\\|\\\]|[^\]])+)\]/,
      match: function(group, state) {
        return new SakuraScriptToken.OldReferenceChoice(group[3], group[2], group[1]);
      }
    }, {
      re: /^\\_a\[((?:\\\\|\\\]|[^\]])+)\]/,
      match: function(group, state) {
        var args;
        args = splitargs(group[1]);
        if (/^On/.test(args[0])) {
          return new SakuraScriptToken.BeginEventAnchor(args[0], args.slice(1));
        } else if (/^script:/.test(args[0])) {
          return new SakuraScriptToken.BeginScriptAnchor(args[0].replace(/^script:/, ''));
        } else {
          return new SakuraScriptToken.BeginReferencesAnchor(args);
        }
      }
    }, {
      re: /^\\_a/,
      match: function(group, state) {
        return new SakuraScriptToken.EndAnchor();
      }
    }, {
      re: /^\\n\[half\]/,
      match: function(group, state) {
        return new SakuraScriptToken.HalfLineBreak();
      }
    }, {
      re: /^\\n\[(\d+)\]/,
      match: function(group, state) {
        return new SakuraScriptToken.PercentLineBreak(Number(group[1]));
      }
    }, {
      re: /^\\n/,
      match: function(group, state) {
        return new SakuraScriptToken.LineBreak();
      }
    }, {
      re: /^\\_n/,
      match: function(group, state) {
        return new SakuraScriptToken.ToggleNoAutoLineBreak();
      }
    }, {
      re: /^\\_l\[([^\]]+)\]/,
      match: function(group, state) {
        var ref, x, y;
        ref = splitargs(group[1]), x = ref[0], y = ref[1];
        return new SakuraScriptToken.Location(x, y);
      }
    }, {
      re: /^\\_b\[((?:\\\\|\\\]|[^\]])+)\]/,
      match: function(group, state) {
        var args;
        args = splitargs(group[1]);
        if (args[1] === "inline") {
          return new SakuraScriptToken.InlineImage(args[0], args.slice(2));
        } else {
          return new SakuraScriptToken.Image(args[0], args[1], args[2], args.slice(3));
        }
      }
    }, {
      re: /^\\f\[([^\]]+)\]/,
      match: function(group, state) {
        var args;
        args = splitargs(group[1]);
        return new SakuraScriptToken.Font(args[0], args.slice(1));
      }
    }, {
      re: /^\\4/,
      match: function(group, state) {
        return new SakuraScriptToken.BeFar();
      }
    }, {
      re: /^\\5/,
      match: function(group, state) {
        return new SakuraScriptToken.BeNear();
      }
    }, {
      re: /^\\c/,
      match: function(group, state) {
        return new SakuraScriptToken.Clear();
      }
    }, {
      re: /^\\e/,
      match: function(group, state) {
        return new SakuraScriptToken.End();
      }
    }, {
      re: /^\\z/,
      match: function(group, state) {
        return new SakuraScriptToken.OldChoiceEnd();
      }
    }, {
      re: /^\\-/,
      match: function(group, state) {
        return new SakuraScriptToken.Halt();
      }
    }, {
      re: /^\\\\/,
      match: function(group, state) {
        return new SakuraScriptToken.EscapeChar();
      }
    }, {
      re: /^\\!\[anim,((?:\\\\|\\\]|[^\]])+)\]/,
      match: function(group, state) {
        var args;
        args = splitargs(group[1]);
        return new SakuraScriptToken.Animation(args[0], args[1], args.slice(2));
      }
    }, {
      re: /^\\!\[bind,((?:\\\\|\\\]|[^\]])+)\]/,
      match: function(group, state) {
        var args;
        args = splitargs(group[1]);
        return new SakuraScriptToken.Bind(args[0], args[1], args[2]);
      }
    }, {
      re: /^\\!\[moveasync,cancel\]/,
      match: function(group, state) {
        return new SakuraScriptToken.MoveAsyncCancel();
      }
    }, {
      re: /^\\!\[move(async)?,((?:\\\\|\\\]|[^\]])+)\]/,
      match: function(group, state) {
        var args, use_class;
        use_class = group[1] ? SakuraScriptToken.MoveAsync : SakuraScriptToken.Move;
        args = splitargs(group[2]);
        return new use_class(args[0], args[1], args[2], args[3], args[4], args[5]);
      }
    }, {
      re: /^\\!\[lock,repaint\]/,
      match: function(group, state) {
        return new SakuraScriptToken.LockRepaint();
      }
    }, {
      re: /^\\!\[unlock,repaint\]/,
      match: function(group, state) {
        return new SakuraScriptToken.UnlockRepaint();
      }
    }, {
      re: /^\\!\[set,((?:\\\\|\\\]|[^\]])+)\]/,
      match: function(group, state) {
        var args;
        args = splitargs(group[1]);
        return new SakuraScriptToken.Set(args[0], args.slice(1));
      }
    }, {
      re: /^\\!\[open,((?:\\\\|\\\]|[^\]])+)\]/,
      match: function(group, state) {
        var args;
        args = splitargs(group[1]);
        return new SakuraScriptToken.Open(args[0], args.slice(1));
      }
    }, {
      re: /^\\__c/,
      match: function(group, state) {
        return new SakuraScriptToken.OpenCommunicateBox();
      }
    }, {
      re: /^\\__t/,
      match: function(group, state) {
        return new SakuraScriptToken.OpenTeachBox();
      }
    }, {
      re: /^\\!\[\s*raise\s*,\s*((?:\\\\|\\\]|[^\]])+)\]/,
      match: function(group, state) {
        var args;
        args = splitargs(group[1]);
        return new SakuraScriptToken.Raise(args[0], args.slice(1));
      }
    }, {
      re: /^\\!\[\*\]/,
      match: function(group, state) {
        return new SakuraScriptToken.Marker();
      }
    }, {
      re: /^\\_u\[([A-Fa-fXx0-9]+)\]/,
      match: function(group, state) {
        return new SakuraScriptToken.UCSChar(Number(group[1]));
      }
    }, {
      re: /^\\_m\[([A-Fa-fXx0-9]+)\]/,
      match: function(group, state) {
        return new SakuraScriptToken.AsciiChar(Number(group[1]));
      }
    }, {
      re: /^\\&\[([A-Za-z0-9]+)\]/,
      match: function(group, state) {
        return new SakuraScriptToken.EntityChar(group[1]);
      }
    }, {
      re: /^\\[C67+v8]/,
      match: function(group, state) {
        return new SakuraScriptToken.NotImplemented(group[0]);
      }
    }, {
      re: /^\\_[+V]/,
      match: function(group, state) {
        return new SakuraScriptToken.NotImplemented(group[0]);
      }
    }, {
      re: /^\\[8j]\[.*?\]/,
      match: function(group, state) {
        return new SakuraScriptToken.NotImplemented(group[0]);
      }
    }, {
      re: /^\\_[!?v]\[.*?\]/,
      match: function(group, state) {
        return new SakuraScriptToken.NotImplemented(group[0]);
      }
    }, {
      re: /^\\!\[.*?\]/,
      match: function(group, state) {
        return new SakuraScriptToken.NotImplemented(group[0]);
      }
    }, {
      re: /^./,
      match: function(group, state) {
        return new SakuraScriptToken.Char(group[0]);
      }
    }
  ];

  if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
    module.exports = {
      SakuraScript: SakuraScript,
      SakuraScriptToken: SakuraScriptToken
    };
  } else {
    this.SakuraScript = SakuraScript;
    this.SakuraScriptToken = SakuraScriptToken;
  }

}).call(this);

//# sourceMappingURL=sakurascript.js.map
