var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__13617 = x == null ? null : x;
  if(p[goog.typeOf(x__13617)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__13618__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__13618 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13618__delegate.call(this, array, i, idxs)
    };
    G__13618.cljs$lang$maxFixedArity = 2;
    G__13618.cljs$lang$applyTo = function(arglist__13619) {
      var array = cljs.core.first(arglist__13619);
      var i = cljs.core.first(cljs.core.next(arglist__13619));
      var idxs = cljs.core.rest(cljs.core.next(arglist__13619));
      return G__13618__delegate(array, i, idxs)
    };
    G__13618.cljs$lang$arity$variadic = G__13618__delegate;
    return G__13618
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____13704 = this$;
      if(and__3822__auto____13704) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____13704
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____13705 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13706 = cljs.core._invoke[goog.typeOf(x__2363__auto____13705)];
        if(or__3824__auto____13706) {
          return or__3824__auto____13706
        }else {
          var or__3824__auto____13707 = cljs.core._invoke["_"];
          if(or__3824__auto____13707) {
            return or__3824__auto____13707
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____13708 = this$;
      if(and__3822__auto____13708) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____13708
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____13709 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13710 = cljs.core._invoke[goog.typeOf(x__2363__auto____13709)];
        if(or__3824__auto____13710) {
          return or__3824__auto____13710
        }else {
          var or__3824__auto____13711 = cljs.core._invoke["_"];
          if(or__3824__auto____13711) {
            return or__3824__auto____13711
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____13712 = this$;
      if(and__3822__auto____13712) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____13712
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____13713 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13714 = cljs.core._invoke[goog.typeOf(x__2363__auto____13713)];
        if(or__3824__auto____13714) {
          return or__3824__auto____13714
        }else {
          var or__3824__auto____13715 = cljs.core._invoke["_"];
          if(or__3824__auto____13715) {
            return or__3824__auto____13715
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____13716 = this$;
      if(and__3822__auto____13716) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____13716
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____13717 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13718 = cljs.core._invoke[goog.typeOf(x__2363__auto____13717)];
        if(or__3824__auto____13718) {
          return or__3824__auto____13718
        }else {
          var or__3824__auto____13719 = cljs.core._invoke["_"];
          if(or__3824__auto____13719) {
            return or__3824__auto____13719
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____13720 = this$;
      if(and__3822__auto____13720) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____13720
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____13721 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13722 = cljs.core._invoke[goog.typeOf(x__2363__auto____13721)];
        if(or__3824__auto____13722) {
          return or__3824__auto____13722
        }else {
          var or__3824__auto____13723 = cljs.core._invoke["_"];
          if(or__3824__auto____13723) {
            return or__3824__auto____13723
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____13724 = this$;
      if(and__3822__auto____13724) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____13724
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____13725 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13726 = cljs.core._invoke[goog.typeOf(x__2363__auto____13725)];
        if(or__3824__auto____13726) {
          return or__3824__auto____13726
        }else {
          var or__3824__auto____13727 = cljs.core._invoke["_"];
          if(or__3824__auto____13727) {
            return or__3824__auto____13727
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____13728 = this$;
      if(and__3822__auto____13728) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____13728
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____13729 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13730 = cljs.core._invoke[goog.typeOf(x__2363__auto____13729)];
        if(or__3824__auto____13730) {
          return or__3824__auto____13730
        }else {
          var or__3824__auto____13731 = cljs.core._invoke["_"];
          if(or__3824__auto____13731) {
            return or__3824__auto____13731
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____13732 = this$;
      if(and__3822__auto____13732) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____13732
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____13733 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13734 = cljs.core._invoke[goog.typeOf(x__2363__auto____13733)];
        if(or__3824__auto____13734) {
          return or__3824__auto____13734
        }else {
          var or__3824__auto____13735 = cljs.core._invoke["_"];
          if(or__3824__auto____13735) {
            return or__3824__auto____13735
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____13736 = this$;
      if(and__3822__auto____13736) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____13736
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____13737 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13738 = cljs.core._invoke[goog.typeOf(x__2363__auto____13737)];
        if(or__3824__auto____13738) {
          return or__3824__auto____13738
        }else {
          var or__3824__auto____13739 = cljs.core._invoke["_"];
          if(or__3824__auto____13739) {
            return or__3824__auto____13739
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____13740 = this$;
      if(and__3822__auto____13740) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____13740
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____13741 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13742 = cljs.core._invoke[goog.typeOf(x__2363__auto____13741)];
        if(or__3824__auto____13742) {
          return or__3824__auto____13742
        }else {
          var or__3824__auto____13743 = cljs.core._invoke["_"];
          if(or__3824__auto____13743) {
            return or__3824__auto____13743
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____13744 = this$;
      if(and__3822__auto____13744) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____13744
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____13745 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13746 = cljs.core._invoke[goog.typeOf(x__2363__auto____13745)];
        if(or__3824__auto____13746) {
          return or__3824__auto____13746
        }else {
          var or__3824__auto____13747 = cljs.core._invoke["_"];
          if(or__3824__auto____13747) {
            return or__3824__auto____13747
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____13748 = this$;
      if(and__3822__auto____13748) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____13748
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____13749 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13750 = cljs.core._invoke[goog.typeOf(x__2363__auto____13749)];
        if(or__3824__auto____13750) {
          return or__3824__auto____13750
        }else {
          var or__3824__auto____13751 = cljs.core._invoke["_"];
          if(or__3824__auto____13751) {
            return or__3824__auto____13751
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____13752 = this$;
      if(and__3822__auto____13752) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____13752
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____13753 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13754 = cljs.core._invoke[goog.typeOf(x__2363__auto____13753)];
        if(or__3824__auto____13754) {
          return or__3824__auto____13754
        }else {
          var or__3824__auto____13755 = cljs.core._invoke["_"];
          if(or__3824__auto____13755) {
            return or__3824__auto____13755
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____13756 = this$;
      if(and__3822__auto____13756) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____13756
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____13757 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13758 = cljs.core._invoke[goog.typeOf(x__2363__auto____13757)];
        if(or__3824__auto____13758) {
          return or__3824__auto____13758
        }else {
          var or__3824__auto____13759 = cljs.core._invoke["_"];
          if(or__3824__auto____13759) {
            return or__3824__auto____13759
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____13760 = this$;
      if(and__3822__auto____13760) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____13760
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____13761 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13762 = cljs.core._invoke[goog.typeOf(x__2363__auto____13761)];
        if(or__3824__auto____13762) {
          return or__3824__auto____13762
        }else {
          var or__3824__auto____13763 = cljs.core._invoke["_"];
          if(or__3824__auto____13763) {
            return or__3824__auto____13763
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____13764 = this$;
      if(and__3822__auto____13764) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____13764
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____13765 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13766 = cljs.core._invoke[goog.typeOf(x__2363__auto____13765)];
        if(or__3824__auto____13766) {
          return or__3824__auto____13766
        }else {
          var or__3824__auto____13767 = cljs.core._invoke["_"];
          if(or__3824__auto____13767) {
            return or__3824__auto____13767
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____13768 = this$;
      if(and__3822__auto____13768) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____13768
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____13769 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13770 = cljs.core._invoke[goog.typeOf(x__2363__auto____13769)];
        if(or__3824__auto____13770) {
          return or__3824__auto____13770
        }else {
          var or__3824__auto____13771 = cljs.core._invoke["_"];
          if(or__3824__auto____13771) {
            return or__3824__auto____13771
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____13772 = this$;
      if(and__3822__auto____13772) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____13772
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____13773 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13774 = cljs.core._invoke[goog.typeOf(x__2363__auto____13773)];
        if(or__3824__auto____13774) {
          return or__3824__auto____13774
        }else {
          var or__3824__auto____13775 = cljs.core._invoke["_"];
          if(or__3824__auto____13775) {
            return or__3824__auto____13775
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____13776 = this$;
      if(and__3822__auto____13776) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____13776
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____13777 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13778 = cljs.core._invoke[goog.typeOf(x__2363__auto____13777)];
        if(or__3824__auto____13778) {
          return or__3824__auto____13778
        }else {
          var or__3824__auto____13779 = cljs.core._invoke["_"];
          if(or__3824__auto____13779) {
            return or__3824__auto____13779
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____13780 = this$;
      if(and__3822__auto____13780) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____13780
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____13781 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13782 = cljs.core._invoke[goog.typeOf(x__2363__auto____13781)];
        if(or__3824__auto____13782) {
          return or__3824__auto____13782
        }else {
          var or__3824__auto____13783 = cljs.core._invoke["_"];
          if(or__3824__auto____13783) {
            return or__3824__auto____13783
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____13784 = this$;
      if(and__3822__auto____13784) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____13784
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____13785 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____13786 = cljs.core._invoke[goog.typeOf(x__2363__auto____13785)];
        if(or__3824__auto____13786) {
          return or__3824__auto____13786
        }else {
          var or__3824__auto____13787 = cljs.core._invoke["_"];
          if(or__3824__auto____13787) {
            return or__3824__auto____13787
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____13792 = coll;
    if(and__3822__auto____13792) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____13792
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____13793 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13794 = cljs.core._count[goog.typeOf(x__2363__auto____13793)];
      if(or__3824__auto____13794) {
        return or__3824__auto____13794
      }else {
        var or__3824__auto____13795 = cljs.core._count["_"];
        if(or__3824__auto____13795) {
          return or__3824__auto____13795
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____13800 = coll;
    if(and__3822__auto____13800) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____13800
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____13801 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13802 = cljs.core._empty[goog.typeOf(x__2363__auto____13801)];
      if(or__3824__auto____13802) {
        return or__3824__auto____13802
      }else {
        var or__3824__auto____13803 = cljs.core._empty["_"];
        if(or__3824__auto____13803) {
          return or__3824__auto____13803
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____13808 = coll;
    if(and__3822__auto____13808) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____13808
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____13809 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13810 = cljs.core._conj[goog.typeOf(x__2363__auto____13809)];
      if(or__3824__auto____13810) {
        return or__3824__auto____13810
      }else {
        var or__3824__auto____13811 = cljs.core._conj["_"];
        if(or__3824__auto____13811) {
          return or__3824__auto____13811
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____13820 = coll;
      if(and__3822__auto____13820) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____13820
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____13821 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13822 = cljs.core._nth[goog.typeOf(x__2363__auto____13821)];
        if(or__3824__auto____13822) {
          return or__3824__auto____13822
        }else {
          var or__3824__auto____13823 = cljs.core._nth["_"];
          if(or__3824__auto____13823) {
            return or__3824__auto____13823
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____13824 = coll;
      if(and__3822__auto____13824) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____13824
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____13825 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13826 = cljs.core._nth[goog.typeOf(x__2363__auto____13825)];
        if(or__3824__auto____13826) {
          return or__3824__auto____13826
        }else {
          var or__3824__auto____13827 = cljs.core._nth["_"];
          if(or__3824__auto____13827) {
            return or__3824__auto____13827
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____13832 = coll;
    if(and__3822__auto____13832) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____13832
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____13833 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13834 = cljs.core._first[goog.typeOf(x__2363__auto____13833)];
      if(or__3824__auto____13834) {
        return or__3824__auto____13834
      }else {
        var or__3824__auto____13835 = cljs.core._first["_"];
        if(or__3824__auto____13835) {
          return or__3824__auto____13835
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____13840 = coll;
    if(and__3822__auto____13840) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____13840
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____13841 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13842 = cljs.core._rest[goog.typeOf(x__2363__auto____13841)];
      if(or__3824__auto____13842) {
        return or__3824__auto____13842
      }else {
        var or__3824__auto____13843 = cljs.core._rest["_"];
        if(or__3824__auto____13843) {
          return or__3824__auto____13843
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____13848 = coll;
    if(and__3822__auto____13848) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____13848
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____13849 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13850 = cljs.core._next[goog.typeOf(x__2363__auto____13849)];
      if(or__3824__auto____13850) {
        return or__3824__auto____13850
      }else {
        var or__3824__auto____13851 = cljs.core._next["_"];
        if(or__3824__auto____13851) {
          return or__3824__auto____13851
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____13860 = o;
      if(and__3822__auto____13860) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____13860
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____13861 = o == null ? null : o;
      return function() {
        var or__3824__auto____13862 = cljs.core._lookup[goog.typeOf(x__2363__auto____13861)];
        if(or__3824__auto____13862) {
          return or__3824__auto____13862
        }else {
          var or__3824__auto____13863 = cljs.core._lookup["_"];
          if(or__3824__auto____13863) {
            return or__3824__auto____13863
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____13864 = o;
      if(and__3822__auto____13864) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____13864
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____13865 = o == null ? null : o;
      return function() {
        var or__3824__auto____13866 = cljs.core._lookup[goog.typeOf(x__2363__auto____13865)];
        if(or__3824__auto____13866) {
          return or__3824__auto____13866
        }else {
          var or__3824__auto____13867 = cljs.core._lookup["_"];
          if(or__3824__auto____13867) {
            return or__3824__auto____13867
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____13872 = coll;
    if(and__3822__auto____13872) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____13872
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____13873 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13874 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____13873)];
      if(or__3824__auto____13874) {
        return or__3824__auto____13874
      }else {
        var or__3824__auto____13875 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____13875) {
          return or__3824__auto____13875
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____13880 = coll;
    if(and__3822__auto____13880) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____13880
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____13881 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13882 = cljs.core._assoc[goog.typeOf(x__2363__auto____13881)];
      if(or__3824__auto____13882) {
        return or__3824__auto____13882
      }else {
        var or__3824__auto____13883 = cljs.core._assoc["_"];
        if(or__3824__auto____13883) {
          return or__3824__auto____13883
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____13888 = coll;
    if(and__3822__auto____13888) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____13888
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____13889 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13890 = cljs.core._dissoc[goog.typeOf(x__2363__auto____13889)];
      if(or__3824__auto____13890) {
        return or__3824__auto____13890
      }else {
        var or__3824__auto____13891 = cljs.core._dissoc["_"];
        if(or__3824__auto____13891) {
          return or__3824__auto____13891
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____13896 = coll;
    if(and__3822__auto____13896) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____13896
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____13897 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13898 = cljs.core._key[goog.typeOf(x__2363__auto____13897)];
      if(or__3824__auto____13898) {
        return or__3824__auto____13898
      }else {
        var or__3824__auto____13899 = cljs.core._key["_"];
        if(or__3824__auto____13899) {
          return or__3824__auto____13899
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____13904 = coll;
    if(and__3822__auto____13904) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____13904
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____13905 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13906 = cljs.core._val[goog.typeOf(x__2363__auto____13905)];
      if(or__3824__auto____13906) {
        return or__3824__auto____13906
      }else {
        var or__3824__auto____13907 = cljs.core._val["_"];
        if(or__3824__auto____13907) {
          return or__3824__auto____13907
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____13912 = coll;
    if(and__3822__auto____13912) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____13912
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____13913 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13914 = cljs.core._disjoin[goog.typeOf(x__2363__auto____13913)];
      if(or__3824__auto____13914) {
        return or__3824__auto____13914
      }else {
        var or__3824__auto____13915 = cljs.core._disjoin["_"];
        if(or__3824__auto____13915) {
          return or__3824__auto____13915
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____13920 = coll;
    if(and__3822__auto____13920) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____13920
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____13921 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13922 = cljs.core._peek[goog.typeOf(x__2363__auto____13921)];
      if(or__3824__auto____13922) {
        return or__3824__auto____13922
      }else {
        var or__3824__auto____13923 = cljs.core._peek["_"];
        if(or__3824__auto____13923) {
          return or__3824__auto____13923
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____13928 = coll;
    if(and__3822__auto____13928) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____13928
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____13929 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13930 = cljs.core._pop[goog.typeOf(x__2363__auto____13929)];
      if(or__3824__auto____13930) {
        return or__3824__auto____13930
      }else {
        var or__3824__auto____13931 = cljs.core._pop["_"];
        if(or__3824__auto____13931) {
          return or__3824__auto____13931
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____13936 = coll;
    if(and__3822__auto____13936) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____13936
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____13937 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13938 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____13937)];
      if(or__3824__auto____13938) {
        return or__3824__auto____13938
      }else {
        var or__3824__auto____13939 = cljs.core._assoc_n["_"];
        if(or__3824__auto____13939) {
          return or__3824__auto____13939
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____13944 = o;
    if(and__3822__auto____13944) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____13944
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____13945 = o == null ? null : o;
    return function() {
      var or__3824__auto____13946 = cljs.core._deref[goog.typeOf(x__2363__auto____13945)];
      if(or__3824__auto____13946) {
        return or__3824__auto____13946
      }else {
        var or__3824__auto____13947 = cljs.core._deref["_"];
        if(or__3824__auto____13947) {
          return or__3824__auto____13947
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____13952 = o;
    if(and__3822__auto____13952) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____13952
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____13953 = o == null ? null : o;
    return function() {
      var or__3824__auto____13954 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____13953)];
      if(or__3824__auto____13954) {
        return or__3824__auto____13954
      }else {
        var or__3824__auto____13955 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____13955) {
          return or__3824__auto____13955
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____13960 = o;
    if(and__3822__auto____13960) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____13960
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____13961 = o == null ? null : o;
    return function() {
      var or__3824__auto____13962 = cljs.core._meta[goog.typeOf(x__2363__auto____13961)];
      if(or__3824__auto____13962) {
        return or__3824__auto____13962
      }else {
        var or__3824__auto____13963 = cljs.core._meta["_"];
        if(or__3824__auto____13963) {
          return or__3824__auto____13963
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____13968 = o;
    if(and__3822__auto____13968) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____13968
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____13969 = o == null ? null : o;
    return function() {
      var or__3824__auto____13970 = cljs.core._with_meta[goog.typeOf(x__2363__auto____13969)];
      if(or__3824__auto____13970) {
        return or__3824__auto____13970
      }else {
        var or__3824__auto____13971 = cljs.core._with_meta["_"];
        if(or__3824__auto____13971) {
          return or__3824__auto____13971
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____13980 = coll;
      if(and__3822__auto____13980) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____13980
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____13981 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13982 = cljs.core._reduce[goog.typeOf(x__2363__auto____13981)];
        if(or__3824__auto____13982) {
          return or__3824__auto____13982
        }else {
          var or__3824__auto____13983 = cljs.core._reduce["_"];
          if(or__3824__auto____13983) {
            return or__3824__auto____13983
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____13984 = coll;
      if(and__3822__auto____13984) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____13984
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____13985 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____13986 = cljs.core._reduce[goog.typeOf(x__2363__auto____13985)];
        if(or__3824__auto____13986) {
          return or__3824__auto____13986
        }else {
          var or__3824__auto____13987 = cljs.core._reduce["_"];
          if(or__3824__auto____13987) {
            return or__3824__auto____13987
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____13992 = coll;
    if(and__3822__auto____13992) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____13992
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____13993 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____13994 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____13993)];
      if(or__3824__auto____13994) {
        return or__3824__auto____13994
      }else {
        var or__3824__auto____13995 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____13995) {
          return or__3824__auto____13995
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____14000 = o;
    if(and__3822__auto____14000) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____14000
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____14001 = o == null ? null : o;
    return function() {
      var or__3824__auto____14002 = cljs.core._equiv[goog.typeOf(x__2363__auto____14001)];
      if(or__3824__auto____14002) {
        return or__3824__auto____14002
      }else {
        var or__3824__auto____14003 = cljs.core._equiv["_"];
        if(or__3824__auto____14003) {
          return or__3824__auto____14003
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____14008 = o;
    if(and__3822__auto____14008) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____14008
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____14009 = o == null ? null : o;
    return function() {
      var or__3824__auto____14010 = cljs.core._hash[goog.typeOf(x__2363__auto____14009)];
      if(or__3824__auto____14010) {
        return or__3824__auto____14010
      }else {
        var or__3824__auto____14011 = cljs.core._hash["_"];
        if(or__3824__auto____14011) {
          return or__3824__auto____14011
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____14016 = o;
    if(and__3822__auto____14016) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____14016
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____14017 = o == null ? null : o;
    return function() {
      var or__3824__auto____14018 = cljs.core._seq[goog.typeOf(x__2363__auto____14017)];
      if(or__3824__auto____14018) {
        return or__3824__auto____14018
      }else {
        var or__3824__auto____14019 = cljs.core._seq["_"];
        if(or__3824__auto____14019) {
          return or__3824__auto____14019
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____14024 = coll;
    if(and__3822__auto____14024) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____14024
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____14025 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14026 = cljs.core._rseq[goog.typeOf(x__2363__auto____14025)];
      if(or__3824__auto____14026) {
        return or__3824__auto____14026
      }else {
        var or__3824__auto____14027 = cljs.core._rseq["_"];
        if(or__3824__auto____14027) {
          return or__3824__auto____14027
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____14032 = coll;
    if(and__3822__auto____14032) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____14032
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____14033 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14034 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____14033)];
      if(or__3824__auto____14034) {
        return or__3824__auto____14034
      }else {
        var or__3824__auto____14035 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____14035) {
          return or__3824__auto____14035
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____14040 = coll;
    if(and__3822__auto____14040) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____14040
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____14041 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14042 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____14041)];
      if(or__3824__auto____14042) {
        return or__3824__auto____14042
      }else {
        var or__3824__auto____14043 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____14043) {
          return or__3824__auto____14043
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____14048 = coll;
    if(and__3822__auto____14048) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____14048
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____14049 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14050 = cljs.core._entry_key[goog.typeOf(x__2363__auto____14049)];
      if(or__3824__auto____14050) {
        return or__3824__auto____14050
      }else {
        var or__3824__auto____14051 = cljs.core._entry_key["_"];
        if(or__3824__auto____14051) {
          return or__3824__auto____14051
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____14056 = coll;
    if(and__3822__auto____14056) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____14056
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____14057 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14058 = cljs.core._comparator[goog.typeOf(x__2363__auto____14057)];
      if(or__3824__auto____14058) {
        return or__3824__auto____14058
      }else {
        var or__3824__auto____14059 = cljs.core._comparator["_"];
        if(or__3824__auto____14059) {
          return or__3824__auto____14059
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____14064 = o;
    if(and__3822__auto____14064) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____14064
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____14065 = o == null ? null : o;
    return function() {
      var or__3824__auto____14066 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____14065)];
      if(or__3824__auto____14066) {
        return or__3824__auto____14066
      }else {
        var or__3824__auto____14067 = cljs.core._pr_seq["_"];
        if(or__3824__auto____14067) {
          return or__3824__auto____14067
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____14072 = d;
    if(and__3822__auto____14072) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____14072
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____14073 = d == null ? null : d;
    return function() {
      var or__3824__auto____14074 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____14073)];
      if(or__3824__auto____14074) {
        return or__3824__auto____14074
      }else {
        var or__3824__auto____14075 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____14075) {
          return or__3824__auto____14075
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____14080 = this$;
    if(and__3822__auto____14080) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____14080
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____14081 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14082 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____14081)];
      if(or__3824__auto____14082) {
        return or__3824__auto____14082
      }else {
        var or__3824__auto____14083 = cljs.core._notify_watches["_"];
        if(or__3824__auto____14083) {
          return or__3824__auto____14083
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____14088 = this$;
    if(and__3822__auto____14088) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____14088
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____14089 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14090 = cljs.core._add_watch[goog.typeOf(x__2363__auto____14089)];
      if(or__3824__auto____14090) {
        return or__3824__auto____14090
      }else {
        var or__3824__auto____14091 = cljs.core._add_watch["_"];
        if(or__3824__auto____14091) {
          return or__3824__auto____14091
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____14096 = this$;
    if(and__3822__auto____14096) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____14096
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____14097 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____14098 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____14097)];
      if(or__3824__auto____14098) {
        return or__3824__auto____14098
      }else {
        var or__3824__auto____14099 = cljs.core._remove_watch["_"];
        if(or__3824__auto____14099) {
          return or__3824__auto____14099
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____14104 = coll;
    if(and__3822__auto____14104) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____14104
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____14105 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14106 = cljs.core._as_transient[goog.typeOf(x__2363__auto____14105)];
      if(or__3824__auto____14106) {
        return or__3824__auto____14106
      }else {
        var or__3824__auto____14107 = cljs.core._as_transient["_"];
        if(or__3824__auto____14107) {
          return or__3824__auto____14107
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____14112 = tcoll;
    if(and__3822__auto____14112) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____14112
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____14113 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14114 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____14113)];
      if(or__3824__auto____14114) {
        return or__3824__auto____14114
      }else {
        var or__3824__auto____14115 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____14115) {
          return or__3824__auto____14115
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____14120 = tcoll;
    if(and__3822__auto____14120) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____14120
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____14121 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14122 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____14121)];
      if(or__3824__auto____14122) {
        return or__3824__auto____14122
      }else {
        var or__3824__auto____14123 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____14123) {
          return or__3824__auto____14123
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____14128 = tcoll;
    if(and__3822__auto____14128) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____14128
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____14129 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14130 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____14129)];
      if(or__3824__auto____14130) {
        return or__3824__auto____14130
      }else {
        var or__3824__auto____14131 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____14131) {
          return or__3824__auto____14131
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____14136 = tcoll;
    if(and__3822__auto____14136) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____14136
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____14137 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14138 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____14137)];
      if(or__3824__auto____14138) {
        return or__3824__auto____14138
      }else {
        var or__3824__auto____14139 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____14139) {
          return or__3824__auto____14139
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____14144 = tcoll;
    if(and__3822__auto____14144) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____14144
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____14145 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14146 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____14145)];
      if(or__3824__auto____14146) {
        return or__3824__auto____14146
      }else {
        var or__3824__auto____14147 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____14147) {
          return or__3824__auto____14147
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____14152 = tcoll;
    if(and__3822__auto____14152) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____14152
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____14153 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14154 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____14153)];
      if(or__3824__auto____14154) {
        return or__3824__auto____14154
      }else {
        var or__3824__auto____14155 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____14155) {
          return or__3824__auto____14155
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____14160 = tcoll;
    if(and__3822__auto____14160) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____14160
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____14161 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____14162 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____14161)];
      if(or__3824__auto____14162) {
        return or__3824__auto____14162
      }else {
        var or__3824__auto____14163 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____14163) {
          return or__3824__auto____14163
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____14168 = x;
    if(and__3822__auto____14168) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____14168
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____14169 = x == null ? null : x;
    return function() {
      var or__3824__auto____14170 = cljs.core._compare[goog.typeOf(x__2363__auto____14169)];
      if(or__3824__auto____14170) {
        return or__3824__auto____14170
      }else {
        var or__3824__auto____14171 = cljs.core._compare["_"];
        if(or__3824__auto____14171) {
          return or__3824__auto____14171
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____14176 = coll;
    if(and__3822__auto____14176) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____14176
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____14177 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14178 = cljs.core._drop_first[goog.typeOf(x__2363__auto____14177)];
      if(or__3824__auto____14178) {
        return or__3824__auto____14178
      }else {
        var or__3824__auto____14179 = cljs.core._drop_first["_"];
        if(or__3824__auto____14179) {
          return or__3824__auto____14179
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____14184 = coll;
    if(and__3822__auto____14184) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____14184
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____14185 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14186 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____14185)];
      if(or__3824__auto____14186) {
        return or__3824__auto____14186
      }else {
        var or__3824__auto____14187 = cljs.core._chunked_first["_"];
        if(or__3824__auto____14187) {
          return or__3824__auto____14187
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____14192 = coll;
    if(and__3822__auto____14192) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____14192
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____14193 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14194 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____14193)];
      if(or__3824__auto____14194) {
        return or__3824__auto____14194
      }else {
        var or__3824__auto____14195 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____14195) {
          return or__3824__auto____14195
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____14200 = coll;
    if(and__3822__auto____14200) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____14200
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____14201 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____14202 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____14201)];
      if(or__3824__auto____14202) {
        return or__3824__auto____14202
      }else {
        var or__3824__auto____14203 = cljs.core._chunked_next["_"];
        if(or__3824__auto____14203) {
          return or__3824__auto____14203
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____14205 = x === y;
    if(or__3824__auto____14205) {
      return or__3824__auto____14205
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__14206__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__14207 = y;
            var G__14208 = cljs.core.first.call(null, more);
            var G__14209 = cljs.core.next.call(null, more);
            x = G__14207;
            y = G__14208;
            more = G__14209;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__14206 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14206__delegate.call(this, x, y, more)
    };
    G__14206.cljs$lang$maxFixedArity = 2;
    G__14206.cljs$lang$applyTo = function(arglist__14210) {
      var x = cljs.core.first(arglist__14210);
      var y = cljs.core.first(cljs.core.next(arglist__14210));
      var more = cljs.core.rest(cljs.core.next(arglist__14210));
      return G__14206__delegate(x, y, more)
    };
    G__14206.cljs$lang$arity$variadic = G__14206__delegate;
    return G__14206
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__14211 = null;
  var G__14211__2 = function(o, k) {
    return null
  };
  var G__14211__3 = function(o, k, not_found) {
    return not_found
  };
  G__14211 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14211__2.call(this, o, k);
      case 3:
        return G__14211__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14211
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__14212 = null;
  var G__14212__2 = function(_, f) {
    return f.call(null)
  };
  var G__14212__3 = function(_, f, start) {
    return start
  };
  G__14212 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14212__2.call(this, _, f);
      case 3:
        return G__14212__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14212
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__14213 = null;
  var G__14213__2 = function(_, n) {
    return null
  };
  var G__14213__3 = function(_, n, not_found) {
    return not_found
  };
  G__14213 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14213__2.call(this, _, n);
      case 3:
        return G__14213__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14213
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____14214 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____14214) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____14214
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__14227 = cljs.core._count.call(null, cicoll);
    if(cnt__14227 === 0) {
      return f.call(null)
    }else {
      var val__14228 = cljs.core._nth.call(null, cicoll, 0);
      var n__14229 = 1;
      while(true) {
        if(n__14229 < cnt__14227) {
          var nval__14230 = f.call(null, val__14228, cljs.core._nth.call(null, cicoll, n__14229));
          if(cljs.core.reduced_QMARK_.call(null, nval__14230)) {
            return cljs.core.deref.call(null, nval__14230)
          }else {
            var G__14239 = nval__14230;
            var G__14240 = n__14229 + 1;
            val__14228 = G__14239;
            n__14229 = G__14240;
            continue
          }
        }else {
          return val__14228
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__14231 = cljs.core._count.call(null, cicoll);
    var val__14232 = val;
    var n__14233 = 0;
    while(true) {
      if(n__14233 < cnt__14231) {
        var nval__14234 = f.call(null, val__14232, cljs.core._nth.call(null, cicoll, n__14233));
        if(cljs.core.reduced_QMARK_.call(null, nval__14234)) {
          return cljs.core.deref.call(null, nval__14234)
        }else {
          var G__14241 = nval__14234;
          var G__14242 = n__14233 + 1;
          val__14232 = G__14241;
          n__14233 = G__14242;
          continue
        }
      }else {
        return val__14232
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__14235 = cljs.core._count.call(null, cicoll);
    var val__14236 = val;
    var n__14237 = idx;
    while(true) {
      if(n__14237 < cnt__14235) {
        var nval__14238 = f.call(null, val__14236, cljs.core._nth.call(null, cicoll, n__14237));
        if(cljs.core.reduced_QMARK_.call(null, nval__14238)) {
          return cljs.core.deref.call(null, nval__14238)
        }else {
          var G__14243 = nval__14238;
          var G__14244 = n__14237 + 1;
          val__14236 = G__14243;
          n__14237 = G__14244;
          continue
        }
      }else {
        return val__14236
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__14257 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__14258 = arr[0];
      var n__14259 = 1;
      while(true) {
        if(n__14259 < cnt__14257) {
          var nval__14260 = f.call(null, val__14258, arr[n__14259]);
          if(cljs.core.reduced_QMARK_.call(null, nval__14260)) {
            return cljs.core.deref.call(null, nval__14260)
          }else {
            var G__14269 = nval__14260;
            var G__14270 = n__14259 + 1;
            val__14258 = G__14269;
            n__14259 = G__14270;
            continue
          }
        }else {
          return val__14258
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__14261 = arr.length;
    var val__14262 = val;
    var n__14263 = 0;
    while(true) {
      if(n__14263 < cnt__14261) {
        var nval__14264 = f.call(null, val__14262, arr[n__14263]);
        if(cljs.core.reduced_QMARK_.call(null, nval__14264)) {
          return cljs.core.deref.call(null, nval__14264)
        }else {
          var G__14271 = nval__14264;
          var G__14272 = n__14263 + 1;
          val__14262 = G__14271;
          n__14263 = G__14272;
          continue
        }
      }else {
        return val__14262
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__14265 = arr.length;
    var val__14266 = val;
    var n__14267 = idx;
    while(true) {
      if(n__14267 < cnt__14265) {
        var nval__14268 = f.call(null, val__14266, arr[n__14267]);
        if(cljs.core.reduced_QMARK_.call(null, nval__14268)) {
          return cljs.core.deref.call(null, nval__14268)
        }else {
          var G__14273 = nval__14268;
          var G__14274 = n__14267 + 1;
          val__14266 = G__14273;
          n__14267 = G__14274;
          continue
        }
      }else {
        return val__14266
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14275 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__14276 = this;
  if(this__14276.i + 1 < this__14276.a.length) {
    return new cljs.core.IndexedSeq(this__14276.a, this__14276.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14277 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__14278 = this;
  var c__14279 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__14279 > 0) {
    return new cljs.core.RSeq(coll, c__14279 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__14280 = this;
  var this__14281 = this;
  return cljs.core.pr_str.call(null, this__14281)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__14282 = this;
  if(cljs.core.counted_QMARK_.call(null, this__14282.a)) {
    return cljs.core.ci_reduce.call(null, this__14282.a, f, this__14282.a[this__14282.i], this__14282.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__14282.a[this__14282.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__14283 = this;
  if(cljs.core.counted_QMARK_.call(null, this__14283.a)) {
    return cljs.core.ci_reduce.call(null, this__14283.a, f, start, this__14283.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__14284 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__14285 = this;
  return this__14285.a.length - this__14285.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__14286 = this;
  return this__14286.a[this__14286.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__14287 = this;
  if(this__14287.i + 1 < this__14287.a.length) {
    return new cljs.core.IndexedSeq(this__14287.a, this__14287.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14288 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__14289 = this;
  var i__14290 = n + this__14289.i;
  if(i__14290 < this__14289.a.length) {
    return this__14289.a[i__14290]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__14291 = this;
  var i__14292 = n + this__14291.i;
  if(i__14292 < this__14291.a.length) {
    return this__14291.a[i__14292]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__14293 = null;
  var G__14293__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__14293__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__14293 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14293__2.call(this, array, f);
      case 3:
        return G__14293__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14293
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__14294 = null;
  var G__14294__2 = function(array, k) {
    return array[k]
  };
  var G__14294__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__14294 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14294__2.call(this, array, k);
      case 3:
        return G__14294__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14294
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__14295 = null;
  var G__14295__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__14295__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__14295 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14295__2.call(this, array, n);
      case 3:
        return G__14295__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14295
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14296 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14297 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__14298 = this;
  var this__14299 = this;
  return cljs.core.pr_str.call(null, this__14299)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14300 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14301 = this;
  return this__14301.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14302 = this;
  return cljs.core._nth.call(null, this__14302.ci, this__14302.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14303 = this;
  if(this__14303.i > 0) {
    return new cljs.core.RSeq(this__14303.ci, this__14303.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14304 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__14305 = this;
  return new cljs.core.RSeq(this__14305.ci, this__14305.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14306 = this;
  return this__14306.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__14310__14311 = coll;
      if(G__14310__14311) {
        if(function() {
          var or__3824__auto____14312 = G__14310__14311.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____14312) {
            return or__3824__auto____14312
          }else {
            return G__14310__14311.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__14310__14311.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__14310__14311)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__14310__14311)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__14317__14318 = coll;
      if(G__14317__14318) {
        if(function() {
          var or__3824__auto____14319 = G__14317__14318.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14319) {
            return or__3824__auto____14319
          }else {
            return G__14317__14318.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14317__14318.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14317__14318)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14317__14318)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__14320 = cljs.core.seq.call(null, coll);
      if(s__14320 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__14320)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__14325__14326 = coll;
      if(G__14325__14326) {
        if(function() {
          var or__3824__auto____14327 = G__14325__14326.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14327) {
            return or__3824__auto____14327
          }else {
            return G__14325__14326.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14325__14326.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14325__14326)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14325__14326)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__14328 = cljs.core.seq.call(null, coll);
      if(!(s__14328 == null)) {
        return cljs.core._rest.call(null, s__14328)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__14332__14333 = coll;
      if(G__14332__14333) {
        if(function() {
          var or__3824__auto____14334 = G__14332__14333.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____14334) {
            return or__3824__auto____14334
          }else {
            return G__14332__14333.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__14332__14333.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__14332__14333)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__14332__14333)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__14336 = cljs.core.next.call(null, s);
    if(!(sn__14336 == null)) {
      var G__14337 = sn__14336;
      s = G__14337;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__14338__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__14339 = conj.call(null, coll, x);
          var G__14340 = cljs.core.first.call(null, xs);
          var G__14341 = cljs.core.next.call(null, xs);
          coll = G__14339;
          x = G__14340;
          xs = G__14341;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__14338 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14338__delegate.call(this, coll, x, xs)
    };
    G__14338.cljs$lang$maxFixedArity = 2;
    G__14338.cljs$lang$applyTo = function(arglist__14342) {
      var coll = cljs.core.first(arglist__14342);
      var x = cljs.core.first(cljs.core.next(arglist__14342));
      var xs = cljs.core.rest(cljs.core.next(arglist__14342));
      return G__14338__delegate(coll, x, xs)
    };
    G__14338.cljs$lang$arity$variadic = G__14338__delegate;
    return G__14338
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__14345 = cljs.core.seq.call(null, coll);
  var acc__14346 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__14345)) {
      return acc__14346 + cljs.core._count.call(null, s__14345)
    }else {
      var G__14347 = cljs.core.next.call(null, s__14345);
      var G__14348 = acc__14346 + 1;
      s__14345 = G__14347;
      acc__14346 = G__14348;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__14355__14356 = coll;
        if(G__14355__14356) {
          if(function() {
            var or__3824__auto____14357 = G__14355__14356.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____14357) {
              return or__3824__auto____14357
            }else {
              return G__14355__14356.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__14355__14356.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14355__14356)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14355__14356)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__14358__14359 = coll;
        if(G__14358__14359) {
          if(function() {
            var or__3824__auto____14360 = G__14358__14359.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____14360) {
              return or__3824__auto____14360
            }else {
              return G__14358__14359.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__14358__14359.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14358__14359)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14358__14359)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__14363__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__14362 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__14364 = ret__14362;
          var G__14365 = cljs.core.first.call(null, kvs);
          var G__14366 = cljs.core.second.call(null, kvs);
          var G__14367 = cljs.core.nnext.call(null, kvs);
          coll = G__14364;
          k = G__14365;
          v = G__14366;
          kvs = G__14367;
          continue
        }else {
          return ret__14362
        }
        break
      }
    };
    var G__14363 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14363__delegate.call(this, coll, k, v, kvs)
    };
    G__14363.cljs$lang$maxFixedArity = 3;
    G__14363.cljs$lang$applyTo = function(arglist__14368) {
      var coll = cljs.core.first(arglist__14368);
      var k = cljs.core.first(cljs.core.next(arglist__14368));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14368)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14368)));
      return G__14363__delegate(coll, k, v, kvs)
    };
    G__14363.cljs$lang$arity$variadic = G__14363__delegate;
    return G__14363
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__14371__delegate = function(coll, k, ks) {
      while(true) {
        var ret__14370 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__14372 = ret__14370;
          var G__14373 = cljs.core.first.call(null, ks);
          var G__14374 = cljs.core.next.call(null, ks);
          coll = G__14372;
          k = G__14373;
          ks = G__14374;
          continue
        }else {
          return ret__14370
        }
        break
      }
    };
    var G__14371 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14371__delegate.call(this, coll, k, ks)
    };
    G__14371.cljs$lang$maxFixedArity = 2;
    G__14371.cljs$lang$applyTo = function(arglist__14375) {
      var coll = cljs.core.first(arglist__14375);
      var k = cljs.core.first(cljs.core.next(arglist__14375));
      var ks = cljs.core.rest(cljs.core.next(arglist__14375));
      return G__14371__delegate(coll, k, ks)
    };
    G__14371.cljs$lang$arity$variadic = G__14371__delegate;
    return G__14371
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__14379__14380 = o;
    if(G__14379__14380) {
      if(function() {
        var or__3824__auto____14381 = G__14379__14380.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____14381) {
          return or__3824__auto____14381
        }else {
          return G__14379__14380.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__14379__14380.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__14379__14380)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__14379__14380)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__14384__delegate = function(coll, k, ks) {
      while(true) {
        var ret__14383 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__14385 = ret__14383;
          var G__14386 = cljs.core.first.call(null, ks);
          var G__14387 = cljs.core.next.call(null, ks);
          coll = G__14385;
          k = G__14386;
          ks = G__14387;
          continue
        }else {
          return ret__14383
        }
        break
      }
    };
    var G__14384 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14384__delegate.call(this, coll, k, ks)
    };
    G__14384.cljs$lang$maxFixedArity = 2;
    G__14384.cljs$lang$applyTo = function(arglist__14388) {
      var coll = cljs.core.first(arglist__14388);
      var k = cljs.core.first(cljs.core.next(arglist__14388));
      var ks = cljs.core.rest(cljs.core.next(arglist__14388));
      return G__14384__delegate(coll, k, ks)
    };
    G__14384.cljs$lang$arity$variadic = G__14384__delegate;
    return G__14384
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__14390 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__14390;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__14390
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__14392 = cljs.core.string_hash_cache[k];
  if(!(h__14392 == null)) {
    return h__14392
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____14394 = goog.isString(o);
      if(and__3822__auto____14394) {
        return check_cache
      }else {
        return and__3822__auto____14394
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__14398__14399 = x;
    if(G__14398__14399) {
      if(function() {
        var or__3824__auto____14400 = G__14398__14399.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____14400) {
          return or__3824__auto____14400
        }else {
          return G__14398__14399.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__14398__14399.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__14398__14399)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__14398__14399)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__14404__14405 = x;
    if(G__14404__14405) {
      if(function() {
        var or__3824__auto____14406 = G__14404__14405.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____14406) {
          return or__3824__auto____14406
        }else {
          return G__14404__14405.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__14404__14405.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__14404__14405)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__14404__14405)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__14410__14411 = x;
  if(G__14410__14411) {
    if(function() {
      var or__3824__auto____14412 = G__14410__14411.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____14412) {
        return or__3824__auto____14412
      }else {
        return G__14410__14411.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__14410__14411.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__14410__14411)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__14410__14411)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__14416__14417 = x;
  if(G__14416__14417) {
    if(function() {
      var or__3824__auto____14418 = G__14416__14417.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____14418) {
        return or__3824__auto____14418
      }else {
        return G__14416__14417.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__14416__14417.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__14416__14417)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__14416__14417)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__14422__14423 = x;
  if(G__14422__14423) {
    if(function() {
      var or__3824__auto____14424 = G__14422__14423.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____14424) {
        return or__3824__auto____14424
      }else {
        return G__14422__14423.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__14422__14423.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__14422__14423)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__14422__14423)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__14428__14429 = x;
  if(G__14428__14429) {
    if(function() {
      var or__3824__auto____14430 = G__14428__14429.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____14430) {
        return or__3824__auto____14430
      }else {
        return G__14428__14429.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__14428__14429.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14428__14429)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__14428__14429)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__14434__14435 = x;
  if(G__14434__14435) {
    if(function() {
      var or__3824__auto____14436 = G__14434__14435.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____14436) {
        return or__3824__auto____14436
      }else {
        return G__14434__14435.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__14434__14435.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14434__14435)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14434__14435)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__14440__14441 = x;
    if(G__14440__14441) {
      if(function() {
        var or__3824__auto____14442 = G__14440__14441.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____14442) {
          return or__3824__auto____14442
        }else {
          return G__14440__14441.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__14440__14441.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__14440__14441)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__14440__14441)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__14446__14447 = x;
  if(G__14446__14447) {
    if(function() {
      var or__3824__auto____14448 = G__14446__14447.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____14448) {
        return or__3824__auto____14448
      }else {
        return G__14446__14447.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__14446__14447.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__14446__14447)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__14446__14447)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__14452__14453 = x;
  if(G__14452__14453) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____14454 = null;
      if(cljs.core.truth_(or__3824__auto____14454)) {
        return or__3824__auto____14454
      }else {
        return G__14452__14453.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__14452__14453.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__14452__14453)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__14452__14453)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__14455__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__14455 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__14455__delegate.call(this, keyvals)
    };
    G__14455.cljs$lang$maxFixedArity = 0;
    G__14455.cljs$lang$applyTo = function(arglist__14456) {
      var keyvals = cljs.core.seq(arglist__14456);
      return G__14455__delegate(keyvals)
    };
    G__14455.cljs$lang$arity$variadic = G__14455__delegate;
    return G__14455
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__14458 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__14458.push(key)
  });
  return keys__14458
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__14462 = i;
  var j__14463 = j;
  var len__14464 = len;
  while(true) {
    if(len__14464 === 0) {
      return to
    }else {
      to[j__14463] = from[i__14462];
      var G__14465 = i__14462 + 1;
      var G__14466 = j__14463 + 1;
      var G__14467 = len__14464 - 1;
      i__14462 = G__14465;
      j__14463 = G__14466;
      len__14464 = G__14467;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__14471 = i + (len - 1);
  var j__14472 = j + (len - 1);
  var len__14473 = len;
  while(true) {
    if(len__14473 === 0) {
      return to
    }else {
      to[j__14472] = from[i__14471];
      var G__14474 = i__14471 - 1;
      var G__14475 = j__14472 - 1;
      var G__14476 = len__14473 - 1;
      i__14471 = G__14474;
      j__14472 = G__14475;
      len__14473 = G__14476;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__14480__14481 = s;
    if(G__14480__14481) {
      if(function() {
        var or__3824__auto____14482 = G__14480__14481.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____14482) {
          return or__3824__auto____14482
        }else {
          return G__14480__14481.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__14480__14481.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14480__14481)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14480__14481)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__14486__14487 = s;
  if(G__14486__14487) {
    if(function() {
      var or__3824__auto____14488 = G__14486__14487.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____14488) {
        return or__3824__auto____14488
      }else {
        return G__14486__14487.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__14486__14487.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__14486__14487)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__14486__14487)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____14491 = goog.isString(x);
  if(and__3822__auto____14491) {
    return!function() {
      var or__3824__auto____14492 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____14492) {
        return or__3824__auto____14492
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____14491
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____14494 = goog.isString(x);
  if(and__3822__auto____14494) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____14494
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____14496 = goog.isString(x);
  if(and__3822__auto____14496) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____14496
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____14501 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____14501) {
    return or__3824__auto____14501
  }else {
    var G__14502__14503 = f;
    if(G__14502__14503) {
      if(function() {
        var or__3824__auto____14504 = G__14502__14503.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____14504) {
          return or__3824__auto____14504
        }else {
          return G__14502__14503.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__14502__14503.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__14502__14503)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__14502__14503)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____14506 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____14506) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____14506
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14509 = coll;
    if(cljs.core.truth_(and__3822__auto____14509)) {
      var and__3822__auto____14510 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____14510) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____14510
      }
    }else {
      return and__3822__auto____14509
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__14519__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__14515 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__14516 = more;
        while(true) {
          var x__14517 = cljs.core.first.call(null, xs__14516);
          var etc__14518 = cljs.core.next.call(null, xs__14516);
          if(cljs.core.truth_(xs__14516)) {
            if(cljs.core.contains_QMARK_.call(null, s__14515, x__14517)) {
              return false
            }else {
              var G__14520 = cljs.core.conj.call(null, s__14515, x__14517);
              var G__14521 = etc__14518;
              s__14515 = G__14520;
              xs__14516 = G__14521;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__14519 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14519__delegate.call(this, x, y, more)
    };
    G__14519.cljs$lang$maxFixedArity = 2;
    G__14519.cljs$lang$applyTo = function(arglist__14522) {
      var x = cljs.core.first(arglist__14522);
      var y = cljs.core.first(cljs.core.next(arglist__14522));
      var more = cljs.core.rest(cljs.core.next(arglist__14522));
      return G__14519__delegate(x, y, more)
    };
    G__14519.cljs$lang$arity$variadic = G__14519__delegate;
    return G__14519
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__14526__14527 = x;
            if(G__14526__14527) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____14528 = null;
                if(cljs.core.truth_(or__3824__auto____14528)) {
                  return or__3824__auto____14528
                }else {
                  return G__14526__14527.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__14526__14527.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__14526__14527)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__14526__14527)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__14533 = cljs.core.count.call(null, xs);
    var yl__14534 = cljs.core.count.call(null, ys);
    if(xl__14533 < yl__14534) {
      return-1
    }else {
      if(xl__14533 > yl__14534) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__14533, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__14535 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____14536 = d__14535 === 0;
        if(and__3822__auto____14536) {
          return n + 1 < len
        }else {
          return and__3822__auto____14536
        }
      }()) {
        var G__14537 = xs;
        var G__14538 = ys;
        var G__14539 = len;
        var G__14540 = n + 1;
        xs = G__14537;
        ys = G__14538;
        len = G__14539;
        n = G__14540;
        continue
      }else {
        return d__14535
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__14542 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__14542)) {
        return r__14542
      }else {
        if(cljs.core.truth_(r__14542)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__14544 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__14544, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__14544)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____14550 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____14550) {
      var s__14551 = temp__3971__auto____14550;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__14551), cljs.core.next.call(null, s__14551))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__14552 = val;
    var coll__14553 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__14553) {
        var nval__14554 = f.call(null, val__14552, cljs.core.first.call(null, coll__14553));
        if(cljs.core.reduced_QMARK_.call(null, nval__14554)) {
          return cljs.core.deref.call(null, nval__14554)
        }else {
          var G__14555 = nval__14554;
          var G__14556 = cljs.core.next.call(null, coll__14553);
          val__14552 = G__14555;
          coll__14553 = G__14556;
          continue
        }
      }else {
        return val__14552
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__14558 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__14558);
  return cljs.core.vec.call(null, a__14558)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__14565__14566 = coll;
      if(G__14565__14566) {
        if(function() {
          var or__3824__auto____14567 = G__14565__14566.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____14567) {
            return or__3824__auto____14567
          }else {
            return G__14565__14566.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__14565__14566.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14565__14566)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14565__14566)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__14568__14569 = coll;
      if(G__14568__14569) {
        if(function() {
          var or__3824__auto____14570 = G__14568__14569.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____14570) {
            return or__3824__auto____14570
          }else {
            return G__14568__14569.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__14568__14569.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14568__14569)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__14568__14569)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__14571 = this;
  return this__14571.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__14572__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__14572 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14572__delegate.call(this, x, y, more)
    };
    G__14572.cljs$lang$maxFixedArity = 2;
    G__14572.cljs$lang$applyTo = function(arglist__14573) {
      var x = cljs.core.first(arglist__14573);
      var y = cljs.core.first(cljs.core.next(arglist__14573));
      var more = cljs.core.rest(cljs.core.next(arglist__14573));
      return G__14572__delegate(x, y, more)
    };
    G__14572.cljs$lang$arity$variadic = G__14572__delegate;
    return G__14572
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__14574__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__14574 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14574__delegate.call(this, x, y, more)
    };
    G__14574.cljs$lang$maxFixedArity = 2;
    G__14574.cljs$lang$applyTo = function(arglist__14575) {
      var x = cljs.core.first(arglist__14575);
      var y = cljs.core.first(cljs.core.next(arglist__14575));
      var more = cljs.core.rest(cljs.core.next(arglist__14575));
      return G__14574__delegate(x, y, more)
    };
    G__14574.cljs$lang$arity$variadic = G__14574__delegate;
    return G__14574
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__14576__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__14576 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14576__delegate.call(this, x, y, more)
    };
    G__14576.cljs$lang$maxFixedArity = 2;
    G__14576.cljs$lang$applyTo = function(arglist__14577) {
      var x = cljs.core.first(arglist__14577);
      var y = cljs.core.first(cljs.core.next(arglist__14577));
      var more = cljs.core.rest(cljs.core.next(arglist__14577));
      return G__14576__delegate(x, y, more)
    };
    G__14576.cljs$lang$arity$variadic = G__14576__delegate;
    return G__14576
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__14578__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__14578 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14578__delegate.call(this, x, y, more)
    };
    G__14578.cljs$lang$maxFixedArity = 2;
    G__14578.cljs$lang$applyTo = function(arglist__14579) {
      var x = cljs.core.first(arglist__14579);
      var y = cljs.core.first(cljs.core.next(arglist__14579));
      var more = cljs.core.rest(cljs.core.next(arglist__14579));
      return G__14578__delegate(x, y, more)
    };
    G__14578.cljs$lang$arity$variadic = G__14578__delegate;
    return G__14578
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__14580__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__14581 = y;
            var G__14582 = cljs.core.first.call(null, more);
            var G__14583 = cljs.core.next.call(null, more);
            x = G__14581;
            y = G__14582;
            more = G__14583;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__14580 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14580__delegate.call(this, x, y, more)
    };
    G__14580.cljs$lang$maxFixedArity = 2;
    G__14580.cljs$lang$applyTo = function(arglist__14584) {
      var x = cljs.core.first(arglist__14584);
      var y = cljs.core.first(cljs.core.next(arglist__14584));
      var more = cljs.core.rest(cljs.core.next(arglist__14584));
      return G__14580__delegate(x, y, more)
    };
    G__14580.cljs$lang$arity$variadic = G__14580__delegate;
    return G__14580
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__14585__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__14586 = y;
            var G__14587 = cljs.core.first.call(null, more);
            var G__14588 = cljs.core.next.call(null, more);
            x = G__14586;
            y = G__14587;
            more = G__14588;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__14585 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14585__delegate.call(this, x, y, more)
    };
    G__14585.cljs$lang$maxFixedArity = 2;
    G__14585.cljs$lang$applyTo = function(arglist__14589) {
      var x = cljs.core.first(arglist__14589);
      var y = cljs.core.first(cljs.core.next(arglist__14589));
      var more = cljs.core.rest(cljs.core.next(arglist__14589));
      return G__14585__delegate(x, y, more)
    };
    G__14585.cljs$lang$arity$variadic = G__14585__delegate;
    return G__14585
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__14590__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__14591 = y;
            var G__14592 = cljs.core.first.call(null, more);
            var G__14593 = cljs.core.next.call(null, more);
            x = G__14591;
            y = G__14592;
            more = G__14593;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__14590 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14590__delegate.call(this, x, y, more)
    };
    G__14590.cljs$lang$maxFixedArity = 2;
    G__14590.cljs$lang$applyTo = function(arglist__14594) {
      var x = cljs.core.first(arglist__14594);
      var y = cljs.core.first(cljs.core.next(arglist__14594));
      var more = cljs.core.rest(cljs.core.next(arglist__14594));
      return G__14590__delegate(x, y, more)
    };
    G__14590.cljs$lang$arity$variadic = G__14590__delegate;
    return G__14590
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__14595__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__14596 = y;
            var G__14597 = cljs.core.first.call(null, more);
            var G__14598 = cljs.core.next.call(null, more);
            x = G__14596;
            y = G__14597;
            more = G__14598;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__14595 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14595__delegate.call(this, x, y, more)
    };
    G__14595.cljs$lang$maxFixedArity = 2;
    G__14595.cljs$lang$applyTo = function(arglist__14599) {
      var x = cljs.core.first(arglist__14599);
      var y = cljs.core.first(cljs.core.next(arglist__14599));
      var more = cljs.core.rest(cljs.core.next(arglist__14599));
      return G__14595__delegate(x, y, more)
    };
    G__14595.cljs$lang$arity$variadic = G__14595__delegate;
    return G__14595
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__14600__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__14600 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14600__delegate.call(this, x, y, more)
    };
    G__14600.cljs$lang$maxFixedArity = 2;
    G__14600.cljs$lang$applyTo = function(arglist__14601) {
      var x = cljs.core.first(arglist__14601);
      var y = cljs.core.first(cljs.core.next(arglist__14601));
      var more = cljs.core.rest(cljs.core.next(arglist__14601));
      return G__14600__delegate(x, y, more)
    };
    G__14600.cljs$lang$arity$variadic = G__14600__delegate;
    return G__14600
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__14602__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__14602 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14602__delegate.call(this, x, y, more)
    };
    G__14602.cljs$lang$maxFixedArity = 2;
    G__14602.cljs$lang$applyTo = function(arglist__14603) {
      var x = cljs.core.first(arglist__14603);
      var y = cljs.core.first(cljs.core.next(arglist__14603));
      var more = cljs.core.rest(cljs.core.next(arglist__14603));
      return G__14602__delegate(x, y, more)
    };
    G__14602.cljs$lang$arity$variadic = G__14602__delegate;
    return G__14602
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__14605 = n % d;
  return cljs.core.fix.call(null, (n - rem__14605) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__14607 = cljs.core.quot.call(null, n, d);
  return n - d * q__14607
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__14610 = v - (v >> 1 & 1431655765);
  var v__14611 = (v__14610 & 858993459) + (v__14610 >> 2 & 858993459);
  return(v__14611 + (v__14611 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__14612__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__14613 = y;
            var G__14614 = cljs.core.first.call(null, more);
            var G__14615 = cljs.core.next.call(null, more);
            x = G__14613;
            y = G__14614;
            more = G__14615;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__14612 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14612__delegate.call(this, x, y, more)
    };
    G__14612.cljs$lang$maxFixedArity = 2;
    G__14612.cljs$lang$applyTo = function(arglist__14616) {
      var x = cljs.core.first(arglist__14616);
      var y = cljs.core.first(cljs.core.next(arglist__14616));
      var more = cljs.core.rest(cljs.core.next(arglist__14616));
      return G__14612__delegate(x, y, more)
    };
    G__14612.cljs$lang$arity$variadic = G__14612__delegate;
    return G__14612
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__14620 = n;
  var xs__14621 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14622 = xs__14621;
      if(and__3822__auto____14622) {
        return n__14620 > 0
      }else {
        return and__3822__auto____14622
      }
    }())) {
      var G__14623 = n__14620 - 1;
      var G__14624 = cljs.core.next.call(null, xs__14621);
      n__14620 = G__14623;
      xs__14621 = G__14624;
      continue
    }else {
      return xs__14621
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__14625__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__14626 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__14627 = cljs.core.next.call(null, more);
            sb = G__14626;
            more = G__14627;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__14625 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14625__delegate.call(this, x, ys)
    };
    G__14625.cljs$lang$maxFixedArity = 1;
    G__14625.cljs$lang$applyTo = function(arglist__14628) {
      var x = cljs.core.first(arglist__14628);
      var ys = cljs.core.rest(arglist__14628);
      return G__14625__delegate(x, ys)
    };
    G__14625.cljs$lang$arity$variadic = G__14625__delegate;
    return G__14625
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__14629__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__14630 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__14631 = cljs.core.next.call(null, more);
            sb = G__14630;
            more = G__14631;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__14629 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14629__delegate.call(this, x, ys)
    };
    G__14629.cljs$lang$maxFixedArity = 1;
    G__14629.cljs$lang$applyTo = function(arglist__14632) {
      var x = cljs.core.first(arglist__14632);
      var ys = cljs.core.rest(arglist__14632);
      return G__14629__delegate(x, ys)
    };
    G__14629.cljs$lang$arity$variadic = G__14629__delegate;
    return G__14629
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__14633) {
    var fmt = cljs.core.first(arglist__14633);
    var args = cljs.core.rest(arglist__14633);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__14636 = cljs.core.seq.call(null, x);
    var ys__14637 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__14636 == null) {
        return ys__14637 == null
      }else {
        if(ys__14637 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__14636), cljs.core.first.call(null, ys__14637))) {
            var G__14638 = cljs.core.next.call(null, xs__14636);
            var G__14639 = cljs.core.next.call(null, ys__14637);
            xs__14636 = G__14638;
            ys__14637 = G__14639;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__14640_SHARP_, p2__14641_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__14640_SHARP_, cljs.core.hash.call(null, p2__14641_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__14645 = 0;
  var s__14646 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__14646) {
      var e__14647 = cljs.core.first.call(null, s__14646);
      var G__14648 = (h__14645 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__14647)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__14647)))) % 4503599627370496;
      var G__14649 = cljs.core.next.call(null, s__14646);
      h__14645 = G__14648;
      s__14646 = G__14649;
      continue
    }else {
      return h__14645
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__14653 = 0;
  var s__14654 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__14654) {
      var e__14655 = cljs.core.first.call(null, s__14654);
      var G__14656 = (h__14653 + cljs.core.hash.call(null, e__14655)) % 4503599627370496;
      var G__14657 = cljs.core.next.call(null, s__14654);
      h__14653 = G__14656;
      s__14654 = G__14657;
      continue
    }else {
      return h__14653
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__14678__14679 = cljs.core.seq.call(null, fn_map);
  if(G__14678__14679) {
    var G__14681__14683 = cljs.core.first.call(null, G__14678__14679);
    var vec__14682__14684 = G__14681__14683;
    var key_name__14685 = cljs.core.nth.call(null, vec__14682__14684, 0, null);
    var f__14686 = cljs.core.nth.call(null, vec__14682__14684, 1, null);
    var G__14678__14687 = G__14678__14679;
    var G__14681__14688 = G__14681__14683;
    var G__14678__14689 = G__14678__14687;
    while(true) {
      var vec__14690__14691 = G__14681__14688;
      var key_name__14692 = cljs.core.nth.call(null, vec__14690__14691, 0, null);
      var f__14693 = cljs.core.nth.call(null, vec__14690__14691, 1, null);
      var G__14678__14694 = G__14678__14689;
      var str_name__14695 = cljs.core.name.call(null, key_name__14692);
      obj[str_name__14695] = f__14693;
      var temp__3974__auto____14696 = cljs.core.next.call(null, G__14678__14694);
      if(temp__3974__auto____14696) {
        var G__14678__14697 = temp__3974__auto____14696;
        var G__14698 = cljs.core.first.call(null, G__14678__14697);
        var G__14699 = G__14678__14697;
        G__14681__14688 = G__14698;
        G__14678__14689 = G__14699;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14700 = this;
  var h__2192__auto____14701 = this__14700.__hash;
  if(!(h__2192__auto____14701 == null)) {
    return h__2192__auto____14701
  }else {
    var h__2192__auto____14702 = cljs.core.hash_coll.call(null, coll);
    this__14700.__hash = h__2192__auto____14702;
    return h__2192__auto____14702
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14703 = this;
  if(this__14703.count === 1) {
    return null
  }else {
    return this__14703.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14704 = this;
  return new cljs.core.List(this__14704.meta, o, coll, this__14704.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__14705 = this;
  var this__14706 = this;
  return cljs.core.pr_str.call(null, this__14706)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14707 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14708 = this;
  return this__14708.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14709 = this;
  return this__14709.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14710 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14711 = this;
  return this__14711.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14712 = this;
  if(this__14712.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__14712.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14713 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14714 = this;
  return new cljs.core.List(meta, this__14714.first, this__14714.rest, this__14714.count, this__14714.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14715 = this;
  return this__14715.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14716 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14717 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14718 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14719 = this;
  return new cljs.core.List(this__14719.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__14720 = this;
  var this__14721 = this;
  return cljs.core.pr_str.call(null, this__14721)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14722 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14723 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14724 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14725 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14726 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14727 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14728 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14729 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14730 = this;
  return this__14730.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14731 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__14735__14736 = coll;
  if(G__14735__14736) {
    if(function() {
      var or__3824__auto____14737 = G__14735__14736.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____14737) {
        return or__3824__auto____14737
      }else {
        return G__14735__14736.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__14735__14736.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__14735__14736)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__14735__14736)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__14738__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__14738 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14738__delegate.call(this, x, y, z, items)
    };
    G__14738.cljs$lang$maxFixedArity = 3;
    G__14738.cljs$lang$applyTo = function(arglist__14739) {
      var x = cljs.core.first(arglist__14739);
      var y = cljs.core.first(cljs.core.next(arglist__14739));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14739)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14739)));
      return G__14738__delegate(x, y, z, items)
    };
    G__14738.cljs$lang$arity$variadic = G__14738__delegate;
    return G__14738
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14740 = this;
  var h__2192__auto____14741 = this__14740.__hash;
  if(!(h__2192__auto____14741 == null)) {
    return h__2192__auto____14741
  }else {
    var h__2192__auto____14742 = cljs.core.hash_coll.call(null, coll);
    this__14740.__hash = h__2192__auto____14742;
    return h__2192__auto____14742
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14743 = this;
  if(this__14743.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__14743.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14744 = this;
  return new cljs.core.Cons(null, o, coll, this__14744.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__14745 = this;
  var this__14746 = this;
  return cljs.core.pr_str.call(null, this__14746)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14747 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14748 = this;
  return this__14748.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14749 = this;
  if(this__14749.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__14749.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14750 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14751 = this;
  return new cljs.core.Cons(meta, this__14751.first, this__14751.rest, this__14751.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14752 = this;
  return this__14752.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14753 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14753.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____14758 = coll == null;
    if(or__3824__auto____14758) {
      return or__3824__auto____14758
    }else {
      var G__14759__14760 = coll;
      if(G__14759__14760) {
        if(function() {
          var or__3824__auto____14761 = G__14759__14760.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14761) {
            return or__3824__auto____14761
          }else {
            return G__14759__14760.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14759__14760.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14759__14760)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14759__14760)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__14765__14766 = x;
  if(G__14765__14766) {
    if(function() {
      var or__3824__auto____14767 = G__14765__14766.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____14767) {
        return or__3824__auto____14767
      }else {
        return G__14765__14766.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__14765__14766.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__14765__14766)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__14765__14766)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__14768 = null;
  var G__14768__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__14768__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__14768 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14768__2.call(this, string, f);
      case 3:
        return G__14768__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14768
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__14769 = null;
  var G__14769__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__14769__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__14769 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14769__2.call(this, string, k);
      case 3:
        return G__14769__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14769
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__14770 = null;
  var G__14770__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__14770__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__14770 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14770__2.call(this, string, n);
      case 3:
        return G__14770__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14770
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__14782 = null;
  var G__14782__2 = function(this_sym14773, coll) {
    var this__14775 = this;
    var this_sym14773__14776 = this;
    var ___14777 = this_sym14773__14776;
    if(coll == null) {
      return null
    }else {
      var strobj__14778 = coll.strobj;
      if(strobj__14778 == null) {
        return cljs.core._lookup.call(null, coll, this__14775.k, null)
      }else {
        return strobj__14778[this__14775.k]
      }
    }
  };
  var G__14782__3 = function(this_sym14774, coll, not_found) {
    var this__14775 = this;
    var this_sym14774__14779 = this;
    var ___14780 = this_sym14774__14779;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__14775.k, not_found)
    }
  };
  G__14782 = function(this_sym14774, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14782__2.call(this, this_sym14774, coll);
      case 3:
        return G__14782__3.call(this, this_sym14774, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14782
}();
cljs.core.Keyword.prototype.apply = function(this_sym14771, args14772) {
  var this__14781 = this;
  return this_sym14771.call.apply(this_sym14771, [this_sym14771].concat(args14772.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__14791 = null;
  var G__14791__2 = function(this_sym14785, coll) {
    var this_sym14785__14787 = this;
    var this__14788 = this_sym14785__14787;
    return cljs.core._lookup.call(null, coll, this__14788.toString(), null)
  };
  var G__14791__3 = function(this_sym14786, coll, not_found) {
    var this_sym14786__14789 = this;
    var this__14790 = this_sym14786__14789;
    return cljs.core._lookup.call(null, coll, this__14790.toString(), not_found)
  };
  G__14791 = function(this_sym14786, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14791__2.call(this, this_sym14786, coll);
      case 3:
        return G__14791__3.call(this, this_sym14786, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14791
}();
String.prototype.apply = function(this_sym14783, args14784) {
  return this_sym14783.call.apply(this_sym14783, [this_sym14783].concat(args14784.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__14793 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__14793
  }else {
    lazy_seq.x = x__14793.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14794 = this;
  var h__2192__auto____14795 = this__14794.__hash;
  if(!(h__2192__auto____14795 == null)) {
    return h__2192__auto____14795
  }else {
    var h__2192__auto____14796 = cljs.core.hash_coll.call(null, coll);
    this__14794.__hash = h__2192__auto____14796;
    return h__2192__auto____14796
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__14797 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14798 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__14799 = this;
  var this__14800 = this;
  return cljs.core.pr_str.call(null, this__14800)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14801 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14802 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14803 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14804 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14805 = this;
  return new cljs.core.LazySeq(meta, this__14805.realized, this__14805.x, this__14805.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14806 = this;
  return this__14806.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14807 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14807.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__14808 = this;
  return this__14808.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__14809 = this;
  var ___14810 = this;
  this__14809.buf[this__14809.end] = o;
  return this__14809.end = this__14809.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__14811 = this;
  var ___14812 = this;
  var ret__14813 = new cljs.core.ArrayChunk(this__14811.buf, 0, this__14811.end);
  this__14811.buf = null;
  return ret__14813
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__14814 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__14814.arr[this__14814.off], this__14814.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__14815 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__14815.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__14816 = this;
  if(this__14816.off === this__14816.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__14816.arr, this__14816.off + 1, this__14816.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__14817 = this;
  return this__14817.arr[this__14817.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__14818 = this;
  if(function() {
    var and__3822__auto____14819 = i >= 0;
    if(and__3822__auto____14819) {
      return i < this__14818.end - this__14818.off
    }else {
      return and__3822__auto____14819
    }
  }()) {
    return this__14818.arr[this__14818.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__14820 = this;
  return this__14820.end - this__14820.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__14821 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14822 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14823 = this;
  return cljs.core._nth.call(null, this__14823.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14824 = this;
  if(cljs.core._count.call(null, this__14824.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__14824.chunk), this__14824.more, this__14824.meta)
  }else {
    if(this__14824.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__14824.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__14825 = this;
  if(this__14825.more == null) {
    return null
  }else {
    return this__14825.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14826 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__14827 = this;
  return new cljs.core.ChunkedCons(this__14827.chunk, this__14827.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14828 = this;
  return this__14828.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__14829 = this;
  return this__14829.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__14830 = this;
  if(this__14830.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__14830.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__14834__14835 = s;
    if(G__14834__14835) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____14836 = null;
        if(cljs.core.truth_(or__3824__auto____14836)) {
          return or__3824__auto____14836
        }else {
          return G__14834__14835.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__14834__14835.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__14834__14835)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__14834__14835)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__14839 = [];
  var s__14840 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__14840)) {
      ary__14839.push(cljs.core.first.call(null, s__14840));
      var G__14841 = cljs.core.next.call(null, s__14840);
      s__14840 = G__14841;
      continue
    }else {
      return ary__14839
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__14845 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__14846 = 0;
  var xs__14847 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__14847) {
      ret__14845[i__14846] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__14847));
      var G__14848 = i__14846 + 1;
      var G__14849 = cljs.core.next.call(null, xs__14847);
      i__14846 = G__14848;
      xs__14847 = G__14849;
      continue
    }else {
    }
    break
  }
  return ret__14845
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__14857 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14858 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14859 = 0;
      var s__14860 = s__14858;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14861 = s__14860;
          if(and__3822__auto____14861) {
            return i__14859 < size
          }else {
            return and__3822__auto____14861
          }
        }())) {
          a__14857[i__14859] = cljs.core.first.call(null, s__14860);
          var G__14864 = i__14859 + 1;
          var G__14865 = cljs.core.next.call(null, s__14860);
          i__14859 = G__14864;
          s__14860 = G__14865;
          continue
        }else {
          return a__14857
        }
        break
      }
    }else {
      var n__2527__auto____14862 = size;
      var i__14863 = 0;
      while(true) {
        if(i__14863 < n__2527__auto____14862) {
          a__14857[i__14863] = init_val_or_seq;
          var G__14866 = i__14863 + 1;
          i__14863 = G__14866;
          continue
        }else {
        }
        break
      }
      return a__14857
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__14874 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14875 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14876 = 0;
      var s__14877 = s__14875;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14878 = s__14877;
          if(and__3822__auto____14878) {
            return i__14876 < size
          }else {
            return and__3822__auto____14878
          }
        }())) {
          a__14874[i__14876] = cljs.core.first.call(null, s__14877);
          var G__14881 = i__14876 + 1;
          var G__14882 = cljs.core.next.call(null, s__14877);
          i__14876 = G__14881;
          s__14877 = G__14882;
          continue
        }else {
          return a__14874
        }
        break
      }
    }else {
      var n__2527__auto____14879 = size;
      var i__14880 = 0;
      while(true) {
        if(i__14880 < n__2527__auto____14879) {
          a__14874[i__14880] = init_val_or_seq;
          var G__14883 = i__14880 + 1;
          i__14880 = G__14883;
          continue
        }else {
        }
        break
      }
      return a__14874
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__14891 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14892 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14893 = 0;
      var s__14894 = s__14892;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14895 = s__14894;
          if(and__3822__auto____14895) {
            return i__14893 < size
          }else {
            return and__3822__auto____14895
          }
        }())) {
          a__14891[i__14893] = cljs.core.first.call(null, s__14894);
          var G__14898 = i__14893 + 1;
          var G__14899 = cljs.core.next.call(null, s__14894);
          i__14893 = G__14898;
          s__14894 = G__14899;
          continue
        }else {
          return a__14891
        }
        break
      }
    }else {
      var n__2527__auto____14896 = size;
      var i__14897 = 0;
      while(true) {
        if(i__14897 < n__2527__auto____14896) {
          a__14891[i__14897] = init_val_or_seq;
          var G__14900 = i__14897 + 1;
          i__14897 = G__14900;
          continue
        }else {
        }
        break
      }
      return a__14891
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__14905 = s;
    var i__14906 = n;
    var sum__14907 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____14908 = i__14906 > 0;
        if(and__3822__auto____14908) {
          return cljs.core.seq.call(null, s__14905)
        }else {
          return and__3822__auto____14908
        }
      }())) {
        var G__14909 = cljs.core.next.call(null, s__14905);
        var G__14910 = i__14906 - 1;
        var G__14911 = sum__14907 + 1;
        s__14905 = G__14909;
        i__14906 = G__14910;
        sum__14907 = G__14911;
        continue
      }else {
        return sum__14907
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__14916 = cljs.core.seq.call(null, x);
      if(s__14916) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__14916)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__14916), concat.call(null, cljs.core.chunk_rest.call(null, s__14916), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__14916), concat.call(null, cljs.core.rest.call(null, s__14916), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__14920__delegate = function(x, y, zs) {
      var cat__14919 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__14918 = cljs.core.seq.call(null, xys);
          if(xys__14918) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__14918)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__14918), cat.call(null, cljs.core.chunk_rest.call(null, xys__14918), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__14918), cat.call(null, cljs.core.rest.call(null, xys__14918), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__14919.call(null, concat.call(null, x, y), zs)
    };
    var G__14920 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14920__delegate.call(this, x, y, zs)
    };
    G__14920.cljs$lang$maxFixedArity = 2;
    G__14920.cljs$lang$applyTo = function(arglist__14921) {
      var x = cljs.core.first(arglist__14921);
      var y = cljs.core.first(cljs.core.next(arglist__14921));
      var zs = cljs.core.rest(cljs.core.next(arglist__14921));
      return G__14920__delegate(x, y, zs)
    };
    G__14920.cljs$lang$arity$variadic = G__14920__delegate;
    return G__14920
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__14922__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__14922 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__14922__delegate.call(this, a, b, c, d, more)
    };
    G__14922.cljs$lang$maxFixedArity = 4;
    G__14922.cljs$lang$applyTo = function(arglist__14923) {
      var a = cljs.core.first(arglist__14923);
      var b = cljs.core.first(cljs.core.next(arglist__14923));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14923)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14923))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14923))));
      return G__14922__delegate(a, b, c, d, more)
    };
    G__14922.cljs$lang$arity$variadic = G__14922__delegate;
    return G__14922
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__14965 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__14966 = cljs.core._first.call(null, args__14965);
    var args__14967 = cljs.core._rest.call(null, args__14965);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__14966)
      }else {
        return f.call(null, a__14966)
      }
    }else {
      var b__14968 = cljs.core._first.call(null, args__14967);
      var args__14969 = cljs.core._rest.call(null, args__14967);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__14966, b__14968)
        }else {
          return f.call(null, a__14966, b__14968)
        }
      }else {
        var c__14970 = cljs.core._first.call(null, args__14969);
        var args__14971 = cljs.core._rest.call(null, args__14969);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__14966, b__14968, c__14970)
          }else {
            return f.call(null, a__14966, b__14968, c__14970)
          }
        }else {
          var d__14972 = cljs.core._first.call(null, args__14971);
          var args__14973 = cljs.core._rest.call(null, args__14971);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__14966, b__14968, c__14970, d__14972)
            }else {
              return f.call(null, a__14966, b__14968, c__14970, d__14972)
            }
          }else {
            var e__14974 = cljs.core._first.call(null, args__14973);
            var args__14975 = cljs.core._rest.call(null, args__14973);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__14966, b__14968, c__14970, d__14972, e__14974)
              }else {
                return f.call(null, a__14966, b__14968, c__14970, d__14972, e__14974)
              }
            }else {
              var f__14976 = cljs.core._first.call(null, args__14975);
              var args__14977 = cljs.core._rest.call(null, args__14975);
              if(argc === 6) {
                if(f__14976.cljs$lang$arity$6) {
                  return f__14976.cljs$lang$arity$6(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976)
                }else {
                  return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976)
                }
              }else {
                var g__14978 = cljs.core._first.call(null, args__14977);
                var args__14979 = cljs.core._rest.call(null, args__14977);
                if(argc === 7) {
                  if(f__14976.cljs$lang$arity$7) {
                    return f__14976.cljs$lang$arity$7(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978)
                  }else {
                    return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978)
                  }
                }else {
                  var h__14980 = cljs.core._first.call(null, args__14979);
                  var args__14981 = cljs.core._rest.call(null, args__14979);
                  if(argc === 8) {
                    if(f__14976.cljs$lang$arity$8) {
                      return f__14976.cljs$lang$arity$8(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980)
                    }else {
                      return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980)
                    }
                  }else {
                    var i__14982 = cljs.core._first.call(null, args__14981);
                    var args__14983 = cljs.core._rest.call(null, args__14981);
                    if(argc === 9) {
                      if(f__14976.cljs$lang$arity$9) {
                        return f__14976.cljs$lang$arity$9(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982)
                      }else {
                        return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982)
                      }
                    }else {
                      var j__14984 = cljs.core._first.call(null, args__14983);
                      var args__14985 = cljs.core._rest.call(null, args__14983);
                      if(argc === 10) {
                        if(f__14976.cljs$lang$arity$10) {
                          return f__14976.cljs$lang$arity$10(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984)
                        }else {
                          return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984)
                        }
                      }else {
                        var k__14986 = cljs.core._first.call(null, args__14985);
                        var args__14987 = cljs.core._rest.call(null, args__14985);
                        if(argc === 11) {
                          if(f__14976.cljs$lang$arity$11) {
                            return f__14976.cljs$lang$arity$11(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986)
                          }else {
                            return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986)
                          }
                        }else {
                          var l__14988 = cljs.core._first.call(null, args__14987);
                          var args__14989 = cljs.core._rest.call(null, args__14987);
                          if(argc === 12) {
                            if(f__14976.cljs$lang$arity$12) {
                              return f__14976.cljs$lang$arity$12(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988)
                            }else {
                              return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988)
                            }
                          }else {
                            var m__14990 = cljs.core._first.call(null, args__14989);
                            var args__14991 = cljs.core._rest.call(null, args__14989);
                            if(argc === 13) {
                              if(f__14976.cljs$lang$arity$13) {
                                return f__14976.cljs$lang$arity$13(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990)
                              }else {
                                return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990)
                              }
                            }else {
                              var n__14992 = cljs.core._first.call(null, args__14991);
                              var args__14993 = cljs.core._rest.call(null, args__14991);
                              if(argc === 14) {
                                if(f__14976.cljs$lang$arity$14) {
                                  return f__14976.cljs$lang$arity$14(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992)
                                }else {
                                  return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992)
                                }
                              }else {
                                var o__14994 = cljs.core._first.call(null, args__14993);
                                var args__14995 = cljs.core._rest.call(null, args__14993);
                                if(argc === 15) {
                                  if(f__14976.cljs$lang$arity$15) {
                                    return f__14976.cljs$lang$arity$15(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992, o__14994)
                                  }else {
                                    return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992, o__14994)
                                  }
                                }else {
                                  var p__14996 = cljs.core._first.call(null, args__14995);
                                  var args__14997 = cljs.core._rest.call(null, args__14995);
                                  if(argc === 16) {
                                    if(f__14976.cljs$lang$arity$16) {
                                      return f__14976.cljs$lang$arity$16(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992, o__14994, p__14996)
                                    }else {
                                      return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992, o__14994, p__14996)
                                    }
                                  }else {
                                    var q__14998 = cljs.core._first.call(null, args__14997);
                                    var args__14999 = cljs.core._rest.call(null, args__14997);
                                    if(argc === 17) {
                                      if(f__14976.cljs$lang$arity$17) {
                                        return f__14976.cljs$lang$arity$17(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992, o__14994, p__14996, q__14998)
                                      }else {
                                        return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992, o__14994, p__14996, q__14998)
                                      }
                                    }else {
                                      var r__15000 = cljs.core._first.call(null, args__14999);
                                      var args__15001 = cljs.core._rest.call(null, args__14999);
                                      if(argc === 18) {
                                        if(f__14976.cljs$lang$arity$18) {
                                          return f__14976.cljs$lang$arity$18(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992, o__14994, p__14996, q__14998, r__15000)
                                        }else {
                                          return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992, o__14994, p__14996, q__14998, r__15000)
                                        }
                                      }else {
                                        var s__15002 = cljs.core._first.call(null, args__15001);
                                        var args__15003 = cljs.core._rest.call(null, args__15001);
                                        if(argc === 19) {
                                          if(f__14976.cljs$lang$arity$19) {
                                            return f__14976.cljs$lang$arity$19(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992, o__14994, p__14996, q__14998, r__15000, s__15002)
                                          }else {
                                            return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992, o__14994, p__14996, q__14998, r__15000, s__15002)
                                          }
                                        }else {
                                          var t__15004 = cljs.core._first.call(null, args__15003);
                                          var args__15005 = cljs.core._rest.call(null, args__15003);
                                          if(argc === 20) {
                                            if(f__14976.cljs$lang$arity$20) {
                                              return f__14976.cljs$lang$arity$20(a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992, o__14994, p__14996, q__14998, r__15000, s__15002, t__15004)
                                            }else {
                                              return f__14976.call(null, a__14966, b__14968, c__14970, d__14972, e__14974, f__14976, g__14978, h__14980, i__14982, j__14984, k__14986, l__14988, m__14990, n__14992, o__14994, p__14996, q__14998, r__15000, s__15002, t__15004)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__15020 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15021 = cljs.core.bounded_count.call(null, args, fixed_arity__15020 + 1);
      if(bc__15021 <= fixed_arity__15020) {
        return cljs.core.apply_to.call(null, f, bc__15021, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__15022 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__15023 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15024 = cljs.core.bounded_count.call(null, arglist__15022, fixed_arity__15023 + 1);
      if(bc__15024 <= fixed_arity__15023) {
        return cljs.core.apply_to.call(null, f, bc__15024, arglist__15022)
      }else {
        return f.cljs$lang$applyTo(arglist__15022)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__15022))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__15025 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__15026 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15027 = cljs.core.bounded_count.call(null, arglist__15025, fixed_arity__15026 + 1);
      if(bc__15027 <= fixed_arity__15026) {
        return cljs.core.apply_to.call(null, f, bc__15027, arglist__15025)
      }else {
        return f.cljs$lang$applyTo(arglist__15025)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__15025))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__15028 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__15029 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__15030 = cljs.core.bounded_count.call(null, arglist__15028, fixed_arity__15029 + 1);
      if(bc__15030 <= fixed_arity__15029) {
        return cljs.core.apply_to.call(null, f, bc__15030, arglist__15028)
      }else {
        return f.cljs$lang$applyTo(arglist__15028)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__15028))
    }
  };
  var apply__6 = function() {
    var G__15034__delegate = function(f, a, b, c, d, args) {
      var arglist__15031 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__15032 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__15033 = cljs.core.bounded_count.call(null, arglist__15031, fixed_arity__15032 + 1);
        if(bc__15033 <= fixed_arity__15032) {
          return cljs.core.apply_to.call(null, f, bc__15033, arglist__15031)
        }else {
          return f.cljs$lang$applyTo(arglist__15031)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__15031))
      }
    };
    var G__15034 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__15034__delegate.call(this, f, a, b, c, d, args)
    };
    G__15034.cljs$lang$maxFixedArity = 5;
    G__15034.cljs$lang$applyTo = function(arglist__15035) {
      var f = cljs.core.first(arglist__15035);
      var a = cljs.core.first(cljs.core.next(arglist__15035));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15035)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15035))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15035)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15035)))));
      return G__15034__delegate(f, a, b, c, d, args)
    };
    G__15034.cljs$lang$arity$variadic = G__15034__delegate;
    return G__15034
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__15036) {
    var obj = cljs.core.first(arglist__15036);
    var f = cljs.core.first(cljs.core.next(arglist__15036));
    var args = cljs.core.rest(cljs.core.next(arglist__15036));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__15037__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__15037 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15037__delegate.call(this, x, y, more)
    };
    G__15037.cljs$lang$maxFixedArity = 2;
    G__15037.cljs$lang$applyTo = function(arglist__15038) {
      var x = cljs.core.first(arglist__15038);
      var y = cljs.core.first(cljs.core.next(arglist__15038));
      var more = cljs.core.rest(cljs.core.next(arglist__15038));
      return G__15037__delegate(x, y, more)
    };
    G__15037.cljs$lang$arity$variadic = G__15037__delegate;
    return G__15037
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__15039 = pred;
        var G__15040 = cljs.core.next.call(null, coll);
        pred = G__15039;
        coll = G__15040;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____15042 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____15042)) {
        return or__3824__auto____15042
      }else {
        var G__15043 = pred;
        var G__15044 = cljs.core.next.call(null, coll);
        pred = G__15043;
        coll = G__15044;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__15045 = null;
    var G__15045__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__15045__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__15045__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__15045__3 = function() {
      var G__15046__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__15046 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__15046__delegate.call(this, x, y, zs)
      };
      G__15046.cljs$lang$maxFixedArity = 2;
      G__15046.cljs$lang$applyTo = function(arglist__15047) {
        var x = cljs.core.first(arglist__15047);
        var y = cljs.core.first(cljs.core.next(arglist__15047));
        var zs = cljs.core.rest(cljs.core.next(arglist__15047));
        return G__15046__delegate(x, y, zs)
      };
      G__15046.cljs$lang$arity$variadic = G__15046__delegate;
      return G__15046
    }();
    G__15045 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__15045__0.call(this);
        case 1:
          return G__15045__1.call(this, x);
        case 2:
          return G__15045__2.call(this, x, y);
        default:
          return G__15045__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__15045.cljs$lang$maxFixedArity = 2;
    G__15045.cljs$lang$applyTo = G__15045__3.cljs$lang$applyTo;
    return G__15045
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__15048__delegate = function(args) {
      return x
    };
    var G__15048 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__15048__delegate.call(this, args)
    };
    G__15048.cljs$lang$maxFixedArity = 0;
    G__15048.cljs$lang$applyTo = function(arglist__15049) {
      var args = cljs.core.seq(arglist__15049);
      return G__15048__delegate(args)
    };
    G__15048.cljs$lang$arity$variadic = G__15048__delegate;
    return G__15048
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__15056 = null;
      var G__15056__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__15056__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__15056__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__15056__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__15056__4 = function() {
        var G__15057__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__15057 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15057__delegate.call(this, x, y, z, args)
        };
        G__15057.cljs$lang$maxFixedArity = 3;
        G__15057.cljs$lang$applyTo = function(arglist__15058) {
          var x = cljs.core.first(arglist__15058);
          var y = cljs.core.first(cljs.core.next(arglist__15058));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15058)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15058)));
          return G__15057__delegate(x, y, z, args)
        };
        G__15057.cljs$lang$arity$variadic = G__15057__delegate;
        return G__15057
      }();
      G__15056 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15056__0.call(this);
          case 1:
            return G__15056__1.call(this, x);
          case 2:
            return G__15056__2.call(this, x, y);
          case 3:
            return G__15056__3.call(this, x, y, z);
          default:
            return G__15056__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15056.cljs$lang$maxFixedArity = 3;
      G__15056.cljs$lang$applyTo = G__15056__4.cljs$lang$applyTo;
      return G__15056
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__15059 = null;
      var G__15059__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__15059__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__15059__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__15059__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__15059__4 = function() {
        var G__15060__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__15060 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15060__delegate.call(this, x, y, z, args)
        };
        G__15060.cljs$lang$maxFixedArity = 3;
        G__15060.cljs$lang$applyTo = function(arglist__15061) {
          var x = cljs.core.first(arglist__15061);
          var y = cljs.core.first(cljs.core.next(arglist__15061));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15061)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15061)));
          return G__15060__delegate(x, y, z, args)
        };
        G__15060.cljs$lang$arity$variadic = G__15060__delegate;
        return G__15060
      }();
      G__15059 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15059__0.call(this);
          case 1:
            return G__15059__1.call(this, x);
          case 2:
            return G__15059__2.call(this, x, y);
          case 3:
            return G__15059__3.call(this, x, y, z);
          default:
            return G__15059__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15059.cljs$lang$maxFixedArity = 3;
      G__15059.cljs$lang$applyTo = G__15059__4.cljs$lang$applyTo;
      return G__15059
    }()
  };
  var comp__4 = function() {
    var G__15062__delegate = function(f1, f2, f3, fs) {
      var fs__15053 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__15063__delegate = function(args) {
          var ret__15054 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__15053), args);
          var fs__15055 = cljs.core.next.call(null, fs__15053);
          while(true) {
            if(fs__15055) {
              var G__15064 = cljs.core.first.call(null, fs__15055).call(null, ret__15054);
              var G__15065 = cljs.core.next.call(null, fs__15055);
              ret__15054 = G__15064;
              fs__15055 = G__15065;
              continue
            }else {
              return ret__15054
            }
            break
          }
        };
        var G__15063 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__15063__delegate.call(this, args)
        };
        G__15063.cljs$lang$maxFixedArity = 0;
        G__15063.cljs$lang$applyTo = function(arglist__15066) {
          var args = cljs.core.seq(arglist__15066);
          return G__15063__delegate(args)
        };
        G__15063.cljs$lang$arity$variadic = G__15063__delegate;
        return G__15063
      }()
    };
    var G__15062 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15062__delegate.call(this, f1, f2, f3, fs)
    };
    G__15062.cljs$lang$maxFixedArity = 3;
    G__15062.cljs$lang$applyTo = function(arglist__15067) {
      var f1 = cljs.core.first(arglist__15067);
      var f2 = cljs.core.first(cljs.core.next(arglist__15067));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15067)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15067)));
      return G__15062__delegate(f1, f2, f3, fs)
    };
    G__15062.cljs$lang$arity$variadic = G__15062__delegate;
    return G__15062
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__15068__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__15068 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15068__delegate.call(this, args)
      };
      G__15068.cljs$lang$maxFixedArity = 0;
      G__15068.cljs$lang$applyTo = function(arglist__15069) {
        var args = cljs.core.seq(arglist__15069);
        return G__15068__delegate(args)
      };
      G__15068.cljs$lang$arity$variadic = G__15068__delegate;
      return G__15068
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__15070__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__15070 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15070__delegate.call(this, args)
      };
      G__15070.cljs$lang$maxFixedArity = 0;
      G__15070.cljs$lang$applyTo = function(arglist__15071) {
        var args = cljs.core.seq(arglist__15071);
        return G__15070__delegate(args)
      };
      G__15070.cljs$lang$arity$variadic = G__15070__delegate;
      return G__15070
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__15072__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__15072 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__15072__delegate.call(this, args)
      };
      G__15072.cljs$lang$maxFixedArity = 0;
      G__15072.cljs$lang$applyTo = function(arglist__15073) {
        var args = cljs.core.seq(arglist__15073);
        return G__15072__delegate(args)
      };
      G__15072.cljs$lang$arity$variadic = G__15072__delegate;
      return G__15072
    }()
  };
  var partial__5 = function() {
    var G__15074__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__15075__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__15075 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__15075__delegate.call(this, args)
        };
        G__15075.cljs$lang$maxFixedArity = 0;
        G__15075.cljs$lang$applyTo = function(arglist__15076) {
          var args = cljs.core.seq(arglist__15076);
          return G__15075__delegate(args)
        };
        G__15075.cljs$lang$arity$variadic = G__15075__delegate;
        return G__15075
      }()
    };
    var G__15074 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15074__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__15074.cljs$lang$maxFixedArity = 4;
    G__15074.cljs$lang$applyTo = function(arglist__15077) {
      var f = cljs.core.first(arglist__15077);
      var arg1 = cljs.core.first(cljs.core.next(arglist__15077));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15077)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15077))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15077))));
      return G__15074__delegate(f, arg1, arg2, arg3, more)
    };
    G__15074.cljs$lang$arity$variadic = G__15074__delegate;
    return G__15074
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__15078 = null;
      var G__15078__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__15078__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__15078__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__15078__4 = function() {
        var G__15079__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__15079 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15079__delegate.call(this, a, b, c, ds)
        };
        G__15079.cljs$lang$maxFixedArity = 3;
        G__15079.cljs$lang$applyTo = function(arglist__15080) {
          var a = cljs.core.first(arglist__15080);
          var b = cljs.core.first(cljs.core.next(arglist__15080));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15080)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15080)));
          return G__15079__delegate(a, b, c, ds)
        };
        G__15079.cljs$lang$arity$variadic = G__15079__delegate;
        return G__15079
      }();
      G__15078 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__15078__1.call(this, a);
          case 2:
            return G__15078__2.call(this, a, b);
          case 3:
            return G__15078__3.call(this, a, b, c);
          default:
            return G__15078__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15078.cljs$lang$maxFixedArity = 3;
      G__15078.cljs$lang$applyTo = G__15078__4.cljs$lang$applyTo;
      return G__15078
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__15081 = null;
      var G__15081__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__15081__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__15081__4 = function() {
        var G__15082__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__15082 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15082__delegate.call(this, a, b, c, ds)
        };
        G__15082.cljs$lang$maxFixedArity = 3;
        G__15082.cljs$lang$applyTo = function(arglist__15083) {
          var a = cljs.core.first(arglist__15083);
          var b = cljs.core.first(cljs.core.next(arglist__15083));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15083)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15083)));
          return G__15082__delegate(a, b, c, ds)
        };
        G__15082.cljs$lang$arity$variadic = G__15082__delegate;
        return G__15082
      }();
      G__15081 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15081__2.call(this, a, b);
          case 3:
            return G__15081__3.call(this, a, b, c);
          default:
            return G__15081__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15081.cljs$lang$maxFixedArity = 3;
      G__15081.cljs$lang$applyTo = G__15081__4.cljs$lang$applyTo;
      return G__15081
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__15084 = null;
      var G__15084__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__15084__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__15084__4 = function() {
        var G__15085__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__15085 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15085__delegate.call(this, a, b, c, ds)
        };
        G__15085.cljs$lang$maxFixedArity = 3;
        G__15085.cljs$lang$applyTo = function(arglist__15086) {
          var a = cljs.core.first(arglist__15086);
          var b = cljs.core.first(cljs.core.next(arglist__15086));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15086)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15086)));
          return G__15085__delegate(a, b, c, ds)
        };
        G__15085.cljs$lang$arity$variadic = G__15085__delegate;
        return G__15085
      }();
      G__15084 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15084__2.call(this, a, b);
          case 3:
            return G__15084__3.call(this, a, b, c);
          default:
            return G__15084__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15084.cljs$lang$maxFixedArity = 3;
      G__15084.cljs$lang$applyTo = G__15084__4.cljs$lang$applyTo;
      return G__15084
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__15102 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15110 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15110) {
        var s__15111 = temp__3974__auto____15110;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15111)) {
          var c__15112 = cljs.core.chunk_first.call(null, s__15111);
          var size__15113 = cljs.core.count.call(null, c__15112);
          var b__15114 = cljs.core.chunk_buffer.call(null, size__15113);
          var n__2527__auto____15115 = size__15113;
          var i__15116 = 0;
          while(true) {
            if(i__15116 < n__2527__auto____15115) {
              cljs.core.chunk_append.call(null, b__15114, f.call(null, idx + i__15116, cljs.core._nth.call(null, c__15112, i__15116)));
              var G__15117 = i__15116 + 1;
              i__15116 = G__15117;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15114), mapi.call(null, idx + size__15113, cljs.core.chunk_rest.call(null, s__15111)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__15111)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__15111)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__15102.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15127 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15127) {
      var s__15128 = temp__3974__auto____15127;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__15128)) {
        var c__15129 = cljs.core.chunk_first.call(null, s__15128);
        var size__15130 = cljs.core.count.call(null, c__15129);
        var b__15131 = cljs.core.chunk_buffer.call(null, size__15130);
        var n__2527__auto____15132 = size__15130;
        var i__15133 = 0;
        while(true) {
          if(i__15133 < n__2527__auto____15132) {
            var x__15134 = f.call(null, cljs.core._nth.call(null, c__15129, i__15133));
            if(x__15134 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__15131, x__15134)
            }
            var G__15136 = i__15133 + 1;
            i__15133 = G__15136;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15131), keep.call(null, f, cljs.core.chunk_rest.call(null, s__15128)))
      }else {
        var x__15135 = f.call(null, cljs.core.first.call(null, s__15128));
        if(x__15135 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__15128))
        }else {
          return cljs.core.cons.call(null, x__15135, keep.call(null, f, cljs.core.rest.call(null, s__15128)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__15162 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15172 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15172) {
        var s__15173 = temp__3974__auto____15172;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15173)) {
          var c__15174 = cljs.core.chunk_first.call(null, s__15173);
          var size__15175 = cljs.core.count.call(null, c__15174);
          var b__15176 = cljs.core.chunk_buffer.call(null, size__15175);
          var n__2527__auto____15177 = size__15175;
          var i__15178 = 0;
          while(true) {
            if(i__15178 < n__2527__auto____15177) {
              var x__15179 = f.call(null, idx + i__15178, cljs.core._nth.call(null, c__15174, i__15178));
              if(x__15179 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__15176, x__15179)
              }
              var G__15181 = i__15178 + 1;
              i__15178 = G__15181;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15176), keepi.call(null, idx + size__15175, cljs.core.chunk_rest.call(null, s__15173)))
        }else {
          var x__15180 = f.call(null, idx, cljs.core.first.call(null, s__15173));
          if(x__15180 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__15173))
          }else {
            return cljs.core.cons.call(null, x__15180, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__15173)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__15162.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15267 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15267)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____15267
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15268 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15268)) {
            var and__3822__auto____15269 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15269)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____15269
            }
          }else {
            return and__3822__auto____15268
          }
        }())
      };
      var ep1__4 = function() {
        var G__15338__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15270 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15270)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____15270
            }
          }())
        };
        var G__15338 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15338__delegate.call(this, x, y, z, args)
        };
        G__15338.cljs$lang$maxFixedArity = 3;
        G__15338.cljs$lang$applyTo = function(arglist__15339) {
          var x = cljs.core.first(arglist__15339);
          var y = cljs.core.first(cljs.core.next(arglist__15339));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15339)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15339)));
          return G__15338__delegate(x, y, z, args)
        };
        G__15338.cljs$lang$arity$variadic = G__15338__delegate;
        return G__15338
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15282 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15282)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____15282
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15283 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15283)) {
            var and__3822__auto____15284 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15284)) {
              var and__3822__auto____15285 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15285)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____15285
              }
            }else {
              return and__3822__auto____15284
            }
          }else {
            return and__3822__auto____15283
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15286 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15286)) {
            var and__3822__auto____15287 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15287)) {
              var and__3822__auto____15288 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____15288)) {
                var and__3822__auto____15289 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____15289)) {
                  var and__3822__auto____15290 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15290)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____15290
                  }
                }else {
                  return and__3822__auto____15289
                }
              }else {
                return and__3822__auto____15288
              }
            }else {
              return and__3822__auto____15287
            }
          }else {
            return and__3822__auto____15286
          }
        }())
      };
      var ep2__4 = function() {
        var G__15340__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15291 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15291)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15137_SHARP_) {
                var and__3822__auto____15292 = p1.call(null, p1__15137_SHARP_);
                if(cljs.core.truth_(and__3822__auto____15292)) {
                  return p2.call(null, p1__15137_SHARP_)
                }else {
                  return and__3822__auto____15292
                }
              }, args)
            }else {
              return and__3822__auto____15291
            }
          }())
        };
        var G__15340 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15340__delegate.call(this, x, y, z, args)
        };
        G__15340.cljs$lang$maxFixedArity = 3;
        G__15340.cljs$lang$applyTo = function(arglist__15341) {
          var x = cljs.core.first(arglist__15341);
          var y = cljs.core.first(cljs.core.next(arglist__15341));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15341)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15341)));
          return G__15340__delegate(x, y, z, args)
        };
        G__15340.cljs$lang$arity$variadic = G__15340__delegate;
        return G__15340
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15311 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15311)) {
            var and__3822__auto____15312 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15312)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____15312
            }
          }else {
            return and__3822__auto____15311
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15313 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15313)) {
            var and__3822__auto____15314 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15314)) {
              var and__3822__auto____15315 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15315)) {
                var and__3822__auto____15316 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____15316)) {
                  var and__3822__auto____15317 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15317)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____15317
                  }
                }else {
                  return and__3822__auto____15316
                }
              }else {
                return and__3822__auto____15315
              }
            }else {
              return and__3822__auto____15314
            }
          }else {
            return and__3822__auto____15313
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15318 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15318)) {
            var and__3822__auto____15319 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15319)) {
              var and__3822__auto____15320 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15320)) {
                var and__3822__auto____15321 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____15321)) {
                  var and__3822__auto____15322 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15322)) {
                    var and__3822__auto____15323 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____15323)) {
                      var and__3822__auto____15324 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____15324)) {
                        var and__3822__auto____15325 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____15325)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____15325
                        }
                      }else {
                        return and__3822__auto____15324
                      }
                    }else {
                      return and__3822__auto____15323
                    }
                  }else {
                    return and__3822__auto____15322
                  }
                }else {
                  return and__3822__auto____15321
                }
              }else {
                return and__3822__auto____15320
              }
            }else {
              return and__3822__auto____15319
            }
          }else {
            return and__3822__auto____15318
          }
        }())
      };
      var ep3__4 = function() {
        var G__15342__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15326 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15326)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15138_SHARP_) {
                var and__3822__auto____15327 = p1.call(null, p1__15138_SHARP_);
                if(cljs.core.truth_(and__3822__auto____15327)) {
                  var and__3822__auto____15328 = p2.call(null, p1__15138_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____15328)) {
                    return p3.call(null, p1__15138_SHARP_)
                  }else {
                    return and__3822__auto____15328
                  }
                }else {
                  return and__3822__auto____15327
                }
              }, args)
            }else {
              return and__3822__auto____15326
            }
          }())
        };
        var G__15342 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15342__delegate.call(this, x, y, z, args)
        };
        G__15342.cljs$lang$maxFixedArity = 3;
        G__15342.cljs$lang$applyTo = function(arglist__15343) {
          var x = cljs.core.first(arglist__15343);
          var y = cljs.core.first(cljs.core.next(arglist__15343));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15343)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15343)));
          return G__15342__delegate(x, y, z, args)
        };
        G__15342.cljs$lang$arity$variadic = G__15342__delegate;
        return G__15342
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__15344__delegate = function(p1, p2, p3, ps) {
      var ps__15329 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__15139_SHARP_) {
            return p1__15139_SHARP_.call(null, x)
          }, ps__15329)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__15140_SHARP_) {
            var and__3822__auto____15334 = p1__15140_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15334)) {
              return p1__15140_SHARP_.call(null, y)
            }else {
              return and__3822__auto____15334
            }
          }, ps__15329)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__15141_SHARP_) {
            var and__3822__auto____15335 = p1__15141_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15335)) {
              var and__3822__auto____15336 = p1__15141_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____15336)) {
                return p1__15141_SHARP_.call(null, z)
              }else {
                return and__3822__auto____15336
              }
            }else {
              return and__3822__auto____15335
            }
          }, ps__15329)
        };
        var epn__4 = function() {
          var G__15345__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____15337 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____15337)) {
                return cljs.core.every_QMARK_.call(null, function(p1__15142_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__15142_SHARP_, args)
                }, ps__15329)
              }else {
                return and__3822__auto____15337
              }
            }())
          };
          var G__15345 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__15345__delegate.call(this, x, y, z, args)
          };
          G__15345.cljs$lang$maxFixedArity = 3;
          G__15345.cljs$lang$applyTo = function(arglist__15346) {
            var x = cljs.core.first(arglist__15346);
            var y = cljs.core.first(cljs.core.next(arglist__15346));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15346)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15346)));
            return G__15345__delegate(x, y, z, args)
          };
          G__15345.cljs$lang$arity$variadic = G__15345__delegate;
          return G__15345
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__15344 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15344__delegate.call(this, p1, p2, p3, ps)
    };
    G__15344.cljs$lang$maxFixedArity = 3;
    G__15344.cljs$lang$applyTo = function(arglist__15347) {
      var p1 = cljs.core.first(arglist__15347);
      var p2 = cljs.core.first(cljs.core.next(arglist__15347));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15347)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15347)));
      return G__15344__delegate(p1, p2, p3, ps)
    };
    G__15344.cljs$lang$arity$variadic = G__15344__delegate;
    return G__15344
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____15428 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15428)) {
          return or__3824__auto____15428
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____15429 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15429)) {
          return or__3824__auto____15429
        }else {
          var or__3824__auto____15430 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15430)) {
            return or__3824__auto____15430
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__15499__delegate = function(x, y, z, args) {
          var or__3824__auto____15431 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15431)) {
            return or__3824__auto____15431
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__15499 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15499__delegate.call(this, x, y, z, args)
        };
        G__15499.cljs$lang$maxFixedArity = 3;
        G__15499.cljs$lang$applyTo = function(arglist__15500) {
          var x = cljs.core.first(arglist__15500);
          var y = cljs.core.first(cljs.core.next(arglist__15500));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15500)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15500)));
          return G__15499__delegate(x, y, z, args)
        };
        G__15499.cljs$lang$arity$variadic = G__15499__delegate;
        return G__15499
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____15443 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15443)) {
          return or__3824__auto____15443
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____15444 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15444)) {
          return or__3824__auto____15444
        }else {
          var or__3824__auto____15445 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15445)) {
            return or__3824__auto____15445
          }else {
            var or__3824__auto____15446 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15446)) {
              return or__3824__auto____15446
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____15447 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15447)) {
          return or__3824__auto____15447
        }else {
          var or__3824__auto____15448 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15448)) {
            return or__3824__auto____15448
          }else {
            var or__3824__auto____15449 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____15449)) {
              return or__3824__auto____15449
            }else {
              var or__3824__auto____15450 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____15450)) {
                return or__3824__auto____15450
              }else {
                var or__3824__auto____15451 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15451)) {
                  return or__3824__auto____15451
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__15501__delegate = function(x, y, z, args) {
          var or__3824__auto____15452 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15452)) {
            return or__3824__auto____15452
          }else {
            return cljs.core.some.call(null, function(p1__15182_SHARP_) {
              var or__3824__auto____15453 = p1.call(null, p1__15182_SHARP_);
              if(cljs.core.truth_(or__3824__auto____15453)) {
                return or__3824__auto____15453
              }else {
                return p2.call(null, p1__15182_SHARP_)
              }
            }, args)
          }
        };
        var G__15501 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15501__delegate.call(this, x, y, z, args)
        };
        G__15501.cljs$lang$maxFixedArity = 3;
        G__15501.cljs$lang$applyTo = function(arglist__15502) {
          var x = cljs.core.first(arglist__15502);
          var y = cljs.core.first(cljs.core.next(arglist__15502));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15502)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15502)));
          return G__15501__delegate(x, y, z, args)
        };
        G__15501.cljs$lang$arity$variadic = G__15501__delegate;
        return G__15501
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____15472 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15472)) {
          return or__3824__auto____15472
        }else {
          var or__3824__auto____15473 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15473)) {
            return or__3824__auto____15473
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____15474 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15474)) {
          return or__3824__auto____15474
        }else {
          var or__3824__auto____15475 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15475)) {
            return or__3824__auto____15475
          }else {
            var or__3824__auto____15476 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15476)) {
              return or__3824__auto____15476
            }else {
              var or__3824__auto____15477 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15477)) {
                return or__3824__auto____15477
              }else {
                var or__3824__auto____15478 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15478)) {
                  return or__3824__auto____15478
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____15479 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15479)) {
          return or__3824__auto____15479
        }else {
          var or__3824__auto____15480 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15480)) {
            return or__3824__auto____15480
          }else {
            var or__3824__auto____15481 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15481)) {
              return or__3824__auto____15481
            }else {
              var or__3824__auto____15482 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15482)) {
                return or__3824__auto____15482
              }else {
                var or__3824__auto____15483 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15483)) {
                  return or__3824__auto____15483
                }else {
                  var or__3824__auto____15484 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____15484)) {
                    return or__3824__auto____15484
                  }else {
                    var or__3824__auto____15485 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____15485)) {
                      return or__3824__auto____15485
                    }else {
                      var or__3824__auto____15486 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____15486)) {
                        return or__3824__auto____15486
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__15503__delegate = function(x, y, z, args) {
          var or__3824__auto____15487 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15487)) {
            return or__3824__auto____15487
          }else {
            return cljs.core.some.call(null, function(p1__15183_SHARP_) {
              var or__3824__auto____15488 = p1.call(null, p1__15183_SHARP_);
              if(cljs.core.truth_(or__3824__auto____15488)) {
                return or__3824__auto____15488
              }else {
                var or__3824__auto____15489 = p2.call(null, p1__15183_SHARP_);
                if(cljs.core.truth_(or__3824__auto____15489)) {
                  return or__3824__auto____15489
                }else {
                  return p3.call(null, p1__15183_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__15503 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15503__delegate.call(this, x, y, z, args)
        };
        G__15503.cljs$lang$maxFixedArity = 3;
        G__15503.cljs$lang$applyTo = function(arglist__15504) {
          var x = cljs.core.first(arglist__15504);
          var y = cljs.core.first(cljs.core.next(arglist__15504));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15504)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15504)));
          return G__15503__delegate(x, y, z, args)
        };
        G__15503.cljs$lang$arity$variadic = G__15503__delegate;
        return G__15503
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__15505__delegate = function(p1, p2, p3, ps) {
      var ps__15490 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__15184_SHARP_) {
            return p1__15184_SHARP_.call(null, x)
          }, ps__15490)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__15185_SHARP_) {
            var or__3824__auto____15495 = p1__15185_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15495)) {
              return or__3824__auto____15495
            }else {
              return p1__15185_SHARP_.call(null, y)
            }
          }, ps__15490)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__15186_SHARP_) {
            var or__3824__auto____15496 = p1__15186_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15496)) {
              return or__3824__auto____15496
            }else {
              var or__3824__auto____15497 = p1__15186_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15497)) {
                return or__3824__auto____15497
              }else {
                return p1__15186_SHARP_.call(null, z)
              }
            }
          }, ps__15490)
        };
        var spn__4 = function() {
          var G__15506__delegate = function(x, y, z, args) {
            var or__3824__auto____15498 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____15498)) {
              return or__3824__auto____15498
            }else {
              return cljs.core.some.call(null, function(p1__15187_SHARP_) {
                return cljs.core.some.call(null, p1__15187_SHARP_, args)
              }, ps__15490)
            }
          };
          var G__15506 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__15506__delegate.call(this, x, y, z, args)
          };
          G__15506.cljs$lang$maxFixedArity = 3;
          G__15506.cljs$lang$applyTo = function(arglist__15507) {
            var x = cljs.core.first(arglist__15507);
            var y = cljs.core.first(cljs.core.next(arglist__15507));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15507)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15507)));
            return G__15506__delegate(x, y, z, args)
          };
          G__15506.cljs$lang$arity$variadic = G__15506__delegate;
          return G__15506
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__15505 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15505__delegate.call(this, p1, p2, p3, ps)
    };
    G__15505.cljs$lang$maxFixedArity = 3;
    G__15505.cljs$lang$applyTo = function(arglist__15508) {
      var p1 = cljs.core.first(arglist__15508);
      var p2 = cljs.core.first(cljs.core.next(arglist__15508));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15508)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15508)));
      return G__15505__delegate(p1, p2, p3, ps)
    };
    G__15505.cljs$lang$arity$variadic = G__15505__delegate;
    return G__15505
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15527 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15527) {
        var s__15528 = temp__3974__auto____15527;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__15528)) {
          var c__15529 = cljs.core.chunk_first.call(null, s__15528);
          var size__15530 = cljs.core.count.call(null, c__15529);
          var b__15531 = cljs.core.chunk_buffer.call(null, size__15530);
          var n__2527__auto____15532 = size__15530;
          var i__15533 = 0;
          while(true) {
            if(i__15533 < n__2527__auto____15532) {
              cljs.core.chunk_append.call(null, b__15531, f.call(null, cljs.core._nth.call(null, c__15529, i__15533)));
              var G__15545 = i__15533 + 1;
              i__15533 = G__15545;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15531), map.call(null, f, cljs.core.chunk_rest.call(null, s__15528)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__15528)), map.call(null, f, cljs.core.rest.call(null, s__15528)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__15534 = cljs.core.seq.call(null, c1);
      var s2__15535 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____15536 = s1__15534;
        if(and__3822__auto____15536) {
          return s2__15535
        }else {
          return and__3822__auto____15536
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__15534), cljs.core.first.call(null, s2__15535)), map.call(null, f, cljs.core.rest.call(null, s1__15534), cljs.core.rest.call(null, s2__15535)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__15537 = cljs.core.seq.call(null, c1);
      var s2__15538 = cljs.core.seq.call(null, c2);
      var s3__15539 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____15540 = s1__15537;
        if(and__3822__auto____15540) {
          var and__3822__auto____15541 = s2__15538;
          if(and__3822__auto____15541) {
            return s3__15539
          }else {
            return and__3822__auto____15541
          }
        }else {
          return and__3822__auto____15540
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__15537), cljs.core.first.call(null, s2__15538), cljs.core.first.call(null, s3__15539)), map.call(null, f, cljs.core.rest.call(null, s1__15537), cljs.core.rest.call(null, s2__15538), cljs.core.rest.call(null, s3__15539)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__15546__delegate = function(f, c1, c2, c3, colls) {
      var step__15544 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__15543 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__15543)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__15543), step.call(null, map.call(null, cljs.core.rest, ss__15543)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__15348_SHARP_) {
        return cljs.core.apply.call(null, f, p1__15348_SHARP_)
      }, step__15544.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__15546 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15546__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__15546.cljs$lang$maxFixedArity = 4;
    G__15546.cljs$lang$applyTo = function(arglist__15547) {
      var f = cljs.core.first(arglist__15547);
      var c1 = cljs.core.first(cljs.core.next(arglist__15547));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15547)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15547))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15547))));
      return G__15546__delegate(f, c1, c2, c3, colls)
    };
    G__15546.cljs$lang$arity$variadic = G__15546__delegate;
    return G__15546
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____15550 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15550) {
        var s__15551 = temp__3974__auto____15550;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__15551), take.call(null, n - 1, cljs.core.rest.call(null, s__15551)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__15557 = function(n, coll) {
    while(true) {
      var s__15555 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____15556 = n > 0;
        if(and__3822__auto____15556) {
          return s__15555
        }else {
          return and__3822__auto____15556
        }
      }())) {
        var G__15558 = n - 1;
        var G__15559 = cljs.core.rest.call(null, s__15555);
        n = G__15558;
        coll = G__15559;
        continue
      }else {
        return s__15555
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__15557.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__15562 = cljs.core.seq.call(null, coll);
  var lead__15563 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__15563) {
      var G__15564 = cljs.core.next.call(null, s__15562);
      var G__15565 = cljs.core.next.call(null, lead__15563);
      s__15562 = G__15564;
      lead__15563 = G__15565;
      continue
    }else {
      return s__15562
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__15571 = function(pred, coll) {
    while(true) {
      var s__15569 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____15570 = s__15569;
        if(and__3822__auto____15570) {
          return pred.call(null, cljs.core.first.call(null, s__15569))
        }else {
          return and__3822__auto____15570
        }
      }())) {
        var G__15572 = pred;
        var G__15573 = cljs.core.rest.call(null, s__15569);
        pred = G__15572;
        coll = G__15573;
        continue
      }else {
        return s__15569
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__15571.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15576 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15576) {
      var s__15577 = temp__3974__auto____15576;
      return cljs.core.concat.call(null, s__15577, cycle.call(null, s__15577))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__15582 = cljs.core.seq.call(null, c1);
      var s2__15583 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____15584 = s1__15582;
        if(and__3822__auto____15584) {
          return s2__15583
        }else {
          return and__3822__auto____15584
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__15582), cljs.core.cons.call(null, cljs.core.first.call(null, s2__15583), interleave.call(null, cljs.core.rest.call(null, s1__15582), cljs.core.rest.call(null, s2__15583))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__15586__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__15585 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__15585)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__15585), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__15585)))
        }else {
          return null
        }
      }, null)
    };
    var G__15586 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15586__delegate.call(this, c1, c2, colls)
    };
    G__15586.cljs$lang$maxFixedArity = 2;
    G__15586.cljs$lang$applyTo = function(arglist__15587) {
      var c1 = cljs.core.first(arglist__15587);
      var c2 = cljs.core.first(cljs.core.next(arglist__15587));
      var colls = cljs.core.rest(cljs.core.next(arglist__15587));
      return G__15586__delegate(c1, c2, colls)
    };
    G__15586.cljs$lang$arity$variadic = G__15586__delegate;
    return G__15586
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__15597 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____15595 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____15595) {
        var coll__15596 = temp__3971__auto____15595;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__15596), cat.call(null, cljs.core.rest.call(null, coll__15596), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__15597.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__15598__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__15598 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15598__delegate.call(this, f, coll, colls)
    };
    G__15598.cljs$lang$maxFixedArity = 2;
    G__15598.cljs$lang$applyTo = function(arglist__15599) {
      var f = cljs.core.first(arglist__15599);
      var coll = cljs.core.first(cljs.core.next(arglist__15599));
      var colls = cljs.core.rest(cljs.core.next(arglist__15599));
      return G__15598__delegate(f, coll, colls)
    };
    G__15598.cljs$lang$arity$variadic = G__15598__delegate;
    return G__15598
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15609 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____15609) {
      var s__15610 = temp__3974__auto____15609;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__15610)) {
        var c__15611 = cljs.core.chunk_first.call(null, s__15610);
        var size__15612 = cljs.core.count.call(null, c__15611);
        var b__15613 = cljs.core.chunk_buffer.call(null, size__15612);
        var n__2527__auto____15614 = size__15612;
        var i__15615 = 0;
        while(true) {
          if(i__15615 < n__2527__auto____15614) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__15611, i__15615)))) {
              cljs.core.chunk_append.call(null, b__15613, cljs.core._nth.call(null, c__15611, i__15615))
            }else {
            }
            var G__15618 = i__15615 + 1;
            i__15615 = G__15618;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__15613), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__15610)))
      }else {
        var f__15616 = cljs.core.first.call(null, s__15610);
        var r__15617 = cljs.core.rest.call(null, s__15610);
        if(cljs.core.truth_(pred.call(null, f__15616))) {
          return cljs.core.cons.call(null, f__15616, filter.call(null, pred, r__15617))
        }else {
          return filter.call(null, pred, r__15617)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__15621 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__15621.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__15619_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__15619_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__15625__15626 = to;
    if(G__15625__15626) {
      if(function() {
        var or__3824__auto____15627 = G__15625__15626.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____15627) {
          return or__3824__auto____15627
        }else {
          return G__15625__15626.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__15625__15626.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__15625__15626)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__15625__15626)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__15628__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__15628 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15628__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__15628.cljs$lang$maxFixedArity = 4;
    G__15628.cljs$lang$applyTo = function(arglist__15629) {
      var f = cljs.core.first(arglist__15629);
      var c1 = cljs.core.first(cljs.core.next(arglist__15629));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15629)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15629))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15629))));
      return G__15628__delegate(f, c1, c2, c3, colls)
    };
    G__15628.cljs$lang$arity$variadic = G__15628__delegate;
    return G__15628
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15636 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15636) {
        var s__15637 = temp__3974__auto____15636;
        var p__15638 = cljs.core.take.call(null, n, s__15637);
        if(n === cljs.core.count.call(null, p__15638)) {
          return cljs.core.cons.call(null, p__15638, partition.call(null, n, step, cljs.core.drop.call(null, step, s__15637)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15639 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____15639) {
        var s__15640 = temp__3974__auto____15639;
        var p__15641 = cljs.core.take.call(null, n, s__15640);
        if(n === cljs.core.count.call(null, p__15641)) {
          return cljs.core.cons.call(null, p__15641, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__15640)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__15641, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__15646 = cljs.core.lookup_sentinel;
    var m__15647 = m;
    var ks__15648 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__15648) {
        var m__15649 = cljs.core._lookup.call(null, m__15647, cljs.core.first.call(null, ks__15648), sentinel__15646);
        if(sentinel__15646 === m__15649) {
          return not_found
        }else {
          var G__15650 = sentinel__15646;
          var G__15651 = m__15649;
          var G__15652 = cljs.core.next.call(null, ks__15648);
          sentinel__15646 = G__15650;
          m__15647 = G__15651;
          ks__15648 = G__15652;
          continue
        }
      }else {
        return m__15647
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__15653, v) {
  var vec__15658__15659 = p__15653;
  var k__15660 = cljs.core.nth.call(null, vec__15658__15659, 0, null);
  var ks__15661 = cljs.core.nthnext.call(null, vec__15658__15659, 1);
  if(cljs.core.truth_(ks__15661)) {
    return cljs.core.assoc.call(null, m, k__15660, assoc_in.call(null, cljs.core._lookup.call(null, m, k__15660, null), ks__15661, v))
  }else {
    return cljs.core.assoc.call(null, m, k__15660, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__15662, f, args) {
    var vec__15667__15668 = p__15662;
    var k__15669 = cljs.core.nth.call(null, vec__15667__15668, 0, null);
    var ks__15670 = cljs.core.nthnext.call(null, vec__15667__15668, 1);
    if(cljs.core.truth_(ks__15670)) {
      return cljs.core.assoc.call(null, m, k__15669, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__15669, null), ks__15670, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__15669, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__15669, null), args))
    }
  };
  var update_in = function(m, p__15662, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__15662, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__15671) {
    var m = cljs.core.first(arglist__15671);
    var p__15662 = cljs.core.first(cljs.core.next(arglist__15671));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15671)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15671)));
    return update_in__delegate(m, p__15662, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15674 = this;
  var h__2192__auto____15675 = this__15674.__hash;
  if(!(h__2192__auto____15675 == null)) {
    return h__2192__auto____15675
  }else {
    var h__2192__auto____15676 = cljs.core.hash_coll.call(null, coll);
    this__15674.__hash = h__2192__auto____15676;
    return h__2192__auto____15676
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15677 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15678 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__15679 = this;
  var new_array__15680 = this__15679.array.slice();
  new_array__15680[k] = v;
  return new cljs.core.Vector(this__15679.meta, new_array__15680, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__15711 = null;
  var G__15711__2 = function(this_sym15681, k) {
    var this__15683 = this;
    var this_sym15681__15684 = this;
    var coll__15685 = this_sym15681__15684;
    return coll__15685.cljs$core$ILookup$_lookup$arity$2(coll__15685, k)
  };
  var G__15711__3 = function(this_sym15682, k, not_found) {
    var this__15683 = this;
    var this_sym15682__15686 = this;
    var coll__15687 = this_sym15682__15686;
    return coll__15687.cljs$core$ILookup$_lookup$arity$3(coll__15687, k, not_found)
  };
  G__15711 = function(this_sym15682, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15711__2.call(this, this_sym15682, k);
      case 3:
        return G__15711__3.call(this, this_sym15682, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15711
}();
cljs.core.Vector.prototype.apply = function(this_sym15672, args15673) {
  var this__15688 = this;
  return this_sym15672.call.apply(this_sym15672, [this_sym15672].concat(args15673.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15689 = this;
  var new_array__15690 = this__15689.array.slice();
  new_array__15690.push(o);
  return new cljs.core.Vector(this__15689.meta, new_array__15690, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__15691 = this;
  var this__15692 = this;
  return cljs.core.pr_str.call(null, this__15692)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__15693 = this;
  return cljs.core.ci_reduce.call(null, this__15693.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__15694 = this;
  return cljs.core.ci_reduce.call(null, this__15694.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15695 = this;
  if(this__15695.array.length > 0) {
    var vector_seq__15696 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__15695.array.length) {
          return cljs.core.cons.call(null, this__15695.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__15696.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15697 = this;
  return this__15697.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15698 = this;
  var count__15699 = this__15698.array.length;
  if(count__15699 > 0) {
    return this__15698.array[count__15699 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15700 = this;
  if(this__15700.array.length > 0) {
    var new_array__15701 = this__15700.array.slice();
    new_array__15701.pop();
    return new cljs.core.Vector(this__15700.meta, new_array__15701, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__15702 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15703 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15704 = this;
  return new cljs.core.Vector(meta, this__15704.array, this__15704.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15705 = this;
  return this__15705.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15706 = this;
  if(function() {
    var and__3822__auto____15707 = 0 <= n;
    if(and__3822__auto____15707) {
      return n < this__15706.array.length
    }else {
      return and__3822__auto____15707
    }
  }()) {
    return this__15706.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15708 = this;
  if(function() {
    var and__3822__auto____15709 = 0 <= n;
    if(and__3822__auto____15709) {
      return n < this__15708.array.length
    }else {
      return and__3822__auto____15709
    }
  }()) {
    return this__15708.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15710 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__15710.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__15713 = pv.cnt;
  if(cnt__15713 < 32) {
    return 0
  }else {
    return cnt__15713 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__15719 = level;
  var ret__15720 = node;
  while(true) {
    if(ll__15719 === 0) {
      return ret__15720
    }else {
      var embed__15721 = ret__15720;
      var r__15722 = cljs.core.pv_fresh_node.call(null, edit);
      var ___15723 = cljs.core.pv_aset.call(null, r__15722, 0, embed__15721);
      var G__15724 = ll__15719 - 5;
      var G__15725 = r__15722;
      ll__15719 = G__15724;
      ret__15720 = G__15725;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__15731 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__15732 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__15731, subidx__15732, tailnode);
    return ret__15731
  }else {
    var child__15733 = cljs.core.pv_aget.call(null, parent, subidx__15732);
    if(!(child__15733 == null)) {
      var node_to_insert__15734 = push_tail.call(null, pv, level - 5, child__15733, tailnode);
      cljs.core.pv_aset.call(null, ret__15731, subidx__15732, node_to_insert__15734);
      return ret__15731
    }else {
      var node_to_insert__15735 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__15731, subidx__15732, node_to_insert__15735);
      return ret__15731
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____15739 = 0 <= i;
    if(and__3822__auto____15739) {
      return i < pv.cnt
    }else {
      return and__3822__auto____15739
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__15740 = pv.root;
      var level__15741 = pv.shift;
      while(true) {
        if(level__15741 > 0) {
          var G__15742 = cljs.core.pv_aget.call(null, node__15740, i >>> level__15741 & 31);
          var G__15743 = level__15741 - 5;
          node__15740 = G__15742;
          level__15741 = G__15743;
          continue
        }else {
          return node__15740.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__15746 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__15746, i & 31, val);
    return ret__15746
  }else {
    var subidx__15747 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__15746, subidx__15747, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__15747), i, val));
    return ret__15746
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__15753 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__15754 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__15753));
    if(function() {
      var and__3822__auto____15755 = new_child__15754 == null;
      if(and__3822__auto____15755) {
        return subidx__15753 === 0
      }else {
        return and__3822__auto____15755
      }
    }()) {
      return null
    }else {
      var ret__15756 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__15756, subidx__15753, new_child__15754);
      return ret__15756
    }
  }else {
    if(subidx__15753 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__15757 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__15757, subidx__15753, null);
        return ret__15757
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__15760 = this;
  return new cljs.core.TransientVector(this__15760.cnt, this__15760.shift, cljs.core.tv_editable_root.call(null, this__15760.root), cljs.core.tv_editable_tail.call(null, this__15760.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15761 = this;
  var h__2192__auto____15762 = this__15761.__hash;
  if(!(h__2192__auto____15762 == null)) {
    return h__2192__auto____15762
  }else {
    var h__2192__auto____15763 = cljs.core.hash_coll.call(null, coll);
    this__15761.__hash = h__2192__auto____15763;
    return h__2192__auto____15763
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15764 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15765 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__15766 = this;
  if(function() {
    var and__3822__auto____15767 = 0 <= k;
    if(and__3822__auto____15767) {
      return k < this__15766.cnt
    }else {
      return and__3822__auto____15767
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__15768 = this__15766.tail.slice();
      new_tail__15768[k & 31] = v;
      return new cljs.core.PersistentVector(this__15766.meta, this__15766.cnt, this__15766.shift, this__15766.root, new_tail__15768, null)
    }else {
      return new cljs.core.PersistentVector(this__15766.meta, this__15766.cnt, this__15766.shift, cljs.core.do_assoc.call(null, coll, this__15766.shift, this__15766.root, k, v), this__15766.tail, null)
    }
  }else {
    if(k === this__15766.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__15766.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__15816 = null;
  var G__15816__2 = function(this_sym15769, k) {
    var this__15771 = this;
    var this_sym15769__15772 = this;
    var coll__15773 = this_sym15769__15772;
    return coll__15773.cljs$core$ILookup$_lookup$arity$2(coll__15773, k)
  };
  var G__15816__3 = function(this_sym15770, k, not_found) {
    var this__15771 = this;
    var this_sym15770__15774 = this;
    var coll__15775 = this_sym15770__15774;
    return coll__15775.cljs$core$ILookup$_lookup$arity$3(coll__15775, k, not_found)
  };
  G__15816 = function(this_sym15770, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15816__2.call(this, this_sym15770, k);
      case 3:
        return G__15816__3.call(this, this_sym15770, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15816
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym15758, args15759) {
  var this__15776 = this;
  return this_sym15758.call.apply(this_sym15758, [this_sym15758].concat(args15759.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__15777 = this;
  var step_init__15778 = [0, init];
  var i__15779 = 0;
  while(true) {
    if(i__15779 < this__15777.cnt) {
      var arr__15780 = cljs.core.array_for.call(null, v, i__15779);
      var len__15781 = arr__15780.length;
      var init__15785 = function() {
        var j__15782 = 0;
        var init__15783 = step_init__15778[1];
        while(true) {
          if(j__15782 < len__15781) {
            var init__15784 = f.call(null, init__15783, j__15782 + i__15779, arr__15780[j__15782]);
            if(cljs.core.reduced_QMARK_.call(null, init__15784)) {
              return init__15784
            }else {
              var G__15817 = j__15782 + 1;
              var G__15818 = init__15784;
              j__15782 = G__15817;
              init__15783 = G__15818;
              continue
            }
          }else {
            step_init__15778[0] = len__15781;
            step_init__15778[1] = init__15783;
            return init__15783
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__15785)) {
        return cljs.core.deref.call(null, init__15785)
      }else {
        var G__15819 = i__15779 + step_init__15778[0];
        i__15779 = G__15819;
        continue
      }
    }else {
      return step_init__15778[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15786 = this;
  if(this__15786.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__15787 = this__15786.tail.slice();
    new_tail__15787.push(o);
    return new cljs.core.PersistentVector(this__15786.meta, this__15786.cnt + 1, this__15786.shift, this__15786.root, new_tail__15787, null)
  }else {
    var root_overflow_QMARK___15788 = this__15786.cnt >>> 5 > 1 << this__15786.shift;
    var new_shift__15789 = root_overflow_QMARK___15788 ? this__15786.shift + 5 : this__15786.shift;
    var new_root__15791 = root_overflow_QMARK___15788 ? function() {
      var n_r__15790 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__15790, 0, this__15786.root);
      cljs.core.pv_aset.call(null, n_r__15790, 1, cljs.core.new_path.call(null, null, this__15786.shift, new cljs.core.VectorNode(null, this__15786.tail)));
      return n_r__15790
    }() : cljs.core.push_tail.call(null, coll, this__15786.shift, this__15786.root, new cljs.core.VectorNode(null, this__15786.tail));
    return new cljs.core.PersistentVector(this__15786.meta, this__15786.cnt + 1, new_shift__15789, new_root__15791, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__15792 = this;
  if(this__15792.cnt > 0) {
    return new cljs.core.RSeq(coll, this__15792.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__15793 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__15794 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__15795 = this;
  var this__15796 = this;
  return cljs.core.pr_str.call(null, this__15796)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__15797 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__15798 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15799 = this;
  if(this__15799.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15800 = this;
  return this__15800.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15801 = this;
  if(this__15801.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__15801.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15802 = this;
  if(this__15802.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__15802.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15802.meta)
    }else {
      if(1 < this__15802.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__15802.meta, this__15802.cnt - 1, this__15802.shift, this__15802.root, this__15802.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__15803 = cljs.core.array_for.call(null, coll, this__15802.cnt - 2);
          var nr__15804 = cljs.core.pop_tail.call(null, coll, this__15802.shift, this__15802.root);
          var new_root__15805 = nr__15804 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__15804;
          var cnt_1__15806 = this__15802.cnt - 1;
          if(function() {
            var and__3822__auto____15807 = 5 < this__15802.shift;
            if(and__3822__auto____15807) {
              return cljs.core.pv_aget.call(null, new_root__15805, 1) == null
            }else {
              return and__3822__auto____15807
            }
          }()) {
            return new cljs.core.PersistentVector(this__15802.meta, cnt_1__15806, this__15802.shift - 5, cljs.core.pv_aget.call(null, new_root__15805, 0), new_tail__15803, null)
          }else {
            return new cljs.core.PersistentVector(this__15802.meta, cnt_1__15806, this__15802.shift, new_root__15805, new_tail__15803, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__15808 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15809 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15810 = this;
  return new cljs.core.PersistentVector(meta, this__15810.cnt, this__15810.shift, this__15810.root, this__15810.tail, this__15810.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15811 = this;
  return this__15811.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15812 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15813 = this;
  if(function() {
    var and__3822__auto____15814 = 0 <= n;
    if(and__3822__auto____15814) {
      return n < this__15813.cnt
    }else {
      return and__3822__auto____15814
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15815 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15815.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__15820 = xs.length;
  var xs__15821 = no_clone === true ? xs : xs.slice();
  if(l__15820 < 32) {
    return new cljs.core.PersistentVector(null, l__15820, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__15821, null)
  }else {
    var node__15822 = xs__15821.slice(0, 32);
    var v__15823 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__15822, null);
    var i__15824 = 32;
    var out__15825 = cljs.core._as_transient.call(null, v__15823);
    while(true) {
      if(i__15824 < l__15820) {
        var G__15826 = i__15824 + 1;
        var G__15827 = cljs.core.conj_BANG_.call(null, out__15825, xs__15821[i__15824]);
        i__15824 = G__15826;
        out__15825 = G__15827;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__15825)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__15828) {
    var args = cljs.core.seq(arglist__15828);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__15829 = this;
  if(this__15829.off + 1 < this__15829.node.length) {
    var s__15830 = cljs.core.chunked_seq.call(null, this__15829.vec, this__15829.node, this__15829.i, this__15829.off + 1);
    if(s__15830 == null) {
      return null
    }else {
      return s__15830
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15831 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15832 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15833 = this;
  return this__15833.node[this__15833.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15834 = this;
  if(this__15834.off + 1 < this__15834.node.length) {
    var s__15835 = cljs.core.chunked_seq.call(null, this__15834.vec, this__15834.node, this__15834.i, this__15834.off + 1);
    if(s__15835 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__15835
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__15836 = this;
  var l__15837 = this__15836.node.length;
  var s__15838 = this__15836.i + l__15837 < cljs.core._count.call(null, this__15836.vec) ? cljs.core.chunked_seq.call(null, this__15836.vec, this__15836.i + l__15837, 0) : null;
  if(s__15838 == null) {
    return null
  }else {
    return s__15838
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15839 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__15840 = this;
  return cljs.core.chunked_seq.call(null, this__15840.vec, this__15840.node, this__15840.i, this__15840.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__15841 = this;
  return this__15841.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15842 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15842.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__15843 = this;
  return cljs.core.array_chunk.call(null, this__15843.node, this__15843.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__15844 = this;
  var l__15845 = this__15844.node.length;
  var s__15846 = this__15844.i + l__15845 < cljs.core._count.call(null, this__15844.vec) ? cljs.core.chunked_seq.call(null, this__15844.vec, this__15844.i + l__15845, 0) : null;
  if(s__15846 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__15846
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15849 = this;
  var h__2192__auto____15850 = this__15849.__hash;
  if(!(h__2192__auto____15850 == null)) {
    return h__2192__auto____15850
  }else {
    var h__2192__auto____15851 = cljs.core.hash_coll.call(null, coll);
    this__15849.__hash = h__2192__auto____15851;
    return h__2192__auto____15851
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15852 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15853 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__15854 = this;
  var v_pos__15855 = this__15854.start + key;
  return new cljs.core.Subvec(this__15854.meta, cljs.core._assoc.call(null, this__15854.v, v_pos__15855, val), this__15854.start, this__15854.end > v_pos__15855 + 1 ? this__15854.end : v_pos__15855 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__15881 = null;
  var G__15881__2 = function(this_sym15856, k) {
    var this__15858 = this;
    var this_sym15856__15859 = this;
    var coll__15860 = this_sym15856__15859;
    return coll__15860.cljs$core$ILookup$_lookup$arity$2(coll__15860, k)
  };
  var G__15881__3 = function(this_sym15857, k, not_found) {
    var this__15858 = this;
    var this_sym15857__15861 = this;
    var coll__15862 = this_sym15857__15861;
    return coll__15862.cljs$core$ILookup$_lookup$arity$3(coll__15862, k, not_found)
  };
  G__15881 = function(this_sym15857, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15881__2.call(this, this_sym15857, k);
      case 3:
        return G__15881__3.call(this, this_sym15857, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15881
}();
cljs.core.Subvec.prototype.apply = function(this_sym15847, args15848) {
  var this__15863 = this;
  return this_sym15847.call.apply(this_sym15847, [this_sym15847].concat(args15848.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15864 = this;
  return new cljs.core.Subvec(this__15864.meta, cljs.core._assoc_n.call(null, this__15864.v, this__15864.end, o), this__15864.start, this__15864.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__15865 = this;
  var this__15866 = this;
  return cljs.core.pr_str.call(null, this__15866)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__15867 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__15868 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15869 = this;
  var subvec_seq__15870 = function subvec_seq(i) {
    if(i === this__15869.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__15869.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__15870.call(null, this__15869.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15871 = this;
  return this__15871.end - this__15871.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15872 = this;
  return cljs.core._nth.call(null, this__15872.v, this__15872.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15873 = this;
  if(this__15873.start === this__15873.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__15873.meta, this__15873.v, this__15873.start, this__15873.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__15874 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15875 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15876 = this;
  return new cljs.core.Subvec(meta, this__15876.v, this__15876.start, this__15876.end, this__15876.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15877 = this;
  return this__15877.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15878 = this;
  return cljs.core._nth.call(null, this__15878.v, this__15878.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15879 = this;
  return cljs.core._nth.call(null, this__15879.v, this__15879.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15880 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__15880.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__15883 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__15883, 0, tl.length);
  return ret__15883
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__15887 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__15888 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__15887, subidx__15888, level === 5 ? tail_node : function() {
    var child__15889 = cljs.core.pv_aget.call(null, ret__15887, subidx__15888);
    if(!(child__15889 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__15889, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__15887
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__15894 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__15895 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__15896 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__15894, subidx__15895));
    if(function() {
      var and__3822__auto____15897 = new_child__15896 == null;
      if(and__3822__auto____15897) {
        return subidx__15895 === 0
      }else {
        return and__3822__auto____15897
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__15894, subidx__15895, new_child__15896);
      return node__15894
    }
  }else {
    if(subidx__15895 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__15894, subidx__15895, null);
        return node__15894
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____15902 = 0 <= i;
    if(and__3822__auto____15902) {
      return i < tv.cnt
    }else {
      return and__3822__auto____15902
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__15903 = tv.root;
      var node__15904 = root__15903;
      var level__15905 = tv.shift;
      while(true) {
        if(level__15905 > 0) {
          var G__15906 = cljs.core.tv_ensure_editable.call(null, root__15903.edit, cljs.core.pv_aget.call(null, node__15904, i >>> level__15905 & 31));
          var G__15907 = level__15905 - 5;
          node__15904 = G__15906;
          level__15905 = G__15907;
          continue
        }else {
          return node__15904.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__15947 = null;
  var G__15947__2 = function(this_sym15910, k) {
    var this__15912 = this;
    var this_sym15910__15913 = this;
    var coll__15914 = this_sym15910__15913;
    return coll__15914.cljs$core$ILookup$_lookup$arity$2(coll__15914, k)
  };
  var G__15947__3 = function(this_sym15911, k, not_found) {
    var this__15912 = this;
    var this_sym15911__15915 = this;
    var coll__15916 = this_sym15911__15915;
    return coll__15916.cljs$core$ILookup$_lookup$arity$3(coll__15916, k, not_found)
  };
  G__15947 = function(this_sym15911, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15947__2.call(this, this_sym15911, k);
      case 3:
        return G__15947__3.call(this, this_sym15911, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15947
}();
cljs.core.TransientVector.prototype.apply = function(this_sym15908, args15909) {
  var this__15917 = this;
  return this_sym15908.call.apply(this_sym15908, [this_sym15908].concat(args15909.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15918 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15919 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__15920 = this;
  if(this__15920.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__15921 = this;
  if(function() {
    var and__3822__auto____15922 = 0 <= n;
    if(and__3822__auto____15922) {
      return n < this__15921.cnt
    }else {
      return and__3822__auto____15922
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15923 = this;
  if(this__15923.root.edit) {
    return this__15923.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__15924 = this;
  if(this__15924.root.edit) {
    if(function() {
      var and__3822__auto____15925 = 0 <= n;
      if(and__3822__auto____15925) {
        return n < this__15924.cnt
      }else {
        return and__3822__auto____15925
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__15924.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__15930 = function go(level, node) {
          var node__15928 = cljs.core.tv_ensure_editable.call(null, this__15924.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__15928, n & 31, val);
            return node__15928
          }else {
            var subidx__15929 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__15928, subidx__15929, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__15928, subidx__15929)));
            return node__15928
          }
        }.call(null, this__15924.shift, this__15924.root);
        this__15924.root = new_root__15930;
        return tcoll
      }
    }else {
      if(n === this__15924.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__15924.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__15931 = this;
  if(this__15931.root.edit) {
    if(this__15931.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__15931.cnt) {
        this__15931.cnt = 0;
        return tcoll
      }else {
        if((this__15931.cnt - 1 & 31) > 0) {
          this__15931.cnt = this__15931.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__15932 = cljs.core.editable_array_for.call(null, tcoll, this__15931.cnt - 2);
            var new_root__15934 = function() {
              var nr__15933 = cljs.core.tv_pop_tail.call(null, tcoll, this__15931.shift, this__15931.root);
              if(!(nr__15933 == null)) {
                return nr__15933
              }else {
                return new cljs.core.VectorNode(this__15931.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____15935 = 5 < this__15931.shift;
              if(and__3822__auto____15935) {
                return cljs.core.pv_aget.call(null, new_root__15934, 1) == null
              }else {
                return and__3822__auto____15935
              }
            }()) {
              var new_root__15936 = cljs.core.tv_ensure_editable.call(null, this__15931.root.edit, cljs.core.pv_aget.call(null, new_root__15934, 0));
              this__15931.root = new_root__15936;
              this__15931.shift = this__15931.shift - 5;
              this__15931.cnt = this__15931.cnt - 1;
              this__15931.tail = new_tail__15932;
              return tcoll
            }else {
              this__15931.root = new_root__15934;
              this__15931.cnt = this__15931.cnt - 1;
              this__15931.tail = new_tail__15932;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__15937 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__15938 = this;
  if(this__15938.root.edit) {
    if(this__15938.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__15938.tail[this__15938.cnt & 31] = o;
      this__15938.cnt = this__15938.cnt + 1;
      return tcoll
    }else {
      var tail_node__15939 = new cljs.core.VectorNode(this__15938.root.edit, this__15938.tail);
      var new_tail__15940 = cljs.core.make_array.call(null, 32);
      new_tail__15940[0] = o;
      this__15938.tail = new_tail__15940;
      if(this__15938.cnt >>> 5 > 1 << this__15938.shift) {
        var new_root_array__15941 = cljs.core.make_array.call(null, 32);
        var new_shift__15942 = this__15938.shift + 5;
        new_root_array__15941[0] = this__15938.root;
        new_root_array__15941[1] = cljs.core.new_path.call(null, this__15938.root.edit, this__15938.shift, tail_node__15939);
        this__15938.root = new cljs.core.VectorNode(this__15938.root.edit, new_root_array__15941);
        this__15938.shift = new_shift__15942;
        this__15938.cnt = this__15938.cnt + 1;
        return tcoll
      }else {
        var new_root__15943 = cljs.core.tv_push_tail.call(null, tcoll, this__15938.shift, this__15938.root, tail_node__15939);
        this__15938.root = new_root__15943;
        this__15938.cnt = this__15938.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__15944 = this;
  if(this__15944.root.edit) {
    this__15944.root.edit = null;
    var len__15945 = this__15944.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__15946 = cljs.core.make_array.call(null, len__15945);
    cljs.core.array_copy.call(null, this__15944.tail, 0, trimmed_tail__15946, 0, len__15945);
    return new cljs.core.PersistentVector(null, this__15944.cnt, this__15944.shift, this__15944.root, trimmed_tail__15946, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15948 = this;
  var h__2192__auto____15949 = this__15948.__hash;
  if(!(h__2192__auto____15949 == null)) {
    return h__2192__auto____15949
  }else {
    var h__2192__auto____15950 = cljs.core.hash_coll.call(null, coll);
    this__15948.__hash = h__2192__auto____15950;
    return h__2192__auto____15950
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15951 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__15952 = this;
  var this__15953 = this;
  return cljs.core.pr_str.call(null, this__15953)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15954 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15955 = this;
  return cljs.core._first.call(null, this__15955.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15956 = this;
  var temp__3971__auto____15957 = cljs.core.next.call(null, this__15956.front);
  if(temp__3971__auto____15957) {
    var f1__15958 = temp__3971__auto____15957;
    return new cljs.core.PersistentQueueSeq(this__15956.meta, f1__15958, this__15956.rear, null)
  }else {
    if(this__15956.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__15956.meta, this__15956.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15959 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15960 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__15960.front, this__15960.rear, this__15960.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15961 = this;
  return this__15961.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15962 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__15962.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15963 = this;
  var h__2192__auto____15964 = this__15963.__hash;
  if(!(h__2192__auto____15964 == null)) {
    return h__2192__auto____15964
  }else {
    var h__2192__auto____15965 = cljs.core.hash_coll.call(null, coll);
    this__15963.__hash = h__2192__auto____15965;
    return h__2192__auto____15965
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15966 = this;
  if(cljs.core.truth_(this__15966.front)) {
    return new cljs.core.PersistentQueue(this__15966.meta, this__15966.count + 1, this__15966.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____15967 = this__15966.rear;
      if(cljs.core.truth_(or__3824__auto____15967)) {
        return or__3824__auto____15967
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__15966.meta, this__15966.count + 1, cljs.core.conj.call(null, this__15966.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__15968 = this;
  var this__15969 = this;
  return cljs.core.pr_str.call(null, this__15969)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15970 = this;
  var rear__15971 = cljs.core.seq.call(null, this__15970.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____15972 = this__15970.front;
    if(cljs.core.truth_(or__3824__auto____15972)) {
      return or__3824__auto____15972
    }else {
      return rear__15971
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__15970.front, cljs.core.seq.call(null, rear__15971), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15973 = this;
  return this__15973.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__15974 = this;
  return cljs.core._first.call(null, this__15974.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__15975 = this;
  if(cljs.core.truth_(this__15975.front)) {
    var temp__3971__auto____15976 = cljs.core.next.call(null, this__15975.front);
    if(temp__3971__auto____15976) {
      var f1__15977 = temp__3971__auto____15976;
      return new cljs.core.PersistentQueue(this__15975.meta, this__15975.count - 1, f1__15977, this__15975.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__15975.meta, this__15975.count - 1, cljs.core.seq.call(null, this__15975.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15978 = this;
  return cljs.core.first.call(null, this__15978.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15979 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15980 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15981 = this;
  return new cljs.core.PersistentQueue(meta, this__15981.count, this__15981.front, this__15981.rear, this__15981.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15982 = this;
  return this__15982.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15983 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__15984 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__15987 = array.length;
  var i__15988 = 0;
  while(true) {
    if(i__15988 < len__15987) {
      if(k === array[i__15988]) {
        return i__15988
      }else {
        var G__15989 = i__15988 + incr;
        i__15988 = G__15989;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__15992 = cljs.core.hash.call(null, a);
  var b__15993 = cljs.core.hash.call(null, b);
  if(a__15992 < b__15993) {
    return-1
  }else {
    if(a__15992 > b__15993) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__16001 = m.keys;
  var len__16002 = ks__16001.length;
  var so__16003 = m.strobj;
  var out__16004 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__16005 = 0;
  var out__16006 = cljs.core.transient$.call(null, out__16004);
  while(true) {
    if(i__16005 < len__16002) {
      var k__16007 = ks__16001[i__16005];
      var G__16008 = i__16005 + 1;
      var G__16009 = cljs.core.assoc_BANG_.call(null, out__16006, k__16007, so__16003[k__16007]);
      i__16005 = G__16008;
      out__16006 = G__16009;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__16006, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__16015 = {};
  var l__16016 = ks.length;
  var i__16017 = 0;
  while(true) {
    if(i__16017 < l__16016) {
      var k__16018 = ks[i__16017];
      new_obj__16015[k__16018] = obj[k__16018];
      var G__16019 = i__16017 + 1;
      i__16017 = G__16019;
      continue
    }else {
    }
    break
  }
  return new_obj__16015
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16022 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16023 = this;
  var h__2192__auto____16024 = this__16023.__hash;
  if(!(h__2192__auto____16024 == null)) {
    return h__2192__auto____16024
  }else {
    var h__2192__auto____16025 = cljs.core.hash_imap.call(null, coll);
    this__16023.__hash = h__2192__auto____16025;
    return h__2192__auto____16025
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16026 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16027 = this;
  if(function() {
    var and__3822__auto____16028 = goog.isString(k);
    if(and__3822__auto____16028) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16027.keys) == null)
    }else {
      return and__3822__auto____16028
    }
  }()) {
    return this__16027.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16029 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____16030 = this__16029.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____16030) {
        return or__3824__auto____16030
      }else {
        return this__16029.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__16029.keys) == null)) {
        var new_strobj__16031 = cljs.core.obj_clone.call(null, this__16029.strobj, this__16029.keys);
        new_strobj__16031[k] = v;
        return new cljs.core.ObjMap(this__16029.meta, this__16029.keys, new_strobj__16031, this__16029.update_count + 1, null)
      }else {
        var new_strobj__16032 = cljs.core.obj_clone.call(null, this__16029.strobj, this__16029.keys);
        var new_keys__16033 = this__16029.keys.slice();
        new_strobj__16032[k] = v;
        new_keys__16033.push(k);
        return new cljs.core.ObjMap(this__16029.meta, new_keys__16033, new_strobj__16032, this__16029.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16034 = this;
  if(function() {
    var and__3822__auto____16035 = goog.isString(k);
    if(and__3822__auto____16035) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16034.keys) == null)
    }else {
      return and__3822__auto____16035
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__16057 = null;
  var G__16057__2 = function(this_sym16036, k) {
    var this__16038 = this;
    var this_sym16036__16039 = this;
    var coll__16040 = this_sym16036__16039;
    return coll__16040.cljs$core$ILookup$_lookup$arity$2(coll__16040, k)
  };
  var G__16057__3 = function(this_sym16037, k, not_found) {
    var this__16038 = this;
    var this_sym16037__16041 = this;
    var coll__16042 = this_sym16037__16041;
    return coll__16042.cljs$core$ILookup$_lookup$arity$3(coll__16042, k, not_found)
  };
  G__16057 = function(this_sym16037, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16057__2.call(this, this_sym16037, k);
      case 3:
        return G__16057__3.call(this, this_sym16037, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16057
}();
cljs.core.ObjMap.prototype.apply = function(this_sym16020, args16021) {
  var this__16043 = this;
  return this_sym16020.call.apply(this_sym16020, [this_sym16020].concat(args16021.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16044 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__16045 = this;
  var this__16046 = this;
  return cljs.core.pr_str.call(null, this__16046)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16047 = this;
  if(this__16047.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__16010_SHARP_) {
      return cljs.core.vector.call(null, p1__16010_SHARP_, this__16047.strobj[p1__16010_SHARP_])
    }, this__16047.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16048 = this;
  return this__16048.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16049 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16050 = this;
  return new cljs.core.ObjMap(meta, this__16050.keys, this__16050.strobj, this__16050.update_count, this__16050.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16051 = this;
  return this__16051.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16052 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__16052.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16053 = this;
  if(function() {
    var and__3822__auto____16054 = goog.isString(k);
    if(and__3822__auto____16054) {
      return!(cljs.core.scan_array.call(null, 1, k, this__16053.keys) == null)
    }else {
      return and__3822__auto____16054
    }
  }()) {
    var new_keys__16055 = this__16053.keys.slice();
    var new_strobj__16056 = cljs.core.obj_clone.call(null, this__16053.strobj, this__16053.keys);
    new_keys__16055.splice(cljs.core.scan_array.call(null, 1, k, new_keys__16055), 1);
    cljs.core.js_delete.call(null, new_strobj__16056, k);
    return new cljs.core.ObjMap(this__16053.meta, new_keys__16055, new_strobj__16056, this__16053.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16061 = this;
  var h__2192__auto____16062 = this__16061.__hash;
  if(!(h__2192__auto____16062 == null)) {
    return h__2192__auto____16062
  }else {
    var h__2192__auto____16063 = cljs.core.hash_imap.call(null, coll);
    this__16061.__hash = h__2192__auto____16063;
    return h__2192__auto____16063
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16064 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16065 = this;
  var bucket__16066 = this__16065.hashobj[cljs.core.hash.call(null, k)];
  var i__16067 = cljs.core.truth_(bucket__16066) ? cljs.core.scan_array.call(null, 2, k, bucket__16066) : null;
  if(cljs.core.truth_(i__16067)) {
    return bucket__16066[i__16067 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16068 = this;
  var h__16069 = cljs.core.hash.call(null, k);
  var bucket__16070 = this__16068.hashobj[h__16069];
  if(cljs.core.truth_(bucket__16070)) {
    var new_bucket__16071 = bucket__16070.slice();
    var new_hashobj__16072 = goog.object.clone(this__16068.hashobj);
    new_hashobj__16072[h__16069] = new_bucket__16071;
    var temp__3971__auto____16073 = cljs.core.scan_array.call(null, 2, k, new_bucket__16071);
    if(cljs.core.truth_(temp__3971__auto____16073)) {
      var i__16074 = temp__3971__auto____16073;
      new_bucket__16071[i__16074 + 1] = v;
      return new cljs.core.HashMap(this__16068.meta, this__16068.count, new_hashobj__16072, null)
    }else {
      new_bucket__16071.push(k, v);
      return new cljs.core.HashMap(this__16068.meta, this__16068.count + 1, new_hashobj__16072, null)
    }
  }else {
    var new_hashobj__16075 = goog.object.clone(this__16068.hashobj);
    new_hashobj__16075[h__16069] = [k, v];
    return new cljs.core.HashMap(this__16068.meta, this__16068.count + 1, new_hashobj__16075, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16076 = this;
  var bucket__16077 = this__16076.hashobj[cljs.core.hash.call(null, k)];
  var i__16078 = cljs.core.truth_(bucket__16077) ? cljs.core.scan_array.call(null, 2, k, bucket__16077) : null;
  if(cljs.core.truth_(i__16078)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__16103 = null;
  var G__16103__2 = function(this_sym16079, k) {
    var this__16081 = this;
    var this_sym16079__16082 = this;
    var coll__16083 = this_sym16079__16082;
    return coll__16083.cljs$core$ILookup$_lookup$arity$2(coll__16083, k)
  };
  var G__16103__3 = function(this_sym16080, k, not_found) {
    var this__16081 = this;
    var this_sym16080__16084 = this;
    var coll__16085 = this_sym16080__16084;
    return coll__16085.cljs$core$ILookup$_lookup$arity$3(coll__16085, k, not_found)
  };
  G__16103 = function(this_sym16080, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16103__2.call(this, this_sym16080, k);
      case 3:
        return G__16103__3.call(this, this_sym16080, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16103
}();
cljs.core.HashMap.prototype.apply = function(this_sym16059, args16060) {
  var this__16086 = this;
  return this_sym16059.call.apply(this_sym16059, [this_sym16059].concat(args16060.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16087 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__16088 = this;
  var this__16089 = this;
  return cljs.core.pr_str.call(null, this__16089)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16090 = this;
  if(this__16090.count > 0) {
    var hashes__16091 = cljs.core.js_keys.call(null, this__16090.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__16058_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__16090.hashobj[p1__16058_SHARP_]))
    }, hashes__16091)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16092 = this;
  return this__16092.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16093 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16094 = this;
  return new cljs.core.HashMap(meta, this__16094.count, this__16094.hashobj, this__16094.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16095 = this;
  return this__16095.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16096 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__16096.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16097 = this;
  var h__16098 = cljs.core.hash.call(null, k);
  var bucket__16099 = this__16097.hashobj[h__16098];
  var i__16100 = cljs.core.truth_(bucket__16099) ? cljs.core.scan_array.call(null, 2, k, bucket__16099) : null;
  if(cljs.core.not.call(null, i__16100)) {
    return coll
  }else {
    var new_hashobj__16101 = goog.object.clone(this__16097.hashobj);
    if(3 > bucket__16099.length) {
      cljs.core.js_delete.call(null, new_hashobj__16101, h__16098)
    }else {
      var new_bucket__16102 = bucket__16099.slice();
      new_bucket__16102.splice(i__16100, 2);
      new_hashobj__16101[h__16098] = new_bucket__16102
    }
    return new cljs.core.HashMap(this__16097.meta, this__16097.count - 1, new_hashobj__16101, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__16104 = ks.length;
  var i__16105 = 0;
  var out__16106 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__16105 < len__16104) {
      var G__16107 = i__16105 + 1;
      var G__16108 = cljs.core.assoc.call(null, out__16106, ks[i__16105], vs[i__16105]);
      i__16105 = G__16107;
      out__16106 = G__16108;
      continue
    }else {
      return out__16106
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__16112 = m.arr;
  var len__16113 = arr__16112.length;
  var i__16114 = 0;
  while(true) {
    if(len__16113 <= i__16114) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__16112[i__16114], k)) {
        return i__16114
      }else {
        if("\ufdd0'else") {
          var G__16115 = i__16114 + 2;
          i__16114 = G__16115;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16118 = this;
  return new cljs.core.TransientArrayMap({}, this__16118.arr.length, this__16118.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16119 = this;
  var h__2192__auto____16120 = this__16119.__hash;
  if(!(h__2192__auto____16120 == null)) {
    return h__2192__auto____16120
  }else {
    var h__2192__auto____16121 = cljs.core.hash_imap.call(null, coll);
    this__16119.__hash = h__2192__auto____16121;
    return h__2192__auto____16121
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16122 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16123 = this;
  var idx__16124 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16124 === -1) {
    return not_found
  }else {
    return this__16123.arr[idx__16124 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16125 = this;
  var idx__16126 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16126 === -1) {
    if(this__16125.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__16125.meta, this__16125.cnt + 1, function() {
        var G__16127__16128 = this__16125.arr.slice();
        G__16127__16128.push(k);
        G__16127__16128.push(v);
        return G__16127__16128
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__16125.arr[idx__16126 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__16125.meta, this__16125.cnt, function() {
          var G__16129__16130 = this__16125.arr.slice();
          G__16129__16130[idx__16126 + 1] = v;
          return G__16129__16130
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16131 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__16163 = null;
  var G__16163__2 = function(this_sym16132, k) {
    var this__16134 = this;
    var this_sym16132__16135 = this;
    var coll__16136 = this_sym16132__16135;
    return coll__16136.cljs$core$ILookup$_lookup$arity$2(coll__16136, k)
  };
  var G__16163__3 = function(this_sym16133, k, not_found) {
    var this__16134 = this;
    var this_sym16133__16137 = this;
    var coll__16138 = this_sym16133__16137;
    return coll__16138.cljs$core$ILookup$_lookup$arity$3(coll__16138, k, not_found)
  };
  G__16163 = function(this_sym16133, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16163__2.call(this, this_sym16133, k);
      case 3:
        return G__16163__3.call(this, this_sym16133, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16163
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym16116, args16117) {
  var this__16139 = this;
  return this_sym16116.call.apply(this_sym16116, [this_sym16116].concat(args16117.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16140 = this;
  var len__16141 = this__16140.arr.length;
  var i__16142 = 0;
  var init__16143 = init;
  while(true) {
    if(i__16142 < len__16141) {
      var init__16144 = f.call(null, init__16143, this__16140.arr[i__16142], this__16140.arr[i__16142 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__16144)) {
        return cljs.core.deref.call(null, init__16144)
      }else {
        var G__16164 = i__16142 + 2;
        var G__16165 = init__16144;
        i__16142 = G__16164;
        init__16143 = G__16165;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16145 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__16146 = this;
  var this__16147 = this;
  return cljs.core.pr_str.call(null, this__16147)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16148 = this;
  if(this__16148.cnt > 0) {
    var len__16149 = this__16148.arr.length;
    var array_map_seq__16150 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__16149) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__16148.arr[i], this__16148.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__16150.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16151 = this;
  return this__16151.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16152 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16153 = this;
  return new cljs.core.PersistentArrayMap(meta, this__16153.cnt, this__16153.arr, this__16153.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16154 = this;
  return this__16154.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16155 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__16155.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16156 = this;
  var idx__16157 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__16157 >= 0) {
    var len__16158 = this__16156.arr.length;
    var new_len__16159 = len__16158 - 2;
    if(new_len__16159 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__16160 = cljs.core.make_array.call(null, new_len__16159);
      var s__16161 = 0;
      var d__16162 = 0;
      while(true) {
        if(s__16161 >= len__16158) {
          return new cljs.core.PersistentArrayMap(this__16156.meta, this__16156.cnt - 1, new_arr__16160, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__16156.arr[s__16161])) {
            var G__16166 = s__16161 + 2;
            var G__16167 = d__16162;
            s__16161 = G__16166;
            d__16162 = G__16167;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__16160[d__16162] = this__16156.arr[s__16161];
              new_arr__16160[d__16162 + 1] = this__16156.arr[s__16161 + 1];
              var G__16168 = s__16161 + 2;
              var G__16169 = d__16162 + 2;
              s__16161 = G__16168;
              d__16162 = G__16169;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__16170 = cljs.core.count.call(null, ks);
  var i__16171 = 0;
  var out__16172 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__16171 < len__16170) {
      var G__16173 = i__16171 + 1;
      var G__16174 = cljs.core.assoc_BANG_.call(null, out__16172, ks[i__16171], vs[i__16171]);
      i__16171 = G__16173;
      out__16172 = G__16174;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16172)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__16175 = this;
  if(cljs.core.truth_(this__16175.editable_QMARK_)) {
    var idx__16176 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__16176 >= 0) {
      this__16175.arr[idx__16176] = this__16175.arr[this__16175.len - 2];
      this__16175.arr[idx__16176 + 1] = this__16175.arr[this__16175.len - 1];
      var G__16177__16178 = this__16175.arr;
      G__16177__16178.pop();
      G__16177__16178.pop();
      G__16177__16178;
      this__16175.len = this__16175.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__16179 = this;
  if(cljs.core.truth_(this__16179.editable_QMARK_)) {
    var idx__16180 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__16180 === -1) {
      if(this__16179.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__16179.len = this__16179.len + 2;
        this__16179.arr.push(key);
        this__16179.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__16179.len, this__16179.arr), key, val)
      }
    }else {
      if(val === this__16179.arr[idx__16180 + 1]) {
        return tcoll
      }else {
        this__16179.arr[idx__16180 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__16181 = this;
  if(cljs.core.truth_(this__16181.editable_QMARK_)) {
    if(function() {
      var G__16182__16183 = o;
      if(G__16182__16183) {
        if(function() {
          var or__3824__auto____16184 = G__16182__16183.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____16184) {
            return or__3824__auto____16184
          }else {
            return G__16182__16183.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__16182__16183.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16182__16183)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16182__16183)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__16185 = cljs.core.seq.call(null, o);
      var tcoll__16186 = tcoll;
      while(true) {
        var temp__3971__auto____16187 = cljs.core.first.call(null, es__16185);
        if(cljs.core.truth_(temp__3971__auto____16187)) {
          var e__16188 = temp__3971__auto____16187;
          var G__16194 = cljs.core.next.call(null, es__16185);
          var G__16195 = tcoll__16186.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__16186, cljs.core.key.call(null, e__16188), cljs.core.val.call(null, e__16188));
          es__16185 = G__16194;
          tcoll__16186 = G__16195;
          continue
        }else {
          return tcoll__16186
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16189 = this;
  if(cljs.core.truth_(this__16189.editable_QMARK_)) {
    this__16189.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__16189.len, 2), this__16189.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__16190 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__16191 = this;
  if(cljs.core.truth_(this__16191.editable_QMARK_)) {
    var idx__16192 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__16192 === -1) {
      return not_found
    }else {
      return this__16191.arr[idx__16192 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__16193 = this;
  if(cljs.core.truth_(this__16193.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__16193.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__16198 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__16199 = 0;
  while(true) {
    if(i__16199 < len) {
      var G__16200 = cljs.core.assoc_BANG_.call(null, out__16198, arr[i__16199], arr[i__16199 + 1]);
      var G__16201 = i__16199 + 2;
      out__16198 = G__16200;
      i__16199 = G__16201;
      continue
    }else {
      return out__16198
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__16206__16207 = arr.slice();
    G__16206__16207[i] = a;
    return G__16206__16207
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__16208__16209 = arr.slice();
    G__16208__16209[i] = a;
    G__16208__16209[j] = b;
    return G__16208__16209
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__16211 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__16211, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__16211, 2 * i, new_arr__16211.length - 2 * i);
  return new_arr__16211
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__16214 = inode.ensure_editable(edit);
    editable__16214.arr[i] = a;
    return editable__16214
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__16215 = inode.ensure_editable(edit);
    editable__16215.arr[i] = a;
    editable__16215.arr[j] = b;
    return editable__16215
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__16222 = arr.length;
  var i__16223 = 0;
  var init__16224 = init;
  while(true) {
    if(i__16223 < len__16222) {
      var init__16227 = function() {
        var k__16225 = arr[i__16223];
        if(!(k__16225 == null)) {
          return f.call(null, init__16224, k__16225, arr[i__16223 + 1])
        }else {
          var node__16226 = arr[i__16223 + 1];
          if(!(node__16226 == null)) {
            return node__16226.kv_reduce(f, init__16224)
          }else {
            return init__16224
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__16227)) {
        return cljs.core.deref.call(null, init__16227)
      }else {
        var G__16228 = i__16223 + 2;
        var G__16229 = init__16227;
        i__16223 = G__16228;
        init__16224 = G__16229;
        continue
      }
    }else {
      return init__16224
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__16230 = this;
  var inode__16231 = this;
  if(this__16230.bitmap === bit) {
    return null
  }else {
    var editable__16232 = inode__16231.ensure_editable(e);
    var earr__16233 = editable__16232.arr;
    var len__16234 = earr__16233.length;
    editable__16232.bitmap = bit ^ editable__16232.bitmap;
    cljs.core.array_copy.call(null, earr__16233, 2 * (i + 1), earr__16233, 2 * i, len__16234 - 2 * (i + 1));
    earr__16233[len__16234 - 2] = null;
    earr__16233[len__16234 - 1] = null;
    return editable__16232
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__16235 = this;
  var inode__16236 = this;
  var bit__16237 = 1 << (hash >>> shift & 31);
  var idx__16238 = cljs.core.bitmap_indexed_node_index.call(null, this__16235.bitmap, bit__16237);
  if((this__16235.bitmap & bit__16237) === 0) {
    var n__16239 = cljs.core.bit_count.call(null, this__16235.bitmap);
    if(2 * n__16239 < this__16235.arr.length) {
      var editable__16240 = inode__16236.ensure_editable(edit);
      var earr__16241 = editable__16240.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__16241, 2 * idx__16238, earr__16241, 2 * (idx__16238 + 1), 2 * (n__16239 - idx__16238));
      earr__16241[2 * idx__16238] = key;
      earr__16241[2 * idx__16238 + 1] = val;
      editable__16240.bitmap = editable__16240.bitmap | bit__16237;
      return editable__16240
    }else {
      if(n__16239 >= 16) {
        var nodes__16242 = cljs.core.make_array.call(null, 32);
        var jdx__16243 = hash >>> shift & 31;
        nodes__16242[jdx__16243] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__16244 = 0;
        var j__16245 = 0;
        while(true) {
          if(i__16244 < 32) {
            if((this__16235.bitmap >>> i__16244 & 1) === 0) {
              var G__16298 = i__16244 + 1;
              var G__16299 = j__16245;
              i__16244 = G__16298;
              j__16245 = G__16299;
              continue
            }else {
              nodes__16242[i__16244] = !(this__16235.arr[j__16245] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__16235.arr[j__16245]), this__16235.arr[j__16245], this__16235.arr[j__16245 + 1], added_leaf_QMARK_) : this__16235.arr[j__16245 + 1];
              var G__16300 = i__16244 + 1;
              var G__16301 = j__16245 + 2;
              i__16244 = G__16300;
              j__16245 = G__16301;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__16239 + 1, nodes__16242)
      }else {
        if("\ufdd0'else") {
          var new_arr__16246 = cljs.core.make_array.call(null, 2 * (n__16239 + 4));
          cljs.core.array_copy.call(null, this__16235.arr, 0, new_arr__16246, 0, 2 * idx__16238);
          new_arr__16246[2 * idx__16238] = key;
          new_arr__16246[2 * idx__16238 + 1] = val;
          cljs.core.array_copy.call(null, this__16235.arr, 2 * idx__16238, new_arr__16246, 2 * (idx__16238 + 1), 2 * (n__16239 - idx__16238));
          added_leaf_QMARK_.val = true;
          var editable__16247 = inode__16236.ensure_editable(edit);
          editable__16247.arr = new_arr__16246;
          editable__16247.bitmap = editable__16247.bitmap | bit__16237;
          return editable__16247
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__16248 = this__16235.arr[2 * idx__16238];
    var val_or_node__16249 = this__16235.arr[2 * idx__16238 + 1];
    if(key_or_nil__16248 == null) {
      var n__16250 = val_or_node__16249.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__16250 === val_or_node__16249) {
        return inode__16236
      }else {
        return cljs.core.edit_and_set.call(null, inode__16236, edit, 2 * idx__16238 + 1, n__16250)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16248)) {
        if(val === val_or_node__16249) {
          return inode__16236
        }else {
          return cljs.core.edit_and_set.call(null, inode__16236, edit, 2 * idx__16238 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__16236, edit, 2 * idx__16238, null, 2 * idx__16238 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__16248, val_or_node__16249, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__16251 = this;
  var inode__16252 = this;
  return cljs.core.create_inode_seq.call(null, this__16251.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__16253 = this;
  var inode__16254 = this;
  var bit__16255 = 1 << (hash >>> shift & 31);
  if((this__16253.bitmap & bit__16255) === 0) {
    return inode__16254
  }else {
    var idx__16256 = cljs.core.bitmap_indexed_node_index.call(null, this__16253.bitmap, bit__16255);
    var key_or_nil__16257 = this__16253.arr[2 * idx__16256];
    var val_or_node__16258 = this__16253.arr[2 * idx__16256 + 1];
    if(key_or_nil__16257 == null) {
      var n__16259 = val_or_node__16258.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__16259 === val_or_node__16258) {
        return inode__16254
      }else {
        if(!(n__16259 == null)) {
          return cljs.core.edit_and_set.call(null, inode__16254, edit, 2 * idx__16256 + 1, n__16259)
        }else {
          if(this__16253.bitmap === bit__16255) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__16254.edit_and_remove_pair(edit, bit__16255, idx__16256)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16257)) {
        removed_leaf_QMARK_[0] = true;
        return inode__16254.edit_and_remove_pair(edit, bit__16255, idx__16256)
      }else {
        if("\ufdd0'else") {
          return inode__16254
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__16260 = this;
  var inode__16261 = this;
  if(e === this__16260.edit) {
    return inode__16261
  }else {
    var n__16262 = cljs.core.bit_count.call(null, this__16260.bitmap);
    var new_arr__16263 = cljs.core.make_array.call(null, n__16262 < 0 ? 4 : 2 * (n__16262 + 1));
    cljs.core.array_copy.call(null, this__16260.arr, 0, new_arr__16263, 0, 2 * n__16262);
    return new cljs.core.BitmapIndexedNode(e, this__16260.bitmap, new_arr__16263)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__16264 = this;
  var inode__16265 = this;
  return cljs.core.inode_kv_reduce.call(null, this__16264.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__16266 = this;
  var inode__16267 = this;
  var bit__16268 = 1 << (hash >>> shift & 31);
  if((this__16266.bitmap & bit__16268) === 0) {
    return not_found
  }else {
    var idx__16269 = cljs.core.bitmap_indexed_node_index.call(null, this__16266.bitmap, bit__16268);
    var key_or_nil__16270 = this__16266.arr[2 * idx__16269];
    var val_or_node__16271 = this__16266.arr[2 * idx__16269 + 1];
    if(key_or_nil__16270 == null) {
      return val_or_node__16271.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16270)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__16270, val_or_node__16271], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__16272 = this;
  var inode__16273 = this;
  var bit__16274 = 1 << (hash >>> shift & 31);
  if((this__16272.bitmap & bit__16274) === 0) {
    return inode__16273
  }else {
    var idx__16275 = cljs.core.bitmap_indexed_node_index.call(null, this__16272.bitmap, bit__16274);
    var key_or_nil__16276 = this__16272.arr[2 * idx__16275];
    var val_or_node__16277 = this__16272.arr[2 * idx__16275 + 1];
    if(key_or_nil__16276 == null) {
      var n__16278 = val_or_node__16277.inode_without(shift + 5, hash, key);
      if(n__16278 === val_or_node__16277) {
        return inode__16273
      }else {
        if(!(n__16278 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__16272.bitmap, cljs.core.clone_and_set.call(null, this__16272.arr, 2 * idx__16275 + 1, n__16278))
        }else {
          if(this__16272.bitmap === bit__16274) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__16272.bitmap ^ bit__16274, cljs.core.remove_pair.call(null, this__16272.arr, idx__16275))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16276)) {
        return new cljs.core.BitmapIndexedNode(null, this__16272.bitmap ^ bit__16274, cljs.core.remove_pair.call(null, this__16272.arr, idx__16275))
      }else {
        if("\ufdd0'else") {
          return inode__16273
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__16279 = this;
  var inode__16280 = this;
  var bit__16281 = 1 << (hash >>> shift & 31);
  var idx__16282 = cljs.core.bitmap_indexed_node_index.call(null, this__16279.bitmap, bit__16281);
  if((this__16279.bitmap & bit__16281) === 0) {
    var n__16283 = cljs.core.bit_count.call(null, this__16279.bitmap);
    if(n__16283 >= 16) {
      var nodes__16284 = cljs.core.make_array.call(null, 32);
      var jdx__16285 = hash >>> shift & 31;
      nodes__16284[jdx__16285] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__16286 = 0;
      var j__16287 = 0;
      while(true) {
        if(i__16286 < 32) {
          if((this__16279.bitmap >>> i__16286 & 1) === 0) {
            var G__16302 = i__16286 + 1;
            var G__16303 = j__16287;
            i__16286 = G__16302;
            j__16287 = G__16303;
            continue
          }else {
            nodes__16284[i__16286] = !(this__16279.arr[j__16287] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__16279.arr[j__16287]), this__16279.arr[j__16287], this__16279.arr[j__16287 + 1], added_leaf_QMARK_) : this__16279.arr[j__16287 + 1];
            var G__16304 = i__16286 + 1;
            var G__16305 = j__16287 + 2;
            i__16286 = G__16304;
            j__16287 = G__16305;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__16283 + 1, nodes__16284)
    }else {
      var new_arr__16288 = cljs.core.make_array.call(null, 2 * (n__16283 + 1));
      cljs.core.array_copy.call(null, this__16279.arr, 0, new_arr__16288, 0, 2 * idx__16282);
      new_arr__16288[2 * idx__16282] = key;
      new_arr__16288[2 * idx__16282 + 1] = val;
      cljs.core.array_copy.call(null, this__16279.arr, 2 * idx__16282, new_arr__16288, 2 * (idx__16282 + 1), 2 * (n__16283 - idx__16282));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__16279.bitmap | bit__16281, new_arr__16288)
    }
  }else {
    var key_or_nil__16289 = this__16279.arr[2 * idx__16282];
    var val_or_node__16290 = this__16279.arr[2 * idx__16282 + 1];
    if(key_or_nil__16289 == null) {
      var n__16291 = val_or_node__16290.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__16291 === val_or_node__16290) {
        return inode__16280
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__16279.bitmap, cljs.core.clone_and_set.call(null, this__16279.arr, 2 * idx__16282 + 1, n__16291))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16289)) {
        if(val === val_or_node__16290) {
          return inode__16280
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__16279.bitmap, cljs.core.clone_and_set.call(null, this__16279.arr, 2 * idx__16282 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__16279.bitmap, cljs.core.clone_and_set.call(null, this__16279.arr, 2 * idx__16282, null, 2 * idx__16282 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__16289, val_or_node__16290, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__16292 = this;
  var inode__16293 = this;
  var bit__16294 = 1 << (hash >>> shift & 31);
  if((this__16292.bitmap & bit__16294) === 0) {
    return not_found
  }else {
    var idx__16295 = cljs.core.bitmap_indexed_node_index.call(null, this__16292.bitmap, bit__16294);
    var key_or_nil__16296 = this__16292.arr[2 * idx__16295];
    var val_or_node__16297 = this__16292.arr[2 * idx__16295 + 1];
    if(key_or_nil__16296 == null) {
      return val_or_node__16297.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__16296)) {
        return val_or_node__16297
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__16313 = array_node.arr;
  var len__16314 = 2 * (array_node.cnt - 1);
  var new_arr__16315 = cljs.core.make_array.call(null, len__16314);
  var i__16316 = 0;
  var j__16317 = 1;
  var bitmap__16318 = 0;
  while(true) {
    if(i__16316 < len__16314) {
      if(function() {
        var and__3822__auto____16319 = !(i__16316 === idx);
        if(and__3822__auto____16319) {
          return!(arr__16313[i__16316] == null)
        }else {
          return and__3822__auto____16319
        }
      }()) {
        new_arr__16315[j__16317] = arr__16313[i__16316];
        var G__16320 = i__16316 + 1;
        var G__16321 = j__16317 + 2;
        var G__16322 = bitmap__16318 | 1 << i__16316;
        i__16316 = G__16320;
        j__16317 = G__16321;
        bitmap__16318 = G__16322;
        continue
      }else {
        var G__16323 = i__16316 + 1;
        var G__16324 = j__16317;
        var G__16325 = bitmap__16318;
        i__16316 = G__16323;
        j__16317 = G__16324;
        bitmap__16318 = G__16325;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__16318, new_arr__16315)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__16326 = this;
  var inode__16327 = this;
  var idx__16328 = hash >>> shift & 31;
  var node__16329 = this__16326.arr[idx__16328];
  if(node__16329 == null) {
    var editable__16330 = cljs.core.edit_and_set.call(null, inode__16327, edit, idx__16328, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__16330.cnt = editable__16330.cnt + 1;
    return editable__16330
  }else {
    var n__16331 = node__16329.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__16331 === node__16329) {
      return inode__16327
    }else {
      return cljs.core.edit_and_set.call(null, inode__16327, edit, idx__16328, n__16331)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__16332 = this;
  var inode__16333 = this;
  return cljs.core.create_array_node_seq.call(null, this__16332.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__16334 = this;
  var inode__16335 = this;
  var idx__16336 = hash >>> shift & 31;
  var node__16337 = this__16334.arr[idx__16336];
  if(node__16337 == null) {
    return inode__16335
  }else {
    var n__16338 = node__16337.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__16338 === node__16337) {
      return inode__16335
    }else {
      if(n__16338 == null) {
        if(this__16334.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__16335, edit, idx__16336)
        }else {
          var editable__16339 = cljs.core.edit_and_set.call(null, inode__16335, edit, idx__16336, n__16338);
          editable__16339.cnt = editable__16339.cnt - 1;
          return editable__16339
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__16335, edit, idx__16336, n__16338)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__16340 = this;
  var inode__16341 = this;
  if(e === this__16340.edit) {
    return inode__16341
  }else {
    return new cljs.core.ArrayNode(e, this__16340.cnt, this__16340.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__16342 = this;
  var inode__16343 = this;
  var len__16344 = this__16342.arr.length;
  var i__16345 = 0;
  var init__16346 = init;
  while(true) {
    if(i__16345 < len__16344) {
      var node__16347 = this__16342.arr[i__16345];
      if(!(node__16347 == null)) {
        var init__16348 = node__16347.kv_reduce(f, init__16346);
        if(cljs.core.reduced_QMARK_.call(null, init__16348)) {
          return cljs.core.deref.call(null, init__16348)
        }else {
          var G__16367 = i__16345 + 1;
          var G__16368 = init__16348;
          i__16345 = G__16367;
          init__16346 = G__16368;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__16346
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__16349 = this;
  var inode__16350 = this;
  var idx__16351 = hash >>> shift & 31;
  var node__16352 = this__16349.arr[idx__16351];
  if(!(node__16352 == null)) {
    return node__16352.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__16353 = this;
  var inode__16354 = this;
  var idx__16355 = hash >>> shift & 31;
  var node__16356 = this__16353.arr[idx__16355];
  if(!(node__16356 == null)) {
    var n__16357 = node__16356.inode_without(shift + 5, hash, key);
    if(n__16357 === node__16356) {
      return inode__16354
    }else {
      if(n__16357 == null) {
        if(this__16353.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__16354, null, idx__16355)
        }else {
          return new cljs.core.ArrayNode(null, this__16353.cnt - 1, cljs.core.clone_and_set.call(null, this__16353.arr, idx__16355, n__16357))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__16353.cnt, cljs.core.clone_and_set.call(null, this__16353.arr, idx__16355, n__16357))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__16354
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__16358 = this;
  var inode__16359 = this;
  var idx__16360 = hash >>> shift & 31;
  var node__16361 = this__16358.arr[idx__16360];
  if(node__16361 == null) {
    return new cljs.core.ArrayNode(null, this__16358.cnt + 1, cljs.core.clone_and_set.call(null, this__16358.arr, idx__16360, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__16362 = node__16361.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__16362 === node__16361) {
      return inode__16359
    }else {
      return new cljs.core.ArrayNode(null, this__16358.cnt, cljs.core.clone_and_set.call(null, this__16358.arr, idx__16360, n__16362))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__16363 = this;
  var inode__16364 = this;
  var idx__16365 = hash >>> shift & 31;
  var node__16366 = this__16363.arr[idx__16365];
  if(!(node__16366 == null)) {
    return node__16366.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__16371 = 2 * cnt;
  var i__16372 = 0;
  while(true) {
    if(i__16372 < lim__16371) {
      if(cljs.core.key_test.call(null, key, arr[i__16372])) {
        return i__16372
      }else {
        var G__16373 = i__16372 + 2;
        i__16372 = G__16373;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__16374 = this;
  var inode__16375 = this;
  if(hash === this__16374.collision_hash) {
    var idx__16376 = cljs.core.hash_collision_node_find_index.call(null, this__16374.arr, this__16374.cnt, key);
    if(idx__16376 === -1) {
      if(this__16374.arr.length > 2 * this__16374.cnt) {
        var editable__16377 = cljs.core.edit_and_set.call(null, inode__16375, edit, 2 * this__16374.cnt, key, 2 * this__16374.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__16377.cnt = editable__16377.cnt + 1;
        return editable__16377
      }else {
        var len__16378 = this__16374.arr.length;
        var new_arr__16379 = cljs.core.make_array.call(null, len__16378 + 2);
        cljs.core.array_copy.call(null, this__16374.arr, 0, new_arr__16379, 0, len__16378);
        new_arr__16379[len__16378] = key;
        new_arr__16379[len__16378 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__16375.ensure_editable_array(edit, this__16374.cnt + 1, new_arr__16379)
      }
    }else {
      if(this__16374.arr[idx__16376 + 1] === val) {
        return inode__16375
      }else {
        return cljs.core.edit_and_set.call(null, inode__16375, edit, idx__16376 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__16374.collision_hash >>> shift & 31), [null, inode__16375, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__16380 = this;
  var inode__16381 = this;
  return cljs.core.create_inode_seq.call(null, this__16380.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__16382 = this;
  var inode__16383 = this;
  var idx__16384 = cljs.core.hash_collision_node_find_index.call(null, this__16382.arr, this__16382.cnt, key);
  if(idx__16384 === -1) {
    return inode__16383
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__16382.cnt === 1) {
      return null
    }else {
      var editable__16385 = inode__16383.ensure_editable(edit);
      var earr__16386 = editable__16385.arr;
      earr__16386[idx__16384] = earr__16386[2 * this__16382.cnt - 2];
      earr__16386[idx__16384 + 1] = earr__16386[2 * this__16382.cnt - 1];
      earr__16386[2 * this__16382.cnt - 1] = null;
      earr__16386[2 * this__16382.cnt - 2] = null;
      editable__16385.cnt = editable__16385.cnt - 1;
      return editable__16385
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__16387 = this;
  var inode__16388 = this;
  if(e === this__16387.edit) {
    return inode__16388
  }else {
    var new_arr__16389 = cljs.core.make_array.call(null, 2 * (this__16387.cnt + 1));
    cljs.core.array_copy.call(null, this__16387.arr, 0, new_arr__16389, 0, 2 * this__16387.cnt);
    return new cljs.core.HashCollisionNode(e, this__16387.collision_hash, this__16387.cnt, new_arr__16389)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__16390 = this;
  var inode__16391 = this;
  return cljs.core.inode_kv_reduce.call(null, this__16390.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__16392 = this;
  var inode__16393 = this;
  var idx__16394 = cljs.core.hash_collision_node_find_index.call(null, this__16392.arr, this__16392.cnt, key);
  if(idx__16394 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__16392.arr[idx__16394])) {
      return cljs.core.PersistentVector.fromArray([this__16392.arr[idx__16394], this__16392.arr[idx__16394 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__16395 = this;
  var inode__16396 = this;
  var idx__16397 = cljs.core.hash_collision_node_find_index.call(null, this__16395.arr, this__16395.cnt, key);
  if(idx__16397 === -1) {
    return inode__16396
  }else {
    if(this__16395.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__16395.collision_hash, this__16395.cnt - 1, cljs.core.remove_pair.call(null, this__16395.arr, cljs.core.quot.call(null, idx__16397, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__16398 = this;
  var inode__16399 = this;
  if(hash === this__16398.collision_hash) {
    var idx__16400 = cljs.core.hash_collision_node_find_index.call(null, this__16398.arr, this__16398.cnt, key);
    if(idx__16400 === -1) {
      var len__16401 = this__16398.arr.length;
      var new_arr__16402 = cljs.core.make_array.call(null, len__16401 + 2);
      cljs.core.array_copy.call(null, this__16398.arr, 0, new_arr__16402, 0, len__16401);
      new_arr__16402[len__16401] = key;
      new_arr__16402[len__16401 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__16398.collision_hash, this__16398.cnt + 1, new_arr__16402)
    }else {
      if(cljs.core._EQ_.call(null, this__16398.arr[idx__16400], val)) {
        return inode__16399
      }else {
        return new cljs.core.HashCollisionNode(null, this__16398.collision_hash, this__16398.cnt, cljs.core.clone_and_set.call(null, this__16398.arr, idx__16400 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__16398.collision_hash >>> shift & 31), [null, inode__16399])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__16403 = this;
  var inode__16404 = this;
  var idx__16405 = cljs.core.hash_collision_node_find_index.call(null, this__16403.arr, this__16403.cnt, key);
  if(idx__16405 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__16403.arr[idx__16405])) {
      return this__16403.arr[idx__16405 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__16406 = this;
  var inode__16407 = this;
  if(e === this__16406.edit) {
    this__16406.arr = array;
    this__16406.cnt = count;
    return inode__16407
  }else {
    return new cljs.core.HashCollisionNode(this__16406.edit, this__16406.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__16412 = cljs.core.hash.call(null, key1);
    if(key1hash__16412 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__16412, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___16413 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__16412, key1, val1, added_leaf_QMARK___16413).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___16413)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__16414 = cljs.core.hash.call(null, key1);
    if(key1hash__16414 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__16414, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___16415 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__16414, key1, val1, added_leaf_QMARK___16415).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___16415)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16416 = this;
  var h__2192__auto____16417 = this__16416.__hash;
  if(!(h__2192__auto____16417 == null)) {
    return h__2192__auto____16417
  }else {
    var h__2192__auto____16418 = cljs.core.hash_coll.call(null, coll);
    this__16416.__hash = h__2192__auto____16418;
    return h__2192__auto____16418
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16419 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__16420 = this;
  var this__16421 = this;
  return cljs.core.pr_str.call(null, this__16421)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__16422 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16423 = this;
  if(this__16423.s == null) {
    return cljs.core.PersistentVector.fromArray([this__16423.nodes[this__16423.i], this__16423.nodes[this__16423.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__16423.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16424 = this;
  if(this__16424.s == null) {
    return cljs.core.create_inode_seq.call(null, this__16424.nodes, this__16424.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__16424.nodes, this__16424.i, cljs.core.next.call(null, this__16424.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16425 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16426 = this;
  return new cljs.core.NodeSeq(meta, this__16426.nodes, this__16426.i, this__16426.s, this__16426.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16427 = this;
  return this__16427.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16428 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16428.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__16435 = nodes.length;
      var j__16436 = i;
      while(true) {
        if(j__16436 < len__16435) {
          if(!(nodes[j__16436] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__16436, null, null)
          }else {
            var temp__3971__auto____16437 = nodes[j__16436 + 1];
            if(cljs.core.truth_(temp__3971__auto____16437)) {
              var node__16438 = temp__3971__auto____16437;
              var temp__3971__auto____16439 = node__16438.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____16439)) {
                var node_seq__16440 = temp__3971__auto____16439;
                return new cljs.core.NodeSeq(null, nodes, j__16436 + 2, node_seq__16440, null)
              }else {
                var G__16441 = j__16436 + 2;
                j__16436 = G__16441;
                continue
              }
            }else {
              var G__16442 = j__16436 + 2;
              j__16436 = G__16442;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16443 = this;
  var h__2192__auto____16444 = this__16443.__hash;
  if(!(h__2192__auto____16444 == null)) {
    return h__2192__auto____16444
  }else {
    var h__2192__auto____16445 = cljs.core.hash_coll.call(null, coll);
    this__16443.__hash = h__2192__auto____16445;
    return h__2192__auto____16445
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16446 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__16447 = this;
  var this__16448 = this;
  return cljs.core.pr_str.call(null, this__16448)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__16449 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__16450 = this;
  return cljs.core.first.call(null, this__16450.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__16451 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__16451.nodes, this__16451.i, cljs.core.next.call(null, this__16451.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16452 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16453 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__16453.nodes, this__16453.i, this__16453.s, this__16453.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16454 = this;
  return this__16454.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16455 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__16455.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__16462 = nodes.length;
      var j__16463 = i;
      while(true) {
        if(j__16463 < len__16462) {
          var temp__3971__auto____16464 = nodes[j__16463];
          if(cljs.core.truth_(temp__3971__auto____16464)) {
            var nj__16465 = temp__3971__auto____16464;
            var temp__3971__auto____16466 = nj__16465.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____16466)) {
              var ns__16467 = temp__3971__auto____16466;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__16463 + 1, ns__16467, null)
            }else {
              var G__16468 = j__16463 + 1;
              j__16463 = G__16468;
              continue
            }
          }else {
            var G__16469 = j__16463 + 1;
            j__16463 = G__16469;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16472 = this;
  return new cljs.core.TransientHashMap({}, this__16472.root, this__16472.cnt, this__16472.has_nil_QMARK_, this__16472.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16473 = this;
  var h__2192__auto____16474 = this__16473.__hash;
  if(!(h__2192__auto____16474 == null)) {
    return h__2192__auto____16474
  }else {
    var h__2192__auto____16475 = cljs.core.hash_imap.call(null, coll);
    this__16473.__hash = h__2192__auto____16475;
    return h__2192__auto____16475
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16476 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16477 = this;
  if(k == null) {
    if(this__16477.has_nil_QMARK_) {
      return this__16477.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__16477.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__16477.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16478 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____16479 = this__16478.has_nil_QMARK_;
      if(and__3822__auto____16479) {
        return v === this__16478.nil_val
      }else {
        return and__3822__auto____16479
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__16478.meta, this__16478.has_nil_QMARK_ ? this__16478.cnt : this__16478.cnt + 1, this__16478.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___16480 = new cljs.core.Box(false);
    var new_root__16481 = (this__16478.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__16478.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___16480);
    if(new_root__16481 === this__16478.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__16478.meta, added_leaf_QMARK___16480.val ? this__16478.cnt + 1 : this__16478.cnt, new_root__16481, this__16478.has_nil_QMARK_, this__16478.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16482 = this;
  if(k == null) {
    return this__16482.has_nil_QMARK_
  }else {
    if(this__16482.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__16482.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__16505 = null;
  var G__16505__2 = function(this_sym16483, k) {
    var this__16485 = this;
    var this_sym16483__16486 = this;
    var coll__16487 = this_sym16483__16486;
    return coll__16487.cljs$core$ILookup$_lookup$arity$2(coll__16487, k)
  };
  var G__16505__3 = function(this_sym16484, k, not_found) {
    var this__16485 = this;
    var this_sym16484__16488 = this;
    var coll__16489 = this_sym16484__16488;
    return coll__16489.cljs$core$ILookup$_lookup$arity$3(coll__16489, k, not_found)
  };
  G__16505 = function(this_sym16484, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16505__2.call(this, this_sym16484, k);
      case 3:
        return G__16505__3.call(this, this_sym16484, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16505
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym16470, args16471) {
  var this__16490 = this;
  return this_sym16470.call.apply(this_sym16470, [this_sym16470].concat(args16471.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16491 = this;
  var init__16492 = this__16491.has_nil_QMARK_ ? f.call(null, init, null, this__16491.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__16492)) {
    return cljs.core.deref.call(null, init__16492)
  }else {
    if(!(this__16491.root == null)) {
      return this__16491.root.kv_reduce(f, init__16492)
    }else {
      if("\ufdd0'else") {
        return init__16492
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16493 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__16494 = this;
  var this__16495 = this;
  return cljs.core.pr_str.call(null, this__16495)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16496 = this;
  if(this__16496.cnt > 0) {
    var s__16497 = !(this__16496.root == null) ? this__16496.root.inode_seq() : null;
    if(this__16496.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__16496.nil_val], true), s__16497)
    }else {
      return s__16497
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16498 = this;
  return this__16498.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16499 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16500 = this;
  return new cljs.core.PersistentHashMap(meta, this__16500.cnt, this__16500.root, this__16500.has_nil_QMARK_, this__16500.nil_val, this__16500.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16501 = this;
  return this__16501.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16502 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__16502.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16503 = this;
  if(k == null) {
    if(this__16503.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__16503.meta, this__16503.cnt - 1, this__16503.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__16503.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__16504 = this__16503.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__16504 === this__16503.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__16503.meta, this__16503.cnt - 1, new_root__16504, this__16503.has_nil_QMARK_, this__16503.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__16506 = ks.length;
  var i__16507 = 0;
  var out__16508 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__16507 < len__16506) {
      var G__16509 = i__16507 + 1;
      var G__16510 = cljs.core.assoc_BANG_.call(null, out__16508, ks[i__16507], vs[i__16507]);
      i__16507 = G__16509;
      out__16508 = G__16510;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16508)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__16511 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__16512 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__16513 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16514 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__16515 = this;
  if(k == null) {
    if(this__16515.has_nil_QMARK_) {
      return this__16515.nil_val
    }else {
      return null
    }
  }else {
    if(this__16515.root == null) {
      return null
    }else {
      return this__16515.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__16516 = this;
  if(k == null) {
    if(this__16516.has_nil_QMARK_) {
      return this__16516.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__16516.root == null) {
      return not_found
    }else {
      return this__16516.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16517 = this;
  if(this__16517.edit) {
    return this__16517.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__16518 = this;
  var tcoll__16519 = this;
  if(this__16518.edit) {
    if(function() {
      var G__16520__16521 = o;
      if(G__16520__16521) {
        if(function() {
          var or__3824__auto____16522 = G__16520__16521.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____16522) {
            return or__3824__auto____16522
          }else {
            return G__16520__16521.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__16520__16521.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16520__16521)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__16520__16521)
      }
    }()) {
      return tcoll__16519.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__16523 = cljs.core.seq.call(null, o);
      var tcoll__16524 = tcoll__16519;
      while(true) {
        var temp__3971__auto____16525 = cljs.core.first.call(null, es__16523);
        if(cljs.core.truth_(temp__3971__auto____16525)) {
          var e__16526 = temp__3971__auto____16525;
          var G__16537 = cljs.core.next.call(null, es__16523);
          var G__16538 = tcoll__16524.assoc_BANG_(cljs.core.key.call(null, e__16526), cljs.core.val.call(null, e__16526));
          es__16523 = G__16537;
          tcoll__16524 = G__16538;
          continue
        }else {
          return tcoll__16524
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__16527 = this;
  var tcoll__16528 = this;
  if(this__16527.edit) {
    if(k == null) {
      if(this__16527.nil_val === v) {
      }else {
        this__16527.nil_val = v
      }
      if(this__16527.has_nil_QMARK_) {
      }else {
        this__16527.count = this__16527.count + 1;
        this__16527.has_nil_QMARK_ = true
      }
      return tcoll__16528
    }else {
      var added_leaf_QMARK___16529 = new cljs.core.Box(false);
      var node__16530 = (this__16527.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__16527.root).inode_assoc_BANG_(this__16527.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___16529);
      if(node__16530 === this__16527.root) {
      }else {
        this__16527.root = node__16530
      }
      if(added_leaf_QMARK___16529.val) {
        this__16527.count = this__16527.count + 1
      }else {
      }
      return tcoll__16528
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__16531 = this;
  var tcoll__16532 = this;
  if(this__16531.edit) {
    if(k == null) {
      if(this__16531.has_nil_QMARK_) {
        this__16531.has_nil_QMARK_ = false;
        this__16531.nil_val = null;
        this__16531.count = this__16531.count - 1;
        return tcoll__16532
      }else {
        return tcoll__16532
      }
    }else {
      if(this__16531.root == null) {
        return tcoll__16532
      }else {
        var removed_leaf_QMARK___16533 = new cljs.core.Box(false);
        var node__16534 = this__16531.root.inode_without_BANG_(this__16531.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___16533);
        if(node__16534 === this__16531.root) {
        }else {
          this__16531.root = node__16534
        }
        if(cljs.core.truth_(removed_leaf_QMARK___16533[0])) {
          this__16531.count = this__16531.count - 1
        }else {
        }
        return tcoll__16532
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__16535 = this;
  var tcoll__16536 = this;
  if(this__16535.edit) {
    this__16535.edit = null;
    return new cljs.core.PersistentHashMap(null, this__16535.count, this__16535.root, this__16535.has_nil_QMARK_, this__16535.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__16541 = node;
  var stack__16542 = stack;
  while(true) {
    if(!(t__16541 == null)) {
      var G__16543 = ascending_QMARK_ ? t__16541.left : t__16541.right;
      var G__16544 = cljs.core.conj.call(null, stack__16542, t__16541);
      t__16541 = G__16543;
      stack__16542 = G__16544;
      continue
    }else {
      return stack__16542
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16545 = this;
  var h__2192__auto____16546 = this__16545.__hash;
  if(!(h__2192__auto____16546 == null)) {
    return h__2192__auto____16546
  }else {
    var h__2192__auto____16547 = cljs.core.hash_coll.call(null, coll);
    this__16545.__hash = h__2192__auto____16547;
    return h__2192__auto____16547
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16548 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__16549 = this;
  var this__16550 = this;
  return cljs.core.pr_str.call(null, this__16550)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__16551 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16552 = this;
  if(this__16552.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__16552.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__16553 = this;
  return cljs.core.peek.call(null, this__16553.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__16554 = this;
  var t__16555 = cljs.core.first.call(null, this__16554.stack);
  var next_stack__16556 = cljs.core.tree_map_seq_push.call(null, this__16554.ascending_QMARK_ ? t__16555.right : t__16555.left, cljs.core.next.call(null, this__16554.stack), this__16554.ascending_QMARK_);
  if(!(next_stack__16556 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__16556, this__16554.ascending_QMARK_, this__16554.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16557 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16558 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__16558.stack, this__16558.ascending_QMARK_, this__16558.cnt, this__16558.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16559 = this;
  return this__16559.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____16561 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____16561) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____16561
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____16563 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____16563) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____16563
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__16567 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__16567)) {
    return cljs.core.deref.call(null, init__16567)
  }else {
    var init__16568 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__16567) : init__16567;
    if(cljs.core.reduced_QMARK_.call(null, init__16568)) {
      return cljs.core.deref.call(null, init__16568)
    }else {
      var init__16569 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__16568) : init__16568;
      if(cljs.core.reduced_QMARK_.call(null, init__16569)) {
        return cljs.core.deref.call(null, init__16569)
      }else {
        return init__16569
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16572 = this;
  var h__2192__auto____16573 = this__16572.__hash;
  if(!(h__2192__auto____16573 == null)) {
    return h__2192__auto____16573
  }else {
    var h__2192__auto____16574 = cljs.core.hash_coll.call(null, coll);
    this__16572.__hash = h__2192__auto____16574;
    return h__2192__auto____16574
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__16575 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__16576 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__16577 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__16577.key, this__16577.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__16625 = null;
  var G__16625__2 = function(this_sym16578, k) {
    var this__16580 = this;
    var this_sym16578__16581 = this;
    var node__16582 = this_sym16578__16581;
    return node__16582.cljs$core$ILookup$_lookup$arity$2(node__16582, k)
  };
  var G__16625__3 = function(this_sym16579, k, not_found) {
    var this__16580 = this;
    var this_sym16579__16583 = this;
    var node__16584 = this_sym16579__16583;
    return node__16584.cljs$core$ILookup$_lookup$arity$3(node__16584, k, not_found)
  };
  G__16625 = function(this_sym16579, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16625__2.call(this, this_sym16579, k);
      case 3:
        return G__16625__3.call(this, this_sym16579, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16625
}();
cljs.core.BlackNode.prototype.apply = function(this_sym16570, args16571) {
  var this__16585 = this;
  return this_sym16570.call.apply(this_sym16570, [this_sym16570].concat(args16571.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__16586 = this;
  return cljs.core.PersistentVector.fromArray([this__16586.key, this__16586.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__16587 = this;
  return this__16587.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__16588 = this;
  return this__16588.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__16589 = this;
  var node__16590 = this;
  return ins.balance_right(node__16590)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__16591 = this;
  var node__16592 = this;
  return new cljs.core.RedNode(this__16591.key, this__16591.val, this__16591.left, this__16591.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__16593 = this;
  var node__16594 = this;
  return cljs.core.balance_right_del.call(null, this__16593.key, this__16593.val, this__16593.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__16595 = this;
  var node__16596 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__16597 = this;
  var node__16598 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__16598, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__16599 = this;
  var node__16600 = this;
  return cljs.core.balance_left_del.call(null, this__16599.key, this__16599.val, del, this__16599.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__16601 = this;
  var node__16602 = this;
  return ins.balance_left(node__16602)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__16603 = this;
  var node__16604 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__16604, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__16626 = null;
  var G__16626__0 = function() {
    var this__16605 = this;
    var this__16607 = this;
    return cljs.core.pr_str.call(null, this__16607)
  };
  G__16626 = function() {
    switch(arguments.length) {
      case 0:
        return G__16626__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16626
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__16608 = this;
  var node__16609 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__16609, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__16610 = this;
  var node__16611 = this;
  return node__16611
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__16612 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__16613 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__16614 = this;
  return cljs.core.list.call(null, this__16614.key, this__16614.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__16615 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__16616 = this;
  return this__16616.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__16617 = this;
  return cljs.core.PersistentVector.fromArray([this__16617.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__16618 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__16618.key, this__16618.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16619 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__16620 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__16620.key, this__16620.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__16621 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__16622 = this;
  if(n === 0) {
    return this__16622.key
  }else {
    if(n === 1) {
      return this__16622.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__16623 = this;
  if(n === 0) {
    return this__16623.key
  }else {
    if(n === 1) {
      return this__16623.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__16624 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16629 = this;
  var h__2192__auto____16630 = this__16629.__hash;
  if(!(h__2192__auto____16630 == null)) {
    return h__2192__auto____16630
  }else {
    var h__2192__auto____16631 = cljs.core.hash_coll.call(null, coll);
    this__16629.__hash = h__2192__auto____16631;
    return h__2192__auto____16631
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__16632 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__16633 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__16634 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__16634.key, this__16634.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__16682 = null;
  var G__16682__2 = function(this_sym16635, k) {
    var this__16637 = this;
    var this_sym16635__16638 = this;
    var node__16639 = this_sym16635__16638;
    return node__16639.cljs$core$ILookup$_lookup$arity$2(node__16639, k)
  };
  var G__16682__3 = function(this_sym16636, k, not_found) {
    var this__16637 = this;
    var this_sym16636__16640 = this;
    var node__16641 = this_sym16636__16640;
    return node__16641.cljs$core$ILookup$_lookup$arity$3(node__16641, k, not_found)
  };
  G__16682 = function(this_sym16636, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16682__2.call(this, this_sym16636, k);
      case 3:
        return G__16682__3.call(this, this_sym16636, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16682
}();
cljs.core.RedNode.prototype.apply = function(this_sym16627, args16628) {
  var this__16642 = this;
  return this_sym16627.call.apply(this_sym16627, [this_sym16627].concat(args16628.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__16643 = this;
  return cljs.core.PersistentVector.fromArray([this__16643.key, this__16643.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__16644 = this;
  return this__16644.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__16645 = this;
  return this__16645.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__16646 = this;
  var node__16647 = this;
  return new cljs.core.RedNode(this__16646.key, this__16646.val, this__16646.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__16648 = this;
  var node__16649 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__16650 = this;
  var node__16651 = this;
  return new cljs.core.RedNode(this__16650.key, this__16650.val, this__16650.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__16652 = this;
  var node__16653 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__16654 = this;
  var node__16655 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__16655, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__16656 = this;
  var node__16657 = this;
  return new cljs.core.RedNode(this__16656.key, this__16656.val, del, this__16656.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__16658 = this;
  var node__16659 = this;
  return new cljs.core.RedNode(this__16658.key, this__16658.val, ins, this__16658.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__16660 = this;
  var node__16661 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16660.left)) {
    return new cljs.core.RedNode(this__16660.key, this__16660.val, this__16660.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__16660.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16660.right)) {
      return new cljs.core.RedNode(this__16660.right.key, this__16660.right.val, new cljs.core.BlackNode(this__16660.key, this__16660.val, this__16660.left, this__16660.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__16660.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__16661, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__16683 = null;
  var G__16683__0 = function() {
    var this__16662 = this;
    var this__16664 = this;
    return cljs.core.pr_str.call(null, this__16664)
  };
  G__16683 = function() {
    switch(arguments.length) {
      case 0:
        return G__16683__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16683
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__16665 = this;
  var node__16666 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16665.right)) {
    return new cljs.core.RedNode(this__16665.key, this__16665.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__16665.left, null), this__16665.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__16665.left)) {
      return new cljs.core.RedNode(this__16665.left.key, this__16665.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__16665.left.left, null), new cljs.core.BlackNode(this__16665.key, this__16665.val, this__16665.left.right, this__16665.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__16666, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__16667 = this;
  var node__16668 = this;
  return new cljs.core.BlackNode(this__16667.key, this__16667.val, this__16667.left, this__16667.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__16669 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__16670 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__16671 = this;
  return cljs.core.list.call(null, this__16671.key, this__16671.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__16672 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__16673 = this;
  return this__16673.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__16674 = this;
  return cljs.core.PersistentVector.fromArray([this__16674.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__16675 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__16675.key, this__16675.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16676 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__16677 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__16677.key, this__16677.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__16678 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__16679 = this;
  if(n === 0) {
    return this__16679.key
  }else {
    if(n === 1) {
      return this__16679.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__16680 = this;
  if(n === 0) {
    return this__16680.key
  }else {
    if(n === 1) {
      return this__16680.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__16681 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__16687 = comp.call(null, k, tree.key);
    if(c__16687 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__16687 < 0) {
        var ins__16688 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__16688 == null)) {
          return tree.add_left(ins__16688)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__16689 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__16689 == null)) {
            return tree.add_right(ins__16689)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__16692 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__16692)) {
            return new cljs.core.RedNode(app__16692.key, app__16692.val, new cljs.core.RedNode(left.key, left.val, left.left, app__16692.left, null), new cljs.core.RedNode(right.key, right.val, app__16692.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__16692, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__16693 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__16693)) {
              return new cljs.core.RedNode(app__16693.key, app__16693.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__16693.left, null), new cljs.core.BlackNode(right.key, right.val, app__16693.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__16693, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__16699 = comp.call(null, k, tree.key);
    if(c__16699 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__16699 < 0) {
        var del__16700 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____16701 = !(del__16700 == null);
          if(or__3824__auto____16701) {
            return or__3824__auto____16701
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__16700, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__16700, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__16702 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____16703 = !(del__16702 == null);
            if(or__3824__auto____16703) {
              return or__3824__auto____16703
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__16702)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__16702, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__16706 = tree.key;
  var c__16707 = comp.call(null, k, tk__16706);
  if(c__16707 === 0) {
    return tree.replace(tk__16706, v, tree.left, tree.right)
  }else {
    if(c__16707 < 0) {
      return tree.replace(tk__16706, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__16706, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16710 = this;
  var h__2192__auto____16711 = this__16710.__hash;
  if(!(h__2192__auto____16711 == null)) {
    return h__2192__auto____16711
  }else {
    var h__2192__auto____16712 = cljs.core.hash_imap.call(null, coll);
    this__16710.__hash = h__2192__auto____16712;
    return h__2192__auto____16712
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__16713 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__16714 = this;
  var n__16715 = coll.entry_at(k);
  if(!(n__16715 == null)) {
    return n__16715.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__16716 = this;
  var found__16717 = [null];
  var t__16718 = cljs.core.tree_map_add.call(null, this__16716.comp, this__16716.tree, k, v, found__16717);
  if(t__16718 == null) {
    var found_node__16719 = cljs.core.nth.call(null, found__16717, 0);
    if(cljs.core._EQ_.call(null, v, found_node__16719.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__16716.comp, cljs.core.tree_map_replace.call(null, this__16716.comp, this__16716.tree, k, v), this__16716.cnt, this__16716.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__16716.comp, t__16718.blacken(), this__16716.cnt + 1, this__16716.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__16720 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__16754 = null;
  var G__16754__2 = function(this_sym16721, k) {
    var this__16723 = this;
    var this_sym16721__16724 = this;
    var coll__16725 = this_sym16721__16724;
    return coll__16725.cljs$core$ILookup$_lookup$arity$2(coll__16725, k)
  };
  var G__16754__3 = function(this_sym16722, k, not_found) {
    var this__16723 = this;
    var this_sym16722__16726 = this;
    var coll__16727 = this_sym16722__16726;
    return coll__16727.cljs$core$ILookup$_lookup$arity$3(coll__16727, k, not_found)
  };
  G__16754 = function(this_sym16722, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16754__2.call(this, this_sym16722, k);
      case 3:
        return G__16754__3.call(this, this_sym16722, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16754
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym16708, args16709) {
  var this__16728 = this;
  return this_sym16708.call.apply(this_sym16708, [this_sym16708].concat(args16709.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__16729 = this;
  if(!(this__16729.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__16729.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__16730 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__16731 = this;
  if(this__16731.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__16731.tree, false, this__16731.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__16732 = this;
  var this__16733 = this;
  return cljs.core.pr_str.call(null, this__16733)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__16734 = this;
  var coll__16735 = this;
  var t__16736 = this__16734.tree;
  while(true) {
    if(!(t__16736 == null)) {
      var c__16737 = this__16734.comp.call(null, k, t__16736.key);
      if(c__16737 === 0) {
        return t__16736
      }else {
        if(c__16737 < 0) {
          var G__16755 = t__16736.left;
          t__16736 = G__16755;
          continue
        }else {
          if("\ufdd0'else") {
            var G__16756 = t__16736.right;
            t__16736 = G__16756;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__16738 = this;
  if(this__16738.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__16738.tree, ascending_QMARK_, this__16738.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__16739 = this;
  if(this__16739.cnt > 0) {
    var stack__16740 = null;
    var t__16741 = this__16739.tree;
    while(true) {
      if(!(t__16741 == null)) {
        var c__16742 = this__16739.comp.call(null, k, t__16741.key);
        if(c__16742 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__16740, t__16741), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__16742 < 0) {
              var G__16757 = cljs.core.conj.call(null, stack__16740, t__16741);
              var G__16758 = t__16741.left;
              stack__16740 = G__16757;
              t__16741 = G__16758;
              continue
            }else {
              var G__16759 = stack__16740;
              var G__16760 = t__16741.right;
              stack__16740 = G__16759;
              t__16741 = G__16760;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__16742 > 0) {
                var G__16761 = cljs.core.conj.call(null, stack__16740, t__16741);
                var G__16762 = t__16741.right;
                stack__16740 = G__16761;
                t__16741 = G__16762;
                continue
              }else {
                var G__16763 = stack__16740;
                var G__16764 = t__16741.left;
                stack__16740 = G__16763;
                t__16741 = G__16764;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__16740 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__16740, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__16743 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__16744 = this;
  return this__16744.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16745 = this;
  if(this__16745.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__16745.tree, true, this__16745.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16746 = this;
  return this__16746.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16747 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16748 = this;
  return new cljs.core.PersistentTreeMap(this__16748.comp, this__16748.tree, this__16748.cnt, meta, this__16748.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16749 = this;
  return this__16749.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16750 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__16750.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__16751 = this;
  var found__16752 = [null];
  var t__16753 = cljs.core.tree_map_remove.call(null, this__16751.comp, this__16751.tree, k, found__16752);
  if(t__16753 == null) {
    if(cljs.core.nth.call(null, found__16752, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__16751.comp, null, 0, this__16751.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__16751.comp, t__16753.blacken(), this__16751.cnt - 1, this__16751.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__16767 = cljs.core.seq.call(null, keyvals);
    var out__16768 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__16767) {
        var G__16769 = cljs.core.nnext.call(null, in__16767);
        var G__16770 = cljs.core.assoc_BANG_.call(null, out__16768, cljs.core.first.call(null, in__16767), cljs.core.second.call(null, in__16767));
        in__16767 = G__16769;
        out__16768 = G__16770;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__16768)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__16771) {
    var keyvals = cljs.core.seq(arglist__16771);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__16772) {
    var keyvals = cljs.core.seq(arglist__16772);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__16776 = [];
    var obj__16777 = {};
    var kvs__16778 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__16778) {
        ks__16776.push(cljs.core.first.call(null, kvs__16778));
        obj__16777[cljs.core.first.call(null, kvs__16778)] = cljs.core.second.call(null, kvs__16778);
        var G__16779 = cljs.core.nnext.call(null, kvs__16778);
        kvs__16778 = G__16779;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__16776, obj__16777)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__16780) {
    var keyvals = cljs.core.seq(arglist__16780);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__16783 = cljs.core.seq.call(null, keyvals);
    var out__16784 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__16783) {
        var G__16785 = cljs.core.nnext.call(null, in__16783);
        var G__16786 = cljs.core.assoc.call(null, out__16784, cljs.core.first.call(null, in__16783), cljs.core.second.call(null, in__16783));
        in__16783 = G__16785;
        out__16784 = G__16786;
        continue
      }else {
        return out__16784
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__16787) {
    var keyvals = cljs.core.seq(arglist__16787);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__16790 = cljs.core.seq.call(null, keyvals);
    var out__16791 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__16790) {
        var G__16792 = cljs.core.nnext.call(null, in__16790);
        var G__16793 = cljs.core.assoc.call(null, out__16791, cljs.core.first.call(null, in__16790), cljs.core.second.call(null, in__16790));
        in__16790 = G__16792;
        out__16791 = G__16793;
        continue
      }else {
        return out__16791
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__16794) {
    var comparator = cljs.core.first(arglist__16794);
    var keyvals = cljs.core.rest(arglist__16794);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__16795_SHARP_, p2__16796_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____16798 = p1__16795_SHARP_;
          if(cljs.core.truth_(or__3824__auto____16798)) {
            return or__3824__auto____16798
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__16796_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__16799) {
    var maps = cljs.core.seq(arglist__16799);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__16807 = function(m, e) {
        var k__16805 = cljs.core.first.call(null, e);
        var v__16806 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__16805)) {
          return cljs.core.assoc.call(null, m, k__16805, f.call(null, cljs.core._lookup.call(null, m, k__16805, null), v__16806))
        }else {
          return cljs.core.assoc.call(null, m, k__16805, v__16806)
        }
      };
      var merge2__16809 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__16807, function() {
          var or__3824__auto____16808 = m1;
          if(cljs.core.truth_(or__3824__auto____16808)) {
            return or__3824__auto____16808
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__16809, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__16810) {
    var f = cljs.core.first(arglist__16810);
    var maps = cljs.core.rest(arglist__16810);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__16815 = cljs.core.ObjMap.EMPTY;
  var keys__16816 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__16816) {
      var key__16817 = cljs.core.first.call(null, keys__16816);
      var entry__16818 = cljs.core._lookup.call(null, map, key__16817, "\ufdd0'cljs.core/not-found");
      var G__16819 = cljs.core.not_EQ_.call(null, entry__16818, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__16815, key__16817, entry__16818) : ret__16815;
      var G__16820 = cljs.core.next.call(null, keys__16816);
      ret__16815 = G__16819;
      keys__16816 = G__16820;
      continue
    }else {
      return ret__16815
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__16824 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__16824.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16825 = this;
  var h__2192__auto____16826 = this__16825.__hash;
  if(!(h__2192__auto____16826 == null)) {
    return h__2192__auto____16826
  }else {
    var h__2192__auto____16827 = cljs.core.hash_iset.call(null, coll);
    this__16825.__hash = h__2192__auto____16827;
    return h__2192__auto____16827
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__16828 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__16829 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__16829.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__16850 = null;
  var G__16850__2 = function(this_sym16830, k) {
    var this__16832 = this;
    var this_sym16830__16833 = this;
    var coll__16834 = this_sym16830__16833;
    return coll__16834.cljs$core$ILookup$_lookup$arity$2(coll__16834, k)
  };
  var G__16850__3 = function(this_sym16831, k, not_found) {
    var this__16832 = this;
    var this_sym16831__16835 = this;
    var coll__16836 = this_sym16831__16835;
    return coll__16836.cljs$core$ILookup$_lookup$arity$3(coll__16836, k, not_found)
  };
  G__16850 = function(this_sym16831, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16850__2.call(this, this_sym16831, k);
      case 3:
        return G__16850__3.call(this, this_sym16831, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16850
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym16822, args16823) {
  var this__16837 = this;
  return this_sym16822.call.apply(this_sym16822, [this_sym16822].concat(args16823.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16838 = this;
  return new cljs.core.PersistentHashSet(this__16838.meta, cljs.core.assoc.call(null, this__16838.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__16839 = this;
  var this__16840 = this;
  return cljs.core.pr_str.call(null, this__16840)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16841 = this;
  return cljs.core.keys.call(null, this__16841.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__16842 = this;
  return new cljs.core.PersistentHashSet(this__16842.meta, cljs.core.dissoc.call(null, this__16842.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16843 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16844 = this;
  var and__3822__auto____16845 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____16845) {
    var and__3822__auto____16846 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____16846) {
      return cljs.core.every_QMARK_.call(null, function(p1__16821_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__16821_SHARP_)
      }, other)
    }else {
      return and__3822__auto____16846
    }
  }else {
    return and__3822__auto____16845
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16847 = this;
  return new cljs.core.PersistentHashSet(meta, this__16847.hash_map, this__16847.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16848 = this;
  return this__16848.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16849 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__16849.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__16851 = cljs.core.count.call(null, items);
  var i__16852 = 0;
  var out__16853 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__16852 < len__16851) {
      var G__16854 = i__16852 + 1;
      var G__16855 = cljs.core.conj_BANG_.call(null, out__16853, items[i__16852]);
      i__16852 = G__16854;
      out__16853 = G__16855;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__16853)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__16873 = null;
  var G__16873__2 = function(this_sym16859, k) {
    var this__16861 = this;
    var this_sym16859__16862 = this;
    var tcoll__16863 = this_sym16859__16862;
    if(cljs.core._lookup.call(null, this__16861.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__16873__3 = function(this_sym16860, k, not_found) {
    var this__16861 = this;
    var this_sym16860__16864 = this;
    var tcoll__16865 = this_sym16860__16864;
    if(cljs.core._lookup.call(null, this__16861.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__16873 = function(this_sym16860, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16873__2.call(this, this_sym16860, k);
      case 3:
        return G__16873__3.call(this, this_sym16860, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16873
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym16857, args16858) {
  var this__16866 = this;
  return this_sym16857.call.apply(this_sym16857, [this_sym16857].concat(args16858.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__16867 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__16868 = this;
  if(cljs.core._lookup.call(null, this__16868.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__16869 = this;
  return cljs.core.count.call(null, this__16869.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__16870 = this;
  this__16870.transient_map = cljs.core.dissoc_BANG_.call(null, this__16870.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__16871 = this;
  this__16871.transient_map = cljs.core.assoc_BANG_.call(null, this__16871.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__16872 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__16872.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__16876 = this;
  var h__2192__auto____16877 = this__16876.__hash;
  if(!(h__2192__auto____16877 == null)) {
    return h__2192__auto____16877
  }else {
    var h__2192__auto____16878 = cljs.core.hash_iset.call(null, coll);
    this__16876.__hash = h__2192__auto____16878;
    return h__2192__auto____16878
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__16879 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__16880 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__16880.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__16906 = null;
  var G__16906__2 = function(this_sym16881, k) {
    var this__16883 = this;
    var this_sym16881__16884 = this;
    var coll__16885 = this_sym16881__16884;
    return coll__16885.cljs$core$ILookup$_lookup$arity$2(coll__16885, k)
  };
  var G__16906__3 = function(this_sym16882, k, not_found) {
    var this__16883 = this;
    var this_sym16882__16886 = this;
    var coll__16887 = this_sym16882__16886;
    return coll__16887.cljs$core$ILookup$_lookup$arity$3(coll__16887, k, not_found)
  };
  G__16906 = function(this_sym16882, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__16906__2.call(this, this_sym16882, k);
      case 3:
        return G__16906__3.call(this, this_sym16882, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16906
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym16874, args16875) {
  var this__16888 = this;
  return this_sym16874.call.apply(this_sym16874, [this_sym16874].concat(args16875.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__16889 = this;
  return new cljs.core.PersistentTreeSet(this__16889.meta, cljs.core.assoc.call(null, this__16889.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__16890 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__16890.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__16891 = this;
  var this__16892 = this;
  return cljs.core.pr_str.call(null, this__16892)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__16893 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__16893.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__16894 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__16894.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__16895 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__16896 = this;
  return cljs.core._comparator.call(null, this__16896.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__16897 = this;
  return cljs.core.keys.call(null, this__16897.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__16898 = this;
  return new cljs.core.PersistentTreeSet(this__16898.meta, cljs.core.dissoc.call(null, this__16898.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__16899 = this;
  return cljs.core.count.call(null, this__16899.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__16900 = this;
  var and__3822__auto____16901 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____16901) {
    var and__3822__auto____16902 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____16902) {
      return cljs.core.every_QMARK_.call(null, function(p1__16856_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__16856_SHARP_)
      }, other)
    }else {
      return and__3822__auto____16902
    }
  }else {
    return and__3822__auto____16901
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__16903 = this;
  return new cljs.core.PersistentTreeSet(meta, this__16903.tree_map, this__16903.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__16904 = this;
  return this__16904.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__16905 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__16905.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__16911__delegate = function(keys) {
      var in__16909 = cljs.core.seq.call(null, keys);
      var out__16910 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__16909)) {
          var G__16912 = cljs.core.next.call(null, in__16909);
          var G__16913 = cljs.core.conj_BANG_.call(null, out__16910, cljs.core.first.call(null, in__16909));
          in__16909 = G__16912;
          out__16910 = G__16913;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__16910)
        }
        break
      }
    };
    var G__16911 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__16911__delegate.call(this, keys)
    };
    G__16911.cljs$lang$maxFixedArity = 0;
    G__16911.cljs$lang$applyTo = function(arglist__16914) {
      var keys = cljs.core.seq(arglist__16914);
      return G__16911__delegate(keys)
    };
    G__16911.cljs$lang$arity$variadic = G__16911__delegate;
    return G__16911
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__16915) {
    var keys = cljs.core.seq(arglist__16915);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__16917) {
    var comparator = cljs.core.first(arglist__16917);
    var keys = cljs.core.rest(arglist__16917);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__16923 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____16924 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____16924)) {
        var e__16925 = temp__3971__auto____16924;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__16925))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__16923, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__16916_SHARP_) {
      var temp__3971__auto____16926 = cljs.core.find.call(null, smap, p1__16916_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____16926)) {
        var e__16927 = temp__3971__auto____16926;
        return cljs.core.second.call(null, e__16927)
      }else {
        return p1__16916_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__16957 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__16950, seen) {
        while(true) {
          var vec__16951__16952 = p__16950;
          var f__16953 = cljs.core.nth.call(null, vec__16951__16952, 0, null);
          var xs__16954 = vec__16951__16952;
          var temp__3974__auto____16955 = cljs.core.seq.call(null, xs__16954);
          if(temp__3974__auto____16955) {
            var s__16956 = temp__3974__auto____16955;
            if(cljs.core.contains_QMARK_.call(null, seen, f__16953)) {
              var G__16958 = cljs.core.rest.call(null, s__16956);
              var G__16959 = seen;
              p__16950 = G__16958;
              seen = G__16959;
              continue
            }else {
              return cljs.core.cons.call(null, f__16953, step.call(null, cljs.core.rest.call(null, s__16956), cljs.core.conj.call(null, seen, f__16953)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__16957.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__16962 = cljs.core.PersistentVector.EMPTY;
  var s__16963 = s;
  while(true) {
    if(cljs.core.next.call(null, s__16963)) {
      var G__16964 = cljs.core.conj.call(null, ret__16962, cljs.core.first.call(null, s__16963));
      var G__16965 = cljs.core.next.call(null, s__16963);
      ret__16962 = G__16964;
      s__16963 = G__16965;
      continue
    }else {
      return cljs.core.seq.call(null, ret__16962)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____16968 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____16968) {
        return or__3824__auto____16968
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__16969 = x.lastIndexOf("/");
      if(i__16969 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__16969 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____16972 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____16972) {
      return or__3824__auto____16972
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__16973 = x.lastIndexOf("/");
    if(i__16973 > -1) {
      return cljs.core.subs.call(null, x, 2, i__16973)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__16980 = cljs.core.ObjMap.EMPTY;
  var ks__16981 = cljs.core.seq.call(null, keys);
  var vs__16982 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____16983 = ks__16981;
      if(and__3822__auto____16983) {
        return vs__16982
      }else {
        return and__3822__auto____16983
      }
    }()) {
      var G__16984 = cljs.core.assoc.call(null, map__16980, cljs.core.first.call(null, ks__16981), cljs.core.first.call(null, vs__16982));
      var G__16985 = cljs.core.next.call(null, ks__16981);
      var G__16986 = cljs.core.next.call(null, vs__16982);
      map__16980 = G__16984;
      ks__16981 = G__16985;
      vs__16982 = G__16986;
      continue
    }else {
      return map__16980
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__16989__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__16974_SHARP_, p2__16975_SHARP_) {
        return max_key.call(null, k, p1__16974_SHARP_, p2__16975_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__16989 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16989__delegate.call(this, k, x, y, more)
    };
    G__16989.cljs$lang$maxFixedArity = 3;
    G__16989.cljs$lang$applyTo = function(arglist__16990) {
      var k = cljs.core.first(arglist__16990);
      var x = cljs.core.first(cljs.core.next(arglist__16990));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16990)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16990)));
      return G__16989__delegate(k, x, y, more)
    };
    G__16989.cljs$lang$arity$variadic = G__16989__delegate;
    return G__16989
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__16991__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__16987_SHARP_, p2__16988_SHARP_) {
        return min_key.call(null, k, p1__16987_SHARP_, p2__16988_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__16991 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__16991__delegate.call(this, k, x, y, more)
    };
    G__16991.cljs$lang$maxFixedArity = 3;
    G__16991.cljs$lang$applyTo = function(arglist__16992) {
      var k = cljs.core.first(arglist__16992);
      var x = cljs.core.first(cljs.core.next(arglist__16992));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16992)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16992)));
      return G__16991__delegate(k, x, y, more)
    };
    G__16991.cljs$lang$arity$variadic = G__16991__delegate;
    return G__16991
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____16995 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____16995) {
        var s__16996 = temp__3974__auto____16995;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__16996), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__16996)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____16999 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____16999) {
      var s__17000 = temp__3974__auto____16999;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__17000)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__17000), take_while.call(null, pred, cljs.core.rest.call(null, s__17000)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__17002 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__17002.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__17014 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____17015 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____17015)) {
        var vec__17016__17017 = temp__3974__auto____17015;
        var e__17018 = cljs.core.nth.call(null, vec__17016__17017, 0, null);
        var s__17019 = vec__17016__17017;
        if(cljs.core.truth_(include__17014.call(null, e__17018))) {
          return s__17019
        }else {
          return cljs.core.next.call(null, s__17019)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__17014, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____17020 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____17020)) {
      var vec__17021__17022 = temp__3974__auto____17020;
      var e__17023 = cljs.core.nth.call(null, vec__17021__17022, 0, null);
      var s__17024 = vec__17021__17022;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__17023)) ? s__17024 : cljs.core.next.call(null, s__17024))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__17036 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____17037 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____17037)) {
        var vec__17038__17039 = temp__3974__auto____17037;
        var e__17040 = cljs.core.nth.call(null, vec__17038__17039, 0, null);
        var s__17041 = vec__17038__17039;
        if(cljs.core.truth_(include__17036.call(null, e__17040))) {
          return s__17041
        }else {
          return cljs.core.next.call(null, s__17041)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__17036, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____17042 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____17042)) {
      var vec__17043__17044 = temp__3974__auto____17042;
      var e__17045 = cljs.core.nth.call(null, vec__17043__17044, 0, null);
      var s__17046 = vec__17043__17044;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__17045)) ? s__17046 : cljs.core.next.call(null, s__17046))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__17047 = this;
  var h__2192__auto____17048 = this__17047.__hash;
  if(!(h__2192__auto____17048 == null)) {
    return h__2192__auto____17048
  }else {
    var h__2192__auto____17049 = cljs.core.hash_coll.call(null, rng);
    this__17047.__hash = h__2192__auto____17049;
    return h__2192__auto____17049
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__17050 = this;
  if(this__17050.step > 0) {
    if(this__17050.start + this__17050.step < this__17050.end) {
      return new cljs.core.Range(this__17050.meta, this__17050.start + this__17050.step, this__17050.end, this__17050.step, null)
    }else {
      return null
    }
  }else {
    if(this__17050.start + this__17050.step > this__17050.end) {
      return new cljs.core.Range(this__17050.meta, this__17050.start + this__17050.step, this__17050.end, this__17050.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__17051 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__17052 = this;
  var this__17053 = this;
  return cljs.core.pr_str.call(null, this__17053)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__17054 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__17055 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__17056 = this;
  if(this__17056.step > 0) {
    if(this__17056.start < this__17056.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__17056.start > this__17056.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__17057 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__17057.end - this__17057.start) / this__17057.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__17058 = this;
  return this__17058.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__17059 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__17059.meta, this__17059.start + this__17059.step, this__17059.end, this__17059.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__17060 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__17061 = this;
  return new cljs.core.Range(meta, this__17061.start, this__17061.end, this__17061.step, this__17061.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__17062 = this;
  return this__17062.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__17063 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__17063.start + n * this__17063.step
  }else {
    if(function() {
      var and__3822__auto____17064 = this__17063.start > this__17063.end;
      if(and__3822__auto____17064) {
        return this__17063.step === 0
      }else {
        return and__3822__auto____17064
      }
    }()) {
      return this__17063.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__17065 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__17065.start + n * this__17065.step
  }else {
    if(function() {
      var and__3822__auto____17066 = this__17065.start > this__17065.end;
      if(and__3822__auto____17066) {
        return this__17065.step === 0
      }else {
        return and__3822__auto____17066
      }
    }()) {
      return this__17065.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__17067 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__17067.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____17070 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17070) {
      var s__17071 = temp__3974__auto____17070;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__17071), take_nth.call(null, n, cljs.core.drop.call(null, n, s__17071)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____17078 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____17078) {
      var s__17079 = temp__3974__auto____17078;
      var fst__17080 = cljs.core.first.call(null, s__17079);
      var fv__17081 = f.call(null, fst__17080);
      var run__17082 = cljs.core.cons.call(null, fst__17080, cljs.core.take_while.call(null, function(p1__17072_SHARP_) {
        return cljs.core._EQ_.call(null, fv__17081, f.call(null, p1__17072_SHARP_))
      }, cljs.core.next.call(null, s__17079)));
      return cljs.core.cons.call(null, run__17082, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__17082), s__17079))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____17097 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____17097) {
        var s__17098 = temp__3971__auto____17097;
        return reductions.call(null, f, cljs.core.first.call(null, s__17098), cljs.core.rest.call(null, s__17098))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____17099 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____17099) {
        var s__17100 = temp__3974__auto____17099;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__17100)), cljs.core.rest.call(null, s__17100))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__17103 = null;
      var G__17103__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__17103__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__17103__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__17103__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__17103__4 = function() {
        var G__17104__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__17104 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17104__delegate.call(this, x, y, z, args)
        };
        G__17104.cljs$lang$maxFixedArity = 3;
        G__17104.cljs$lang$applyTo = function(arglist__17105) {
          var x = cljs.core.first(arglist__17105);
          var y = cljs.core.first(cljs.core.next(arglist__17105));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17105)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17105)));
          return G__17104__delegate(x, y, z, args)
        };
        G__17104.cljs$lang$arity$variadic = G__17104__delegate;
        return G__17104
      }();
      G__17103 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17103__0.call(this);
          case 1:
            return G__17103__1.call(this, x);
          case 2:
            return G__17103__2.call(this, x, y);
          case 3:
            return G__17103__3.call(this, x, y, z);
          default:
            return G__17103__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17103.cljs$lang$maxFixedArity = 3;
      G__17103.cljs$lang$applyTo = G__17103__4.cljs$lang$applyTo;
      return G__17103
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__17106 = null;
      var G__17106__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__17106__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__17106__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__17106__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__17106__4 = function() {
        var G__17107__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__17107 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17107__delegate.call(this, x, y, z, args)
        };
        G__17107.cljs$lang$maxFixedArity = 3;
        G__17107.cljs$lang$applyTo = function(arglist__17108) {
          var x = cljs.core.first(arglist__17108);
          var y = cljs.core.first(cljs.core.next(arglist__17108));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17108)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17108)));
          return G__17107__delegate(x, y, z, args)
        };
        G__17107.cljs$lang$arity$variadic = G__17107__delegate;
        return G__17107
      }();
      G__17106 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17106__0.call(this);
          case 1:
            return G__17106__1.call(this, x);
          case 2:
            return G__17106__2.call(this, x, y);
          case 3:
            return G__17106__3.call(this, x, y, z);
          default:
            return G__17106__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17106.cljs$lang$maxFixedArity = 3;
      G__17106.cljs$lang$applyTo = G__17106__4.cljs$lang$applyTo;
      return G__17106
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__17109 = null;
      var G__17109__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__17109__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__17109__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__17109__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__17109__4 = function() {
        var G__17110__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__17110 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__17110__delegate.call(this, x, y, z, args)
        };
        G__17110.cljs$lang$maxFixedArity = 3;
        G__17110.cljs$lang$applyTo = function(arglist__17111) {
          var x = cljs.core.first(arglist__17111);
          var y = cljs.core.first(cljs.core.next(arglist__17111));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17111)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17111)));
          return G__17110__delegate(x, y, z, args)
        };
        G__17110.cljs$lang$arity$variadic = G__17110__delegate;
        return G__17110
      }();
      G__17109 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__17109__0.call(this);
          case 1:
            return G__17109__1.call(this, x);
          case 2:
            return G__17109__2.call(this, x, y);
          case 3:
            return G__17109__3.call(this, x, y, z);
          default:
            return G__17109__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__17109.cljs$lang$maxFixedArity = 3;
      G__17109.cljs$lang$applyTo = G__17109__4.cljs$lang$applyTo;
      return G__17109
    }()
  };
  var juxt__4 = function() {
    var G__17112__delegate = function(f, g, h, fs) {
      var fs__17102 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__17113 = null;
        var G__17113__0 = function() {
          return cljs.core.reduce.call(null, function(p1__17083_SHARP_, p2__17084_SHARP_) {
            return cljs.core.conj.call(null, p1__17083_SHARP_, p2__17084_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__17102)
        };
        var G__17113__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__17085_SHARP_, p2__17086_SHARP_) {
            return cljs.core.conj.call(null, p1__17085_SHARP_, p2__17086_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__17102)
        };
        var G__17113__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__17087_SHARP_, p2__17088_SHARP_) {
            return cljs.core.conj.call(null, p1__17087_SHARP_, p2__17088_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__17102)
        };
        var G__17113__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__17089_SHARP_, p2__17090_SHARP_) {
            return cljs.core.conj.call(null, p1__17089_SHARP_, p2__17090_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__17102)
        };
        var G__17113__4 = function() {
          var G__17114__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__17091_SHARP_, p2__17092_SHARP_) {
              return cljs.core.conj.call(null, p1__17091_SHARP_, cljs.core.apply.call(null, p2__17092_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__17102)
          };
          var G__17114 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__17114__delegate.call(this, x, y, z, args)
          };
          G__17114.cljs$lang$maxFixedArity = 3;
          G__17114.cljs$lang$applyTo = function(arglist__17115) {
            var x = cljs.core.first(arglist__17115);
            var y = cljs.core.first(cljs.core.next(arglist__17115));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17115)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17115)));
            return G__17114__delegate(x, y, z, args)
          };
          G__17114.cljs$lang$arity$variadic = G__17114__delegate;
          return G__17114
        }();
        G__17113 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__17113__0.call(this);
            case 1:
              return G__17113__1.call(this, x);
            case 2:
              return G__17113__2.call(this, x, y);
            case 3:
              return G__17113__3.call(this, x, y, z);
            default:
              return G__17113__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__17113.cljs$lang$maxFixedArity = 3;
        G__17113.cljs$lang$applyTo = G__17113__4.cljs$lang$applyTo;
        return G__17113
      }()
    };
    var G__17112 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__17112__delegate.call(this, f, g, h, fs)
    };
    G__17112.cljs$lang$maxFixedArity = 3;
    G__17112.cljs$lang$applyTo = function(arglist__17116) {
      var f = cljs.core.first(arglist__17116);
      var g = cljs.core.first(cljs.core.next(arglist__17116));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17116)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__17116)));
      return G__17112__delegate(f, g, h, fs)
    };
    G__17112.cljs$lang$arity$variadic = G__17112__delegate;
    return G__17112
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__17119 = cljs.core.next.call(null, coll);
        coll = G__17119;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____17118 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____17118) {
          return n > 0
        }else {
          return and__3822__auto____17118
        }
      }())) {
        var G__17120 = n - 1;
        var G__17121 = cljs.core.next.call(null, coll);
        n = G__17120;
        coll = G__17121;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__17123 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__17123), s)) {
    if(cljs.core.count.call(null, matches__17123) === 1) {
      return cljs.core.first.call(null, matches__17123)
    }else {
      return cljs.core.vec.call(null, matches__17123)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__17125 = re.exec(s);
  if(matches__17125 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__17125) === 1) {
      return cljs.core.first.call(null, matches__17125)
    }else {
      return cljs.core.vec.call(null, matches__17125)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__17130 = cljs.core.re_find.call(null, re, s);
  var match_idx__17131 = s.search(re);
  var match_str__17132 = cljs.core.coll_QMARK_.call(null, match_data__17130) ? cljs.core.first.call(null, match_data__17130) : match_data__17130;
  var post_match__17133 = cljs.core.subs.call(null, s, match_idx__17131 + cljs.core.count.call(null, match_str__17132));
  if(cljs.core.truth_(match_data__17130)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__17130, re_seq.call(null, re, post_match__17133))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__17140__17141 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___17142 = cljs.core.nth.call(null, vec__17140__17141, 0, null);
  var flags__17143 = cljs.core.nth.call(null, vec__17140__17141, 1, null);
  var pattern__17144 = cljs.core.nth.call(null, vec__17140__17141, 2, null);
  return new RegExp(pattern__17144, flags__17143)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__17134_SHARP_) {
    return print_one.call(null, p1__17134_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____17154 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____17154)) {
            var and__3822__auto____17158 = function() {
              var G__17155__17156 = obj;
              if(G__17155__17156) {
                if(function() {
                  var or__3824__auto____17157 = G__17155__17156.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____17157) {
                    return or__3824__auto____17157
                  }else {
                    return G__17155__17156.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__17155__17156.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__17155__17156)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__17155__17156)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____17158)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____17158
            }
          }else {
            return and__3822__auto____17154
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____17159 = !(obj == null);
          if(and__3822__auto____17159) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____17159
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__17160__17161 = obj;
          if(G__17160__17161) {
            if(function() {
              var or__3824__auto____17162 = G__17160__17161.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____17162) {
                return or__3824__auto____17162
              }else {
                return G__17160__17161.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__17160__17161.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__17160__17161)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__17160__17161)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__17182 = new goog.string.StringBuffer;
  var G__17183__17184 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__17183__17184) {
    var string__17185 = cljs.core.first.call(null, G__17183__17184);
    var G__17183__17186 = G__17183__17184;
    while(true) {
      sb__17182.append(string__17185);
      var temp__3974__auto____17187 = cljs.core.next.call(null, G__17183__17186);
      if(temp__3974__auto____17187) {
        var G__17183__17188 = temp__3974__auto____17187;
        var G__17201 = cljs.core.first.call(null, G__17183__17188);
        var G__17202 = G__17183__17188;
        string__17185 = G__17201;
        G__17183__17186 = G__17202;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__17189__17190 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__17189__17190) {
    var obj__17191 = cljs.core.first.call(null, G__17189__17190);
    var G__17189__17192 = G__17189__17190;
    while(true) {
      sb__17182.append(" ");
      var G__17193__17194 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__17191, opts));
      if(G__17193__17194) {
        var string__17195 = cljs.core.first.call(null, G__17193__17194);
        var G__17193__17196 = G__17193__17194;
        while(true) {
          sb__17182.append(string__17195);
          var temp__3974__auto____17197 = cljs.core.next.call(null, G__17193__17196);
          if(temp__3974__auto____17197) {
            var G__17193__17198 = temp__3974__auto____17197;
            var G__17203 = cljs.core.first.call(null, G__17193__17198);
            var G__17204 = G__17193__17198;
            string__17195 = G__17203;
            G__17193__17196 = G__17204;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____17199 = cljs.core.next.call(null, G__17189__17192);
      if(temp__3974__auto____17199) {
        var G__17189__17200 = temp__3974__auto____17199;
        var G__17205 = cljs.core.first.call(null, G__17189__17200);
        var G__17206 = G__17189__17200;
        obj__17191 = G__17205;
        G__17189__17192 = G__17206;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__17182
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__17208 = cljs.core.pr_sb.call(null, objs, opts);
  sb__17208.append("\n");
  return[cljs.core.str(sb__17208)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__17227__17228 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__17227__17228) {
    var string__17229 = cljs.core.first.call(null, G__17227__17228);
    var G__17227__17230 = G__17227__17228;
    while(true) {
      cljs.core.string_print.call(null, string__17229);
      var temp__3974__auto____17231 = cljs.core.next.call(null, G__17227__17230);
      if(temp__3974__auto____17231) {
        var G__17227__17232 = temp__3974__auto____17231;
        var G__17245 = cljs.core.first.call(null, G__17227__17232);
        var G__17246 = G__17227__17232;
        string__17229 = G__17245;
        G__17227__17230 = G__17246;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__17233__17234 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__17233__17234) {
    var obj__17235 = cljs.core.first.call(null, G__17233__17234);
    var G__17233__17236 = G__17233__17234;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__17237__17238 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__17235, opts));
      if(G__17237__17238) {
        var string__17239 = cljs.core.first.call(null, G__17237__17238);
        var G__17237__17240 = G__17237__17238;
        while(true) {
          cljs.core.string_print.call(null, string__17239);
          var temp__3974__auto____17241 = cljs.core.next.call(null, G__17237__17240);
          if(temp__3974__auto____17241) {
            var G__17237__17242 = temp__3974__auto____17241;
            var G__17247 = cljs.core.first.call(null, G__17237__17242);
            var G__17248 = G__17237__17242;
            string__17239 = G__17247;
            G__17237__17240 = G__17248;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____17243 = cljs.core.next.call(null, G__17233__17236);
      if(temp__3974__auto____17243) {
        var G__17233__17244 = temp__3974__auto____17243;
        var G__17249 = cljs.core.first.call(null, G__17233__17244);
        var G__17250 = G__17233__17244;
        obj__17235 = G__17249;
        G__17233__17236 = G__17250;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__17251) {
    var objs = cljs.core.seq(arglist__17251);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__17252) {
    var objs = cljs.core.seq(arglist__17252);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__17253) {
    var objs = cljs.core.seq(arglist__17253);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__17254) {
    var objs = cljs.core.seq(arglist__17254);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__17255) {
    var objs = cljs.core.seq(arglist__17255);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__17256) {
    var objs = cljs.core.seq(arglist__17256);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__17257) {
    var objs = cljs.core.seq(arglist__17257);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__17258) {
    var objs = cljs.core.seq(arglist__17258);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__17259) {
    var fmt = cljs.core.first(arglist__17259);
    var args = cljs.core.rest(arglist__17259);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17260 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17260, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17261 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17261, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17262 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17262, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____17263 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____17263)) {
        var nspc__17264 = temp__3974__auto____17263;
        return[cljs.core.str(nspc__17264), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____17265 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____17265)) {
          var nspc__17266 = temp__3974__auto____17265;
          return[cljs.core.str(nspc__17266), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17267 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17267, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__17269 = function(n, len) {
    var ns__17268 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__17268) < len) {
        var G__17271 = [cljs.core.str("0"), cljs.core.str(ns__17268)].join("");
        ns__17268 = G__17271;
        continue
      }else {
        return ns__17268
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__17269.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__17269.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__17269.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__17269.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__17269.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__17269.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__17270 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__17270, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__17272 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__17273 = this;
  var G__17274__17275 = cljs.core.seq.call(null, this__17273.watches);
  if(G__17274__17275) {
    var G__17277__17279 = cljs.core.first.call(null, G__17274__17275);
    var vec__17278__17280 = G__17277__17279;
    var key__17281 = cljs.core.nth.call(null, vec__17278__17280, 0, null);
    var f__17282 = cljs.core.nth.call(null, vec__17278__17280, 1, null);
    var G__17274__17283 = G__17274__17275;
    var G__17277__17284 = G__17277__17279;
    var G__17274__17285 = G__17274__17283;
    while(true) {
      var vec__17286__17287 = G__17277__17284;
      var key__17288 = cljs.core.nth.call(null, vec__17286__17287, 0, null);
      var f__17289 = cljs.core.nth.call(null, vec__17286__17287, 1, null);
      var G__17274__17290 = G__17274__17285;
      f__17289.call(null, key__17288, this$, oldval, newval);
      var temp__3974__auto____17291 = cljs.core.next.call(null, G__17274__17290);
      if(temp__3974__auto____17291) {
        var G__17274__17292 = temp__3974__auto____17291;
        var G__17299 = cljs.core.first.call(null, G__17274__17292);
        var G__17300 = G__17274__17292;
        G__17277__17284 = G__17299;
        G__17274__17285 = G__17300;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__17293 = this;
  return this$.watches = cljs.core.assoc.call(null, this__17293.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__17294 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__17294.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__17295 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__17295.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__17296 = this;
  return this__17296.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__17297 = this;
  return this__17297.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__17298 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__17312__delegate = function(x, p__17301) {
      var map__17307__17308 = p__17301;
      var map__17307__17309 = cljs.core.seq_QMARK_.call(null, map__17307__17308) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17307__17308) : map__17307__17308;
      var validator__17310 = cljs.core._lookup.call(null, map__17307__17309, "\ufdd0'validator", null);
      var meta__17311 = cljs.core._lookup.call(null, map__17307__17309, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__17311, validator__17310, null)
    };
    var G__17312 = function(x, var_args) {
      var p__17301 = null;
      if(goog.isDef(var_args)) {
        p__17301 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__17312__delegate.call(this, x, p__17301)
    };
    G__17312.cljs$lang$maxFixedArity = 1;
    G__17312.cljs$lang$applyTo = function(arglist__17313) {
      var x = cljs.core.first(arglist__17313);
      var p__17301 = cljs.core.rest(arglist__17313);
      return G__17312__delegate(x, p__17301)
    };
    G__17312.cljs$lang$arity$variadic = G__17312__delegate;
    return G__17312
  }();
  atom = function(x, var_args) {
    var p__17301 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____17317 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____17317)) {
    var validate__17318 = temp__3974__auto____17317;
    if(cljs.core.truth_(validate__17318.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__17319 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__17319, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__17320__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__17320 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__17320__delegate.call(this, a, f, x, y, z, more)
    };
    G__17320.cljs$lang$maxFixedArity = 5;
    G__17320.cljs$lang$applyTo = function(arglist__17321) {
      var a = cljs.core.first(arglist__17321);
      var f = cljs.core.first(cljs.core.next(arglist__17321));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__17321)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17321))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17321)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__17321)))));
      return G__17320__delegate(a, f, x, y, z, more)
    };
    G__17320.cljs$lang$arity$variadic = G__17320__delegate;
    return G__17320
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__17322) {
    var iref = cljs.core.first(arglist__17322);
    var f = cljs.core.first(cljs.core.next(arglist__17322));
    var args = cljs.core.rest(cljs.core.next(arglist__17322));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__17323 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__17323.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__17324 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__17324.state, function(p__17325) {
    var map__17326__17327 = p__17325;
    var map__17326__17328 = cljs.core.seq_QMARK_.call(null, map__17326__17327) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17326__17327) : map__17326__17327;
    var curr_state__17329 = map__17326__17328;
    var done__17330 = cljs.core._lookup.call(null, map__17326__17328, "\ufdd0'done", null);
    if(cljs.core.truth_(done__17330)) {
      return curr_state__17329
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__17324.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__17351__17352 = options;
    var map__17351__17353 = cljs.core.seq_QMARK_.call(null, map__17351__17352) ? cljs.core.apply.call(null, cljs.core.hash_map, map__17351__17352) : map__17351__17352;
    var keywordize_keys__17354 = cljs.core._lookup.call(null, map__17351__17353, "\ufdd0'keywordize-keys", null);
    var keyfn__17355 = cljs.core.truth_(keywordize_keys__17354) ? cljs.core.keyword : cljs.core.str;
    var f__17370 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2462__auto____17369 = function iter__17363(s__17364) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__17364__17367 = s__17364;
                    while(true) {
                      if(cljs.core.seq.call(null, s__17364__17367)) {
                        var k__17368 = cljs.core.first.call(null, s__17364__17367);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__17355.call(null, k__17368), thisfn.call(null, x[k__17368])], true), iter__17363.call(null, cljs.core.rest.call(null, s__17364__17367)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____17369.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__17370.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__17371) {
    var x = cljs.core.first(arglist__17371);
    var options = cljs.core.rest(arglist__17371);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__17376 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__17380__delegate = function(args) {
      var temp__3971__auto____17377 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__17376), args, null);
      if(cljs.core.truth_(temp__3971__auto____17377)) {
        var v__17378 = temp__3971__auto____17377;
        return v__17378
      }else {
        var ret__17379 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__17376, cljs.core.assoc, args, ret__17379);
        return ret__17379
      }
    };
    var G__17380 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__17380__delegate.call(this, args)
    };
    G__17380.cljs$lang$maxFixedArity = 0;
    G__17380.cljs$lang$applyTo = function(arglist__17381) {
      var args = cljs.core.seq(arglist__17381);
      return G__17380__delegate(args)
    };
    G__17380.cljs$lang$arity$variadic = G__17380__delegate;
    return G__17380
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__17383 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__17383)) {
        var G__17384 = ret__17383;
        f = G__17384;
        continue
      }else {
        return ret__17383
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__17385__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__17385 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__17385__delegate.call(this, f, args)
    };
    G__17385.cljs$lang$maxFixedArity = 1;
    G__17385.cljs$lang$applyTo = function(arglist__17386) {
      var f = cljs.core.first(arglist__17386);
      var args = cljs.core.rest(arglist__17386);
      return G__17385__delegate(f, args)
    };
    G__17385.cljs$lang$arity$variadic = G__17385__delegate;
    return G__17385
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__17388 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__17388, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__17388, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____17397 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____17397) {
      return or__3824__auto____17397
    }else {
      var or__3824__auto____17398 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____17398) {
        return or__3824__auto____17398
      }else {
        var and__3822__auto____17399 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____17399) {
          var and__3822__auto____17400 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____17400) {
            var and__3822__auto____17401 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____17401) {
              var ret__17402 = true;
              var i__17403 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____17404 = cljs.core.not.call(null, ret__17402);
                  if(or__3824__auto____17404) {
                    return or__3824__auto____17404
                  }else {
                    return i__17403 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__17402
                }else {
                  var G__17405 = isa_QMARK_.call(null, h, child.call(null, i__17403), parent.call(null, i__17403));
                  var G__17406 = i__17403 + 1;
                  ret__17402 = G__17405;
                  i__17403 = G__17406;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____17401
            }
          }else {
            return and__3822__auto____17400
          }
        }else {
          return and__3822__auto____17399
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__17415 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__17416 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__17417 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__17418 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____17419 = cljs.core.contains_QMARK_.call(null, tp__17415.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__17417.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__17417.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__17415, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__17418.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__17416, parent, ta__17417), "\ufdd0'descendants":tf__17418.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__17417, tag, td__17416)})
    }();
    if(cljs.core.truth_(or__3824__auto____17419)) {
      return or__3824__auto____17419
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__17424 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__17425 = cljs.core.truth_(parentMap__17424.call(null, tag)) ? cljs.core.disj.call(null, parentMap__17424.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__17426 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__17425)) ? cljs.core.assoc.call(null, parentMap__17424, tag, childsParents__17425) : cljs.core.dissoc.call(null, parentMap__17424, tag);
    var deriv_seq__17427 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__17407_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__17407_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__17407_SHARP_), cljs.core.second.call(null, p1__17407_SHARP_)))
    }, cljs.core.seq.call(null, newParents__17426)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__17424.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__17408_SHARP_, p2__17409_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__17408_SHARP_, p2__17409_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__17427))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__17435 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____17437 = cljs.core.truth_(function() {
    var and__3822__auto____17436 = xprefs__17435;
    if(cljs.core.truth_(and__3822__auto____17436)) {
      return xprefs__17435.call(null, y)
    }else {
      return and__3822__auto____17436
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____17437)) {
    return or__3824__auto____17437
  }else {
    var or__3824__auto____17439 = function() {
      var ps__17438 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__17438) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__17438), prefer_table))) {
          }else {
          }
          var G__17442 = cljs.core.rest.call(null, ps__17438);
          ps__17438 = G__17442;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____17439)) {
      return or__3824__auto____17439
    }else {
      var or__3824__auto____17441 = function() {
        var ps__17440 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__17440) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__17440), y, prefer_table))) {
            }else {
            }
            var G__17443 = cljs.core.rest.call(null, ps__17440);
            ps__17440 = G__17443;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____17441)) {
        return or__3824__auto____17441
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____17445 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____17445)) {
    return or__3824__auto____17445
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__17463 = cljs.core.reduce.call(null, function(be, p__17455) {
    var vec__17456__17457 = p__17455;
    var k__17458 = cljs.core.nth.call(null, vec__17456__17457, 0, null);
    var ___17459 = cljs.core.nth.call(null, vec__17456__17457, 1, null);
    var e__17460 = vec__17456__17457;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__17458)) {
      var be2__17462 = cljs.core.truth_(function() {
        var or__3824__auto____17461 = be == null;
        if(or__3824__auto____17461) {
          return or__3824__auto____17461
        }else {
          return cljs.core.dominates.call(null, k__17458, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__17460 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__17462), k__17458, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__17458), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__17462)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__17462
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__17463)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__17463));
      return cljs.core.second.call(null, best_entry__17463)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____17468 = mf;
    if(and__3822__auto____17468) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____17468
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____17469 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17470 = cljs.core._reset[goog.typeOf(x__2363__auto____17469)];
      if(or__3824__auto____17470) {
        return or__3824__auto____17470
      }else {
        var or__3824__auto____17471 = cljs.core._reset["_"];
        if(or__3824__auto____17471) {
          return or__3824__auto____17471
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____17476 = mf;
    if(and__3822__auto____17476) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____17476
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____17477 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17478 = cljs.core._add_method[goog.typeOf(x__2363__auto____17477)];
      if(or__3824__auto____17478) {
        return or__3824__auto____17478
      }else {
        var or__3824__auto____17479 = cljs.core._add_method["_"];
        if(or__3824__auto____17479) {
          return or__3824__auto____17479
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____17484 = mf;
    if(and__3822__auto____17484) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____17484
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____17485 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17486 = cljs.core._remove_method[goog.typeOf(x__2363__auto____17485)];
      if(or__3824__auto____17486) {
        return or__3824__auto____17486
      }else {
        var or__3824__auto____17487 = cljs.core._remove_method["_"];
        if(or__3824__auto____17487) {
          return or__3824__auto____17487
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____17492 = mf;
    if(and__3822__auto____17492) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____17492
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____17493 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17494 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____17493)];
      if(or__3824__auto____17494) {
        return or__3824__auto____17494
      }else {
        var or__3824__auto____17495 = cljs.core._prefer_method["_"];
        if(or__3824__auto____17495) {
          return or__3824__auto____17495
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____17500 = mf;
    if(and__3822__auto____17500) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____17500
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____17501 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17502 = cljs.core._get_method[goog.typeOf(x__2363__auto____17501)];
      if(or__3824__auto____17502) {
        return or__3824__auto____17502
      }else {
        var or__3824__auto____17503 = cljs.core._get_method["_"];
        if(or__3824__auto____17503) {
          return or__3824__auto____17503
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____17508 = mf;
    if(and__3822__auto____17508) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____17508
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____17509 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17510 = cljs.core._methods[goog.typeOf(x__2363__auto____17509)];
      if(or__3824__auto____17510) {
        return or__3824__auto____17510
      }else {
        var or__3824__auto____17511 = cljs.core._methods["_"];
        if(or__3824__auto____17511) {
          return or__3824__auto____17511
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____17516 = mf;
    if(and__3822__auto____17516) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____17516
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____17517 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17518 = cljs.core._prefers[goog.typeOf(x__2363__auto____17517)];
      if(or__3824__auto____17518) {
        return or__3824__auto____17518
      }else {
        var or__3824__auto____17519 = cljs.core._prefers["_"];
        if(or__3824__auto____17519) {
          return or__3824__auto____17519
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____17524 = mf;
    if(and__3822__auto____17524) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____17524
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____17525 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____17526 = cljs.core._dispatch[goog.typeOf(x__2363__auto____17525)];
      if(or__3824__auto____17526) {
        return or__3824__auto____17526
      }else {
        var or__3824__auto____17527 = cljs.core._dispatch["_"];
        if(or__3824__auto____17527) {
          return or__3824__auto____17527
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__17530 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__17531 = cljs.core._get_method.call(null, mf, dispatch_val__17530);
  if(cljs.core.truth_(target_fn__17531)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__17530)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__17531, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__17532 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__17533 = this;
  cljs.core.swap_BANG_.call(null, this__17533.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__17533.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__17533.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__17533.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__17534 = this;
  cljs.core.swap_BANG_.call(null, this__17534.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__17534.method_cache, this__17534.method_table, this__17534.cached_hierarchy, this__17534.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__17535 = this;
  cljs.core.swap_BANG_.call(null, this__17535.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__17535.method_cache, this__17535.method_table, this__17535.cached_hierarchy, this__17535.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__17536 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__17536.cached_hierarchy), cljs.core.deref.call(null, this__17536.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__17536.method_cache, this__17536.method_table, this__17536.cached_hierarchy, this__17536.hierarchy)
  }
  var temp__3971__auto____17537 = cljs.core.deref.call(null, this__17536.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____17537)) {
    var target_fn__17538 = temp__3971__auto____17537;
    return target_fn__17538
  }else {
    var temp__3971__auto____17539 = cljs.core.find_and_cache_best_method.call(null, this__17536.name, dispatch_val, this__17536.hierarchy, this__17536.method_table, this__17536.prefer_table, this__17536.method_cache, this__17536.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____17539)) {
      var target_fn__17540 = temp__3971__auto____17539;
      return target_fn__17540
    }else {
      return cljs.core.deref.call(null, this__17536.method_table).call(null, this__17536.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__17541 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__17541.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__17541.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__17541.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__17541.method_cache, this__17541.method_table, this__17541.cached_hierarchy, this__17541.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__17542 = this;
  return cljs.core.deref.call(null, this__17542.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__17543 = this;
  return cljs.core.deref.call(null, this__17543.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__17544 = this;
  return cljs.core.do_dispatch.call(null, mf, this__17544.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__17546__delegate = function(_, args) {
    var self__17545 = this;
    return cljs.core._dispatch.call(null, self__17545, args)
  };
  var G__17546 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__17546__delegate.call(this, _, args)
  };
  G__17546.cljs$lang$maxFixedArity = 1;
  G__17546.cljs$lang$applyTo = function(arglist__17547) {
    var _ = cljs.core.first(arglist__17547);
    var args = cljs.core.rest(arglist__17547);
    return G__17546__delegate(_, args)
  };
  G__17546.cljs$lang$arity$variadic = G__17546__delegate;
  return G__17546
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__17548 = this;
  return cljs.core._dispatch.call(null, self__17548, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__17549 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_17551, _) {
  var this__17550 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__17550.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__17552 = this;
  var and__3822__auto____17553 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____17553) {
    return this__17552.uuid === other.uuid
  }else {
    return and__3822__auto____17553
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__17554 = this;
  var this__17555 = this;
  return cljs.core.pr_str.call(null, this__17555)
};
cljs.core.UUID;
goog.provide("black.bar");
goog.require("cljs.core");
black.bar.full_screen = function full_screen() {
  window.self.moveTo(0, 0);
  return window.self.resizeTo(screen.availWidth, screen.availHeight)
};
goog.exportSymbol("black.bar.full_screen", black.bar.full_screen);
black.bar.open_window = function open_window() {
  return window.self.open("http://www.google.com", "_blank", "titlebar=0")
};
goog.exportSymbol("black.bar.open_window", black.bar.open_window);
