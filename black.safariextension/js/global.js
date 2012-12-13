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
  var x__6106 = x == null ? null : x;
  if(p[goog.typeOf(x__6106)]) {
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
    var G__6107__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6107 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6107__delegate.call(this, array, i, idxs)
    };
    G__6107.cljs$lang$maxFixedArity = 2;
    G__6107.cljs$lang$applyTo = function(arglist__6108) {
      var array = cljs.core.first(arglist__6108);
      var i = cljs.core.first(cljs.core.next(arglist__6108));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6108));
      return G__6107__delegate(array, i, idxs)
    };
    G__6107.cljs$lang$arity$variadic = G__6107__delegate;
    return G__6107
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
      var and__3822__auto____6193 = this$;
      if(and__3822__auto____6193) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6193
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____6194 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6195 = cljs.core._invoke[goog.typeOf(x__2363__auto____6194)];
        if(or__3824__auto____6195) {
          return or__3824__auto____6195
        }else {
          var or__3824__auto____6196 = cljs.core._invoke["_"];
          if(or__3824__auto____6196) {
            return or__3824__auto____6196
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6197 = this$;
      if(and__3822__auto____6197) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6197
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____6198 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6199 = cljs.core._invoke[goog.typeOf(x__2363__auto____6198)];
        if(or__3824__auto____6199) {
          return or__3824__auto____6199
        }else {
          var or__3824__auto____6200 = cljs.core._invoke["_"];
          if(or__3824__auto____6200) {
            return or__3824__auto____6200
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6201 = this$;
      if(and__3822__auto____6201) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6201
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____6202 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6203 = cljs.core._invoke[goog.typeOf(x__2363__auto____6202)];
        if(or__3824__auto____6203) {
          return or__3824__auto____6203
        }else {
          var or__3824__auto____6204 = cljs.core._invoke["_"];
          if(or__3824__auto____6204) {
            return or__3824__auto____6204
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6205 = this$;
      if(and__3822__auto____6205) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6205
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____6206 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6207 = cljs.core._invoke[goog.typeOf(x__2363__auto____6206)];
        if(or__3824__auto____6207) {
          return or__3824__auto____6207
        }else {
          var or__3824__auto____6208 = cljs.core._invoke["_"];
          if(or__3824__auto____6208) {
            return or__3824__auto____6208
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6209 = this$;
      if(and__3822__auto____6209) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6209
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____6210 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6211 = cljs.core._invoke[goog.typeOf(x__2363__auto____6210)];
        if(or__3824__auto____6211) {
          return or__3824__auto____6211
        }else {
          var or__3824__auto____6212 = cljs.core._invoke["_"];
          if(or__3824__auto____6212) {
            return or__3824__auto____6212
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6213 = this$;
      if(and__3822__auto____6213) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6213
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____6214 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6215 = cljs.core._invoke[goog.typeOf(x__2363__auto____6214)];
        if(or__3824__auto____6215) {
          return or__3824__auto____6215
        }else {
          var or__3824__auto____6216 = cljs.core._invoke["_"];
          if(or__3824__auto____6216) {
            return or__3824__auto____6216
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6217 = this$;
      if(and__3822__auto____6217) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6217
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____6218 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6219 = cljs.core._invoke[goog.typeOf(x__2363__auto____6218)];
        if(or__3824__auto____6219) {
          return or__3824__auto____6219
        }else {
          var or__3824__auto____6220 = cljs.core._invoke["_"];
          if(or__3824__auto____6220) {
            return or__3824__auto____6220
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6221 = this$;
      if(and__3822__auto____6221) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6221
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____6222 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6223 = cljs.core._invoke[goog.typeOf(x__2363__auto____6222)];
        if(or__3824__auto____6223) {
          return or__3824__auto____6223
        }else {
          var or__3824__auto____6224 = cljs.core._invoke["_"];
          if(or__3824__auto____6224) {
            return or__3824__auto____6224
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6225 = this$;
      if(and__3822__auto____6225) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6225
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____6226 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6227 = cljs.core._invoke[goog.typeOf(x__2363__auto____6226)];
        if(or__3824__auto____6227) {
          return or__3824__auto____6227
        }else {
          var or__3824__auto____6228 = cljs.core._invoke["_"];
          if(or__3824__auto____6228) {
            return or__3824__auto____6228
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6229 = this$;
      if(and__3822__auto____6229) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6229
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____6230 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6231 = cljs.core._invoke[goog.typeOf(x__2363__auto____6230)];
        if(or__3824__auto____6231) {
          return or__3824__auto____6231
        }else {
          var or__3824__auto____6232 = cljs.core._invoke["_"];
          if(or__3824__auto____6232) {
            return or__3824__auto____6232
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6233 = this$;
      if(and__3822__auto____6233) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6233
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____6234 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6235 = cljs.core._invoke[goog.typeOf(x__2363__auto____6234)];
        if(or__3824__auto____6235) {
          return or__3824__auto____6235
        }else {
          var or__3824__auto____6236 = cljs.core._invoke["_"];
          if(or__3824__auto____6236) {
            return or__3824__auto____6236
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6237 = this$;
      if(and__3822__auto____6237) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6237
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____6238 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6239 = cljs.core._invoke[goog.typeOf(x__2363__auto____6238)];
        if(or__3824__auto____6239) {
          return or__3824__auto____6239
        }else {
          var or__3824__auto____6240 = cljs.core._invoke["_"];
          if(or__3824__auto____6240) {
            return or__3824__auto____6240
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6241 = this$;
      if(and__3822__auto____6241) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6241
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____6242 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6243 = cljs.core._invoke[goog.typeOf(x__2363__auto____6242)];
        if(or__3824__auto____6243) {
          return or__3824__auto____6243
        }else {
          var or__3824__auto____6244 = cljs.core._invoke["_"];
          if(or__3824__auto____6244) {
            return or__3824__auto____6244
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6245 = this$;
      if(and__3822__auto____6245) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6245
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____6246 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6247 = cljs.core._invoke[goog.typeOf(x__2363__auto____6246)];
        if(or__3824__auto____6247) {
          return or__3824__auto____6247
        }else {
          var or__3824__auto____6248 = cljs.core._invoke["_"];
          if(or__3824__auto____6248) {
            return or__3824__auto____6248
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6249 = this$;
      if(and__3822__auto____6249) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6249
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____6250 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6251 = cljs.core._invoke[goog.typeOf(x__2363__auto____6250)];
        if(or__3824__auto____6251) {
          return or__3824__auto____6251
        }else {
          var or__3824__auto____6252 = cljs.core._invoke["_"];
          if(or__3824__auto____6252) {
            return or__3824__auto____6252
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6253 = this$;
      if(and__3822__auto____6253) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6253
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____6254 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6255 = cljs.core._invoke[goog.typeOf(x__2363__auto____6254)];
        if(or__3824__auto____6255) {
          return or__3824__auto____6255
        }else {
          var or__3824__auto____6256 = cljs.core._invoke["_"];
          if(or__3824__auto____6256) {
            return or__3824__auto____6256
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6257 = this$;
      if(and__3822__auto____6257) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6257
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____6258 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6259 = cljs.core._invoke[goog.typeOf(x__2363__auto____6258)];
        if(or__3824__auto____6259) {
          return or__3824__auto____6259
        }else {
          var or__3824__auto____6260 = cljs.core._invoke["_"];
          if(or__3824__auto____6260) {
            return or__3824__auto____6260
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6261 = this$;
      if(and__3822__auto____6261) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6261
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____6262 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6263 = cljs.core._invoke[goog.typeOf(x__2363__auto____6262)];
        if(or__3824__auto____6263) {
          return or__3824__auto____6263
        }else {
          var or__3824__auto____6264 = cljs.core._invoke["_"];
          if(or__3824__auto____6264) {
            return or__3824__auto____6264
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6265 = this$;
      if(and__3822__auto____6265) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6265
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____6266 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6267 = cljs.core._invoke[goog.typeOf(x__2363__auto____6266)];
        if(or__3824__auto____6267) {
          return or__3824__auto____6267
        }else {
          var or__3824__auto____6268 = cljs.core._invoke["_"];
          if(or__3824__auto____6268) {
            return or__3824__auto____6268
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6269 = this$;
      if(and__3822__auto____6269) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6269
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____6270 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6271 = cljs.core._invoke[goog.typeOf(x__2363__auto____6270)];
        if(or__3824__auto____6271) {
          return or__3824__auto____6271
        }else {
          var or__3824__auto____6272 = cljs.core._invoke["_"];
          if(or__3824__auto____6272) {
            return or__3824__auto____6272
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6273 = this$;
      if(and__3822__auto____6273) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6273
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____6274 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6275 = cljs.core._invoke[goog.typeOf(x__2363__auto____6274)];
        if(or__3824__auto____6275) {
          return or__3824__auto____6275
        }else {
          var or__3824__auto____6276 = cljs.core._invoke["_"];
          if(or__3824__auto____6276) {
            return or__3824__auto____6276
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
    var and__3822__auto____6281 = coll;
    if(and__3822__auto____6281) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6281
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____6282 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6283 = cljs.core._count[goog.typeOf(x__2363__auto____6282)];
      if(or__3824__auto____6283) {
        return or__3824__auto____6283
      }else {
        var or__3824__auto____6284 = cljs.core._count["_"];
        if(or__3824__auto____6284) {
          return or__3824__auto____6284
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
    var and__3822__auto____6289 = coll;
    if(and__3822__auto____6289) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6289
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____6290 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6291 = cljs.core._empty[goog.typeOf(x__2363__auto____6290)];
      if(or__3824__auto____6291) {
        return or__3824__auto____6291
      }else {
        var or__3824__auto____6292 = cljs.core._empty["_"];
        if(or__3824__auto____6292) {
          return or__3824__auto____6292
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
    var and__3822__auto____6297 = coll;
    if(and__3822__auto____6297) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6297
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____6298 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6299 = cljs.core._conj[goog.typeOf(x__2363__auto____6298)];
      if(or__3824__auto____6299) {
        return or__3824__auto____6299
      }else {
        var or__3824__auto____6300 = cljs.core._conj["_"];
        if(or__3824__auto____6300) {
          return or__3824__auto____6300
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
      var and__3822__auto____6309 = coll;
      if(and__3822__auto____6309) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6309
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____6310 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6311 = cljs.core._nth[goog.typeOf(x__2363__auto____6310)];
        if(or__3824__auto____6311) {
          return or__3824__auto____6311
        }else {
          var or__3824__auto____6312 = cljs.core._nth["_"];
          if(or__3824__auto____6312) {
            return or__3824__auto____6312
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6313 = coll;
      if(and__3822__auto____6313) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6313
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____6314 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6315 = cljs.core._nth[goog.typeOf(x__2363__auto____6314)];
        if(or__3824__auto____6315) {
          return or__3824__auto____6315
        }else {
          var or__3824__auto____6316 = cljs.core._nth["_"];
          if(or__3824__auto____6316) {
            return or__3824__auto____6316
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
    var and__3822__auto____6321 = coll;
    if(and__3822__auto____6321) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6321
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____6322 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6323 = cljs.core._first[goog.typeOf(x__2363__auto____6322)];
      if(or__3824__auto____6323) {
        return or__3824__auto____6323
      }else {
        var or__3824__auto____6324 = cljs.core._first["_"];
        if(or__3824__auto____6324) {
          return or__3824__auto____6324
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6329 = coll;
    if(and__3822__auto____6329) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6329
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____6330 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6331 = cljs.core._rest[goog.typeOf(x__2363__auto____6330)];
      if(or__3824__auto____6331) {
        return or__3824__auto____6331
      }else {
        var or__3824__auto____6332 = cljs.core._rest["_"];
        if(or__3824__auto____6332) {
          return or__3824__auto____6332
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
    var and__3822__auto____6337 = coll;
    if(and__3822__auto____6337) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6337
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____6338 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6339 = cljs.core._next[goog.typeOf(x__2363__auto____6338)];
      if(or__3824__auto____6339) {
        return or__3824__auto____6339
      }else {
        var or__3824__auto____6340 = cljs.core._next["_"];
        if(or__3824__auto____6340) {
          return or__3824__auto____6340
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
      var and__3822__auto____6349 = o;
      if(and__3822__auto____6349) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6349
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____6350 = o == null ? null : o;
      return function() {
        var or__3824__auto____6351 = cljs.core._lookup[goog.typeOf(x__2363__auto____6350)];
        if(or__3824__auto____6351) {
          return or__3824__auto____6351
        }else {
          var or__3824__auto____6352 = cljs.core._lookup["_"];
          if(or__3824__auto____6352) {
            return or__3824__auto____6352
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6353 = o;
      if(and__3822__auto____6353) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6353
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____6354 = o == null ? null : o;
      return function() {
        var or__3824__auto____6355 = cljs.core._lookup[goog.typeOf(x__2363__auto____6354)];
        if(or__3824__auto____6355) {
          return or__3824__auto____6355
        }else {
          var or__3824__auto____6356 = cljs.core._lookup["_"];
          if(or__3824__auto____6356) {
            return or__3824__auto____6356
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
    var and__3822__auto____6361 = coll;
    if(and__3822__auto____6361) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6361
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____6362 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6363 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____6362)];
      if(or__3824__auto____6363) {
        return or__3824__auto____6363
      }else {
        var or__3824__auto____6364 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6364) {
          return or__3824__auto____6364
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6369 = coll;
    if(and__3822__auto____6369) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6369
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____6370 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6371 = cljs.core._assoc[goog.typeOf(x__2363__auto____6370)];
      if(or__3824__auto____6371) {
        return or__3824__auto____6371
      }else {
        var or__3824__auto____6372 = cljs.core._assoc["_"];
        if(or__3824__auto____6372) {
          return or__3824__auto____6372
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
    var and__3822__auto____6377 = coll;
    if(and__3822__auto____6377) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6377
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____6378 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6379 = cljs.core._dissoc[goog.typeOf(x__2363__auto____6378)];
      if(or__3824__auto____6379) {
        return or__3824__auto____6379
      }else {
        var or__3824__auto____6380 = cljs.core._dissoc["_"];
        if(or__3824__auto____6380) {
          return or__3824__auto____6380
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
    var and__3822__auto____6385 = coll;
    if(and__3822__auto____6385) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6385
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____6386 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6387 = cljs.core._key[goog.typeOf(x__2363__auto____6386)];
      if(or__3824__auto____6387) {
        return or__3824__auto____6387
      }else {
        var or__3824__auto____6388 = cljs.core._key["_"];
        if(or__3824__auto____6388) {
          return or__3824__auto____6388
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6393 = coll;
    if(and__3822__auto____6393) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6393
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____6394 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6395 = cljs.core._val[goog.typeOf(x__2363__auto____6394)];
      if(or__3824__auto____6395) {
        return or__3824__auto____6395
      }else {
        var or__3824__auto____6396 = cljs.core._val["_"];
        if(or__3824__auto____6396) {
          return or__3824__auto____6396
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
    var and__3822__auto____6401 = coll;
    if(and__3822__auto____6401) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6401
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____6402 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6403 = cljs.core._disjoin[goog.typeOf(x__2363__auto____6402)];
      if(or__3824__auto____6403) {
        return or__3824__auto____6403
      }else {
        var or__3824__auto____6404 = cljs.core._disjoin["_"];
        if(or__3824__auto____6404) {
          return or__3824__auto____6404
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
    var and__3822__auto____6409 = coll;
    if(and__3822__auto____6409) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6409
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____6410 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6411 = cljs.core._peek[goog.typeOf(x__2363__auto____6410)];
      if(or__3824__auto____6411) {
        return or__3824__auto____6411
      }else {
        var or__3824__auto____6412 = cljs.core._peek["_"];
        if(or__3824__auto____6412) {
          return or__3824__auto____6412
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6417 = coll;
    if(and__3822__auto____6417) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6417
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____6418 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6419 = cljs.core._pop[goog.typeOf(x__2363__auto____6418)];
      if(or__3824__auto____6419) {
        return or__3824__auto____6419
      }else {
        var or__3824__auto____6420 = cljs.core._pop["_"];
        if(or__3824__auto____6420) {
          return or__3824__auto____6420
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
    var and__3822__auto____6425 = coll;
    if(and__3822__auto____6425) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6425
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____6426 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6427 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____6426)];
      if(or__3824__auto____6427) {
        return or__3824__auto____6427
      }else {
        var or__3824__auto____6428 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6428) {
          return or__3824__auto____6428
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
    var and__3822__auto____6433 = o;
    if(and__3822__auto____6433) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6433
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____6434 = o == null ? null : o;
    return function() {
      var or__3824__auto____6435 = cljs.core._deref[goog.typeOf(x__2363__auto____6434)];
      if(or__3824__auto____6435) {
        return or__3824__auto____6435
      }else {
        var or__3824__auto____6436 = cljs.core._deref["_"];
        if(or__3824__auto____6436) {
          return or__3824__auto____6436
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
    var and__3822__auto____6441 = o;
    if(and__3822__auto____6441) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6441
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____6442 = o == null ? null : o;
    return function() {
      var or__3824__auto____6443 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____6442)];
      if(or__3824__auto____6443) {
        return or__3824__auto____6443
      }else {
        var or__3824__auto____6444 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6444) {
          return or__3824__auto____6444
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
    var and__3822__auto____6449 = o;
    if(and__3822__auto____6449) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6449
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____6450 = o == null ? null : o;
    return function() {
      var or__3824__auto____6451 = cljs.core._meta[goog.typeOf(x__2363__auto____6450)];
      if(or__3824__auto____6451) {
        return or__3824__auto____6451
      }else {
        var or__3824__auto____6452 = cljs.core._meta["_"];
        if(or__3824__auto____6452) {
          return or__3824__auto____6452
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
    var and__3822__auto____6457 = o;
    if(and__3822__auto____6457) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6457
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____6458 = o == null ? null : o;
    return function() {
      var or__3824__auto____6459 = cljs.core._with_meta[goog.typeOf(x__2363__auto____6458)];
      if(or__3824__auto____6459) {
        return or__3824__auto____6459
      }else {
        var or__3824__auto____6460 = cljs.core._with_meta["_"];
        if(or__3824__auto____6460) {
          return or__3824__auto____6460
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
      var and__3822__auto____6469 = coll;
      if(and__3822__auto____6469) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6469
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____6470 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6471 = cljs.core._reduce[goog.typeOf(x__2363__auto____6470)];
        if(or__3824__auto____6471) {
          return or__3824__auto____6471
        }else {
          var or__3824__auto____6472 = cljs.core._reduce["_"];
          if(or__3824__auto____6472) {
            return or__3824__auto____6472
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6473 = coll;
      if(and__3822__auto____6473) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6473
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____6474 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6475 = cljs.core._reduce[goog.typeOf(x__2363__auto____6474)];
        if(or__3824__auto____6475) {
          return or__3824__auto____6475
        }else {
          var or__3824__auto____6476 = cljs.core._reduce["_"];
          if(or__3824__auto____6476) {
            return or__3824__auto____6476
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
    var and__3822__auto____6481 = coll;
    if(and__3822__auto____6481) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6481
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____6482 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6483 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____6482)];
      if(or__3824__auto____6483) {
        return or__3824__auto____6483
      }else {
        var or__3824__auto____6484 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6484) {
          return or__3824__auto____6484
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
    var and__3822__auto____6489 = o;
    if(and__3822__auto____6489) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6489
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____6490 = o == null ? null : o;
    return function() {
      var or__3824__auto____6491 = cljs.core._equiv[goog.typeOf(x__2363__auto____6490)];
      if(or__3824__auto____6491) {
        return or__3824__auto____6491
      }else {
        var or__3824__auto____6492 = cljs.core._equiv["_"];
        if(or__3824__auto____6492) {
          return or__3824__auto____6492
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
    var and__3822__auto____6497 = o;
    if(and__3822__auto____6497) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6497
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____6498 = o == null ? null : o;
    return function() {
      var or__3824__auto____6499 = cljs.core._hash[goog.typeOf(x__2363__auto____6498)];
      if(or__3824__auto____6499) {
        return or__3824__auto____6499
      }else {
        var or__3824__auto____6500 = cljs.core._hash["_"];
        if(or__3824__auto____6500) {
          return or__3824__auto____6500
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
    var and__3822__auto____6505 = o;
    if(and__3822__auto____6505) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6505
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____6506 = o == null ? null : o;
    return function() {
      var or__3824__auto____6507 = cljs.core._seq[goog.typeOf(x__2363__auto____6506)];
      if(or__3824__auto____6507) {
        return or__3824__auto____6507
      }else {
        var or__3824__auto____6508 = cljs.core._seq["_"];
        if(or__3824__auto____6508) {
          return or__3824__auto____6508
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
    var and__3822__auto____6513 = coll;
    if(and__3822__auto____6513) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6513
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____6514 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6515 = cljs.core._rseq[goog.typeOf(x__2363__auto____6514)];
      if(or__3824__auto____6515) {
        return or__3824__auto____6515
      }else {
        var or__3824__auto____6516 = cljs.core._rseq["_"];
        if(or__3824__auto____6516) {
          return or__3824__auto____6516
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
    var and__3822__auto____6521 = coll;
    if(and__3822__auto____6521) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6521
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____6522 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6523 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____6522)];
      if(or__3824__auto____6523) {
        return or__3824__auto____6523
      }else {
        var or__3824__auto____6524 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6524) {
          return or__3824__auto____6524
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6529 = coll;
    if(and__3822__auto____6529) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6529
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____6530 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6531 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____6530)];
      if(or__3824__auto____6531) {
        return or__3824__auto____6531
      }else {
        var or__3824__auto____6532 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6532) {
          return or__3824__auto____6532
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6537 = coll;
    if(and__3822__auto____6537) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6537
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____6538 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6539 = cljs.core._entry_key[goog.typeOf(x__2363__auto____6538)];
      if(or__3824__auto____6539) {
        return or__3824__auto____6539
      }else {
        var or__3824__auto____6540 = cljs.core._entry_key["_"];
        if(or__3824__auto____6540) {
          return or__3824__auto____6540
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6545 = coll;
    if(and__3822__auto____6545) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6545
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____6546 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6547 = cljs.core._comparator[goog.typeOf(x__2363__auto____6546)];
      if(or__3824__auto____6547) {
        return or__3824__auto____6547
      }else {
        var or__3824__auto____6548 = cljs.core._comparator["_"];
        if(or__3824__auto____6548) {
          return or__3824__auto____6548
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
    var and__3822__auto____6553 = o;
    if(and__3822__auto____6553) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6553
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____6554 = o == null ? null : o;
    return function() {
      var or__3824__auto____6555 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____6554)];
      if(or__3824__auto____6555) {
        return or__3824__auto____6555
      }else {
        var or__3824__auto____6556 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6556) {
          return or__3824__auto____6556
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
    var and__3822__auto____6561 = d;
    if(and__3822__auto____6561) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6561
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____6562 = d == null ? null : d;
    return function() {
      var or__3824__auto____6563 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____6562)];
      if(or__3824__auto____6563) {
        return or__3824__auto____6563
      }else {
        var or__3824__auto____6564 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6564) {
          return or__3824__auto____6564
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
    var and__3822__auto____6569 = this$;
    if(and__3822__auto____6569) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6569
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____6570 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6571 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____6570)];
      if(or__3824__auto____6571) {
        return or__3824__auto____6571
      }else {
        var or__3824__auto____6572 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6572) {
          return or__3824__auto____6572
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6577 = this$;
    if(and__3822__auto____6577) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6577
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____6578 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6579 = cljs.core._add_watch[goog.typeOf(x__2363__auto____6578)];
      if(or__3824__auto____6579) {
        return or__3824__auto____6579
      }else {
        var or__3824__auto____6580 = cljs.core._add_watch["_"];
        if(or__3824__auto____6580) {
          return or__3824__auto____6580
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6585 = this$;
    if(and__3822__auto____6585) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6585
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____6586 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6587 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____6586)];
      if(or__3824__auto____6587) {
        return or__3824__auto____6587
      }else {
        var or__3824__auto____6588 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6588) {
          return or__3824__auto____6588
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
    var and__3822__auto____6593 = coll;
    if(and__3822__auto____6593) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6593
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____6594 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6595 = cljs.core._as_transient[goog.typeOf(x__2363__auto____6594)];
      if(or__3824__auto____6595) {
        return or__3824__auto____6595
      }else {
        var or__3824__auto____6596 = cljs.core._as_transient["_"];
        if(or__3824__auto____6596) {
          return or__3824__auto____6596
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
    var and__3822__auto____6601 = tcoll;
    if(and__3822__auto____6601) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6601
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____6602 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6603 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____6602)];
      if(or__3824__auto____6603) {
        return or__3824__auto____6603
      }else {
        var or__3824__auto____6604 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6604) {
          return or__3824__auto____6604
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6609 = tcoll;
    if(and__3822__auto____6609) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6609
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____6610 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6611 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____6610)];
      if(or__3824__auto____6611) {
        return or__3824__auto____6611
      }else {
        var or__3824__auto____6612 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6612) {
          return or__3824__auto____6612
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
    var and__3822__auto____6617 = tcoll;
    if(and__3822__auto____6617) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6617
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____6618 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6619 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____6618)];
      if(or__3824__auto____6619) {
        return or__3824__auto____6619
      }else {
        var or__3824__auto____6620 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6620) {
          return or__3824__auto____6620
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
    var and__3822__auto____6625 = tcoll;
    if(and__3822__auto____6625) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6625
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____6626 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6627 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____6626)];
      if(or__3824__auto____6627) {
        return or__3824__auto____6627
      }else {
        var or__3824__auto____6628 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6628) {
          return or__3824__auto____6628
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
    var and__3822__auto____6633 = tcoll;
    if(and__3822__auto____6633) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6633
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____6634 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6635 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____6634)];
      if(or__3824__auto____6635) {
        return or__3824__auto____6635
      }else {
        var or__3824__auto____6636 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6636) {
          return or__3824__auto____6636
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6641 = tcoll;
    if(and__3822__auto____6641) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6641
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____6642 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6643 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____6642)];
      if(or__3824__auto____6643) {
        return or__3824__auto____6643
      }else {
        var or__3824__auto____6644 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6644) {
          return or__3824__auto____6644
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
    var and__3822__auto____6649 = tcoll;
    if(and__3822__auto____6649) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6649
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____6650 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6651 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____6650)];
      if(or__3824__auto____6651) {
        return or__3824__auto____6651
      }else {
        var or__3824__auto____6652 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6652) {
          return or__3824__auto____6652
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
    var and__3822__auto____6657 = x;
    if(and__3822__auto____6657) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6657
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____6658 = x == null ? null : x;
    return function() {
      var or__3824__auto____6659 = cljs.core._compare[goog.typeOf(x__2363__auto____6658)];
      if(or__3824__auto____6659) {
        return or__3824__auto____6659
      }else {
        var or__3824__auto____6660 = cljs.core._compare["_"];
        if(or__3824__auto____6660) {
          return or__3824__auto____6660
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
    var and__3822__auto____6665 = coll;
    if(and__3822__auto____6665) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6665
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____6666 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6667 = cljs.core._drop_first[goog.typeOf(x__2363__auto____6666)];
      if(or__3824__auto____6667) {
        return or__3824__auto____6667
      }else {
        var or__3824__auto____6668 = cljs.core._drop_first["_"];
        if(or__3824__auto____6668) {
          return or__3824__auto____6668
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
    var and__3822__auto____6673 = coll;
    if(and__3822__auto____6673) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6673
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____6674 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6675 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____6674)];
      if(or__3824__auto____6675) {
        return or__3824__auto____6675
      }else {
        var or__3824__auto____6676 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6676) {
          return or__3824__auto____6676
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6681 = coll;
    if(and__3822__auto____6681) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6681
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____6682 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6683 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____6682)];
      if(or__3824__auto____6683) {
        return or__3824__auto____6683
      }else {
        var or__3824__auto____6684 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6684) {
          return or__3824__auto____6684
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
    var and__3822__auto____6689 = coll;
    if(and__3822__auto____6689) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6689
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____6690 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6691 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____6690)];
      if(or__3824__auto____6691) {
        return or__3824__auto____6691
      }else {
        var or__3824__auto____6692 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6692) {
          return or__3824__auto____6692
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
    var or__3824__auto____6694 = x === y;
    if(or__3824__auto____6694) {
      return or__3824__auto____6694
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6695__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6696 = y;
            var G__6697 = cljs.core.first.call(null, more);
            var G__6698 = cljs.core.next.call(null, more);
            x = G__6696;
            y = G__6697;
            more = G__6698;
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
    var G__6695 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6695__delegate.call(this, x, y, more)
    };
    G__6695.cljs$lang$maxFixedArity = 2;
    G__6695.cljs$lang$applyTo = function(arglist__6699) {
      var x = cljs.core.first(arglist__6699);
      var y = cljs.core.first(cljs.core.next(arglist__6699));
      var more = cljs.core.rest(cljs.core.next(arglist__6699));
      return G__6695__delegate(x, y, more)
    };
    G__6695.cljs$lang$arity$variadic = G__6695__delegate;
    return G__6695
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
  var G__6700 = null;
  var G__6700__2 = function(o, k) {
    return null
  };
  var G__6700__3 = function(o, k, not_found) {
    return not_found
  };
  G__6700 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6700__2.call(this, o, k);
      case 3:
        return G__6700__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6700
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
  var G__6701 = null;
  var G__6701__2 = function(_, f) {
    return f.call(null)
  };
  var G__6701__3 = function(_, f, start) {
    return start
  };
  G__6701 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6701__2.call(this, _, f);
      case 3:
        return G__6701__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6701
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
  var G__6702 = null;
  var G__6702__2 = function(_, n) {
    return null
  };
  var G__6702__3 = function(_, n, not_found) {
    return not_found
  };
  G__6702 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6702__2.call(this, _, n);
      case 3:
        return G__6702__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6702
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
  var and__3822__auto____6703 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____6703) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6703
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
    var cnt__6716 = cljs.core._count.call(null, cicoll);
    if(cnt__6716 === 0) {
      return f.call(null)
    }else {
      var val__6717 = cljs.core._nth.call(null, cicoll, 0);
      var n__6718 = 1;
      while(true) {
        if(n__6718 < cnt__6716) {
          var nval__6719 = f.call(null, val__6717, cljs.core._nth.call(null, cicoll, n__6718));
          if(cljs.core.reduced_QMARK_.call(null, nval__6719)) {
            return cljs.core.deref.call(null, nval__6719)
          }else {
            var G__6728 = nval__6719;
            var G__6729 = n__6718 + 1;
            val__6717 = G__6728;
            n__6718 = G__6729;
            continue
          }
        }else {
          return val__6717
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6720 = cljs.core._count.call(null, cicoll);
    var val__6721 = val;
    var n__6722 = 0;
    while(true) {
      if(n__6722 < cnt__6720) {
        var nval__6723 = f.call(null, val__6721, cljs.core._nth.call(null, cicoll, n__6722));
        if(cljs.core.reduced_QMARK_.call(null, nval__6723)) {
          return cljs.core.deref.call(null, nval__6723)
        }else {
          var G__6730 = nval__6723;
          var G__6731 = n__6722 + 1;
          val__6721 = G__6730;
          n__6722 = G__6731;
          continue
        }
      }else {
        return val__6721
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6724 = cljs.core._count.call(null, cicoll);
    var val__6725 = val;
    var n__6726 = idx;
    while(true) {
      if(n__6726 < cnt__6724) {
        var nval__6727 = f.call(null, val__6725, cljs.core._nth.call(null, cicoll, n__6726));
        if(cljs.core.reduced_QMARK_.call(null, nval__6727)) {
          return cljs.core.deref.call(null, nval__6727)
        }else {
          var G__6732 = nval__6727;
          var G__6733 = n__6726 + 1;
          val__6725 = G__6732;
          n__6726 = G__6733;
          continue
        }
      }else {
        return val__6725
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
    var cnt__6746 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6747 = arr[0];
      var n__6748 = 1;
      while(true) {
        if(n__6748 < cnt__6746) {
          var nval__6749 = f.call(null, val__6747, arr[n__6748]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6749)) {
            return cljs.core.deref.call(null, nval__6749)
          }else {
            var G__6758 = nval__6749;
            var G__6759 = n__6748 + 1;
            val__6747 = G__6758;
            n__6748 = G__6759;
            continue
          }
        }else {
          return val__6747
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6750 = arr.length;
    var val__6751 = val;
    var n__6752 = 0;
    while(true) {
      if(n__6752 < cnt__6750) {
        var nval__6753 = f.call(null, val__6751, arr[n__6752]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6753)) {
          return cljs.core.deref.call(null, nval__6753)
        }else {
          var G__6760 = nval__6753;
          var G__6761 = n__6752 + 1;
          val__6751 = G__6760;
          n__6752 = G__6761;
          continue
        }
      }else {
        return val__6751
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6754 = arr.length;
    var val__6755 = val;
    var n__6756 = idx;
    while(true) {
      if(n__6756 < cnt__6754) {
        var nval__6757 = f.call(null, val__6755, arr[n__6756]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6757)) {
          return cljs.core.deref.call(null, nval__6757)
        }else {
          var G__6762 = nval__6757;
          var G__6763 = n__6756 + 1;
          val__6755 = G__6762;
          n__6756 = G__6763;
          continue
        }
      }else {
        return val__6755
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
  var this__6764 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6765 = this;
  if(this__6765.i + 1 < this__6765.a.length) {
    return new cljs.core.IndexedSeq(this__6765.a, this__6765.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6766 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6767 = this;
  var c__6768 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6768 > 0) {
    return new cljs.core.RSeq(coll, c__6768 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6769 = this;
  var this__6770 = this;
  return cljs.core.pr_str.call(null, this__6770)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6771 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6771.a)) {
    return cljs.core.ci_reduce.call(null, this__6771.a, f, this__6771.a[this__6771.i], this__6771.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6771.a[this__6771.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6772 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6772.a)) {
    return cljs.core.ci_reduce.call(null, this__6772.a, f, start, this__6772.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6773 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6774 = this;
  return this__6774.a.length - this__6774.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6775 = this;
  return this__6775.a[this__6775.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6776 = this;
  if(this__6776.i + 1 < this__6776.a.length) {
    return new cljs.core.IndexedSeq(this__6776.a, this__6776.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6777 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6778 = this;
  var i__6779 = n + this__6778.i;
  if(i__6779 < this__6778.a.length) {
    return this__6778.a[i__6779]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6780 = this;
  var i__6781 = n + this__6780.i;
  if(i__6781 < this__6780.a.length) {
    return this__6780.a[i__6781]
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
  var G__6782 = null;
  var G__6782__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6782__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6782 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6782__2.call(this, array, f);
      case 3:
        return G__6782__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6782
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6783 = null;
  var G__6783__2 = function(array, k) {
    return array[k]
  };
  var G__6783__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6783 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6783__2.call(this, array, k);
      case 3:
        return G__6783__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6783
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6784 = null;
  var G__6784__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6784__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6784 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6784__2.call(this, array, n);
      case 3:
        return G__6784__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6784
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
  var this__6785 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6786 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6787 = this;
  var this__6788 = this;
  return cljs.core.pr_str.call(null, this__6788)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6789 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6790 = this;
  return this__6790.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6791 = this;
  return cljs.core._nth.call(null, this__6791.ci, this__6791.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6792 = this;
  if(this__6792.i > 0) {
    return new cljs.core.RSeq(this__6792.ci, this__6792.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6793 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6794 = this;
  return new cljs.core.RSeq(this__6794.ci, this__6794.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6795 = this;
  return this__6795.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6799__6800 = coll;
      if(G__6799__6800) {
        if(function() {
          var or__3824__auto____6801 = G__6799__6800.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6801) {
            return or__3824__auto____6801
          }else {
            return G__6799__6800.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6799__6800.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6799__6800)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6799__6800)
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
      var G__6806__6807 = coll;
      if(G__6806__6807) {
        if(function() {
          var or__3824__auto____6808 = G__6806__6807.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6808) {
            return or__3824__auto____6808
          }else {
            return G__6806__6807.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6806__6807.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6806__6807)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6806__6807)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6809 = cljs.core.seq.call(null, coll);
      if(s__6809 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6809)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6814__6815 = coll;
      if(G__6814__6815) {
        if(function() {
          var or__3824__auto____6816 = G__6814__6815.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6816) {
            return or__3824__auto____6816
          }else {
            return G__6814__6815.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6814__6815.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6814__6815)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6814__6815)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6817 = cljs.core.seq.call(null, coll);
      if(!(s__6817 == null)) {
        return cljs.core._rest.call(null, s__6817)
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
      var G__6821__6822 = coll;
      if(G__6821__6822) {
        if(function() {
          var or__3824__auto____6823 = G__6821__6822.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6823) {
            return or__3824__auto____6823
          }else {
            return G__6821__6822.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6821__6822.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6821__6822)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6821__6822)
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
    var sn__6825 = cljs.core.next.call(null, s);
    if(!(sn__6825 == null)) {
      var G__6826 = sn__6825;
      s = G__6826;
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
    var G__6827__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6828 = conj.call(null, coll, x);
          var G__6829 = cljs.core.first.call(null, xs);
          var G__6830 = cljs.core.next.call(null, xs);
          coll = G__6828;
          x = G__6829;
          xs = G__6830;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6827 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6827__delegate.call(this, coll, x, xs)
    };
    G__6827.cljs$lang$maxFixedArity = 2;
    G__6827.cljs$lang$applyTo = function(arglist__6831) {
      var coll = cljs.core.first(arglist__6831);
      var x = cljs.core.first(cljs.core.next(arglist__6831));
      var xs = cljs.core.rest(cljs.core.next(arglist__6831));
      return G__6827__delegate(coll, x, xs)
    };
    G__6827.cljs$lang$arity$variadic = G__6827__delegate;
    return G__6827
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
  var s__6834 = cljs.core.seq.call(null, coll);
  var acc__6835 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6834)) {
      return acc__6835 + cljs.core._count.call(null, s__6834)
    }else {
      var G__6836 = cljs.core.next.call(null, s__6834);
      var G__6837 = acc__6835 + 1;
      s__6834 = G__6836;
      acc__6835 = G__6837;
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
        var G__6844__6845 = coll;
        if(G__6844__6845) {
          if(function() {
            var or__3824__auto____6846 = G__6844__6845.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6846) {
              return or__3824__auto____6846
            }else {
              return G__6844__6845.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6844__6845.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6844__6845)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6844__6845)
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
        var G__6847__6848 = coll;
        if(G__6847__6848) {
          if(function() {
            var or__3824__auto____6849 = G__6847__6848.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6849) {
              return or__3824__auto____6849
            }else {
              return G__6847__6848.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6847__6848.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6847__6848)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6847__6848)
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
    var G__6852__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6851 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6853 = ret__6851;
          var G__6854 = cljs.core.first.call(null, kvs);
          var G__6855 = cljs.core.second.call(null, kvs);
          var G__6856 = cljs.core.nnext.call(null, kvs);
          coll = G__6853;
          k = G__6854;
          v = G__6855;
          kvs = G__6856;
          continue
        }else {
          return ret__6851
        }
        break
      }
    };
    var G__6852 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6852__delegate.call(this, coll, k, v, kvs)
    };
    G__6852.cljs$lang$maxFixedArity = 3;
    G__6852.cljs$lang$applyTo = function(arglist__6857) {
      var coll = cljs.core.first(arglist__6857);
      var k = cljs.core.first(cljs.core.next(arglist__6857));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6857)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6857)));
      return G__6852__delegate(coll, k, v, kvs)
    };
    G__6852.cljs$lang$arity$variadic = G__6852__delegate;
    return G__6852
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
    var G__6860__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6859 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6861 = ret__6859;
          var G__6862 = cljs.core.first.call(null, ks);
          var G__6863 = cljs.core.next.call(null, ks);
          coll = G__6861;
          k = G__6862;
          ks = G__6863;
          continue
        }else {
          return ret__6859
        }
        break
      }
    };
    var G__6860 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6860__delegate.call(this, coll, k, ks)
    };
    G__6860.cljs$lang$maxFixedArity = 2;
    G__6860.cljs$lang$applyTo = function(arglist__6864) {
      var coll = cljs.core.first(arglist__6864);
      var k = cljs.core.first(cljs.core.next(arglist__6864));
      var ks = cljs.core.rest(cljs.core.next(arglist__6864));
      return G__6860__delegate(coll, k, ks)
    };
    G__6860.cljs$lang$arity$variadic = G__6860__delegate;
    return G__6860
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
    var G__6868__6869 = o;
    if(G__6868__6869) {
      if(function() {
        var or__3824__auto____6870 = G__6868__6869.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6870) {
          return or__3824__auto____6870
        }else {
          return G__6868__6869.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6868__6869.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6868__6869)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6868__6869)
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
    var G__6873__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6872 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6874 = ret__6872;
          var G__6875 = cljs.core.first.call(null, ks);
          var G__6876 = cljs.core.next.call(null, ks);
          coll = G__6874;
          k = G__6875;
          ks = G__6876;
          continue
        }else {
          return ret__6872
        }
        break
      }
    };
    var G__6873 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6873__delegate.call(this, coll, k, ks)
    };
    G__6873.cljs$lang$maxFixedArity = 2;
    G__6873.cljs$lang$applyTo = function(arglist__6877) {
      var coll = cljs.core.first(arglist__6877);
      var k = cljs.core.first(cljs.core.next(arglist__6877));
      var ks = cljs.core.rest(cljs.core.next(arglist__6877));
      return G__6873__delegate(coll, k, ks)
    };
    G__6873.cljs$lang$arity$variadic = G__6873__delegate;
    return G__6873
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
  var h__6879 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6879;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6879
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6881 = cljs.core.string_hash_cache[k];
  if(!(h__6881 == null)) {
    return h__6881
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
      var and__3822__auto____6883 = goog.isString(o);
      if(and__3822__auto____6883) {
        return check_cache
      }else {
        return and__3822__auto____6883
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
    var G__6887__6888 = x;
    if(G__6887__6888) {
      if(function() {
        var or__3824__auto____6889 = G__6887__6888.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____6889) {
          return or__3824__auto____6889
        }else {
          return G__6887__6888.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6887__6888.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6887__6888)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6887__6888)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6893__6894 = x;
    if(G__6893__6894) {
      if(function() {
        var or__3824__auto____6895 = G__6893__6894.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____6895) {
          return or__3824__auto____6895
        }else {
          return G__6893__6894.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6893__6894.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6893__6894)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6893__6894)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6899__6900 = x;
  if(G__6899__6900) {
    if(function() {
      var or__3824__auto____6901 = G__6899__6900.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____6901) {
        return or__3824__auto____6901
      }else {
        return G__6899__6900.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6899__6900.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6899__6900)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6899__6900)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6905__6906 = x;
  if(G__6905__6906) {
    if(function() {
      var or__3824__auto____6907 = G__6905__6906.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____6907) {
        return or__3824__auto____6907
      }else {
        return G__6905__6906.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6905__6906.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6905__6906)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6905__6906)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6911__6912 = x;
  if(G__6911__6912) {
    if(function() {
      var or__3824__auto____6913 = G__6911__6912.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6913) {
        return or__3824__auto____6913
      }else {
        return G__6911__6912.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6911__6912.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6911__6912)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6911__6912)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6917__6918 = x;
  if(G__6917__6918) {
    if(function() {
      var or__3824__auto____6919 = G__6917__6918.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6919) {
        return or__3824__auto____6919
      }else {
        return G__6917__6918.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6917__6918.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6917__6918)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6917__6918)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6923__6924 = x;
  if(G__6923__6924) {
    if(function() {
      var or__3824__auto____6925 = G__6923__6924.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____6925) {
        return or__3824__auto____6925
      }else {
        return G__6923__6924.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6923__6924.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6923__6924)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6923__6924)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6929__6930 = x;
    if(G__6929__6930) {
      if(function() {
        var or__3824__auto____6931 = G__6929__6930.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____6931) {
          return or__3824__auto____6931
        }else {
          return G__6929__6930.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6929__6930.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6929__6930)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6929__6930)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6935__6936 = x;
  if(G__6935__6936) {
    if(function() {
      var or__3824__auto____6937 = G__6935__6936.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____6937) {
        return or__3824__auto____6937
      }else {
        return G__6935__6936.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6935__6936.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6935__6936)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6935__6936)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6941__6942 = x;
  if(G__6941__6942) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____6943 = null;
      if(cljs.core.truth_(or__3824__auto____6943)) {
        return or__3824__auto____6943
      }else {
        return G__6941__6942.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6941__6942.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6941__6942)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6941__6942)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6944__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6944 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6944__delegate.call(this, keyvals)
    };
    G__6944.cljs$lang$maxFixedArity = 0;
    G__6944.cljs$lang$applyTo = function(arglist__6945) {
      var keyvals = cljs.core.seq(arglist__6945);
      return G__6944__delegate(keyvals)
    };
    G__6944.cljs$lang$arity$variadic = G__6944__delegate;
    return G__6944
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
  var keys__6947 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6947.push(key)
  });
  return keys__6947
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6951 = i;
  var j__6952 = j;
  var len__6953 = len;
  while(true) {
    if(len__6953 === 0) {
      return to
    }else {
      to[j__6952] = from[i__6951];
      var G__6954 = i__6951 + 1;
      var G__6955 = j__6952 + 1;
      var G__6956 = len__6953 - 1;
      i__6951 = G__6954;
      j__6952 = G__6955;
      len__6953 = G__6956;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6960 = i + (len - 1);
  var j__6961 = j + (len - 1);
  var len__6962 = len;
  while(true) {
    if(len__6962 === 0) {
      return to
    }else {
      to[j__6961] = from[i__6960];
      var G__6963 = i__6960 - 1;
      var G__6964 = j__6961 - 1;
      var G__6965 = len__6962 - 1;
      i__6960 = G__6963;
      j__6961 = G__6964;
      len__6962 = G__6965;
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
    var G__6969__6970 = s;
    if(G__6969__6970) {
      if(function() {
        var or__3824__auto____6971 = G__6969__6970.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____6971) {
          return or__3824__auto____6971
        }else {
          return G__6969__6970.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6969__6970.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6969__6970)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6969__6970)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6975__6976 = s;
  if(G__6975__6976) {
    if(function() {
      var or__3824__auto____6977 = G__6975__6976.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____6977) {
        return or__3824__auto____6977
      }else {
        return G__6975__6976.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__6975__6976.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6975__6976)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6975__6976)
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
  var and__3822__auto____6980 = goog.isString(x);
  if(and__3822__auto____6980) {
    return!function() {
      var or__3824__auto____6981 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____6981) {
        return or__3824__auto____6981
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____6980
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____6983 = goog.isString(x);
  if(and__3822__auto____6983) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____6983
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____6985 = goog.isString(x);
  if(and__3822__auto____6985) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____6985
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____6990 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____6990) {
    return or__3824__auto____6990
  }else {
    var G__6991__6992 = f;
    if(G__6991__6992) {
      if(function() {
        var or__3824__auto____6993 = G__6991__6992.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____6993) {
          return or__3824__auto____6993
        }else {
          return G__6991__6992.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__6991__6992.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6991__6992)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6991__6992)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____6995 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____6995) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____6995
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
    var and__3822__auto____6998 = coll;
    if(cljs.core.truth_(and__3822__auto____6998)) {
      var and__3822__auto____6999 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____6999) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____6999
      }
    }else {
      return and__3822__auto____6998
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
    var G__7008__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7004 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7005 = more;
        while(true) {
          var x__7006 = cljs.core.first.call(null, xs__7005);
          var etc__7007 = cljs.core.next.call(null, xs__7005);
          if(cljs.core.truth_(xs__7005)) {
            if(cljs.core.contains_QMARK_.call(null, s__7004, x__7006)) {
              return false
            }else {
              var G__7009 = cljs.core.conj.call(null, s__7004, x__7006);
              var G__7010 = etc__7007;
              s__7004 = G__7009;
              xs__7005 = G__7010;
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
    var G__7008 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7008__delegate.call(this, x, y, more)
    };
    G__7008.cljs$lang$maxFixedArity = 2;
    G__7008.cljs$lang$applyTo = function(arglist__7011) {
      var x = cljs.core.first(arglist__7011);
      var y = cljs.core.first(cljs.core.next(arglist__7011));
      var more = cljs.core.rest(cljs.core.next(arglist__7011));
      return G__7008__delegate(x, y, more)
    };
    G__7008.cljs$lang$arity$variadic = G__7008__delegate;
    return G__7008
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
            var G__7015__7016 = x;
            if(G__7015__7016) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7017 = null;
                if(cljs.core.truth_(or__3824__auto____7017)) {
                  return or__3824__auto____7017
                }else {
                  return G__7015__7016.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7015__7016.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7015__7016)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7015__7016)
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
    var xl__7022 = cljs.core.count.call(null, xs);
    var yl__7023 = cljs.core.count.call(null, ys);
    if(xl__7022 < yl__7023) {
      return-1
    }else {
      if(xl__7022 > yl__7023) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7022, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7024 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7025 = d__7024 === 0;
        if(and__3822__auto____7025) {
          return n + 1 < len
        }else {
          return and__3822__auto____7025
        }
      }()) {
        var G__7026 = xs;
        var G__7027 = ys;
        var G__7028 = len;
        var G__7029 = n + 1;
        xs = G__7026;
        ys = G__7027;
        len = G__7028;
        n = G__7029;
        continue
      }else {
        return d__7024
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
      var r__7031 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7031)) {
        return r__7031
      }else {
        if(cljs.core.truth_(r__7031)) {
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
      var a__7033 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7033, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7033)
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
    var temp__3971__auto____7039 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7039) {
      var s__7040 = temp__3971__auto____7039;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7040), cljs.core.next.call(null, s__7040))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7041 = val;
    var coll__7042 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7042) {
        var nval__7043 = f.call(null, val__7041, cljs.core.first.call(null, coll__7042));
        if(cljs.core.reduced_QMARK_.call(null, nval__7043)) {
          return cljs.core.deref.call(null, nval__7043)
        }else {
          var G__7044 = nval__7043;
          var G__7045 = cljs.core.next.call(null, coll__7042);
          val__7041 = G__7044;
          coll__7042 = G__7045;
          continue
        }
      }else {
        return val__7041
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
  var a__7047 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7047);
  return cljs.core.vec.call(null, a__7047)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7054__7055 = coll;
      if(G__7054__7055) {
        if(function() {
          var or__3824__auto____7056 = G__7054__7055.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7056) {
            return or__3824__auto____7056
          }else {
            return G__7054__7055.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7054__7055.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7054__7055)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7054__7055)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7057__7058 = coll;
      if(G__7057__7058) {
        if(function() {
          var or__3824__auto____7059 = G__7057__7058.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7059) {
            return or__3824__auto____7059
          }else {
            return G__7057__7058.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7057__7058.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7057__7058)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7057__7058)
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
  var this__7060 = this;
  return this__7060.val
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
    var G__7061__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7061 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7061__delegate.call(this, x, y, more)
    };
    G__7061.cljs$lang$maxFixedArity = 2;
    G__7061.cljs$lang$applyTo = function(arglist__7062) {
      var x = cljs.core.first(arglist__7062);
      var y = cljs.core.first(cljs.core.next(arglist__7062));
      var more = cljs.core.rest(cljs.core.next(arglist__7062));
      return G__7061__delegate(x, y, more)
    };
    G__7061.cljs$lang$arity$variadic = G__7061__delegate;
    return G__7061
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
    var G__7063__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7063 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7063__delegate.call(this, x, y, more)
    };
    G__7063.cljs$lang$maxFixedArity = 2;
    G__7063.cljs$lang$applyTo = function(arglist__7064) {
      var x = cljs.core.first(arglist__7064);
      var y = cljs.core.first(cljs.core.next(arglist__7064));
      var more = cljs.core.rest(cljs.core.next(arglist__7064));
      return G__7063__delegate(x, y, more)
    };
    G__7063.cljs$lang$arity$variadic = G__7063__delegate;
    return G__7063
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
    var G__7065__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7065 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7065__delegate.call(this, x, y, more)
    };
    G__7065.cljs$lang$maxFixedArity = 2;
    G__7065.cljs$lang$applyTo = function(arglist__7066) {
      var x = cljs.core.first(arglist__7066);
      var y = cljs.core.first(cljs.core.next(arglist__7066));
      var more = cljs.core.rest(cljs.core.next(arglist__7066));
      return G__7065__delegate(x, y, more)
    };
    G__7065.cljs$lang$arity$variadic = G__7065__delegate;
    return G__7065
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
    var G__7067__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7067 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7067__delegate.call(this, x, y, more)
    };
    G__7067.cljs$lang$maxFixedArity = 2;
    G__7067.cljs$lang$applyTo = function(arglist__7068) {
      var x = cljs.core.first(arglist__7068);
      var y = cljs.core.first(cljs.core.next(arglist__7068));
      var more = cljs.core.rest(cljs.core.next(arglist__7068));
      return G__7067__delegate(x, y, more)
    };
    G__7067.cljs$lang$arity$variadic = G__7067__delegate;
    return G__7067
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
    var G__7069__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7070 = y;
            var G__7071 = cljs.core.first.call(null, more);
            var G__7072 = cljs.core.next.call(null, more);
            x = G__7070;
            y = G__7071;
            more = G__7072;
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
    var G__7069 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7069__delegate.call(this, x, y, more)
    };
    G__7069.cljs$lang$maxFixedArity = 2;
    G__7069.cljs$lang$applyTo = function(arglist__7073) {
      var x = cljs.core.first(arglist__7073);
      var y = cljs.core.first(cljs.core.next(arglist__7073));
      var more = cljs.core.rest(cljs.core.next(arglist__7073));
      return G__7069__delegate(x, y, more)
    };
    G__7069.cljs$lang$arity$variadic = G__7069__delegate;
    return G__7069
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
    var G__7074__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7075 = y;
            var G__7076 = cljs.core.first.call(null, more);
            var G__7077 = cljs.core.next.call(null, more);
            x = G__7075;
            y = G__7076;
            more = G__7077;
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
    var G__7074 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7074__delegate.call(this, x, y, more)
    };
    G__7074.cljs$lang$maxFixedArity = 2;
    G__7074.cljs$lang$applyTo = function(arglist__7078) {
      var x = cljs.core.first(arglist__7078);
      var y = cljs.core.first(cljs.core.next(arglist__7078));
      var more = cljs.core.rest(cljs.core.next(arglist__7078));
      return G__7074__delegate(x, y, more)
    };
    G__7074.cljs$lang$arity$variadic = G__7074__delegate;
    return G__7074
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
    var G__7079__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7080 = y;
            var G__7081 = cljs.core.first.call(null, more);
            var G__7082 = cljs.core.next.call(null, more);
            x = G__7080;
            y = G__7081;
            more = G__7082;
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
    var G__7079 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7079__delegate.call(this, x, y, more)
    };
    G__7079.cljs$lang$maxFixedArity = 2;
    G__7079.cljs$lang$applyTo = function(arglist__7083) {
      var x = cljs.core.first(arglist__7083);
      var y = cljs.core.first(cljs.core.next(arglist__7083));
      var more = cljs.core.rest(cljs.core.next(arglist__7083));
      return G__7079__delegate(x, y, more)
    };
    G__7079.cljs$lang$arity$variadic = G__7079__delegate;
    return G__7079
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
    var G__7084__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7085 = y;
            var G__7086 = cljs.core.first.call(null, more);
            var G__7087 = cljs.core.next.call(null, more);
            x = G__7085;
            y = G__7086;
            more = G__7087;
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
    var G__7084 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7084__delegate.call(this, x, y, more)
    };
    G__7084.cljs$lang$maxFixedArity = 2;
    G__7084.cljs$lang$applyTo = function(arglist__7088) {
      var x = cljs.core.first(arglist__7088);
      var y = cljs.core.first(cljs.core.next(arglist__7088));
      var more = cljs.core.rest(cljs.core.next(arglist__7088));
      return G__7084__delegate(x, y, more)
    };
    G__7084.cljs$lang$arity$variadic = G__7084__delegate;
    return G__7084
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
    var G__7089__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7089 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7089__delegate.call(this, x, y, more)
    };
    G__7089.cljs$lang$maxFixedArity = 2;
    G__7089.cljs$lang$applyTo = function(arglist__7090) {
      var x = cljs.core.first(arglist__7090);
      var y = cljs.core.first(cljs.core.next(arglist__7090));
      var more = cljs.core.rest(cljs.core.next(arglist__7090));
      return G__7089__delegate(x, y, more)
    };
    G__7089.cljs$lang$arity$variadic = G__7089__delegate;
    return G__7089
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
    var G__7091__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7091 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7091__delegate.call(this, x, y, more)
    };
    G__7091.cljs$lang$maxFixedArity = 2;
    G__7091.cljs$lang$applyTo = function(arglist__7092) {
      var x = cljs.core.first(arglist__7092);
      var y = cljs.core.first(cljs.core.next(arglist__7092));
      var more = cljs.core.rest(cljs.core.next(arglist__7092));
      return G__7091__delegate(x, y, more)
    };
    G__7091.cljs$lang$arity$variadic = G__7091__delegate;
    return G__7091
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
  var rem__7094 = n % d;
  return cljs.core.fix.call(null, (n - rem__7094) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7096 = cljs.core.quot.call(null, n, d);
  return n - d * q__7096
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
  var v__7099 = v - (v >> 1 & 1431655765);
  var v__7100 = (v__7099 & 858993459) + (v__7099 >> 2 & 858993459);
  return(v__7100 + (v__7100 >> 4) & 252645135) * 16843009 >> 24
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
    var G__7101__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7102 = y;
            var G__7103 = cljs.core.first.call(null, more);
            var G__7104 = cljs.core.next.call(null, more);
            x = G__7102;
            y = G__7103;
            more = G__7104;
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
    var G__7101 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7101__delegate.call(this, x, y, more)
    };
    G__7101.cljs$lang$maxFixedArity = 2;
    G__7101.cljs$lang$applyTo = function(arglist__7105) {
      var x = cljs.core.first(arglist__7105);
      var y = cljs.core.first(cljs.core.next(arglist__7105));
      var more = cljs.core.rest(cljs.core.next(arglist__7105));
      return G__7101__delegate(x, y, more)
    };
    G__7101.cljs$lang$arity$variadic = G__7101__delegate;
    return G__7101
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
  var n__7109 = n;
  var xs__7110 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7111 = xs__7110;
      if(and__3822__auto____7111) {
        return n__7109 > 0
      }else {
        return and__3822__auto____7111
      }
    }())) {
      var G__7112 = n__7109 - 1;
      var G__7113 = cljs.core.next.call(null, xs__7110);
      n__7109 = G__7112;
      xs__7110 = G__7113;
      continue
    }else {
      return xs__7110
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
    var G__7114__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7115 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7116 = cljs.core.next.call(null, more);
            sb = G__7115;
            more = G__7116;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7114 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7114__delegate.call(this, x, ys)
    };
    G__7114.cljs$lang$maxFixedArity = 1;
    G__7114.cljs$lang$applyTo = function(arglist__7117) {
      var x = cljs.core.first(arglist__7117);
      var ys = cljs.core.rest(arglist__7117);
      return G__7114__delegate(x, ys)
    };
    G__7114.cljs$lang$arity$variadic = G__7114__delegate;
    return G__7114
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
    var G__7118__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7119 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7120 = cljs.core.next.call(null, more);
            sb = G__7119;
            more = G__7120;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7118 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7118__delegate.call(this, x, ys)
    };
    G__7118.cljs$lang$maxFixedArity = 1;
    G__7118.cljs$lang$applyTo = function(arglist__7121) {
      var x = cljs.core.first(arglist__7121);
      var ys = cljs.core.rest(arglist__7121);
      return G__7118__delegate(x, ys)
    };
    G__7118.cljs$lang$arity$variadic = G__7118__delegate;
    return G__7118
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
  format.cljs$lang$applyTo = function(arglist__7122) {
    var fmt = cljs.core.first(arglist__7122);
    var args = cljs.core.rest(arglist__7122);
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
    var xs__7125 = cljs.core.seq.call(null, x);
    var ys__7126 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7125 == null) {
        return ys__7126 == null
      }else {
        if(ys__7126 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7125), cljs.core.first.call(null, ys__7126))) {
            var G__7127 = cljs.core.next.call(null, xs__7125);
            var G__7128 = cljs.core.next.call(null, ys__7126);
            xs__7125 = G__7127;
            ys__7126 = G__7128;
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
  return cljs.core.reduce.call(null, function(p1__7129_SHARP_, p2__7130_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7129_SHARP_, cljs.core.hash.call(null, p2__7130_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7134 = 0;
  var s__7135 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7135) {
      var e__7136 = cljs.core.first.call(null, s__7135);
      var G__7137 = (h__7134 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7136)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7136)))) % 4503599627370496;
      var G__7138 = cljs.core.next.call(null, s__7135);
      h__7134 = G__7137;
      s__7135 = G__7138;
      continue
    }else {
      return h__7134
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7142 = 0;
  var s__7143 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7143) {
      var e__7144 = cljs.core.first.call(null, s__7143);
      var G__7145 = (h__7142 + cljs.core.hash.call(null, e__7144)) % 4503599627370496;
      var G__7146 = cljs.core.next.call(null, s__7143);
      h__7142 = G__7145;
      s__7143 = G__7146;
      continue
    }else {
      return h__7142
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7167__7168 = cljs.core.seq.call(null, fn_map);
  if(G__7167__7168) {
    var G__7170__7172 = cljs.core.first.call(null, G__7167__7168);
    var vec__7171__7173 = G__7170__7172;
    var key_name__7174 = cljs.core.nth.call(null, vec__7171__7173, 0, null);
    var f__7175 = cljs.core.nth.call(null, vec__7171__7173, 1, null);
    var G__7167__7176 = G__7167__7168;
    var G__7170__7177 = G__7170__7172;
    var G__7167__7178 = G__7167__7176;
    while(true) {
      var vec__7179__7180 = G__7170__7177;
      var key_name__7181 = cljs.core.nth.call(null, vec__7179__7180, 0, null);
      var f__7182 = cljs.core.nth.call(null, vec__7179__7180, 1, null);
      var G__7167__7183 = G__7167__7178;
      var str_name__7184 = cljs.core.name.call(null, key_name__7181);
      obj[str_name__7184] = f__7182;
      var temp__3974__auto____7185 = cljs.core.next.call(null, G__7167__7183);
      if(temp__3974__auto____7185) {
        var G__7167__7186 = temp__3974__auto____7185;
        var G__7187 = cljs.core.first.call(null, G__7167__7186);
        var G__7188 = G__7167__7186;
        G__7170__7177 = G__7187;
        G__7167__7178 = G__7188;
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
  var this__7189 = this;
  var h__2192__auto____7190 = this__7189.__hash;
  if(!(h__2192__auto____7190 == null)) {
    return h__2192__auto____7190
  }else {
    var h__2192__auto____7191 = cljs.core.hash_coll.call(null, coll);
    this__7189.__hash = h__2192__auto____7191;
    return h__2192__auto____7191
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7192 = this;
  if(this__7192.count === 1) {
    return null
  }else {
    return this__7192.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7193 = this;
  return new cljs.core.List(this__7193.meta, o, coll, this__7193.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7194 = this;
  var this__7195 = this;
  return cljs.core.pr_str.call(null, this__7195)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7196 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7197 = this;
  return this__7197.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7198 = this;
  return this__7198.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7199 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7200 = this;
  return this__7200.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7201 = this;
  if(this__7201.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7201.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7202 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7203 = this;
  return new cljs.core.List(meta, this__7203.first, this__7203.rest, this__7203.count, this__7203.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7204 = this;
  return this__7204.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7205 = this;
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
  var this__7206 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7207 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7208 = this;
  return new cljs.core.List(this__7208.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7209 = this;
  var this__7210 = this;
  return cljs.core.pr_str.call(null, this__7210)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7211 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7212 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7213 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7214 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7215 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7216 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7217 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7218 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7219 = this;
  return this__7219.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7220 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7224__7225 = coll;
  if(G__7224__7225) {
    if(function() {
      var or__3824__auto____7226 = G__7224__7225.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7226) {
        return or__3824__auto____7226
      }else {
        return G__7224__7225.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7224__7225.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7224__7225)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7224__7225)
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
    var G__7227__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7227 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7227__delegate.call(this, x, y, z, items)
    };
    G__7227.cljs$lang$maxFixedArity = 3;
    G__7227.cljs$lang$applyTo = function(arglist__7228) {
      var x = cljs.core.first(arglist__7228);
      var y = cljs.core.first(cljs.core.next(arglist__7228));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7228)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7228)));
      return G__7227__delegate(x, y, z, items)
    };
    G__7227.cljs$lang$arity$variadic = G__7227__delegate;
    return G__7227
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
  var this__7229 = this;
  var h__2192__auto____7230 = this__7229.__hash;
  if(!(h__2192__auto____7230 == null)) {
    return h__2192__auto____7230
  }else {
    var h__2192__auto____7231 = cljs.core.hash_coll.call(null, coll);
    this__7229.__hash = h__2192__auto____7231;
    return h__2192__auto____7231
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7232 = this;
  if(this__7232.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7232.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7233 = this;
  return new cljs.core.Cons(null, o, coll, this__7233.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7234 = this;
  var this__7235 = this;
  return cljs.core.pr_str.call(null, this__7235)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7236 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7237 = this;
  return this__7237.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7238 = this;
  if(this__7238.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7238.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7239 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7240 = this;
  return new cljs.core.Cons(meta, this__7240.first, this__7240.rest, this__7240.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7241 = this;
  return this__7241.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7242 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7242.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7247 = coll == null;
    if(or__3824__auto____7247) {
      return or__3824__auto____7247
    }else {
      var G__7248__7249 = coll;
      if(G__7248__7249) {
        if(function() {
          var or__3824__auto____7250 = G__7248__7249.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7250) {
            return or__3824__auto____7250
          }else {
            return G__7248__7249.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7248__7249.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7248__7249)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7248__7249)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7254__7255 = x;
  if(G__7254__7255) {
    if(function() {
      var or__3824__auto____7256 = G__7254__7255.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7256) {
        return or__3824__auto____7256
      }else {
        return G__7254__7255.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7254__7255.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7254__7255)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7254__7255)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7257 = null;
  var G__7257__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7257__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7257 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7257__2.call(this, string, f);
      case 3:
        return G__7257__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7257
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7258 = null;
  var G__7258__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7258__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7258 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7258__2.call(this, string, k);
      case 3:
        return G__7258__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7258
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7259 = null;
  var G__7259__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7259__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7259 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7259__2.call(this, string, n);
      case 3:
        return G__7259__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7259
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
  var G__7271 = null;
  var G__7271__2 = function(this_sym7262, coll) {
    var this__7264 = this;
    var this_sym7262__7265 = this;
    var ___7266 = this_sym7262__7265;
    if(coll == null) {
      return null
    }else {
      var strobj__7267 = coll.strobj;
      if(strobj__7267 == null) {
        return cljs.core._lookup.call(null, coll, this__7264.k, null)
      }else {
        return strobj__7267[this__7264.k]
      }
    }
  };
  var G__7271__3 = function(this_sym7263, coll, not_found) {
    var this__7264 = this;
    var this_sym7263__7268 = this;
    var ___7269 = this_sym7263__7268;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7264.k, not_found)
    }
  };
  G__7271 = function(this_sym7263, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7271__2.call(this, this_sym7263, coll);
      case 3:
        return G__7271__3.call(this, this_sym7263, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7271
}();
cljs.core.Keyword.prototype.apply = function(this_sym7260, args7261) {
  var this__7270 = this;
  return this_sym7260.call.apply(this_sym7260, [this_sym7260].concat(args7261.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7280 = null;
  var G__7280__2 = function(this_sym7274, coll) {
    var this_sym7274__7276 = this;
    var this__7277 = this_sym7274__7276;
    return cljs.core._lookup.call(null, coll, this__7277.toString(), null)
  };
  var G__7280__3 = function(this_sym7275, coll, not_found) {
    var this_sym7275__7278 = this;
    var this__7279 = this_sym7275__7278;
    return cljs.core._lookup.call(null, coll, this__7279.toString(), not_found)
  };
  G__7280 = function(this_sym7275, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7280__2.call(this, this_sym7275, coll);
      case 3:
        return G__7280__3.call(this, this_sym7275, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7280
}();
String.prototype.apply = function(this_sym7272, args7273) {
  return this_sym7272.call.apply(this_sym7272, [this_sym7272].concat(args7273.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7282 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7282
  }else {
    lazy_seq.x = x__7282.call(null);
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
  var this__7283 = this;
  var h__2192__auto____7284 = this__7283.__hash;
  if(!(h__2192__auto____7284 == null)) {
    return h__2192__auto____7284
  }else {
    var h__2192__auto____7285 = cljs.core.hash_coll.call(null, coll);
    this__7283.__hash = h__2192__auto____7285;
    return h__2192__auto____7285
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7286 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7287 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7288 = this;
  var this__7289 = this;
  return cljs.core.pr_str.call(null, this__7289)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7290 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7291 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7292 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7293 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7294 = this;
  return new cljs.core.LazySeq(meta, this__7294.realized, this__7294.x, this__7294.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7295 = this;
  return this__7295.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7296 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7296.meta)
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
  var this__7297 = this;
  return this__7297.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7298 = this;
  var ___7299 = this;
  this__7298.buf[this__7298.end] = o;
  return this__7298.end = this__7298.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7300 = this;
  var ___7301 = this;
  var ret__7302 = new cljs.core.ArrayChunk(this__7300.buf, 0, this__7300.end);
  this__7300.buf = null;
  return ret__7302
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
  var this__7303 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7303.arr[this__7303.off], this__7303.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7304 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7304.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7305 = this;
  if(this__7305.off === this__7305.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7305.arr, this__7305.off + 1, this__7305.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7306 = this;
  return this__7306.arr[this__7306.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7307 = this;
  if(function() {
    var and__3822__auto____7308 = i >= 0;
    if(and__3822__auto____7308) {
      return i < this__7307.end - this__7307.off
    }else {
      return and__3822__auto____7308
    }
  }()) {
    return this__7307.arr[this__7307.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7309 = this;
  return this__7309.end - this__7309.off
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
  var this__7310 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7311 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7312 = this;
  return cljs.core._nth.call(null, this__7312.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7313 = this;
  if(cljs.core._count.call(null, this__7313.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7313.chunk), this__7313.more, this__7313.meta)
  }else {
    if(this__7313.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7313.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7314 = this;
  if(this__7314.more == null) {
    return null
  }else {
    return this__7314.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7315 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7316 = this;
  return new cljs.core.ChunkedCons(this__7316.chunk, this__7316.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7317 = this;
  return this__7317.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7318 = this;
  return this__7318.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7319 = this;
  if(this__7319.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7319.more
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
    var G__7323__7324 = s;
    if(G__7323__7324) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7325 = null;
        if(cljs.core.truth_(or__3824__auto____7325)) {
          return or__3824__auto____7325
        }else {
          return G__7323__7324.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7323__7324.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7323__7324)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7323__7324)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7328 = [];
  var s__7329 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7329)) {
      ary__7328.push(cljs.core.first.call(null, s__7329));
      var G__7330 = cljs.core.next.call(null, s__7329);
      s__7329 = G__7330;
      continue
    }else {
      return ary__7328
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7334 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7335 = 0;
  var xs__7336 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7336) {
      ret__7334[i__7335] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7336));
      var G__7337 = i__7335 + 1;
      var G__7338 = cljs.core.next.call(null, xs__7336);
      i__7335 = G__7337;
      xs__7336 = G__7338;
      continue
    }else {
    }
    break
  }
  return ret__7334
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
    var a__7346 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7347 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7348 = 0;
      var s__7349 = s__7347;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7350 = s__7349;
          if(and__3822__auto____7350) {
            return i__7348 < size
          }else {
            return and__3822__auto____7350
          }
        }())) {
          a__7346[i__7348] = cljs.core.first.call(null, s__7349);
          var G__7353 = i__7348 + 1;
          var G__7354 = cljs.core.next.call(null, s__7349);
          i__7348 = G__7353;
          s__7349 = G__7354;
          continue
        }else {
          return a__7346
        }
        break
      }
    }else {
      var n__2527__auto____7351 = size;
      var i__7352 = 0;
      while(true) {
        if(i__7352 < n__2527__auto____7351) {
          a__7346[i__7352] = init_val_or_seq;
          var G__7355 = i__7352 + 1;
          i__7352 = G__7355;
          continue
        }else {
        }
        break
      }
      return a__7346
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
    var a__7363 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7364 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7365 = 0;
      var s__7366 = s__7364;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7367 = s__7366;
          if(and__3822__auto____7367) {
            return i__7365 < size
          }else {
            return and__3822__auto____7367
          }
        }())) {
          a__7363[i__7365] = cljs.core.first.call(null, s__7366);
          var G__7370 = i__7365 + 1;
          var G__7371 = cljs.core.next.call(null, s__7366);
          i__7365 = G__7370;
          s__7366 = G__7371;
          continue
        }else {
          return a__7363
        }
        break
      }
    }else {
      var n__2527__auto____7368 = size;
      var i__7369 = 0;
      while(true) {
        if(i__7369 < n__2527__auto____7368) {
          a__7363[i__7369] = init_val_or_seq;
          var G__7372 = i__7369 + 1;
          i__7369 = G__7372;
          continue
        }else {
        }
        break
      }
      return a__7363
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
    var a__7380 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7381 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7382 = 0;
      var s__7383 = s__7381;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7384 = s__7383;
          if(and__3822__auto____7384) {
            return i__7382 < size
          }else {
            return and__3822__auto____7384
          }
        }())) {
          a__7380[i__7382] = cljs.core.first.call(null, s__7383);
          var G__7387 = i__7382 + 1;
          var G__7388 = cljs.core.next.call(null, s__7383);
          i__7382 = G__7387;
          s__7383 = G__7388;
          continue
        }else {
          return a__7380
        }
        break
      }
    }else {
      var n__2527__auto____7385 = size;
      var i__7386 = 0;
      while(true) {
        if(i__7386 < n__2527__auto____7385) {
          a__7380[i__7386] = init_val_or_seq;
          var G__7389 = i__7386 + 1;
          i__7386 = G__7389;
          continue
        }else {
        }
        break
      }
      return a__7380
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
    var s__7394 = s;
    var i__7395 = n;
    var sum__7396 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7397 = i__7395 > 0;
        if(and__3822__auto____7397) {
          return cljs.core.seq.call(null, s__7394)
        }else {
          return and__3822__auto____7397
        }
      }())) {
        var G__7398 = cljs.core.next.call(null, s__7394);
        var G__7399 = i__7395 - 1;
        var G__7400 = sum__7396 + 1;
        s__7394 = G__7398;
        i__7395 = G__7399;
        sum__7396 = G__7400;
        continue
      }else {
        return sum__7396
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
      var s__7405 = cljs.core.seq.call(null, x);
      if(s__7405) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7405)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7405), concat.call(null, cljs.core.chunk_rest.call(null, s__7405), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7405), concat.call(null, cljs.core.rest.call(null, s__7405), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7409__delegate = function(x, y, zs) {
      var cat__7408 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7407 = cljs.core.seq.call(null, xys);
          if(xys__7407) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7407)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7407), cat.call(null, cljs.core.chunk_rest.call(null, xys__7407), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7407), cat.call(null, cljs.core.rest.call(null, xys__7407), zs))
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
      return cat__7408.call(null, concat.call(null, x, y), zs)
    };
    var G__7409 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7409__delegate.call(this, x, y, zs)
    };
    G__7409.cljs$lang$maxFixedArity = 2;
    G__7409.cljs$lang$applyTo = function(arglist__7410) {
      var x = cljs.core.first(arglist__7410);
      var y = cljs.core.first(cljs.core.next(arglist__7410));
      var zs = cljs.core.rest(cljs.core.next(arglist__7410));
      return G__7409__delegate(x, y, zs)
    };
    G__7409.cljs$lang$arity$variadic = G__7409__delegate;
    return G__7409
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
    var G__7411__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7411 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7411__delegate.call(this, a, b, c, d, more)
    };
    G__7411.cljs$lang$maxFixedArity = 4;
    G__7411.cljs$lang$applyTo = function(arglist__7412) {
      var a = cljs.core.first(arglist__7412);
      var b = cljs.core.first(cljs.core.next(arglist__7412));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7412)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7412))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7412))));
      return G__7411__delegate(a, b, c, d, more)
    };
    G__7411.cljs$lang$arity$variadic = G__7411__delegate;
    return G__7411
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
  var args__7454 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7455 = cljs.core._first.call(null, args__7454);
    var args__7456 = cljs.core._rest.call(null, args__7454);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7455)
      }else {
        return f.call(null, a__7455)
      }
    }else {
      var b__7457 = cljs.core._first.call(null, args__7456);
      var args__7458 = cljs.core._rest.call(null, args__7456);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7455, b__7457)
        }else {
          return f.call(null, a__7455, b__7457)
        }
      }else {
        var c__7459 = cljs.core._first.call(null, args__7458);
        var args__7460 = cljs.core._rest.call(null, args__7458);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7455, b__7457, c__7459)
          }else {
            return f.call(null, a__7455, b__7457, c__7459)
          }
        }else {
          var d__7461 = cljs.core._first.call(null, args__7460);
          var args__7462 = cljs.core._rest.call(null, args__7460);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7455, b__7457, c__7459, d__7461)
            }else {
              return f.call(null, a__7455, b__7457, c__7459, d__7461)
            }
          }else {
            var e__7463 = cljs.core._first.call(null, args__7462);
            var args__7464 = cljs.core._rest.call(null, args__7462);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7455, b__7457, c__7459, d__7461, e__7463)
              }else {
                return f.call(null, a__7455, b__7457, c__7459, d__7461, e__7463)
              }
            }else {
              var f__7465 = cljs.core._first.call(null, args__7464);
              var args__7466 = cljs.core._rest.call(null, args__7464);
              if(argc === 6) {
                if(f__7465.cljs$lang$arity$6) {
                  return f__7465.cljs$lang$arity$6(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465)
                }else {
                  return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465)
                }
              }else {
                var g__7467 = cljs.core._first.call(null, args__7466);
                var args__7468 = cljs.core._rest.call(null, args__7466);
                if(argc === 7) {
                  if(f__7465.cljs$lang$arity$7) {
                    return f__7465.cljs$lang$arity$7(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467)
                  }else {
                    return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467)
                  }
                }else {
                  var h__7469 = cljs.core._first.call(null, args__7468);
                  var args__7470 = cljs.core._rest.call(null, args__7468);
                  if(argc === 8) {
                    if(f__7465.cljs$lang$arity$8) {
                      return f__7465.cljs$lang$arity$8(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469)
                    }else {
                      return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469)
                    }
                  }else {
                    var i__7471 = cljs.core._first.call(null, args__7470);
                    var args__7472 = cljs.core._rest.call(null, args__7470);
                    if(argc === 9) {
                      if(f__7465.cljs$lang$arity$9) {
                        return f__7465.cljs$lang$arity$9(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471)
                      }else {
                        return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471)
                      }
                    }else {
                      var j__7473 = cljs.core._first.call(null, args__7472);
                      var args__7474 = cljs.core._rest.call(null, args__7472);
                      if(argc === 10) {
                        if(f__7465.cljs$lang$arity$10) {
                          return f__7465.cljs$lang$arity$10(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473)
                        }else {
                          return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473)
                        }
                      }else {
                        var k__7475 = cljs.core._first.call(null, args__7474);
                        var args__7476 = cljs.core._rest.call(null, args__7474);
                        if(argc === 11) {
                          if(f__7465.cljs$lang$arity$11) {
                            return f__7465.cljs$lang$arity$11(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475)
                          }else {
                            return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475)
                          }
                        }else {
                          var l__7477 = cljs.core._first.call(null, args__7476);
                          var args__7478 = cljs.core._rest.call(null, args__7476);
                          if(argc === 12) {
                            if(f__7465.cljs$lang$arity$12) {
                              return f__7465.cljs$lang$arity$12(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477)
                            }else {
                              return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477)
                            }
                          }else {
                            var m__7479 = cljs.core._first.call(null, args__7478);
                            var args__7480 = cljs.core._rest.call(null, args__7478);
                            if(argc === 13) {
                              if(f__7465.cljs$lang$arity$13) {
                                return f__7465.cljs$lang$arity$13(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479)
                              }else {
                                return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479)
                              }
                            }else {
                              var n__7481 = cljs.core._first.call(null, args__7480);
                              var args__7482 = cljs.core._rest.call(null, args__7480);
                              if(argc === 14) {
                                if(f__7465.cljs$lang$arity$14) {
                                  return f__7465.cljs$lang$arity$14(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481)
                                }else {
                                  return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481)
                                }
                              }else {
                                var o__7483 = cljs.core._first.call(null, args__7482);
                                var args__7484 = cljs.core._rest.call(null, args__7482);
                                if(argc === 15) {
                                  if(f__7465.cljs$lang$arity$15) {
                                    return f__7465.cljs$lang$arity$15(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481, o__7483)
                                  }else {
                                    return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481, o__7483)
                                  }
                                }else {
                                  var p__7485 = cljs.core._first.call(null, args__7484);
                                  var args__7486 = cljs.core._rest.call(null, args__7484);
                                  if(argc === 16) {
                                    if(f__7465.cljs$lang$arity$16) {
                                      return f__7465.cljs$lang$arity$16(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481, o__7483, p__7485)
                                    }else {
                                      return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481, o__7483, p__7485)
                                    }
                                  }else {
                                    var q__7487 = cljs.core._first.call(null, args__7486);
                                    var args__7488 = cljs.core._rest.call(null, args__7486);
                                    if(argc === 17) {
                                      if(f__7465.cljs$lang$arity$17) {
                                        return f__7465.cljs$lang$arity$17(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481, o__7483, p__7485, q__7487)
                                      }else {
                                        return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481, o__7483, p__7485, q__7487)
                                      }
                                    }else {
                                      var r__7489 = cljs.core._first.call(null, args__7488);
                                      var args__7490 = cljs.core._rest.call(null, args__7488);
                                      if(argc === 18) {
                                        if(f__7465.cljs$lang$arity$18) {
                                          return f__7465.cljs$lang$arity$18(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481, o__7483, p__7485, q__7487, r__7489)
                                        }else {
                                          return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481, o__7483, p__7485, q__7487, r__7489)
                                        }
                                      }else {
                                        var s__7491 = cljs.core._first.call(null, args__7490);
                                        var args__7492 = cljs.core._rest.call(null, args__7490);
                                        if(argc === 19) {
                                          if(f__7465.cljs$lang$arity$19) {
                                            return f__7465.cljs$lang$arity$19(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481, o__7483, p__7485, q__7487, r__7489, s__7491)
                                          }else {
                                            return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481, o__7483, p__7485, q__7487, r__7489, s__7491)
                                          }
                                        }else {
                                          var t__7493 = cljs.core._first.call(null, args__7492);
                                          var args__7494 = cljs.core._rest.call(null, args__7492);
                                          if(argc === 20) {
                                            if(f__7465.cljs$lang$arity$20) {
                                              return f__7465.cljs$lang$arity$20(a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481, o__7483, p__7485, q__7487, r__7489, s__7491, t__7493)
                                            }else {
                                              return f__7465.call(null, a__7455, b__7457, c__7459, d__7461, e__7463, f__7465, g__7467, h__7469, i__7471, j__7473, k__7475, l__7477, m__7479, n__7481, o__7483, p__7485, q__7487, r__7489, s__7491, t__7493)
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
    var fixed_arity__7509 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7510 = cljs.core.bounded_count.call(null, args, fixed_arity__7509 + 1);
      if(bc__7510 <= fixed_arity__7509) {
        return cljs.core.apply_to.call(null, f, bc__7510, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7511 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7512 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7513 = cljs.core.bounded_count.call(null, arglist__7511, fixed_arity__7512 + 1);
      if(bc__7513 <= fixed_arity__7512) {
        return cljs.core.apply_to.call(null, f, bc__7513, arglist__7511)
      }else {
        return f.cljs$lang$applyTo(arglist__7511)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7511))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7514 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7515 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7516 = cljs.core.bounded_count.call(null, arglist__7514, fixed_arity__7515 + 1);
      if(bc__7516 <= fixed_arity__7515) {
        return cljs.core.apply_to.call(null, f, bc__7516, arglist__7514)
      }else {
        return f.cljs$lang$applyTo(arglist__7514)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7514))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7517 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7518 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7519 = cljs.core.bounded_count.call(null, arglist__7517, fixed_arity__7518 + 1);
      if(bc__7519 <= fixed_arity__7518) {
        return cljs.core.apply_to.call(null, f, bc__7519, arglist__7517)
      }else {
        return f.cljs$lang$applyTo(arglist__7517)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7517))
    }
  };
  var apply__6 = function() {
    var G__7523__delegate = function(f, a, b, c, d, args) {
      var arglist__7520 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7521 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7522 = cljs.core.bounded_count.call(null, arglist__7520, fixed_arity__7521 + 1);
        if(bc__7522 <= fixed_arity__7521) {
          return cljs.core.apply_to.call(null, f, bc__7522, arglist__7520)
        }else {
          return f.cljs$lang$applyTo(arglist__7520)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7520))
      }
    };
    var G__7523 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7523__delegate.call(this, f, a, b, c, d, args)
    };
    G__7523.cljs$lang$maxFixedArity = 5;
    G__7523.cljs$lang$applyTo = function(arglist__7524) {
      var f = cljs.core.first(arglist__7524);
      var a = cljs.core.first(cljs.core.next(arglist__7524));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7524)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7524))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7524)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7524)))));
      return G__7523__delegate(f, a, b, c, d, args)
    };
    G__7523.cljs$lang$arity$variadic = G__7523__delegate;
    return G__7523
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
  vary_meta.cljs$lang$applyTo = function(arglist__7525) {
    var obj = cljs.core.first(arglist__7525);
    var f = cljs.core.first(cljs.core.next(arglist__7525));
    var args = cljs.core.rest(cljs.core.next(arglist__7525));
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
    var G__7526__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7526 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7526__delegate.call(this, x, y, more)
    };
    G__7526.cljs$lang$maxFixedArity = 2;
    G__7526.cljs$lang$applyTo = function(arglist__7527) {
      var x = cljs.core.first(arglist__7527);
      var y = cljs.core.first(cljs.core.next(arglist__7527));
      var more = cljs.core.rest(cljs.core.next(arglist__7527));
      return G__7526__delegate(x, y, more)
    };
    G__7526.cljs$lang$arity$variadic = G__7526__delegate;
    return G__7526
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
        var G__7528 = pred;
        var G__7529 = cljs.core.next.call(null, coll);
        pred = G__7528;
        coll = G__7529;
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
      var or__3824__auto____7531 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7531)) {
        return or__3824__auto____7531
      }else {
        var G__7532 = pred;
        var G__7533 = cljs.core.next.call(null, coll);
        pred = G__7532;
        coll = G__7533;
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
    var G__7534 = null;
    var G__7534__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7534__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7534__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7534__3 = function() {
      var G__7535__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7535 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7535__delegate.call(this, x, y, zs)
      };
      G__7535.cljs$lang$maxFixedArity = 2;
      G__7535.cljs$lang$applyTo = function(arglist__7536) {
        var x = cljs.core.first(arglist__7536);
        var y = cljs.core.first(cljs.core.next(arglist__7536));
        var zs = cljs.core.rest(cljs.core.next(arglist__7536));
        return G__7535__delegate(x, y, zs)
      };
      G__7535.cljs$lang$arity$variadic = G__7535__delegate;
      return G__7535
    }();
    G__7534 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7534__0.call(this);
        case 1:
          return G__7534__1.call(this, x);
        case 2:
          return G__7534__2.call(this, x, y);
        default:
          return G__7534__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7534.cljs$lang$maxFixedArity = 2;
    G__7534.cljs$lang$applyTo = G__7534__3.cljs$lang$applyTo;
    return G__7534
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7537__delegate = function(args) {
      return x
    };
    var G__7537 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7537__delegate.call(this, args)
    };
    G__7537.cljs$lang$maxFixedArity = 0;
    G__7537.cljs$lang$applyTo = function(arglist__7538) {
      var args = cljs.core.seq(arglist__7538);
      return G__7537__delegate(args)
    };
    G__7537.cljs$lang$arity$variadic = G__7537__delegate;
    return G__7537
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
      var G__7545 = null;
      var G__7545__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7545__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7545__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7545__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7545__4 = function() {
        var G__7546__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7546 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7546__delegate.call(this, x, y, z, args)
        };
        G__7546.cljs$lang$maxFixedArity = 3;
        G__7546.cljs$lang$applyTo = function(arglist__7547) {
          var x = cljs.core.first(arglist__7547);
          var y = cljs.core.first(cljs.core.next(arglist__7547));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7547)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7547)));
          return G__7546__delegate(x, y, z, args)
        };
        G__7546.cljs$lang$arity$variadic = G__7546__delegate;
        return G__7546
      }();
      G__7545 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7545__0.call(this);
          case 1:
            return G__7545__1.call(this, x);
          case 2:
            return G__7545__2.call(this, x, y);
          case 3:
            return G__7545__3.call(this, x, y, z);
          default:
            return G__7545__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7545.cljs$lang$maxFixedArity = 3;
      G__7545.cljs$lang$applyTo = G__7545__4.cljs$lang$applyTo;
      return G__7545
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7548 = null;
      var G__7548__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7548__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7548__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7548__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7548__4 = function() {
        var G__7549__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7549 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7549__delegate.call(this, x, y, z, args)
        };
        G__7549.cljs$lang$maxFixedArity = 3;
        G__7549.cljs$lang$applyTo = function(arglist__7550) {
          var x = cljs.core.first(arglist__7550);
          var y = cljs.core.first(cljs.core.next(arglist__7550));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7550)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7550)));
          return G__7549__delegate(x, y, z, args)
        };
        G__7549.cljs$lang$arity$variadic = G__7549__delegate;
        return G__7549
      }();
      G__7548 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7548__0.call(this);
          case 1:
            return G__7548__1.call(this, x);
          case 2:
            return G__7548__2.call(this, x, y);
          case 3:
            return G__7548__3.call(this, x, y, z);
          default:
            return G__7548__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7548.cljs$lang$maxFixedArity = 3;
      G__7548.cljs$lang$applyTo = G__7548__4.cljs$lang$applyTo;
      return G__7548
    }()
  };
  var comp__4 = function() {
    var G__7551__delegate = function(f1, f2, f3, fs) {
      var fs__7542 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7552__delegate = function(args) {
          var ret__7543 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7542), args);
          var fs__7544 = cljs.core.next.call(null, fs__7542);
          while(true) {
            if(fs__7544) {
              var G__7553 = cljs.core.first.call(null, fs__7544).call(null, ret__7543);
              var G__7554 = cljs.core.next.call(null, fs__7544);
              ret__7543 = G__7553;
              fs__7544 = G__7554;
              continue
            }else {
              return ret__7543
            }
            break
          }
        };
        var G__7552 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7552__delegate.call(this, args)
        };
        G__7552.cljs$lang$maxFixedArity = 0;
        G__7552.cljs$lang$applyTo = function(arglist__7555) {
          var args = cljs.core.seq(arglist__7555);
          return G__7552__delegate(args)
        };
        G__7552.cljs$lang$arity$variadic = G__7552__delegate;
        return G__7552
      }()
    };
    var G__7551 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7551__delegate.call(this, f1, f2, f3, fs)
    };
    G__7551.cljs$lang$maxFixedArity = 3;
    G__7551.cljs$lang$applyTo = function(arglist__7556) {
      var f1 = cljs.core.first(arglist__7556);
      var f2 = cljs.core.first(cljs.core.next(arglist__7556));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7556)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7556)));
      return G__7551__delegate(f1, f2, f3, fs)
    };
    G__7551.cljs$lang$arity$variadic = G__7551__delegate;
    return G__7551
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
      var G__7557__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7557 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7557__delegate.call(this, args)
      };
      G__7557.cljs$lang$maxFixedArity = 0;
      G__7557.cljs$lang$applyTo = function(arglist__7558) {
        var args = cljs.core.seq(arglist__7558);
        return G__7557__delegate(args)
      };
      G__7557.cljs$lang$arity$variadic = G__7557__delegate;
      return G__7557
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7559__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7559 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7559__delegate.call(this, args)
      };
      G__7559.cljs$lang$maxFixedArity = 0;
      G__7559.cljs$lang$applyTo = function(arglist__7560) {
        var args = cljs.core.seq(arglist__7560);
        return G__7559__delegate(args)
      };
      G__7559.cljs$lang$arity$variadic = G__7559__delegate;
      return G__7559
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7561__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7561 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7561__delegate.call(this, args)
      };
      G__7561.cljs$lang$maxFixedArity = 0;
      G__7561.cljs$lang$applyTo = function(arglist__7562) {
        var args = cljs.core.seq(arglist__7562);
        return G__7561__delegate(args)
      };
      G__7561.cljs$lang$arity$variadic = G__7561__delegate;
      return G__7561
    }()
  };
  var partial__5 = function() {
    var G__7563__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7564__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7564 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7564__delegate.call(this, args)
        };
        G__7564.cljs$lang$maxFixedArity = 0;
        G__7564.cljs$lang$applyTo = function(arglist__7565) {
          var args = cljs.core.seq(arglist__7565);
          return G__7564__delegate(args)
        };
        G__7564.cljs$lang$arity$variadic = G__7564__delegate;
        return G__7564
      }()
    };
    var G__7563 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7563__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7563.cljs$lang$maxFixedArity = 4;
    G__7563.cljs$lang$applyTo = function(arglist__7566) {
      var f = cljs.core.first(arglist__7566);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7566));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7566)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7566))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7566))));
      return G__7563__delegate(f, arg1, arg2, arg3, more)
    };
    G__7563.cljs$lang$arity$variadic = G__7563__delegate;
    return G__7563
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
      var G__7567 = null;
      var G__7567__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7567__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7567__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7567__4 = function() {
        var G__7568__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7568 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7568__delegate.call(this, a, b, c, ds)
        };
        G__7568.cljs$lang$maxFixedArity = 3;
        G__7568.cljs$lang$applyTo = function(arglist__7569) {
          var a = cljs.core.first(arglist__7569);
          var b = cljs.core.first(cljs.core.next(arglist__7569));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7569)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7569)));
          return G__7568__delegate(a, b, c, ds)
        };
        G__7568.cljs$lang$arity$variadic = G__7568__delegate;
        return G__7568
      }();
      G__7567 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7567__1.call(this, a);
          case 2:
            return G__7567__2.call(this, a, b);
          case 3:
            return G__7567__3.call(this, a, b, c);
          default:
            return G__7567__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7567.cljs$lang$maxFixedArity = 3;
      G__7567.cljs$lang$applyTo = G__7567__4.cljs$lang$applyTo;
      return G__7567
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7570 = null;
      var G__7570__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7570__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7570__4 = function() {
        var G__7571__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7571 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7571__delegate.call(this, a, b, c, ds)
        };
        G__7571.cljs$lang$maxFixedArity = 3;
        G__7571.cljs$lang$applyTo = function(arglist__7572) {
          var a = cljs.core.first(arglist__7572);
          var b = cljs.core.first(cljs.core.next(arglist__7572));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7572)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7572)));
          return G__7571__delegate(a, b, c, ds)
        };
        G__7571.cljs$lang$arity$variadic = G__7571__delegate;
        return G__7571
      }();
      G__7570 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7570__2.call(this, a, b);
          case 3:
            return G__7570__3.call(this, a, b, c);
          default:
            return G__7570__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7570.cljs$lang$maxFixedArity = 3;
      G__7570.cljs$lang$applyTo = G__7570__4.cljs$lang$applyTo;
      return G__7570
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7573 = null;
      var G__7573__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7573__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7573__4 = function() {
        var G__7574__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7574 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7574__delegate.call(this, a, b, c, ds)
        };
        G__7574.cljs$lang$maxFixedArity = 3;
        G__7574.cljs$lang$applyTo = function(arglist__7575) {
          var a = cljs.core.first(arglist__7575);
          var b = cljs.core.first(cljs.core.next(arglist__7575));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7575)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7575)));
          return G__7574__delegate(a, b, c, ds)
        };
        G__7574.cljs$lang$arity$variadic = G__7574__delegate;
        return G__7574
      }();
      G__7573 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7573__2.call(this, a, b);
          case 3:
            return G__7573__3.call(this, a, b, c);
          default:
            return G__7573__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7573.cljs$lang$maxFixedArity = 3;
      G__7573.cljs$lang$applyTo = G__7573__4.cljs$lang$applyTo;
      return G__7573
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
  var mapi__7591 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7599 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7599) {
        var s__7600 = temp__3974__auto____7599;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7600)) {
          var c__7601 = cljs.core.chunk_first.call(null, s__7600);
          var size__7602 = cljs.core.count.call(null, c__7601);
          var b__7603 = cljs.core.chunk_buffer.call(null, size__7602);
          var n__2527__auto____7604 = size__7602;
          var i__7605 = 0;
          while(true) {
            if(i__7605 < n__2527__auto____7604) {
              cljs.core.chunk_append.call(null, b__7603, f.call(null, idx + i__7605, cljs.core._nth.call(null, c__7601, i__7605)));
              var G__7606 = i__7605 + 1;
              i__7605 = G__7606;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7603), mapi.call(null, idx + size__7602, cljs.core.chunk_rest.call(null, s__7600)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7600)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7600)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7591.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7616 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____7616) {
      var s__7617 = temp__3974__auto____7616;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7617)) {
        var c__7618 = cljs.core.chunk_first.call(null, s__7617);
        var size__7619 = cljs.core.count.call(null, c__7618);
        var b__7620 = cljs.core.chunk_buffer.call(null, size__7619);
        var n__2527__auto____7621 = size__7619;
        var i__7622 = 0;
        while(true) {
          if(i__7622 < n__2527__auto____7621) {
            var x__7623 = f.call(null, cljs.core._nth.call(null, c__7618, i__7622));
            if(x__7623 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7620, x__7623)
            }
            var G__7625 = i__7622 + 1;
            i__7622 = G__7625;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7620), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7617)))
      }else {
        var x__7624 = f.call(null, cljs.core.first.call(null, s__7617));
        if(x__7624 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7617))
        }else {
          return cljs.core.cons.call(null, x__7624, keep.call(null, f, cljs.core.rest.call(null, s__7617)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7651 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7661 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7661) {
        var s__7662 = temp__3974__auto____7661;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7662)) {
          var c__7663 = cljs.core.chunk_first.call(null, s__7662);
          var size__7664 = cljs.core.count.call(null, c__7663);
          var b__7665 = cljs.core.chunk_buffer.call(null, size__7664);
          var n__2527__auto____7666 = size__7664;
          var i__7667 = 0;
          while(true) {
            if(i__7667 < n__2527__auto____7666) {
              var x__7668 = f.call(null, idx + i__7667, cljs.core._nth.call(null, c__7663, i__7667));
              if(x__7668 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7665, x__7668)
              }
              var G__7670 = i__7667 + 1;
              i__7667 = G__7670;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7665), keepi.call(null, idx + size__7664, cljs.core.chunk_rest.call(null, s__7662)))
        }else {
          var x__7669 = f.call(null, idx, cljs.core.first.call(null, s__7662));
          if(x__7669 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7662))
          }else {
            return cljs.core.cons.call(null, x__7669, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7662)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7651.call(null, 0, coll)
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
          var and__3822__auto____7756 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7756)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____7756
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7757 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7757)) {
            var and__3822__auto____7758 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7758)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____7758
            }
          }else {
            return and__3822__auto____7757
          }
        }())
      };
      var ep1__4 = function() {
        var G__7827__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7759 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7759)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____7759
            }
          }())
        };
        var G__7827 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7827__delegate.call(this, x, y, z, args)
        };
        G__7827.cljs$lang$maxFixedArity = 3;
        G__7827.cljs$lang$applyTo = function(arglist__7828) {
          var x = cljs.core.first(arglist__7828);
          var y = cljs.core.first(cljs.core.next(arglist__7828));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7828)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7828)));
          return G__7827__delegate(x, y, z, args)
        };
        G__7827.cljs$lang$arity$variadic = G__7827__delegate;
        return G__7827
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
          var and__3822__auto____7771 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7771)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____7771
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7772 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7772)) {
            var and__3822__auto____7773 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7773)) {
              var and__3822__auto____7774 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7774)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____7774
              }
            }else {
              return and__3822__auto____7773
            }
          }else {
            return and__3822__auto____7772
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7775 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7775)) {
            var and__3822__auto____7776 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7776)) {
              var and__3822__auto____7777 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7777)) {
                var and__3822__auto____7778 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7778)) {
                  var and__3822__auto____7779 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7779)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____7779
                  }
                }else {
                  return and__3822__auto____7778
                }
              }else {
                return and__3822__auto____7777
              }
            }else {
              return and__3822__auto____7776
            }
          }else {
            return and__3822__auto____7775
          }
        }())
      };
      var ep2__4 = function() {
        var G__7829__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7780 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7780)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7626_SHARP_) {
                var and__3822__auto____7781 = p1.call(null, p1__7626_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7781)) {
                  return p2.call(null, p1__7626_SHARP_)
                }else {
                  return and__3822__auto____7781
                }
              }, args)
            }else {
              return and__3822__auto____7780
            }
          }())
        };
        var G__7829 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7829__delegate.call(this, x, y, z, args)
        };
        G__7829.cljs$lang$maxFixedArity = 3;
        G__7829.cljs$lang$applyTo = function(arglist__7830) {
          var x = cljs.core.first(arglist__7830);
          var y = cljs.core.first(cljs.core.next(arglist__7830));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7830)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7830)));
          return G__7829__delegate(x, y, z, args)
        };
        G__7829.cljs$lang$arity$variadic = G__7829__delegate;
        return G__7829
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
          var and__3822__auto____7800 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7800)) {
            var and__3822__auto____7801 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7801)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____7801
            }
          }else {
            return and__3822__auto____7800
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7802 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7802)) {
            var and__3822__auto____7803 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7803)) {
              var and__3822__auto____7804 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7804)) {
                var and__3822__auto____7805 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7805)) {
                  var and__3822__auto____7806 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7806)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____7806
                  }
                }else {
                  return and__3822__auto____7805
                }
              }else {
                return and__3822__auto____7804
              }
            }else {
              return and__3822__auto____7803
            }
          }else {
            return and__3822__auto____7802
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7807 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7807)) {
            var and__3822__auto____7808 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7808)) {
              var and__3822__auto____7809 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7809)) {
                var and__3822__auto____7810 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7810)) {
                  var and__3822__auto____7811 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7811)) {
                    var and__3822__auto____7812 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7812)) {
                      var and__3822__auto____7813 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7813)) {
                        var and__3822__auto____7814 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7814)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____7814
                        }
                      }else {
                        return and__3822__auto____7813
                      }
                    }else {
                      return and__3822__auto____7812
                    }
                  }else {
                    return and__3822__auto____7811
                  }
                }else {
                  return and__3822__auto____7810
                }
              }else {
                return and__3822__auto____7809
              }
            }else {
              return and__3822__auto____7808
            }
          }else {
            return and__3822__auto____7807
          }
        }())
      };
      var ep3__4 = function() {
        var G__7831__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7815 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7815)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7627_SHARP_) {
                var and__3822__auto____7816 = p1.call(null, p1__7627_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7816)) {
                  var and__3822__auto____7817 = p2.call(null, p1__7627_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7817)) {
                    return p3.call(null, p1__7627_SHARP_)
                  }else {
                    return and__3822__auto____7817
                  }
                }else {
                  return and__3822__auto____7816
                }
              }, args)
            }else {
              return and__3822__auto____7815
            }
          }())
        };
        var G__7831 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7831__delegate.call(this, x, y, z, args)
        };
        G__7831.cljs$lang$maxFixedArity = 3;
        G__7831.cljs$lang$applyTo = function(arglist__7832) {
          var x = cljs.core.first(arglist__7832);
          var y = cljs.core.first(cljs.core.next(arglist__7832));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7832)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7832)));
          return G__7831__delegate(x, y, z, args)
        };
        G__7831.cljs$lang$arity$variadic = G__7831__delegate;
        return G__7831
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
    var G__7833__delegate = function(p1, p2, p3, ps) {
      var ps__7818 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7628_SHARP_) {
            return p1__7628_SHARP_.call(null, x)
          }, ps__7818)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7629_SHARP_) {
            var and__3822__auto____7823 = p1__7629_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7823)) {
              return p1__7629_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7823
            }
          }, ps__7818)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7630_SHARP_) {
            var and__3822__auto____7824 = p1__7630_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7824)) {
              var and__3822__auto____7825 = p1__7630_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7825)) {
                return p1__7630_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7825
              }
            }else {
              return and__3822__auto____7824
            }
          }, ps__7818)
        };
        var epn__4 = function() {
          var G__7834__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____7826 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____7826)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7631_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7631_SHARP_, args)
                }, ps__7818)
              }else {
                return and__3822__auto____7826
              }
            }())
          };
          var G__7834 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7834__delegate.call(this, x, y, z, args)
          };
          G__7834.cljs$lang$maxFixedArity = 3;
          G__7834.cljs$lang$applyTo = function(arglist__7835) {
            var x = cljs.core.first(arglist__7835);
            var y = cljs.core.first(cljs.core.next(arglist__7835));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7835)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7835)));
            return G__7834__delegate(x, y, z, args)
          };
          G__7834.cljs$lang$arity$variadic = G__7834__delegate;
          return G__7834
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
    var G__7833 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7833__delegate.call(this, p1, p2, p3, ps)
    };
    G__7833.cljs$lang$maxFixedArity = 3;
    G__7833.cljs$lang$applyTo = function(arglist__7836) {
      var p1 = cljs.core.first(arglist__7836);
      var p2 = cljs.core.first(cljs.core.next(arglist__7836));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7836)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7836)));
      return G__7833__delegate(p1, p2, p3, ps)
    };
    G__7833.cljs$lang$arity$variadic = G__7833__delegate;
    return G__7833
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
        var or__3824__auto____7917 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7917)) {
          return or__3824__auto____7917
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____7918 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7918)) {
          return or__3824__auto____7918
        }else {
          var or__3824__auto____7919 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7919)) {
            return or__3824__auto____7919
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__7988__delegate = function(x, y, z, args) {
          var or__3824__auto____7920 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7920)) {
            return or__3824__auto____7920
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__7988 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7988__delegate.call(this, x, y, z, args)
        };
        G__7988.cljs$lang$maxFixedArity = 3;
        G__7988.cljs$lang$applyTo = function(arglist__7989) {
          var x = cljs.core.first(arglist__7989);
          var y = cljs.core.first(cljs.core.next(arglist__7989));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7989)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7989)));
          return G__7988__delegate(x, y, z, args)
        };
        G__7988.cljs$lang$arity$variadic = G__7988__delegate;
        return G__7988
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
        var or__3824__auto____7932 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7932)) {
          return or__3824__auto____7932
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____7933 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7933)) {
          return or__3824__auto____7933
        }else {
          var or__3824__auto____7934 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7934)) {
            return or__3824__auto____7934
          }else {
            var or__3824__auto____7935 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7935)) {
              return or__3824__auto____7935
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____7936 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7936)) {
          return or__3824__auto____7936
        }else {
          var or__3824__auto____7937 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7937)) {
            return or__3824__auto____7937
          }else {
            var or__3824__auto____7938 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____7938)) {
              return or__3824__auto____7938
            }else {
              var or__3824__auto____7939 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____7939)) {
                return or__3824__auto____7939
              }else {
                var or__3824__auto____7940 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7940)) {
                  return or__3824__auto____7940
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__7990__delegate = function(x, y, z, args) {
          var or__3824__auto____7941 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7941)) {
            return or__3824__auto____7941
          }else {
            return cljs.core.some.call(null, function(p1__7671_SHARP_) {
              var or__3824__auto____7942 = p1.call(null, p1__7671_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7942)) {
                return or__3824__auto____7942
              }else {
                return p2.call(null, p1__7671_SHARP_)
              }
            }, args)
          }
        };
        var G__7990 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7990__delegate.call(this, x, y, z, args)
        };
        G__7990.cljs$lang$maxFixedArity = 3;
        G__7990.cljs$lang$applyTo = function(arglist__7991) {
          var x = cljs.core.first(arglist__7991);
          var y = cljs.core.first(cljs.core.next(arglist__7991));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7991)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7991)));
          return G__7990__delegate(x, y, z, args)
        };
        G__7990.cljs$lang$arity$variadic = G__7990__delegate;
        return G__7990
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
        var or__3824__auto____7961 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7961)) {
          return or__3824__auto____7961
        }else {
          var or__3824__auto____7962 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7962)) {
            return or__3824__auto____7962
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____7963 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7963)) {
          return or__3824__auto____7963
        }else {
          var or__3824__auto____7964 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7964)) {
            return or__3824__auto____7964
          }else {
            var or__3824__auto____7965 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7965)) {
              return or__3824__auto____7965
            }else {
              var or__3824__auto____7966 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7966)) {
                return or__3824__auto____7966
              }else {
                var or__3824__auto____7967 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7967)) {
                  return or__3824__auto____7967
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____7968 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7968)) {
          return or__3824__auto____7968
        }else {
          var or__3824__auto____7969 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7969)) {
            return or__3824__auto____7969
          }else {
            var or__3824__auto____7970 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7970)) {
              return or__3824__auto____7970
            }else {
              var or__3824__auto____7971 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7971)) {
                return or__3824__auto____7971
              }else {
                var or__3824__auto____7972 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7972)) {
                  return or__3824__auto____7972
                }else {
                  var or__3824__auto____7973 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____7973)) {
                    return or__3824__auto____7973
                  }else {
                    var or__3824__auto____7974 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____7974)) {
                      return or__3824__auto____7974
                    }else {
                      var or__3824__auto____7975 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____7975)) {
                        return or__3824__auto____7975
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
        var G__7992__delegate = function(x, y, z, args) {
          var or__3824__auto____7976 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7976)) {
            return or__3824__auto____7976
          }else {
            return cljs.core.some.call(null, function(p1__7672_SHARP_) {
              var or__3824__auto____7977 = p1.call(null, p1__7672_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7977)) {
                return or__3824__auto____7977
              }else {
                var or__3824__auto____7978 = p2.call(null, p1__7672_SHARP_);
                if(cljs.core.truth_(or__3824__auto____7978)) {
                  return or__3824__auto____7978
                }else {
                  return p3.call(null, p1__7672_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__7992 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7992__delegate.call(this, x, y, z, args)
        };
        G__7992.cljs$lang$maxFixedArity = 3;
        G__7992.cljs$lang$applyTo = function(arglist__7993) {
          var x = cljs.core.first(arglist__7993);
          var y = cljs.core.first(cljs.core.next(arglist__7993));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7993)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7993)));
          return G__7992__delegate(x, y, z, args)
        };
        G__7992.cljs$lang$arity$variadic = G__7992__delegate;
        return G__7992
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
    var G__7994__delegate = function(p1, p2, p3, ps) {
      var ps__7979 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7673_SHARP_) {
            return p1__7673_SHARP_.call(null, x)
          }, ps__7979)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7674_SHARP_) {
            var or__3824__auto____7984 = p1__7674_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7984)) {
              return or__3824__auto____7984
            }else {
              return p1__7674_SHARP_.call(null, y)
            }
          }, ps__7979)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7675_SHARP_) {
            var or__3824__auto____7985 = p1__7675_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7985)) {
              return or__3824__auto____7985
            }else {
              var or__3824__auto____7986 = p1__7675_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7986)) {
                return or__3824__auto____7986
              }else {
                return p1__7675_SHARP_.call(null, z)
              }
            }
          }, ps__7979)
        };
        var spn__4 = function() {
          var G__7995__delegate = function(x, y, z, args) {
            var or__3824__auto____7987 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____7987)) {
              return or__3824__auto____7987
            }else {
              return cljs.core.some.call(null, function(p1__7676_SHARP_) {
                return cljs.core.some.call(null, p1__7676_SHARP_, args)
              }, ps__7979)
            }
          };
          var G__7995 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7995__delegate.call(this, x, y, z, args)
          };
          G__7995.cljs$lang$maxFixedArity = 3;
          G__7995.cljs$lang$applyTo = function(arglist__7996) {
            var x = cljs.core.first(arglist__7996);
            var y = cljs.core.first(cljs.core.next(arglist__7996));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7996)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7996)));
            return G__7995__delegate(x, y, z, args)
          };
          G__7995.cljs$lang$arity$variadic = G__7995__delegate;
          return G__7995
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
    var G__7994 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7994__delegate.call(this, p1, p2, p3, ps)
    };
    G__7994.cljs$lang$maxFixedArity = 3;
    G__7994.cljs$lang$applyTo = function(arglist__7997) {
      var p1 = cljs.core.first(arglist__7997);
      var p2 = cljs.core.first(cljs.core.next(arglist__7997));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7997)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7997)));
      return G__7994__delegate(p1, p2, p3, ps)
    };
    G__7994.cljs$lang$arity$variadic = G__7994__delegate;
    return G__7994
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
      var temp__3974__auto____8016 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8016) {
        var s__8017 = temp__3974__auto____8016;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8017)) {
          var c__8018 = cljs.core.chunk_first.call(null, s__8017);
          var size__8019 = cljs.core.count.call(null, c__8018);
          var b__8020 = cljs.core.chunk_buffer.call(null, size__8019);
          var n__2527__auto____8021 = size__8019;
          var i__8022 = 0;
          while(true) {
            if(i__8022 < n__2527__auto____8021) {
              cljs.core.chunk_append.call(null, b__8020, f.call(null, cljs.core._nth.call(null, c__8018, i__8022)));
              var G__8034 = i__8022 + 1;
              i__8022 = G__8034;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8020), map.call(null, f, cljs.core.chunk_rest.call(null, s__8017)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8017)), map.call(null, f, cljs.core.rest.call(null, s__8017)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8023 = cljs.core.seq.call(null, c1);
      var s2__8024 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8025 = s1__8023;
        if(and__3822__auto____8025) {
          return s2__8024
        }else {
          return and__3822__auto____8025
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8023), cljs.core.first.call(null, s2__8024)), map.call(null, f, cljs.core.rest.call(null, s1__8023), cljs.core.rest.call(null, s2__8024)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8026 = cljs.core.seq.call(null, c1);
      var s2__8027 = cljs.core.seq.call(null, c2);
      var s3__8028 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8029 = s1__8026;
        if(and__3822__auto____8029) {
          var and__3822__auto____8030 = s2__8027;
          if(and__3822__auto____8030) {
            return s3__8028
          }else {
            return and__3822__auto____8030
          }
        }else {
          return and__3822__auto____8029
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8026), cljs.core.first.call(null, s2__8027), cljs.core.first.call(null, s3__8028)), map.call(null, f, cljs.core.rest.call(null, s1__8026), cljs.core.rest.call(null, s2__8027), cljs.core.rest.call(null, s3__8028)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8035__delegate = function(f, c1, c2, c3, colls) {
      var step__8033 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8032 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8032)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8032), step.call(null, map.call(null, cljs.core.rest, ss__8032)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7837_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7837_SHARP_)
      }, step__8033.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8035 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8035__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8035.cljs$lang$maxFixedArity = 4;
    G__8035.cljs$lang$applyTo = function(arglist__8036) {
      var f = cljs.core.first(arglist__8036);
      var c1 = cljs.core.first(cljs.core.next(arglist__8036));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8036)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8036))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8036))));
      return G__8035__delegate(f, c1, c2, c3, colls)
    };
    G__8035.cljs$lang$arity$variadic = G__8035__delegate;
    return G__8035
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
      var temp__3974__auto____8039 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8039) {
        var s__8040 = temp__3974__auto____8039;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8040), take.call(null, n - 1, cljs.core.rest.call(null, s__8040)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8046 = function(n, coll) {
    while(true) {
      var s__8044 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8045 = n > 0;
        if(and__3822__auto____8045) {
          return s__8044
        }else {
          return and__3822__auto____8045
        }
      }())) {
        var G__8047 = n - 1;
        var G__8048 = cljs.core.rest.call(null, s__8044);
        n = G__8047;
        coll = G__8048;
        continue
      }else {
        return s__8044
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8046.call(null, n, coll)
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
  var s__8051 = cljs.core.seq.call(null, coll);
  var lead__8052 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8052) {
      var G__8053 = cljs.core.next.call(null, s__8051);
      var G__8054 = cljs.core.next.call(null, lead__8052);
      s__8051 = G__8053;
      lead__8052 = G__8054;
      continue
    }else {
      return s__8051
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8060 = function(pred, coll) {
    while(true) {
      var s__8058 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8059 = s__8058;
        if(and__3822__auto____8059) {
          return pred.call(null, cljs.core.first.call(null, s__8058))
        }else {
          return and__3822__auto____8059
        }
      }())) {
        var G__8061 = pred;
        var G__8062 = cljs.core.rest.call(null, s__8058);
        pred = G__8061;
        coll = G__8062;
        continue
      }else {
        return s__8058
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8060.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8065 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8065) {
      var s__8066 = temp__3974__auto____8065;
      return cljs.core.concat.call(null, s__8066, cycle.call(null, s__8066))
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
      var s1__8071 = cljs.core.seq.call(null, c1);
      var s2__8072 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8073 = s1__8071;
        if(and__3822__auto____8073) {
          return s2__8072
        }else {
          return and__3822__auto____8073
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8071), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8072), interleave.call(null, cljs.core.rest.call(null, s1__8071), cljs.core.rest.call(null, s2__8072))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8075__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8074 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8074)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8074), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8074)))
        }else {
          return null
        }
      }, null)
    };
    var G__8075 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8075__delegate.call(this, c1, c2, colls)
    };
    G__8075.cljs$lang$maxFixedArity = 2;
    G__8075.cljs$lang$applyTo = function(arglist__8076) {
      var c1 = cljs.core.first(arglist__8076);
      var c2 = cljs.core.first(cljs.core.next(arglist__8076));
      var colls = cljs.core.rest(cljs.core.next(arglist__8076));
      return G__8075__delegate(c1, c2, colls)
    };
    G__8075.cljs$lang$arity$variadic = G__8075__delegate;
    return G__8075
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
  var cat__8086 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8084 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8084) {
        var coll__8085 = temp__3971__auto____8084;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8085), cat.call(null, cljs.core.rest.call(null, coll__8085), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8086.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8087__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8087 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8087__delegate.call(this, f, coll, colls)
    };
    G__8087.cljs$lang$maxFixedArity = 2;
    G__8087.cljs$lang$applyTo = function(arglist__8088) {
      var f = cljs.core.first(arglist__8088);
      var coll = cljs.core.first(cljs.core.next(arglist__8088));
      var colls = cljs.core.rest(cljs.core.next(arglist__8088));
      return G__8087__delegate(f, coll, colls)
    };
    G__8087.cljs$lang$arity$variadic = G__8087__delegate;
    return G__8087
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
    var temp__3974__auto____8098 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8098) {
      var s__8099 = temp__3974__auto____8098;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8099)) {
        var c__8100 = cljs.core.chunk_first.call(null, s__8099);
        var size__8101 = cljs.core.count.call(null, c__8100);
        var b__8102 = cljs.core.chunk_buffer.call(null, size__8101);
        var n__2527__auto____8103 = size__8101;
        var i__8104 = 0;
        while(true) {
          if(i__8104 < n__2527__auto____8103) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8100, i__8104)))) {
              cljs.core.chunk_append.call(null, b__8102, cljs.core._nth.call(null, c__8100, i__8104))
            }else {
            }
            var G__8107 = i__8104 + 1;
            i__8104 = G__8107;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8102), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8099)))
      }else {
        var f__8105 = cljs.core.first.call(null, s__8099);
        var r__8106 = cljs.core.rest.call(null, s__8099);
        if(cljs.core.truth_(pred.call(null, f__8105))) {
          return cljs.core.cons.call(null, f__8105, filter.call(null, pred, r__8106))
        }else {
          return filter.call(null, pred, r__8106)
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
  var walk__8110 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8110.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8108_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8108_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8114__8115 = to;
    if(G__8114__8115) {
      if(function() {
        var or__3824__auto____8116 = G__8114__8115.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8116) {
          return or__3824__auto____8116
        }else {
          return G__8114__8115.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8114__8115.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8114__8115)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8114__8115)
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
    var G__8117__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8117 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8117__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8117.cljs$lang$maxFixedArity = 4;
    G__8117.cljs$lang$applyTo = function(arglist__8118) {
      var f = cljs.core.first(arglist__8118);
      var c1 = cljs.core.first(cljs.core.next(arglist__8118));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8118)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8118))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8118))));
      return G__8117__delegate(f, c1, c2, c3, colls)
    };
    G__8117.cljs$lang$arity$variadic = G__8117__delegate;
    return G__8117
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
      var temp__3974__auto____8125 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8125) {
        var s__8126 = temp__3974__auto____8125;
        var p__8127 = cljs.core.take.call(null, n, s__8126);
        if(n === cljs.core.count.call(null, p__8127)) {
          return cljs.core.cons.call(null, p__8127, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8126)))
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
      var temp__3974__auto____8128 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8128) {
        var s__8129 = temp__3974__auto____8128;
        var p__8130 = cljs.core.take.call(null, n, s__8129);
        if(n === cljs.core.count.call(null, p__8130)) {
          return cljs.core.cons.call(null, p__8130, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8129)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8130, pad)))
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
    var sentinel__8135 = cljs.core.lookup_sentinel;
    var m__8136 = m;
    var ks__8137 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8137) {
        var m__8138 = cljs.core._lookup.call(null, m__8136, cljs.core.first.call(null, ks__8137), sentinel__8135);
        if(sentinel__8135 === m__8138) {
          return not_found
        }else {
          var G__8139 = sentinel__8135;
          var G__8140 = m__8138;
          var G__8141 = cljs.core.next.call(null, ks__8137);
          sentinel__8135 = G__8139;
          m__8136 = G__8140;
          ks__8137 = G__8141;
          continue
        }
      }else {
        return m__8136
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
cljs.core.assoc_in = function assoc_in(m, p__8142, v) {
  var vec__8147__8148 = p__8142;
  var k__8149 = cljs.core.nth.call(null, vec__8147__8148, 0, null);
  var ks__8150 = cljs.core.nthnext.call(null, vec__8147__8148, 1);
  if(cljs.core.truth_(ks__8150)) {
    return cljs.core.assoc.call(null, m, k__8149, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8149, null), ks__8150, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8149, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8151, f, args) {
    var vec__8156__8157 = p__8151;
    var k__8158 = cljs.core.nth.call(null, vec__8156__8157, 0, null);
    var ks__8159 = cljs.core.nthnext.call(null, vec__8156__8157, 1);
    if(cljs.core.truth_(ks__8159)) {
      return cljs.core.assoc.call(null, m, k__8158, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8158, null), ks__8159, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8158, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8158, null), args))
    }
  };
  var update_in = function(m, p__8151, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8151, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8160) {
    var m = cljs.core.first(arglist__8160);
    var p__8151 = cljs.core.first(cljs.core.next(arglist__8160));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8160)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8160)));
    return update_in__delegate(m, p__8151, f, args)
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
  var this__8163 = this;
  var h__2192__auto____8164 = this__8163.__hash;
  if(!(h__2192__auto____8164 == null)) {
    return h__2192__auto____8164
  }else {
    var h__2192__auto____8165 = cljs.core.hash_coll.call(null, coll);
    this__8163.__hash = h__2192__auto____8165;
    return h__2192__auto____8165
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8166 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8167 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8168 = this;
  var new_array__8169 = this__8168.array.slice();
  new_array__8169[k] = v;
  return new cljs.core.Vector(this__8168.meta, new_array__8169, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8200 = null;
  var G__8200__2 = function(this_sym8170, k) {
    var this__8172 = this;
    var this_sym8170__8173 = this;
    var coll__8174 = this_sym8170__8173;
    return coll__8174.cljs$core$ILookup$_lookup$arity$2(coll__8174, k)
  };
  var G__8200__3 = function(this_sym8171, k, not_found) {
    var this__8172 = this;
    var this_sym8171__8175 = this;
    var coll__8176 = this_sym8171__8175;
    return coll__8176.cljs$core$ILookup$_lookup$arity$3(coll__8176, k, not_found)
  };
  G__8200 = function(this_sym8171, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8200__2.call(this, this_sym8171, k);
      case 3:
        return G__8200__3.call(this, this_sym8171, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8200
}();
cljs.core.Vector.prototype.apply = function(this_sym8161, args8162) {
  var this__8177 = this;
  return this_sym8161.call.apply(this_sym8161, [this_sym8161].concat(args8162.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8178 = this;
  var new_array__8179 = this__8178.array.slice();
  new_array__8179.push(o);
  return new cljs.core.Vector(this__8178.meta, new_array__8179, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8180 = this;
  var this__8181 = this;
  return cljs.core.pr_str.call(null, this__8181)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8182 = this;
  return cljs.core.ci_reduce.call(null, this__8182.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8183 = this;
  return cljs.core.ci_reduce.call(null, this__8183.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8184 = this;
  if(this__8184.array.length > 0) {
    var vector_seq__8185 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8184.array.length) {
          return cljs.core.cons.call(null, this__8184.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8185.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8186 = this;
  return this__8186.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8187 = this;
  var count__8188 = this__8187.array.length;
  if(count__8188 > 0) {
    return this__8187.array[count__8188 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8189 = this;
  if(this__8189.array.length > 0) {
    var new_array__8190 = this__8189.array.slice();
    new_array__8190.pop();
    return new cljs.core.Vector(this__8189.meta, new_array__8190, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8191 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8192 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8193 = this;
  return new cljs.core.Vector(meta, this__8193.array, this__8193.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8194 = this;
  return this__8194.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8195 = this;
  if(function() {
    var and__3822__auto____8196 = 0 <= n;
    if(and__3822__auto____8196) {
      return n < this__8195.array.length
    }else {
      return and__3822__auto____8196
    }
  }()) {
    return this__8195.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8197 = this;
  if(function() {
    var and__3822__auto____8198 = 0 <= n;
    if(and__3822__auto____8198) {
      return n < this__8197.array.length
    }else {
      return and__3822__auto____8198
    }
  }()) {
    return this__8197.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8199 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8199.meta)
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
  var cnt__8202 = pv.cnt;
  if(cnt__8202 < 32) {
    return 0
  }else {
    return cnt__8202 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8208 = level;
  var ret__8209 = node;
  while(true) {
    if(ll__8208 === 0) {
      return ret__8209
    }else {
      var embed__8210 = ret__8209;
      var r__8211 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8212 = cljs.core.pv_aset.call(null, r__8211, 0, embed__8210);
      var G__8213 = ll__8208 - 5;
      var G__8214 = r__8211;
      ll__8208 = G__8213;
      ret__8209 = G__8214;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8220 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8221 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8220, subidx__8221, tailnode);
    return ret__8220
  }else {
    var child__8222 = cljs.core.pv_aget.call(null, parent, subidx__8221);
    if(!(child__8222 == null)) {
      var node_to_insert__8223 = push_tail.call(null, pv, level - 5, child__8222, tailnode);
      cljs.core.pv_aset.call(null, ret__8220, subidx__8221, node_to_insert__8223);
      return ret__8220
    }else {
      var node_to_insert__8224 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8220, subidx__8221, node_to_insert__8224);
      return ret__8220
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8228 = 0 <= i;
    if(and__3822__auto____8228) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8228
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8229 = pv.root;
      var level__8230 = pv.shift;
      while(true) {
        if(level__8230 > 0) {
          var G__8231 = cljs.core.pv_aget.call(null, node__8229, i >>> level__8230 & 31);
          var G__8232 = level__8230 - 5;
          node__8229 = G__8231;
          level__8230 = G__8232;
          continue
        }else {
          return node__8229.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8235 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8235, i & 31, val);
    return ret__8235
  }else {
    var subidx__8236 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8235, subidx__8236, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8236), i, val));
    return ret__8235
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8242 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8243 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8242));
    if(function() {
      var and__3822__auto____8244 = new_child__8243 == null;
      if(and__3822__auto____8244) {
        return subidx__8242 === 0
      }else {
        return and__3822__auto____8244
      }
    }()) {
      return null
    }else {
      var ret__8245 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8245, subidx__8242, new_child__8243);
      return ret__8245
    }
  }else {
    if(subidx__8242 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8246 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8246, subidx__8242, null);
        return ret__8246
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
  var this__8249 = this;
  return new cljs.core.TransientVector(this__8249.cnt, this__8249.shift, cljs.core.tv_editable_root.call(null, this__8249.root), cljs.core.tv_editable_tail.call(null, this__8249.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8250 = this;
  var h__2192__auto____8251 = this__8250.__hash;
  if(!(h__2192__auto____8251 == null)) {
    return h__2192__auto____8251
  }else {
    var h__2192__auto____8252 = cljs.core.hash_coll.call(null, coll);
    this__8250.__hash = h__2192__auto____8252;
    return h__2192__auto____8252
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8253 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8254 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8255 = this;
  if(function() {
    var and__3822__auto____8256 = 0 <= k;
    if(and__3822__auto____8256) {
      return k < this__8255.cnt
    }else {
      return and__3822__auto____8256
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8257 = this__8255.tail.slice();
      new_tail__8257[k & 31] = v;
      return new cljs.core.PersistentVector(this__8255.meta, this__8255.cnt, this__8255.shift, this__8255.root, new_tail__8257, null)
    }else {
      return new cljs.core.PersistentVector(this__8255.meta, this__8255.cnt, this__8255.shift, cljs.core.do_assoc.call(null, coll, this__8255.shift, this__8255.root, k, v), this__8255.tail, null)
    }
  }else {
    if(k === this__8255.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8255.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8305 = null;
  var G__8305__2 = function(this_sym8258, k) {
    var this__8260 = this;
    var this_sym8258__8261 = this;
    var coll__8262 = this_sym8258__8261;
    return coll__8262.cljs$core$ILookup$_lookup$arity$2(coll__8262, k)
  };
  var G__8305__3 = function(this_sym8259, k, not_found) {
    var this__8260 = this;
    var this_sym8259__8263 = this;
    var coll__8264 = this_sym8259__8263;
    return coll__8264.cljs$core$ILookup$_lookup$arity$3(coll__8264, k, not_found)
  };
  G__8305 = function(this_sym8259, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8305__2.call(this, this_sym8259, k);
      case 3:
        return G__8305__3.call(this, this_sym8259, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8305
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8247, args8248) {
  var this__8265 = this;
  return this_sym8247.call.apply(this_sym8247, [this_sym8247].concat(args8248.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8266 = this;
  var step_init__8267 = [0, init];
  var i__8268 = 0;
  while(true) {
    if(i__8268 < this__8266.cnt) {
      var arr__8269 = cljs.core.array_for.call(null, v, i__8268);
      var len__8270 = arr__8269.length;
      var init__8274 = function() {
        var j__8271 = 0;
        var init__8272 = step_init__8267[1];
        while(true) {
          if(j__8271 < len__8270) {
            var init__8273 = f.call(null, init__8272, j__8271 + i__8268, arr__8269[j__8271]);
            if(cljs.core.reduced_QMARK_.call(null, init__8273)) {
              return init__8273
            }else {
              var G__8306 = j__8271 + 1;
              var G__8307 = init__8273;
              j__8271 = G__8306;
              init__8272 = G__8307;
              continue
            }
          }else {
            step_init__8267[0] = len__8270;
            step_init__8267[1] = init__8272;
            return init__8272
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8274)) {
        return cljs.core.deref.call(null, init__8274)
      }else {
        var G__8308 = i__8268 + step_init__8267[0];
        i__8268 = G__8308;
        continue
      }
    }else {
      return step_init__8267[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8275 = this;
  if(this__8275.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8276 = this__8275.tail.slice();
    new_tail__8276.push(o);
    return new cljs.core.PersistentVector(this__8275.meta, this__8275.cnt + 1, this__8275.shift, this__8275.root, new_tail__8276, null)
  }else {
    var root_overflow_QMARK___8277 = this__8275.cnt >>> 5 > 1 << this__8275.shift;
    var new_shift__8278 = root_overflow_QMARK___8277 ? this__8275.shift + 5 : this__8275.shift;
    var new_root__8280 = root_overflow_QMARK___8277 ? function() {
      var n_r__8279 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8279, 0, this__8275.root);
      cljs.core.pv_aset.call(null, n_r__8279, 1, cljs.core.new_path.call(null, null, this__8275.shift, new cljs.core.VectorNode(null, this__8275.tail)));
      return n_r__8279
    }() : cljs.core.push_tail.call(null, coll, this__8275.shift, this__8275.root, new cljs.core.VectorNode(null, this__8275.tail));
    return new cljs.core.PersistentVector(this__8275.meta, this__8275.cnt + 1, new_shift__8278, new_root__8280, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8281 = this;
  if(this__8281.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8281.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8282 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8283 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8284 = this;
  var this__8285 = this;
  return cljs.core.pr_str.call(null, this__8285)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8286 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8287 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8288 = this;
  if(this__8288.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8289 = this;
  return this__8289.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8290 = this;
  if(this__8290.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8290.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8291 = this;
  if(this__8291.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8291.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8291.meta)
    }else {
      if(1 < this__8291.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8291.meta, this__8291.cnt - 1, this__8291.shift, this__8291.root, this__8291.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8292 = cljs.core.array_for.call(null, coll, this__8291.cnt - 2);
          var nr__8293 = cljs.core.pop_tail.call(null, coll, this__8291.shift, this__8291.root);
          var new_root__8294 = nr__8293 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8293;
          var cnt_1__8295 = this__8291.cnt - 1;
          if(function() {
            var and__3822__auto____8296 = 5 < this__8291.shift;
            if(and__3822__auto____8296) {
              return cljs.core.pv_aget.call(null, new_root__8294, 1) == null
            }else {
              return and__3822__auto____8296
            }
          }()) {
            return new cljs.core.PersistentVector(this__8291.meta, cnt_1__8295, this__8291.shift - 5, cljs.core.pv_aget.call(null, new_root__8294, 0), new_tail__8292, null)
          }else {
            return new cljs.core.PersistentVector(this__8291.meta, cnt_1__8295, this__8291.shift, new_root__8294, new_tail__8292, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8297 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8298 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8299 = this;
  return new cljs.core.PersistentVector(meta, this__8299.cnt, this__8299.shift, this__8299.root, this__8299.tail, this__8299.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8300 = this;
  return this__8300.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8301 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8302 = this;
  if(function() {
    var and__3822__auto____8303 = 0 <= n;
    if(and__3822__auto____8303) {
      return n < this__8302.cnt
    }else {
      return and__3822__auto____8303
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8304 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8304.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8309 = xs.length;
  var xs__8310 = no_clone === true ? xs : xs.slice();
  if(l__8309 < 32) {
    return new cljs.core.PersistentVector(null, l__8309, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8310, null)
  }else {
    var node__8311 = xs__8310.slice(0, 32);
    var v__8312 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8311, null);
    var i__8313 = 32;
    var out__8314 = cljs.core._as_transient.call(null, v__8312);
    while(true) {
      if(i__8313 < l__8309) {
        var G__8315 = i__8313 + 1;
        var G__8316 = cljs.core.conj_BANG_.call(null, out__8314, xs__8310[i__8313]);
        i__8313 = G__8315;
        out__8314 = G__8316;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8314)
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
  vector.cljs$lang$applyTo = function(arglist__8317) {
    var args = cljs.core.seq(arglist__8317);
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
  var this__8318 = this;
  if(this__8318.off + 1 < this__8318.node.length) {
    var s__8319 = cljs.core.chunked_seq.call(null, this__8318.vec, this__8318.node, this__8318.i, this__8318.off + 1);
    if(s__8319 == null) {
      return null
    }else {
      return s__8319
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8320 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8321 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8322 = this;
  return this__8322.node[this__8322.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8323 = this;
  if(this__8323.off + 1 < this__8323.node.length) {
    var s__8324 = cljs.core.chunked_seq.call(null, this__8323.vec, this__8323.node, this__8323.i, this__8323.off + 1);
    if(s__8324 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8324
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8325 = this;
  var l__8326 = this__8325.node.length;
  var s__8327 = this__8325.i + l__8326 < cljs.core._count.call(null, this__8325.vec) ? cljs.core.chunked_seq.call(null, this__8325.vec, this__8325.i + l__8326, 0) : null;
  if(s__8327 == null) {
    return null
  }else {
    return s__8327
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8328 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8329 = this;
  return cljs.core.chunked_seq.call(null, this__8329.vec, this__8329.node, this__8329.i, this__8329.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8330 = this;
  return this__8330.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8331 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8331.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8332 = this;
  return cljs.core.array_chunk.call(null, this__8332.node, this__8332.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8333 = this;
  var l__8334 = this__8333.node.length;
  var s__8335 = this__8333.i + l__8334 < cljs.core._count.call(null, this__8333.vec) ? cljs.core.chunked_seq.call(null, this__8333.vec, this__8333.i + l__8334, 0) : null;
  if(s__8335 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8335
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
  var this__8338 = this;
  var h__2192__auto____8339 = this__8338.__hash;
  if(!(h__2192__auto____8339 == null)) {
    return h__2192__auto____8339
  }else {
    var h__2192__auto____8340 = cljs.core.hash_coll.call(null, coll);
    this__8338.__hash = h__2192__auto____8340;
    return h__2192__auto____8340
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8341 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8342 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8343 = this;
  var v_pos__8344 = this__8343.start + key;
  return new cljs.core.Subvec(this__8343.meta, cljs.core._assoc.call(null, this__8343.v, v_pos__8344, val), this__8343.start, this__8343.end > v_pos__8344 + 1 ? this__8343.end : v_pos__8344 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8370 = null;
  var G__8370__2 = function(this_sym8345, k) {
    var this__8347 = this;
    var this_sym8345__8348 = this;
    var coll__8349 = this_sym8345__8348;
    return coll__8349.cljs$core$ILookup$_lookup$arity$2(coll__8349, k)
  };
  var G__8370__3 = function(this_sym8346, k, not_found) {
    var this__8347 = this;
    var this_sym8346__8350 = this;
    var coll__8351 = this_sym8346__8350;
    return coll__8351.cljs$core$ILookup$_lookup$arity$3(coll__8351, k, not_found)
  };
  G__8370 = function(this_sym8346, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8370__2.call(this, this_sym8346, k);
      case 3:
        return G__8370__3.call(this, this_sym8346, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8370
}();
cljs.core.Subvec.prototype.apply = function(this_sym8336, args8337) {
  var this__8352 = this;
  return this_sym8336.call.apply(this_sym8336, [this_sym8336].concat(args8337.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8353 = this;
  return new cljs.core.Subvec(this__8353.meta, cljs.core._assoc_n.call(null, this__8353.v, this__8353.end, o), this__8353.start, this__8353.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8354 = this;
  var this__8355 = this;
  return cljs.core.pr_str.call(null, this__8355)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8356 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8357 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8358 = this;
  var subvec_seq__8359 = function subvec_seq(i) {
    if(i === this__8358.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8358.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8359.call(null, this__8358.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8360 = this;
  return this__8360.end - this__8360.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8361 = this;
  return cljs.core._nth.call(null, this__8361.v, this__8361.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8362 = this;
  if(this__8362.start === this__8362.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8362.meta, this__8362.v, this__8362.start, this__8362.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8363 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8364 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8365 = this;
  return new cljs.core.Subvec(meta, this__8365.v, this__8365.start, this__8365.end, this__8365.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8366 = this;
  return this__8366.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8367 = this;
  return cljs.core._nth.call(null, this__8367.v, this__8367.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8368 = this;
  return cljs.core._nth.call(null, this__8368.v, this__8368.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8369 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8369.meta)
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
  var ret__8372 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8372, 0, tl.length);
  return ret__8372
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8376 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8377 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8376, subidx__8377, level === 5 ? tail_node : function() {
    var child__8378 = cljs.core.pv_aget.call(null, ret__8376, subidx__8377);
    if(!(child__8378 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8378, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8376
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8383 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8384 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8385 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8383, subidx__8384));
    if(function() {
      var and__3822__auto____8386 = new_child__8385 == null;
      if(and__3822__auto____8386) {
        return subidx__8384 === 0
      }else {
        return and__3822__auto____8386
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8383, subidx__8384, new_child__8385);
      return node__8383
    }
  }else {
    if(subidx__8384 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8383, subidx__8384, null);
        return node__8383
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8391 = 0 <= i;
    if(and__3822__auto____8391) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8391
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8392 = tv.root;
      var node__8393 = root__8392;
      var level__8394 = tv.shift;
      while(true) {
        if(level__8394 > 0) {
          var G__8395 = cljs.core.tv_ensure_editable.call(null, root__8392.edit, cljs.core.pv_aget.call(null, node__8393, i >>> level__8394 & 31));
          var G__8396 = level__8394 - 5;
          node__8393 = G__8395;
          level__8394 = G__8396;
          continue
        }else {
          return node__8393.arr
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
  var G__8436 = null;
  var G__8436__2 = function(this_sym8399, k) {
    var this__8401 = this;
    var this_sym8399__8402 = this;
    var coll__8403 = this_sym8399__8402;
    return coll__8403.cljs$core$ILookup$_lookup$arity$2(coll__8403, k)
  };
  var G__8436__3 = function(this_sym8400, k, not_found) {
    var this__8401 = this;
    var this_sym8400__8404 = this;
    var coll__8405 = this_sym8400__8404;
    return coll__8405.cljs$core$ILookup$_lookup$arity$3(coll__8405, k, not_found)
  };
  G__8436 = function(this_sym8400, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8436__2.call(this, this_sym8400, k);
      case 3:
        return G__8436__3.call(this, this_sym8400, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8436
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8397, args8398) {
  var this__8406 = this;
  return this_sym8397.call.apply(this_sym8397, [this_sym8397].concat(args8398.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8407 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8408 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8409 = this;
  if(this__8409.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8410 = this;
  if(function() {
    var and__3822__auto____8411 = 0 <= n;
    if(and__3822__auto____8411) {
      return n < this__8410.cnt
    }else {
      return and__3822__auto____8411
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8412 = this;
  if(this__8412.root.edit) {
    return this__8412.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8413 = this;
  if(this__8413.root.edit) {
    if(function() {
      var and__3822__auto____8414 = 0 <= n;
      if(and__3822__auto____8414) {
        return n < this__8413.cnt
      }else {
        return and__3822__auto____8414
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8413.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8419 = function go(level, node) {
          var node__8417 = cljs.core.tv_ensure_editable.call(null, this__8413.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8417, n & 31, val);
            return node__8417
          }else {
            var subidx__8418 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8417, subidx__8418, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8417, subidx__8418)));
            return node__8417
          }
        }.call(null, this__8413.shift, this__8413.root);
        this__8413.root = new_root__8419;
        return tcoll
      }
    }else {
      if(n === this__8413.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8413.cnt)].join(""));
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
  var this__8420 = this;
  if(this__8420.root.edit) {
    if(this__8420.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8420.cnt) {
        this__8420.cnt = 0;
        return tcoll
      }else {
        if((this__8420.cnt - 1 & 31) > 0) {
          this__8420.cnt = this__8420.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8421 = cljs.core.editable_array_for.call(null, tcoll, this__8420.cnt - 2);
            var new_root__8423 = function() {
              var nr__8422 = cljs.core.tv_pop_tail.call(null, tcoll, this__8420.shift, this__8420.root);
              if(!(nr__8422 == null)) {
                return nr__8422
              }else {
                return new cljs.core.VectorNode(this__8420.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8424 = 5 < this__8420.shift;
              if(and__3822__auto____8424) {
                return cljs.core.pv_aget.call(null, new_root__8423, 1) == null
              }else {
                return and__3822__auto____8424
              }
            }()) {
              var new_root__8425 = cljs.core.tv_ensure_editable.call(null, this__8420.root.edit, cljs.core.pv_aget.call(null, new_root__8423, 0));
              this__8420.root = new_root__8425;
              this__8420.shift = this__8420.shift - 5;
              this__8420.cnt = this__8420.cnt - 1;
              this__8420.tail = new_tail__8421;
              return tcoll
            }else {
              this__8420.root = new_root__8423;
              this__8420.cnt = this__8420.cnt - 1;
              this__8420.tail = new_tail__8421;
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
  var this__8426 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8427 = this;
  if(this__8427.root.edit) {
    if(this__8427.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8427.tail[this__8427.cnt & 31] = o;
      this__8427.cnt = this__8427.cnt + 1;
      return tcoll
    }else {
      var tail_node__8428 = new cljs.core.VectorNode(this__8427.root.edit, this__8427.tail);
      var new_tail__8429 = cljs.core.make_array.call(null, 32);
      new_tail__8429[0] = o;
      this__8427.tail = new_tail__8429;
      if(this__8427.cnt >>> 5 > 1 << this__8427.shift) {
        var new_root_array__8430 = cljs.core.make_array.call(null, 32);
        var new_shift__8431 = this__8427.shift + 5;
        new_root_array__8430[0] = this__8427.root;
        new_root_array__8430[1] = cljs.core.new_path.call(null, this__8427.root.edit, this__8427.shift, tail_node__8428);
        this__8427.root = new cljs.core.VectorNode(this__8427.root.edit, new_root_array__8430);
        this__8427.shift = new_shift__8431;
        this__8427.cnt = this__8427.cnt + 1;
        return tcoll
      }else {
        var new_root__8432 = cljs.core.tv_push_tail.call(null, tcoll, this__8427.shift, this__8427.root, tail_node__8428);
        this__8427.root = new_root__8432;
        this__8427.cnt = this__8427.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8433 = this;
  if(this__8433.root.edit) {
    this__8433.root.edit = null;
    var len__8434 = this__8433.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8435 = cljs.core.make_array.call(null, len__8434);
    cljs.core.array_copy.call(null, this__8433.tail, 0, trimmed_tail__8435, 0, len__8434);
    return new cljs.core.PersistentVector(null, this__8433.cnt, this__8433.shift, this__8433.root, trimmed_tail__8435, null)
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
  var this__8437 = this;
  var h__2192__auto____8438 = this__8437.__hash;
  if(!(h__2192__auto____8438 == null)) {
    return h__2192__auto____8438
  }else {
    var h__2192__auto____8439 = cljs.core.hash_coll.call(null, coll);
    this__8437.__hash = h__2192__auto____8439;
    return h__2192__auto____8439
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8440 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8441 = this;
  var this__8442 = this;
  return cljs.core.pr_str.call(null, this__8442)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8443 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8444 = this;
  return cljs.core._first.call(null, this__8444.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8445 = this;
  var temp__3971__auto____8446 = cljs.core.next.call(null, this__8445.front);
  if(temp__3971__auto____8446) {
    var f1__8447 = temp__3971__auto____8446;
    return new cljs.core.PersistentQueueSeq(this__8445.meta, f1__8447, this__8445.rear, null)
  }else {
    if(this__8445.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8445.meta, this__8445.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8448 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8449 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8449.front, this__8449.rear, this__8449.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8450 = this;
  return this__8450.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8451 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8451.meta)
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
  var this__8452 = this;
  var h__2192__auto____8453 = this__8452.__hash;
  if(!(h__2192__auto____8453 == null)) {
    return h__2192__auto____8453
  }else {
    var h__2192__auto____8454 = cljs.core.hash_coll.call(null, coll);
    this__8452.__hash = h__2192__auto____8454;
    return h__2192__auto____8454
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8455 = this;
  if(cljs.core.truth_(this__8455.front)) {
    return new cljs.core.PersistentQueue(this__8455.meta, this__8455.count + 1, this__8455.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8456 = this__8455.rear;
      if(cljs.core.truth_(or__3824__auto____8456)) {
        return or__3824__auto____8456
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8455.meta, this__8455.count + 1, cljs.core.conj.call(null, this__8455.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8457 = this;
  var this__8458 = this;
  return cljs.core.pr_str.call(null, this__8458)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8459 = this;
  var rear__8460 = cljs.core.seq.call(null, this__8459.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8461 = this__8459.front;
    if(cljs.core.truth_(or__3824__auto____8461)) {
      return or__3824__auto____8461
    }else {
      return rear__8460
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8459.front, cljs.core.seq.call(null, rear__8460), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8462 = this;
  return this__8462.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8463 = this;
  return cljs.core._first.call(null, this__8463.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8464 = this;
  if(cljs.core.truth_(this__8464.front)) {
    var temp__3971__auto____8465 = cljs.core.next.call(null, this__8464.front);
    if(temp__3971__auto____8465) {
      var f1__8466 = temp__3971__auto____8465;
      return new cljs.core.PersistentQueue(this__8464.meta, this__8464.count - 1, f1__8466, this__8464.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8464.meta, this__8464.count - 1, cljs.core.seq.call(null, this__8464.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8467 = this;
  return cljs.core.first.call(null, this__8467.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8468 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8469 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8470 = this;
  return new cljs.core.PersistentQueue(meta, this__8470.count, this__8470.front, this__8470.rear, this__8470.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8471 = this;
  return this__8471.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8472 = this;
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
  var this__8473 = this;
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
  var len__8476 = array.length;
  var i__8477 = 0;
  while(true) {
    if(i__8477 < len__8476) {
      if(k === array[i__8477]) {
        return i__8477
      }else {
        var G__8478 = i__8477 + incr;
        i__8477 = G__8478;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8481 = cljs.core.hash.call(null, a);
  var b__8482 = cljs.core.hash.call(null, b);
  if(a__8481 < b__8482) {
    return-1
  }else {
    if(a__8481 > b__8482) {
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
  var ks__8490 = m.keys;
  var len__8491 = ks__8490.length;
  var so__8492 = m.strobj;
  var out__8493 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8494 = 0;
  var out__8495 = cljs.core.transient$.call(null, out__8493);
  while(true) {
    if(i__8494 < len__8491) {
      var k__8496 = ks__8490[i__8494];
      var G__8497 = i__8494 + 1;
      var G__8498 = cljs.core.assoc_BANG_.call(null, out__8495, k__8496, so__8492[k__8496]);
      i__8494 = G__8497;
      out__8495 = G__8498;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8495, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8504 = {};
  var l__8505 = ks.length;
  var i__8506 = 0;
  while(true) {
    if(i__8506 < l__8505) {
      var k__8507 = ks[i__8506];
      new_obj__8504[k__8507] = obj[k__8507];
      var G__8508 = i__8506 + 1;
      i__8506 = G__8508;
      continue
    }else {
    }
    break
  }
  return new_obj__8504
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
  var this__8511 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8512 = this;
  var h__2192__auto____8513 = this__8512.__hash;
  if(!(h__2192__auto____8513 == null)) {
    return h__2192__auto____8513
  }else {
    var h__2192__auto____8514 = cljs.core.hash_imap.call(null, coll);
    this__8512.__hash = h__2192__auto____8514;
    return h__2192__auto____8514
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8515 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8516 = this;
  if(function() {
    var and__3822__auto____8517 = goog.isString(k);
    if(and__3822__auto____8517) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8516.keys) == null)
    }else {
      return and__3822__auto____8517
    }
  }()) {
    return this__8516.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8518 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8519 = this__8518.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8519) {
        return or__3824__auto____8519
      }else {
        return this__8518.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8518.keys) == null)) {
        var new_strobj__8520 = cljs.core.obj_clone.call(null, this__8518.strobj, this__8518.keys);
        new_strobj__8520[k] = v;
        return new cljs.core.ObjMap(this__8518.meta, this__8518.keys, new_strobj__8520, this__8518.update_count + 1, null)
      }else {
        var new_strobj__8521 = cljs.core.obj_clone.call(null, this__8518.strobj, this__8518.keys);
        var new_keys__8522 = this__8518.keys.slice();
        new_strobj__8521[k] = v;
        new_keys__8522.push(k);
        return new cljs.core.ObjMap(this__8518.meta, new_keys__8522, new_strobj__8521, this__8518.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8523 = this;
  if(function() {
    var and__3822__auto____8524 = goog.isString(k);
    if(and__3822__auto____8524) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8523.keys) == null)
    }else {
      return and__3822__auto____8524
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8546 = null;
  var G__8546__2 = function(this_sym8525, k) {
    var this__8527 = this;
    var this_sym8525__8528 = this;
    var coll__8529 = this_sym8525__8528;
    return coll__8529.cljs$core$ILookup$_lookup$arity$2(coll__8529, k)
  };
  var G__8546__3 = function(this_sym8526, k, not_found) {
    var this__8527 = this;
    var this_sym8526__8530 = this;
    var coll__8531 = this_sym8526__8530;
    return coll__8531.cljs$core$ILookup$_lookup$arity$3(coll__8531, k, not_found)
  };
  G__8546 = function(this_sym8526, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8546__2.call(this, this_sym8526, k);
      case 3:
        return G__8546__3.call(this, this_sym8526, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8546
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8509, args8510) {
  var this__8532 = this;
  return this_sym8509.call.apply(this_sym8509, [this_sym8509].concat(args8510.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8533 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8534 = this;
  var this__8535 = this;
  return cljs.core.pr_str.call(null, this__8535)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8536 = this;
  if(this__8536.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8499_SHARP_) {
      return cljs.core.vector.call(null, p1__8499_SHARP_, this__8536.strobj[p1__8499_SHARP_])
    }, this__8536.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8537 = this;
  return this__8537.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8538 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8539 = this;
  return new cljs.core.ObjMap(meta, this__8539.keys, this__8539.strobj, this__8539.update_count, this__8539.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8540 = this;
  return this__8540.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8541 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8541.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8542 = this;
  if(function() {
    var and__3822__auto____8543 = goog.isString(k);
    if(and__3822__auto____8543) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8542.keys) == null)
    }else {
      return and__3822__auto____8543
    }
  }()) {
    var new_keys__8544 = this__8542.keys.slice();
    var new_strobj__8545 = cljs.core.obj_clone.call(null, this__8542.strobj, this__8542.keys);
    new_keys__8544.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8544), 1);
    cljs.core.js_delete.call(null, new_strobj__8545, k);
    return new cljs.core.ObjMap(this__8542.meta, new_keys__8544, new_strobj__8545, this__8542.update_count + 1, null)
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
  var this__8550 = this;
  var h__2192__auto____8551 = this__8550.__hash;
  if(!(h__2192__auto____8551 == null)) {
    return h__2192__auto____8551
  }else {
    var h__2192__auto____8552 = cljs.core.hash_imap.call(null, coll);
    this__8550.__hash = h__2192__auto____8552;
    return h__2192__auto____8552
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8553 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8554 = this;
  var bucket__8555 = this__8554.hashobj[cljs.core.hash.call(null, k)];
  var i__8556 = cljs.core.truth_(bucket__8555) ? cljs.core.scan_array.call(null, 2, k, bucket__8555) : null;
  if(cljs.core.truth_(i__8556)) {
    return bucket__8555[i__8556 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8557 = this;
  var h__8558 = cljs.core.hash.call(null, k);
  var bucket__8559 = this__8557.hashobj[h__8558];
  if(cljs.core.truth_(bucket__8559)) {
    var new_bucket__8560 = bucket__8559.slice();
    var new_hashobj__8561 = goog.object.clone(this__8557.hashobj);
    new_hashobj__8561[h__8558] = new_bucket__8560;
    var temp__3971__auto____8562 = cljs.core.scan_array.call(null, 2, k, new_bucket__8560);
    if(cljs.core.truth_(temp__3971__auto____8562)) {
      var i__8563 = temp__3971__auto____8562;
      new_bucket__8560[i__8563 + 1] = v;
      return new cljs.core.HashMap(this__8557.meta, this__8557.count, new_hashobj__8561, null)
    }else {
      new_bucket__8560.push(k, v);
      return new cljs.core.HashMap(this__8557.meta, this__8557.count + 1, new_hashobj__8561, null)
    }
  }else {
    var new_hashobj__8564 = goog.object.clone(this__8557.hashobj);
    new_hashobj__8564[h__8558] = [k, v];
    return new cljs.core.HashMap(this__8557.meta, this__8557.count + 1, new_hashobj__8564, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8565 = this;
  var bucket__8566 = this__8565.hashobj[cljs.core.hash.call(null, k)];
  var i__8567 = cljs.core.truth_(bucket__8566) ? cljs.core.scan_array.call(null, 2, k, bucket__8566) : null;
  if(cljs.core.truth_(i__8567)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8592 = null;
  var G__8592__2 = function(this_sym8568, k) {
    var this__8570 = this;
    var this_sym8568__8571 = this;
    var coll__8572 = this_sym8568__8571;
    return coll__8572.cljs$core$ILookup$_lookup$arity$2(coll__8572, k)
  };
  var G__8592__3 = function(this_sym8569, k, not_found) {
    var this__8570 = this;
    var this_sym8569__8573 = this;
    var coll__8574 = this_sym8569__8573;
    return coll__8574.cljs$core$ILookup$_lookup$arity$3(coll__8574, k, not_found)
  };
  G__8592 = function(this_sym8569, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8592__2.call(this, this_sym8569, k);
      case 3:
        return G__8592__3.call(this, this_sym8569, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8592
}();
cljs.core.HashMap.prototype.apply = function(this_sym8548, args8549) {
  var this__8575 = this;
  return this_sym8548.call.apply(this_sym8548, [this_sym8548].concat(args8549.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8576 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8577 = this;
  var this__8578 = this;
  return cljs.core.pr_str.call(null, this__8578)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8579 = this;
  if(this__8579.count > 0) {
    var hashes__8580 = cljs.core.js_keys.call(null, this__8579.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8547_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8579.hashobj[p1__8547_SHARP_]))
    }, hashes__8580)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8581 = this;
  return this__8581.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8582 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8583 = this;
  return new cljs.core.HashMap(meta, this__8583.count, this__8583.hashobj, this__8583.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8584 = this;
  return this__8584.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8585 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8585.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8586 = this;
  var h__8587 = cljs.core.hash.call(null, k);
  var bucket__8588 = this__8586.hashobj[h__8587];
  var i__8589 = cljs.core.truth_(bucket__8588) ? cljs.core.scan_array.call(null, 2, k, bucket__8588) : null;
  if(cljs.core.not.call(null, i__8589)) {
    return coll
  }else {
    var new_hashobj__8590 = goog.object.clone(this__8586.hashobj);
    if(3 > bucket__8588.length) {
      cljs.core.js_delete.call(null, new_hashobj__8590, h__8587)
    }else {
      var new_bucket__8591 = bucket__8588.slice();
      new_bucket__8591.splice(i__8589, 2);
      new_hashobj__8590[h__8587] = new_bucket__8591
    }
    return new cljs.core.HashMap(this__8586.meta, this__8586.count - 1, new_hashobj__8590, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8593 = ks.length;
  var i__8594 = 0;
  var out__8595 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8594 < len__8593) {
      var G__8596 = i__8594 + 1;
      var G__8597 = cljs.core.assoc.call(null, out__8595, ks[i__8594], vs[i__8594]);
      i__8594 = G__8596;
      out__8595 = G__8597;
      continue
    }else {
      return out__8595
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8601 = m.arr;
  var len__8602 = arr__8601.length;
  var i__8603 = 0;
  while(true) {
    if(len__8602 <= i__8603) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8601[i__8603], k)) {
        return i__8603
      }else {
        if("\ufdd0'else") {
          var G__8604 = i__8603 + 2;
          i__8603 = G__8604;
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
  var this__8607 = this;
  return new cljs.core.TransientArrayMap({}, this__8607.arr.length, this__8607.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8608 = this;
  var h__2192__auto____8609 = this__8608.__hash;
  if(!(h__2192__auto____8609 == null)) {
    return h__2192__auto____8609
  }else {
    var h__2192__auto____8610 = cljs.core.hash_imap.call(null, coll);
    this__8608.__hash = h__2192__auto____8610;
    return h__2192__auto____8610
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8611 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8612 = this;
  var idx__8613 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8613 === -1) {
    return not_found
  }else {
    return this__8612.arr[idx__8613 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8614 = this;
  var idx__8615 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8615 === -1) {
    if(this__8614.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8614.meta, this__8614.cnt + 1, function() {
        var G__8616__8617 = this__8614.arr.slice();
        G__8616__8617.push(k);
        G__8616__8617.push(v);
        return G__8616__8617
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8614.arr[idx__8615 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8614.meta, this__8614.cnt, function() {
          var G__8618__8619 = this__8614.arr.slice();
          G__8618__8619[idx__8615 + 1] = v;
          return G__8618__8619
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8620 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8652 = null;
  var G__8652__2 = function(this_sym8621, k) {
    var this__8623 = this;
    var this_sym8621__8624 = this;
    var coll__8625 = this_sym8621__8624;
    return coll__8625.cljs$core$ILookup$_lookup$arity$2(coll__8625, k)
  };
  var G__8652__3 = function(this_sym8622, k, not_found) {
    var this__8623 = this;
    var this_sym8622__8626 = this;
    var coll__8627 = this_sym8622__8626;
    return coll__8627.cljs$core$ILookup$_lookup$arity$3(coll__8627, k, not_found)
  };
  G__8652 = function(this_sym8622, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8652__2.call(this, this_sym8622, k);
      case 3:
        return G__8652__3.call(this, this_sym8622, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8652
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8605, args8606) {
  var this__8628 = this;
  return this_sym8605.call.apply(this_sym8605, [this_sym8605].concat(args8606.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8629 = this;
  var len__8630 = this__8629.arr.length;
  var i__8631 = 0;
  var init__8632 = init;
  while(true) {
    if(i__8631 < len__8630) {
      var init__8633 = f.call(null, init__8632, this__8629.arr[i__8631], this__8629.arr[i__8631 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8633)) {
        return cljs.core.deref.call(null, init__8633)
      }else {
        var G__8653 = i__8631 + 2;
        var G__8654 = init__8633;
        i__8631 = G__8653;
        init__8632 = G__8654;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8634 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8635 = this;
  var this__8636 = this;
  return cljs.core.pr_str.call(null, this__8636)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8637 = this;
  if(this__8637.cnt > 0) {
    var len__8638 = this__8637.arr.length;
    var array_map_seq__8639 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8638) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8637.arr[i], this__8637.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8639.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8640 = this;
  return this__8640.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8641 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8642 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8642.cnt, this__8642.arr, this__8642.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8643 = this;
  return this__8643.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8644 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8644.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8645 = this;
  var idx__8646 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8646 >= 0) {
    var len__8647 = this__8645.arr.length;
    var new_len__8648 = len__8647 - 2;
    if(new_len__8648 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8649 = cljs.core.make_array.call(null, new_len__8648);
      var s__8650 = 0;
      var d__8651 = 0;
      while(true) {
        if(s__8650 >= len__8647) {
          return new cljs.core.PersistentArrayMap(this__8645.meta, this__8645.cnt - 1, new_arr__8649, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8645.arr[s__8650])) {
            var G__8655 = s__8650 + 2;
            var G__8656 = d__8651;
            s__8650 = G__8655;
            d__8651 = G__8656;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8649[d__8651] = this__8645.arr[s__8650];
              new_arr__8649[d__8651 + 1] = this__8645.arr[s__8650 + 1];
              var G__8657 = s__8650 + 2;
              var G__8658 = d__8651 + 2;
              s__8650 = G__8657;
              d__8651 = G__8658;
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
  var len__8659 = cljs.core.count.call(null, ks);
  var i__8660 = 0;
  var out__8661 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8660 < len__8659) {
      var G__8662 = i__8660 + 1;
      var G__8663 = cljs.core.assoc_BANG_.call(null, out__8661, ks[i__8660], vs[i__8660]);
      i__8660 = G__8662;
      out__8661 = G__8663;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8661)
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
  var this__8664 = this;
  if(cljs.core.truth_(this__8664.editable_QMARK_)) {
    var idx__8665 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8665 >= 0) {
      this__8664.arr[idx__8665] = this__8664.arr[this__8664.len - 2];
      this__8664.arr[idx__8665 + 1] = this__8664.arr[this__8664.len - 1];
      var G__8666__8667 = this__8664.arr;
      G__8666__8667.pop();
      G__8666__8667.pop();
      G__8666__8667;
      this__8664.len = this__8664.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8668 = this;
  if(cljs.core.truth_(this__8668.editable_QMARK_)) {
    var idx__8669 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8669 === -1) {
      if(this__8668.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8668.len = this__8668.len + 2;
        this__8668.arr.push(key);
        this__8668.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8668.len, this__8668.arr), key, val)
      }
    }else {
      if(val === this__8668.arr[idx__8669 + 1]) {
        return tcoll
      }else {
        this__8668.arr[idx__8669 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8670 = this;
  if(cljs.core.truth_(this__8670.editable_QMARK_)) {
    if(function() {
      var G__8671__8672 = o;
      if(G__8671__8672) {
        if(function() {
          var or__3824__auto____8673 = G__8671__8672.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8673) {
            return or__3824__auto____8673
          }else {
            return G__8671__8672.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8671__8672.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8671__8672)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8671__8672)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8674 = cljs.core.seq.call(null, o);
      var tcoll__8675 = tcoll;
      while(true) {
        var temp__3971__auto____8676 = cljs.core.first.call(null, es__8674);
        if(cljs.core.truth_(temp__3971__auto____8676)) {
          var e__8677 = temp__3971__auto____8676;
          var G__8683 = cljs.core.next.call(null, es__8674);
          var G__8684 = tcoll__8675.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8675, cljs.core.key.call(null, e__8677), cljs.core.val.call(null, e__8677));
          es__8674 = G__8683;
          tcoll__8675 = G__8684;
          continue
        }else {
          return tcoll__8675
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8678 = this;
  if(cljs.core.truth_(this__8678.editable_QMARK_)) {
    this__8678.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8678.len, 2), this__8678.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8679 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8680 = this;
  if(cljs.core.truth_(this__8680.editable_QMARK_)) {
    var idx__8681 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8681 === -1) {
      return not_found
    }else {
      return this__8680.arr[idx__8681 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8682 = this;
  if(cljs.core.truth_(this__8682.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8682.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8687 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8688 = 0;
  while(true) {
    if(i__8688 < len) {
      var G__8689 = cljs.core.assoc_BANG_.call(null, out__8687, arr[i__8688], arr[i__8688 + 1]);
      var G__8690 = i__8688 + 2;
      out__8687 = G__8689;
      i__8688 = G__8690;
      continue
    }else {
      return out__8687
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
    var G__8695__8696 = arr.slice();
    G__8695__8696[i] = a;
    return G__8695__8696
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8697__8698 = arr.slice();
    G__8697__8698[i] = a;
    G__8697__8698[j] = b;
    return G__8697__8698
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
  var new_arr__8700 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8700, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8700, 2 * i, new_arr__8700.length - 2 * i);
  return new_arr__8700
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
    var editable__8703 = inode.ensure_editable(edit);
    editable__8703.arr[i] = a;
    return editable__8703
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8704 = inode.ensure_editable(edit);
    editable__8704.arr[i] = a;
    editable__8704.arr[j] = b;
    return editable__8704
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
  var len__8711 = arr.length;
  var i__8712 = 0;
  var init__8713 = init;
  while(true) {
    if(i__8712 < len__8711) {
      var init__8716 = function() {
        var k__8714 = arr[i__8712];
        if(!(k__8714 == null)) {
          return f.call(null, init__8713, k__8714, arr[i__8712 + 1])
        }else {
          var node__8715 = arr[i__8712 + 1];
          if(!(node__8715 == null)) {
            return node__8715.kv_reduce(f, init__8713)
          }else {
            return init__8713
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8716)) {
        return cljs.core.deref.call(null, init__8716)
      }else {
        var G__8717 = i__8712 + 2;
        var G__8718 = init__8716;
        i__8712 = G__8717;
        init__8713 = G__8718;
        continue
      }
    }else {
      return init__8713
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
  var this__8719 = this;
  var inode__8720 = this;
  if(this__8719.bitmap === bit) {
    return null
  }else {
    var editable__8721 = inode__8720.ensure_editable(e);
    var earr__8722 = editable__8721.arr;
    var len__8723 = earr__8722.length;
    editable__8721.bitmap = bit ^ editable__8721.bitmap;
    cljs.core.array_copy.call(null, earr__8722, 2 * (i + 1), earr__8722, 2 * i, len__8723 - 2 * (i + 1));
    earr__8722[len__8723 - 2] = null;
    earr__8722[len__8723 - 1] = null;
    return editable__8721
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8724 = this;
  var inode__8725 = this;
  var bit__8726 = 1 << (hash >>> shift & 31);
  var idx__8727 = cljs.core.bitmap_indexed_node_index.call(null, this__8724.bitmap, bit__8726);
  if((this__8724.bitmap & bit__8726) === 0) {
    var n__8728 = cljs.core.bit_count.call(null, this__8724.bitmap);
    if(2 * n__8728 < this__8724.arr.length) {
      var editable__8729 = inode__8725.ensure_editable(edit);
      var earr__8730 = editable__8729.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8730, 2 * idx__8727, earr__8730, 2 * (idx__8727 + 1), 2 * (n__8728 - idx__8727));
      earr__8730[2 * idx__8727] = key;
      earr__8730[2 * idx__8727 + 1] = val;
      editable__8729.bitmap = editable__8729.bitmap | bit__8726;
      return editable__8729
    }else {
      if(n__8728 >= 16) {
        var nodes__8731 = cljs.core.make_array.call(null, 32);
        var jdx__8732 = hash >>> shift & 31;
        nodes__8731[jdx__8732] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8733 = 0;
        var j__8734 = 0;
        while(true) {
          if(i__8733 < 32) {
            if((this__8724.bitmap >>> i__8733 & 1) === 0) {
              var G__8787 = i__8733 + 1;
              var G__8788 = j__8734;
              i__8733 = G__8787;
              j__8734 = G__8788;
              continue
            }else {
              nodes__8731[i__8733] = !(this__8724.arr[j__8734] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8724.arr[j__8734]), this__8724.arr[j__8734], this__8724.arr[j__8734 + 1], added_leaf_QMARK_) : this__8724.arr[j__8734 + 1];
              var G__8789 = i__8733 + 1;
              var G__8790 = j__8734 + 2;
              i__8733 = G__8789;
              j__8734 = G__8790;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8728 + 1, nodes__8731)
      }else {
        if("\ufdd0'else") {
          var new_arr__8735 = cljs.core.make_array.call(null, 2 * (n__8728 + 4));
          cljs.core.array_copy.call(null, this__8724.arr, 0, new_arr__8735, 0, 2 * idx__8727);
          new_arr__8735[2 * idx__8727] = key;
          new_arr__8735[2 * idx__8727 + 1] = val;
          cljs.core.array_copy.call(null, this__8724.arr, 2 * idx__8727, new_arr__8735, 2 * (idx__8727 + 1), 2 * (n__8728 - idx__8727));
          added_leaf_QMARK_.val = true;
          var editable__8736 = inode__8725.ensure_editable(edit);
          editable__8736.arr = new_arr__8735;
          editable__8736.bitmap = editable__8736.bitmap | bit__8726;
          return editable__8736
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8737 = this__8724.arr[2 * idx__8727];
    var val_or_node__8738 = this__8724.arr[2 * idx__8727 + 1];
    if(key_or_nil__8737 == null) {
      var n__8739 = val_or_node__8738.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8739 === val_or_node__8738) {
        return inode__8725
      }else {
        return cljs.core.edit_and_set.call(null, inode__8725, edit, 2 * idx__8727 + 1, n__8739)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8737)) {
        if(val === val_or_node__8738) {
          return inode__8725
        }else {
          return cljs.core.edit_and_set.call(null, inode__8725, edit, 2 * idx__8727 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8725, edit, 2 * idx__8727, null, 2 * idx__8727 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8737, val_or_node__8738, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8740 = this;
  var inode__8741 = this;
  return cljs.core.create_inode_seq.call(null, this__8740.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8742 = this;
  var inode__8743 = this;
  var bit__8744 = 1 << (hash >>> shift & 31);
  if((this__8742.bitmap & bit__8744) === 0) {
    return inode__8743
  }else {
    var idx__8745 = cljs.core.bitmap_indexed_node_index.call(null, this__8742.bitmap, bit__8744);
    var key_or_nil__8746 = this__8742.arr[2 * idx__8745];
    var val_or_node__8747 = this__8742.arr[2 * idx__8745 + 1];
    if(key_or_nil__8746 == null) {
      var n__8748 = val_or_node__8747.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8748 === val_or_node__8747) {
        return inode__8743
      }else {
        if(!(n__8748 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8743, edit, 2 * idx__8745 + 1, n__8748)
        }else {
          if(this__8742.bitmap === bit__8744) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8743.edit_and_remove_pair(edit, bit__8744, idx__8745)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8746)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8743.edit_and_remove_pair(edit, bit__8744, idx__8745)
      }else {
        if("\ufdd0'else") {
          return inode__8743
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8749 = this;
  var inode__8750 = this;
  if(e === this__8749.edit) {
    return inode__8750
  }else {
    var n__8751 = cljs.core.bit_count.call(null, this__8749.bitmap);
    var new_arr__8752 = cljs.core.make_array.call(null, n__8751 < 0 ? 4 : 2 * (n__8751 + 1));
    cljs.core.array_copy.call(null, this__8749.arr, 0, new_arr__8752, 0, 2 * n__8751);
    return new cljs.core.BitmapIndexedNode(e, this__8749.bitmap, new_arr__8752)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8753 = this;
  var inode__8754 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8753.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8755 = this;
  var inode__8756 = this;
  var bit__8757 = 1 << (hash >>> shift & 31);
  if((this__8755.bitmap & bit__8757) === 0) {
    return not_found
  }else {
    var idx__8758 = cljs.core.bitmap_indexed_node_index.call(null, this__8755.bitmap, bit__8757);
    var key_or_nil__8759 = this__8755.arr[2 * idx__8758];
    var val_or_node__8760 = this__8755.arr[2 * idx__8758 + 1];
    if(key_or_nil__8759 == null) {
      return val_or_node__8760.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8759)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8759, val_or_node__8760], true)
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
  var this__8761 = this;
  var inode__8762 = this;
  var bit__8763 = 1 << (hash >>> shift & 31);
  if((this__8761.bitmap & bit__8763) === 0) {
    return inode__8762
  }else {
    var idx__8764 = cljs.core.bitmap_indexed_node_index.call(null, this__8761.bitmap, bit__8763);
    var key_or_nil__8765 = this__8761.arr[2 * idx__8764];
    var val_or_node__8766 = this__8761.arr[2 * idx__8764 + 1];
    if(key_or_nil__8765 == null) {
      var n__8767 = val_or_node__8766.inode_without(shift + 5, hash, key);
      if(n__8767 === val_or_node__8766) {
        return inode__8762
      }else {
        if(!(n__8767 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8761.bitmap, cljs.core.clone_and_set.call(null, this__8761.arr, 2 * idx__8764 + 1, n__8767))
        }else {
          if(this__8761.bitmap === bit__8763) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8761.bitmap ^ bit__8763, cljs.core.remove_pair.call(null, this__8761.arr, idx__8764))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8765)) {
        return new cljs.core.BitmapIndexedNode(null, this__8761.bitmap ^ bit__8763, cljs.core.remove_pair.call(null, this__8761.arr, idx__8764))
      }else {
        if("\ufdd0'else") {
          return inode__8762
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8768 = this;
  var inode__8769 = this;
  var bit__8770 = 1 << (hash >>> shift & 31);
  var idx__8771 = cljs.core.bitmap_indexed_node_index.call(null, this__8768.bitmap, bit__8770);
  if((this__8768.bitmap & bit__8770) === 0) {
    var n__8772 = cljs.core.bit_count.call(null, this__8768.bitmap);
    if(n__8772 >= 16) {
      var nodes__8773 = cljs.core.make_array.call(null, 32);
      var jdx__8774 = hash >>> shift & 31;
      nodes__8773[jdx__8774] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8775 = 0;
      var j__8776 = 0;
      while(true) {
        if(i__8775 < 32) {
          if((this__8768.bitmap >>> i__8775 & 1) === 0) {
            var G__8791 = i__8775 + 1;
            var G__8792 = j__8776;
            i__8775 = G__8791;
            j__8776 = G__8792;
            continue
          }else {
            nodes__8773[i__8775] = !(this__8768.arr[j__8776] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8768.arr[j__8776]), this__8768.arr[j__8776], this__8768.arr[j__8776 + 1], added_leaf_QMARK_) : this__8768.arr[j__8776 + 1];
            var G__8793 = i__8775 + 1;
            var G__8794 = j__8776 + 2;
            i__8775 = G__8793;
            j__8776 = G__8794;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8772 + 1, nodes__8773)
    }else {
      var new_arr__8777 = cljs.core.make_array.call(null, 2 * (n__8772 + 1));
      cljs.core.array_copy.call(null, this__8768.arr, 0, new_arr__8777, 0, 2 * idx__8771);
      new_arr__8777[2 * idx__8771] = key;
      new_arr__8777[2 * idx__8771 + 1] = val;
      cljs.core.array_copy.call(null, this__8768.arr, 2 * idx__8771, new_arr__8777, 2 * (idx__8771 + 1), 2 * (n__8772 - idx__8771));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8768.bitmap | bit__8770, new_arr__8777)
    }
  }else {
    var key_or_nil__8778 = this__8768.arr[2 * idx__8771];
    var val_or_node__8779 = this__8768.arr[2 * idx__8771 + 1];
    if(key_or_nil__8778 == null) {
      var n__8780 = val_or_node__8779.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8780 === val_or_node__8779) {
        return inode__8769
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8768.bitmap, cljs.core.clone_and_set.call(null, this__8768.arr, 2 * idx__8771 + 1, n__8780))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8778)) {
        if(val === val_or_node__8779) {
          return inode__8769
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8768.bitmap, cljs.core.clone_and_set.call(null, this__8768.arr, 2 * idx__8771 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8768.bitmap, cljs.core.clone_and_set.call(null, this__8768.arr, 2 * idx__8771, null, 2 * idx__8771 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8778, val_or_node__8779, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8781 = this;
  var inode__8782 = this;
  var bit__8783 = 1 << (hash >>> shift & 31);
  if((this__8781.bitmap & bit__8783) === 0) {
    return not_found
  }else {
    var idx__8784 = cljs.core.bitmap_indexed_node_index.call(null, this__8781.bitmap, bit__8783);
    var key_or_nil__8785 = this__8781.arr[2 * idx__8784];
    var val_or_node__8786 = this__8781.arr[2 * idx__8784 + 1];
    if(key_or_nil__8785 == null) {
      return val_or_node__8786.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8785)) {
        return val_or_node__8786
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
  var arr__8802 = array_node.arr;
  var len__8803 = 2 * (array_node.cnt - 1);
  var new_arr__8804 = cljs.core.make_array.call(null, len__8803);
  var i__8805 = 0;
  var j__8806 = 1;
  var bitmap__8807 = 0;
  while(true) {
    if(i__8805 < len__8803) {
      if(function() {
        var and__3822__auto____8808 = !(i__8805 === idx);
        if(and__3822__auto____8808) {
          return!(arr__8802[i__8805] == null)
        }else {
          return and__3822__auto____8808
        }
      }()) {
        new_arr__8804[j__8806] = arr__8802[i__8805];
        var G__8809 = i__8805 + 1;
        var G__8810 = j__8806 + 2;
        var G__8811 = bitmap__8807 | 1 << i__8805;
        i__8805 = G__8809;
        j__8806 = G__8810;
        bitmap__8807 = G__8811;
        continue
      }else {
        var G__8812 = i__8805 + 1;
        var G__8813 = j__8806;
        var G__8814 = bitmap__8807;
        i__8805 = G__8812;
        j__8806 = G__8813;
        bitmap__8807 = G__8814;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8807, new_arr__8804)
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
  var this__8815 = this;
  var inode__8816 = this;
  var idx__8817 = hash >>> shift & 31;
  var node__8818 = this__8815.arr[idx__8817];
  if(node__8818 == null) {
    var editable__8819 = cljs.core.edit_and_set.call(null, inode__8816, edit, idx__8817, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8819.cnt = editable__8819.cnt + 1;
    return editable__8819
  }else {
    var n__8820 = node__8818.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8820 === node__8818) {
      return inode__8816
    }else {
      return cljs.core.edit_and_set.call(null, inode__8816, edit, idx__8817, n__8820)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8821 = this;
  var inode__8822 = this;
  return cljs.core.create_array_node_seq.call(null, this__8821.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8823 = this;
  var inode__8824 = this;
  var idx__8825 = hash >>> shift & 31;
  var node__8826 = this__8823.arr[idx__8825];
  if(node__8826 == null) {
    return inode__8824
  }else {
    var n__8827 = node__8826.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8827 === node__8826) {
      return inode__8824
    }else {
      if(n__8827 == null) {
        if(this__8823.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8824, edit, idx__8825)
        }else {
          var editable__8828 = cljs.core.edit_and_set.call(null, inode__8824, edit, idx__8825, n__8827);
          editable__8828.cnt = editable__8828.cnt - 1;
          return editable__8828
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8824, edit, idx__8825, n__8827)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8829 = this;
  var inode__8830 = this;
  if(e === this__8829.edit) {
    return inode__8830
  }else {
    return new cljs.core.ArrayNode(e, this__8829.cnt, this__8829.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8831 = this;
  var inode__8832 = this;
  var len__8833 = this__8831.arr.length;
  var i__8834 = 0;
  var init__8835 = init;
  while(true) {
    if(i__8834 < len__8833) {
      var node__8836 = this__8831.arr[i__8834];
      if(!(node__8836 == null)) {
        var init__8837 = node__8836.kv_reduce(f, init__8835);
        if(cljs.core.reduced_QMARK_.call(null, init__8837)) {
          return cljs.core.deref.call(null, init__8837)
        }else {
          var G__8856 = i__8834 + 1;
          var G__8857 = init__8837;
          i__8834 = G__8856;
          init__8835 = G__8857;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8835
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8838 = this;
  var inode__8839 = this;
  var idx__8840 = hash >>> shift & 31;
  var node__8841 = this__8838.arr[idx__8840];
  if(!(node__8841 == null)) {
    return node__8841.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8842 = this;
  var inode__8843 = this;
  var idx__8844 = hash >>> shift & 31;
  var node__8845 = this__8842.arr[idx__8844];
  if(!(node__8845 == null)) {
    var n__8846 = node__8845.inode_without(shift + 5, hash, key);
    if(n__8846 === node__8845) {
      return inode__8843
    }else {
      if(n__8846 == null) {
        if(this__8842.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8843, null, idx__8844)
        }else {
          return new cljs.core.ArrayNode(null, this__8842.cnt - 1, cljs.core.clone_and_set.call(null, this__8842.arr, idx__8844, n__8846))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8842.cnt, cljs.core.clone_and_set.call(null, this__8842.arr, idx__8844, n__8846))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8843
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8847 = this;
  var inode__8848 = this;
  var idx__8849 = hash >>> shift & 31;
  var node__8850 = this__8847.arr[idx__8849];
  if(node__8850 == null) {
    return new cljs.core.ArrayNode(null, this__8847.cnt + 1, cljs.core.clone_and_set.call(null, this__8847.arr, idx__8849, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8851 = node__8850.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8851 === node__8850) {
      return inode__8848
    }else {
      return new cljs.core.ArrayNode(null, this__8847.cnt, cljs.core.clone_and_set.call(null, this__8847.arr, idx__8849, n__8851))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8852 = this;
  var inode__8853 = this;
  var idx__8854 = hash >>> shift & 31;
  var node__8855 = this__8852.arr[idx__8854];
  if(!(node__8855 == null)) {
    return node__8855.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8860 = 2 * cnt;
  var i__8861 = 0;
  while(true) {
    if(i__8861 < lim__8860) {
      if(cljs.core.key_test.call(null, key, arr[i__8861])) {
        return i__8861
      }else {
        var G__8862 = i__8861 + 2;
        i__8861 = G__8862;
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
  var this__8863 = this;
  var inode__8864 = this;
  if(hash === this__8863.collision_hash) {
    var idx__8865 = cljs.core.hash_collision_node_find_index.call(null, this__8863.arr, this__8863.cnt, key);
    if(idx__8865 === -1) {
      if(this__8863.arr.length > 2 * this__8863.cnt) {
        var editable__8866 = cljs.core.edit_and_set.call(null, inode__8864, edit, 2 * this__8863.cnt, key, 2 * this__8863.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8866.cnt = editable__8866.cnt + 1;
        return editable__8866
      }else {
        var len__8867 = this__8863.arr.length;
        var new_arr__8868 = cljs.core.make_array.call(null, len__8867 + 2);
        cljs.core.array_copy.call(null, this__8863.arr, 0, new_arr__8868, 0, len__8867);
        new_arr__8868[len__8867] = key;
        new_arr__8868[len__8867 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8864.ensure_editable_array(edit, this__8863.cnt + 1, new_arr__8868)
      }
    }else {
      if(this__8863.arr[idx__8865 + 1] === val) {
        return inode__8864
      }else {
        return cljs.core.edit_and_set.call(null, inode__8864, edit, idx__8865 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8863.collision_hash >>> shift & 31), [null, inode__8864, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8869 = this;
  var inode__8870 = this;
  return cljs.core.create_inode_seq.call(null, this__8869.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8871 = this;
  var inode__8872 = this;
  var idx__8873 = cljs.core.hash_collision_node_find_index.call(null, this__8871.arr, this__8871.cnt, key);
  if(idx__8873 === -1) {
    return inode__8872
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8871.cnt === 1) {
      return null
    }else {
      var editable__8874 = inode__8872.ensure_editable(edit);
      var earr__8875 = editable__8874.arr;
      earr__8875[idx__8873] = earr__8875[2 * this__8871.cnt - 2];
      earr__8875[idx__8873 + 1] = earr__8875[2 * this__8871.cnt - 1];
      earr__8875[2 * this__8871.cnt - 1] = null;
      earr__8875[2 * this__8871.cnt - 2] = null;
      editable__8874.cnt = editable__8874.cnt - 1;
      return editable__8874
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8876 = this;
  var inode__8877 = this;
  if(e === this__8876.edit) {
    return inode__8877
  }else {
    var new_arr__8878 = cljs.core.make_array.call(null, 2 * (this__8876.cnt + 1));
    cljs.core.array_copy.call(null, this__8876.arr, 0, new_arr__8878, 0, 2 * this__8876.cnt);
    return new cljs.core.HashCollisionNode(e, this__8876.collision_hash, this__8876.cnt, new_arr__8878)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8879 = this;
  var inode__8880 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8879.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8881 = this;
  var inode__8882 = this;
  var idx__8883 = cljs.core.hash_collision_node_find_index.call(null, this__8881.arr, this__8881.cnt, key);
  if(idx__8883 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8881.arr[idx__8883])) {
      return cljs.core.PersistentVector.fromArray([this__8881.arr[idx__8883], this__8881.arr[idx__8883 + 1]], true)
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
  var this__8884 = this;
  var inode__8885 = this;
  var idx__8886 = cljs.core.hash_collision_node_find_index.call(null, this__8884.arr, this__8884.cnt, key);
  if(idx__8886 === -1) {
    return inode__8885
  }else {
    if(this__8884.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8884.collision_hash, this__8884.cnt - 1, cljs.core.remove_pair.call(null, this__8884.arr, cljs.core.quot.call(null, idx__8886, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8887 = this;
  var inode__8888 = this;
  if(hash === this__8887.collision_hash) {
    var idx__8889 = cljs.core.hash_collision_node_find_index.call(null, this__8887.arr, this__8887.cnt, key);
    if(idx__8889 === -1) {
      var len__8890 = this__8887.arr.length;
      var new_arr__8891 = cljs.core.make_array.call(null, len__8890 + 2);
      cljs.core.array_copy.call(null, this__8887.arr, 0, new_arr__8891, 0, len__8890);
      new_arr__8891[len__8890] = key;
      new_arr__8891[len__8890 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8887.collision_hash, this__8887.cnt + 1, new_arr__8891)
    }else {
      if(cljs.core._EQ_.call(null, this__8887.arr[idx__8889], val)) {
        return inode__8888
      }else {
        return new cljs.core.HashCollisionNode(null, this__8887.collision_hash, this__8887.cnt, cljs.core.clone_and_set.call(null, this__8887.arr, idx__8889 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8887.collision_hash >>> shift & 31), [null, inode__8888])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8892 = this;
  var inode__8893 = this;
  var idx__8894 = cljs.core.hash_collision_node_find_index.call(null, this__8892.arr, this__8892.cnt, key);
  if(idx__8894 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8892.arr[idx__8894])) {
      return this__8892.arr[idx__8894 + 1]
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
  var this__8895 = this;
  var inode__8896 = this;
  if(e === this__8895.edit) {
    this__8895.arr = array;
    this__8895.cnt = count;
    return inode__8896
  }else {
    return new cljs.core.HashCollisionNode(this__8895.edit, this__8895.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8901 = cljs.core.hash.call(null, key1);
    if(key1hash__8901 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8901, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8902 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8901, key1, val1, added_leaf_QMARK___8902).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8902)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8903 = cljs.core.hash.call(null, key1);
    if(key1hash__8903 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8903, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8904 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8903, key1, val1, added_leaf_QMARK___8904).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8904)
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
  var this__8905 = this;
  var h__2192__auto____8906 = this__8905.__hash;
  if(!(h__2192__auto____8906 == null)) {
    return h__2192__auto____8906
  }else {
    var h__2192__auto____8907 = cljs.core.hash_coll.call(null, coll);
    this__8905.__hash = h__2192__auto____8907;
    return h__2192__auto____8907
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8908 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8909 = this;
  var this__8910 = this;
  return cljs.core.pr_str.call(null, this__8910)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8911 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8912 = this;
  if(this__8912.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8912.nodes[this__8912.i], this__8912.nodes[this__8912.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8912.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8913 = this;
  if(this__8913.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8913.nodes, this__8913.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8913.nodes, this__8913.i, cljs.core.next.call(null, this__8913.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8914 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8915 = this;
  return new cljs.core.NodeSeq(meta, this__8915.nodes, this__8915.i, this__8915.s, this__8915.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8916 = this;
  return this__8916.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8917 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8917.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8924 = nodes.length;
      var j__8925 = i;
      while(true) {
        if(j__8925 < len__8924) {
          if(!(nodes[j__8925] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8925, null, null)
          }else {
            var temp__3971__auto____8926 = nodes[j__8925 + 1];
            if(cljs.core.truth_(temp__3971__auto____8926)) {
              var node__8927 = temp__3971__auto____8926;
              var temp__3971__auto____8928 = node__8927.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____8928)) {
                var node_seq__8929 = temp__3971__auto____8928;
                return new cljs.core.NodeSeq(null, nodes, j__8925 + 2, node_seq__8929, null)
              }else {
                var G__8930 = j__8925 + 2;
                j__8925 = G__8930;
                continue
              }
            }else {
              var G__8931 = j__8925 + 2;
              j__8925 = G__8931;
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
  var this__8932 = this;
  var h__2192__auto____8933 = this__8932.__hash;
  if(!(h__2192__auto____8933 == null)) {
    return h__2192__auto____8933
  }else {
    var h__2192__auto____8934 = cljs.core.hash_coll.call(null, coll);
    this__8932.__hash = h__2192__auto____8934;
    return h__2192__auto____8934
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8935 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8936 = this;
  var this__8937 = this;
  return cljs.core.pr_str.call(null, this__8937)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8938 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8939 = this;
  return cljs.core.first.call(null, this__8939.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8940 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8940.nodes, this__8940.i, cljs.core.next.call(null, this__8940.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8941 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8942 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8942.nodes, this__8942.i, this__8942.s, this__8942.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8943 = this;
  return this__8943.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8944 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8944.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8951 = nodes.length;
      var j__8952 = i;
      while(true) {
        if(j__8952 < len__8951) {
          var temp__3971__auto____8953 = nodes[j__8952];
          if(cljs.core.truth_(temp__3971__auto____8953)) {
            var nj__8954 = temp__3971__auto____8953;
            var temp__3971__auto____8955 = nj__8954.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____8955)) {
              var ns__8956 = temp__3971__auto____8955;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8952 + 1, ns__8956, null)
            }else {
              var G__8957 = j__8952 + 1;
              j__8952 = G__8957;
              continue
            }
          }else {
            var G__8958 = j__8952 + 1;
            j__8952 = G__8958;
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
  var this__8961 = this;
  return new cljs.core.TransientHashMap({}, this__8961.root, this__8961.cnt, this__8961.has_nil_QMARK_, this__8961.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8962 = this;
  var h__2192__auto____8963 = this__8962.__hash;
  if(!(h__2192__auto____8963 == null)) {
    return h__2192__auto____8963
  }else {
    var h__2192__auto____8964 = cljs.core.hash_imap.call(null, coll);
    this__8962.__hash = h__2192__auto____8964;
    return h__2192__auto____8964
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8965 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8966 = this;
  if(k == null) {
    if(this__8966.has_nil_QMARK_) {
      return this__8966.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8966.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8966.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8967 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____8968 = this__8967.has_nil_QMARK_;
      if(and__3822__auto____8968) {
        return v === this__8967.nil_val
      }else {
        return and__3822__auto____8968
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8967.meta, this__8967.has_nil_QMARK_ ? this__8967.cnt : this__8967.cnt + 1, this__8967.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8969 = new cljs.core.Box(false);
    var new_root__8970 = (this__8967.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8967.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8969);
    if(new_root__8970 === this__8967.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8967.meta, added_leaf_QMARK___8969.val ? this__8967.cnt + 1 : this__8967.cnt, new_root__8970, this__8967.has_nil_QMARK_, this__8967.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8971 = this;
  if(k == null) {
    return this__8971.has_nil_QMARK_
  }else {
    if(this__8971.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__8971.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__8994 = null;
  var G__8994__2 = function(this_sym8972, k) {
    var this__8974 = this;
    var this_sym8972__8975 = this;
    var coll__8976 = this_sym8972__8975;
    return coll__8976.cljs$core$ILookup$_lookup$arity$2(coll__8976, k)
  };
  var G__8994__3 = function(this_sym8973, k, not_found) {
    var this__8974 = this;
    var this_sym8973__8977 = this;
    var coll__8978 = this_sym8973__8977;
    return coll__8978.cljs$core$ILookup$_lookup$arity$3(coll__8978, k, not_found)
  };
  G__8994 = function(this_sym8973, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8994__2.call(this, this_sym8973, k);
      case 3:
        return G__8994__3.call(this, this_sym8973, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8994
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8959, args8960) {
  var this__8979 = this;
  return this_sym8959.call.apply(this_sym8959, [this_sym8959].concat(args8960.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8980 = this;
  var init__8981 = this__8980.has_nil_QMARK_ ? f.call(null, init, null, this__8980.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__8981)) {
    return cljs.core.deref.call(null, init__8981)
  }else {
    if(!(this__8980.root == null)) {
      return this__8980.root.kv_reduce(f, init__8981)
    }else {
      if("\ufdd0'else") {
        return init__8981
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8982 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__8983 = this;
  var this__8984 = this;
  return cljs.core.pr_str.call(null, this__8984)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8985 = this;
  if(this__8985.cnt > 0) {
    var s__8986 = !(this__8985.root == null) ? this__8985.root.inode_seq() : null;
    if(this__8985.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__8985.nil_val], true), s__8986)
    }else {
      return s__8986
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8987 = this;
  return this__8987.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8988 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8989 = this;
  return new cljs.core.PersistentHashMap(meta, this__8989.cnt, this__8989.root, this__8989.has_nil_QMARK_, this__8989.nil_val, this__8989.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8990 = this;
  return this__8990.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8991 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__8991.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8992 = this;
  if(k == null) {
    if(this__8992.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__8992.meta, this__8992.cnt - 1, this__8992.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__8992.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__8993 = this__8992.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__8993 === this__8992.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__8992.meta, this__8992.cnt - 1, new_root__8993, this__8992.has_nil_QMARK_, this__8992.nil_val, null)
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
  var len__8995 = ks.length;
  var i__8996 = 0;
  var out__8997 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__8996 < len__8995) {
      var G__8998 = i__8996 + 1;
      var G__8999 = cljs.core.assoc_BANG_.call(null, out__8997, ks[i__8996], vs[i__8996]);
      i__8996 = G__8998;
      out__8997 = G__8999;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8997)
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
  var this__9000 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9001 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9002 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9003 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9004 = this;
  if(k == null) {
    if(this__9004.has_nil_QMARK_) {
      return this__9004.nil_val
    }else {
      return null
    }
  }else {
    if(this__9004.root == null) {
      return null
    }else {
      return this__9004.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9005 = this;
  if(k == null) {
    if(this__9005.has_nil_QMARK_) {
      return this__9005.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9005.root == null) {
      return not_found
    }else {
      return this__9005.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9006 = this;
  if(this__9006.edit) {
    return this__9006.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9007 = this;
  var tcoll__9008 = this;
  if(this__9007.edit) {
    if(function() {
      var G__9009__9010 = o;
      if(G__9009__9010) {
        if(function() {
          var or__3824__auto____9011 = G__9009__9010.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9011) {
            return or__3824__auto____9011
          }else {
            return G__9009__9010.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9009__9010.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9009__9010)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9009__9010)
      }
    }()) {
      return tcoll__9008.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9012 = cljs.core.seq.call(null, o);
      var tcoll__9013 = tcoll__9008;
      while(true) {
        var temp__3971__auto____9014 = cljs.core.first.call(null, es__9012);
        if(cljs.core.truth_(temp__3971__auto____9014)) {
          var e__9015 = temp__3971__auto____9014;
          var G__9026 = cljs.core.next.call(null, es__9012);
          var G__9027 = tcoll__9013.assoc_BANG_(cljs.core.key.call(null, e__9015), cljs.core.val.call(null, e__9015));
          es__9012 = G__9026;
          tcoll__9013 = G__9027;
          continue
        }else {
          return tcoll__9013
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9016 = this;
  var tcoll__9017 = this;
  if(this__9016.edit) {
    if(k == null) {
      if(this__9016.nil_val === v) {
      }else {
        this__9016.nil_val = v
      }
      if(this__9016.has_nil_QMARK_) {
      }else {
        this__9016.count = this__9016.count + 1;
        this__9016.has_nil_QMARK_ = true
      }
      return tcoll__9017
    }else {
      var added_leaf_QMARK___9018 = new cljs.core.Box(false);
      var node__9019 = (this__9016.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9016.root).inode_assoc_BANG_(this__9016.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9018);
      if(node__9019 === this__9016.root) {
      }else {
        this__9016.root = node__9019
      }
      if(added_leaf_QMARK___9018.val) {
        this__9016.count = this__9016.count + 1
      }else {
      }
      return tcoll__9017
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9020 = this;
  var tcoll__9021 = this;
  if(this__9020.edit) {
    if(k == null) {
      if(this__9020.has_nil_QMARK_) {
        this__9020.has_nil_QMARK_ = false;
        this__9020.nil_val = null;
        this__9020.count = this__9020.count - 1;
        return tcoll__9021
      }else {
        return tcoll__9021
      }
    }else {
      if(this__9020.root == null) {
        return tcoll__9021
      }else {
        var removed_leaf_QMARK___9022 = new cljs.core.Box(false);
        var node__9023 = this__9020.root.inode_without_BANG_(this__9020.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9022);
        if(node__9023 === this__9020.root) {
        }else {
          this__9020.root = node__9023
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9022[0])) {
          this__9020.count = this__9020.count - 1
        }else {
        }
        return tcoll__9021
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9024 = this;
  var tcoll__9025 = this;
  if(this__9024.edit) {
    this__9024.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9024.count, this__9024.root, this__9024.has_nil_QMARK_, this__9024.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9030 = node;
  var stack__9031 = stack;
  while(true) {
    if(!(t__9030 == null)) {
      var G__9032 = ascending_QMARK_ ? t__9030.left : t__9030.right;
      var G__9033 = cljs.core.conj.call(null, stack__9031, t__9030);
      t__9030 = G__9032;
      stack__9031 = G__9033;
      continue
    }else {
      return stack__9031
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
  var this__9034 = this;
  var h__2192__auto____9035 = this__9034.__hash;
  if(!(h__2192__auto____9035 == null)) {
    return h__2192__auto____9035
  }else {
    var h__2192__auto____9036 = cljs.core.hash_coll.call(null, coll);
    this__9034.__hash = h__2192__auto____9036;
    return h__2192__auto____9036
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9037 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9038 = this;
  var this__9039 = this;
  return cljs.core.pr_str.call(null, this__9039)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9040 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9041 = this;
  if(this__9041.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9041.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9042 = this;
  return cljs.core.peek.call(null, this__9042.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9043 = this;
  var t__9044 = cljs.core.first.call(null, this__9043.stack);
  var next_stack__9045 = cljs.core.tree_map_seq_push.call(null, this__9043.ascending_QMARK_ ? t__9044.right : t__9044.left, cljs.core.next.call(null, this__9043.stack), this__9043.ascending_QMARK_);
  if(!(next_stack__9045 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9045, this__9043.ascending_QMARK_, this__9043.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9046 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9047 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9047.stack, this__9047.ascending_QMARK_, this__9047.cnt, this__9047.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9048 = this;
  return this__9048.meta
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
        var and__3822__auto____9050 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9050) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9050
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
        var and__3822__auto____9052 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9052) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9052
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
  var init__9056 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9056)) {
    return cljs.core.deref.call(null, init__9056)
  }else {
    var init__9057 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9056) : init__9056;
    if(cljs.core.reduced_QMARK_.call(null, init__9057)) {
      return cljs.core.deref.call(null, init__9057)
    }else {
      var init__9058 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9057) : init__9057;
      if(cljs.core.reduced_QMARK_.call(null, init__9058)) {
        return cljs.core.deref.call(null, init__9058)
      }else {
        return init__9058
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
  var this__9061 = this;
  var h__2192__auto____9062 = this__9061.__hash;
  if(!(h__2192__auto____9062 == null)) {
    return h__2192__auto____9062
  }else {
    var h__2192__auto____9063 = cljs.core.hash_coll.call(null, coll);
    this__9061.__hash = h__2192__auto____9063;
    return h__2192__auto____9063
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9064 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9065 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9066 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9066.key, this__9066.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9114 = null;
  var G__9114__2 = function(this_sym9067, k) {
    var this__9069 = this;
    var this_sym9067__9070 = this;
    var node__9071 = this_sym9067__9070;
    return node__9071.cljs$core$ILookup$_lookup$arity$2(node__9071, k)
  };
  var G__9114__3 = function(this_sym9068, k, not_found) {
    var this__9069 = this;
    var this_sym9068__9072 = this;
    var node__9073 = this_sym9068__9072;
    return node__9073.cljs$core$ILookup$_lookup$arity$3(node__9073, k, not_found)
  };
  G__9114 = function(this_sym9068, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9114__2.call(this, this_sym9068, k);
      case 3:
        return G__9114__3.call(this, this_sym9068, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9114
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9059, args9060) {
  var this__9074 = this;
  return this_sym9059.call.apply(this_sym9059, [this_sym9059].concat(args9060.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9075 = this;
  return cljs.core.PersistentVector.fromArray([this__9075.key, this__9075.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9076 = this;
  return this__9076.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9077 = this;
  return this__9077.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9078 = this;
  var node__9079 = this;
  return ins.balance_right(node__9079)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9080 = this;
  var node__9081 = this;
  return new cljs.core.RedNode(this__9080.key, this__9080.val, this__9080.left, this__9080.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9082 = this;
  var node__9083 = this;
  return cljs.core.balance_right_del.call(null, this__9082.key, this__9082.val, this__9082.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9084 = this;
  var node__9085 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9086 = this;
  var node__9087 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9087, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9088 = this;
  var node__9089 = this;
  return cljs.core.balance_left_del.call(null, this__9088.key, this__9088.val, del, this__9088.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9090 = this;
  var node__9091 = this;
  return ins.balance_left(node__9091)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9092 = this;
  var node__9093 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9093, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9115 = null;
  var G__9115__0 = function() {
    var this__9094 = this;
    var this__9096 = this;
    return cljs.core.pr_str.call(null, this__9096)
  };
  G__9115 = function() {
    switch(arguments.length) {
      case 0:
        return G__9115__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9115
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9097 = this;
  var node__9098 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9098, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9099 = this;
  var node__9100 = this;
  return node__9100
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9101 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9102 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9103 = this;
  return cljs.core.list.call(null, this__9103.key, this__9103.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9104 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9105 = this;
  return this__9105.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9106 = this;
  return cljs.core.PersistentVector.fromArray([this__9106.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9107 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9107.key, this__9107.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9108 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9109 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9109.key, this__9109.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9110 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9111 = this;
  if(n === 0) {
    return this__9111.key
  }else {
    if(n === 1) {
      return this__9111.val
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
  var this__9112 = this;
  if(n === 0) {
    return this__9112.key
  }else {
    if(n === 1) {
      return this__9112.val
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
  var this__9113 = this;
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
  var this__9118 = this;
  var h__2192__auto____9119 = this__9118.__hash;
  if(!(h__2192__auto____9119 == null)) {
    return h__2192__auto____9119
  }else {
    var h__2192__auto____9120 = cljs.core.hash_coll.call(null, coll);
    this__9118.__hash = h__2192__auto____9120;
    return h__2192__auto____9120
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9121 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9122 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9123 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9123.key, this__9123.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9171 = null;
  var G__9171__2 = function(this_sym9124, k) {
    var this__9126 = this;
    var this_sym9124__9127 = this;
    var node__9128 = this_sym9124__9127;
    return node__9128.cljs$core$ILookup$_lookup$arity$2(node__9128, k)
  };
  var G__9171__3 = function(this_sym9125, k, not_found) {
    var this__9126 = this;
    var this_sym9125__9129 = this;
    var node__9130 = this_sym9125__9129;
    return node__9130.cljs$core$ILookup$_lookup$arity$3(node__9130, k, not_found)
  };
  G__9171 = function(this_sym9125, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9171__2.call(this, this_sym9125, k);
      case 3:
        return G__9171__3.call(this, this_sym9125, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9171
}();
cljs.core.RedNode.prototype.apply = function(this_sym9116, args9117) {
  var this__9131 = this;
  return this_sym9116.call.apply(this_sym9116, [this_sym9116].concat(args9117.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9132 = this;
  return cljs.core.PersistentVector.fromArray([this__9132.key, this__9132.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9133 = this;
  return this__9133.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9134 = this;
  return this__9134.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9135 = this;
  var node__9136 = this;
  return new cljs.core.RedNode(this__9135.key, this__9135.val, this__9135.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9137 = this;
  var node__9138 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9139 = this;
  var node__9140 = this;
  return new cljs.core.RedNode(this__9139.key, this__9139.val, this__9139.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9141 = this;
  var node__9142 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9143 = this;
  var node__9144 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9144, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9145 = this;
  var node__9146 = this;
  return new cljs.core.RedNode(this__9145.key, this__9145.val, del, this__9145.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9147 = this;
  var node__9148 = this;
  return new cljs.core.RedNode(this__9147.key, this__9147.val, ins, this__9147.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9149 = this;
  var node__9150 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9149.left)) {
    return new cljs.core.RedNode(this__9149.key, this__9149.val, this__9149.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9149.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9149.right)) {
      return new cljs.core.RedNode(this__9149.right.key, this__9149.right.val, new cljs.core.BlackNode(this__9149.key, this__9149.val, this__9149.left, this__9149.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9149.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9150, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9172 = null;
  var G__9172__0 = function() {
    var this__9151 = this;
    var this__9153 = this;
    return cljs.core.pr_str.call(null, this__9153)
  };
  G__9172 = function() {
    switch(arguments.length) {
      case 0:
        return G__9172__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9172
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9154 = this;
  var node__9155 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9154.right)) {
    return new cljs.core.RedNode(this__9154.key, this__9154.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9154.left, null), this__9154.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9154.left)) {
      return new cljs.core.RedNode(this__9154.left.key, this__9154.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9154.left.left, null), new cljs.core.BlackNode(this__9154.key, this__9154.val, this__9154.left.right, this__9154.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9155, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9156 = this;
  var node__9157 = this;
  return new cljs.core.BlackNode(this__9156.key, this__9156.val, this__9156.left, this__9156.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9158 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9159 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9160 = this;
  return cljs.core.list.call(null, this__9160.key, this__9160.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9161 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9162 = this;
  return this__9162.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9163 = this;
  return cljs.core.PersistentVector.fromArray([this__9163.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9164 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9164.key, this__9164.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9165 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9166 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9166.key, this__9166.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9167 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9168 = this;
  if(n === 0) {
    return this__9168.key
  }else {
    if(n === 1) {
      return this__9168.val
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
  var this__9169 = this;
  if(n === 0) {
    return this__9169.key
  }else {
    if(n === 1) {
      return this__9169.val
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
  var this__9170 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9176 = comp.call(null, k, tree.key);
    if(c__9176 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9176 < 0) {
        var ins__9177 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9177 == null)) {
          return tree.add_left(ins__9177)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9178 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9178 == null)) {
            return tree.add_right(ins__9178)
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
          var app__9181 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9181)) {
            return new cljs.core.RedNode(app__9181.key, app__9181.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9181.left, null), new cljs.core.RedNode(right.key, right.val, app__9181.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9181, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9182 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9182)) {
              return new cljs.core.RedNode(app__9182.key, app__9182.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9182.left, null), new cljs.core.BlackNode(right.key, right.val, app__9182.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9182, right.right, null))
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
    var c__9188 = comp.call(null, k, tree.key);
    if(c__9188 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9188 < 0) {
        var del__9189 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9190 = !(del__9189 == null);
          if(or__3824__auto____9190) {
            return or__3824__auto____9190
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9189, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9189, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9191 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9192 = !(del__9191 == null);
            if(or__3824__auto____9192) {
              return or__3824__auto____9192
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9191)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9191, null)
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
  var tk__9195 = tree.key;
  var c__9196 = comp.call(null, k, tk__9195);
  if(c__9196 === 0) {
    return tree.replace(tk__9195, v, tree.left, tree.right)
  }else {
    if(c__9196 < 0) {
      return tree.replace(tk__9195, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9195, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__9199 = this;
  var h__2192__auto____9200 = this__9199.__hash;
  if(!(h__2192__auto____9200 == null)) {
    return h__2192__auto____9200
  }else {
    var h__2192__auto____9201 = cljs.core.hash_imap.call(null, coll);
    this__9199.__hash = h__2192__auto____9201;
    return h__2192__auto____9201
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9202 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9203 = this;
  var n__9204 = coll.entry_at(k);
  if(!(n__9204 == null)) {
    return n__9204.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9205 = this;
  var found__9206 = [null];
  var t__9207 = cljs.core.tree_map_add.call(null, this__9205.comp, this__9205.tree, k, v, found__9206);
  if(t__9207 == null) {
    var found_node__9208 = cljs.core.nth.call(null, found__9206, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9208.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9205.comp, cljs.core.tree_map_replace.call(null, this__9205.comp, this__9205.tree, k, v), this__9205.cnt, this__9205.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9205.comp, t__9207.blacken(), this__9205.cnt + 1, this__9205.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9209 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9243 = null;
  var G__9243__2 = function(this_sym9210, k) {
    var this__9212 = this;
    var this_sym9210__9213 = this;
    var coll__9214 = this_sym9210__9213;
    return coll__9214.cljs$core$ILookup$_lookup$arity$2(coll__9214, k)
  };
  var G__9243__3 = function(this_sym9211, k, not_found) {
    var this__9212 = this;
    var this_sym9211__9215 = this;
    var coll__9216 = this_sym9211__9215;
    return coll__9216.cljs$core$ILookup$_lookup$arity$3(coll__9216, k, not_found)
  };
  G__9243 = function(this_sym9211, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9243__2.call(this, this_sym9211, k);
      case 3:
        return G__9243__3.call(this, this_sym9211, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9243
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9197, args9198) {
  var this__9217 = this;
  return this_sym9197.call.apply(this_sym9197, [this_sym9197].concat(args9198.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9218 = this;
  if(!(this__9218.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9218.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9219 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9220 = this;
  if(this__9220.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9220.tree, false, this__9220.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9221 = this;
  var this__9222 = this;
  return cljs.core.pr_str.call(null, this__9222)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9223 = this;
  var coll__9224 = this;
  var t__9225 = this__9223.tree;
  while(true) {
    if(!(t__9225 == null)) {
      var c__9226 = this__9223.comp.call(null, k, t__9225.key);
      if(c__9226 === 0) {
        return t__9225
      }else {
        if(c__9226 < 0) {
          var G__9244 = t__9225.left;
          t__9225 = G__9244;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9245 = t__9225.right;
            t__9225 = G__9245;
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
  var this__9227 = this;
  if(this__9227.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9227.tree, ascending_QMARK_, this__9227.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9228 = this;
  if(this__9228.cnt > 0) {
    var stack__9229 = null;
    var t__9230 = this__9228.tree;
    while(true) {
      if(!(t__9230 == null)) {
        var c__9231 = this__9228.comp.call(null, k, t__9230.key);
        if(c__9231 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9229, t__9230), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9231 < 0) {
              var G__9246 = cljs.core.conj.call(null, stack__9229, t__9230);
              var G__9247 = t__9230.left;
              stack__9229 = G__9246;
              t__9230 = G__9247;
              continue
            }else {
              var G__9248 = stack__9229;
              var G__9249 = t__9230.right;
              stack__9229 = G__9248;
              t__9230 = G__9249;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9231 > 0) {
                var G__9250 = cljs.core.conj.call(null, stack__9229, t__9230);
                var G__9251 = t__9230.right;
                stack__9229 = G__9250;
                t__9230 = G__9251;
                continue
              }else {
                var G__9252 = stack__9229;
                var G__9253 = t__9230.left;
                stack__9229 = G__9252;
                t__9230 = G__9253;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9229 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9229, ascending_QMARK_, -1, null)
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
  var this__9232 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9233 = this;
  return this__9233.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9234 = this;
  if(this__9234.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9234.tree, true, this__9234.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9235 = this;
  return this__9235.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9236 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9237 = this;
  return new cljs.core.PersistentTreeMap(this__9237.comp, this__9237.tree, this__9237.cnt, meta, this__9237.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9238 = this;
  return this__9238.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9239 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9239.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9240 = this;
  var found__9241 = [null];
  var t__9242 = cljs.core.tree_map_remove.call(null, this__9240.comp, this__9240.tree, k, found__9241);
  if(t__9242 == null) {
    if(cljs.core.nth.call(null, found__9241, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9240.comp, null, 0, this__9240.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9240.comp, t__9242.blacken(), this__9240.cnt - 1, this__9240.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9256 = cljs.core.seq.call(null, keyvals);
    var out__9257 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9256) {
        var G__9258 = cljs.core.nnext.call(null, in__9256);
        var G__9259 = cljs.core.assoc_BANG_.call(null, out__9257, cljs.core.first.call(null, in__9256), cljs.core.second.call(null, in__9256));
        in__9256 = G__9258;
        out__9257 = G__9259;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9257)
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
  hash_map.cljs$lang$applyTo = function(arglist__9260) {
    var keyvals = cljs.core.seq(arglist__9260);
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
  array_map.cljs$lang$applyTo = function(arglist__9261) {
    var keyvals = cljs.core.seq(arglist__9261);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9265 = [];
    var obj__9266 = {};
    var kvs__9267 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9267) {
        ks__9265.push(cljs.core.first.call(null, kvs__9267));
        obj__9266[cljs.core.first.call(null, kvs__9267)] = cljs.core.second.call(null, kvs__9267);
        var G__9268 = cljs.core.nnext.call(null, kvs__9267);
        kvs__9267 = G__9268;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9265, obj__9266)
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
  obj_map.cljs$lang$applyTo = function(arglist__9269) {
    var keyvals = cljs.core.seq(arglist__9269);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9272 = cljs.core.seq.call(null, keyvals);
    var out__9273 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9272) {
        var G__9274 = cljs.core.nnext.call(null, in__9272);
        var G__9275 = cljs.core.assoc.call(null, out__9273, cljs.core.first.call(null, in__9272), cljs.core.second.call(null, in__9272));
        in__9272 = G__9274;
        out__9273 = G__9275;
        continue
      }else {
        return out__9273
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
  sorted_map.cljs$lang$applyTo = function(arglist__9276) {
    var keyvals = cljs.core.seq(arglist__9276);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9279 = cljs.core.seq.call(null, keyvals);
    var out__9280 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9279) {
        var G__9281 = cljs.core.nnext.call(null, in__9279);
        var G__9282 = cljs.core.assoc.call(null, out__9280, cljs.core.first.call(null, in__9279), cljs.core.second.call(null, in__9279));
        in__9279 = G__9281;
        out__9280 = G__9282;
        continue
      }else {
        return out__9280
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__9283) {
    var comparator = cljs.core.first(arglist__9283);
    var keyvals = cljs.core.rest(arglist__9283);
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
      return cljs.core.reduce.call(null, function(p1__9284_SHARP_, p2__9285_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9287 = p1__9284_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9287)) {
            return or__3824__auto____9287
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9285_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__9288) {
    var maps = cljs.core.seq(arglist__9288);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9296 = function(m, e) {
        var k__9294 = cljs.core.first.call(null, e);
        var v__9295 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9294)) {
          return cljs.core.assoc.call(null, m, k__9294, f.call(null, cljs.core._lookup.call(null, m, k__9294, null), v__9295))
        }else {
          return cljs.core.assoc.call(null, m, k__9294, v__9295)
        }
      };
      var merge2__9298 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9296, function() {
          var or__3824__auto____9297 = m1;
          if(cljs.core.truth_(or__3824__auto____9297)) {
            return or__3824__auto____9297
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9298, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__9299) {
    var f = cljs.core.first(arglist__9299);
    var maps = cljs.core.rest(arglist__9299);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9304 = cljs.core.ObjMap.EMPTY;
  var keys__9305 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9305) {
      var key__9306 = cljs.core.first.call(null, keys__9305);
      var entry__9307 = cljs.core._lookup.call(null, map, key__9306, "\ufdd0'cljs.core/not-found");
      var G__9308 = cljs.core.not_EQ_.call(null, entry__9307, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9304, key__9306, entry__9307) : ret__9304;
      var G__9309 = cljs.core.next.call(null, keys__9305);
      ret__9304 = G__9308;
      keys__9305 = G__9309;
      continue
    }else {
      return ret__9304
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
  var this__9313 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9313.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9314 = this;
  var h__2192__auto____9315 = this__9314.__hash;
  if(!(h__2192__auto____9315 == null)) {
    return h__2192__auto____9315
  }else {
    var h__2192__auto____9316 = cljs.core.hash_iset.call(null, coll);
    this__9314.__hash = h__2192__auto____9316;
    return h__2192__auto____9316
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9317 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9318 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9318.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9339 = null;
  var G__9339__2 = function(this_sym9319, k) {
    var this__9321 = this;
    var this_sym9319__9322 = this;
    var coll__9323 = this_sym9319__9322;
    return coll__9323.cljs$core$ILookup$_lookup$arity$2(coll__9323, k)
  };
  var G__9339__3 = function(this_sym9320, k, not_found) {
    var this__9321 = this;
    var this_sym9320__9324 = this;
    var coll__9325 = this_sym9320__9324;
    return coll__9325.cljs$core$ILookup$_lookup$arity$3(coll__9325, k, not_found)
  };
  G__9339 = function(this_sym9320, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9339__2.call(this, this_sym9320, k);
      case 3:
        return G__9339__3.call(this, this_sym9320, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9339
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9311, args9312) {
  var this__9326 = this;
  return this_sym9311.call.apply(this_sym9311, [this_sym9311].concat(args9312.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9327 = this;
  return new cljs.core.PersistentHashSet(this__9327.meta, cljs.core.assoc.call(null, this__9327.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9328 = this;
  var this__9329 = this;
  return cljs.core.pr_str.call(null, this__9329)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9330 = this;
  return cljs.core.keys.call(null, this__9330.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9331 = this;
  return new cljs.core.PersistentHashSet(this__9331.meta, cljs.core.dissoc.call(null, this__9331.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9332 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9333 = this;
  var and__3822__auto____9334 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9334) {
    var and__3822__auto____9335 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9335) {
      return cljs.core.every_QMARK_.call(null, function(p1__9310_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9310_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9335
    }
  }else {
    return and__3822__auto____9334
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9336 = this;
  return new cljs.core.PersistentHashSet(meta, this__9336.hash_map, this__9336.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9337 = this;
  return this__9337.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9338 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9338.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9340 = cljs.core.count.call(null, items);
  var i__9341 = 0;
  var out__9342 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9341 < len__9340) {
      var G__9343 = i__9341 + 1;
      var G__9344 = cljs.core.conj_BANG_.call(null, out__9342, items[i__9341]);
      i__9341 = G__9343;
      out__9342 = G__9344;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9342)
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
  var G__9362 = null;
  var G__9362__2 = function(this_sym9348, k) {
    var this__9350 = this;
    var this_sym9348__9351 = this;
    var tcoll__9352 = this_sym9348__9351;
    if(cljs.core._lookup.call(null, this__9350.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9362__3 = function(this_sym9349, k, not_found) {
    var this__9350 = this;
    var this_sym9349__9353 = this;
    var tcoll__9354 = this_sym9349__9353;
    if(cljs.core._lookup.call(null, this__9350.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9362 = function(this_sym9349, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9362__2.call(this, this_sym9349, k);
      case 3:
        return G__9362__3.call(this, this_sym9349, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9362
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9346, args9347) {
  var this__9355 = this;
  return this_sym9346.call.apply(this_sym9346, [this_sym9346].concat(args9347.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9356 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9357 = this;
  if(cljs.core._lookup.call(null, this__9357.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9358 = this;
  return cljs.core.count.call(null, this__9358.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9359 = this;
  this__9359.transient_map = cljs.core.dissoc_BANG_.call(null, this__9359.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9360 = this;
  this__9360.transient_map = cljs.core.assoc_BANG_.call(null, this__9360.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9361 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9361.transient_map), null)
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
  var this__9365 = this;
  var h__2192__auto____9366 = this__9365.__hash;
  if(!(h__2192__auto____9366 == null)) {
    return h__2192__auto____9366
  }else {
    var h__2192__auto____9367 = cljs.core.hash_iset.call(null, coll);
    this__9365.__hash = h__2192__auto____9367;
    return h__2192__auto____9367
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9368 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9369 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9369.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9395 = null;
  var G__9395__2 = function(this_sym9370, k) {
    var this__9372 = this;
    var this_sym9370__9373 = this;
    var coll__9374 = this_sym9370__9373;
    return coll__9374.cljs$core$ILookup$_lookup$arity$2(coll__9374, k)
  };
  var G__9395__3 = function(this_sym9371, k, not_found) {
    var this__9372 = this;
    var this_sym9371__9375 = this;
    var coll__9376 = this_sym9371__9375;
    return coll__9376.cljs$core$ILookup$_lookup$arity$3(coll__9376, k, not_found)
  };
  G__9395 = function(this_sym9371, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9395__2.call(this, this_sym9371, k);
      case 3:
        return G__9395__3.call(this, this_sym9371, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9395
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9363, args9364) {
  var this__9377 = this;
  return this_sym9363.call.apply(this_sym9363, [this_sym9363].concat(args9364.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9378 = this;
  return new cljs.core.PersistentTreeSet(this__9378.meta, cljs.core.assoc.call(null, this__9378.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9379 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9379.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9380 = this;
  var this__9381 = this;
  return cljs.core.pr_str.call(null, this__9381)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9382 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9382.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9383 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9383.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9384 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9385 = this;
  return cljs.core._comparator.call(null, this__9385.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9386 = this;
  return cljs.core.keys.call(null, this__9386.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9387 = this;
  return new cljs.core.PersistentTreeSet(this__9387.meta, cljs.core.dissoc.call(null, this__9387.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9388 = this;
  return cljs.core.count.call(null, this__9388.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9389 = this;
  var and__3822__auto____9390 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9390) {
    var and__3822__auto____9391 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9391) {
      return cljs.core.every_QMARK_.call(null, function(p1__9345_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9345_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9391
    }
  }else {
    return and__3822__auto____9390
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9392 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9392.tree_map, this__9392.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9393 = this;
  return this__9393.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9394 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9394.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9400__delegate = function(keys) {
      var in__9398 = cljs.core.seq.call(null, keys);
      var out__9399 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9398)) {
          var G__9401 = cljs.core.next.call(null, in__9398);
          var G__9402 = cljs.core.conj_BANG_.call(null, out__9399, cljs.core.first.call(null, in__9398));
          in__9398 = G__9401;
          out__9399 = G__9402;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9399)
        }
        break
      }
    };
    var G__9400 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9400__delegate.call(this, keys)
    };
    G__9400.cljs$lang$maxFixedArity = 0;
    G__9400.cljs$lang$applyTo = function(arglist__9403) {
      var keys = cljs.core.seq(arglist__9403);
      return G__9400__delegate(keys)
    };
    G__9400.cljs$lang$arity$variadic = G__9400__delegate;
    return G__9400
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
  sorted_set.cljs$lang$applyTo = function(arglist__9404) {
    var keys = cljs.core.seq(arglist__9404);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__9406) {
    var comparator = cljs.core.first(arglist__9406);
    var keys = cljs.core.rest(arglist__9406);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9412 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9413 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9413)) {
        var e__9414 = temp__3971__auto____9413;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9414))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9412, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9405_SHARP_) {
      var temp__3971__auto____9415 = cljs.core.find.call(null, smap, p1__9405_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9415)) {
        var e__9416 = temp__3971__auto____9415;
        return cljs.core.second.call(null, e__9416)
      }else {
        return p1__9405_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9446 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9439, seen) {
        while(true) {
          var vec__9440__9441 = p__9439;
          var f__9442 = cljs.core.nth.call(null, vec__9440__9441, 0, null);
          var xs__9443 = vec__9440__9441;
          var temp__3974__auto____9444 = cljs.core.seq.call(null, xs__9443);
          if(temp__3974__auto____9444) {
            var s__9445 = temp__3974__auto____9444;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9442)) {
              var G__9447 = cljs.core.rest.call(null, s__9445);
              var G__9448 = seen;
              p__9439 = G__9447;
              seen = G__9448;
              continue
            }else {
              return cljs.core.cons.call(null, f__9442, step.call(null, cljs.core.rest.call(null, s__9445), cljs.core.conj.call(null, seen, f__9442)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9446.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9451 = cljs.core.PersistentVector.EMPTY;
  var s__9452 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9452)) {
      var G__9453 = cljs.core.conj.call(null, ret__9451, cljs.core.first.call(null, s__9452));
      var G__9454 = cljs.core.next.call(null, s__9452);
      ret__9451 = G__9453;
      s__9452 = G__9454;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9451)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9457 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9457) {
        return or__3824__auto____9457
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9458 = x.lastIndexOf("/");
      if(i__9458 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9458 + 1)
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
    var or__3824__auto____9461 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9461) {
      return or__3824__auto____9461
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9462 = x.lastIndexOf("/");
    if(i__9462 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9462)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9469 = cljs.core.ObjMap.EMPTY;
  var ks__9470 = cljs.core.seq.call(null, keys);
  var vs__9471 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9472 = ks__9470;
      if(and__3822__auto____9472) {
        return vs__9471
      }else {
        return and__3822__auto____9472
      }
    }()) {
      var G__9473 = cljs.core.assoc.call(null, map__9469, cljs.core.first.call(null, ks__9470), cljs.core.first.call(null, vs__9471));
      var G__9474 = cljs.core.next.call(null, ks__9470);
      var G__9475 = cljs.core.next.call(null, vs__9471);
      map__9469 = G__9473;
      ks__9470 = G__9474;
      vs__9471 = G__9475;
      continue
    }else {
      return map__9469
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
    var G__9478__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9463_SHARP_, p2__9464_SHARP_) {
        return max_key.call(null, k, p1__9463_SHARP_, p2__9464_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9478 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9478__delegate.call(this, k, x, y, more)
    };
    G__9478.cljs$lang$maxFixedArity = 3;
    G__9478.cljs$lang$applyTo = function(arglist__9479) {
      var k = cljs.core.first(arglist__9479);
      var x = cljs.core.first(cljs.core.next(arglist__9479));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9479)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9479)));
      return G__9478__delegate(k, x, y, more)
    };
    G__9478.cljs$lang$arity$variadic = G__9478__delegate;
    return G__9478
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
    var G__9480__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9476_SHARP_, p2__9477_SHARP_) {
        return min_key.call(null, k, p1__9476_SHARP_, p2__9477_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9480 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9480__delegate.call(this, k, x, y, more)
    };
    G__9480.cljs$lang$maxFixedArity = 3;
    G__9480.cljs$lang$applyTo = function(arglist__9481) {
      var k = cljs.core.first(arglist__9481);
      var x = cljs.core.first(cljs.core.next(arglist__9481));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9481)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9481)));
      return G__9480__delegate(k, x, y, more)
    };
    G__9480.cljs$lang$arity$variadic = G__9480__delegate;
    return G__9480
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
      var temp__3974__auto____9484 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9484) {
        var s__9485 = temp__3974__auto____9484;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9485), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9485)))
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
    var temp__3974__auto____9488 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9488) {
      var s__9489 = temp__3974__auto____9488;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9489)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9489), take_while.call(null, pred, cljs.core.rest.call(null, s__9489)))
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
    var comp__9491 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9491.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9503 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9504 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9504)) {
        var vec__9505__9506 = temp__3974__auto____9504;
        var e__9507 = cljs.core.nth.call(null, vec__9505__9506, 0, null);
        var s__9508 = vec__9505__9506;
        if(cljs.core.truth_(include__9503.call(null, e__9507))) {
          return s__9508
        }else {
          return cljs.core.next.call(null, s__9508)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9503, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9509 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9509)) {
      var vec__9510__9511 = temp__3974__auto____9509;
      var e__9512 = cljs.core.nth.call(null, vec__9510__9511, 0, null);
      var s__9513 = vec__9510__9511;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9512)) ? s__9513 : cljs.core.next.call(null, s__9513))
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
    var include__9525 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9526 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9526)) {
        var vec__9527__9528 = temp__3974__auto____9526;
        var e__9529 = cljs.core.nth.call(null, vec__9527__9528, 0, null);
        var s__9530 = vec__9527__9528;
        if(cljs.core.truth_(include__9525.call(null, e__9529))) {
          return s__9530
        }else {
          return cljs.core.next.call(null, s__9530)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9525, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9531 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9531)) {
      var vec__9532__9533 = temp__3974__auto____9531;
      var e__9534 = cljs.core.nth.call(null, vec__9532__9533, 0, null);
      var s__9535 = vec__9532__9533;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9534)) ? s__9535 : cljs.core.next.call(null, s__9535))
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
  var this__9536 = this;
  var h__2192__auto____9537 = this__9536.__hash;
  if(!(h__2192__auto____9537 == null)) {
    return h__2192__auto____9537
  }else {
    var h__2192__auto____9538 = cljs.core.hash_coll.call(null, rng);
    this__9536.__hash = h__2192__auto____9538;
    return h__2192__auto____9538
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9539 = this;
  if(this__9539.step > 0) {
    if(this__9539.start + this__9539.step < this__9539.end) {
      return new cljs.core.Range(this__9539.meta, this__9539.start + this__9539.step, this__9539.end, this__9539.step, null)
    }else {
      return null
    }
  }else {
    if(this__9539.start + this__9539.step > this__9539.end) {
      return new cljs.core.Range(this__9539.meta, this__9539.start + this__9539.step, this__9539.end, this__9539.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9540 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9541 = this;
  var this__9542 = this;
  return cljs.core.pr_str.call(null, this__9542)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9543 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9544 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9545 = this;
  if(this__9545.step > 0) {
    if(this__9545.start < this__9545.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9545.start > this__9545.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9546 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9546.end - this__9546.start) / this__9546.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9547 = this;
  return this__9547.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9548 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9548.meta, this__9548.start + this__9548.step, this__9548.end, this__9548.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9549 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9550 = this;
  return new cljs.core.Range(meta, this__9550.start, this__9550.end, this__9550.step, this__9550.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9551 = this;
  return this__9551.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9552 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9552.start + n * this__9552.step
  }else {
    if(function() {
      var and__3822__auto____9553 = this__9552.start > this__9552.end;
      if(and__3822__auto____9553) {
        return this__9552.step === 0
      }else {
        return and__3822__auto____9553
      }
    }()) {
      return this__9552.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9554 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9554.start + n * this__9554.step
  }else {
    if(function() {
      var and__3822__auto____9555 = this__9554.start > this__9554.end;
      if(and__3822__auto____9555) {
        return this__9554.step === 0
      }else {
        return and__3822__auto____9555
      }
    }()) {
      return this__9554.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9556 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9556.meta)
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
    var temp__3974__auto____9559 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9559) {
      var s__9560 = temp__3974__auto____9559;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9560), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9560)))
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
    var temp__3974__auto____9567 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9567) {
      var s__9568 = temp__3974__auto____9567;
      var fst__9569 = cljs.core.first.call(null, s__9568);
      var fv__9570 = f.call(null, fst__9569);
      var run__9571 = cljs.core.cons.call(null, fst__9569, cljs.core.take_while.call(null, function(p1__9561_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9570, f.call(null, p1__9561_SHARP_))
      }, cljs.core.next.call(null, s__9568)));
      return cljs.core.cons.call(null, run__9571, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9571), s__9568))))
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
      var temp__3971__auto____9586 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9586) {
        var s__9587 = temp__3971__auto____9586;
        return reductions.call(null, f, cljs.core.first.call(null, s__9587), cljs.core.rest.call(null, s__9587))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9588 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9588) {
        var s__9589 = temp__3974__auto____9588;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9589)), cljs.core.rest.call(null, s__9589))
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
      var G__9592 = null;
      var G__9592__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9592__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9592__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9592__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9592__4 = function() {
        var G__9593__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9593 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9593__delegate.call(this, x, y, z, args)
        };
        G__9593.cljs$lang$maxFixedArity = 3;
        G__9593.cljs$lang$applyTo = function(arglist__9594) {
          var x = cljs.core.first(arglist__9594);
          var y = cljs.core.first(cljs.core.next(arglist__9594));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9594)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9594)));
          return G__9593__delegate(x, y, z, args)
        };
        G__9593.cljs$lang$arity$variadic = G__9593__delegate;
        return G__9593
      }();
      G__9592 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9592__0.call(this);
          case 1:
            return G__9592__1.call(this, x);
          case 2:
            return G__9592__2.call(this, x, y);
          case 3:
            return G__9592__3.call(this, x, y, z);
          default:
            return G__9592__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9592.cljs$lang$maxFixedArity = 3;
      G__9592.cljs$lang$applyTo = G__9592__4.cljs$lang$applyTo;
      return G__9592
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9595 = null;
      var G__9595__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9595__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9595__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9595__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9595__4 = function() {
        var G__9596__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9596 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9596__delegate.call(this, x, y, z, args)
        };
        G__9596.cljs$lang$maxFixedArity = 3;
        G__9596.cljs$lang$applyTo = function(arglist__9597) {
          var x = cljs.core.first(arglist__9597);
          var y = cljs.core.first(cljs.core.next(arglist__9597));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9597)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9597)));
          return G__9596__delegate(x, y, z, args)
        };
        G__9596.cljs$lang$arity$variadic = G__9596__delegate;
        return G__9596
      }();
      G__9595 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9595__0.call(this);
          case 1:
            return G__9595__1.call(this, x);
          case 2:
            return G__9595__2.call(this, x, y);
          case 3:
            return G__9595__3.call(this, x, y, z);
          default:
            return G__9595__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9595.cljs$lang$maxFixedArity = 3;
      G__9595.cljs$lang$applyTo = G__9595__4.cljs$lang$applyTo;
      return G__9595
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9598 = null;
      var G__9598__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9598__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9598__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9598__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9598__4 = function() {
        var G__9599__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9599 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9599__delegate.call(this, x, y, z, args)
        };
        G__9599.cljs$lang$maxFixedArity = 3;
        G__9599.cljs$lang$applyTo = function(arglist__9600) {
          var x = cljs.core.first(arglist__9600);
          var y = cljs.core.first(cljs.core.next(arglist__9600));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9600)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9600)));
          return G__9599__delegate(x, y, z, args)
        };
        G__9599.cljs$lang$arity$variadic = G__9599__delegate;
        return G__9599
      }();
      G__9598 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9598__0.call(this);
          case 1:
            return G__9598__1.call(this, x);
          case 2:
            return G__9598__2.call(this, x, y);
          case 3:
            return G__9598__3.call(this, x, y, z);
          default:
            return G__9598__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9598.cljs$lang$maxFixedArity = 3;
      G__9598.cljs$lang$applyTo = G__9598__4.cljs$lang$applyTo;
      return G__9598
    }()
  };
  var juxt__4 = function() {
    var G__9601__delegate = function(f, g, h, fs) {
      var fs__9591 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9602 = null;
        var G__9602__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9572_SHARP_, p2__9573_SHARP_) {
            return cljs.core.conj.call(null, p1__9572_SHARP_, p2__9573_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9591)
        };
        var G__9602__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9574_SHARP_, p2__9575_SHARP_) {
            return cljs.core.conj.call(null, p1__9574_SHARP_, p2__9575_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9591)
        };
        var G__9602__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9576_SHARP_, p2__9577_SHARP_) {
            return cljs.core.conj.call(null, p1__9576_SHARP_, p2__9577_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9591)
        };
        var G__9602__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9578_SHARP_, p2__9579_SHARP_) {
            return cljs.core.conj.call(null, p1__9578_SHARP_, p2__9579_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9591)
        };
        var G__9602__4 = function() {
          var G__9603__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9580_SHARP_, p2__9581_SHARP_) {
              return cljs.core.conj.call(null, p1__9580_SHARP_, cljs.core.apply.call(null, p2__9581_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9591)
          };
          var G__9603 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9603__delegate.call(this, x, y, z, args)
          };
          G__9603.cljs$lang$maxFixedArity = 3;
          G__9603.cljs$lang$applyTo = function(arglist__9604) {
            var x = cljs.core.first(arglist__9604);
            var y = cljs.core.first(cljs.core.next(arglist__9604));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9604)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9604)));
            return G__9603__delegate(x, y, z, args)
          };
          G__9603.cljs$lang$arity$variadic = G__9603__delegate;
          return G__9603
        }();
        G__9602 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9602__0.call(this);
            case 1:
              return G__9602__1.call(this, x);
            case 2:
              return G__9602__2.call(this, x, y);
            case 3:
              return G__9602__3.call(this, x, y, z);
            default:
              return G__9602__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9602.cljs$lang$maxFixedArity = 3;
        G__9602.cljs$lang$applyTo = G__9602__4.cljs$lang$applyTo;
        return G__9602
      }()
    };
    var G__9601 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9601__delegate.call(this, f, g, h, fs)
    };
    G__9601.cljs$lang$maxFixedArity = 3;
    G__9601.cljs$lang$applyTo = function(arglist__9605) {
      var f = cljs.core.first(arglist__9605);
      var g = cljs.core.first(cljs.core.next(arglist__9605));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9605)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9605)));
      return G__9601__delegate(f, g, h, fs)
    };
    G__9601.cljs$lang$arity$variadic = G__9601__delegate;
    return G__9601
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
        var G__9608 = cljs.core.next.call(null, coll);
        coll = G__9608;
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
        var and__3822__auto____9607 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____9607) {
          return n > 0
        }else {
          return and__3822__auto____9607
        }
      }())) {
        var G__9609 = n - 1;
        var G__9610 = cljs.core.next.call(null, coll);
        n = G__9609;
        coll = G__9610;
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
  var matches__9612 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9612), s)) {
    if(cljs.core.count.call(null, matches__9612) === 1) {
      return cljs.core.first.call(null, matches__9612)
    }else {
      return cljs.core.vec.call(null, matches__9612)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9614 = re.exec(s);
  if(matches__9614 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9614) === 1) {
      return cljs.core.first.call(null, matches__9614)
    }else {
      return cljs.core.vec.call(null, matches__9614)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9619 = cljs.core.re_find.call(null, re, s);
  var match_idx__9620 = s.search(re);
  var match_str__9621 = cljs.core.coll_QMARK_.call(null, match_data__9619) ? cljs.core.first.call(null, match_data__9619) : match_data__9619;
  var post_match__9622 = cljs.core.subs.call(null, s, match_idx__9620 + cljs.core.count.call(null, match_str__9621));
  if(cljs.core.truth_(match_data__9619)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9619, re_seq.call(null, re, post_match__9622))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9629__9630 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9631 = cljs.core.nth.call(null, vec__9629__9630, 0, null);
  var flags__9632 = cljs.core.nth.call(null, vec__9629__9630, 1, null);
  var pattern__9633 = cljs.core.nth.call(null, vec__9629__9630, 2, null);
  return new RegExp(pattern__9633, flags__9632)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9623_SHARP_) {
    return print_one.call(null, p1__9623_SHARP_, opts)
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
          var and__3822__auto____9643 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9643)) {
            var and__3822__auto____9647 = function() {
              var G__9644__9645 = obj;
              if(G__9644__9645) {
                if(function() {
                  var or__3824__auto____9646 = G__9644__9645.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9646) {
                    return or__3824__auto____9646
                  }else {
                    return G__9644__9645.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9644__9645.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9644__9645)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9644__9645)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9647)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9647
            }
          }else {
            return and__3822__auto____9643
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____9648 = !(obj == null);
          if(and__3822__auto____9648) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9648
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9649__9650 = obj;
          if(G__9649__9650) {
            if(function() {
              var or__3824__auto____9651 = G__9649__9650.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9651) {
                return or__3824__auto____9651
              }else {
                return G__9649__9650.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9649__9650.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9649__9650)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9649__9650)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9671 = new goog.string.StringBuffer;
  var G__9672__9673 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9672__9673) {
    var string__9674 = cljs.core.first.call(null, G__9672__9673);
    var G__9672__9675 = G__9672__9673;
    while(true) {
      sb__9671.append(string__9674);
      var temp__3974__auto____9676 = cljs.core.next.call(null, G__9672__9675);
      if(temp__3974__auto____9676) {
        var G__9672__9677 = temp__3974__auto____9676;
        var G__9690 = cljs.core.first.call(null, G__9672__9677);
        var G__9691 = G__9672__9677;
        string__9674 = G__9690;
        G__9672__9675 = G__9691;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9678__9679 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9678__9679) {
    var obj__9680 = cljs.core.first.call(null, G__9678__9679);
    var G__9678__9681 = G__9678__9679;
    while(true) {
      sb__9671.append(" ");
      var G__9682__9683 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9680, opts));
      if(G__9682__9683) {
        var string__9684 = cljs.core.first.call(null, G__9682__9683);
        var G__9682__9685 = G__9682__9683;
        while(true) {
          sb__9671.append(string__9684);
          var temp__3974__auto____9686 = cljs.core.next.call(null, G__9682__9685);
          if(temp__3974__auto____9686) {
            var G__9682__9687 = temp__3974__auto____9686;
            var G__9692 = cljs.core.first.call(null, G__9682__9687);
            var G__9693 = G__9682__9687;
            string__9684 = G__9692;
            G__9682__9685 = G__9693;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9688 = cljs.core.next.call(null, G__9678__9681);
      if(temp__3974__auto____9688) {
        var G__9678__9689 = temp__3974__auto____9688;
        var G__9694 = cljs.core.first.call(null, G__9678__9689);
        var G__9695 = G__9678__9689;
        obj__9680 = G__9694;
        G__9678__9681 = G__9695;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9671
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9697 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9697.append("\n");
  return[cljs.core.str(sb__9697)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9716__9717 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9716__9717) {
    var string__9718 = cljs.core.first.call(null, G__9716__9717);
    var G__9716__9719 = G__9716__9717;
    while(true) {
      cljs.core.string_print.call(null, string__9718);
      var temp__3974__auto____9720 = cljs.core.next.call(null, G__9716__9719);
      if(temp__3974__auto____9720) {
        var G__9716__9721 = temp__3974__auto____9720;
        var G__9734 = cljs.core.first.call(null, G__9716__9721);
        var G__9735 = G__9716__9721;
        string__9718 = G__9734;
        G__9716__9719 = G__9735;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9722__9723 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9722__9723) {
    var obj__9724 = cljs.core.first.call(null, G__9722__9723);
    var G__9722__9725 = G__9722__9723;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9726__9727 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9724, opts));
      if(G__9726__9727) {
        var string__9728 = cljs.core.first.call(null, G__9726__9727);
        var G__9726__9729 = G__9726__9727;
        while(true) {
          cljs.core.string_print.call(null, string__9728);
          var temp__3974__auto____9730 = cljs.core.next.call(null, G__9726__9729);
          if(temp__3974__auto____9730) {
            var G__9726__9731 = temp__3974__auto____9730;
            var G__9736 = cljs.core.first.call(null, G__9726__9731);
            var G__9737 = G__9726__9731;
            string__9728 = G__9736;
            G__9726__9729 = G__9737;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9732 = cljs.core.next.call(null, G__9722__9725);
      if(temp__3974__auto____9732) {
        var G__9722__9733 = temp__3974__auto____9732;
        var G__9738 = cljs.core.first.call(null, G__9722__9733);
        var G__9739 = G__9722__9733;
        obj__9724 = G__9738;
        G__9722__9725 = G__9739;
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
  pr_str.cljs$lang$applyTo = function(arglist__9740) {
    var objs = cljs.core.seq(arglist__9740);
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
  prn_str.cljs$lang$applyTo = function(arglist__9741) {
    var objs = cljs.core.seq(arglist__9741);
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
  pr.cljs$lang$applyTo = function(arglist__9742) {
    var objs = cljs.core.seq(arglist__9742);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__9743) {
    var objs = cljs.core.seq(arglist__9743);
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
  print_str.cljs$lang$applyTo = function(arglist__9744) {
    var objs = cljs.core.seq(arglist__9744);
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
  println.cljs$lang$applyTo = function(arglist__9745) {
    var objs = cljs.core.seq(arglist__9745);
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
  println_str.cljs$lang$applyTo = function(arglist__9746) {
    var objs = cljs.core.seq(arglist__9746);
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
  prn.cljs$lang$applyTo = function(arglist__9747) {
    var objs = cljs.core.seq(arglist__9747);
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
  printf.cljs$lang$applyTo = function(arglist__9748) {
    var fmt = cljs.core.first(arglist__9748);
    var args = cljs.core.rest(arglist__9748);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9749 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9749, "{", ", ", "}", opts, coll)
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
  var pr_pair__9750 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9750, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9751 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9751, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____9752 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9752)) {
        var nspc__9753 = temp__3974__auto____9752;
        return[cljs.core.str(nspc__9753), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____9754 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____9754)) {
          var nspc__9755 = temp__3974__auto____9754;
          return[cljs.core.str(nspc__9755), cljs.core.str("/")].join("")
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
  var pr_pair__9756 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9756, "{", ", ", "}", opts, coll)
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
  var normalize__9758 = function(n, len) {
    var ns__9757 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9757) < len) {
        var G__9760 = [cljs.core.str("0"), cljs.core.str(ns__9757)].join("");
        ns__9757 = G__9760;
        continue
      }else {
        return ns__9757
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9758.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9758.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9758.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9758.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9758.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9758.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__9759 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9759, "{", ", ", "}", opts, coll)
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
  var this__9761 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9762 = this;
  var G__9763__9764 = cljs.core.seq.call(null, this__9762.watches);
  if(G__9763__9764) {
    var G__9766__9768 = cljs.core.first.call(null, G__9763__9764);
    var vec__9767__9769 = G__9766__9768;
    var key__9770 = cljs.core.nth.call(null, vec__9767__9769, 0, null);
    var f__9771 = cljs.core.nth.call(null, vec__9767__9769, 1, null);
    var G__9763__9772 = G__9763__9764;
    var G__9766__9773 = G__9766__9768;
    var G__9763__9774 = G__9763__9772;
    while(true) {
      var vec__9775__9776 = G__9766__9773;
      var key__9777 = cljs.core.nth.call(null, vec__9775__9776, 0, null);
      var f__9778 = cljs.core.nth.call(null, vec__9775__9776, 1, null);
      var G__9763__9779 = G__9763__9774;
      f__9778.call(null, key__9777, this$, oldval, newval);
      var temp__3974__auto____9780 = cljs.core.next.call(null, G__9763__9779);
      if(temp__3974__auto____9780) {
        var G__9763__9781 = temp__3974__auto____9780;
        var G__9788 = cljs.core.first.call(null, G__9763__9781);
        var G__9789 = G__9763__9781;
        G__9766__9773 = G__9788;
        G__9763__9774 = G__9789;
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
  var this__9782 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9782.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9783 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9783.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9784 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9784.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9785 = this;
  return this__9785.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9786 = this;
  return this__9786.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9787 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9801__delegate = function(x, p__9790) {
      var map__9796__9797 = p__9790;
      var map__9796__9798 = cljs.core.seq_QMARK_.call(null, map__9796__9797) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9796__9797) : map__9796__9797;
      var validator__9799 = cljs.core._lookup.call(null, map__9796__9798, "\ufdd0'validator", null);
      var meta__9800 = cljs.core._lookup.call(null, map__9796__9798, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9800, validator__9799, null)
    };
    var G__9801 = function(x, var_args) {
      var p__9790 = null;
      if(goog.isDef(var_args)) {
        p__9790 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9801__delegate.call(this, x, p__9790)
    };
    G__9801.cljs$lang$maxFixedArity = 1;
    G__9801.cljs$lang$applyTo = function(arglist__9802) {
      var x = cljs.core.first(arglist__9802);
      var p__9790 = cljs.core.rest(arglist__9802);
      return G__9801__delegate(x, p__9790)
    };
    G__9801.cljs$lang$arity$variadic = G__9801__delegate;
    return G__9801
  }();
  atom = function(x, var_args) {
    var p__9790 = var_args;
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
  var temp__3974__auto____9806 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9806)) {
    var validate__9807 = temp__3974__auto____9806;
    if(cljs.core.truth_(validate__9807.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__9808 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9808, new_value);
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
    var G__9809__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9809 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9809__delegate.call(this, a, f, x, y, z, more)
    };
    G__9809.cljs$lang$maxFixedArity = 5;
    G__9809.cljs$lang$applyTo = function(arglist__9810) {
      var a = cljs.core.first(arglist__9810);
      var f = cljs.core.first(cljs.core.next(arglist__9810));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9810)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9810))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9810)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9810)))));
      return G__9809__delegate(a, f, x, y, z, more)
    };
    G__9809.cljs$lang$arity$variadic = G__9809__delegate;
    return G__9809
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9811) {
    var iref = cljs.core.first(arglist__9811);
    var f = cljs.core.first(cljs.core.next(arglist__9811));
    var args = cljs.core.rest(cljs.core.next(arglist__9811));
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
  var this__9812 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9812.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9813 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9813.state, function(p__9814) {
    var map__9815__9816 = p__9814;
    var map__9815__9817 = cljs.core.seq_QMARK_.call(null, map__9815__9816) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9815__9816) : map__9815__9816;
    var curr_state__9818 = map__9815__9817;
    var done__9819 = cljs.core._lookup.call(null, map__9815__9817, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9819)) {
      return curr_state__9818
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9813.f.call(null)})
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
    var map__9840__9841 = options;
    var map__9840__9842 = cljs.core.seq_QMARK_.call(null, map__9840__9841) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9840__9841) : map__9840__9841;
    var keywordize_keys__9843 = cljs.core._lookup.call(null, map__9840__9842, "\ufdd0'keywordize-keys", null);
    var keyfn__9844 = cljs.core.truth_(keywordize_keys__9843) ? cljs.core.keyword : cljs.core.str;
    var f__9859 = function thisfn(x) {
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
                var iter__2462__auto____9858 = function iter__9852(s__9853) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9853__9856 = s__9853;
                    while(true) {
                      if(cljs.core.seq.call(null, s__9853__9856)) {
                        var k__9857 = cljs.core.first.call(null, s__9853__9856);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9844.call(null, k__9857), thisfn.call(null, x[k__9857])], true), iter__9852.call(null, cljs.core.rest.call(null, s__9853__9856)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____9858.call(null, cljs.core.js_keys.call(null, x))
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
    return f__9859.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9860) {
    var x = cljs.core.first(arglist__9860);
    var options = cljs.core.rest(arglist__9860);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9865 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9869__delegate = function(args) {
      var temp__3971__auto____9866 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9865), args, null);
      if(cljs.core.truth_(temp__3971__auto____9866)) {
        var v__9867 = temp__3971__auto____9866;
        return v__9867
      }else {
        var ret__9868 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9865, cljs.core.assoc, args, ret__9868);
        return ret__9868
      }
    };
    var G__9869 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9869__delegate.call(this, args)
    };
    G__9869.cljs$lang$maxFixedArity = 0;
    G__9869.cljs$lang$applyTo = function(arglist__9870) {
      var args = cljs.core.seq(arglist__9870);
      return G__9869__delegate(args)
    };
    G__9869.cljs$lang$arity$variadic = G__9869__delegate;
    return G__9869
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9872 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9872)) {
        var G__9873 = ret__9872;
        f = G__9873;
        continue
      }else {
        return ret__9872
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9874__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9874 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9874__delegate.call(this, f, args)
    };
    G__9874.cljs$lang$maxFixedArity = 1;
    G__9874.cljs$lang$applyTo = function(arglist__9875) {
      var f = cljs.core.first(arglist__9875);
      var args = cljs.core.rest(arglist__9875);
      return G__9874__delegate(f, args)
    };
    G__9874.cljs$lang$arity$variadic = G__9874__delegate;
    return G__9874
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
    var k__9877 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9877, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9877, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____9886 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____9886) {
      return or__3824__auto____9886
    }else {
      var or__3824__auto____9887 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9887) {
        return or__3824__auto____9887
      }else {
        var and__3822__auto____9888 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____9888) {
          var and__3822__auto____9889 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____9889) {
            var and__3822__auto____9890 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____9890) {
              var ret__9891 = true;
              var i__9892 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9893 = cljs.core.not.call(null, ret__9891);
                  if(or__3824__auto____9893) {
                    return or__3824__auto____9893
                  }else {
                    return i__9892 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9891
                }else {
                  var G__9894 = isa_QMARK_.call(null, h, child.call(null, i__9892), parent.call(null, i__9892));
                  var G__9895 = i__9892 + 1;
                  ret__9891 = G__9894;
                  i__9892 = G__9895;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9890
            }
          }else {
            return and__3822__auto____9889
          }
        }else {
          return and__3822__auto____9888
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
    var tp__9904 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9905 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9906 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9907 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____9908 = cljs.core.contains_QMARK_.call(null, tp__9904.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9906.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9906.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9904, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9907.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9905, parent, ta__9906), "\ufdd0'descendants":tf__9907.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9906, tag, td__9905)})
    }();
    if(cljs.core.truth_(or__3824__auto____9908)) {
      return or__3824__auto____9908
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
    var parentMap__9913 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9914 = cljs.core.truth_(parentMap__9913.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9913.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9915 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9914)) ? cljs.core.assoc.call(null, parentMap__9913, tag, childsParents__9914) : cljs.core.dissoc.call(null, parentMap__9913, tag);
    var deriv_seq__9916 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9896_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9896_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9896_SHARP_), cljs.core.second.call(null, p1__9896_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9915)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9913.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9897_SHARP_, p2__9898_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9897_SHARP_, p2__9898_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9916))
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
  var xprefs__9924 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____9926 = cljs.core.truth_(function() {
    var and__3822__auto____9925 = xprefs__9924;
    if(cljs.core.truth_(and__3822__auto____9925)) {
      return xprefs__9924.call(null, y)
    }else {
      return and__3822__auto____9925
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____9926)) {
    return or__3824__auto____9926
  }else {
    var or__3824__auto____9928 = function() {
      var ps__9927 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9927) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9927), prefer_table))) {
          }else {
          }
          var G__9931 = cljs.core.rest.call(null, ps__9927);
          ps__9927 = G__9931;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____9928)) {
      return or__3824__auto____9928
    }else {
      var or__3824__auto____9930 = function() {
        var ps__9929 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9929) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9929), y, prefer_table))) {
            }else {
            }
            var G__9932 = cljs.core.rest.call(null, ps__9929);
            ps__9929 = G__9932;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____9930)) {
        return or__3824__auto____9930
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____9934 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____9934)) {
    return or__3824__auto____9934
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9952 = cljs.core.reduce.call(null, function(be, p__9944) {
    var vec__9945__9946 = p__9944;
    var k__9947 = cljs.core.nth.call(null, vec__9945__9946, 0, null);
    var ___9948 = cljs.core.nth.call(null, vec__9945__9946, 1, null);
    var e__9949 = vec__9945__9946;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9947)) {
      var be2__9951 = cljs.core.truth_(function() {
        var or__3824__auto____9950 = be == null;
        if(or__3824__auto____9950) {
          return or__3824__auto____9950
        }else {
          return cljs.core.dominates.call(null, k__9947, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9949 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9951), k__9947, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9947), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9951)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9951
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9952)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9952));
      return cljs.core.second.call(null, best_entry__9952)
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
    var and__3822__auto____9957 = mf;
    if(and__3822__auto____9957) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____9957
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____9958 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9959 = cljs.core._reset[goog.typeOf(x__2363__auto____9958)];
      if(or__3824__auto____9959) {
        return or__3824__auto____9959
      }else {
        var or__3824__auto____9960 = cljs.core._reset["_"];
        if(or__3824__auto____9960) {
          return or__3824__auto____9960
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____9965 = mf;
    if(and__3822__auto____9965) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____9965
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____9966 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9967 = cljs.core._add_method[goog.typeOf(x__2363__auto____9966)];
      if(or__3824__auto____9967) {
        return or__3824__auto____9967
      }else {
        var or__3824__auto____9968 = cljs.core._add_method["_"];
        if(or__3824__auto____9968) {
          return or__3824__auto____9968
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____9973 = mf;
    if(and__3822__auto____9973) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____9973
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____9974 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9975 = cljs.core._remove_method[goog.typeOf(x__2363__auto____9974)];
      if(or__3824__auto____9975) {
        return or__3824__auto____9975
      }else {
        var or__3824__auto____9976 = cljs.core._remove_method["_"];
        if(or__3824__auto____9976) {
          return or__3824__auto____9976
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____9981 = mf;
    if(and__3822__auto____9981) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____9981
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____9982 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9983 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____9982)];
      if(or__3824__auto____9983) {
        return or__3824__auto____9983
      }else {
        var or__3824__auto____9984 = cljs.core._prefer_method["_"];
        if(or__3824__auto____9984) {
          return or__3824__auto____9984
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____9989 = mf;
    if(and__3822__auto____9989) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____9989
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____9990 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9991 = cljs.core._get_method[goog.typeOf(x__2363__auto____9990)];
      if(or__3824__auto____9991) {
        return or__3824__auto____9991
      }else {
        var or__3824__auto____9992 = cljs.core._get_method["_"];
        if(or__3824__auto____9992) {
          return or__3824__auto____9992
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____9997 = mf;
    if(and__3822__auto____9997) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____9997
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____9998 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9999 = cljs.core._methods[goog.typeOf(x__2363__auto____9998)];
      if(or__3824__auto____9999) {
        return or__3824__auto____9999
      }else {
        var or__3824__auto____10000 = cljs.core._methods["_"];
        if(or__3824__auto____10000) {
          return or__3824__auto____10000
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10005 = mf;
    if(and__3822__auto____10005) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10005
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____10006 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10007 = cljs.core._prefers[goog.typeOf(x__2363__auto____10006)];
      if(or__3824__auto____10007) {
        return or__3824__auto____10007
      }else {
        var or__3824__auto____10008 = cljs.core._prefers["_"];
        if(or__3824__auto____10008) {
          return or__3824__auto____10008
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10013 = mf;
    if(and__3822__auto____10013) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10013
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____10014 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10015 = cljs.core._dispatch[goog.typeOf(x__2363__auto____10014)];
      if(or__3824__auto____10015) {
        return or__3824__auto____10015
      }else {
        var or__3824__auto____10016 = cljs.core._dispatch["_"];
        if(or__3824__auto____10016) {
          return or__3824__auto____10016
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10019 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10020 = cljs.core._get_method.call(null, mf, dispatch_val__10019);
  if(cljs.core.truth_(target_fn__10020)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10019)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10020, args)
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
  var this__10021 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10022 = this;
  cljs.core.swap_BANG_.call(null, this__10022.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10022.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10022.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10022.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10023 = this;
  cljs.core.swap_BANG_.call(null, this__10023.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10023.method_cache, this__10023.method_table, this__10023.cached_hierarchy, this__10023.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10024 = this;
  cljs.core.swap_BANG_.call(null, this__10024.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10024.method_cache, this__10024.method_table, this__10024.cached_hierarchy, this__10024.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10025 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10025.cached_hierarchy), cljs.core.deref.call(null, this__10025.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10025.method_cache, this__10025.method_table, this__10025.cached_hierarchy, this__10025.hierarchy)
  }
  var temp__3971__auto____10026 = cljs.core.deref.call(null, this__10025.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10026)) {
    var target_fn__10027 = temp__3971__auto____10026;
    return target_fn__10027
  }else {
    var temp__3971__auto____10028 = cljs.core.find_and_cache_best_method.call(null, this__10025.name, dispatch_val, this__10025.hierarchy, this__10025.method_table, this__10025.prefer_table, this__10025.method_cache, this__10025.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10028)) {
      var target_fn__10029 = temp__3971__auto____10028;
      return target_fn__10029
    }else {
      return cljs.core.deref.call(null, this__10025.method_table).call(null, this__10025.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10030 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10030.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10030.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10030.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10030.method_cache, this__10030.method_table, this__10030.cached_hierarchy, this__10030.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10031 = this;
  return cljs.core.deref.call(null, this__10031.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10032 = this;
  return cljs.core.deref.call(null, this__10032.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10033 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10033.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10035__delegate = function(_, args) {
    var self__10034 = this;
    return cljs.core._dispatch.call(null, self__10034, args)
  };
  var G__10035 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10035__delegate.call(this, _, args)
  };
  G__10035.cljs$lang$maxFixedArity = 1;
  G__10035.cljs$lang$applyTo = function(arglist__10036) {
    var _ = cljs.core.first(arglist__10036);
    var args = cljs.core.rest(arglist__10036);
    return G__10035__delegate(_, args)
  };
  G__10035.cljs$lang$arity$variadic = G__10035__delegate;
  return G__10035
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10037 = this;
  return cljs.core._dispatch.call(null, self__10037, args)
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
  var this__10038 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10040, _) {
  var this__10039 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10039.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10041 = this;
  var and__3822__auto____10042 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10042) {
    return this__10041.uuid === other.uuid
  }else {
    return and__3822__auto____10042
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10043 = this;
  var this__10044 = this;
  return cljs.core.pr_str.call(null, this__10044)
};
cljs.core.UUID;
goog.provide("black.global");
goog.require("cljs.core");
black.global.open_browser_window = function open_browser_window(url) {
  var window__111903 = safari.application.openBrowserWindow();
  var tab__111904 = window__111903.activeTab;
  return tab__111904.url = url
};
black.global.handle_toolbar_item_clicked = function handle_toolbar_item_clicked(event) {
  if(cljs.core._EQ_.call(null, "black", event.command)) {
    alert("dispatched");
    alert(safari.application.activeBrowserWindow.activeTab.page);
    safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("open-window", "test");
    return alert("there")
  }else {
    return null
  }
};
goog.exportSymbol("black.global.handle_toolbar_item_clicked", black.global.handle_toolbar_item_clicked);
safari.application.addEventListener("command", black.global.handle_toolbar_item_clicked, false);
