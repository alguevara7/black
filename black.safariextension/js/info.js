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
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
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
  var x__7196 = x == null ? null : x;
  if(p[goog.typeOf(x__7196)]) {
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
    var G__7197__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__7197 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7197__delegate.call(this, array, i, idxs)
    };
    G__7197.cljs$lang$maxFixedArity = 2;
    G__7197.cljs$lang$applyTo = function(arglist__7198) {
      var array = cljs.core.first(arglist__7198);
      var i = cljs.core.first(cljs.core.next(arglist__7198));
      var idxs = cljs.core.rest(cljs.core.next(arglist__7198));
      return G__7197__delegate(array, i, idxs)
    };
    G__7197.cljs$lang$arity$variadic = G__7197__delegate;
    return G__7197
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
      var and__3822__auto____7283 = this$;
      if(and__3822__auto____7283) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____7283
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____7284 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7285 = cljs.core._invoke[goog.typeOf(x__2363__auto____7284)];
        if(or__3824__auto____7285) {
          return or__3824__auto____7285
        }else {
          var or__3824__auto____7286 = cljs.core._invoke["_"];
          if(or__3824__auto____7286) {
            return or__3824__auto____7286
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____7287 = this$;
      if(and__3822__auto____7287) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____7287
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____7288 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7289 = cljs.core._invoke[goog.typeOf(x__2363__auto____7288)];
        if(or__3824__auto____7289) {
          return or__3824__auto____7289
        }else {
          var or__3824__auto____7290 = cljs.core._invoke["_"];
          if(or__3824__auto____7290) {
            return or__3824__auto____7290
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____7291 = this$;
      if(and__3822__auto____7291) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____7291
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____7292 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7293 = cljs.core._invoke[goog.typeOf(x__2363__auto____7292)];
        if(or__3824__auto____7293) {
          return or__3824__auto____7293
        }else {
          var or__3824__auto____7294 = cljs.core._invoke["_"];
          if(or__3824__auto____7294) {
            return or__3824__auto____7294
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____7295 = this$;
      if(and__3822__auto____7295) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____7295
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____7296 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7297 = cljs.core._invoke[goog.typeOf(x__2363__auto____7296)];
        if(or__3824__auto____7297) {
          return or__3824__auto____7297
        }else {
          var or__3824__auto____7298 = cljs.core._invoke["_"];
          if(or__3824__auto____7298) {
            return or__3824__auto____7298
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____7299 = this$;
      if(and__3822__auto____7299) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____7299
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____7300 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7301 = cljs.core._invoke[goog.typeOf(x__2363__auto____7300)];
        if(or__3824__auto____7301) {
          return or__3824__auto____7301
        }else {
          var or__3824__auto____7302 = cljs.core._invoke["_"];
          if(or__3824__auto____7302) {
            return or__3824__auto____7302
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____7303 = this$;
      if(and__3822__auto____7303) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____7303
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____7304 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7305 = cljs.core._invoke[goog.typeOf(x__2363__auto____7304)];
        if(or__3824__auto____7305) {
          return or__3824__auto____7305
        }else {
          var or__3824__auto____7306 = cljs.core._invoke["_"];
          if(or__3824__auto____7306) {
            return or__3824__auto____7306
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____7307 = this$;
      if(and__3822__auto____7307) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____7307
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____7308 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7309 = cljs.core._invoke[goog.typeOf(x__2363__auto____7308)];
        if(or__3824__auto____7309) {
          return or__3824__auto____7309
        }else {
          var or__3824__auto____7310 = cljs.core._invoke["_"];
          if(or__3824__auto____7310) {
            return or__3824__auto____7310
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____7311 = this$;
      if(and__3822__auto____7311) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____7311
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____7312 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7313 = cljs.core._invoke[goog.typeOf(x__2363__auto____7312)];
        if(or__3824__auto____7313) {
          return or__3824__auto____7313
        }else {
          var or__3824__auto____7314 = cljs.core._invoke["_"];
          if(or__3824__auto____7314) {
            return or__3824__auto____7314
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____7315 = this$;
      if(and__3822__auto____7315) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____7315
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____7316 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7317 = cljs.core._invoke[goog.typeOf(x__2363__auto____7316)];
        if(or__3824__auto____7317) {
          return or__3824__auto____7317
        }else {
          var or__3824__auto____7318 = cljs.core._invoke["_"];
          if(or__3824__auto____7318) {
            return or__3824__auto____7318
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____7319 = this$;
      if(and__3822__auto____7319) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____7319
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____7320 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7321 = cljs.core._invoke[goog.typeOf(x__2363__auto____7320)];
        if(or__3824__auto____7321) {
          return or__3824__auto____7321
        }else {
          var or__3824__auto____7322 = cljs.core._invoke["_"];
          if(or__3824__auto____7322) {
            return or__3824__auto____7322
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____7323 = this$;
      if(and__3822__auto____7323) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____7323
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____7324 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7325 = cljs.core._invoke[goog.typeOf(x__2363__auto____7324)];
        if(or__3824__auto____7325) {
          return or__3824__auto____7325
        }else {
          var or__3824__auto____7326 = cljs.core._invoke["_"];
          if(or__3824__auto____7326) {
            return or__3824__auto____7326
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____7327 = this$;
      if(and__3822__auto____7327) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____7327
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____7328 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7329 = cljs.core._invoke[goog.typeOf(x__2363__auto____7328)];
        if(or__3824__auto____7329) {
          return or__3824__auto____7329
        }else {
          var or__3824__auto____7330 = cljs.core._invoke["_"];
          if(or__3824__auto____7330) {
            return or__3824__auto____7330
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____7331 = this$;
      if(and__3822__auto____7331) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____7331
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____7332 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7333 = cljs.core._invoke[goog.typeOf(x__2363__auto____7332)];
        if(or__3824__auto____7333) {
          return or__3824__auto____7333
        }else {
          var or__3824__auto____7334 = cljs.core._invoke["_"];
          if(or__3824__auto____7334) {
            return or__3824__auto____7334
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____7335 = this$;
      if(and__3822__auto____7335) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____7335
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____7336 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7337 = cljs.core._invoke[goog.typeOf(x__2363__auto____7336)];
        if(or__3824__auto____7337) {
          return or__3824__auto____7337
        }else {
          var or__3824__auto____7338 = cljs.core._invoke["_"];
          if(or__3824__auto____7338) {
            return or__3824__auto____7338
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____7339 = this$;
      if(and__3822__auto____7339) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____7339
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____7340 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7341 = cljs.core._invoke[goog.typeOf(x__2363__auto____7340)];
        if(or__3824__auto____7341) {
          return or__3824__auto____7341
        }else {
          var or__3824__auto____7342 = cljs.core._invoke["_"];
          if(or__3824__auto____7342) {
            return or__3824__auto____7342
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____7343 = this$;
      if(and__3822__auto____7343) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____7343
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____7344 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7345 = cljs.core._invoke[goog.typeOf(x__2363__auto____7344)];
        if(or__3824__auto____7345) {
          return or__3824__auto____7345
        }else {
          var or__3824__auto____7346 = cljs.core._invoke["_"];
          if(or__3824__auto____7346) {
            return or__3824__auto____7346
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____7347 = this$;
      if(and__3822__auto____7347) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____7347
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____7348 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7349 = cljs.core._invoke[goog.typeOf(x__2363__auto____7348)];
        if(or__3824__auto____7349) {
          return or__3824__auto____7349
        }else {
          var or__3824__auto____7350 = cljs.core._invoke["_"];
          if(or__3824__auto____7350) {
            return or__3824__auto____7350
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____7351 = this$;
      if(and__3822__auto____7351) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____7351
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____7352 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7353 = cljs.core._invoke[goog.typeOf(x__2363__auto____7352)];
        if(or__3824__auto____7353) {
          return or__3824__auto____7353
        }else {
          var or__3824__auto____7354 = cljs.core._invoke["_"];
          if(or__3824__auto____7354) {
            return or__3824__auto____7354
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____7355 = this$;
      if(and__3822__auto____7355) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____7355
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____7356 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7357 = cljs.core._invoke[goog.typeOf(x__2363__auto____7356)];
        if(or__3824__auto____7357) {
          return or__3824__auto____7357
        }else {
          var or__3824__auto____7358 = cljs.core._invoke["_"];
          if(or__3824__auto____7358) {
            return or__3824__auto____7358
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____7359 = this$;
      if(and__3822__auto____7359) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____7359
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____7360 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7361 = cljs.core._invoke[goog.typeOf(x__2363__auto____7360)];
        if(or__3824__auto____7361) {
          return or__3824__auto____7361
        }else {
          var or__3824__auto____7362 = cljs.core._invoke["_"];
          if(or__3824__auto____7362) {
            return or__3824__auto____7362
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____7363 = this$;
      if(and__3822__auto____7363) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____7363
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____7364 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____7365 = cljs.core._invoke[goog.typeOf(x__2363__auto____7364)];
        if(or__3824__auto____7365) {
          return or__3824__auto____7365
        }else {
          var or__3824__auto____7366 = cljs.core._invoke["_"];
          if(or__3824__auto____7366) {
            return or__3824__auto____7366
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
    var and__3822__auto____7371 = coll;
    if(and__3822__auto____7371) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____7371
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____7372 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7373 = cljs.core._count[goog.typeOf(x__2363__auto____7372)];
      if(or__3824__auto____7373) {
        return or__3824__auto____7373
      }else {
        var or__3824__auto____7374 = cljs.core._count["_"];
        if(or__3824__auto____7374) {
          return or__3824__auto____7374
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
    var and__3822__auto____7379 = coll;
    if(and__3822__auto____7379) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____7379
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____7380 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7381 = cljs.core._empty[goog.typeOf(x__2363__auto____7380)];
      if(or__3824__auto____7381) {
        return or__3824__auto____7381
      }else {
        var or__3824__auto____7382 = cljs.core._empty["_"];
        if(or__3824__auto____7382) {
          return or__3824__auto____7382
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
    var and__3822__auto____7387 = coll;
    if(and__3822__auto____7387) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____7387
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____7388 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7389 = cljs.core._conj[goog.typeOf(x__2363__auto____7388)];
      if(or__3824__auto____7389) {
        return or__3824__auto____7389
      }else {
        var or__3824__auto____7390 = cljs.core._conj["_"];
        if(or__3824__auto____7390) {
          return or__3824__auto____7390
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
      var and__3822__auto____7399 = coll;
      if(and__3822__auto____7399) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____7399
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____7400 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7401 = cljs.core._nth[goog.typeOf(x__2363__auto____7400)];
        if(or__3824__auto____7401) {
          return or__3824__auto____7401
        }else {
          var or__3824__auto____7402 = cljs.core._nth["_"];
          if(or__3824__auto____7402) {
            return or__3824__auto____7402
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____7403 = coll;
      if(and__3822__auto____7403) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____7403
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____7404 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7405 = cljs.core._nth[goog.typeOf(x__2363__auto____7404)];
        if(or__3824__auto____7405) {
          return or__3824__auto____7405
        }else {
          var or__3824__auto____7406 = cljs.core._nth["_"];
          if(or__3824__auto____7406) {
            return or__3824__auto____7406
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
    var and__3822__auto____7411 = coll;
    if(and__3822__auto____7411) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____7411
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____7412 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7413 = cljs.core._first[goog.typeOf(x__2363__auto____7412)];
      if(or__3824__auto____7413) {
        return or__3824__auto____7413
      }else {
        var or__3824__auto____7414 = cljs.core._first["_"];
        if(or__3824__auto____7414) {
          return or__3824__auto____7414
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____7419 = coll;
    if(and__3822__auto____7419) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____7419
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____7420 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7421 = cljs.core._rest[goog.typeOf(x__2363__auto____7420)];
      if(or__3824__auto____7421) {
        return or__3824__auto____7421
      }else {
        var or__3824__auto____7422 = cljs.core._rest["_"];
        if(or__3824__auto____7422) {
          return or__3824__auto____7422
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
    var and__3822__auto____7427 = coll;
    if(and__3822__auto____7427) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____7427
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____7428 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7429 = cljs.core._next[goog.typeOf(x__2363__auto____7428)];
      if(or__3824__auto____7429) {
        return or__3824__auto____7429
      }else {
        var or__3824__auto____7430 = cljs.core._next["_"];
        if(or__3824__auto____7430) {
          return or__3824__auto____7430
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
      var and__3822__auto____7439 = o;
      if(and__3822__auto____7439) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____7439
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____7440 = o == null ? null : o;
      return function() {
        var or__3824__auto____7441 = cljs.core._lookup[goog.typeOf(x__2363__auto____7440)];
        if(or__3824__auto____7441) {
          return or__3824__auto____7441
        }else {
          var or__3824__auto____7442 = cljs.core._lookup["_"];
          if(or__3824__auto____7442) {
            return or__3824__auto____7442
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____7443 = o;
      if(and__3822__auto____7443) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____7443
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____7444 = o == null ? null : o;
      return function() {
        var or__3824__auto____7445 = cljs.core._lookup[goog.typeOf(x__2363__auto____7444)];
        if(or__3824__auto____7445) {
          return or__3824__auto____7445
        }else {
          var or__3824__auto____7446 = cljs.core._lookup["_"];
          if(or__3824__auto____7446) {
            return or__3824__auto____7446
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
    var and__3822__auto____7451 = coll;
    if(and__3822__auto____7451) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____7451
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____7452 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7453 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____7452)];
      if(or__3824__auto____7453) {
        return or__3824__auto____7453
      }else {
        var or__3824__auto____7454 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____7454) {
          return or__3824__auto____7454
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____7459 = coll;
    if(and__3822__auto____7459) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____7459
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____7460 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7461 = cljs.core._assoc[goog.typeOf(x__2363__auto____7460)];
      if(or__3824__auto____7461) {
        return or__3824__auto____7461
      }else {
        var or__3824__auto____7462 = cljs.core._assoc["_"];
        if(or__3824__auto____7462) {
          return or__3824__auto____7462
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
    var and__3822__auto____7467 = coll;
    if(and__3822__auto____7467) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____7467
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____7468 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7469 = cljs.core._dissoc[goog.typeOf(x__2363__auto____7468)];
      if(or__3824__auto____7469) {
        return or__3824__auto____7469
      }else {
        var or__3824__auto____7470 = cljs.core._dissoc["_"];
        if(or__3824__auto____7470) {
          return or__3824__auto____7470
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
    var and__3822__auto____7475 = coll;
    if(and__3822__auto____7475) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____7475
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____7476 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7477 = cljs.core._key[goog.typeOf(x__2363__auto____7476)];
      if(or__3824__auto____7477) {
        return or__3824__auto____7477
      }else {
        var or__3824__auto____7478 = cljs.core._key["_"];
        if(or__3824__auto____7478) {
          return or__3824__auto____7478
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____7483 = coll;
    if(and__3822__auto____7483) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____7483
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____7484 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7485 = cljs.core._val[goog.typeOf(x__2363__auto____7484)];
      if(or__3824__auto____7485) {
        return or__3824__auto____7485
      }else {
        var or__3824__auto____7486 = cljs.core._val["_"];
        if(or__3824__auto____7486) {
          return or__3824__auto____7486
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
    var and__3822__auto____7491 = coll;
    if(and__3822__auto____7491) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____7491
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____7492 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7493 = cljs.core._disjoin[goog.typeOf(x__2363__auto____7492)];
      if(or__3824__auto____7493) {
        return or__3824__auto____7493
      }else {
        var or__3824__auto____7494 = cljs.core._disjoin["_"];
        if(or__3824__auto____7494) {
          return or__3824__auto____7494
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
    var and__3822__auto____7499 = coll;
    if(and__3822__auto____7499) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____7499
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____7500 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7501 = cljs.core._peek[goog.typeOf(x__2363__auto____7500)];
      if(or__3824__auto____7501) {
        return or__3824__auto____7501
      }else {
        var or__3824__auto____7502 = cljs.core._peek["_"];
        if(or__3824__auto____7502) {
          return or__3824__auto____7502
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____7507 = coll;
    if(and__3822__auto____7507) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____7507
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____7508 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7509 = cljs.core._pop[goog.typeOf(x__2363__auto____7508)];
      if(or__3824__auto____7509) {
        return or__3824__auto____7509
      }else {
        var or__3824__auto____7510 = cljs.core._pop["_"];
        if(or__3824__auto____7510) {
          return or__3824__auto____7510
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
    var and__3822__auto____7515 = coll;
    if(and__3822__auto____7515) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____7515
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____7516 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7517 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____7516)];
      if(or__3824__auto____7517) {
        return or__3824__auto____7517
      }else {
        var or__3824__auto____7518 = cljs.core._assoc_n["_"];
        if(or__3824__auto____7518) {
          return or__3824__auto____7518
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
    var and__3822__auto____7523 = o;
    if(and__3822__auto____7523) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____7523
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____7524 = o == null ? null : o;
    return function() {
      var or__3824__auto____7525 = cljs.core._deref[goog.typeOf(x__2363__auto____7524)];
      if(or__3824__auto____7525) {
        return or__3824__auto____7525
      }else {
        var or__3824__auto____7526 = cljs.core._deref["_"];
        if(or__3824__auto____7526) {
          return or__3824__auto____7526
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
    var and__3822__auto____7531 = o;
    if(and__3822__auto____7531) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____7531
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____7532 = o == null ? null : o;
    return function() {
      var or__3824__auto____7533 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____7532)];
      if(or__3824__auto____7533) {
        return or__3824__auto____7533
      }else {
        var or__3824__auto____7534 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____7534) {
          return or__3824__auto____7534
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
    var and__3822__auto____7539 = o;
    if(and__3822__auto____7539) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____7539
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____7540 = o == null ? null : o;
    return function() {
      var or__3824__auto____7541 = cljs.core._meta[goog.typeOf(x__2363__auto____7540)];
      if(or__3824__auto____7541) {
        return or__3824__auto____7541
      }else {
        var or__3824__auto____7542 = cljs.core._meta["_"];
        if(or__3824__auto____7542) {
          return or__3824__auto____7542
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
    var and__3822__auto____7547 = o;
    if(and__3822__auto____7547) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____7547
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____7548 = o == null ? null : o;
    return function() {
      var or__3824__auto____7549 = cljs.core._with_meta[goog.typeOf(x__2363__auto____7548)];
      if(or__3824__auto____7549) {
        return or__3824__auto____7549
      }else {
        var or__3824__auto____7550 = cljs.core._with_meta["_"];
        if(or__3824__auto____7550) {
          return or__3824__auto____7550
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
      var and__3822__auto____7559 = coll;
      if(and__3822__auto____7559) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____7559
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____7560 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7561 = cljs.core._reduce[goog.typeOf(x__2363__auto____7560)];
        if(or__3824__auto____7561) {
          return or__3824__auto____7561
        }else {
          var or__3824__auto____7562 = cljs.core._reduce["_"];
          if(or__3824__auto____7562) {
            return or__3824__auto____7562
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____7563 = coll;
      if(and__3822__auto____7563) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____7563
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____7564 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____7565 = cljs.core._reduce[goog.typeOf(x__2363__auto____7564)];
        if(or__3824__auto____7565) {
          return or__3824__auto____7565
        }else {
          var or__3824__auto____7566 = cljs.core._reduce["_"];
          if(or__3824__auto____7566) {
            return or__3824__auto____7566
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
    var and__3822__auto____7571 = coll;
    if(and__3822__auto____7571) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____7571
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____7572 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7573 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____7572)];
      if(or__3824__auto____7573) {
        return or__3824__auto____7573
      }else {
        var or__3824__auto____7574 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____7574) {
          return or__3824__auto____7574
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
    var and__3822__auto____7579 = o;
    if(and__3822__auto____7579) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____7579
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____7580 = o == null ? null : o;
    return function() {
      var or__3824__auto____7581 = cljs.core._equiv[goog.typeOf(x__2363__auto____7580)];
      if(or__3824__auto____7581) {
        return or__3824__auto____7581
      }else {
        var or__3824__auto____7582 = cljs.core._equiv["_"];
        if(or__3824__auto____7582) {
          return or__3824__auto____7582
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
    var and__3822__auto____7587 = o;
    if(and__3822__auto____7587) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____7587
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____7588 = o == null ? null : o;
    return function() {
      var or__3824__auto____7589 = cljs.core._hash[goog.typeOf(x__2363__auto____7588)];
      if(or__3824__auto____7589) {
        return or__3824__auto____7589
      }else {
        var or__3824__auto____7590 = cljs.core._hash["_"];
        if(or__3824__auto____7590) {
          return or__3824__auto____7590
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
    var and__3822__auto____7595 = o;
    if(and__3822__auto____7595) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____7595
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____7596 = o == null ? null : o;
    return function() {
      var or__3824__auto____7597 = cljs.core._seq[goog.typeOf(x__2363__auto____7596)];
      if(or__3824__auto____7597) {
        return or__3824__auto____7597
      }else {
        var or__3824__auto____7598 = cljs.core._seq["_"];
        if(or__3824__auto____7598) {
          return or__3824__auto____7598
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
    var and__3822__auto____7603 = coll;
    if(and__3822__auto____7603) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____7603
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____7604 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7605 = cljs.core._rseq[goog.typeOf(x__2363__auto____7604)];
      if(or__3824__auto____7605) {
        return or__3824__auto____7605
      }else {
        var or__3824__auto____7606 = cljs.core._rseq["_"];
        if(or__3824__auto____7606) {
          return or__3824__auto____7606
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
    var and__3822__auto____7611 = coll;
    if(and__3822__auto____7611) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____7611
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____7612 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7613 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____7612)];
      if(or__3824__auto____7613) {
        return or__3824__auto____7613
      }else {
        var or__3824__auto____7614 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____7614) {
          return or__3824__auto____7614
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____7619 = coll;
    if(and__3822__auto____7619) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____7619
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____7620 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7621 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____7620)];
      if(or__3824__auto____7621) {
        return or__3824__auto____7621
      }else {
        var or__3824__auto____7622 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____7622) {
          return or__3824__auto____7622
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____7627 = coll;
    if(and__3822__auto____7627) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____7627
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____7628 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7629 = cljs.core._entry_key[goog.typeOf(x__2363__auto____7628)];
      if(or__3824__auto____7629) {
        return or__3824__auto____7629
      }else {
        var or__3824__auto____7630 = cljs.core._entry_key["_"];
        if(or__3824__auto____7630) {
          return or__3824__auto____7630
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____7635 = coll;
    if(and__3822__auto____7635) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____7635
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____7636 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7637 = cljs.core._comparator[goog.typeOf(x__2363__auto____7636)];
      if(or__3824__auto____7637) {
        return or__3824__auto____7637
      }else {
        var or__3824__auto____7638 = cljs.core._comparator["_"];
        if(or__3824__auto____7638) {
          return or__3824__auto____7638
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
    var and__3822__auto____7643 = o;
    if(and__3822__auto____7643) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____7643
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____7644 = o == null ? null : o;
    return function() {
      var or__3824__auto____7645 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____7644)];
      if(or__3824__auto____7645) {
        return or__3824__auto____7645
      }else {
        var or__3824__auto____7646 = cljs.core._pr_seq["_"];
        if(or__3824__auto____7646) {
          return or__3824__auto____7646
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
    var and__3822__auto____7651 = d;
    if(and__3822__auto____7651) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____7651
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____7652 = d == null ? null : d;
    return function() {
      var or__3824__auto____7653 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____7652)];
      if(or__3824__auto____7653) {
        return or__3824__auto____7653
      }else {
        var or__3824__auto____7654 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____7654) {
          return or__3824__auto____7654
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
    var and__3822__auto____7659 = this$;
    if(and__3822__auto____7659) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____7659
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____7660 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7661 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____7660)];
      if(or__3824__auto____7661) {
        return or__3824__auto____7661
      }else {
        var or__3824__auto____7662 = cljs.core._notify_watches["_"];
        if(or__3824__auto____7662) {
          return or__3824__auto____7662
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____7667 = this$;
    if(and__3822__auto____7667) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____7667
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____7668 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7669 = cljs.core._add_watch[goog.typeOf(x__2363__auto____7668)];
      if(or__3824__auto____7669) {
        return or__3824__auto____7669
      }else {
        var or__3824__auto____7670 = cljs.core._add_watch["_"];
        if(or__3824__auto____7670) {
          return or__3824__auto____7670
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____7675 = this$;
    if(and__3822__auto____7675) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____7675
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____7676 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7677 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____7676)];
      if(or__3824__auto____7677) {
        return or__3824__auto____7677
      }else {
        var or__3824__auto____7678 = cljs.core._remove_watch["_"];
        if(or__3824__auto____7678) {
          return or__3824__auto____7678
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
    var and__3822__auto____7683 = coll;
    if(and__3822__auto____7683) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____7683
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____7684 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7685 = cljs.core._as_transient[goog.typeOf(x__2363__auto____7684)];
      if(or__3824__auto____7685) {
        return or__3824__auto____7685
      }else {
        var or__3824__auto____7686 = cljs.core._as_transient["_"];
        if(or__3824__auto____7686) {
          return or__3824__auto____7686
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
    var and__3822__auto____7691 = tcoll;
    if(and__3822__auto____7691) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____7691
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____7692 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7693 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____7692)];
      if(or__3824__auto____7693) {
        return or__3824__auto____7693
      }else {
        var or__3824__auto____7694 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____7694) {
          return or__3824__auto____7694
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7699 = tcoll;
    if(and__3822__auto____7699) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____7699
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____7700 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7701 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____7700)];
      if(or__3824__auto____7701) {
        return or__3824__auto____7701
      }else {
        var or__3824__auto____7702 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____7702) {
          return or__3824__auto____7702
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
    var and__3822__auto____7707 = tcoll;
    if(and__3822__auto____7707) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____7707
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____7708 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7709 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____7708)];
      if(or__3824__auto____7709) {
        return or__3824__auto____7709
      }else {
        var or__3824__auto____7710 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____7710) {
          return or__3824__auto____7710
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
    var and__3822__auto____7715 = tcoll;
    if(and__3822__auto____7715) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____7715
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____7716 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7717 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____7716)];
      if(or__3824__auto____7717) {
        return or__3824__auto____7717
      }else {
        var or__3824__auto____7718 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____7718) {
          return or__3824__auto____7718
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
    var and__3822__auto____7723 = tcoll;
    if(and__3822__auto____7723) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____7723
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____7724 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7725 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____7724)];
      if(or__3824__auto____7725) {
        return or__3824__auto____7725
      }else {
        var or__3824__auto____7726 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____7726) {
          return or__3824__auto____7726
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7731 = tcoll;
    if(and__3822__auto____7731) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____7731
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____7732 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7733 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____7732)];
      if(or__3824__auto____7733) {
        return or__3824__auto____7733
      }else {
        var or__3824__auto____7734 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____7734) {
          return or__3824__auto____7734
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
    var and__3822__auto____7739 = tcoll;
    if(and__3822__auto____7739) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____7739
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____7740 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7741 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____7740)];
      if(or__3824__auto____7741) {
        return or__3824__auto____7741
      }else {
        var or__3824__auto____7742 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____7742) {
          return or__3824__auto____7742
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
    var and__3822__auto____7747 = x;
    if(and__3822__auto____7747) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____7747
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____7748 = x == null ? null : x;
    return function() {
      var or__3824__auto____7749 = cljs.core._compare[goog.typeOf(x__2363__auto____7748)];
      if(or__3824__auto____7749) {
        return or__3824__auto____7749
      }else {
        var or__3824__auto____7750 = cljs.core._compare["_"];
        if(or__3824__auto____7750) {
          return or__3824__auto____7750
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
    var and__3822__auto____7755 = coll;
    if(and__3822__auto____7755) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____7755
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____7756 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7757 = cljs.core._drop_first[goog.typeOf(x__2363__auto____7756)];
      if(or__3824__auto____7757) {
        return or__3824__auto____7757
      }else {
        var or__3824__auto____7758 = cljs.core._drop_first["_"];
        if(or__3824__auto____7758) {
          return or__3824__auto____7758
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
    var and__3822__auto____7763 = coll;
    if(and__3822__auto____7763) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____7763
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____7764 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7765 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____7764)];
      if(or__3824__auto____7765) {
        return or__3824__auto____7765
      }else {
        var or__3824__auto____7766 = cljs.core._chunked_first["_"];
        if(or__3824__auto____7766) {
          return or__3824__auto____7766
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____7771 = coll;
    if(and__3822__auto____7771) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____7771
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____7772 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7773 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____7772)];
      if(or__3824__auto____7773) {
        return or__3824__auto____7773
      }else {
        var or__3824__auto____7774 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____7774) {
          return or__3824__auto____7774
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
    var and__3822__auto____7779 = coll;
    if(and__3822__auto____7779) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____7779
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____7780 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7781 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____7780)];
      if(or__3824__auto____7781) {
        return or__3824__auto____7781
      }else {
        var or__3824__auto____7782 = cljs.core._chunked_next["_"];
        if(or__3824__auto____7782) {
          return or__3824__auto____7782
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
    var or__3824__auto____7784 = x === y;
    if(or__3824__auto____7784) {
      return or__3824__auto____7784
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__7785__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7786 = y;
            var G__7787 = cljs.core.first.call(null, more);
            var G__7788 = cljs.core.next.call(null, more);
            x = G__7786;
            y = G__7787;
            more = G__7788;
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
    var G__7785 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7785__delegate.call(this, x, y, more)
    };
    G__7785.cljs$lang$maxFixedArity = 2;
    G__7785.cljs$lang$applyTo = function(arglist__7789) {
      var x = cljs.core.first(arglist__7789);
      var y = cljs.core.first(cljs.core.next(arglist__7789));
      var more = cljs.core.rest(cljs.core.next(arglist__7789));
      return G__7785__delegate(x, y, more)
    };
    G__7785.cljs$lang$arity$variadic = G__7785__delegate;
    return G__7785
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
  var G__7790 = null;
  var G__7790__2 = function(o, k) {
    return null
  };
  var G__7790__3 = function(o, k, not_found) {
    return not_found
  };
  G__7790 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7790__2.call(this, o, k);
      case 3:
        return G__7790__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7790
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
  var G__7791 = null;
  var G__7791__2 = function(_, f) {
    return f.call(null)
  };
  var G__7791__3 = function(_, f, start) {
    return start
  };
  G__7791 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7791__2.call(this, _, f);
      case 3:
        return G__7791__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7791
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
  var G__7792 = null;
  var G__7792__2 = function(_, n) {
    return null
  };
  var G__7792__3 = function(_, n, not_found) {
    return not_found
  };
  G__7792 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7792__2.call(this, _, n);
      case 3:
        return G__7792__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7792
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
  var and__3822__auto____7793 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____7793) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____7793
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
    var cnt__7806 = cljs.core._count.call(null, cicoll);
    if(cnt__7806 === 0) {
      return f.call(null)
    }else {
      var val__7807 = cljs.core._nth.call(null, cicoll, 0);
      var n__7808 = 1;
      while(true) {
        if(n__7808 < cnt__7806) {
          var nval__7809 = f.call(null, val__7807, cljs.core._nth.call(null, cicoll, n__7808));
          if(cljs.core.reduced_QMARK_.call(null, nval__7809)) {
            return cljs.core.deref.call(null, nval__7809)
          }else {
            var G__7818 = nval__7809;
            var G__7819 = n__7808 + 1;
            val__7807 = G__7818;
            n__7808 = G__7819;
            continue
          }
        }else {
          return val__7807
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__7810 = cljs.core._count.call(null, cicoll);
    var val__7811 = val;
    var n__7812 = 0;
    while(true) {
      if(n__7812 < cnt__7810) {
        var nval__7813 = f.call(null, val__7811, cljs.core._nth.call(null, cicoll, n__7812));
        if(cljs.core.reduced_QMARK_.call(null, nval__7813)) {
          return cljs.core.deref.call(null, nval__7813)
        }else {
          var G__7820 = nval__7813;
          var G__7821 = n__7812 + 1;
          val__7811 = G__7820;
          n__7812 = G__7821;
          continue
        }
      }else {
        return val__7811
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__7814 = cljs.core._count.call(null, cicoll);
    var val__7815 = val;
    var n__7816 = idx;
    while(true) {
      if(n__7816 < cnt__7814) {
        var nval__7817 = f.call(null, val__7815, cljs.core._nth.call(null, cicoll, n__7816));
        if(cljs.core.reduced_QMARK_.call(null, nval__7817)) {
          return cljs.core.deref.call(null, nval__7817)
        }else {
          var G__7822 = nval__7817;
          var G__7823 = n__7816 + 1;
          val__7815 = G__7822;
          n__7816 = G__7823;
          continue
        }
      }else {
        return val__7815
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
    var cnt__7836 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__7837 = arr[0];
      var n__7838 = 1;
      while(true) {
        if(n__7838 < cnt__7836) {
          var nval__7839 = f.call(null, val__7837, arr[n__7838]);
          if(cljs.core.reduced_QMARK_.call(null, nval__7839)) {
            return cljs.core.deref.call(null, nval__7839)
          }else {
            var G__7848 = nval__7839;
            var G__7849 = n__7838 + 1;
            val__7837 = G__7848;
            n__7838 = G__7849;
            continue
          }
        }else {
          return val__7837
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__7840 = arr.length;
    var val__7841 = val;
    var n__7842 = 0;
    while(true) {
      if(n__7842 < cnt__7840) {
        var nval__7843 = f.call(null, val__7841, arr[n__7842]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7843)) {
          return cljs.core.deref.call(null, nval__7843)
        }else {
          var G__7850 = nval__7843;
          var G__7851 = n__7842 + 1;
          val__7841 = G__7850;
          n__7842 = G__7851;
          continue
        }
      }else {
        return val__7841
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__7844 = arr.length;
    var val__7845 = val;
    var n__7846 = idx;
    while(true) {
      if(n__7846 < cnt__7844) {
        var nval__7847 = f.call(null, val__7845, arr[n__7846]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7847)) {
          return cljs.core.deref.call(null, nval__7847)
        }else {
          var G__7852 = nval__7847;
          var G__7853 = n__7846 + 1;
          val__7845 = G__7852;
          n__7846 = G__7853;
          continue
        }
      }else {
        return val__7845
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
  var this__7854 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__7855 = this;
  if(this__7855.i + 1 < this__7855.a.length) {
    return new cljs.core.IndexedSeq(this__7855.a, this__7855.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7856 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__7857 = this;
  var c__7858 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__7858 > 0) {
    return new cljs.core.RSeq(coll, c__7858 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__7859 = this;
  var this__7860 = this;
  return cljs.core.pr_str.call(null, this__7860)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7861 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7861.a)) {
    return cljs.core.ci_reduce.call(null, this__7861.a, f, this__7861.a[this__7861.i], this__7861.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__7861.a[this__7861.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7862 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7862.a)) {
    return cljs.core.ci_reduce.call(null, this__7862.a, f, start, this__7862.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7863 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7864 = this;
  return this__7864.a.length - this__7864.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__7865 = this;
  return this__7865.a[this__7865.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__7866 = this;
  if(this__7866.i + 1 < this__7866.a.length) {
    return new cljs.core.IndexedSeq(this__7866.a, this__7866.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7867 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7868 = this;
  var i__7869 = n + this__7868.i;
  if(i__7869 < this__7868.a.length) {
    return this__7868.a[i__7869]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7870 = this;
  var i__7871 = n + this__7870.i;
  if(i__7871 < this__7870.a.length) {
    return this__7870.a[i__7871]
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
  var G__7872 = null;
  var G__7872__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__7872__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__7872 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7872__2.call(this, array, f);
      case 3:
        return G__7872__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7872
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__7873 = null;
  var G__7873__2 = function(array, k) {
    return array[k]
  };
  var G__7873__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__7873 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7873__2.call(this, array, k);
      case 3:
        return G__7873__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7873
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__7874 = null;
  var G__7874__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__7874__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__7874 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7874__2.call(this, array, n);
      case 3:
        return G__7874__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7874
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
  var this__7875 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7876 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__7877 = this;
  var this__7878 = this;
  return cljs.core.pr_str.call(null, this__7878)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7879 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7880 = this;
  return this__7880.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7881 = this;
  return cljs.core._nth.call(null, this__7881.ci, this__7881.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7882 = this;
  if(this__7882.i > 0) {
    return new cljs.core.RSeq(this__7882.ci, this__7882.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7883 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__7884 = this;
  return new cljs.core.RSeq(this__7884.ci, this__7884.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7885 = this;
  return this__7885.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7889__7890 = coll;
      if(G__7889__7890) {
        if(function() {
          var or__3824__auto____7891 = G__7889__7890.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____7891) {
            return or__3824__auto____7891
          }else {
            return G__7889__7890.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__7889__7890.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7889__7890)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7889__7890)
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
      var G__7896__7897 = coll;
      if(G__7896__7897) {
        if(function() {
          var or__3824__auto____7898 = G__7896__7897.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7898) {
            return or__3824__auto____7898
          }else {
            return G__7896__7897.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7896__7897.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7896__7897)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7896__7897)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__7899 = cljs.core.seq.call(null, coll);
      if(s__7899 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__7899)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__7904__7905 = coll;
      if(G__7904__7905) {
        if(function() {
          var or__3824__auto____7906 = G__7904__7905.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7906) {
            return or__3824__auto____7906
          }else {
            return G__7904__7905.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7904__7905.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7904__7905)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7904__7905)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__7907 = cljs.core.seq.call(null, coll);
      if(!(s__7907 == null)) {
        return cljs.core._rest.call(null, s__7907)
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
      var G__7911__7912 = coll;
      if(G__7911__7912) {
        if(function() {
          var or__3824__auto____7913 = G__7911__7912.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____7913) {
            return or__3824__auto____7913
          }else {
            return G__7911__7912.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__7911__7912.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7911__7912)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7911__7912)
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
    var sn__7915 = cljs.core.next.call(null, s);
    if(!(sn__7915 == null)) {
      var G__7916 = sn__7915;
      s = G__7916;
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
    var G__7917__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__7918 = conj.call(null, coll, x);
          var G__7919 = cljs.core.first.call(null, xs);
          var G__7920 = cljs.core.next.call(null, xs);
          coll = G__7918;
          x = G__7919;
          xs = G__7920;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__7917 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7917__delegate.call(this, coll, x, xs)
    };
    G__7917.cljs$lang$maxFixedArity = 2;
    G__7917.cljs$lang$applyTo = function(arglist__7921) {
      var coll = cljs.core.first(arglist__7921);
      var x = cljs.core.first(cljs.core.next(arglist__7921));
      var xs = cljs.core.rest(cljs.core.next(arglist__7921));
      return G__7917__delegate(coll, x, xs)
    };
    G__7917.cljs$lang$arity$variadic = G__7917__delegate;
    return G__7917
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
  var s__7924 = cljs.core.seq.call(null, coll);
  var acc__7925 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__7924)) {
      return acc__7925 + cljs.core._count.call(null, s__7924)
    }else {
      var G__7926 = cljs.core.next.call(null, s__7924);
      var G__7927 = acc__7925 + 1;
      s__7924 = G__7926;
      acc__7925 = G__7927;
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
        var G__7934__7935 = coll;
        if(G__7934__7935) {
          if(function() {
            var or__3824__auto____7936 = G__7934__7935.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7936) {
              return or__3824__auto____7936
            }else {
              return G__7934__7935.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7934__7935.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7934__7935)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7934__7935)
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
        var G__7937__7938 = coll;
        if(G__7937__7938) {
          if(function() {
            var or__3824__auto____7939 = G__7937__7938.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7939) {
              return or__3824__auto____7939
            }else {
              return G__7937__7938.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7937__7938.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7937__7938)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7937__7938)
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
    var G__7942__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__7941 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__7943 = ret__7941;
          var G__7944 = cljs.core.first.call(null, kvs);
          var G__7945 = cljs.core.second.call(null, kvs);
          var G__7946 = cljs.core.nnext.call(null, kvs);
          coll = G__7943;
          k = G__7944;
          v = G__7945;
          kvs = G__7946;
          continue
        }else {
          return ret__7941
        }
        break
      }
    };
    var G__7942 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7942__delegate.call(this, coll, k, v, kvs)
    };
    G__7942.cljs$lang$maxFixedArity = 3;
    G__7942.cljs$lang$applyTo = function(arglist__7947) {
      var coll = cljs.core.first(arglist__7947);
      var k = cljs.core.first(cljs.core.next(arglist__7947));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7947)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7947)));
      return G__7942__delegate(coll, k, v, kvs)
    };
    G__7942.cljs$lang$arity$variadic = G__7942__delegate;
    return G__7942
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
    var G__7950__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7949 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7951 = ret__7949;
          var G__7952 = cljs.core.first.call(null, ks);
          var G__7953 = cljs.core.next.call(null, ks);
          coll = G__7951;
          k = G__7952;
          ks = G__7953;
          continue
        }else {
          return ret__7949
        }
        break
      }
    };
    var G__7950 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7950__delegate.call(this, coll, k, ks)
    };
    G__7950.cljs$lang$maxFixedArity = 2;
    G__7950.cljs$lang$applyTo = function(arglist__7954) {
      var coll = cljs.core.first(arglist__7954);
      var k = cljs.core.first(cljs.core.next(arglist__7954));
      var ks = cljs.core.rest(cljs.core.next(arglist__7954));
      return G__7950__delegate(coll, k, ks)
    };
    G__7950.cljs$lang$arity$variadic = G__7950__delegate;
    return G__7950
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
    var G__7958__7959 = o;
    if(G__7958__7959) {
      if(function() {
        var or__3824__auto____7960 = G__7958__7959.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____7960) {
          return or__3824__auto____7960
        }else {
          return G__7958__7959.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7958__7959.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7958__7959)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7958__7959)
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
    var G__7963__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7962 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7964 = ret__7962;
          var G__7965 = cljs.core.first.call(null, ks);
          var G__7966 = cljs.core.next.call(null, ks);
          coll = G__7964;
          k = G__7965;
          ks = G__7966;
          continue
        }else {
          return ret__7962
        }
        break
      }
    };
    var G__7963 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7963__delegate.call(this, coll, k, ks)
    };
    G__7963.cljs$lang$maxFixedArity = 2;
    G__7963.cljs$lang$applyTo = function(arglist__7967) {
      var coll = cljs.core.first(arglist__7967);
      var k = cljs.core.first(cljs.core.next(arglist__7967));
      var ks = cljs.core.rest(cljs.core.next(arglist__7967));
      return G__7963__delegate(coll, k, ks)
    };
    G__7963.cljs$lang$arity$variadic = G__7963__delegate;
    return G__7963
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
  var h__7969 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__7969;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__7969
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__7971 = cljs.core.string_hash_cache[k];
  if(!(h__7971 == null)) {
    return h__7971
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
      var and__3822__auto____7973 = goog.isString(o);
      if(and__3822__auto____7973) {
        return check_cache
      }else {
        return and__3822__auto____7973
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
    var G__7977__7978 = x;
    if(G__7977__7978) {
      if(function() {
        var or__3824__auto____7979 = G__7977__7978.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____7979) {
          return or__3824__auto____7979
        }else {
          return G__7977__7978.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__7977__7978.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7977__7978)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7977__7978)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7983__7984 = x;
    if(G__7983__7984) {
      if(function() {
        var or__3824__auto____7985 = G__7983__7984.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____7985) {
          return or__3824__auto____7985
        }else {
          return G__7983__7984.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__7983__7984.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7983__7984)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7983__7984)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__7989__7990 = x;
  if(G__7989__7990) {
    if(function() {
      var or__3824__auto____7991 = G__7989__7990.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____7991) {
        return or__3824__auto____7991
      }else {
        return G__7989__7990.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__7989__7990.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7989__7990)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7989__7990)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__7995__7996 = x;
  if(G__7995__7996) {
    if(function() {
      var or__3824__auto____7997 = G__7995__7996.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____7997) {
        return or__3824__auto____7997
      }else {
        return G__7995__7996.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__7995__7996.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7995__7996)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7995__7996)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__8001__8002 = x;
  if(G__8001__8002) {
    if(function() {
      var or__3824__auto____8003 = G__8001__8002.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____8003) {
        return or__3824__auto____8003
      }else {
        return G__8001__8002.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__8001__8002.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__8001__8002)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__8001__8002)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__8007__8008 = x;
  if(G__8007__8008) {
    if(function() {
      var or__3824__auto____8009 = G__8007__8008.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____8009) {
        return or__3824__auto____8009
      }else {
        return G__8007__8008.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__8007__8008.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8007__8008)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__8007__8008)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__8013__8014 = x;
  if(G__8013__8014) {
    if(function() {
      var or__3824__auto____8015 = G__8013__8014.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____8015) {
        return or__3824__auto____8015
      }else {
        return G__8013__8014.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__8013__8014.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8013__8014)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8013__8014)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__8019__8020 = x;
    if(G__8019__8020) {
      if(function() {
        var or__3824__auto____8021 = G__8019__8020.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____8021) {
          return or__3824__auto____8021
        }else {
          return G__8019__8020.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__8019__8020.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__8019__8020)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__8019__8020)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__8025__8026 = x;
  if(G__8025__8026) {
    if(function() {
      var or__3824__auto____8027 = G__8025__8026.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____8027) {
        return or__3824__auto____8027
      }else {
        return G__8025__8026.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__8025__8026.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__8025__8026)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__8025__8026)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__8031__8032 = x;
  if(G__8031__8032) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____8033 = null;
      if(cljs.core.truth_(or__3824__auto____8033)) {
        return or__3824__auto____8033
      }else {
        return G__8031__8032.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__8031__8032.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__8031__8032)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__8031__8032)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__8034__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__8034 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8034__delegate.call(this, keyvals)
    };
    G__8034.cljs$lang$maxFixedArity = 0;
    G__8034.cljs$lang$applyTo = function(arglist__8035) {
      var keyvals = cljs.core.seq(arglist__8035);
      return G__8034__delegate(keyvals)
    };
    G__8034.cljs$lang$arity$variadic = G__8034__delegate;
    return G__8034
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
  var keys__8037 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__8037.push(key)
  });
  return keys__8037
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__8041 = i;
  var j__8042 = j;
  var len__8043 = len;
  while(true) {
    if(len__8043 === 0) {
      return to
    }else {
      to[j__8042] = from[i__8041];
      var G__8044 = i__8041 + 1;
      var G__8045 = j__8042 + 1;
      var G__8046 = len__8043 - 1;
      i__8041 = G__8044;
      j__8042 = G__8045;
      len__8043 = G__8046;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__8050 = i + (len - 1);
  var j__8051 = j + (len - 1);
  var len__8052 = len;
  while(true) {
    if(len__8052 === 0) {
      return to
    }else {
      to[j__8051] = from[i__8050];
      var G__8053 = i__8050 - 1;
      var G__8054 = j__8051 - 1;
      var G__8055 = len__8052 - 1;
      i__8050 = G__8053;
      j__8051 = G__8054;
      len__8052 = G__8055;
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
    var G__8059__8060 = s;
    if(G__8059__8060) {
      if(function() {
        var or__3824__auto____8061 = G__8059__8060.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____8061) {
          return or__3824__auto____8061
        }else {
          return G__8059__8060.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__8059__8060.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8059__8060)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8059__8060)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__8065__8066 = s;
  if(G__8065__8066) {
    if(function() {
      var or__3824__auto____8067 = G__8065__8066.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____8067) {
        return or__3824__auto____8067
      }else {
        return G__8065__8066.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__8065__8066.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__8065__8066)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__8065__8066)
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
  var and__3822__auto____8070 = goog.isString(x);
  if(and__3822__auto____8070) {
    return!function() {
      var or__3824__auto____8071 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____8071) {
        return or__3824__auto____8071
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____8070
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____8073 = goog.isString(x);
  if(and__3822__auto____8073) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____8073
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____8075 = goog.isString(x);
  if(and__3822__auto____8075) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____8075
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____8080 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____8080) {
    return or__3824__auto____8080
  }else {
    var G__8081__8082 = f;
    if(G__8081__8082) {
      if(function() {
        var or__3824__auto____8083 = G__8081__8082.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____8083) {
          return or__3824__auto____8083
        }else {
          return G__8081__8082.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__8081__8082.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__8081__8082)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__8081__8082)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____8085 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____8085) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____8085
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
    var and__3822__auto____8088 = coll;
    if(cljs.core.truth_(and__3822__auto____8088)) {
      var and__3822__auto____8089 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____8089) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____8089
      }
    }else {
      return and__3822__auto____8088
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
    var G__8098__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__8094 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__8095 = more;
        while(true) {
          var x__8096 = cljs.core.first.call(null, xs__8095);
          var etc__8097 = cljs.core.next.call(null, xs__8095);
          if(cljs.core.truth_(xs__8095)) {
            if(cljs.core.contains_QMARK_.call(null, s__8094, x__8096)) {
              return false
            }else {
              var G__8099 = cljs.core.conj.call(null, s__8094, x__8096);
              var G__8100 = etc__8097;
              s__8094 = G__8099;
              xs__8095 = G__8100;
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
    var G__8098 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8098__delegate.call(this, x, y, more)
    };
    G__8098.cljs$lang$maxFixedArity = 2;
    G__8098.cljs$lang$applyTo = function(arglist__8101) {
      var x = cljs.core.first(arglist__8101);
      var y = cljs.core.first(cljs.core.next(arglist__8101));
      var more = cljs.core.rest(cljs.core.next(arglist__8101));
      return G__8098__delegate(x, y, more)
    };
    G__8098.cljs$lang$arity$variadic = G__8098__delegate;
    return G__8098
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
            var G__8105__8106 = x;
            if(G__8105__8106) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____8107 = null;
                if(cljs.core.truth_(or__3824__auto____8107)) {
                  return or__3824__auto____8107
                }else {
                  return G__8105__8106.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__8105__8106.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__8105__8106)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__8105__8106)
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
    var xl__8112 = cljs.core.count.call(null, xs);
    var yl__8113 = cljs.core.count.call(null, ys);
    if(xl__8112 < yl__8113) {
      return-1
    }else {
      if(xl__8112 > yl__8113) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__8112, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__8114 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____8115 = d__8114 === 0;
        if(and__3822__auto____8115) {
          return n + 1 < len
        }else {
          return and__3822__auto____8115
        }
      }()) {
        var G__8116 = xs;
        var G__8117 = ys;
        var G__8118 = len;
        var G__8119 = n + 1;
        xs = G__8116;
        ys = G__8117;
        len = G__8118;
        n = G__8119;
        continue
      }else {
        return d__8114
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
      var r__8121 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__8121)) {
        return r__8121
      }else {
        if(cljs.core.truth_(r__8121)) {
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
      var a__8123 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__8123, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__8123)
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
    var temp__3971__auto____8129 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____8129) {
      var s__8130 = temp__3971__auto____8129;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__8130), cljs.core.next.call(null, s__8130))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__8131 = val;
    var coll__8132 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__8132) {
        var nval__8133 = f.call(null, val__8131, cljs.core.first.call(null, coll__8132));
        if(cljs.core.reduced_QMARK_.call(null, nval__8133)) {
          return cljs.core.deref.call(null, nval__8133)
        }else {
          var G__8134 = nval__8133;
          var G__8135 = cljs.core.next.call(null, coll__8132);
          val__8131 = G__8134;
          coll__8132 = G__8135;
          continue
        }
      }else {
        return val__8131
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
  var a__8137 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__8137);
  return cljs.core.vec.call(null, a__8137)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__8144__8145 = coll;
      if(G__8144__8145) {
        if(function() {
          var or__3824__auto____8146 = G__8144__8145.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____8146) {
            return or__3824__auto____8146
          }else {
            return G__8144__8145.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__8144__8145.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8144__8145)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8144__8145)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__8147__8148 = coll;
      if(G__8147__8148) {
        if(function() {
          var or__3824__auto____8149 = G__8147__8148.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____8149) {
            return or__3824__auto____8149
          }else {
            return G__8147__8148.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__8147__8148.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8147__8148)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__8147__8148)
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
  var this__8150 = this;
  return this__8150.val
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
    var G__8151__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__8151 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8151__delegate.call(this, x, y, more)
    };
    G__8151.cljs$lang$maxFixedArity = 2;
    G__8151.cljs$lang$applyTo = function(arglist__8152) {
      var x = cljs.core.first(arglist__8152);
      var y = cljs.core.first(cljs.core.next(arglist__8152));
      var more = cljs.core.rest(cljs.core.next(arglist__8152));
      return G__8151__delegate(x, y, more)
    };
    G__8151.cljs$lang$arity$variadic = G__8151__delegate;
    return G__8151
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
    var G__8153__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__8153 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8153__delegate.call(this, x, y, more)
    };
    G__8153.cljs$lang$maxFixedArity = 2;
    G__8153.cljs$lang$applyTo = function(arglist__8154) {
      var x = cljs.core.first(arglist__8154);
      var y = cljs.core.first(cljs.core.next(arglist__8154));
      var more = cljs.core.rest(cljs.core.next(arglist__8154));
      return G__8153__delegate(x, y, more)
    };
    G__8153.cljs$lang$arity$variadic = G__8153__delegate;
    return G__8153
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
    var G__8155__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__8155 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8155__delegate.call(this, x, y, more)
    };
    G__8155.cljs$lang$maxFixedArity = 2;
    G__8155.cljs$lang$applyTo = function(arglist__8156) {
      var x = cljs.core.first(arglist__8156);
      var y = cljs.core.first(cljs.core.next(arglist__8156));
      var more = cljs.core.rest(cljs.core.next(arglist__8156));
      return G__8155__delegate(x, y, more)
    };
    G__8155.cljs$lang$arity$variadic = G__8155__delegate;
    return G__8155
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
    var G__8157__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__8157 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8157__delegate.call(this, x, y, more)
    };
    G__8157.cljs$lang$maxFixedArity = 2;
    G__8157.cljs$lang$applyTo = function(arglist__8158) {
      var x = cljs.core.first(arglist__8158);
      var y = cljs.core.first(cljs.core.next(arglist__8158));
      var more = cljs.core.rest(cljs.core.next(arglist__8158));
      return G__8157__delegate(x, y, more)
    };
    G__8157.cljs$lang$arity$variadic = G__8157__delegate;
    return G__8157
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
    var G__8159__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__8160 = y;
            var G__8161 = cljs.core.first.call(null, more);
            var G__8162 = cljs.core.next.call(null, more);
            x = G__8160;
            y = G__8161;
            more = G__8162;
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
    var G__8159 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8159__delegate.call(this, x, y, more)
    };
    G__8159.cljs$lang$maxFixedArity = 2;
    G__8159.cljs$lang$applyTo = function(arglist__8163) {
      var x = cljs.core.first(arglist__8163);
      var y = cljs.core.first(cljs.core.next(arglist__8163));
      var more = cljs.core.rest(cljs.core.next(arglist__8163));
      return G__8159__delegate(x, y, more)
    };
    G__8159.cljs$lang$arity$variadic = G__8159__delegate;
    return G__8159
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
    var G__8164__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__8165 = y;
            var G__8166 = cljs.core.first.call(null, more);
            var G__8167 = cljs.core.next.call(null, more);
            x = G__8165;
            y = G__8166;
            more = G__8167;
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
    var G__8164 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8164__delegate.call(this, x, y, more)
    };
    G__8164.cljs$lang$maxFixedArity = 2;
    G__8164.cljs$lang$applyTo = function(arglist__8168) {
      var x = cljs.core.first(arglist__8168);
      var y = cljs.core.first(cljs.core.next(arglist__8168));
      var more = cljs.core.rest(cljs.core.next(arglist__8168));
      return G__8164__delegate(x, y, more)
    };
    G__8164.cljs$lang$arity$variadic = G__8164__delegate;
    return G__8164
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
    var G__8169__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__8170 = y;
            var G__8171 = cljs.core.first.call(null, more);
            var G__8172 = cljs.core.next.call(null, more);
            x = G__8170;
            y = G__8171;
            more = G__8172;
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
    var G__8169 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8169__delegate.call(this, x, y, more)
    };
    G__8169.cljs$lang$maxFixedArity = 2;
    G__8169.cljs$lang$applyTo = function(arglist__8173) {
      var x = cljs.core.first(arglist__8173);
      var y = cljs.core.first(cljs.core.next(arglist__8173));
      var more = cljs.core.rest(cljs.core.next(arglist__8173));
      return G__8169__delegate(x, y, more)
    };
    G__8169.cljs$lang$arity$variadic = G__8169__delegate;
    return G__8169
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
    var G__8174__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__8175 = y;
            var G__8176 = cljs.core.first.call(null, more);
            var G__8177 = cljs.core.next.call(null, more);
            x = G__8175;
            y = G__8176;
            more = G__8177;
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
    var G__8174 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8174__delegate.call(this, x, y, more)
    };
    G__8174.cljs$lang$maxFixedArity = 2;
    G__8174.cljs$lang$applyTo = function(arglist__8178) {
      var x = cljs.core.first(arglist__8178);
      var y = cljs.core.first(cljs.core.next(arglist__8178));
      var more = cljs.core.rest(cljs.core.next(arglist__8178));
      return G__8174__delegate(x, y, more)
    };
    G__8174.cljs$lang$arity$variadic = G__8174__delegate;
    return G__8174
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
    var G__8179__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__8179 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8179__delegate.call(this, x, y, more)
    };
    G__8179.cljs$lang$maxFixedArity = 2;
    G__8179.cljs$lang$applyTo = function(arglist__8180) {
      var x = cljs.core.first(arglist__8180);
      var y = cljs.core.first(cljs.core.next(arglist__8180));
      var more = cljs.core.rest(cljs.core.next(arglist__8180));
      return G__8179__delegate(x, y, more)
    };
    G__8179.cljs$lang$arity$variadic = G__8179__delegate;
    return G__8179
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
    var G__8181__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__8181 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8181__delegate.call(this, x, y, more)
    };
    G__8181.cljs$lang$maxFixedArity = 2;
    G__8181.cljs$lang$applyTo = function(arglist__8182) {
      var x = cljs.core.first(arglist__8182);
      var y = cljs.core.first(cljs.core.next(arglist__8182));
      var more = cljs.core.rest(cljs.core.next(arglist__8182));
      return G__8181__delegate(x, y, more)
    };
    G__8181.cljs$lang$arity$variadic = G__8181__delegate;
    return G__8181
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
  var rem__8184 = n % d;
  return cljs.core.fix.call(null, (n - rem__8184) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__8186 = cljs.core.quot.call(null, n, d);
  return n - d * q__8186
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
  var v__8189 = v - (v >> 1 & 1431655765);
  var v__8190 = (v__8189 & 858993459) + (v__8189 >> 2 & 858993459);
  return(v__8190 + (v__8190 >> 4) & 252645135) * 16843009 >> 24
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
    var G__8191__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__8192 = y;
            var G__8193 = cljs.core.first.call(null, more);
            var G__8194 = cljs.core.next.call(null, more);
            x = G__8192;
            y = G__8193;
            more = G__8194;
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
    var G__8191 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8191__delegate.call(this, x, y, more)
    };
    G__8191.cljs$lang$maxFixedArity = 2;
    G__8191.cljs$lang$applyTo = function(arglist__8195) {
      var x = cljs.core.first(arglist__8195);
      var y = cljs.core.first(cljs.core.next(arglist__8195));
      var more = cljs.core.rest(cljs.core.next(arglist__8195));
      return G__8191__delegate(x, y, more)
    };
    G__8191.cljs$lang$arity$variadic = G__8191__delegate;
    return G__8191
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
  var n__8199 = n;
  var xs__8200 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____8201 = xs__8200;
      if(and__3822__auto____8201) {
        return n__8199 > 0
      }else {
        return and__3822__auto____8201
      }
    }())) {
      var G__8202 = n__8199 - 1;
      var G__8203 = cljs.core.next.call(null, xs__8200);
      n__8199 = G__8202;
      xs__8200 = G__8203;
      continue
    }else {
      return xs__8200
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
    var G__8204__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__8205 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__8206 = cljs.core.next.call(null, more);
            sb = G__8205;
            more = G__8206;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__8204 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8204__delegate.call(this, x, ys)
    };
    G__8204.cljs$lang$maxFixedArity = 1;
    G__8204.cljs$lang$applyTo = function(arglist__8207) {
      var x = cljs.core.first(arglist__8207);
      var ys = cljs.core.rest(arglist__8207);
      return G__8204__delegate(x, ys)
    };
    G__8204.cljs$lang$arity$variadic = G__8204__delegate;
    return G__8204
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
    var G__8208__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__8209 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__8210 = cljs.core.next.call(null, more);
            sb = G__8209;
            more = G__8210;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__8208 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8208__delegate.call(this, x, ys)
    };
    G__8208.cljs$lang$maxFixedArity = 1;
    G__8208.cljs$lang$applyTo = function(arglist__8211) {
      var x = cljs.core.first(arglist__8211);
      var ys = cljs.core.rest(arglist__8211);
      return G__8208__delegate(x, ys)
    };
    G__8208.cljs$lang$arity$variadic = G__8208__delegate;
    return G__8208
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
  format.cljs$lang$applyTo = function(arglist__8212) {
    var fmt = cljs.core.first(arglist__8212);
    var args = cljs.core.rest(arglist__8212);
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
    var xs__8215 = cljs.core.seq.call(null, x);
    var ys__8216 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__8215 == null) {
        return ys__8216 == null
      }else {
        if(ys__8216 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__8215), cljs.core.first.call(null, ys__8216))) {
            var G__8217 = cljs.core.next.call(null, xs__8215);
            var G__8218 = cljs.core.next.call(null, ys__8216);
            xs__8215 = G__8217;
            ys__8216 = G__8218;
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
  return cljs.core.reduce.call(null, function(p1__8219_SHARP_, p2__8220_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__8219_SHARP_, cljs.core.hash.call(null, p2__8220_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__8224 = 0;
  var s__8225 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__8225) {
      var e__8226 = cljs.core.first.call(null, s__8225);
      var G__8227 = (h__8224 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__8226)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__8226)))) % 4503599627370496;
      var G__8228 = cljs.core.next.call(null, s__8225);
      h__8224 = G__8227;
      s__8225 = G__8228;
      continue
    }else {
      return h__8224
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__8232 = 0;
  var s__8233 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__8233) {
      var e__8234 = cljs.core.first.call(null, s__8233);
      var G__8235 = (h__8232 + cljs.core.hash.call(null, e__8234)) % 4503599627370496;
      var G__8236 = cljs.core.next.call(null, s__8233);
      h__8232 = G__8235;
      s__8233 = G__8236;
      continue
    }else {
      return h__8232
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__8257__8258 = cljs.core.seq.call(null, fn_map);
  if(G__8257__8258) {
    var G__8260__8262 = cljs.core.first.call(null, G__8257__8258);
    var vec__8261__8263 = G__8260__8262;
    var key_name__8264 = cljs.core.nth.call(null, vec__8261__8263, 0, null);
    var f__8265 = cljs.core.nth.call(null, vec__8261__8263, 1, null);
    var G__8257__8266 = G__8257__8258;
    var G__8260__8267 = G__8260__8262;
    var G__8257__8268 = G__8257__8266;
    while(true) {
      var vec__8269__8270 = G__8260__8267;
      var key_name__8271 = cljs.core.nth.call(null, vec__8269__8270, 0, null);
      var f__8272 = cljs.core.nth.call(null, vec__8269__8270, 1, null);
      var G__8257__8273 = G__8257__8268;
      var str_name__8274 = cljs.core.name.call(null, key_name__8271);
      obj[str_name__8274] = f__8272;
      var temp__3974__auto____8275 = cljs.core.next.call(null, G__8257__8273);
      if(temp__3974__auto____8275) {
        var G__8257__8276 = temp__3974__auto____8275;
        var G__8277 = cljs.core.first.call(null, G__8257__8276);
        var G__8278 = G__8257__8276;
        G__8260__8267 = G__8277;
        G__8257__8268 = G__8278;
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
  var this__8279 = this;
  var h__2192__auto____8280 = this__8279.__hash;
  if(!(h__2192__auto____8280 == null)) {
    return h__2192__auto____8280
  }else {
    var h__2192__auto____8281 = cljs.core.hash_coll.call(null, coll);
    this__8279.__hash = h__2192__auto____8281;
    return h__2192__auto____8281
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8282 = this;
  if(this__8282.count === 1) {
    return null
  }else {
    return this__8282.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8283 = this;
  return new cljs.core.List(this__8283.meta, o, coll, this__8283.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__8284 = this;
  var this__8285 = this;
  return cljs.core.pr_str.call(null, this__8285)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8286 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8287 = this;
  return this__8287.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8288 = this;
  return this__8288.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8289 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8290 = this;
  return this__8290.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8291 = this;
  if(this__8291.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__8291.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8292 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8293 = this;
  return new cljs.core.List(meta, this__8293.first, this__8293.rest, this__8293.count, this__8293.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8294 = this;
  return this__8294.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8295 = this;
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
  var this__8296 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8297 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8298 = this;
  return new cljs.core.List(this__8298.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__8299 = this;
  var this__8300 = this;
  return cljs.core.pr_str.call(null, this__8300)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8301 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8302 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8303 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8304 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8305 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8306 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8307 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8308 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8309 = this;
  return this__8309.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8310 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__8314__8315 = coll;
  if(G__8314__8315) {
    if(function() {
      var or__3824__auto____8316 = G__8314__8315.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____8316) {
        return or__3824__auto____8316
      }else {
        return G__8314__8315.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__8314__8315.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__8314__8315)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__8314__8315)
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
    var G__8317__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__8317 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8317__delegate.call(this, x, y, z, items)
    };
    G__8317.cljs$lang$maxFixedArity = 3;
    G__8317.cljs$lang$applyTo = function(arglist__8318) {
      var x = cljs.core.first(arglist__8318);
      var y = cljs.core.first(cljs.core.next(arglist__8318));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8318)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8318)));
      return G__8317__delegate(x, y, z, items)
    };
    G__8317.cljs$lang$arity$variadic = G__8317__delegate;
    return G__8317
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
  var this__8319 = this;
  var h__2192__auto____8320 = this__8319.__hash;
  if(!(h__2192__auto____8320 == null)) {
    return h__2192__auto____8320
  }else {
    var h__2192__auto____8321 = cljs.core.hash_coll.call(null, coll);
    this__8319.__hash = h__2192__auto____8321;
    return h__2192__auto____8321
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8322 = this;
  if(this__8322.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__8322.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8323 = this;
  return new cljs.core.Cons(null, o, coll, this__8323.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__8324 = this;
  var this__8325 = this;
  return cljs.core.pr_str.call(null, this__8325)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8326 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8327 = this;
  return this__8327.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8328 = this;
  if(this__8328.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__8328.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8329 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8330 = this;
  return new cljs.core.Cons(meta, this__8330.first, this__8330.rest, this__8330.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8331 = this;
  return this__8331.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8332 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8332.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____8337 = coll == null;
    if(or__3824__auto____8337) {
      return or__3824__auto____8337
    }else {
      var G__8338__8339 = coll;
      if(G__8338__8339) {
        if(function() {
          var or__3824__auto____8340 = G__8338__8339.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____8340) {
            return or__3824__auto____8340
          }else {
            return G__8338__8339.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__8338__8339.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8338__8339)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8338__8339)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__8344__8345 = x;
  if(G__8344__8345) {
    if(function() {
      var or__3824__auto____8346 = G__8344__8345.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____8346) {
        return or__3824__auto____8346
      }else {
        return G__8344__8345.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__8344__8345.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__8344__8345)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__8344__8345)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__8347 = null;
  var G__8347__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__8347__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__8347 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8347__2.call(this, string, f);
      case 3:
        return G__8347__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8347
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__8348 = null;
  var G__8348__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__8348__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__8348 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8348__2.call(this, string, k);
      case 3:
        return G__8348__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8348
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__8349 = null;
  var G__8349__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__8349__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__8349 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8349__2.call(this, string, n);
      case 3:
        return G__8349__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8349
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
  var G__8361 = null;
  var G__8361__2 = function(this_sym8352, coll) {
    var this__8354 = this;
    var this_sym8352__8355 = this;
    var ___8356 = this_sym8352__8355;
    if(coll == null) {
      return null
    }else {
      var strobj__8357 = coll.strobj;
      if(strobj__8357 == null) {
        return cljs.core._lookup.call(null, coll, this__8354.k, null)
      }else {
        return strobj__8357[this__8354.k]
      }
    }
  };
  var G__8361__3 = function(this_sym8353, coll, not_found) {
    var this__8354 = this;
    var this_sym8353__8358 = this;
    var ___8359 = this_sym8353__8358;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__8354.k, not_found)
    }
  };
  G__8361 = function(this_sym8353, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8361__2.call(this, this_sym8353, coll);
      case 3:
        return G__8361__3.call(this, this_sym8353, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8361
}();
cljs.core.Keyword.prototype.apply = function(this_sym8350, args8351) {
  var this__8360 = this;
  return this_sym8350.call.apply(this_sym8350, [this_sym8350].concat(args8351.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__8370 = null;
  var G__8370__2 = function(this_sym8364, coll) {
    var this_sym8364__8366 = this;
    var this__8367 = this_sym8364__8366;
    return cljs.core._lookup.call(null, coll, this__8367.toString(), null)
  };
  var G__8370__3 = function(this_sym8365, coll, not_found) {
    var this_sym8365__8368 = this;
    var this__8369 = this_sym8365__8368;
    return cljs.core._lookup.call(null, coll, this__8369.toString(), not_found)
  };
  G__8370 = function(this_sym8365, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8370__2.call(this, this_sym8365, coll);
      case 3:
        return G__8370__3.call(this, this_sym8365, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8370
}();
String.prototype.apply = function(this_sym8362, args8363) {
  return this_sym8362.call.apply(this_sym8362, [this_sym8362].concat(args8363.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__8372 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__8372
  }else {
    lazy_seq.x = x__8372.call(null);
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
  var this__8373 = this;
  var h__2192__auto____8374 = this__8373.__hash;
  if(!(h__2192__auto____8374 == null)) {
    return h__2192__auto____8374
  }else {
    var h__2192__auto____8375 = cljs.core.hash_coll.call(null, coll);
    this__8373.__hash = h__2192__auto____8375;
    return h__2192__auto____8375
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8376 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8377 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__8378 = this;
  var this__8379 = this;
  return cljs.core.pr_str.call(null, this__8379)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8380 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8381 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8382 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8383 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8384 = this;
  return new cljs.core.LazySeq(meta, this__8384.realized, this__8384.x, this__8384.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8385 = this;
  return this__8385.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8386 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8386.meta)
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
  var this__8387 = this;
  return this__8387.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__8388 = this;
  var ___8389 = this;
  this__8388.buf[this__8388.end] = o;
  return this__8388.end = this__8388.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__8390 = this;
  var ___8391 = this;
  var ret__8392 = new cljs.core.ArrayChunk(this__8390.buf, 0, this__8390.end);
  this__8390.buf = null;
  return ret__8392
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
  var this__8393 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__8393.arr[this__8393.off], this__8393.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8394 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__8394.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__8395 = this;
  if(this__8395.off === this__8395.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__8395.arr, this__8395.off + 1, this__8395.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__8396 = this;
  return this__8396.arr[this__8396.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__8397 = this;
  if(function() {
    var and__3822__auto____8398 = i >= 0;
    if(and__3822__auto____8398) {
      return i < this__8397.end - this__8397.off
    }else {
      return and__3822__auto____8398
    }
  }()) {
    return this__8397.arr[this__8397.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__8399 = this;
  return this__8399.end - this__8399.off
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
  var this__8400 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8401 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8402 = this;
  return cljs.core._nth.call(null, this__8402.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8403 = this;
  if(cljs.core._count.call(null, this__8403.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__8403.chunk), this__8403.more, this__8403.meta)
  }else {
    if(this__8403.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__8403.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8404 = this;
  if(this__8404.more == null) {
    return null
  }else {
    return this__8404.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8405 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8406 = this;
  return new cljs.core.ChunkedCons(this__8406.chunk, this__8406.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8407 = this;
  return this__8407.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8408 = this;
  return this__8408.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8409 = this;
  if(this__8409.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__8409.more
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
    var G__8413__8414 = s;
    if(G__8413__8414) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____8415 = null;
        if(cljs.core.truth_(or__3824__auto____8415)) {
          return or__3824__auto____8415
        }else {
          return G__8413__8414.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__8413__8414.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__8413__8414)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__8413__8414)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__8418 = [];
  var s__8419 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__8419)) {
      ary__8418.push(cljs.core.first.call(null, s__8419));
      var G__8420 = cljs.core.next.call(null, s__8419);
      s__8419 = G__8420;
      continue
    }else {
      return ary__8418
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__8424 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__8425 = 0;
  var xs__8426 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__8426) {
      ret__8424[i__8425] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__8426));
      var G__8427 = i__8425 + 1;
      var G__8428 = cljs.core.next.call(null, xs__8426);
      i__8425 = G__8427;
      xs__8426 = G__8428;
      continue
    }else {
    }
    break
  }
  return ret__8424
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
    var a__8436 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8437 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8438 = 0;
      var s__8439 = s__8437;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8440 = s__8439;
          if(and__3822__auto____8440) {
            return i__8438 < size
          }else {
            return and__3822__auto____8440
          }
        }())) {
          a__8436[i__8438] = cljs.core.first.call(null, s__8439);
          var G__8443 = i__8438 + 1;
          var G__8444 = cljs.core.next.call(null, s__8439);
          i__8438 = G__8443;
          s__8439 = G__8444;
          continue
        }else {
          return a__8436
        }
        break
      }
    }else {
      var n__2527__auto____8441 = size;
      var i__8442 = 0;
      while(true) {
        if(i__8442 < n__2527__auto____8441) {
          a__8436[i__8442] = init_val_or_seq;
          var G__8445 = i__8442 + 1;
          i__8442 = G__8445;
          continue
        }else {
        }
        break
      }
      return a__8436
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
    var a__8453 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8454 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8455 = 0;
      var s__8456 = s__8454;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8457 = s__8456;
          if(and__3822__auto____8457) {
            return i__8455 < size
          }else {
            return and__3822__auto____8457
          }
        }())) {
          a__8453[i__8455] = cljs.core.first.call(null, s__8456);
          var G__8460 = i__8455 + 1;
          var G__8461 = cljs.core.next.call(null, s__8456);
          i__8455 = G__8460;
          s__8456 = G__8461;
          continue
        }else {
          return a__8453
        }
        break
      }
    }else {
      var n__2527__auto____8458 = size;
      var i__8459 = 0;
      while(true) {
        if(i__8459 < n__2527__auto____8458) {
          a__8453[i__8459] = init_val_or_seq;
          var G__8462 = i__8459 + 1;
          i__8459 = G__8462;
          continue
        }else {
        }
        break
      }
      return a__8453
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
    var a__8470 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__8471 = cljs.core.seq.call(null, init_val_or_seq);
      var i__8472 = 0;
      var s__8473 = s__8471;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____8474 = s__8473;
          if(and__3822__auto____8474) {
            return i__8472 < size
          }else {
            return and__3822__auto____8474
          }
        }())) {
          a__8470[i__8472] = cljs.core.first.call(null, s__8473);
          var G__8477 = i__8472 + 1;
          var G__8478 = cljs.core.next.call(null, s__8473);
          i__8472 = G__8477;
          s__8473 = G__8478;
          continue
        }else {
          return a__8470
        }
        break
      }
    }else {
      var n__2527__auto____8475 = size;
      var i__8476 = 0;
      while(true) {
        if(i__8476 < n__2527__auto____8475) {
          a__8470[i__8476] = init_val_or_seq;
          var G__8479 = i__8476 + 1;
          i__8476 = G__8479;
          continue
        }else {
        }
        break
      }
      return a__8470
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
    var s__8484 = s;
    var i__8485 = n;
    var sum__8486 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____8487 = i__8485 > 0;
        if(and__3822__auto____8487) {
          return cljs.core.seq.call(null, s__8484)
        }else {
          return and__3822__auto____8487
        }
      }())) {
        var G__8488 = cljs.core.next.call(null, s__8484);
        var G__8489 = i__8485 - 1;
        var G__8490 = sum__8486 + 1;
        s__8484 = G__8488;
        i__8485 = G__8489;
        sum__8486 = G__8490;
        continue
      }else {
        return sum__8486
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
      var s__8495 = cljs.core.seq.call(null, x);
      if(s__8495) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8495)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__8495), concat.call(null, cljs.core.chunk_rest.call(null, s__8495), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__8495), concat.call(null, cljs.core.rest.call(null, s__8495), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__8499__delegate = function(x, y, zs) {
      var cat__8498 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__8497 = cljs.core.seq.call(null, xys);
          if(xys__8497) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__8497)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__8497), cat.call(null, cljs.core.chunk_rest.call(null, xys__8497), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__8497), cat.call(null, cljs.core.rest.call(null, xys__8497), zs))
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
      return cat__8498.call(null, concat.call(null, x, y), zs)
    };
    var G__8499 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8499__delegate.call(this, x, y, zs)
    };
    G__8499.cljs$lang$maxFixedArity = 2;
    G__8499.cljs$lang$applyTo = function(arglist__8500) {
      var x = cljs.core.first(arglist__8500);
      var y = cljs.core.first(cljs.core.next(arglist__8500));
      var zs = cljs.core.rest(cljs.core.next(arglist__8500));
      return G__8499__delegate(x, y, zs)
    };
    G__8499.cljs$lang$arity$variadic = G__8499__delegate;
    return G__8499
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
    var G__8501__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__8501 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8501__delegate.call(this, a, b, c, d, more)
    };
    G__8501.cljs$lang$maxFixedArity = 4;
    G__8501.cljs$lang$applyTo = function(arglist__8502) {
      var a = cljs.core.first(arglist__8502);
      var b = cljs.core.first(cljs.core.next(arglist__8502));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8502)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8502))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8502))));
      return G__8501__delegate(a, b, c, d, more)
    };
    G__8501.cljs$lang$arity$variadic = G__8501__delegate;
    return G__8501
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
  var args__8544 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__8545 = cljs.core._first.call(null, args__8544);
    var args__8546 = cljs.core._rest.call(null, args__8544);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__8545)
      }else {
        return f.call(null, a__8545)
      }
    }else {
      var b__8547 = cljs.core._first.call(null, args__8546);
      var args__8548 = cljs.core._rest.call(null, args__8546);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__8545, b__8547)
        }else {
          return f.call(null, a__8545, b__8547)
        }
      }else {
        var c__8549 = cljs.core._first.call(null, args__8548);
        var args__8550 = cljs.core._rest.call(null, args__8548);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__8545, b__8547, c__8549)
          }else {
            return f.call(null, a__8545, b__8547, c__8549)
          }
        }else {
          var d__8551 = cljs.core._first.call(null, args__8550);
          var args__8552 = cljs.core._rest.call(null, args__8550);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__8545, b__8547, c__8549, d__8551)
            }else {
              return f.call(null, a__8545, b__8547, c__8549, d__8551)
            }
          }else {
            var e__8553 = cljs.core._first.call(null, args__8552);
            var args__8554 = cljs.core._rest.call(null, args__8552);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__8545, b__8547, c__8549, d__8551, e__8553)
              }else {
                return f.call(null, a__8545, b__8547, c__8549, d__8551, e__8553)
              }
            }else {
              var f__8555 = cljs.core._first.call(null, args__8554);
              var args__8556 = cljs.core._rest.call(null, args__8554);
              if(argc === 6) {
                if(f__8555.cljs$lang$arity$6) {
                  return f__8555.cljs$lang$arity$6(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555)
                }else {
                  return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555)
                }
              }else {
                var g__8557 = cljs.core._first.call(null, args__8556);
                var args__8558 = cljs.core._rest.call(null, args__8556);
                if(argc === 7) {
                  if(f__8555.cljs$lang$arity$7) {
                    return f__8555.cljs$lang$arity$7(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557)
                  }else {
                    return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557)
                  }
                }else {
                  var h__8559 = cljs.core._first.call(null, args__8558);
                  var args__8560 = cljs.core._rest.call(null, args__8558);
                  if(argc === 8) {
                    if(f__8555.cljs$lang$arity$8) {
                      return f__8555.cljs$lang$arity$8(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559)
                    }else {
                      return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559)
                    }
                  }else {
                    var i__8561 = cljs.core._first.call(null, args__8560);
                    var args__8562 = cljs.core._rest.call(null, args__8560);
                    if(argc === 9) {
                      if(f__8555.cljs$lang$arity$9) {
                        return f__8555.cljs$lang$arity$9(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561)
                      }else {
                        return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561)
                      }
                    }else {
                      var j__8563 = cljs.core._first.call(null, args__8562);
                      var args__8564 = cljs.core._rest.call(null, args__8562);
                      if(argc === 10) {
                        if(f__8555.cljs$lang$arity$10) {
                          return f__8555.cljs$lang$arity$10(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563)
                        }else {
                          return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563)
                        }
                      }else {
                        var k__8565 = cljs.core._first.call(null, args__8564);
                        var args__8566 = cljs.core._rest.call(null, args__8564);
                        if(argc === 11) {
                          if(f__8555.cljs$lang$arity$11) {
                            return f__8555.cljs$lang$arity$11(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565)
                          }else {
                            return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565)
                          }
                        }else {
                          var l__8567 = cljs.core._first.call(null, args__8566);
                          var args__8568 = cljs.core._rest.call(null, args__8566);
                          if(argc === 12) {
                            if(f__8555.cljs$lang$arity$12) {
                              return f__8555.cljs$lang$arity$12(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567)
                            }else {
                              return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567)
                            }
                          }else {
                            var m__8569 = cljs.core._first.call(null, args__8568);
                            var args__8570 = cljs.core._rest.call(null, args__8568);
                            if(argc === 13) {
                              if(f__8555.cljs$lang$arity$13) {
                                return f__8555.cljs$lang$arity$13(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569)
                              }else {
                                return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569)
                              }
                            }else {
                              var n__8571 = cljs.core._first.call(null, args__8570);
                              var args__8572 = cljs.core._rest.call(null, args__8570);
                              if(argc === 14) {
                                if(f__8555.cljs$lang$arity$14) {
                                  return f__8555.cljs$lang$arity$14(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571)
                                }else {
                                  return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571)
                                }
                              }else {
                                var o__8573 = cljs.core._first.call(null, args__8572);
                                var args__8574 = cljs.core._rest.call(null, args__8572);
                                if(argc === 15) {
                                  if(f__8555.cljs$lang$arity$15) {
                                    return f__8555.cljs$lang$arity$15(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571, o__8573)
                                  }else {
                                    return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571, o__8573)
                                  }
                                }else {
                                  var p__8575 = cljs.core._first.call(null, args__8574);
                                  var args__8576 = cljs.core._rest.call(null, args__8574);
                                  if(argc === 16) {
                                    if(f__8555.cljs$lang$arity$16) {
                                      return f__8555.cljs$lang$arity$16(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571, o__8573, p__8575)
                                    }else {
                                      return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571, o__8573, p__8575)
                                    }
                                  }else {
                                    var q__8577 = cljs.core._first.call(null, args__8576);
                                    var args__8578 = cljs.core._rest.call(null, args__8576);
                                    if(argc === 17) {
                                      if(f__8555.cljs$lang$arity$17) {
                                        return f__8555.cljs$lang$arity$17(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571, o__8573, p__8575, q__8577)
                                      }else {
                                        return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571, o__8573, p__8575, q__8577)
                                      }
                                    }else {
                                      var r__8579 = cljs.core._first.call(null, args__8578);
                                      var args__8580 = cljs.core._rest.call(null, args__8578);
                                      if(argc === 18) {
                                        if(f__8555.cljs$lang$arity$18) {
                                          return f__8555.cljs$lang$arity$18(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571, o__8573, p__8575, q__8577, r__8579)
                                        }else {
                                          return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571, o__8573, p__8575, q__8577, r__8579)
                                        }
                                      }else {
                                        var s__8581 = cljs.core._first.call(null, args__8580);
                                        var args__8582 = cljs.core._rest.call(null, args__8580);
                                        if(argc === 19) {
                                          if(f__8555.cljs$lang$arity$19) {
                                            return f__8555.cljs$lang$arity$19(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571, o__8573, p__8575, q__8577, r__8579, s__8581)
                                          }else {
                                            return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571, o__8573, p__8575, q__8577, r__8579, s__8581)
                                          }
                                        }else {
                                          var t__8583 = cljs.core._first.call(null, args__8582);
                                          var args__8584 = cljs.core._rest.call(null, args__8582);
                                          if(argc === 20) {
                                            if(f__8555.cljs$lang$arity$20) {
                                              return f__8555.cljs$lang$arity$20(a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571, o__8573, p__8575, q__8577, r__8579, s__8581, t__8583)
                                            }else {
                                              return f__8555.call(null, a__8545, b__8547, c__8549, d__8551, e__8553, f__8555, g__8557, h__8559, i__8561, j__8563, k__8565, l__8567, m__8569, n__8571, o__8573, p__8575, q__8577, r__8579, s__8581, t__8583)
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
    var fixed_arity__8599 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8600 = cljs.core.bounded_count.call(null, args, fixed_arity__8599 + 1);
      if(bc__8600 <= fixed_arity__8599) {
        return cljs.core.apply_to.call(null, f, bc__8600, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__8601 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__8602 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8603 = cljs.core.bounded_count.call(null, arglist__8601, fixed_arity__8602 + 1);
      if(bc__8603 <= fixed_arity__8602) {
        return cljs.core.apply_to.call(null, f, bc__8603, arglist__8601)
      }else {
        return f.cljs$lang$applyTo(arglist__8601)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8601))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__8604 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__8605 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8606 = cljs.core.bounded_count.call(null, arglist__8604, fixed_arity__8605 + 1);
      if(bc__8606 <= fixed_arity__8605) {
        return cljs.core.apply_to.call(null, f, bc__8606, arglist__8604)
      }else {
        return f.cljs$lang$applyTo(arglist__8604)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8604))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__8607 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__8608 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8609 = cljs.core.bounded_count.call(null, arglist__8607, fixed_arity__8608 + 1);
      if(bc__8609 <= fixed_arity__8608) {
        return cljs.core.apply_to.call(null, f, bc__8609, arglist__8607)
      }else {
        return f.cljs$lang$applyTo(arglist__8607)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8607))
    }
  };
  var apply__6 = function() {
    var G__8613__delegate = function(f, a, b, c, d, args) {
      var arglist__8610 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__8611 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__8612 = cljs.core.bounded_count.call(null, arglist__8610, fixed_arity__8611 + 1);
        if(bc__8612 <= fixed_arity__8611) {
          return cljs.core.apply_to.call(null, f, bc__8612, arglist__8610)
        }else {
          return f.cljs$lang$applyTo(arglist__8610)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__8610))
      }
    };
    var G__8613 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__8613__delegate.call(this, f, a, b, c, d, args)
    };
    G__8613.cljs$lang$maxFixedArity = 5;
    G__8613.cljs$lang$applyTo = function(arglist__8614) {
      var f = cljs.core.first(arglist__8614);
      var a = cljs.core.first(cljs.core.next(arglist__8614));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8614)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8614))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8614)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8614)))));
      return G__8613__delegate(f, a, b, c, d, args)
    };
    G__8613.cljs$lang$arity$variadic = G__8613__delegate;
    return G__8613
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
  vary_meta.cljs$lang$applyTo = function(arglist__8615) {
    var obj = cljs.core.first(arglist__8615);
    var f = cljs.core.first(cljs.core.next(arglist__8615));
    var args = cljs.core.rest(cljs.core.next(arglist__8615));
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
    var G__8616__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__8616 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8616__delegate.call(this, x, y, more)
    };
    G__8616.cljs$lang$maxFixedArity = 2;
    G__8616.cljs$lang$applyTo = function(arglist__8617) {
      var x = cljs.core.first(arglist__8617);
      var y = cljs.core.first(cljs.core.next(arglist__8617));
      var more = cljs.core.rest(cljs.core.next(arglist__8617));
      return G__8616__delegate(x, y, more)
    };
    G__8616.cljs$lang$arity$variadic = G__8616__delegate;
    return G__8616
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
        var G__8618 = pred;
        var G__8619 = cljs.core.next.call(null, coll);
        pred = G__8618;
        coll = G__8619;
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
      var or__3824__auto____8621 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____8621)) {
        return or__3824__auto____8621
      }else {
        var G__8622 = pred;
        var G__8623 = cljs.core.next.call(null, coll);
        pred = G__8622;
        coll = G__8623;
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
    var G__8624 = null;
    var G__8624__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__8624__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__8624__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__8624__3 = function() {
      var G__8625__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__8625 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__8625__delegate.call(this, x, y, zs)
      };
      G__8625.cljs$lang$maxFixedArity = 2;
      G__8625.cljs$lang$applyTo = function(arglist__8626) {
        var x = cljs.core.first(arglist__8626);
        var y = cljs.core.first(cljs.core.next(arglist__8626));
        var zs = cljs.core.rest(cljs.core.next(arglist__8626));
        return G__8625__delegate(x, y, zs)
      };
      G__8625.cljs$lang$arity$variadic = G__8625__delegate;
      return G__8625
    }();
    G__8624 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__8624__0.call(this);
        case 1:
          return G__8624__1.call(this, x);
        case 2:
          return G__8624__2.call(this, x, y);
        default:
          return G__8624__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__8624.cljs$lang$maxFixedArity = 2;
    G__8624.cljs$lang$applyTo = G__8624__3.cljs$lang$applyTo;
    return G__8624
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__8627__delegate = function(args) {
      return x
    };
    var G__8627 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8627__delegate.call(this, args)
    };
    G__8627.cljs$lang$maxFixedArity = 0;
    G__8627.cljs$lang$applyTo = function(arglist__8628) {
      var args = cljs.core.seq(arglist__8628);
      return G__8627__delegate(args)
    };
    G__8627.cljs$lang$arity$variadic = G__8627__delegate;
    return G__8627
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
      var G__8635 = null;
      var G__8635__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__8635__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__8635__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__8635__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__8635__4 = function() {
        var G__8636__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__8636 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8636__delegate.call(this, x, y, z, args)
        };
        G__8636.cljs$lang$maxFixedArity = 3;
        G__8636.cljs$lang$applyTo = function(arglist__8637) {
          var x = cljs.core.first(arglist__8637);
          var y = cljs.core.first(cljs.core.next(arglist__8637));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8637)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8637)));
          return G__8636__delegate(x, y, z, args)
        };
        G__8636.cljs$lang$arity$variadic = G__8636__delegate;
        return G__8636
      }();
      G__8635 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8635__0.call(this);
          case 1:
            return G__8635__1.call(this, x);
          case 2:
            return G__8635__2.call(this, x, y);
          case 3:
            return G__8635__3.call(this, x, y, z);
          default:
            return G__8635__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8635.cljs$lang$maxFixedArity = 3;
      G__8635.cljs$lang$applyTo = G__8635__4.cljs$lang$applyTo;
      return G__8635
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__8638 = null;
      var G__8638__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__8638__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__8638__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__8638__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__8638__4 = function() {
        var G__8639__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__8639 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8639__delegate.call(this, x, y, z, args)
        };
        G__8639.cljs$lang$maxFixedArity = 3;
        G__8639.cljs$lang$applyTo = function(arglist__8640) {
          var x = cljs.core.first(arglist__8640);
          var y = cljs.core.first(cljs.core.next(arglist__8640));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8640)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8640)));
          return G__8639__delegate(x, y, z, args)
        };
        G__8639.cljs$lang$arity$variadic = G__8639__delegate;
        return G__8639
      }();
      G__8638 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8638__0.call(this);
          case 1:
            return G__8638__1.call(this, x);
          case 2:
            return G__8638__2.call(this, x, y);
          case 3:
            return G__8638__3.call(this, x, y, z);
          default:
            return G__8638__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8638.cljs$lang$maxFixedArity = 3;
      G__8638.cljs$lang$applyTo = G__8638__4.cljs$lang$applyTo;
      return G__8638
    }()
  };
  var comp__4 = function() {
    var G__8641__delegate = function(f1, f2, f3, fs) {
      var fs__8632 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__8642__delegate = function(args) {
          var ret__8633 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__8632), args);
          var fs__8634 = cljs.core.next.call(null, fs__8632);
          while(true) {
            if(fs__8634) {
              var G__8643 = cljs.core.first.call(null, fs__8634).call(null, ret__8633);
              var G__8644 = cljs.core.next.call(null, fs__8634);
              ret__8633 = G__8643;
              fs__8634 = G__8644;
              continue
            }else {
              return ret__8633
            }
            break
          }
        };
        var G__8642 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8642__delegate.call(this, args)
        };
        G__8642.cljs$lang$maxFixedArity = 0;
        G__8642.cljs$lang$applyTo = function(arglist__8645) {
          var args = cljs.core.seq(arglist__8645);
          return G__8642__delegate(args)
        };
        G__8642.cljs$lang$arity$variadic = G__8642__delegate;
        return G__8642
      }()
    };
    var G__8641 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8641__delegate.call(this, f1, f2, f3, fs)
    };
    G__8641.cljs$lang$maxFixedArity = 3;
    G__8641.cljs$lang$applyTo = function(arglist__8646) {
      var f1 = cljs.core.first(arglist__8646);
      var f2 = cljs.core.first(cljs.core.next(arglist__8646));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8646)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8646)));
      return G__8641__delegate(f1, f2, f3, fs)
    };
    G__8641.cljs$lang$arity$variadic = G__8641__delegate;
    return G__8641
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
      var G__8647__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__8647 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8647__delegate.call(this, args)
      };
      G__8647.cljs$lang$maxFixedArity = 0;
      G__8647.cljs$lang$applyTo = function(arglist__8648) {
        var args = cljs.core.seq(arglist__8648);
        return G__8647__delegate(args)
      };
      G__8647.cljs$lang$arity$variadic = G__8647__delegate;
      return G__8647
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__8649__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__8649 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8649__delegate.call(this, args)
      };
      G__8649.cljs$lang$maxFixedArity = 0;
      G__8649.cljs$lang$applyTo = function(arglist__8650) {
        var args = cljs.core.seq(arglist__8650);
        return G__8649__delegate(args)
      };
      G__8649.cljs$lang$arity$variadic = G__8649__delegate;
      return G__8649
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__8651__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__8651 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8651__delegate.call(this, args)
      };
      G__8651.cljs$lang$maxFixedArity = 0;
      G__8651.cljs$lang$applyTo = function(arglist__8652) {
        var args = cljs.core.seq(arglist__8652);
        return G__8651__delegate(args)
      };
      G__8651.cljs$lang$arity$variadic = G__8651__delegate;
      return G__8651
    }()
  };
  var partial__5 = function() {
    var G__8653__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__8654__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__8654 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8654__delegate.call(this, args)
        };
        G__8654.cljs$lang$maxFixedArity = 0;
        G__8654.cljs$lang$applyTo = function(arglist__8655) {
          var args = cljs.core.seq(arglist__8655);
          return G__8654__delegate(args)
        };
        G__8654.cljs$lang$arity$variadic = G__8654__delegate;
        return G__8654
      }()
    };
    var G__8653 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8653__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__8653.cljs$lang$maxFixedArity = 4;
    G__8653.cljs$lang$applyTo = function(arglist__8656) {
      var f = cljs.core.first(arglist__8656);
      var arg1 = cljs.core.first(cljs.core.next(arglist__8656));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8656)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8656))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8656))));
      return G__8653__delegate(f, arg1, arg2, arg3, more)
    };
    G__8653.cljs$lang$arity$variadic = G__8653__delegate;
    return G__8653
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
      var G__8657 = null;
      var G__8657__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__8657__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__8657__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__8657__4 = function() {
        var G__8658__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__8658 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8658__delegate.call(this, a, b, c, ds)
        };
        G__8658.cljs$lang$maxFixedArity = 3;
        G__8658.cljs$lang$applyTo = function(arglist__8659) {
          var a = cljs.core.first(arglist__8659);
          var b = cljs.core.first(cljs.core.next(arglist__8659));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8659)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8659)));
          return G__8658__delegate(a, b, c, ds)
        };
        G__8658.cljs$lang$arity$variadic = G__8658__delegate;
        return G__8658
      }();
      G__8657 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__8657__1.call(this, a);
          case 2:
            return G__8657__2.call(this, a, b);
          case 3:
            return G__8657__3.call(this, a, b, c);
          default:
            return G__8657__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8657.cljs$lang$maxFixedArity = 3;
      G__8657.cljs$lang$applyTo = G__8657__4.cljs$lang$applyTo;
      return G__8657
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__8660 = null;
      var G__8660__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8660__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__8660__4 = function() {
        var G__8661__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__8661 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8661__delegate.call(this, a, b, c, ds)
        };
        G__8661.cljs$lang$maxFixedArity = 3;
        G__8661.cljs$lang$applyTo = function(arglist__8662) {
          var a = cljs.core.first(arglist__8662);
          var b = cljs.core.first(cljs.core.next(arglist__8662));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8662)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8662)));
          return G__8661__delegate(a, b, c, ds)
        };
        G__8661.cljs$lang$arity$variadic = G__8661__delegate;
        return G__8661
      }();
      G__8660 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8660__2.call(this, a, b);
          case 3:
            return G__8660__3.call(this, a, b, c);
          default:
            return G__8660__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8660.cljs$lang$maxFixedArity = 3;
      G__8660.cljs$lang$applyTo = G__8660__4.cljs$lang$applyTo;
      return G__8660
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__8663 = null;
      var G__8663__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8663__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__8663__4 = function() {
        var G__8664__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__8664 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8664__delegate.call(this, a, b, c, ds)
        };
        G__8664.cljs$lang$maxFixedArity = 3;
        G__8664.cljs$lang$applyTo = function(arglist__8665) {
          var a = cljs.core.first(arglist__8665);
          var b = cljs.core.first(cljs.core.next(arglist__8665));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8665)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8665)));
          return G__8664__delegate(a, b, c, ds)
        };
        G__8664.cljs$lang$arity$variadic = G__8664__delegate;
        return G__8664
      }();
      G__8663 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8663__2.call(this, a, b);
          case 3:
            return G__8663__3.call(this, a, b, c);
          default:
            return G__8663__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8663.cljs$lang$maxFixedArity = 3;
      G__8663.cljs$lang$applyTo = G__8663__4.cljs$lang$applyTo;
      return G__8663
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
  var mapi__8681 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8689 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8689) {
        var s__8690 = temp__3974__auto____8689;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8690)) {
          var c__8691 = cljs.core.chunk_first.call(null, s__8690);
          var size__8692 = cljs.core.count.call(null, c__8691);
          var b__8693 = cljs.core.chunk_buffer.call(null, size__8692);
          var n__2527__auto____8694 = size__8692;
          var i__8695 = 0;
          while(true) {
            if(i__8695 < n__2527__auto____8694) {
              cljs.core.chunk_append.call(null, b__8693, f.call(null, idx + i__8695, cljs.core._nth.call(null, c__8691, i__8695)));
              var G__8696 = i__8695 + 1;
              i__8695 = G__8696;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8693), mapi.call(null, idx + size__8692, cljs.core.chunk_rest.call(null, s__8690)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__8690)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__8690)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__8681.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8706 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8706) {
      var s__8707 = temp__3974__auto____8706;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8707)) {
        var c__8708 = cljs.core.chunk_first.call(null, s__8707);
        var size__8709 = cljs.core.count.call(null, c__8708);
        var b__8710 = cljs.core.chunk_buffer.call(null, size__8709);
        var n__2527__auto____8711 = size__8709;
        var i__8712 = 0;
        while(true) {
          if(i__8712 < n__2527__auto____8711) {
            var x__8713 = f.call(null, cljs.core._nth.call(null, c__8708, i__8712));
            if(x__8713 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__8710, x__8713)
            }
            var G__8715 = i__8712 + 1;
            i__8712 = G__8715;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8710), keep.call(null, f, cljs.core.chunk_rest.call(null, s__8707)))
      }else {
        var x__8714 = f.call(null, cljs.core.first.call(null, s__8707));
        if(x__8714 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__8707))
        }else {
          return cljs.core.cons.call(null, x__8714, keep.call(null, f, cljs.core.rest.call(null, s__8707)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__8741 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8751 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8751) {
        var s__8752 = temp__3974__auto____8751;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8752)) {
          var c__8753 = cljs.core.chunk_first.call(null, s__8752);
          var size__8754 = cljs.core.count.call(null, c__8753);
          var b__8755 = cljs.core.chunk_buffer.call(null, size__8754);
          var n__2527__auto____8756 = size__8754;
          var i__8757 = 0;
          while(true) {
            if(i__8757 < n__2527__auto____8756) {
              var x__8758 = f.call(null, idx + i__8757, cljs.core._nth.call(null, c__8753, i__8757));
              if(x__8758 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__8755, x__8758)
              }
              var G__8760 = i__8757 + 1;
              i__8757 = G__8760;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8755), keepi.call(null, idx + size__8754, cljs.core.chunk_rest.call(null, s__8752)))
        }else {
          var x__8759 = f.call(null, idx, cljs.core.first.call(null, s__8752));
          if(x__8759 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8752))
          }else {
            return cljs.core.cons.call(null, x__8759, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8752)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__8741.call(null, 0, coll)
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
          var and__3822__auto____8846 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8846)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____8846
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8847 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8847)) {
            var and__3822__auto____8848 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8848)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____8848
            }
          }else {
            return and__3822__auto____8847
          }
        }())
      };
      var ep1__4 = function() {
        var G__8917__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8849 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8849)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____8849
            }
          }())
        };
        var G__8917 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8917__delegate.call(this, x, y, z, args)
        };
        G__8917.cljs$lang$maxFixedArity = 3;
        G__8917.cljs$lang$applyTo = function(arglist__8918) {
          var x = cljs.core.first(arglist__8918);
          var y = cljs.core.first(cljs.core.next(arglist__8918));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8918)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8918)));
          return G__8917__delegate(x, y, z, args)
        };
        G__8917.cljs$lang$arity$variadic = G__8917__delegate;
        return G__8917
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
          var and__3822__auto____8861 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8861)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____8861
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8862 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8862)) {
            var and__3822__auto____8863 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8863)) {
              var and__3822__auto____8864 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8864)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____8864
              }
            }else {
              return and__3822__auto____8863
            }
          }else {
            return and__3822__auto____8862
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8865 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8865)) {
            var and__3822__auto____8866 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8866)) {
              var and__3822__auto____8867 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____8867)) {
                var and__3822__auto____8868 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____8868)) {
                  var and__3822__auto____8869 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8869)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____8869
                  }
                }else {
                  return and__3822__auto____8868
                }
              }else {
                return and__3822__auto____8867
              }
            }else {
              return and__3822__auto____8866
            }
          }else {
            return and__3822__auto____8865
          }
        }())
      };
      var ep2__4 = function() {
        var G__8919__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8870 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8870)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8716_SHARP_) {
                var and__3822__auto____8871 = p1.call(null, p1__8716_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8871)) {
                  return p2.call(null, p1__8716_SHARP_)
                }else {
                  return and__3822__auto____8871
                }
              }, args)
            }else {
              return and__3822__auto____8870
            }
          }())
        };
        var G__8919 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8919__delegate.call(this, x, y, z, args)
        };
        G__8919.cljs$lang$maxFixedArity = 3;
        G__8919.cljs$lang$applyTo = function(arglist__8920) {
          var x = cljs.core.first(arglist__8920);
          var y = cljs.core.first(cljs.core.next(arglist__8920));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8920)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8920)));
          return G__8919__delegate(x, y, z, args)
        };
        G__8919.cljs$lang$arity$variadic = G__8919__delegate;
        return G__8919
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
          var and__3822__auto____8890 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8890)) {
            var and__3822__auto____8891 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8891)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____8891
            }
          }else {
            return and__3822__auto____8890
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8892 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8892)) {
            var and__3822__auto____8893 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8893)) {
              var and__3822__auto____8894 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8894)) {
                var and__3822__auto____8895 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8895)) {
                  var and__3822__auto____8896 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8896)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____8896
                  }
                }else {
                  return and__3822__auto____8895
                }
              }else {
                return and__3822__auto____8894
              }
            }else {
              return and__3822__auto____8893
            }
          }else {
            return and__3822__auto____8892
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8897 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8897)) {
            var and__3822__auto____8898 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8898)) {
              var and__3822__auto____8899 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8899)) {
                var and__3822__auto____8900 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8900)) {
                  var and__3822__auto____8901 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8901)) {
                    var and__3822__auto____8902 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____8902)) {
                      var and__3822__auto____8903 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____8903)) {
                        var and__3822__auto____8904 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____8904)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____8904
                        }
                      }else {
                        return and__3822__auto____8903
                      }
                    }else {
                      return and__3822__auto____8902
                    }
                  }else {
                    return and__3822__auto____8901
                  }
                }else {
                  return and__3822__auto____8900
                }
              }else {
                return and__3822__auto____8899
              }
            }else {
              return and__3822__auto____8898
            }
          }else {
            return and__3822__auto____8897
          }
        }())
      };
      var ep3__4 = function() {
        var G__8921__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8905 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8905)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8717_SHARP_) {
                var and__3822__auto____8906 = p1.call(null, p1__8717_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8906)) {
                  var and__3822__auto____8907 = p2.call(null, p1__8717_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____8907)) {
                    return p3.call(null, p1__8717_SHARP_)
                  }else {
                    return and__3822__auto____8907
                  }
                }else {
                  return and__3822__auto____8906
                }
              }, args)
            }else {
              return and__3822__auto____8905
            }
          }())
        };
        var G__8921 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8921__delegate.call(this, x, y, z, args)
        };
        G__8921.cljs$lang$maxFixedArity = 3;
        G__8921.cljs$lang$applyTo = function(arglist__8922) {
          var x = cljs.core.first(arglist__8922);
          var y = cljs.core.first(cljs.core.next(arglist__8922));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8922)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8922)));
          return G__8921__delegate(x, y, z, args)
        };
        G__8921.cljs$lang$arity$variadic = G__8921__delegate;
        return G__8921
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
    var G__8923__delegate = function(p1, p2, p3, ps) {
      var ps__8908 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__8718_SHARP_) {
            return p1__8718_SHARP_.call(null, x)
          }, ps__8908)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__8719_SHARP_) {
            var and__3822__auto____8913 = p1__8719_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8913)) {
              return p1__8719_SHARP_.call(null, y)
            }else {
              return and__3822__auto____8913
            }
          }, ps__8908)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__8720_SHARP_) {
            var and__3822__auto____8914 = p1__8720_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8914)) {
              var and__3822__auto____8915 = p1__8720_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____8915)) {
                return p1__8720_SHARP_.call(null, z)
              }else {
                return and__3822__auto____8915
              }
            }else {
              return and__3822__auto____8914
            }
          }, ps__8908)
        };
        var epn__4 = function() {
          var G__8924__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____8916 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____8916)) {
                return cljs.core.every_QMARK_.call(null, function(p1__8721_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__8721_SHARP_, args)
                }, ps__8908)
              }else {
                return and__3822__auto____8916
              }
            }())
          };
          var G__8924 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8924__delegate.call(this, x, y, z, args)
          };
          G__8924.cljs$lang$maxFixedArity = 3;
          G__8924.cljs$lang$applyTo = function(arglist__8925) {
            var x = cljs.core.first(arglist__8925);
            var y = cljs.core.first(cljs.core.next(arglist__8925));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8925)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8925)));
            return G__8924__delegate(x, y, z, args)
          };
          G__8924.cljs$lang$arity$variadic = G__8924__delegate;
          return G__8924
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
    var G__8923 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8923__delegate.call(this, p1, p2, p3, ps)
    };
    G__8923.cljs$lang$maxFixedArity = 3;
    G__8923.cljs$lang$applyTo = function(arglist__8926) {
      var p1 = cljs.core.first(arglist__8926);
      var p2 = cljs.core.first(cljs.core.next(arglist__8926));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8926)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8926)));
      return G__8923__delegate(p1, p2, p3, ps)
    };
    G__8923.cljs$lang$arity$variadic = G__8923__delegate;
    return G__8923
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
        var or__3824__auto____9007 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9007)) {
          return or__3824__auto____9007
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____9008 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9008)) {
          return or__3824__auto____9008
        }else {
          var or__3824__auto____9009 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9009)) {
            return or__3824__auto____9009
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__9078__delegate = function(x, y, z, args) {
          var or__3824__auto____9010 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9010)) {
            return or__3824__auto____9010
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__9078 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9078__delegate.call(this, x, y, z, args)
        };
        G__9078.cljs$lang$maxFixedArity = 3;
        G__9078.cljs$lang$applyTo = function(arglist__9079) {
          var x = cljs.core.first(arglist__9079);
          var y = cljs.core.first(cljs.core.next(arglist__9079));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9079)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9079)));
          return G__9078__delegate(x, y, z, args)
        };
        G__9078.cljs$lang$arity$variadic = G__9078__delegate;
        return G__9078
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
        var or__3824__auto____9022 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9022)) {
          return or__3824__auto____9022
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____9023 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9023)) {
          return or__3824__auto____9023
        }else {
          var or__3824__auto____9024 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9024)) {
            return or__3824__auto____9024
          }else {
            var or__3824__auto____9025 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9025)) {
              return or__3824__auto____9025
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____9026 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9026)) {
          return or__3824__auto____9026
        }else {
          var or__3824__auto____9027 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9027)) {
            return or__3824__auto____9027
          }else {
            var or__3824__auto____9028 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____9028)) {
              return or__3824__auto____9028
            }else {
              var or__3824__auto____9029 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____9029)) {
                return or__3824__auto____9029
              }else {
                var or__3824__auto____9030 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9030)) {
                  return or__3824__auto____9030
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__9080__delegate = function(x, y, z, args) {
          var or__3824__auto____9031 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9031)) {
            return or__3824__auto____9031
          }else {
            return cljs.core.some.call(null, function(p1__8761_SHARP_) {
              var or__3824__auto____9032 = p1.call(null, p1__8761_SHARP_);
              if(cljs.core.truth_(or__3824__auto____9032)) {
                return or__3824__auto____9032
              }else {
                return p2.call(null, p1__8761_SHARP_)
              }
            }, args)
          }
        };
        var G__9080 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9080__delegate.call(this, x, y, z, args)
        };
        G__9080.cljs$lang$maxFixedArity = 3;
        G__9080.cljs$lang$applyTo = function(arglist__9081) {
          var x = cljs.core.first(arglist__9081);
          var y = cljs.core.first(cljs.core.next(arglist__9081));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9081)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9081)));
          return G__9080__delegate(x, y, z, args)
        };
        G__9080.cljs$lang$arity$variadic = G__9080__delegate;
        return G__9080
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
        var or__3824__auto____9051 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9051)) {
          return or__3824__auto____9051
        }else {
          var or__3824__auto____9052 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9052)) {
            return or__3824__auto____9052
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____9053 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9053)) {
          return or__3824__auto____9053
        }else {
          var or__3824__auto____9054 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9054)) {
            return or__3824__auto____9054
          }else {
            var or__3824__auto____9055 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9055)) {
              return or__3824__auto____9055
            }else {
              var or__3824__auto____9056 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9056)) {
                return or__3824__auto____9056
              }else {
                var or__3824__auto____9057 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9057)) {
                  return or__3824__auto____9057
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____9058 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9058)) {
          return or__3824__auto____9058
        }else {
          var or__3824__auto____9059 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9059)) {
            return or__3824__auto____9059
          }else {
            var or__3824__auto____9060 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9060)) {
              return or__3824__auto____9060
            }else {
              var or__3824__auto____9061 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9061)) {
                return or__3824__auto____9061
              }else {
                var or__3824__auto____9062 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9062)) {
                  return or__3824__auto____9062
                }else {
                  var or__3824__auto____9063 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____9063)) {
                    return or__3824__auto____9063
                  }else {
                    var or__3824__auto____9064 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____9064)) {
                      return or__3824__auto____9064
                    }else {
                      var or__3824__auto____9065 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____9065)) {
                        return or__3824__auto____9065
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
        var G__9082__delegate = function(x, y, z, args) {
          var or__3824__auto____9066 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9066)) {
            return or__3824__auto____9066
          }else {
            return cljs.core.some.call(null, function(p1__8762_SHARP_) {
              var or__3824__auto____9067 = p1.call(null, p1__8762_SHARP_);
              if(cljs.core.truth_(or__3824__auto____9067)) {
                return or__3824__auto____9067
              }else {
                var or__3824__auto____9068 = p2.call(null, p1__8762_SHARP_);
                if(cljs.core.truth_(or__3824__auto____9068)) {
                  return or__3824__auto____9068
                }else {
                  return p3.call(null, p1__8762_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__9082 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9082__delegate.call(this, x, y, z, args)
        };
        G__9082.cljs$lang$maxFixedArity = 3;
        G__9082.cljs$lang$applyTo = function(arglist__9083) {
          var x = cljs.core.first(arglist__9083);
          var y = cljs.core.first(cljs.core.next(arglist__9083));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9083)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9083)));
          return G__9082__delegate(x, y, z, args)
        };
        G__9082.cljs$lang$arity$variadic = G__9082__delegate;
        return G__9082
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
    var G__9084__delegate = function(p1, p2, p3, ps) {
      var ps__9069 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__8763_SHARP_) {
            return p1__8763_SHARP_.call(null, x)
          }, ps__9069)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__8764_SHARP_) {
            var or__3824__auto____9074 = p1__8764_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9074)) {
              return or__3824__auto____9074
            }else {
              return p1__8764_SHARP_.call(null, y)
            }
          }, ps__9069)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__8765_SHARP_) {
            var or__3824__auto____9075 = p1__8765_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9075)) {
              return or__3824__auto____9075
            }else {
              var or__3824__auto____9076 = p1__8765_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9076)) {
                return or__3824__auto____9076
              }else {
                return p1__8765_SHARP_.call(null, z)
              }
            }
          }, ps__9069)
        };
        var spn__4 = function() {
          var G__9085__delegate = function(x, y, z, args) {
            var or__3824__auto____9077 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____9077)) {
              return or__3824__auto____9077
            }else {
              return cljs.core.some.call(null, function(p1__8766_SHARP_) {
                return cljs.core.some.call(null, p1__8766_SHARP_, args)
              }, ps__9069)
            }
          };
          var G__9085 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9085__delegate.call(this, x, y, z, args)
          };
          G__9085.cljs$lang$maxFixedArity = 3;
          G__9085.cljs$lang$applyTo = function(arglist__9086) {
            var x = cljs.core.first(arglist__9086);
            var y = cljs.core.first(cljs.core.next(arglist__9086));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9086)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9086)));
            return G__9085__delegate(x, y, z, args)
          };
          G__9085.cljs$lang$arity$variadic = G__9085__delegate;
          return G__9085
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
    var G__9084 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9084__delegate.call(this, p1, p2, p3, ps)
    };
    G__9084.cljs$lang$maxFixedArity = 3;
    G__9084.cljs$lang$applyTo = function(arglist__9087) {
      var p1 = cljs.core.first(arglist__9087);
      var p2 = cljs.core.first(cljs.core.next(arglist__9087));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9087)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9087)));
      return G__9084__delegate(p1, p2, p3, ps)
    };
    G__9084.cljs$lang$arity$variadic = G__9084__delegate;
    return G__9084
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
      var temp__3974__auto____9106 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9106) {
        var s__9107 = temp__3974__auto____9106;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__9107)) {
          var c__9108 = cljs.core.chunk_first.call(null, s__9107);
          var size__9109 = cljs.core.count.call(null, c__9108);
          var b__9110 = cljs.core.chunk_buffer.call(null, size__9109);
          var n__2527__auto____9111 = size__9109;
          var i__9112 = 0;
          while(true) {
            if(i__9112 < n__2527__auto____9111) {
              cljs.core.chunk_append.call(null, b__9110, f.call(null, cljs.core._nth.call(null, c__9108, i__9112)));
              var G__9124 = i__9112 + 1;
              i__9112 = G__9124;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__9110), map.call(null, f, cljs.core.chunk_rest.call(null, s__9107)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__9107)), map.call(null, f, cljs.core.rest.call(null, s__9107)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9113 = cljs.core.seq.call(null, c1);
      var s2__9114 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____9115 = s1__9113;
        if(and__3822__auto____9115) {
          return s2__9114
        }else {
          return and__3822__auto____9115
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__9113), cljs.core.first.call(null, s2__9114)), map.call(null, f, cljs.core.rest.call(null, s1__9113), cljs.core.rest.call(null, s2__9114)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9116 = cljs.core.seq.call(null, c1);
      var s2__9117 = cljs.core.seq.call(null, c2);
      var s3__9118 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____9119 = s1__9116;
        if(and__3822__auto____9119) {
          var and__3822__auto____9120 = s2__9117;
          if(and__3822__auto____9120) {
            return s3__9118
          }else {
            return and__3822__auto____9120
          }
        }else {
          return and__3822__auto____9119
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__9116), cljs.core.first.call(null, s2__9117), cljs.core.first.call(null, s3__9118)), map.call(null, f, cljs.core.rest.call(null, s1__9116), cljs.core.rest.call(null, s2__9117), cljs.core.rest.call(null, s3__9118)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__9125__delegate = function(f, c1, c2, c3, colls) {
      var step__9123 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__9122 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9122)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__9122), step.call(null, map.call(null, cljs.core.rest, ss__9122)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__8927_SHARP_) {
        return cljs.core.apply.call(null, f, p1__8927_SHARP_)
      }, step__9123.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__9125 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9125__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9125.cljs$lang$maxFixedArity = 4;
    G__9125.cljs$lang$applyTo = function(arglist__9126) {
      var f = cljs.core.first(arglist__9126);
      var c1 = cljs.core.first(cljs.core.next(arglist__9126));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9126)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9126))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9126))));
      return G__9125__delegate(f, c1, c2, c3, colls)
    };
    G__9125.cljs$lang$arity$variadic = G__9125__delegate;
    return G__9125
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
      var temp__3974__auto____9129 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9129) {
        var s__9130 = temp__3974__auto____9129;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9130), take.call(null, n - 1, cljs.core.rest.call(null, s__9130)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__9136 = function(n, coll) {
    while(true) {
      var s__9134 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9135 = n > 0;
        if(and__3822__auto____9135) {
          return s__9134
        }else {
          return and__3822__auto____9135
        }
      }())) {
        var G__9137 = n - 1;
        var G__9138 = cljs.core.rest.call(null, s__9134);
        n = G__9137;
        coll = G__9138;
        continue
      }else {
        return s__9134
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9136.call(null, n, coll)
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
  var s__9141 = cljs.core.seq.call(null, coll);
  var lead__9142 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__9142) {
      var G__9143 = cljs.core.next.call(null, s__9141);
      var G__9144 = cljs.core.next.call(null, lead__9142);
      s__9141 = G__9143;
      lead__9142 = G__9144;
      continue
    }else {
      return s__9141
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__9150 = function(pred, coll) {
    while(true) {
      var s__9148 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9149 = s__9148;
        if(and__3822__auto____9149) {
          return pred.call(null, cljs.core.first.call(null, s__9148))
        }else {
          return and__3822__auto____9149
        }
      }())) {
        var G__9151 = pred;
        var G__9152 = cljs.core.rest.call(null, s__9148);
        pred = G__9151;
        coll = G__9152;
        continue
      }else {
        return s__9148
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9150.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9155 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9155) {
      var s__9156 = temp__3974__auto____9155;
      return cljs.core.concat.call(null, s__9156, cycle.call(null, s__9156))
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
      var s1__9161 = cljs.core.seq.call(null, c1);
      var s2__9162 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____9163 = s1__9161;
        if(and__3822__auto____9163) {
          return s2__9162
        }else {
          return and__3822__auto____9163
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__9161), cljs.core.cons.call(null, cljs.core.first.call(null, s2__9162), interleave.call(null, cljs.core.rest.call(null, s1__9161), cljs.core.rest.call(null, s2__9162))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__9165__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__9164 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9164)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__9164), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__9164)))
        }else {
          return null
        }
      }, null)
    };
    var G__9165 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9165__delegate.call(this, c1, c2, colls)
    };
    G__9165.cljs$lang$maxFixedArity = 2;
    G__9165.cljs$lang$applyTo = function(arglist__9166) {
      var c1 = cljs.core.first(arglist__9166);
      var c2 = cljs.core.first(cljs.core.next(arglist__9166));
      var colls = cljs.core.rest(cljs.core.next(arglist__9166));
      return G__9165__delegate(c1, c2, colls)
    };
    G__9165.cljs$lang$arity$variadic = G__9165__delegate;
    return G__9165
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
  var cat__9176 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9174 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9174) {
        var coll__9175 = temp__3971__auto____9174;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__9175), cat.call(null, cljs.core.rest.call(null, coll__9175), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__9176.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__9177__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__9177 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9177__delegate.call(this, f, coll, colls)
    };
    G__9177.cljs$lang$maxFixedArity = 2;
    G__9177.cljs$lang$applyTo = function(arglist__9178) {
      var f = cljs.core.first(arglist__9178);
      var coll = cljs.core.first(cljs.core.next(arglist__9178));
      var colls = cljs.core.rest(cljs.core.next(arglist__9178));
      return G__9177__delegate(f, coll, colls)
    };
    G__9177.cljs$lang$arity$variadic = G__9177__delegate;
    return G__9177
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
    var temp__3974__auto____9188 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9188) {
      var s__9189 = temp__3974__auto____9188;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__9189)) {
        var c__9190 = cljs.core.chunk_first.call(null, s__9189);
        var size__9191 = cljs.core.count.call(null, c__9190);
        var b__9192 = cljs.core.chunk_buffer.call(null, size__9191);
        var n__2527__auto____9193 = size__9191;
        var i__9194 = 0;
        while(true) {
          if(i__9194 < n__2527__auto____9193) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__9190, i__9194)))) {
              cljs.core.chunk_append.call(null, b__9192, cljs.core._nth.call(null, c__9190, i__9194))
            }else {
            }
            var G__9197 = i__9194 + 1;
            i__9194 = G__9197;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__9192), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__9189)))
      }else {
        var f__9195 = cljs.core.first.call(null, s__9189);
        var r__9196 = cljs.core.rest.call(null, s__9189);
        if(cljs.core.truth_(pred.call(null, f__9195))) {
          return cljs.core.cons.call(null, f__9195, filter.call(null, pred, r__9196))
        }else {
          return filter.call(null, pred, r__9196)
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
  var walk__9200 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__9200.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__9198_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__9198_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__9204__9205 = to;
    if(G__9204__9205) {
      if(function() {
        var or__3824__auto____9206 = G__9204__9205.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____9206) {
          return or__3824__auto____9206
        }else {
          return G__9204__9205.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__9204__9205.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9204__9205)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9204__9205)
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
    var G__9207__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__9207 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9207__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9207.cljs$lang$maxFixedArity = 4;
    G__9207.cljs$lang$applyTo = function(arglist__9208) {
      var f = cljs.core.first(arglist__9208);
      var c1 = cljs.core.first(cljs.core.next(arglist__9208));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9208)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9208))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9208))));
      return G__9207__delegate(f, c1, c2, c3, colls)
    };
    G__9207.cljs$lang$arity$variadic = G__9207__delegate;
    return G__9207
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
      var temp__3974__auto____9215 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9215) {
        var s__9216 = temp__3974__auto____9215;
        var p__9217 = cljs.core.take.call(null, n, s__9216);
        if(n === cljs.core.count.call(null, p__9217)) {
          return cljs.core.cons.call(null, p__9217, partition.call(null, n, step, cljs.core.drop.call(null, step, s__9216)))
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
      var temp__3974__auto____9218 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9218) {
        var s__9219 = temp__3974__auto____9218;
        var p__9220 = cljs.core.take.call(null, n, s__9219);
        if(n === cljs.core.count.call(null, p__9220)) {
          return cljs.core.cons.call(null, p__9220, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__9219)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__9220, pad)))
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
    var sentinel__9225 = cljs.core.lookup_sentinel;
    var m__9226 = m;
    var ks__9227 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__9227) {
        var m__9228 = cljs.core._lookup.call(null, m__9226, cljs.core.first.call(null, ks__9227), sentinel__9225);
        if(sentinel__9225 === m__9228) {
          return not_found
        }else {
          var G__9229 = sentinel__9225;
          var G__9230 = m__9228;
          var G__9231 = cljs.core.next.call(null, ks__9227);
          sentinel__9225 = G__9229;
          m__9226 = G__9230;
          ks__9227 = G__9231;
          continue
        }
      }else {
        return m__9226
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
cljs.core.assoc_in = function assoc_in(m, p__9232, v) {
  var vec__9237__9238 = p__9232;
  var k__9239 = cljs.core.nth.call(null, vec__9237__9238, 0, null);
  var ks__9240 = cljs.core.nthnext.call(null, vec__9237__9238, 1);
  if(cljs.core.truth_(ks__9240)) {
    return cljs.core.assoc.call(null, m, k__9239, assoc_in.call(null, cljs.core._lookup.call(null, m, k__9239, null), ks__9240, v))
  }else {
    return cljs.core.assoc.call(null, m, k__9239, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__9241, f, args) {
    var vec__9246__9247 = p__9241;
    var k__9248 = cljs.core.nth.call(null, vec__9246__9247, 0, null);
    var ks__9249 = cljs.core.nthnext.call(null, vec__9246__9247, 1);
    if(cljs.core.truth_(ks__9249)) {
      return cljs.core.assoc.call(null, m, k__9248, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__9248, null), ks__9249, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__9248, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__9248, null), args))
    }
  };
  var update_in = function(m, p__9241, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__9241, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__9250) {
    var m = cljs.core.first(arglist__9250);
    var p__9241 = cljs.core.first(cljs.core.next(arglist__9250));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9250)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9250)));
    return update_in__delegate(m, p__9241, f, args)
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
  var this__9253 = this;
  var h__2192__auto____9254 = this__9253.__hash;
  if(!(h__2192__auto____9254 == null)) {
    return h__2192__auto____9254
  }else {
    var h__2192__auto____9255 = cljs.core.hash_coll.call(null, coll);
    this__9253.__hash = h__2192__auto____9255;
    return h__2192__auto____9255
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9256 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9257 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9258 = this;
  var new_array__9259 = this__9258.array.slice();
  new_array__9259[k] = v;
  return new cljs.core.Vector(this__9258.meta, new_array__9259, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__9290 = null;
  var G__9290__2 = function(this_sym9260, k) {
    var this__9262 = this;
    var this_sym9260__9263 = this;
    var coll__9264 = this_sym9260__9263;
    return coll__9264.cljs$core$ILookup$_lookup$arity$2(coll__9264, k)
  };
  var G__9290__3 = function(this_sym9261, k, not_found) {
    var this__9262 = this;
    var this_sym9261__9265 = this;
    var coll__9266 = this_sym9261__9265;
    return coll__9266.cljs$core$ILookup$_lookup$arity$3(coll__9266, k, not_found)
  };
  G__9290 = function(this_sym9261, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9290__2.call(this, this_sym9261, k);
      case 3:
        return G__9290__3.call(this, this_sym9261, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9290
}();
cljs.core.Vector.prototype.apply = function(this_sym9251, args9252) {
  var this__9267 = this;
  return this_sym9251.call.apply(this_sym9251, [this_sym9251].concat(args9252.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9268 = this;
  var new_array__9269 = this__9268.array.slice();
  new_array__9269.push(o);
  return new cljs.core.Vector(this__9268.meta, new_array__9269, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__9270 = this;
  var this__9271 = this;
  return cljs.core.pr_str.call(null, this__9271)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__9272 = this;
  return cljs.core.ci_reduce.call(null, this__9272.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__9273 = this;
  return cljs.core.ci_reduce.call(null, this__9273.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9274 = this;
  if(this__9274.array.length > 0) {
    var vector_seq__9275 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__9274.array.length) {
          return cljs.core.cons.call(null, this__9274.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__9275.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9276 = this;
  return this__9276.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9277 = this;
  var count__9278 = this__9277.array.length;
  if(count__9278 > 0) {
    return this__9277.array[count__9278 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9279 = this;
  if(this__9279.array.length > 0) {
    var new_array__9280 = this__9279.array.slice();
    new_array__9280.pop();
    return new cljs.core.Vector(this__9279.meta, new_array__9280, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9281 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9282 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9283 = this;
  return new cljs.core.Vector(meta, this__9283.array, this__9283.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9284 = this;
  return this__9284.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9285 = this;
  if(function() {
    var and__3822__auto____9286 = 0 <= n;
    if(and__3822__auto____9286) {
      return n < this__9285.array.length
    }else {
      return and__3822__auto____9286
    }
  }()) {
    return this__9285.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9287 = this;
  if(function() {
    var and__3822__auto____9288 = 0 <= n;
    if(and__3822__auto____9288) {
      return n < this__9287.array.length
    }else {
      return and__3822__auto____9288
    }
  }()) {
    return this__9287.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9289 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__9289.meta)
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
  var cnt__9292 = pv.cnt;
  if(cnt__9292 < 32) {
    return 0
  }else {
    return cnt__9292 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__9298 = level;
  var ret__9299 = node;
  while(true) {
    if(ll__9298 === 0) {
      return ret__9299
    }else {
      var embed__9300 = ret__9299;
      var r__9301 = cljs.core.pv_fresh_node.call(null, edit);
      var ___9302 = cljs.core.pv_aset.call(null, r__9301, 0, embed__9300);
      var G__9303 = ll__9298 - 5;
      var G__9304 = r__9301;
      ll__9298 = G__9303;
      ret__9299 = G__9304;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__9310 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__9311 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__9310, subidx__9311, tailnode);
    return ret__9310
  }else {
    var child__9312 = cljs.core.pv_aget.call(null, parent, subidx__9311);
    if(!(child__9312 == null)) {
      var node_to_insert__9313 = push_tail.call(null, pv, level - 5, child__9312, tailnode);
      cljs.core.pv_aset.call(null, ret__9310, subidx__9311, node_to_insert__9313);
      return ret__9310
    }else {
      var node_to_insert__9314 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__9310, subidx__9311, node_to_insert__9314);
      return ret__9310
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____9318 = 0 <= i;
    if(and__3822__auto____9318) {
      return i < pv.cnt
    }else {
      return and__3822__auto____9318
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__9319 = pv.root;
      var level__9320 = pv.shift;
      while(true) {
        if(level__9320 > 0) {
          var G__9321 = cljs.core.pv_aget.call(null, node__9319, i >>> level__9320 & 31);
          var G__9322 = level__9320 - 5;
          node__9319 = G__9321;
          level__9320 = G__9322;
          continue
        }else {
          return node__9319.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__9325 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__9325, i & 31, val);
    return ret__9325
  }else {
    var subidx__9326 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__9325, subidx__9326, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__9326), i, val));
    return ret__9325
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__9332 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__9333 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__9332));
    if(function() {
      var and__3822__auto____9334 = new_child__9333 == null;
      if(and__3822__auto____9334) {
        return subidx__9332 === 0
      }else {
        return and__3822__auto____9334
      }
    }()) {
      return null
    }else {
      var ret__9335 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__9335, subidx__9332, new_child__9333);
      return ret__9335
    }
  }else {
    if(subidx__9332 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__9336 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__9336, subidx__9332, null);
        return ret__9336
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
  var this__9339 = this;
  return new cljs.core.TransientVector(this__9339.cnt, this__9339.shift, cljs.core.tv_editable_root.call(null, this__9339.root), cljs.core.tv_editable_tail.call(null, this__9339.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9340 = this;
  var h__2192__auto____9341 = this__9340.__hash;
  if(!(h__2192__auto____9341 == null)) {
    return h__2192__auto____9341
  }else {
    var h__2192__auto____9342 = cljs.core.hash_coll.call(null, coll);
    this__9340.__hash = h__2192__auto____9342;
    return h__2192__auto____9342
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9343 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9344 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9345 = this;
  if(function() {
    var and__3822__auto____9346 = 0 <= k;
    if(and__3822__auto____9346) {
      return k < this__9345.cnt
    }else {
      return and__3822__auto____9346
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__9347 = this__9345.tail.slice();
      new_tail__9347[k & 31] = v;
      return new cljs.core.PersistentVector(this__9345.meta, this__9345.cnt, this__9345.shift, this__9345.root, new_tail__9347, null)
    }else {
      return new cljs.core.PersistentVector(this__9345.meta, this__9345.cnt, this__9345.shift, cljs.core.do_assoc.call(null, coll, this__9345.shift, this__9345.root, k, v), this__9345.tail, null)
    }
  }else {
    if(k === this__9345.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__9345.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__9395 = null;
  var G__9395__2 = function(this_sym9348, k) {
    var this__9350 = this;
    var this_sym9348__9351 = this;
    var coll__9352 = this_sym9348__9351;
    return coll__9352.cljs$core$ILookup$_lookup$arity$2(coll__9352, k)
  };
  var G__9395__3 = function(this_sym9349, k, not_found) {
    var this__9350 = this;
    var this_sym9349__9353 = this;
    var coll__9354 = this_sym9349__9353;
    return coll__9354.cljs$core$ILookup$_lookup$arity$3(coll__9354, k, not_found)
  };
  G__9395 = function(this_sym9349, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9395__2.call(this, this_sym9349, k);
      case 3:
        return G__9395__3.call(this, this_sym9349, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9395
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym9337, args9338) {
  var this__9355 = this;
  return this_sym9337.call.apply(this_sym9337, [this_sym9337].concat(args9338.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__9356 = this;
  var step_init__9357 = [0, init];
  var i__9358 = 0;
  while(true) {
    if(i__9358 < this__9356.cnt) {
      var arr__9359 = cljs.core.array_for.call(null, v, i__9358);
      var len__9360 = arr__9359.length;
      var init__9364 = function() {
        var j__9361 = 0;
        var init__9362 = step_init__9357[1];
        while(true) {
          if(j__9361 < len__9360) {
            var init__9363 = f.call(null, init__9362, j__9361 + i__9358, arr__9359[j__9361]);
            if(cljs.core.reduced_QMARK_.call(null, init__9363)) {
              return init__9363
            }else {
              var G__9396 = j__9361 + 1;
              var G__9397 = init__9363;
              j__9361 = G__9396;
              init__9362 = G__9397;
              continue
            }
          }else {
            step_init__9357[0] = len__9360;
            step_init__9357[1] = init__9362;
            return init__9362
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9364)) {
        return cljs.core.deref.call(null, init__9364)
      }else {
        var G__9398 = i__9358 + step_init__9357[0];
        i__9358 = G__9398;
        continue
      }
    }else {
      return step_init__9357[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9365 = this;
  if(this__9365.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__9366 = this__9365.tail.slice();
    new_tail__9366.push(o);
    return new cljs.core.PersistentVector(this__9365.meta, this__9365.cnt + 1, this__9365.shift, this__9365.root, new_tail__9366, null)
  }else {
    var root_overflow_QMARK___9367 = this__9365.cnt >>> 5 > 1 << this__9365.shift;
    var new_shift__9368 = root_overflow_QMARK___9367 ? this__9365.shift + 5 : this__9365.shift;
    var new_root__9370 = root_overflow_QMARK___9367 ? function() {
      var n_r__9369 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__9369, 0, this__9365.root);
      cljs.core.pv_aset.call(null, n_r__9369, 1, cljs.core.new_path.call(null, null, this__9365.shift, new cljs.core.VectorNode(null, this__9365.tail)));
      return n_r__9369
    }() : cljs.core.push_tail.call(null, coll, this__9365.shift, this__9365.root, new cljs.core.VectorNode(null, this__9365.tail));
    return new cljs.core.PersistentVector(this__9365.meta, this__9365.cnt + 1, new_shift__9368, new_root__9370, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9371 = this;
  if(this__9371.cnt > 0) {
    return new cljs.core.RSeq(coll, this__9371.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__9372 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__9373 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__9374 = this;
  var this__9375 = this;
  return cljs.core.pr_str.call(null, this__9375)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__9376 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__9377 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9378 = this;
  if(this__9378.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9379 = this;
  return this__9379.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9380 = this;
  if(this__9380.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__9380.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9381 = this;
  if(this__9381.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__9381.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9381.meta)
    }else {
      if(1 < this__9381.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__9381.meta, this__9381.cnt - 1, this__9381.shift, this__9381.root, this__9381.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__9382 = cljs.core.array_for.call(null, coll, this__9381.cnt - 2);
          var nr__9383 = cljs.core.pop_tail.call(null, coll, this__9381.shift, this__9381.root);
          var new_root__9384 = nr__9383 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__9383;
          var cnt_1__9385 = this__9381.cnt - 1;
          if(function() {
            var and__3822__auto____9386 = 5 < this__9381.shift;
            if(and__3822__auto____9386) {
              return cljs.core.pv_aget.call(null, new_root__9384, 1) == null
            }else {
              return and__3822__auto____9386
            }
          }()) {
            return new cljs.core.PersistentVector(this__9381.meta, cnt_1__9385, this__9381.shift - 5, cljs.core.pv_aget.call(null, new_root__9384, 0), new_tail__9382, null)
          }else {
            return new cljs.core.PersistentVector(this__9381.meta, cnt_1__9385, this__9381.shift, new_root__9384, new_tail__9382, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9387 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9388 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9389 = this;
  return new cljs.core.PersistentVector(meta, this__9389.cnt, this__9389.shift, this__9389.root, this__9389.tail, this__9389.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9390 = this;
  return this__9390.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9391 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9392 = this;
  if(function() {
    var and__3822__auto____9393 = 0 <= n;
    if(and__3822__auto____9393) {
      return n < this__9392.cnt
    }else {
      return and__3822__auto____9393
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9394 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9394.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__9399 = xs.length;
  var xs__9400 = no_clone === true ? xs : xs.slice();
  if(l__9399 < 32) {
    return new cljs.core.PersistentVector(null, l__9399, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__9400, null)
  }else {
    var node__9401 = xs__9400.slice(0, 32);
    var v__9402 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__9401, null);
    var i__9403 = 32;
    var out__9404 = cljs.core._as_transient.call(null, v__9402);
    while(true) {
      if(i__9403 < l__9399) {
        var G__9405 = i__9403 + 1;
        var G__9406 = cljs.core.conj_BANG_.call(null, out__9404, xs__9400[i__9403]);
        i__9403 = G__9405;
        out__9404 = G__9406;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9404)
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
  vector.cljs$lang$applyTo = function(arglist__9407) {
    var args = cljs.core.seq(arglist__9407);
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
  var this__9408 = this;
  if(this__9408.off + 1 < this__9408.node.length) {
    var s__9409 = cljs.core.chunked_seq.call(null, this__9408.vec, this__9408.node, this__9408.i, this__9408.off + 1);
    if(s__9409 == null) {
      return null
    }else {
      return s__9409
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9410 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9411 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9412 = this;
  return this__9412.node[this__9412.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9413 = this;
  if(this__9413.off + 1 < this__9413.node.length) {
    var s__9414 = cljs.core.chunked_seq.call(null, this__9413.vec, this__9413.node, this__9413.i, this__9413.off + 1);
    if(s__9414 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__9414
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__9415 = this;
  var l__9416 = this__9415.node.length;
  var s__9417 = this__9415.i + l__9416 < cljs.core._count.call(null, this__9415.vec) ? cljs.core.chunked_seq.call(null, this__9415.vec, this__9415.i + l__9416, 0) : null;
  if(s__9417 == null) {
    return null
  }else {
    return s__9417
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9418 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__9419 = this;
  return cljs.core.chunked_seq.call(null, this__9419.vec, this__9419.node, this__9419.i, this__9419.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__9420 = this;
  return this__9420.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9421 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9421.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__9422 = this;
  return cljs.core.array_chunk.call(null, this__9422.node, this__9422.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__9423 = this;
  var l__9424 = this__9423.node.length;
  var s__9425 = this__9423.i + l__9424 < cljs.core._count.call(null, this__9423.vec) ? cljs.core.chunked_seq.call(null, this__9423.vec, this__9423.i + l__9424, 0) : null;
  if(s__9425 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__9425
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
  var this__9428 = this;
  var h__2192__auto____9429 = this__9428.__hash;
  if(!(h__2192__auto____9429 == null)) {
    return h__2192__auto____9429
  }else {
    var h__2192__auto____9430 = cljs.core.hash_coll.call(null, coll);
    this__9428.__hash = h__2192__auto____9430;
    return h__2192__auto____9430
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9431 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9432 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__9433 = this;
  var v_pos__9434 = this__9433.start + key;
  return new cljs.core.Subvec(this__9433.meta, cljs.core._assoc.call(null, this__9433.v, v_pos__9434, val), this__9433.start, this__9433.end > v_pos__9434 + 1 ? this__9433.end : v_pos__9434 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__9460 = null;
  var G__9460__2 = function(this_sym9435, k) {
    var this__9437 = this;
    var this_sym9435__9438 = this;
    var coll__9439 = this_sym9435__9438;
    return coll__9439.cljs$core$ILookup$_lookup$arity$2(coll__9439, k)
  };
  var G__9460__3 = function(this_sym9436, k, not_found) {
    var this__9437 = this;
    var this_sym9436__9440 = this;
    var coll__9441 = this_sym9436__9440;
    return coll__9441.cljs$core$ILookup$_lookup$arity$3(coll__9441, k, not_found)
  };
  G__9460 = function(this_sym9436, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9460__2.call(this, this_sym9436, k);
      case 3:
        return G__9460__3.call(this, this_sym9436, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9460
}();
cljs.core.Subvec.prototype.apply = function(this_sym9426, args9427) {
  var this__9442 = this;
  return this_sym9426.call.apply(this_sym9426, [this_sym9426].concat(args9427.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9443 = this;
  return new cljs.core.Subvec(this__9443.meta, cljs.core._assoc_n.call(null, this__9443.v, this__9443.end, o), this__9443.start, this__9443.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__9444 = this;
  var this__9445 = this;
  return cljs.core.pr_str.call(null, this__9445)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__9446 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__9447 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9448 = this;
  var subvec_seq__9449 = function subvec_seq(i) {
    if(i === this__9448.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__9448.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__9449.call(null, this__9448.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9450 = this;
  return this__9450.end - this__9450.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9451 = this;
  return cljs.core._nth.call(null, this__9451.v, this__9451.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9452 = this;
  if(this__9452.start === this__9452.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__9452.meta, this__9452.v, this__9452.start, this__9452.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9453 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9454 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9455 = this;
  return new cljs.core.Subvec(meta, this__9455.v, this__9455.start, this__9455.end, this__9455.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9456 = this;
  return this__9456.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9457 = this;
  return cljs.core._nth.call(null, this__9457.v, this__9457.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9458 = this;
  return cljs.core._nth.call(null, this__9458.v, this__9458.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9459 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__9459.meta)
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
  var ret__9462 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__9462, 0, tl.length);
  return ret__9462
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__9466 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__9467 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__9466, subidx__9467, level === 5 ? tail_node : function() {
    var child__9468 = cljs.core.pv_aget.call(null, ret__9466, subidx__9467);
    if(!(child__9468 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__9468, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__9466
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__9473 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__9474 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__9475 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__9473, subidx__9474));
    if(function() {
      var and__3822__auto____9476 = new_child__9475 == null;
      if(and__3822__auto____9476) {
        return subidx__9474 === 0
      }else {
        return and__3822__auto____9476
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__9473, subidx__9474, new_child__9475);
      return node__9473
    }
  }else {
    if(subidx__9474 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__9473, subidx__9474, null);
        return node__9473
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____9481 = 0 <= i;
    if(and__3822__auto____9481) {
      return i < tv.cnt
    }else {
      return and__3822__auto____9481
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__9482 = tv.root;
      var node__9483 = root__9482;
      var level__9484 = tv.shift;
      while(true) {
        if(level__9484 > 0) {
          var G__9485 = cljs.core.tv_ensure_editable.call(null, root__9482.edit, cljs.core.pv_aget.call(null, node__9483, i >>> level__9484 & 31));
          var G__9486 = level__9484 - 5;
          node__9483 = G__9485;
          level__9484 = G__9486;
          continue
        }else {
          return node__9483.arr
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
  var G__9526 = null;
  var G__9526__2 = function(this_sym9489, k) {
    var this__9491 = this;
    var this_sym9489__9492 = this;
    var coll__9493 = this_sym9489__9492;
    return coll__9493.cljs$core$ILookup$_lookup$arity$2(coll__9493, k)
  };
  var G__9526__3 = function(this_sym9490, k, not_found) {
    var this__9491 = this;
    var this_sym9490__9494 = this;
    var coll__9495 = this_sym9490__9494;
    return coll__9495.cljs$core$ILookup$_lookup$arity$3(coll__9495, k, not_found)
  };
  G__9526 = function(this_sym9490, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9526__2.call(this, this_sym9490, k);
      case 3:
        return G__9526__3.call(this, this_sym9490, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9526
}();
cljs.core.TransientVector.prototype.apply = function(this_sym9487, args9488) {
  var this__9496 = this;
  return this_sym9487.call.apply(this_sym9487, [this_sym9487].concat(args9488.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9497 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9498 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9499 = this;
  if(this__9499.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9500 = this;
  if(function() {
    var and__3822__auto____9501 = 0 <= n;
    if(and__3822__auto____9501) {
      return n < this__9500.cnt
    }else {
      return and__3822__auto____9501
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9502 = this;
  if(this__9502.root.edit) {
    return this__9502.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__9503 = this;
  if(this__9503.root.edit) {
    if(function() {
      var and__3822__auto____9504 = 0 <= n;
      if(and__3822__auto____9504) {
        return n < this__9503.cnt
      }else {
        return and__3822__auto____9504
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__9503.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__9509 = function go(level, node) {
          var node__9507 = cljs.core.tv_ensure_editable.call(null, this__9503.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__9507, n & 31, val);
            return node__9507
          }else {
            var subidx__9508 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__9507, subidx__9508, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__9507, subidx__9508)));
            return node__9507
          }
        }.call(null, this__9503.shift, this__9503.root);
        this__9503.root = new_root__9509;
        return tcoll
      }
    }else {
      if(n === this__9503.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__9503.cnt)].join(""));
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
  var this__9510 = this;
  if(this__9510.root.edit) {
    if(this__9510.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__9510.cnt) {
        this__9510.cnt = 0;
        return tcoll
      }else {
        if((this__9510.cnt - 1 & 31) > 0) {
          this__9510.cnt = this__9510.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__9511 = cljs.core.editable_array_for.call(null, tcoll, this__9510.cnt - 2);
            var new_root__9513 = function() {
              var nr__9512 = cljs.core.tv_pop_tail.call(null, tcoll, this__9510.shift, this__9510.root);
              if(!(nr__9512 == null)) {
                return nr__9512
              }else {
                return new cljs.core.VectorNode(this__9510.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____9514 = 5 < this__9510.shift;
              if(and__3822__auto____9514) {
                return cljs.core.pv_aget.call(null, new_root__9513, 1) == null
              }else {
                return and__3822__auto____9514
              }
            }()) {
              var new_root__9515 = cljs.core.tv_ensure_editable.call(null, this__9510.root.edit, cljs.core.pv_aget.call(null, new_root__9513, 0));
              this__9510.root = new_root__9515;
              this__9510.shift = this__9510.shift - 5;
              this__9510.cnt = this__9510.cnt - 1;
              this__9510.tail = new_tail__9511;
              return tcoll
            }else {
              this__9510.root = new_root__9513;
              this__9510.cnt = this__9510.cnt - 1;
              this__9510.tail = new_tail__9511;
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
  var this__9516 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9517 = this;
  if(this__9517.root.edit) {
    if(this__9517.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__9517.tail[this__9517.cnt & 31] = o;
      this__9517.cnt = this__9517.cnt + 1;
      return tcoll
    }else {
      var tail_node__9518 = new cljs.core.VectorNode(this__9517.root.edit, this__9517.tail);
      var new_tail__9519 = cljs.core.make_array.call(null, 32);
      new_tail__9519[0] = o;
      this__9517.tail = new_tail__9519;
      if(this__9517.cnt >>> 5 > 1 << this__9517.shift) {
        var new_root_array__9520 = cljs.core.make_array.call(null, 32);
        var new_shift__9521 = this__9517.shift + 5;
        new_root_array__9520[0] = this__9517.root;
        new_root_array__9520[1] = cljs.core.new_path.call(null, this__9517.root.edit, this__9517.shift, tail_node__9518);
        this__9517.root = new cljs.core.VectorNode(this__9517.root.edit, new_root_array__9520);
        this__9517.shift = new_shift__9521;
        this__9517.cnt = this__9517.cnt + 1;
        return tcoll
      }else {
        var new_root__9522 = cljs.core.tv_push_tail.call(null, tcoll, this__9517.shift, this__9517.root, tail_node__9518);
        this__9517.root = new_root__9522;
        this__9517.cnt = this__9517.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9523 = this;
  if(this__9523.root.edit) {
    this__9523.root.edit = null;
    var len__9524 = this__9523.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__9525 = cljs.core.make_array.call(null, len__9524);
    cljs.core.array_copy.call(null, this__9523.tail, 0, trimmed_tail__9525, 0, len__9524);
    return new cljs.core.PersistentVector(null, this__9523.cnt, this__9523.shift, this__9523.root, trimmed_tail__9525, null)
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
  var this__9527 = this;
  var h__2192__auto____9528 = this__9527.__hash;
  if(!(h__2192__auto____9528 == null)) {
    return h__2192__auto____9528
  }else {
    var h__2192__auto____9529 = cljs.core.hash_coll.call(null, coll);
    this__9527.__hash = h__2192__auto____9529;
    return h__2192__auto____9529
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9530 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__9531 = this;
  var this__9532 = this;
  return cljs.core.pr_str.call(null, this__9532)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9533 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9534 = this;
  return cljs.core._first.call(null, this__9534.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9535 = this;
  var temp__3971__auto____9536 = cljs.core.next.call(null, this__9535.front);
  if(temp__3971__auto____9536) {
    var f1__9537 = temp__3971__auto____9536;
    return new cljs.core.PersistentQueueSeq(this__9535.meta, f1__9537, this__9535.rear, null)
  }else {
    if(this__9535.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__9535.meta, this__9535.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9538 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9539 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__9539.front, this__9539.rear, this__9539.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9540 = this;
  return this__9540.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9541 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9541.meta)
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
  var this__9542 = this;
  var h__2192__auto____9543 = this__9542.__hash;
  if(!(h__2192__auto____9543 == null)) {
    return h__2192__auto____9543
  }else {
    var h__2192__auto____9544 = cljs.core.hash_coll.call(null, coll);
    this__9542.__hash = h__2192__auto____9544;
    return h__2192__auto____9544
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9545 = this;
  if(cljs.core.truth_(this__9545.front)) {
    return new cljs.core.PersistentQueue(this__9545.meta, this__9545.count + 1, this__9545.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____9546 = this__9545.rear;
      if(cljs.core.truth_(or__3824__auto____9546)) {
        return or__3824__auto____9546
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__9545.meta, this__9545.count + 1, cljs.core.conj.call(null, this__9545.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__9547 = this;
  var this__9548 = this;
  return cljs.core.pr_str.call(null, this__9548)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9549 = this;
  var rear__9550 = cljs.core.seq.call(null, this__9549.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____9551 = this__9549.front;
    if(cljs.core.truth_(or__3824__auto____9551)) {
      return or__3824__auto____9551
    }else {
      return rear__9550
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__9549.front, cljs.core.seq.call(null, rear__9550), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9552 = this;
  return this__9552.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9553 = this;
  return cljs.core._first.call(null, this__9553.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9554 = this;
  if(cljs.core.truth_(this__9554.front)) {
    var temp__3971__auto____9555 = cljs.core.next.call(null, this__9554.front);
    if(temp__3971__auto____9555) {
      var f1__9556 = temp__3971__auto____9555;
      return new cljs.core.PersistentQueue(this__9554.meta, this__9554.count - 1, f1__9556, this__9554.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__9554.meta, this__9554.count - 1, cljs.core.seq.call(null, this__9554.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9557 = this;
  return cljs.core.first.call(null, this__9557.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9558 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9559 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9560 = this;
  return new cljs.core.PersistentQueue(meta, this__9560.count, this__9560.front, this__9560.rear, this__9560.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9561 = this;
  return this__9561.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9562 = this;
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
  var this__9563 = this;
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
  var len__9566 = array.length;
  var i__9567 = 0;
  while(true) {
    if(i__9567 < len__9566) {
      if(k === array[i__9567]) {
        return i__9567
      }else {
        var G__9568 = i__9567 + incr;
        i__9567 = G__9568;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__9571 = cljs.core.hash.call(null, a);
  var b__9572 = cljs.core.hash.call(null, b);
  if(a__9571 < b__9572) {
    return-1
  }else {
    if(a__9571 > b__9572) {
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
  var ks__9580 = m.keys;
  var len__9581 = ks__9580.length;
  var so__9582 = m.strobj;
  var out__9583 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__9584 = 0;
  var out__9585 = cljs.core.transient$.call(null, out__9583);
  while(true) {
    if(i__9584 < len__9581) {
      var k__9586 = ks__9580[i__9584];
      var G__9587 = i__9584 + 1;
      var G__9588 = cljs.core.assoc_BANG_.call(null, out__9585, k__9586, so__9582[k__9586]);
      i__9584 = G__9587;
      out__9585 = G__9588;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__9585, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__9594 = {};
  var l__9595 = ks.length;
  var i__9596 = 0;
  while(true) {
    if(i__9596 < l__9595) {
      var k__9597 = ks[i__9596];
      new_obj__9594[k__9597] = obj[k__9597];
      var G__9598 = i__9596 + 1;
      i__9596 = G__9598;
      continue
    }else {
    }
    break
  }
  return new_obj__9594
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
  var this__9601 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9602 = this;
  var h__2192__auto____9603 = this__9602.__hash;
  if(!(h__2192__auto____9603 == null)) {
    return h__2192__auto____9603
  }else {
    var h__2192__auto____9604 = cljs.core.hash_imap.call(null, coll);
    this__9602.__hash = h__2192__auto____9604;
    return h__2192__auto____9604
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9605 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9606 = this;
  if(function() {
    var and__3822__auto____9607 = goog.isString(k);
    if(and__3822__auto____9607) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9606.keys) == null)
    }else {
      return and__3822__auto____9607
    }
  }()) {
    return this__9606.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9608 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____9609 = this__9608.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____9609) {
        return or__3824__auto____9609
      }else {
        return this__9608.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__9608.keys) == null)) {
        var new_strobj__9610 = cljs.core.obj_clone.call(null, this__9608.strobj, this__9608.keys);
        new_strobj__9610[k] = v;
        return new cljs.core.ObjMap(this__9608.meta, this__9608.keys, new_strobj__9610, this__9608.update_count + 1, null)
      }else {
        var new_strobj__9611 = cljs.core.obj_clone.call(null, this__9608.strobj, this__9608.keys);
        var new_keys__9612 = this__9608.keys.slice();
        new_strobj__9611[k] = v;
        new_keys__9612.push(k);
        return new cljs.core.ObjMap(this__9608.meta, new_keys__9612, new_strobj__9611, this__9608.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9613 = this;
  if(function() {
    var and__3822__auto____9614 = goog.isString(k);
    if(and__3822__auto____9614) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9613.keys) == null)
    }else {
      return and__3822__auto____9614
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__9636 = null;
  var G__9636__2 = function(this_sym9615, k) {
    var this__9617 = this;
    var this_sym9615__9618 = this;
    var coll__9619 = this_sym9615__9618;
    return coll__9619.cljs$core$ILookup$_lookup$arity$2(coll__9619, k)
  };
  var G__9636__3 = function(this_sym9616, k, not_found) {
    var this__9617 = this;
    var this_sym9616__9620 = this;
    var coll__9621 = this_sym9616__9620;
    return coll__9621.cljs$core$ILookup$_lookup$arity$3(coll__9621, k, not_found)
  };
  G__9636 = function(this_sym9616, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9636__2.call(this, this_sym9616, k);
      case 3:
        return G__9636__3.call(this, this_sym9616, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9636
}();
cljs.core.ObjMap.prototype.apply = function(this_sym9599, args9600) {
  var this__9622 = this;
  return this_sym9599.call.apply(this_sym9599, [this_sym9599].concat(args9600.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9623 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__9624 = this;
  var this__9625 = this;
  return cljs.core.pr_str.call(null, this__9625)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9626 = this;
  if(this__9626.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__9589_SHARP_) {
      return cljs.core.vector.call(null, p1__9589_SHARP_, this__9626.strobj[p1__9589_SHARP_])
    }, this__9626.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9627 = this;
  return this__9627.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9628 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9629 = this;
  return new cljs.core.ObjMap(meta, this__9629.keys, this__9629.strobj, this__9629.update_count, this__9629.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9630 = this;
  return this__9630.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9631 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__9631.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9632 = this;
  if(function() {
    var and__3822__auto____9633 = goog.isString(k);
    if(and__3822__auto____9633) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9632.keys) == null)
    }else {
      return and__3822__auto____9633
    }
  }()) {
    var new_keys__9634 = this__9632.keys.slice();
    var new_strobj__9635 = cljs.core.obj_clone.call(null, this__9632.strobj, this__9632.keys);
    new_keys__9634.splice(cljs.core.scan_array.call(null, 1, k, new_keys__9634), 1);
    cljs.core.js_delete.call(null, new_strobj__9635, k);
    return new cljs.core.ObjMap(this__9632.meta, new_keys__9634, new_strobj__9635, this__9632.update_count + 1, null)
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
  var this__9640 = this;
  var h__2192__auto____9641 = this__9640.__hash;
  if(!(h__2192__auto____9641 == null)) {
    return h__2192__auto____9641
  }else {
    var h__2192__auto____9642 = cljs.core.hash_imap.call(null, coll);
    this__9640.__hash = h__2192__auto____9642;
    return h__2192__auto____9642
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9643 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9644 = this;
  var bucket__9645 = this__9644.hashobj[cljs.core.hash.call(null, k)];
  var i__9646 = cljs.core.truth_(bucket__9645) ? cljs.core.scan_array.call(null, 2, k, bucket__9645) : null;
  if(cljs.core.truth_(i__9646)) {
    return bucket__9645[i__9646 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9647 = this;
  var h__9648 = cljs.core.hash.call(null, k);
  var bucket__9649 = this__9647.hashobj[h__9648];
  if(cljs.core.truth_(bucket__9649)) {
    var new_bucket__9650 = bucket__9649.slice();
    var new_hashobj__9651 = goog.object.clone(this__9647.hashobj);
    new_hashobj__9651[h__9648] = new_bucket__9650;
    var temp__3971__auto____9652 = cljs.core.scan_array.call(null, 2, k, new_bucket__9650);
    if(cljs.core.truth_(temp__3971__auto____9652)) {
      var i__9653 = temp__3971__auto____9652;
      new_bucket__9650[i__9653 + 1] = v;
      return new cljs.core.HashMap(this__9647.meta, this__9647.count, new_hashobj__9651, null)
    }else {
      new_bucket__9650.push(k, v);
      return new cljs.core.HashMap(this__9647.meta, this__9647.count + 1, new_hashobj__9651, null)
    }
  }else {
    var new_hashobj__9654 = goog.object.clone(this__9647.hashobj);
    new_hashobj__9654[h__9648] = [k, v];
    return new cljs.core.HashMap(this__9647.meta, this__9647.count + 1, new_hashobj__9654, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9655 = this;
  var bucket__9656 = this__9655.hashobj[cljs.core.hash.call(null, k)];
  var i__9657 = cljs.core.truth_(bucket__9656) ? cljs.core.scan_array.call(null, 2, k, bucket__9656) : null;
  if(cljs.core.truth_(i__9657)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__9682 = null;
  var G__9682__2 = function(this_sym9658, k) {
    var this__9660 = this;
    var this_sym9658__9661 = this;
    var coll__9662 = this_sym9658__9661;
    return coll__9662.cljs$core$ILookup$_lookup$arity$2(coll__9662, k)
  };
  var G__9682__3 = function(this_sym9659, k, not_found) {
    var this__9660 = this;
    var this_sym9659__9663 = this;
    var coll__9664 = this_sym9659__9663;
    return coll__9664.cljs$core$ILookup$_lookup$arity$3(coll__9664, k, not_found)
  };
  G__9682 = function(this_sym9659, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9682__2.call(this, this_sym9659, k);
      case 3:
        return G__9682__3.call(this, this_sym9659, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9682
}();
cljs.core.HashMap.prototype.apply = function(this_sym9638, args9639) {
  var this__9665 = this;
  return this_sym9638.call.apply(this_sym9638, [this_sym9638].concat(args9639.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9666 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__9667 = this;
  var this__9668 = this;
  return cljs.core.pr_str.call(null, this__9668)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9669 = this;
  if(this__9669.count > 0) {
    var hashes__9670 = cljs.core.js_keys.call(null, this__9669.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__9637_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__9669.hashobj[p1__9637_SHARP_]))
    }, hashes__9670)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9671 = this;
  return this__9671.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9672 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9673 = this;
  return new cljs.core.HashMap(meta, this__9673.count, this__9673.hashobj, this__9673.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9674 = this;
  return this__9674.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9675 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__9675.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9676 = this;
  var h__9677 = cljs.core.hash.call(null, k);
  var bucket__9678 = this__9676.hashobj[h__9677];
  var i__9679 = cljs.core.truth_(bucket__9678) ? cljs.core.scan_array.call(null, 2, k, bucket__9678) : null;
  if(cljs.core.not.call(null, i__9679)) {
    return coll
  }else {
    var new_hashobj__9680 = goog.object.clone(this__9676.hashobj);
    if(3 > bucket__9678.length) {
      cljs.core.js_delete.call(null, new_hashobj__9680, h__9677)
    }else {
      var new_bucket__9681 = bucket__9678.slice();
      new_bucket__9681.splice(i__9679, 2);
      new_hashobj__9680[h__9677] = new_bucket__9681
    }
    return new cljs.core.HashMap(this__9676.meta, this__9676.count - 1, new_hashobj__9680, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__9683 = ks.length;
  var i__9684 = 0;
  var out__9685 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__9684 < len__9683) {
      var G__9686 = i__9684 + 1;
      var G__9687 = cljs.core.assoc.call(null, out__9685, ks[i__9684], vs[i__9684]);
      i__9684 = G__9686;
      out__9685 = G__9687;
      continue
    }else {
      return out__9685
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__9691 = m.arr;
  var len__9692 = arr__9691.length;
  var i__9693 = 0;
  while(true) {
    if(len__9692 <= i__9693) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__9691[i__9693], k)) {
        return i__9693
      }else {
        if("\ufdd0'else") {
          var G__9694 = i__9693 + 2;
          i__9693 = G__9694;
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
  var this__9697 = this;
  return new cljs.core.TransientArrayMap({}, this__9697.arr.length, this__9697.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9698 = this;
  var h__2192__auto____9699 = this__9698.__hash;
  if(!(h__2192__auto____9699 == null)) {
    return h__2192__auto____9699
  }else {
    var h__2192__auto____9700 = cljs.core.hash_imap.call(null, coll);
    this__9698.__hash = h__2192__auto____9700;
    return h__2192__auto____9700
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9701 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9702 = this;
  var idx__9703 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9703 === -1) {
    return not_found
  }else {
    return this__9702.arr[idx__9703 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9704 = this;
  var idx__9705 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9705 === -1) {
    if(this__9704.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__9704.meta, this__9704.cnt + 1, function() {
        var G__9706__9707 = this__9704.arr.slice();
        G__9706__9707.push(k);
        G__9706__9707.push(v);
        return G__9706__9707
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__9704.arr[idx__9705 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__9704.meta, this__9704.cnt, function() {
          var G__9708__9709 = this__9704.arr.slice();
          G__9708__9709[idx__9705 + 1] = v;
          return G__9708__9709
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9710 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__9742 = null;
  var G__9742__2 = function(this_sym9711, k) {
    var this__9713 = this;
    var this_sym9711__9714 = this;
    var coll__9715 = this_sym9711__9714;
    return coll__9715.cljs$core$ILookup$_lookup$arity$2(coll__9715, k)
  };
  var G__9742__3 = function(this_sym9712, k, not_found) {
    var this__9713 = this;
    var this_sym9712__9716 = this;
    var coll__9717 = this_sym9712__9716;
    return coll__9717.cljs$core$ILookup$_lookup$arity$3(coll__9717, k, not_found)
  };
  G__9742 = function(this_sym9712, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9742__2.call(this, this_sym9712, k);
      case 3:
        return G__9742__3.call(this, this_sym9712, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9742
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym9695, args9696) {
  var this__9718 = this;
  return this_sym9695.call.apply(this_sym9695, [this_sym9695].concat(args9696.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9719 = this;
  var len__9720 = this__9719.arr.length;
  var i__9721 = 0;
  var init__9722 = init;
  while(true) {
    if(i__9721 < len__9720) {
      var init__9723 = f.call(null, init__9722, this__9719.arr[i__9721], this__9719.arr[i__9721 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__9723)) {
        return cljs.core.deref.call(null, init__9723)
      }else {
        var G__9743 = i__9721 + 2;
        var G__9744 = init__9723;
        i__9721 = G__9743;
        init__9722 = G__9744;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9724 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__9725 = this;
  var this__9726 = this;
  return cljs.core.pr_str.call(null, this__9726)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9727 = this;
  if(this__9727.cnt > 0) {
    var len__9728 = this__9727.arr.length;
    var array_map_seq__9729 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__9728) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__9727.arr[i], this__9727.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__9729.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9730 = this;
  return this__9730.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9731 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9732 = this;
  return new cljs.core.PersistentArrayMap(meta, this__9732.cnt, this__9732.arr, this__9732.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9733 = this;
  return this__9733.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9734 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__9734.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9735 = this;
  var idx__9736 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9736 >= 0) {
    var len__9737 = this__9735.arr.length;
    var new_len__9738 = len__9737 - 2;
    if(new_len__9738 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__9739 = cljs.core.make_array.call(null, new_len__9738);
      var s__9740 = 0;
      var d__9741 = 0;
      while(true) {
        if(s__9740 >= len__9737) {
          return new cljs.core.PersistentArrayMap(this__9735.meta, this__9735.cnt - 1, new_arr__9739, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__9735.arr[s__9740])) {
            var G__9745 = s__9740 + 2;
            var G__9746 = d__9741;
            s__9740 = G__9745;
            d__9741 = G__9746;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__9739[d__9741] = this__9735.arr[s__9740];
              new_arr__9739[d__9741 + 1] = this__9735.arr[s__9740 + 1];
              var G__9747 = s__9740 + 2;
              var G__9748 = d__9741 + 2;
              s__9740 = G__9747;
              d__9741 = G__9748;
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
  var len__9749 = cljs.core.count.call(null, ks);
  var i__9750 = 0;
  var out__9751 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__9750 < len__9749) {
      var G__9752 = i__9750 + 1;
      var G__9753 = cljs.core.assoc_BANG_.call(null, out__9751, ks[i__9750], vs[i__9750]);
      i__9750 = G__9752;
      out__9751 = G__9753;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9751)
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
  var this__9754 = this;
  if(cljs.core.truth_(this__9754.editable_QMARK_)) {
    var idx__9755 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9755 >= 0) {
      this__9754.arr[idx__9755] = this__9754.arr[this__9754.len - 2];
      this__9754.arr[idx__9755 + 1] = this__9754.arr[this__9754.len - 1];
      var G__9756__9757 = this__9754.arr;
      G__9756__9757.pop();
      G__9756__9757.pop();
      G__9756__9757;
      this__9754.len = this__9754.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9758 = this;
  if(cljs.core.truth_(this__9758.editable_QMARK_)) {
    var idx__9759 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9759 === -1) {
      if(this__9758.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__9758.len = this__9758.len + 2;
        this__9758.arr.push(key);
        this__9758.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__9758.len, this__9758.arr), key, val)
      }
    }else {
      if(val === this__9758.arr[idx__9759 + 1]) {
        return tcoll
      }else {
        this__9758.arr[idx__9759 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9760 = this;
  if(cljs.core.truth_(this__9760.editable_QMARK_)) {
    if(function() {
      var G__9761__9762 = o;
      if(G__9761__9762) {
        if(function() {
          var or__3824__auto____9763 = G__9761__9762.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9763) {
            return or__3824__auto____9763
          }else {
            return G__9761__9762.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9761__9762.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9761__9762)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9761__9762)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9764 = cljs.core.seq.call(null, o);
      var tcoll__9765 = tcoll;
      while(true) {
        var temp__3971__auto____9766 = cljs.core.first.call(null, es__9764);
        if(cljs.core.truth_(temp__3971__auto____9766)) {
          var e__9767 = temp__3971__auto____9766;
          var G__9773 = cljs.core.next.call(null, es__9764);
          var G__9774 = tcoll__9765.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__9765, cljs.core.key.call(null, e__9767), cljs.core.val.call(null, e__9767));
          es__9764 = G__9773;
          tcoll__9765 = G__9774;
          continue
        }else {
          return tcoll__9765
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9768 = this;
  if(cljs.core.truth_(this__9768.editable_QMARK_)) {
    this__9768.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__9768.len, 2), this__9768.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9769 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9770 = this;
  if(cljs.core.truth_(this__9770.editable_QMARK_)) {
    var idx__9771 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__9771 === -1) {
      return not_found
    }else {
      return this__9770.arr[idx__9771 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9772 = this;
  if(cljs.core.truth_(this__9772.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__9772.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__9777 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__9778 = 0;
  while(true) {
    if(i__9778 < len) {
      var G__9779 = cljs.core.assoc_BANG_.call(null, out__9777, arr[i__9778], arr[i__9778 + 1]);
      var G__9780 = i__9778 + 2;
      out__9777 = G__9779;
      i__9778 = G__9780;
      continue
    }else {
      return out__9777
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
    var G__9785__9786 = arr.slice();
    G__9785__9786[i] = a;
    return G__9785__9786
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__9787__9788 = arr.slice();
    G__9787__9788[i] = a;
    G__9787__9788[j] = b;
    return G__9787__9788
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
  var new_arr__9790 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__9790, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__9790, 2 * i, new_arr__9790.length - 2 * i);
  return new_arr__9790
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
    var editable__9793 = inode.ensure_editable(edit);
    editable__9793.arr[i] = a;
    return editable__9793
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__9794 = inode.ensure_editable(edit);
    editable__9794.arr[i] = a;
    editable__9794.arr[j] = b;
    return editable__9794
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
  var len__9801 = arr.length;
  var i__9802 = 0;
  var init__9803 = init;
  while(true) {
    if(i__9802 < len__9801) {
      var init__9806 = function() {
        var k__9804 = arr[i__9802];
        if(!(k__9804 == null)) {
          return f.call(null, init__9803, k__9804, arr[i__9802 + 1])
        }else {
          var node__9805 = arr[i__9802 + 1];
          if(!(node__9805 == null)) {
            return node__9805.kv_reduce(f, init__9803)
          }else {
            return init__9803
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9806)) {
        return cljs.core.deref.call(null, init__9806)
      }else {
        var G__9807 = i__9802 + 2;
        var G__9808 = init__9806;
        i__9802 = G__9807;
        init__9803 = G__9808;
        continue
      }
    }else {
      return init__9803
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
  var this__9809 = this;
  var inode__9810 = this;
  if(this__9809.bitmap === bit) {
    return null
  }else {
    var editable__9811 = inode__9810.ensure_editable(e);
    var earr__9812 = editable__9811.arr;
    var len__9813 = earr__9812.length;
    editable__9811.bitmap = bit ^ editable__9811.bitmap;
    cljs.core.array_copy.call(null, earr__9812, 2 * (i + 1), earr__9812, 2 * i, len__9813 - 2 * (i + 1));
    earr__9812[len__9813 - 2] = null;
    earr__9812[len__9813 - 1] = null;
    return editable__9811
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9814 = this;
  var inode__9815 = this;
  var bit__9816 = 1 << (hash >>> shift & 31);
  var idx__9817 = cljs.core.bitmap_indexed_node_index.call(null, this__9814.bitmap, bit__9816);
  if((this__9814.bitmap & bit__9816) === 0) {
    var n__9818 = cljs.core.bit_count.call(null, this__9814.bitmap);
    if(2 * n__9818 < this__9814.arr.length) {
      var editable__9819 = inode__9815.ensure_editable(edit);
      var earr__9820 = editable__9819.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__9820, 2 * idx__9817, earr__9820, 2 * (idx__9817 + 1), 2 * (n__9818 - idx__9817));
      earr__9820[2 * idx__9817] = key;
      earr__9820[2 * idx__9817 + 1] = val;
      editable__9819.bitmap = editable__9819.bitmap | bit__9816;
      return editable__9819
    }else {
      if(n__9818 >= 16) {
        var nodes__9821 = cljs.core.make_array.call(null, 32);
        var jdx__9822 = hash >>> shift & 31;
        nodes__9821[jdx__9822] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__9823 = 0;
        var j__9824 = 0;
        while(true) {
          if(i__9823 < 32) {
            if((this__9814.bitmap >>> i__9823 & 1) === 0) {
              var G__9877 = i__9823 + 1;
              var G__9878 = j__9824;
              i__9823 = G__9877;
              j__9824 = G__9878;
              continue
            }else {
              nodes__9821[i__9823] = !(this__9814.arr[j__9824] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__9814.arr[j__9824]), this__9814.arr[j__9824], this__9814.arr[j__9824 + 1], added_leaf_QMARK_) : this__9814.arr[j__9824 + 1];
              var G__9879 = i__9823 + 1;
              var G__9880 = j__9824 + 2;
              i__9823 = G__9879;
              j__9824 = G__9880;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__9818 + 1, nodes__9821)
      }else {
        if("\ufdd0'else") {
          var new_arr__9825 = cljs.core.make_array.call(null, 2 * (n__9818 + 4));
          cljs.core.array_copy.call(null, this__9814.arr, 0, new_arr__9825, 0, 2 * idx__9817);
          new_arr__9825[2 * idx__9817] = key;
          new_arr__9825[2 * idx__9817 + 1] = val;
          cljs.core.array_copy.call(null, this__9814.arr, 2 * idx__9817, new_arr__9825, 2 * (idx__9817 + 1), 2 * (n__9818 - idx__9817));
          added_leaf_QMARK_.val = true;
          var editable__9826 = inode__9815.ensure_editable(edit);
          editable__9826.arr = new_arr__9825;
          editable__9826.bitmap = editable__9826.bitmap | bit__9816;
          return editable__9826
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__9827 = this__9814.arr[2 * idx__9817];
    var val_or_node__9828 = this__9814.arr[2 * idx__9817 + 1];
    if(key_or_nil__9827 == null) {
      var n__9829 = val_or_node__9828.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9829 === val_or_node__9828) {
        return inode__9815
      }else {
        return cljs.core.edit_and_set.call(null, inode__9815, edit, 2 * idx__9817 + 1, n__9829)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9827)) {
        if(val === val_or_node__9828) {
          return inode__9815
        }else {
          return cljs.core.edit_and_set.call(null, inode__9815, edit, 2 * idx__9817 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__9815, edit, 2 * idx__9817, null, 2 * idx__9817 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__9827, val_or_node__9828, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__9830 = this;
  var inode__9831 = this;
  return cljs.core.create_inode_seq.call(null, this__9830.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9832 = this;
  var inode__9833 = this;
  var bit__9834 = 1 << (hash >>> shift & 31);
  if((this__9832.bitmap & bit__9834) === 0) {
    return inode__9833
  }else {
    var idx__9835 = cljs.core.bitmap_indexed_node_index.call(null, this__9832.bitmap, bit__9834);
    var key_or_nil__9836 = this__9832.arr[2 * idx__9835];
    var val_or_node__9837 = this__9832.arr[2 * idx__9835 + 1];
    if(key_or_nil__9836 == null) {
      var n__9838 = val_or_node__9837.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__9838 === val_or_node__9837) {
        return inode__9833
      }else {
        if(!(n__9838 == null)) {
          return cljs.core.edit_and_set.call(null, inode__9833, edit, 2 * idx__9835 + 1, n__9838)
        }else {
          if(this__9832.bitmap === bit__9834) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__9833.edit_and_remove_pair(edit, bit__9834, idx__9835)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9836)) {
        removed_leaf_QMARK_[0] = true;
        return inode__9833.edit_and_remove_pair(edit, bit__9834, idx__9835)
      }else {
        if("\ufdd0'else") {
          return inode__9833
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__9839 = this;
  var inode__9840 = this;
  if(e === this__9839.edit) {
    return inode__9840
  }else {
    var n__9841 = cljs.core.bit_count.call(null, this__9839.bitmap);
    var new_arr__9842 = cljs.core.make_array.call(null, n__9841 < 0 ? 4 : 2 * (n__9841 + 1));
    cljs.core.array_copy.call(null, this__9839.arr, 0, new_arr__9842, 0, 2 * n__9841);
    return new cljs.core.BitmapIndexedNode(e, this__9839.bitmap, new_arr__9842)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__9843 = this;
  var inode__9844 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9843.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9845 = this;
  var inode__9846 = this;
  var bit__9847 = 1 << (hash >>> shift & 31);
  if((this__9845.bitmap & bit__9847) === 0) {
    return not_found
  }else {
    var idx__9848 = cljs.core.bitmap_indexed_node_index.call(null, this__9845.bitmap, bit__9847);
    var key_or_nil__9849 = this__9845.arr[2 * idx__9848];
    var val_or_node__9850 = this__9845.arr[2 * idx__9848 + 1];
    if(key_or_nil__9849 == null) {
      return val_or_node__9850.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9849)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__9849, val_or_node__9850], true)
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
  var this__9851 = this;
  var inode__9852 = this;
  var bit__9853 = 1 << (hash >>> shift & 31);
  if((this__9851.bitmap & bit__9853) === 0) {
    return inode__9852
  }else {
    var idx__9854 = cljs.core.bitmap_indexed_node_index.call(null, this__9851.bitmap, bit__9853);
    var key_or_nil__9855 = this__9851.arr[2 * idx__9854];
    var val_or_node__9856 = this__9851.arr[2 * idx__9854 + 1];
    if(key_or_nil__9855 == null) {
      var n__9857 = val_or_node__9856.inode_without(shift + 5, hash, key);
      if(n__9857 === val_or_node__9856) {
        return inode__9852
      }else {
        if(!(n__9857 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__9851.bitmap, cljs.core.clone_and_set.call(null, this__9851.arr, 2 * idx__9854 + 1, n__9857))
        }else {
          if(this__9851.bitmap === bit__9853) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__9851.bitmap ^ bit__9853, cljs.core.remove_pair.call(null, this__9851.arr, idx__9854))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9855)) {
        return new cljs.core.BitmapIndexedNode(null, this__9851.bitmap ^ bit__9853, cljs.core.remove_pair.call(null, this__9851.arr, idx__9854))
      }else {
        if("\ufdd0'else") {
          return inode__9852
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9858 = this;
  var inode__9859 = this;
  var bit__9860 = 1 << (hash >>> shift & 31);
  var idx__9861 = cljs.core.bitmap_indexed_node_index.call(null, this__9858.bitmap, bit__9860);
  if((this__9858.bitmap & bit__9860) === 0) {
    var n__9862 = cljs.core.bit_count.call(null, this__9858.bitmap);
    if(n__9862 >= 16) {
      var nodes__9863 = cljs.core.make_array.call(null, 32);
      var jdx__9864 = hash >>> shift & 31;
      nodes__9863[jdx__9864] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__9865 = 0;
      var j__9866 = 0;
      while(true) {
        if(i__9865 < 32) {
          if((this__9858.bitmap >>> i__9865 & 1) === 0) {
            var G__9881 = i__9865 + 1;
            var G__9882 = j__9866;
            i__9865 = G__9881;
            j__9866 = G__9882;
            continue
          }else {
            nodes__9863[i__9865] = !(this__9858.arr[j__9866] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__9858.arr[j__9866]), this__9858.arr[j__9866], this__9858.arr[j__9866 + 1], added_leaf_QMARK_) : this__9858.arr[j__9866 + 1];
            var G__9883 = i__9865 + 1;
            var G__9884 = j__9866 + 2;
            i__9865 = G__9883;
            j__9866 = G__9884;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__9862 + 1, nodes__9863)
    }else {
      var new_arr__9867 = cljs.core.make_array.call(null, 2 * (n__9862 + 1));
      cljs.core.array_copy.call(null, this__9858.arr, 0, new_arr__9867, 0, 2 * idx__9861);
      new_arr__9867[2 * idx__9861] = key;
      new_arr__9867[2 * idx__9861 + 1] = val;
      cljs.core.array_copy.call(null, this__9858.arr, 2 * idx__9861, new_arr__9867, 2 * (idx__9861 + 1), 2 * (n__9862 - idx__9861));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__9858.bitmap | bit__9860, new_arr__9867)
    }
  }else {
    var key_or_nil__9868 = this__9858.arr[2 * idx__9861];
    var val_or_node__9869 = this__9858.arr[2 * idx__9861 + 1];
    if(key_or_nil__9868 == null) {
      var n__9870 = val_or_node__9869.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9870 === val_or_node__9869) {
        return inode__9859
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__9858.bitmap, cljs.core.clone_and_set.call(null, this__9858.arr, 2 * idx__9861 + 1, n__9870))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9868)) {
        if(val === val_or_node__9869) {
          return inode__9859
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__9858.bitmap, cljs.core.clone_and_set.call(null, this__9858.arr, 2 * idx__9861 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__9858.bitmap, cljs.core.clone_and_set.call(null, this__9858.arr, 2 * idx__9861, null, 2 * idx__9861 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__9868, val_or_node__9869, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9871 = this;
  var inode__9872 = this;
  var bit__9873 = 1 << (hash >>> shift & 31);
  if((this__9871.bitmap & bit__9873) === 0) {
    return not_found
  }else {
    var idx__9874 = cljs.core.bitmap_indexed_node_index.call(null, this__9871.bitmap, bit__9873);
    var key_or_nil__9875 = this__9871.arr[2 * idx__9874];
    var val_or_node__9876 = this__9871.arr[2 * idx__9874 + 1];
    if(key_or_nil__9875 == null) {
      return val_or_node__9876.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9875)) {
        return val_or_node__9876
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
  var arr__9892 = array_node.arr;
  var len__9893 = 2 * (array_node.cnt - 1);
  var new_arr__9894 = cljs.core.make_array.call(null, len__9893);
  var i__9895 = 0;
  var j__9896 = 1;
  var bitmap__9897 = 0;
  while(true) {
    if(i__9895 < len__9893) {
      if(function() {
        var and__3822__auto____9898 = !(i__9895 === idx);
        if(and__3822__auto____9898) {
          return!(arr__9892[i__9895] == null)
        }else {
          return and__3822__auto____9898
        }
      }()) {
        new_arr__9894[j__9896] = arr__9892[i__9895];
        var G__9899 = i__9895 + 1;
        var G__9900 = j__9896 + 2;
        var G__9901 = bitmap__9897 | 1 << i__9895;
        i__9895 = G__9899;
        j__9896 = G__9900;
        bitmap__9897 = G__9901;
        continue
      }else {
        var G__9902 = i__9895 + 1;
        var G__9903 = j__9896;
        var G__9904 = bitmap__9897;
        i__9895 = G__9902;
        j__9896 = G__9903;
        bitmap__9897 = G__9904;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__9897, new_arr__9894)
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
  var this__9905 = this;
  var inode__9906 = this;
  var idx__9907 = hash >>> shift & 31;
  var node__9908 = this__9905.arr[idx__9907];
  if(node__9908 == null) {
    var editable__9909 = cljs.core.edit_and_set.call(null, inode__9906, edit, idx__9907, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__9909.cnt = editable__9909.cnt + 1;
    return editable__9909
  }else {
    var n__9910 = node__9908.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9910 === node__9908) {
      return inode__9906
    }else {
      return cljs.core.edit_and_set.call(null, inode__9906, edit, idx__9907, n__9910)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__9911 = this;
  var inode__9912 = this;
  return cljs.core.create_array_node_seq.call(null, this__9911.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9913 = this;
  var inode__9914 = this;
  var idx__9915 = hash >>> shift & 31;
  var node__9916 = this__9913.arr[idx__9915];
  if(node__9916 == null) {
    return inode__9914
  }else {
    var n__9917 = node__9916.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__9917 === node__9916) {
      return inode__9914
    }else {
      if(n__9917 == null) {
        if(this__9913.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9914, edit, idx__9915)
        }else {
          var editable__9918 = cljs.core.edit_and_set.call(null, inode__9914, edit, idx__9915, n__9917);
          editable__9918.cnt = editable__9918.cnt - 1;
          return editable__9918
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__9914, edit, idx__9915, n__9917)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__9919 = this;
  var inode__9920 = this;
  if(e === this__9919.edit) {
    return inode__9920
  }else {
    return new cljs.core.ArrayNode(e, this__9919.cnt, this__9919.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__9921 = this;
  var inode__9922 = this;
  var len__9923 = this__9921.arr.length;
  var i__9924 = 0;
  var init__9925 = init;
  while(true) {
    if(i__9924 < len__9923) {
      var node__9926 = this__9921.arr[i__9924];
      if(!(node__9926 == null)) {
        var init__9927 = node__9926.kv_reduce(f, init__9925);
        if(cljs.core.reduced_QMARK_.call(null, init__9927)) {
          return cljs.core.deref.call(null, init__9927)
        }else {
          var G__9946 = i__9924 + 1;
          var G__9947 = init__9927;
          i__9924 = G__9946;
          init__9925 = G__9947;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__9925
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9928 = this;
  var inode__9929 = this;
  var idx__9930 = hash >>> shift & 31;
  var node__9931 = this__9928.arr[idx__9930];
  if(!(node__9931 == null)) {
    return node__9931.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__9932 = this;
  var inode__9933 = this;
  var idx__9934 = hash >>> shift & 31;
  var node__9935 = this__9932.arr[idx__9934];
  if(!(node__9935 == null)) {
    var n__9936 = node__9935.inode_without(shift + 5, hash, key);
    if(n__9936 === node__9935) {
      return inode__9933
    }else {
      if(n__9936 == null) {
        if(this__9932.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9933, null, idx__9934)
        }else {
          return new cljs.core.ArrayNode(null, this__9932.cnt - 1, cljs.core.clone_and_set.call(null, this__9932.arr, idx__9934, n__9936))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__9932.cnt, cljs.core.clone_and_set.call(null, this__9932.arr, idx__9934, n__9936))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__9933
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9937 = this;
  var inode__9938 = this;
  var idx__9939 = hash >>> shift & 31;
  var node__9940 = this__9937.arr[idx__9939];
  if(node__9940 == null) {
    return new cljs.core.ArrayNode(null, this__9937.cnt + 1, cljs.core.clone_and_set.call(null, this__9937.arr, idx__9939, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__9941 = node__9940.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9941 === node__9940) {
      return inode__9938
    }else {
      return new cljs.core.ArrayNode(null, this__9937.cnt, cljs.core.clone_and_set.call(null, this__9937.arr, idx__9939, n__9941))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9942 = this;
  var inode__9943 = this;
  var idx__9944 = hash >>> shift & 31;
  var node__9945 = this__9942.arr[idx__9944];
  if(!(node__9945 == null)) {
    return node__9945.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__9950 = 2 * cnt;
  var i__9951 = 0;
  while(true) {
    if(i__9951 < lim__9950) {
      if(cljs.core.key_test.call(null, key, arr[i__9951])) {
        return i__9951
      }else {
        var G__9952 = i__9951 + 2;
        i__9951 = G__9952;
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
  var this__9953 = this;
  var inode__9954 = this;
  if(hash === this__9953.collision_hash) {
    var idx__9955 = cljs.core.hash_collision_node_find_index.call(null, this__9953.arr, this__9953.cnt, key);
    if(idx__9955 === -1) {
      if(this__9953.arr.length > 2 * this__9953.cnt) {
        var editable__9956 = cljs.core.edit_and_set.call(null, inode__9954, edit, 2 * this__9953.cnt, key, 2 * this__9953.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__9956.cnt = editable__9956.cnt + 1;
        return editable__9956
      }else {
        var len__9957 = this__9953.arr.length;
        var new_arr__9958 = cljs.core.make_array.call(null, len__9957 + 2);
        cljs.core.array_copy.call(null, this__9953.arr, 0, new_arr__9958, 0, len__9957);
        new_arr__9958[len__9957] = key;
        new_arr__9958[len__9957 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__9954.ensure_editable_array(edit, this__9953.cnt + 1, new_arr__9958)
      }
    }else {
      if(this__9953.arr[idx__9955 + 1] === val) {
        return inode__9954
      }else {
        return cljs.core.edit_and_set.call(null, inode__9954, edit, idx__9955 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__9953.collision_hash >>> shift & 31), [null, inode__9954, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__9959 = this;
  var inode__9960 = this;
  return cljs.core.create_inode_seq.call(null, this__9959.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9961 = this;
  var inode__9962 = this;
  var idx__9963 = cljs.core.hash_collision_node_find_index.call(null, this__9961.arr, this__9961.cnt, key);
  if(idx__9963 === -1) {
    return inode__9962
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__9961.cnt === 1) {
      return null
    }else {
      var editable__9964 = inode__9962.ensure_editable(edit);
      var earr__9965 = editable__9964.arr;
      earr__9965[idx__9963] = earr__9965[2 * this__9961.cnt - 2];
      earr__9965[idx__9963 + 1] = earr__9965[2 * this__9961.cnt - 1];
      earr__9965[2 * this__9961.cnt - 1] = null;
      earr__9965[2 * this__9961.cnt - 2] = null;
      editable__9964.cnt = editable__9964.cnt - 1;
      return editable__9964
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__9966 = this;
  var inode__9967 = this;
  if(e === this__9966.edit) {
    return inode__9967
  }else {
    var new_arr__9968 = cljs.core.make_array.call(null, 2 * (this__9966.cnt + 1));
    cljs.core.array_copy.call(null, this__9966.arr, 0, new_arr__9968, 0, 2 * this__9966.cnt);
    return new cljs.core.HashCollisionNode(e, this__9966.collision_hash, this__9966.cnt, new_arr__9968)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__9969 = this;
  var inode__9970 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9969.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9971 = this;
  var inode__9972 = this;
  var idx__9973 = cljs.core.hash_collision_node_find_index.call(null, this__9971.arr, this__9971.cnt, key);
  if(idx__9973 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9971.arr[idx__9973])) {
      return cljs.core.PersistentVector.fromArray([this__9971.arr[idx__9973], this__9971.arr[idx__9973 + 1]], true)
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
  var this__9974 = this;
  var inode__9975 = this;
  var idx__9976 = cljs.core.hash_collision_node_find_index.call(null, this__9974.arr, this__9974.cnt, key);
  if(idx__9976 === -1) {
    return inode__9975
  }else {
    if(this__9974.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__9974.collision_hash, this__9974.cnt - 1, cljs.core.remove_pair.call(null, this__9974.arr, cljs.core.quot.call(null, idx__9976, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9977 = this;
  var inode__9978 = this;
  if(hash === this__9977.collision_hash) {
    var idx__9979 = cljs.core.hash_collision_node_find_index.call(null, this__9977.arr, this__9977.cnt, key);
    if(idx__9979 === -1) {
      var len__9980 = this__9977.arr.length;
      var new_arr__9981 = cljs.core.make_array.call(null, len__9980 + 2);
      cljs.core.array_copy.call(null, this__9977.arr, 0, new_arr__9981, 0, len__9980);
      new_arr__9981[len__9980] = key;
      new_arr__9981[len__9980 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__9977.collision_hash, this__9977.cnt + 1, new_arr__9981)
    }else {
      if(cljs.core._EQ_.call(null, this__9977.arr[idx__9979], val)) {
        return inode__9978
      }else {
        return new cljs.core.HashCollisionNode(null, this__9977.collision_hash, this__9977.cnt, cljs.core.clone_and_set.call(null, this__9977.arr, idx__9979 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__9977.collision_hash >>> shift & 31), [null, inode__9978])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9982 = this;
  var inode__9983 = this;
  var idx__9984 = cljs.core.hash_collision_node_find_index.call(null, this__9982.arr, this__9982.cnt, key);
  if(idx__9984 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9982.arr[idx__9984])) {
      return this__9982.arr[idx__9984 + 1]
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
  var this__9985 = this;
  var inode__9986 = this;
  if(e === this__9985.edit) {
    this__9985.arr = array;
    this__9985.cnt = count;
    return inode__9986
  }else {
    return new cljs.core.HashCollisionNode(this__9985.edit, this__9985.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9991 = cljs.core.hash.call(null, key1);
    if(key1hash__9991 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9991, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9992 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__9991, key1, val1, added_leaf_QMARK___9992).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___9992)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9993 = cljs.core.hash.call(null, key1);
    if(key1hash__9993 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9993, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9994 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__9993, key1, val1, added_leaf_QMARK___9994).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___9994)
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
  var this__9995 = this;
  var h__2192__auto____9996 = this__9995.__hash;
  if(!(h__2192__auto____9996 == null)) {
    return h__2192__auto____9996
  }else {
    var h__2192__auto____9997 = cljs.core.hash_coll.call(null, coll);
    this__9995.__hash = h__2192__auto____9997;
    return h__2192__auto____9997
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9998 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__9999 = this;
  var this__10000 = this;
  return cljs.core.pr_str.call(null, this__10000)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10001 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10002 = this;
  if(this__10002.s == null) {
    return cljs.core.PersistentVector.fromArray([this__10002.nodes[this__10002.i], this__10002.nodes[this__10002.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__10002.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10003 = this;
  if(this__10003.s == null) {
    return cljs.core.create_inode_seq.call(null, this__10003.nodes, this__10003.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__10003.nodes, this__10003.i, cljs.core.next.call(null, this__10003.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10004 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10005 = this;
  return new cljs.core.NodeSeq(meta, this__10005.nodes, this__10005.i, this__10005.s, this__10005.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10006 = this;
  return this__10006.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10007 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10007.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__10014 = nodes.length;
      var j__10015 = i;
      while(true) {
        if(j__10015 < len__10014) {
          if(!(nodes[j__10015] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__10015, null, null)
          }else {
            var temp__3971__auto____10016 = nodes[j__10015 + 1];
            if(cljs.core.truth_(temp__3971__auto____10016)) {
              var node__10017 = temp__3971__auto____10016;
              var temp__3971__auto____10018 = node__10017.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____10018)) {
                var node_seq__10019 = temp__3971__auto____10018;
                return new cljs.core.NodeSeq(null, nodes, j__10015 + 2, node_seq__10019, null)
              }else {
                var G__10020 = j__10015 + 2;
                j__10015 = G__10020;
                continue
              }
            }else {
              var G__10021 = j__10015 + 2;
              j__10015 = G__10021;
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
  var this__10022 = this;
  var h__2192__auto____10023 = this__10022.__hash;
  if(!(h__2192__auto____10023 == null)) {
    return h__2192__auto____10023
  }else {
    var h__2192__auto____10024 = cljs.core.hash_coll.call(null, coll);
    this__10022.__hash = h__2192__auto____10024;
    return h__2192__auto____10024
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10025 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__10026 = this;
  var this__10027 = this;
  return cljs.core.pr_str.call(null, this__10027)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10028 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10029 = this;
  return cljs.core.first.call(null, this__10029.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10030 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__10030.nodes, this__10030.i, cljs.core.next.call(null, this__10030.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10031 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10032 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__10032.nodes, this__10032.i, this__10032.s, this__10032.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10033 = this;
  return this__10033.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10034 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10034.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__10041 = nodes.length;
      var j__10042 = i;
      while(true) {
        if(j__10042 < len__10041) {
          var temp__3971__auto____10043 = nodes[j__10042];
          if(cljs.core.truth_(temp__3971__auto____10043)) {
            var nj__10044 = temp__3971__auto____10043;
            var temp__3971__auto____10045 = nj__10044.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____10045)) {
              var ns__10046 = temp__3971__auto____10045;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__10042 + 1, ns__10046, null)
            }else {
              var G__10047 = j__10042 + 1;
              j__10042 = G__10047;
              continue
            }
          }else {
            var G__10048 = j__10042 + 1;
            j__10042 = G__10048;
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
  var this__10051 = this;
  return new cljs.core.TransientHashMap({}, this__10051.root, this__10051.cnt, this__10051.has_nil_QMARK_, this__10051.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10052 = this;
  var h__2192__auto____10053 = this__10052.__hash;
  if(!(h__2192__auto____10053 == null)) {
    return h__2192__auto____10053
  }else {
    var h__2192__auto____10054 = cljs.core.hash_imap.call(null, coll);
    this__10052.__hash = h__2192__auto____10054;
    return h__2192__auto____10054
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10055 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10056 = this;
  if(k == null) {
    if(this__10056.has_nil_QMARK_) {
      return this__10056.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__10056.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__10056.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10057 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____10058 = this__10057.has_nil_QMARK_;
      if(and__3822__auto____10058) {
        return v === this__10057.nil_val
      }else {
        return and__3822__auto____10058
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__10057.meta, this__10057.has_nil_QMARK_ ? this__10057.cnt : this__10057.cnt + 1, this__10057.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___10059 = new cljs.core.Box(false);
    var new_root__10060 = (this__10057.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__10057.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___10059);
    if(new_root__10060 === this__10057.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__10057.meta, added_leaf_QMARK___10059.val ? this__10057.cnt + 1 : this__10057.cnt, new_root__10060, this__10057.has_nil_QMARK_, this__10057.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10061 = this;
  if(k == null) {
    return this__10061.has_nil_QMARK_
  }else {
    if(this__10061.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__10061.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__10084 = null;
  var G__10084__2 = function(this_sym10062, k) {
    var this__10064 = this;
    var this_sym10062__10065 = this;
    var coll__10066 = this_sym10062__10065;
    return coll__10066.cljs$core$ILookup$_lookup$arity$2(coll__10066, k)
  };
  var G__10084__3 = function(this_sym10063, k, not_found) {
    var this__10064 = this;
    var this_sym10063__10067 = this;
    var coll__10068 = this_sym10063__10067;
    return coll__10068.cljs$core$ILookup$_lookup$arity$3(coll__10068, k, not_found)
  };
  G__10084 = function(this_sym10063, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10084__2.call(this, this_sym10063, k);
      case 3:
        return G__10084__3.call(this, this_sym10063, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10084
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym10049, args10050) {
  var this__10069 = this;
  return this_sym10049.call.apply(this_sym10049, [this_sym10049].concat(args10050.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10070 = this;
  var init__10071 = this__10070.has_nil_QMARK_ ? f.call(null, init, null, this__10070.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__10071)) {
    return cljs.core.deref.call(null, init__10071)
  }else {
    if(!(this__10070.root == null)) {
      return this__10070.root.kv_reduce(f, init__10071)
    }else {
      if("\ufdd0'else") {
        return init__10071
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10072 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__10073 = this;
  var this__10074 = this;
  return cljs.core.pr_str.call(null, this__10074)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10075 = this;
  if(this__10075.cnt > 0) {
    var s__10076 = !(this__10075.root == null) ? this__10075.root.inode_seq() : null;
    if(this__10075.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__10075.nil_val], true), s__10076)
    }else {
      return s__10076
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10077 = this;
  return this__10077.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10078 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10079 = this;
  return new cljs.core.PersistentHashMap(meta, this__10079.cnt, this__10079.root, this__10079.has_nil_QMARK_, this__10079.nil_val, this__10079.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10080 = this;
  return this__10080.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10081 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__10081.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10082 = this;
  if(k == null) {
    if(this__10082.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__10082.meta, this__10082.cnt - 1, this__10082.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__10082.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__10083 = this__10082.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__10083 === this__10082.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__10082.meta, this__10082.cnt - 1, new_root__10083, this__10082.has_nil_QMARK_, this__10082.nil_val, null)
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
  var len__10085 = ks.length;
  var i__10086 = 0;
  var out__10087 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__10086 < len__10085) {
      var G__10088 = i__10086 + 1;
      var G__10089 = cljs.core.assoc_BANG_.call(null, out__10087, ks[i__10086], vs[i__10086]);
      i__10086 = G__10088;
      out__10087 = G__10089;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10087)
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
  var this__10090 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__10091 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__10092 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10093 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__10094 = this;
  if(k == null) {
    if(this__10094.has_nil_QMARK_) {
      return this__10094.nil_val
    }else {
      return null
    }
  }else {
    if(this__10094.root == null) {
      return null
    }else {
      return this__10094.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__10095 = this;
  if(k == null) {
    if(this__10095.has_nil_QMARK_) {
      return this__10095.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__10095.root == null) {
      return not_found
    }else {
      return this__10095.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10096 = this;
  if(this__10096.edit) {
    return this__10096.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__10097 = this;
  var tcoll__10098 = this;
  if(this__10097.edit) {
    if(function() {
      var G__10099__10100 = o;
      if(G__10099__10100) {
        if(function() {
          var or__3824__auto____10101 = G__10099__10100.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____10101) {
            return or__3824__auto____10101
          }else {
            return G__10099__10100.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__10099__10100.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10099__10100)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10099__10100)
      }
    }()) {
      return tcoll__10098.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__10102 = cljs.core.seq.call(null, o);
      var tcoll__10103 = tcoll__10098;
      while(true) {
        var temp__3971__auto____10104 = cljs.core.first.call(null, es__10102);
        if(cljs.core.truth_(temp__3971__auto____10104)) {
          var e__10105 = temp__3971__auto____10104;
          var G__10116 = cljs.core.next.call(null, es__10102);
          var G__10117 = tcoll__10103.assoc_BANG_(cljs.core.key.call(null, e__10105), cljs.core.val.call(null, e__10105));
          es__10102 = G__10116;
          tcoll__10103 = G__10117;
          continue
        }else {
          return tcoll__10103
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__10106 = this;
  var tcoll__10107 = this;
  if(this__10106.edit) {
    if(k == null) {
      if(this__10106.nil_val === v) {
      }else {
        this__10106.nil_val = v
      }
      if(this__10106.has_nil_QMARK_) {
      }else {
        this__10106.count = this__10106.count + 1;
        this__10106.has_nil_QMARK_ = true
      }
      return tcoll__10107
    }else {
      var added_leaf_QMARK___10108 = new cljs.core.Box(false);
      var node__10109 = (this__10106.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__10106.root).inode_assoc_BANG_(this__10106.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___10108);
      if(node__10109 === this__10106.root) {
      }else {
        this__10106.root = node__10109
      }
      if(added_leaf_QMARK___10108.val) {
        this__10106.count = this__10106.count + 1
      }else {
      }
      return tcoll__10107
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__10110 = this;
  var tcoll__10111 = this;
  if(this__10110.edit) {
    if(k == null) {
      if(this__10110.has_nil_QMARK_) {
        this__10110.has_nil_QMARK_ = false;
        this__10110.nil_val = null;
        this__10110.count = this__10110.count - 1;
        return tcoll__10111
      }else {
        return tcoll__10111
      }
    }else {
      if(this__10110.root == null) {
        return tcoll__10111
      }else {
        var removed_leaf_QMARK___10112 = new cljs.core.Box(false);
        var node__10113 = this__10110.root.inode_without_BANG_(this__10110.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___10112);
        if(node__10113 === this__10110.root) {
        }else {
          this__10110.root = node__10113
        }
        if(cljs.core.truth_(removed_leaf_QMARK___10112[0])) {
          this__10110.count = this__10110.count - 1
        }else {
        }
        return tcoll__10111
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__10114 = this;
  var tcoll__10115 = this;
  if(this__10114.edit) {
    this__10114.edit = null;
    return new cljs.core.PersistentHashMap(null, this__10114.count, this__10114.root, this__10114.has_nil_QMARK_, this__10114.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__10120 = node;
  var stack__10121 = stack;
  while(true) {
    if(!(t__10120 == null)) {
      var G__10122 = ascending_QMARK_ ? t__10120.left : t__10120.right;
      var G__10123 = cljs.core.conj.call(null, stack__10121, t__10120);
      t__10120 = G__10122;
      stack__10121 = G__10123;
      continue
    }else {
      return stack__10121
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
  var this__10124 = this;
  var h__2192__auto____10125 = this__10124.__hash;
  if(!(h__2192__auto____10125 == null)) {
    return h__2192__auto____10125
  }else {
    var h__2192__auto____10126 = cljs.core.hash_coll.call(null, coll);
    this__10124.__hash = h__2192__auto____10126;
    return h__2192__auto____10126
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10127 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__10128 = this;
  var this__10129 = this;
  return cljs.core.pr_str.call(null, this__10129)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10130 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10131 = this;
  if(this__10131.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__10131.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__10132 = this;
  return cljs.core.peek.call(null, this__10132.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__10133 = this;
  var t__10134 = cljs.core.first.call(null, this__10133.stack);
  var next_stack__10135 = cljs.core.tree_map_seq_push.call(null, this__10133.ascending_QMARK_ ? t__10134.right : t__10134.left, cljs.core.next.call(null, this__10133.stack), this__10133.ascending_QMARK_);
  if(!(next_stack__10135 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__10135, this__10133.ascending_QMARK_, this__10133.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10136 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10137 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__10137.stack, this__10137.ascending_QMARK_, this__10137.cnt, this__10137.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10138 = this;
  return this__10138.meta
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
        var and__3822__auto____10140 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____10140) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____10140
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
        var and__3822__auto____10142 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____10142) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____10142
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
  var init__10146 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__10146)) {
    return cljs.core.deref.call(null, init__10146)
  }else {
    var init__10147 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__10146) : init__10146;
    if(cljs.core.reduced_QMARK_.call(null, init__10147)) {
      return cljs.core.deref.call(null, init__10147)
    }else {
      var init__10148 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__10147) : init__10147;
      if(cljs.core.reduced_QMARK_.call(null, init__10148)) {
        return cljs.core.deref.call(null, init__10148)
      }else {
        return init__10148
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
  var this__10151 = this;
  var h__2192__auto____10152 = this__10151.__hash;
  if(!(h__2192__auto____10152 == null)) {
    return h__2192__auto____10152
  }else {
    var h__2192__auto____10153 = cljs.core.hash_coll.call(null, coll);
    this__10151.__hash = h__2192__auto____10153;
    return h__2192__auto____10153
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__10154 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__10155 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__10156 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__10156.key, this__10156.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__10204 = null;
  var G__10204__2 = function(this_sym10157, k) {
    var this__10159 = this;
    var this_sym10157__10160 = this;
    var node__10161 = this_sym10157__10160;
    return node__10161.cljs$core$ILookup$_lookup$arity$2(node__10161, k)
  };
  var G__10204__3 = function(this_sym10158, k, not_found) {
    var this__10159 = this;
    var this_sym10158__10162 = this;
    var node__10163 = this_sym10158__10162;
    return node__10163.cljs$core$ILookup$_lookup$arity$3(node__10163, k, not_found)
  };
  G__10204 = function(this_sym10158, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10204__2.call(this, this_sym10158, k);
      case 3:
        return G__10204__3.call(this, this_sym10158, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10204
}();
cljs.core.BlackNode.prototype.apply = function(this_sym10149, args10150) {
  var this__10164 = this;
  return this_sym10149.call.apply(this_sym10149, [this_sym10149].concat(args10150.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__10165 = this;
  return cljs.core.PersistentVector.fromArray([this__10165.key, this__10165.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10166 = this;
  return this__10166.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10167 = this;
  return this__10167.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__10168 = this;
  var node__10169 = this;
  return ins.balance_right(node__10169)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__10170 = this;
  var node__10171 = this;
  return new cljs.core.RedNode(this__10170.key, this__10170.val, this__10170.left, this__10170.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__10172 = this;
  var node__10173 = this;
  return cljs.core.balance_right_del.call(null, this__10172.key, this__10172.val, this__10172.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__10174 = this;
  var node__10175 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__10176 = this;
  var node__10177 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10177, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__10178 = this;
  var node__10179 = this;
  return cljs.core.balance_left_del.call(null, this__10178.key, this__10178.val, del, this__10178.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__10180 = this;
  var node__10181 = this;
  return ins.balance_left(node__10181)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__10182 = this;
  var node__10183 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__10183, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__10205 = null;
  var G__10205__0 = function() {
    var this__10184 = this;
    var this__10186 = this;
    return cljs.core.pr_str.call(null, this__10186)
  };
  G__10205 = function() {
    switch(arguments.length) {
      case 0:
        return G__10205__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10205
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__10187 = this;
  var node__10188 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10188, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__10189 = this;
  var node__10190 = this;
  return node__10190
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10191 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10192 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10193 = this;
  return cljs.core.list.call(null, this__10193.key, this__10193.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10194 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10195 = this;
  return this__10195.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10196 = this;
  return cljs.core.PersistentVector.fromArray([this__10196.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10197 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10197.key, this__10197.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10198 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10199 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10199.key, this__10199.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10200 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10201 = this;
  if(n === 0) {
    return this__10201.key
  }else {
    if(n === 1) {
      return this__10201.val
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
  var this__10202 = this;
  if(n === 0) {
    return this__10202.key
  }else {
    if(n === 1) {
      return this__10202.val
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
  var this__10203 = this;
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
  var this__10208 = this;
  var h__2192__auto____10209 = this__10208.__hash;
  if(!(h__2192__auto____10209 == null)) {
    return h__2192__auto____10209
  }else {
    var h__2192__auto____10210 = cljs.core.hash_coll.call(null, coll);
    this__10208.__hash = h__2192__auto____10210;
    return h__2192__auto____10210
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__10211 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__10212 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__10213 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__10213.key, this__10213.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__10261 = null;
  var G__10261__2 = function(this_sym10214, k) {
    var this__10216 = this;
    var this_sym10214__10217 = this;
    var node__10218 = this_sym10214__10217;
    return node__10218.cljs$core$ILookup$_lookup$arity$2(node__10218, k)
  };
  var G__10261__3 = function(this_sym10215, k, not_found) {
    var this__10216 = this;
    var this_sym10215__10219 = this;
    var node__10220 = this_sym10215__10219;
    return node__10220.cljs$core$ILookup$_lookup$arity$3(node__10220, k, not_found)
  };
  G__10261 = function(this_sym10215, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10261__2.call(this, this_sym10215, k);
      case 3:
        return G__10261__3.call(this, this_sym10215, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10261
}();
cljs.core.RedNode.prototype.apply = function(this_sym10206, args10207) {
  var this__10221 = this;
  return this_sym10206.call.apply(this_sym10206, [this_sym10206].concat(args10207.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__10222 = this;
  return cljs.core.PersistentVector.fromArray([this__10222.key, this__10222.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10223 = this;
  return this__10223.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10224 = this;
  return this__10224.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__10225 = this;
  var node__10226 = this;
  return new cljs.core.RedNode(this__10225.key, this__10225.val, this__10225.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__10227 = this;
  var node__10228 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__10229 = this;
  var node__10230 = this;
  return new cljs.core.RedNode(this__10229.key, this__10229.val, this__10229.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__10231 = this;
  var node__10232 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__10233 = this;
  var node__10234 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10234, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__10235 = this;
  var node__10236 = this;
  return new cljs.core.RedNode(this__10235.key, this__10235.val, del, this__10235.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__10237 = this;
  var node__10238 = this;
  return new cljs.core.RedNode(this__10237.key, this__10237.val, ins, this__10237.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__10239 = this;
  var node__10240 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10239.left)) {
    return new cljs.core.RedNode(this__10239.key, this__10239.val, this__10239.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__10239.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10239.right)) {
      return new cljs.core.RedNode(this__10239.right.key, this__10239.right.val, new cljs.core.BlackNode(this__10239.key, this__10239.val, this__10239.left, this__10239.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__10239.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__10240, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__10262 = null;
  var G__10262__0 = function() {
    var this__10241 = this;
    var this__10243 = this;
    return cljs.core.pr_str.call(null, this__10243)
  };
  G__10262 = function() {
    switch(arguments.length) {
      case 0:
        return G__10262__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10262
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__10244 = this;
  var node__10245 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10244.right)) {
    return new cljs.core.RedNode(this__10244.key, this__10244.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10244.left, null), this__10244.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10244.left)) {
      return new cljs.core.RedNode(this__10244.left.key, this__10244.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10244.left.left, null), new cljs.core.BlackNode(this__10244.key, this__10244.val, this__10244.left.right, this__10244.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10245, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__10246 = this;
  var node__10247 = this;
  return new cljs.core.BlackNode(this__10246.key, this__10246.val, this__10246.left, this__10246.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10248 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10249 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10250 = this;
  return cljs.core.list.call(null, this__10250.key, this__10250.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10251 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10252 = this;
  return this__10252.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10253 = this;
  return cljs.core.PersistentVector.fromArray([this__10253.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10254 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10254.key, this__10254.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10255 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10256 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10256.key, this__10256.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10257 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10258 = this;
  if(n === 0) {
    return this__10258.key
  }else {
    if(n === 1) {
      return this__10258.val
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
  var this__10259 = this;
  if(n === 0) {
    return this__10259.key
  }else {
    if(n === 1) {
      return this__10259.val
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
  var this__10260 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__10266 = comp.call(null, k, tree.key);
    if(c__10266 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__10266 < 0) {
        var ins__10267 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__10267 == null)) {
          return tree.add_left(ins__10267)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__10268 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__10268 == null)) {
            return tree.add_right(ins__10268)
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
          var app__10271 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10271)) {
            return new cljs.core.RedNode(app__10271.key, app__10271.val, new cljs.core.RedNode(left.key, left.val, left.left, app__10271.left, null), new cljs.core.RedNode(right.key, right.val, app__10271.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__10271, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__10272 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10272)) {
              return new cljs.core.RedNode(app__10272.key, app__10272.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__10272.left, null), new cljs.core.BlackNode(right.key, right.val, app__10272.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__10272, right.right, null))
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
    var c__10278 = comp.call(null, k, tree.key);
    if(c__10278 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__10278 < 0) {
        var del__10279 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____10280 = !(del__10279 == null);
          if(or__3824__auto____10280) {
            return or__3824__auto____10280
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__10279, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__10279, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__10281 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____10282 = !(del__10281 == null);
            if(or__3824__auto____10282) {
              return or__3824__auto____10282
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__10281)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__10281, null)
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
  var tk__10285 = tree.key;
  var c__10286 = comp.call(null, k, tk__10285);
  if(c__10286 === 0) {
    return tree.replace(tk__10285, v, tree.left, tree.right)
  }else {
    if(c__10286 < 0) {
      return tree.replace(tk__10285, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__10285, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__10289 = this;
  var h__2192__auto____10290 = this__10289.__hash;
  if(!(h__2192__auto____10290 == null)) {
    return h__2192__auto____10290
  }else {
    var h__2192__auto____10291 = cljs.core.hash_imap.call(null, coll);
    this__10289.__hash = h__2192__auto____10291;
    return h__2192__auto____10291
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10292 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10293 = this;
  var n__10294 = coll.entry_at(k);
  if(!(n__10294 == null)) {
    return n__10294.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10295 = this;
  var found__10296 = [null];
  var t__10297 = cljs.core.tree_map_add.call(null, this__10295.comp, this__10295.tree, k, v, found__10296);
  if(t__10297 == null) {
    var found_node__10298 = cljs.core.nth.call(null, found__10296, 0);
    if(cljs.core._EQ_.call(null, v, found_node__10298.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10295.comp, cljs.core.tree_map_replace.call(null, this__10295.comp, this__10295.tree, k, v), this__10295.cnt, this__10295.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10295.comp, t__10297.blacken(), this__10295.cnt + 1, this__10295.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10299 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__10333 = null;
  var G__10333__2 = function(this_sym10300, k) {
    var this__10302 = this;
    var this_sym10300__10303 = this;
    var coll__10304 = this_sym10300__10303;
    return coll__10304.cljs$core$ILookup$_lookup$arity$2(coll__10304, k)
  };
  var G__10333__3 = function(this_sym10301, k, not_found) {
    var this__10302 = this;
    var this_sym10301__10305 = this;
    var coll__10306 = this_sym10301__10305;
    return coll__10306.cljs$core$ILookup$_lookup$arity$3(coll__10306, k, not_found)
  };
  G__10333 = function(this_sym10301, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10333__2.call(this, this_sym10301, k);
      case 3:
        return G__10333__3.call(this, this_sym10301, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10333
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym10287, args10288) {
  var this__10307 = this;
  return this_sym10287.call.apply(this_sym10287, [this_sym10287].concat(args10288.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10308 = this;
  if(!(this__10308.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__10308.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10309 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10310 = this;
  if(this__10310.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10310.tree, false, this__10310.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__10311 = this;
  var this__10312 = this;
  return cljs.core.pr_str.call(null, this__10312)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__10313 = this;
  var coll__10314 = this;
  var t__10315 = this__10313.tree;
  while(true) {
    if(!(t__10315 == null)) {
      var c__10316 = this__10313.comp.call(null, k, t__10315.key);
      if(c__10316 === 0) {
        return t__10315
      }else {
        if(c__10316 < 0) {
          var G__10334 = t__10315.left;
          t__10315 = G__10334;
          continue
        }else {
          if("\ufdd0'else") {
            var G__10335 = t__10315.right;
            t__10315 = G__10335;
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
  var this__10317 = this;
  if(this__10317.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10317.tree, ascending_QMARK_, this__10317.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__10318 = this;
  if(this__10318.cnt > 0) {
    var stack__10319 = null;
    var t__10320 = this__10318.tree;
    while(true) {
      if(!(t__10320 == null)) {
        var c__10321 = this__10318.comp.call(null, k, t__10320.key);
        if(c__10321 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__10319, t__10320), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__10321 < 0) {
              var G__10336 = cljs.core.conj.call(null, stack__10319, t__10320);
              var G__10337 = t__10320.left;
              stack__10319 = G__10336;
              t__10320 = G__10337;
              continue
            }else {
              var G__10338 = stack__10319;
              var G__10339 = t__10320.right;
              stack__10319 = G__10338;
              t__10320 = G__10339;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__10321 > 0) {
                var G__10340 = cljs.core.conj.call(null, stack__10319, t__10320);
                var G__10341 = t__10320.right;
                stack__10319 = G__10340;
                t__10320 = G__10341;
                continue
              }else {
                var G__10342 = stack__10319;
                var G__10343 = t__10320.left;
                stack__10319 = G__10342;
                t__10320 = G__10343;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__10319 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__10319, ascending_QMARK_, -1, null)
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
  var this__10322 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__10323 = this;
  return this__10323.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10324 = this;
  if(this__10324.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10324.tree, true, this__10324.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10325 = this;
  return this__10325.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10326 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10327 = this;
  return new cljs.core.PersistentTreeMap(this__10327.comp, this__10327.tree, this__10327.cnt, meta, this__10327.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10328 = this;
  return this__10328.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10329 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__10329.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10330 = this;
  var found__10331 = [null];
  var t__10332 = cljs.core.tree_map_remove.call(null, this__10330.comp, this__10330.tree, k, found__10331);
  if(t__10332 == null) {
    if(cljs.core.nth.call(null, found__10331, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10330.comp, null, 0, this__10330.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10330.comp, t__10332.blacken(), this__10330.cnt - 1, this__10330.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__10346 = cljs.core.seq.call(null, keyvals);
    var out__10347 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__10346) {
        var G__10348 = cljs.core.nnext.call(null, in__10346);
        var G__10349 = cljs.core.assoc_BANG_.call(null, out__10347, cljs.core.first.call(null, in__10346), cljs.core.second.call(null, in__10346));
        in__10346 = G__10348;
        out__10347 = G__10349;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__10347)
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
  hash_map.cljs$lang$applyTo = function(arglist__10350) {
    var keyvals = cljs.core.seq(arglist__10350);
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
  array_map.cljs$lang$applyTo = function(arglist__10351) {
    var keyvals = cljs.core.seq(arglist__10351);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__10355 = [];
    var obj__10356 = {};
    var kvs__10357 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__10357) {
        ks__10355.push(cljs.core.first.call(null, kvs__10357));
        obj__10356[cljs.core.first.call(null, kvs__10357)] = cljs.core.second.call(null, kvs__10357);
        var G__10358 = cljs.core.nnext.call(null, kvs__10357);
        kvs__10357 = G__10358;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__10355, obj__10356)
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
  obj_map.cljs$lang$applyTo = function(arglist__10359) {
    var keyvals = cljs.core.seq(arglist__10359);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__10362 = cljs.core.seq.call(null, keyvals);
    var out__10363 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__10362) {
        var G__10364 = cljs.core.nnext.call(null, in__10362);
        var G__10365 = cljs.core.assoc.call(null, out__10363, cljs.core.first.call(null, in__10362), cljs.core.second.call(null, in__10362));
        in__10362 = G__10364;
        out__10363 = G__10365;
        continue
      }else {
        return out__10363
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
  sorted_map.cljs$lang$applyTo = function(arglist__10366) {
    var keyvals = cljs.core.seq(arglist__10366);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__10369 = cljs.core.seq.call(null, keyvals);
    var out__10370 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__10369) {
        var G__10371 = cljs.core.nnext.call(null, in__10369);
        var G__10372 = cljs.core.assoc.call(null, out__10370, cljs.core.first.call(null, in__10369), cljs.core.second.call(null, in__10369));
        in__10369 = G__10371;
        out__10370 = G__10372;
        continue
      }else {
        return out__10370
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__10373) {
    var comparator = cljs.core.first(arglist__10373);
    var keyvals = cljs.core.rest(arglist__10373);
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
      return cljs.core.reduce.call(null, function(p1__10374_SHARP_, p2__10375_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____10377 = p1__10374_SHARP_;
          if(cljs.core.truth_(or__3824__auto____10377)) {
            return or__3824__auto____10377
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__10375_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__10378) {
    var maps = cljs.core.seq(arglist__10378);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__10386 = function(m, e) {
        var k__10384 = cljs.core.first.call(null, e);
        var v__10385 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__10384)) {
          return cljs.core.assoc.call(null, m, k__10384, f.call(null, cljs.core._lookup.call(null, m, k__10384, null), v__10385))
        }else {
          return cljs.core.assoc.call(null, m, k__10384, v__10385)
        }
      };
      var merge2__10388 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__10386, function() {
          var or__3824__auto____10387 = m1;
          if(cljs.core.truth_(or__3824__auto____10387)) {
            return or__3824__auto____10387
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__10388, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__10389) {
    var f = cljs.core.first(arglist__10389);
    var maps = cljs.core.rest(arglist__10389);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__10394 = cljs.core.ObjMap.EMPTY;
  var keys__10395 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__10395) {
      var key__10396 = cljs.core.first.call(null, keys__10395);
      var entry__10397 = cljs.core._lookup.call(null, map, key__10396, "\ufdd0'cljs.core/not-found");
      var G__10398 = cljs.core.not_EQ_.call(null, entry__10397, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__10394, key__10396, entry__10397) : ret__10394;
      var G__10399 = cljs.core.next.call(null, keys__10395);
      ret__10394 = G__10398;
      keys__10395 = G__10399;
      continue
    }else {
      return ret__10394
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
  var this__10403 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__10403.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10404 = this;
  var h__2192__auto____10405 = this__10404.__hash;
  if(!(h__2192__auto____10405 == null)) {
    return h__2192__auto____10405
  }else {
    var h__2192__auto____10406 = cljs.core.hash_iset.call(null, coll);
    this__10404.__hash = h__2192__auto____10406;
    return h__2192__auto____10406
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__10407 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__10408 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__10408.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__10429 = null;
  var G__10429__2 = function(this_sym10409, k) {
    var this__10411 = this;
    var this_sym10409__10412 = this;
    var coll__10413 = this_sym10409__10412;
    return coll__10413.cljs$core$ILookup$_lookup$arity$2(coll__10413, k)
  };
  var G__10429__3 = function(this_sym10410, k, not_found) {
    var this__10411 = this;
    var this_sym10410__10414 = this;
    var coll__10415 = this_sym10410__10414;
    return coll__10415.cljs$core$ILookup$_lookup$arity$3(coll__10415, k, not_found)
  };
  G__10429 = function(this_sym10410, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10429__2.call(this, this_sym10410, k);
      case 3:
        return G__10429__3.call(this, this_sym10410, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10429
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym10401, args10402) {
  var this__10416 = this;
  return this_sym10401.call.apply(this_sym10401, [this_sym10401].concat(args10402.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10417 = this;
  return new cljs.core.PersistentHashSet(this__10417.meta, cljs.core.assoc.call(null, this__10417.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__10418 = this;
  var this__10419 = this;
  return cljs.core.pr_str.call(null, this__10419)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10420 = this;
  return cljs.core.keys.call(null, this__10420.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__10421 = this;
  return new cljs.core.PersistentHashSet(this__10421.meta, cljs.core.dissoc.call(null, this__10421.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10422 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10423 = this;
  var and__3822__auto____10424 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____10424) {
    var and__3822__auto____10425 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____10425) {
      return cljs.core.every_QMARK_.call(null, function(p1__10400_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__10400_SHARP_)
      }, other)
    }else {
      return and__3822__auto____10425
    }
  }else {
    return and__3822__auto____10424
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10426 = this;
  return new cljs.core.PersistentHashSet(meta, this__10426.hash_map, this__10426.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10427 = this;
  return this__10427.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10428 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__10428.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__10430 = cljs.core.count.call(null, items);
  var i__10431 = 0;
  var out__10432 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__10431 < len__10430) {
      var G__10433 = i__10431 + 1;
      var G__10434 = cljs.core.conj_BANG_.call(null, out__10432, items[i__10431]);
      i__10431 = G__10433;
      out__10432 = G__10434;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10432)
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
  var G__10452 = null;
  var G__10452__2 = function(this_sym10438, k) {
    var this__10440 = this;
    var this_sym10438__10441 = this;
    var tcoll__10442 = this_sym10438__10441;
    if(cljs.core._lookup.call(null, this__10440.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__10452__3 = function(this_sym10439, k, not_found) {
    var this__10440 = this;
    var this_sym10439__10443 = this;
    var tcoll__10444 = this_sym10439__10443;
    if(cljs.core._lookup.call(null, this__10440.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__10452 = function(this_sym10439, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10452__2.call(this, this_sym10439, k);
      case 3:
        return G__10452__3.call(this, this_sym10439, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10452
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym10436, args10437) {
  var this__10445 = this;
  return this_sym10436.call.apply(this_sym10436, [this_sym10436].concat(args10437.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__10446 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__10447 = this;
  if(cljs.core._lookup.call(null, this__10447.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__10448 = this;
  return cljs.core.count.call(null, this__10448.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__10449 = this;
  this__10449.transient_map = cljs.core.dissoc_BANG_.call(null, this__10449.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10450 = this;
  this__10450.transient_map = cljs.core.assoc_BANG_.call(null, this__10450.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10451 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__10451.transient_map), null)
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
  var this__10455 = this;
  var h__2192__auto____10456 = this__10455.__hash;
  if(!(h__2192__auto____10456 == null)) {
    return h__2192__auto____10456
  }else {
    var h__2192__auto____10457 = cljs.core.hash_iset.call(null, coll);
    this__10455.__hash = h__2192__auto____10457;
    return h__2192__auto____10457
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__10458 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__10459 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__10459.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__10485 = null;
  var G__10485__2 = function(this_sym10460, k) {
    var this__10462 = this;
    var this_sym10460__10463 = this;
    var coll__10464 = this_sym10460__10463;
    return coll__10464.cljs$core$ILookup$_lookup$arity$2(coll__10464, k)
  };
  var G__10485__3 = function(this_sym10461, k, not_found) {
    var this__10462 = this;
    var this_sym10461__10465 = this;
    var coll__10466 = this_sym10461__10465;
    return coll__10466.cljs$core$ILookup$_lookup$arity$3(coll__10466, k, not_found)
  };
  G__10485 = function(this_sym10461, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10485__2.call(this, this_sym10461, k);
      case 3:
        return G__10485__3.call(this, this_sym10461, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10485
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym10453, args10454) {
  var this__10467 = this;
  return this_sym10453.call.apply(this_sym10453, [this_sym10453].concat(args10454.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10468 = this;
  return new cljs.core.PersistentTreeSet(this__10468.meta, cljs.core.assoc.call(null, this__10468.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10469 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__10469.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__10470 = this;
  var this__10471 = this;
  return cljs.core.pr_str.call(null, this__10471)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__10472 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__10472.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__10473 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__10473.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__10474 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__10475 = this;
  return cljs.core._comparator.call(null, this__10475.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10476 = this;
  return cljs.core.keys.call(null, this__10476.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__10477 = this;
  return new cljs.core.PersistentTreeSet(this__10477.meta, cljs.core.dissoc.call(null, this__10477.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10478 = this;
  return cljs.core.count.call(null, this__10478.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10479 = this;
  var and__3822__auto____10480 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____10480) {
    var and__3822__auto____10481 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____10481) {
      return cljs.core.every_QMARK_.call(null, function(p1__10435_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__10435_SHARP_)
      }, other)
    }else {
      return and__3822__auto____10481
    }
  }else {
    return and__3822__auto____10480
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10482 = this;
  return new cljs.core.PersistentTreeSet(meta, this__10482.tree_map, this__10482.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10483 = this;
  return this__10483.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10484 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__10484.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__10490__delegate = function(keys) {
      var in__10488 = cljs.core.seq.call(null, keys);
      var out__10489 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__10488)) {
          var G__10491 = cljs.core.next.call(null, in__10488);
          var G__10492 = cljs.core.conj_BANG_.call(null, out__10489, cljs.core.first.call(null, in__10488));
          in__10488 = G__10491;
          out__10489 = G__10492;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__10489)
        }
        break
      }
    };
    var G__10490 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10490__delegate.call(this, keys)
    };
    G__10490.cljs$lang$maxFixedArity = 0;
    G__10490.cljs$lang$applyTo = function(arglist__10493) {
      var keys = cljs.core.seq(arglist__10493);
      return G__10490__delegate(keys)
    };
    G__10490.cljs$lang$arity$variadic = G__10490__delegate;
    return G__10490
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
  sorted_set.cljs$lang$applyTo = function(arglist__10494) {
    var keys = cljs.core.seq(arglist__10494);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__10496) {
    var comparator = cljs.core.first(arglist__10496);
    var keys = cljs.core.rest(arglist__10496);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__10502 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____10503 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____10503)) {
        var e__10504 = temp__3971__auto____10503;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__10504))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__10502, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__10495_SHARP_) {
      var temp__3971__auto____10505 = cljs.core.find.call(null, smap, p1__10495_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____10505)) {
        var e__10506 = temp__3971__auto____10505;
        return cljs.core.second.call(null, e__10506)
      }else {
        return p1__10495_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__10536 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__10529, seen) {
        while(true) {
          var vec__10530__10531 = p__10529;
          var f__10532 = cljs.core.nth.call(null, vec__10530__10531, 0, null);
          var xs__10533 = vec__10530__10531;
          var temp__3974__auto____10534 = cljs.core.seq.call(null, xs__10533);
          if(temp__3974__auto____10534) {
            var s__10535 = temp__3974__auto____10534;
            if(cljs.core.contains_QMARK_.call(null, seen, f__10532)) {
              var G__10537 = cljs.core.rest.call(null, s__10535);
              var G__10538 = seen;
              p__10529 = G__10537;
              seen = G__10538;
              continue
            }else {
              return cljs.core.cons.call(null, f__10532, step.call(null, cljs.core.rest.call(null, s__10535), cljs.core.conj.call(null, seen, f__10532)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__10536.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__10541 = cljs.core.PersistentVector.EMPTY;
  var s__10542 = s;
  while(true) {
    if(cljs.core.next.call(null, s__10542)) {
      var G__10543 = cljs.core.conj.call(null, ret__10541, cljs.core.first.call(null, s__10542));
      var G__10544 = cljs.core.next.call(null, s__10542);
      ret__10541 = G__10543;
      s__10542 = G__10544;
      continue
    }else {
      return cljs.core.seq.call(null, ret__10541)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____10547 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____10547) {
        return or__3824__auto____10547
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__10548 = x.lastIndexOf("/");
      if(i__10548 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__10548 + 1)
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
    var or__3824__auto____10551 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____10551) {
      return or__3824__auto____10551
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__10552 = x.lastIndexOf("/");
    if(i__10552 > -1) {
      return cljs.core.subs.call(null, x, 2, i__10552)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__10559 = cljs.core.ObjMap.EMPTY;
  var ks__10560 = cljs.core.seq.call(null, keys);
  var vs__10561 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____10562 = ks__10560;
      if(and__3822__auto____10562) {
        return vs__10561
      }else {
        return and__3822__auto____10562
      }
    }()) {
      var G__10563 = cljs.core.assoc.call(null, map__10559, cljs.core.first.call(null, ks__10560), cljs.core.first.call(null, vs__10561));
      var G__10564 = cljs.core.next.call(null, ks__10560);
      var G__10565 = cljs.core.next.call(null, vs__10561);
      map__10559 = G__10563;
      ks__10560 = G__10564;
      vs__10561 = G__10565;
      continue
    }else {
      return map__10559
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
    var G__10568__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__10553_SHARP_, p2__10554_SHARP_) {
        return max_key.call(null, k, p1__10553_SHARP_, p2__10554_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__10568 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10568__delegate.call(this, k, x, y, more)
    };
    G__10568.cljs$lang$maxFixedArity = 3;
    G__10568.cljs$lang$applyTo = function(arglist__10569) {
      var k = cljs.core.first(arglist__10569);
      var x = cljs.core.first(cljs.core.next(arglist__10569));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10569)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10569)));
      return G__10568__delegate(k, x, y, more)
    };
    G__10568.cljs$lang$arity$variadic = G__10568__delegate;
    return G__10568
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
    var G__10570__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__10566_SHARP_, p2__10567_SHARP_) {
        return min_key.call(null, k, p1__10566_SHARP_, p2__10567_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__10570 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10570__delegate.call(this, k, x, y, more)
    };
    G__10570.cljs$lang$maxFixedArity = 3;
    G__10570.cljs$lang$applyTo = function(arglist__10571) {
      var k = cljs.core.first(arglist__10571);
      var x = cljs.core.first(cljs.core.next(arglist__10571));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10571)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10571)));
      return G__10570__delegate(k, x, y, more)
    };
    G__10570.cljs$lang$arity$variadic = G__10570__delegate;
    return G__10570
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
      var temp__3974__auto____10574 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10574) {
        var s__10575 = temp__3974__auto____10574;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__10575), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__10575)))
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
    var temp__3974__auto____10578 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10578) {
      var s__10579 = temp__3974__auto____10578;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__10579)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__10579), take_while.call(null, pred, cljs.core.rest.call(null, s__10579)))
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
    var comp__10581 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__10581.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__10593 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____10594 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____10594)) {
        var vec__10595__10596 = temp__3974__auto____10594;
        var e__10597 = cljs.core.nth.call(null, vec__10595__10596, 0, null);
        var s__10598 = vec__10595__10596;
        if(cljs.core.truth_(include__10593.call(null, e__10597))) {
          return s__10598
        }else {
          return cljs.core.next.call(null, s__10598)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10593, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10599 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____10599)) {
      var vec__10600__10601 = temp__3974__auto____10599;
      var e__10602 = cljs.core.nth.call(null, vec__10600__10601, 0, null);
      var s__10603 = vec__10600__10601;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__10602)) ? s__10603 : cljs.core.next.call(null, s__10603))
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
    var include__10615 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____10616 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____10616)) {
        var vec__10617__10618 = temp__3974__auto____10616;
        var e__10619 = cljs.core.nth.call(null, vec__10617__10618, 0, null);
        var s__10620 = vec__10617__10618;
        if(cljs.core.truth_(include__10615.call(null, e__10619))) {
          return s__10620
        }else {
          return cljs.core.next.call(null, s__10620)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10615, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10621 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____10621)) {
      var vec__10622__10623 = temp__3974__auto____10621;
      var e__10624 = cljs.core.nth.call(null, vec__10622__10623, 0, null);
      var s__10625 = vec__10622__10623;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__10624)) ? s__10625 : cljs.core.next.call(null, s__10625))
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
  var this__10626 = this;
  var h__2192__auto____10627 = this__10626.__hash;
  if(!(h__2192__auto____10627 == null)) {
    return h__2192__auto____10627
  }else {
    var h__2192__auto____10628 = cljs.core.hash_coll.call(null, rng);
    this__10626.__hash = h__2192__auto____10628;
    return h__2192__auto____10628
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__10629 = this;
  if(this__10629.step > 0) {
    if(this__10629.start + this__10629.step < this__10629.end) {
      return new cljs.core.Range(this__10629.meta, this__10629.start + this__10629.step, this__10629.end, this__10629.step, null)
    }else {
      return null
    }
  }else {
    if(this__10629.start + this__10629.step > this__10629.end) {
      return new cljs.core.Range(this__10629.meta, this__10629.start + this__10629.step, this__10629.end, this__10629.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__10630 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__10631 = this;
  var this__10632 = this;
  return cljs.core.pr_str.call(null, this__10632)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__10633 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__10634 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__10635 = this;
  if(this__10635.step > 0) {
    if(this__10635.start < this__10635.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__10635.start > this__10635.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__10636 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__10636.end - this__10636.start) / this__10636.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__10637 = this;
  return this__10637.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__10638 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__10638.meta, this__10638.start + this__10638.step, this__10638.end, this__10638.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__10639 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__10640 = this;
  return new cljs.core.Range(meta, this__10640.start, this__10640.end, this__10640.step, this__10640.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__10641 = this;
  return this__10641.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__10642 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10642.start + n * this__10642.step
  }else {
    if(function() {
      var and__3822__auto____10643 = this__10642.start > this__10642.end;
      if(and__3822__auto____10643) {
        return this__10642.step === 0
      }else {
        return and__3822__auto____10643
      }
    }()) {
      return this__10642.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__10644 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10644.start + n * this__10644.step
  }else {
    if(function() {
      var and__3822__auto____10645 = this__10644.start > this__10644.end;
      if(and__3822__auto____10645) {
        return this__10644.step === 0
      }else {
        return and__3822__auto____10645
      }
    }()) {
      return this__10644.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__10646 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10646.meta)
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
    var temp__3974__auto____10649 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10649) {
      var s__10650 = temp__3974__auto____10649;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__10650), take_nth.call(null, n, cljs.core.drop.call(null, n, s__10650)))
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
    var temp__3974__auto____10657 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10657) {
      var s__10658 = temp__3974__auto____10657;
      var fst__10659 = cljs.core.first.call(null, s__10658);
      var fv__10660 = f.call(null, fst__10659);
      var run__10661 = cljs.core.cons.call(null, fst__10659, cljs.core.take_while.call(null, function(p1__10651_SHARP_) {
        return cljs.core._EQ_.call(null, fv__10660, f.call(null, p1__10651_SHARP_))
      }, cljs.core.next.call(null, s__10658)));
      return cljs.core.cons.call(null, run__10661, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__10661), s__10658))))
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
      var temp__3971__auto____10676 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____10676) {
        var s__10677 = temp__3971__auto____10676;
        return reductions.call(null, f, cljs.core.first.call(null, s__10677), cljs.core.rest.call(null, s__10677))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10678 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10678) {
        var s__10679 = temp__3974__auto____10678;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__10679)), cljs.core.rest.call(null, s__10679))
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
      var G__10682 = null;
      var G__10682__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__10682__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__10682__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__10682__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__10682__4 = function() {
        var G__10683__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__10683 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10683__delegate.call(this, x, y, z, args)
        };
        G__10683.cljs$lang$maxFixedArity = 3;
        G__10683.cljs$lang$applyTo = function(arglist__10684) {
          var x = cljs.core.first(arglist__10684);
          var y = cljs.core.first(cljs.core.next(arglist__10684));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10684)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10684)));
          return G__10683__delegate(x, y, z, args)
        };
        G__10683.cljs$lang$arity$variadic = G__10683__delegate;
        return G__10683
      }();
      G__10682 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10682__0.call(this);
          case 1:
            return G__10682__1.call(this, x);
          case 2:
            return G__10682__2.call(this, x, y);
          case 3:
            return G__10682__3.call(this, x, y, z);
          default:
            return G__10682__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10682.cljs$lang$maxFixedArity = 3;
      G__10682.cljs$lang$applyTo = G__10682__4.cljs$lang$applyTo;
      return G__10682
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__10685 = null;
      var G__10685__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__10685__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__10685__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__10685__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__10685__4 = function() {
        var G__10686__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__10686 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10686__delegate.call(this, x, y, z, args)
        };
        G__10686.cljs$lang$maxFixedArity = 3;
        G__10686.cljs$lang$applyTo = function(arglist__10687) {
          var x = cljs.core.first(arglist__10687);
          var y = cljs.core.first(cljs.core.next(arglist__10687));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10687)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10687)));
          return G__10686__delegate(x, y, z, args)
        };
        G__10686.cljs$lang$arity$variadic = G__10686__delegate;
        return G__10686
      }();
      G__10685 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10685__0.call(this);
          case 1:
            return G__10685__1.call(this, x);
          case 2:
            return G__10685__2.call(this, x, y);
          case 3:
            return G__10685__3.call(this, x, y, z);
          default:
            return G__10685__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10685.cljs$lang$maxFixedArity = 3;
      G__10685.cljs$lang$applyTo = G__10685__4.cljs$lang$applyTo;
      return G__10685
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__10688 = null;
      var G__10688__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__10688__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__10688__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__10688__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__10688__4 = function() {
        var G__10689__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__10689 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10689__delegate.call(this, x, y, z, args)
        };
        G__10689.cljs$lang$maxFixedArity = 3;
        G__10689.cljs$lang$applyTo = function(arglist__10690) {
          var x = cljs.core.first(arglist__10690);
          var y = cljs.core.first(cljs.core.next(arglist__10690));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10690)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10690)));
          return G__10689__delegate(x, y, z, args)
        };
        G__10689.cljs$lang$arity$variadic = G__10689__delegate;
        return G__10689
      }();
      G__10688 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10688__0.call(this);
          case 1:
            return G__10688__1.call(this, x);
          case 2:
            return G__10688__2.call(this, x, y);
          case 3:
            return G__10688__3.call(this, x, y, z);
          default:
            return G__10688__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10688.cljs$lang$maxFixedArity = 3;
      G__10688.cljs$lang$applyTo = G__10688__4.cljs$lang$applyTo;
      return G__10688
    }()
  };
  var juxt__4 = function() {
    var G__10691__delegate = function(f, g, h, fs) {
      var fs__10681 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__10692 = null;
        var G__10692__0 = function() {
          return cljs.core.reduce.call(null, function(p1__10662_SHARP_, p2__10663_SHARP_) {
            return cljs.core.conj.call(null, p1__10662_SHARP_, p2__10663_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__10681)
        };
        var G__10692__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__10664_SHARP_, p2__10665_SHARP_) {
            return cljs.core.conj.call(null, p1__10664_SHARP_, p2__10665_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__10681)
        };
        var G__10692__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__10666_SHARP_, p2__10667_SHARP_) {
            return cljs.core.conj.call(null, p1__10666_SHARP_, p2__10667_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__10681)
        };
        var G__10692__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__10668_SHARP_, p2__10669_SHARP_) {
            return cljs.core.conj.call(null, p1__10668_SHARP_, p2__10669_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__10681)
        };
        var G__10692__4 = function() {
          var G__10693__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__10670_SHARP_, p2__10671_SHARP_) {
              return cljs.core.conj.call(null, p1__10670_SHARP_, cljs.core.apply.call(null, p2__10671_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__10681)
          };
          var G__10693 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10693__delegate.call(this, x, y, z, args)
          };
          G__10693.cljs$lang$maxFixedArity = 3;
          G__10693.cljs$lang$applyTo = function(arglist__10694) {
            var x = cljs.core.first(arglist__10694);
            var y = cljs.core.first(cljs.core.next(arglist__10694));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10694)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10694)));
            return G__10693__delegate(x, y, z, args)
          };
          G__10693.cljs$lang$arity$variadic = G__10693__delegate;
          return G__10693
        }();
        G__10692 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__10692__0.call(this);
            case 1:
              return G__10692__1.call(this, x);
            case 2:
              return G__10692__2.call(this, x, y);
            case 3:
              return G__10692__3.call(this, x, y, z);
            default:
              return G__10692__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__10692.cljs$lang$maxFixedArity = 3;
        G__10692.cljs$lang$applyTo = G__10692__4.cljs$lang$applyTo;
        return G__10692
      }()
    };
    var G__10691 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10691__delegate.call(this, f, g, h, fs)
    };
    G__10691.cljs$lang$maxFixedArity = 3;
    G__10691.cljs$lang$applyTo = function(arglist__10695) {
      var f = cljs.core.first(arglist__10695);
      var g = cljs.core.first(cljs.core.next(arglist__10695));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10695)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10695)));
      return G__10691__delegate(f, g, h, fs)
    };
    G__10691.cljs$lang$arity$variadic = G__10691__delegate;
    return G__10691
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
        var G__10698 = cljs.core.next.call(null, coll);
        coll = G__10698;
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
        var and__3822__auto____10697 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____10697) {
          return n > 0
        }else {
          return and__3822__auto____10697
        }
      }())) {
        var G__10699 = n - 1;
        var G__10700 = cljs.core.next.call(null, coll);
        n = G__10699;
        coll = G__10700;
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
  var matches__10702 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__10702), s)) {
    if(cljs.core.count.call(null, matches__10702) === 1) {
      return cljs.core.first.call(null, matches__10702)
    }else {
      return cljs.core.vec.call(null, matches__10702)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__10704 = re.exec(s);
  if(matches__10704 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__10704) === 1) {
      return cljs.core.first.call(null, matches__10704)
    }else {
      return cljs.core.vec.call(null, matches__10704)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__10709 = cljs.core.re_find.call(null, re, s);
  var match_idx__10710 = s.search(re);
  var match_str__10711 = cljs.core.coll_QMARK_.call(null, match_data__10709) ? cljs.core.first.call(null, match_data__10709) : match_data__10709;
  var post_match__10712 = cljs.core.subs.call(null, s, match_idx__10710 + cljs.core.count.call(null, match_str__10711));
  if(cljs.core.truth_(match_data__10709)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__10709, re_seq.call(null, re, post_match__10712))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__10719__10720 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___10721 = cljs.core.nth.call(null, vec__10719__10720, 0, null);
  var flags__10722 = cljs.core.nth.call(null, vec__10719__10720, 1, null);
  var pattern__10723 = cljs.core.nth.call(null, vec__10719__10720, 2, null);
  return new RegExp(pattern__10723, flags__10722)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__10713_SHARP_) {
    return print_one.call(null, p1__10713_SHARP_, opts)
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
          var and__3822__auto____10733 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____10733)) {
            var and__3822__auto____10737 = function() {
              var G__10734__10735 = obj;
              if(G__10734__10735) {
                if(function() {
                  var or__3824__auto____10736 = G__10734__10735.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____10736) {
                    return or__3824__auto____10736
                  }else {
                    return G__10734__10735.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__10734__10735.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10734__10735)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10734__10735)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____10737)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____10737
            }
          }else {
            return and__3822__auto____10733
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____10738 = !(obj == null);
          if(and__3822__auto____10738) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____10738
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__10739__10740 = obj;
          if(G__10739__10740) {
            if(function() {
              var or__3824__auto____10741 = G__10739__10740.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____10741) {
                return or__3824__auto____10741
              }else {
                return G__10739__10740.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__10739__10740.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10739__10740)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10739__10740)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__10761 = new goog.string.StringBuffer;
  var G__10762__10763 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10762__10763) {
    var string__10764 = cljs.core.first.call(null, G__10762__10763);
    var G__10762__10765 = G__10762__10763;
    while(true) {
      sb__10761.append(string__10764);
      var temp__3974__auto____10766 = cljs.core.next.call(null, G__10762__10765);
      if(temp__3974__auto____10766) {
        var G__10762__10767 = temp__3974__auto____10766;
        var G__10780 = cljs.core.first.call(null, G__10762__10767);
        var G__10781 = G__10762__10767;
        string__10764 = G__10780;
        G__10762__10765 = G__10781;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10768__10769 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10768__10769) {
    var obj__10770 = cljs.core.first.call(null, G__10768__10769);
    var G__10768__10771 = G__10768__10769;
    while(true) {
      sb__10761.append(" ");
      var G__10772__10773 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10770, opts));
      if(G__10772__10773) {
        var string__10774 = cljs.core.first.call(null, G__10772__10773);
        var G__10772__10775 = G__10772__10773;
        while(true) {
          sb__10761.append(string__10774);
          var temp__3974__auto____10776 = cljs.core.next.call(null, G__10772__10775);
          if(temp__3974__auto____10776) {
            var G__10772__10777 = temp__3974__auto____10776;
            var G__10782 = cljs.core.first.call(null, G__10772__10777);
            var G__10783 = G__10772__10777;
            string__10774 = G__10782;
            G__10772__10775 = G__10783;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10778 = cljs.core.next.call(null, G__10768__10771);
      if(temp__3974__auto____10778) {
        var G__10768__10779 = temp__3974__auto____10778;
        var G__10784 = cljs.core.first.call(null, G__10768__10779);
        var G__10785 = G__10768__10779;
        obj__10770 = G__10784;
        G__10768__10771 = G__10785;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__10761
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__10787 = cljs.core.pr_sb.call(null, objs, opts);
  sb__10787.append("\n");
  return[cljs.core.str(sb__10787)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__10806__10807 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10806__10807) {
    var string__10808 = cljs.core.first.call(null, G__10806__10807);
    var G__10806__10809 = G__10806__10807;
    while(true) {
      cljs.core.string_print.call(null, string__10808);
      var temp__3974__auto____10810 = cljs.core.next.call(null, G__10806__10809);
      if(temp__3974__auto____10810) {
        var G__10806__10811 = temp__3974__auto____10810;
        var G__10824 = cljs.core.first.call(null, G__10806__10811);
        var G__10825 = G__10806__10811;
        string__10808 = G__10824;
        G__10806__10809 = G__10825;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10812__10813 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10812__10813) {
    var obj__10814 = cljs.core.first.call(null, G__10812__10813);
    var G__10812__10815 = G__10812__10813;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__10816__10817 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10814, opts));
      if(G__10816__10817) {
        var string__10818 = cljs.core.first.call(null, G__10816__10817);
        var G__10816__10819 = G__10816__10817;
        while(true) {
          cljs.core.string_print.call(null, string__10818);
          var temp__3974__auto____10820 = cljs.core.next.call(null, G__10816__10819);
          if(temp__3974__auto____10820) {
            var G__10816__10821 = temp__3974__auto____10820;
            var G__10826 = cljs.core.first.call(null, G__10816__10821);
            var G__10827 = G__10816__10821;
            string__10818 = G__10826;
            G__10816__10819 = G__10827;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10822 = cljs.core.next.call(null, G__10812__10815);
      if(temp__3974__auto____10822) {
        var G__10812__10823 = temp__3974__auto____10822;
        var G__10828 = cljs.core.first.call(null, G__10812__10823);
        var G__10829 = G__10812__10823;
        obj__10814 = G__10828;
        G__10812__10815 = G__10829;
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
  pr_str.cljs$lang$applyTo = function(arglist__10830) {
    var objs = cljs.core.seq(arglist__10830);
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
  prn_str.cljs$lang$applyTo = function(arglist__10831) {
    var objs = cljs.core.seq(arglist__10831);
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
  pr.cljs$lang$applyTo = function(arglist__10832) {
    var objs = cljs.core.seq(arglist__10832);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__10833) {
    var objs = cljs.core.seq(arglist__10833);
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
  print_str.cljs$lang$applyTo = function(arglist__10834) {
    var objs = cljs.core.seq(arglist__10834);
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
  println.cljs$lang$applyTo = function(arglist__10835) {
    var objs = cljs.core.seq(arglist__10835);
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
  println_str.cljs$lang$applyTo = function(arglist__10836) {
    var objs = cljs.core.seq(arglist__10836);
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
  prn.cljs$lang$applyTo = function(arglist__10837) {
    var objs = cljs.core.seq(arglist__10837);
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
  printf.cljs$lang$applyTo = function(arglist__10838) {
    var fmt = cljs.core.first(arglist__10838);
    var args = cljs.core.rest(arglist__10838);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10839 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10839, "{", ", ", "}", opts, coll)
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
  var pr_pair__10840 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10840, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10841 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10841, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____10842 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____10842)) {
        var nspc__10843 = temp__3974__auto____10842;
        return[cljs.core.str(nspc__10843), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____10844 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____10844)) {
          var nspc__10845 = temp__3974__auto____10844;
          return[cljs.core.str(nspc__10845), cljs.core.str("/")].join("")
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
  var pr_pair__10846 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10846, "{", ", ", "}", opts, coll)
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
  var normalize__10848 = function(n, len) {
    var ns__10847 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__10847) < len) {
        var G__10850 = [cljs.core.str("0"), cljs.core.str(ns__10847)].join("");
        ns__10847 = G__10850;
        continue
      }else {
        return ns__10847
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__10848.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__10848.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__10848.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10848.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10848.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__10848.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__10849 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10849, "{", ", ", "}", opts, coll)
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
  var this__10851 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__10852 = this;
  var G__10853__10854 = cljs.core.seq.call(null, this__10852.watches);
  if(G__10853__10854) {
    var G__10856__10858 = cljs.core.first.call(null, G__10853__10854);
    var vec__10857__10859 = G__10856__10858;
    var key__10860 = cljs.core.nth.call(null, vec__10857__10859, 0, null);
    var f__10861 = cljs.core.nth.call(null, vec__10857__10859, 1, null);
    var G__10853__10862 = G__10853__10854;
    var G__10856__10863 = G__10856__10858;
    var G__10853__10864 = G__10853__10862;
    while(true) {
      var vec__10865__10866 = G__10856__10863;
      var key__10867 = cljs.core.nth.call(null, vec__10865__10866, 0, null);
      var f__10868 = cljs.core.nth.call(null, vec__10865__10866, 1, null);
      var G__10853__10869 = G__10853__10864;
      f__10868.call(null, key__10867, this$, oldval, newval);
      var temp__3974__auto____10870 = cljs.core.next.call(null, G__10853__10869);
      if(temp__3974__auto____10870) {
        var G__10853__10871 = temp__3974__auto____10870;
        var G__10878 = cljs.core.first.call(null, G__10853__10871);
        var G__10879 = G__10853__10871;
        G__10856__10863 = G__10878;
        G__10853__10864 = G__10879;
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
  var this__10872 = this;
  return this$.watches = cljs.core.assoc.call(null, this__10872.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__10873 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__10873.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__10874 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__10874.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__10875 = this;
  return this__10875.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10876 = this;
  return this__10876.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__10877 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__10891__delegate = function(x, p__10880) {
      var map__10886__10887 = p__10880;
      var map__10886__10888 = cljs.core.seq_QMARK_.call(null, map__10886__10887) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10886__10887) : map__10886__10887;
      var validator__10889 = cljs.core._lookup.call(null, map__10886__10888, "\ufdd0'validator", null);
      var meta__10890 = cljs.core._lookup.call(null, map__10886__10888, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__10890, validator__10889, null)
    };
    var G__10891 = function(x, var_args) {
      var p__10880 = null;
      if(goog.isDef(var_args)) {
        p__10880 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10891__delegate.call(this, x, p__10880)
    };
    G__10891.cljs$lang$maxFixedArity = 1;
    G__10891.cljs$lang$applyTo = function(arglist__10892) {
      var x = cljs.core.first(arglist__10892);
      var p__10880 = cljs.core.rest(arglist__10892);
      return G__10891__delegate(x, p__10880)
    };
    G__10891.cljs$lang$arity$variadic = G__10891__delegate;
    return G__10891
  }();
  atom = function(x, var_args) {
    var p__10880 = var_args;
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
  var temp__3974__auto____10896 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____10896)) {
    var validate__10897 = temp__3974__auto____10896;
    if(cljs.core.truth_(validate__10897.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__10898 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__10898, new_value);
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
    var G__10899__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__10899 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__10899__delegate.call(this, a, f, x, y, z, more)
    };
    G__10899.cljs$lang$maxFixedArity = 5;
    G__10899.cljs$lang$applyTo = function(arglist__10900) {
      var a = cljs.core.first(arglist__10900);
      var f = cljs.core.first(cljs.core.next(arglist__10900));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10900)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10900))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10900)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10900)))));
      return G__10899__delegate(a, f, x, y, z, more)
    };
    G__10899.cljs$lang$arity$variadic = G__10899__delegate;
    return G__10899
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__10901) {
    var iref = cljs.core.first(arglist__10901);
    var f = cljs.core.first(cljs.core.next(arglist__10901));
    var args = cljs.core.rest(cljs.core.next(arglist__10901));
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
  var this__10902 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__10902.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10903 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__10903.state, function(p__10904) {
    var map__10905__10906 = p__10904;
    var map__10905__10907 = cljs.core.seq_QMARK_.call(null, map__10905__10906) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10905__10906) : map__10905__10906;
    var curr_state__10908 = map__10905__10907;
    var done__10909 = cljs.core._lookup.call(null, map__10905__10907, "\ufdd0'done", null);
    if(cljs.core.truth_(done__10909)) {
      return curr_state__10908
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__10903.f.call(null)})
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
    var map__10930__10931 = options;
    var map__10930__10932 = cljs.core.seq_QMARK_.call(null, map__10930__10931) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10930__10931) : map__10930__10931;
    var keywordize_keys__10933 = cljs.core._lookup.call(null, map__10930__10932, "\ufdd0'keywordize-keys", null);
    var keyfn__10934 = cljs.core.truth_(keywordize_keys__10933) ? cljs.core.keyword : cljs.core.str;
    var f__10949 = function thisfn(x) {
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
                var iter__2462__auto____10948 = function iter__10942(s__10943) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__10943__10946 = s__10943;
                    while(true) {
                      if(cljs.core.seq.call(null, s__10943__10946)) {
                        var k__10947 = cljs.core.first.call(null, s__10943__10946);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__10934.call(null, k__10947), thisfn.call(null, x[k__10947])], true), iter__10942.call(null, cljs.core.rest.call(null, s__10943__10946)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____10948.call(null, cljs.core.js_keys.call(null, x))
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
    return f__10949.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__10950) {
    var x = cljs.core.first(arglist__10950);
    var options = cljs.core.rest(arglist__10950);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__10955 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__10959__delegate = function(args) {
      var temp__3971__auto____10956 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__10955), args, null);
      if(cljs.core.truth_(temp__3971__auto____10956)) {
        var v__10957 = temp__3971__auto____10956;
        return v__10957
      }else {
        var ret__10958 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__10955, cljs.core.assoc, args, ret__10958);
        return ret__10958
      }
    };
    var G__10959 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10959__delegate.call(this, args)
    };
    G__10959.cljs$lang$maxFixedArity = 0;
    G__10959.cljs$lang$applyTo = function(arglist__10960) {
      var args = cljs.core.seq(arglist__10960);
      return G__10959__delegate(args)
    };
    G__10959.cljs$lang$arity$variadic = G__10959__delegate;
    return G__10959
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__10962 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__10962)) {
        var G__10963 = ret__10962;
        f = G__10963;
        continue
      }else {
        return ret__10962
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__10964__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__10964 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10964__delegate.call(this, f, args)
    };
    G__10964.cljs$lang$maxFixedArity = 1;
    G__10964.cljs$lang$applyTo = function(arglist__10965) {
      var f = cljs.core.first(arglist__10965);
      var args = cljs.core.rest(arglist__10965);
      return G__10964__delegate(f, args)
    };
    G__10964.cljs$lang$arity$variadic = G__10964__delegate;
    return G__10964
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
    var k__10967 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__10967, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__10967, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____10976 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____10976) {
      return or__3824__auto____10976
    }else {
      var or__3824__auto____10977 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____10977) {
        return or__3824__auto____10977
      }else {
        var and__3822__auto____10978 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____10978) {
          var and__3822__auto____10979 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____10979) {
            var and__3822__auto____10980 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____10980) {
              var ret__10981 = true;
              var i__10982 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____10983 = cljs.core.not.call(null, ret__10981);
                  if(or__3824__auto____10983) {
                    return or__3824__auto____10983
                  }else {
                    return i__10982 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__10981
                }else {
                  var G__10984 = isa_QMARK_.call(null, h, child.call(null, i__10982), parent.call(null, i__10982));
                  var G__10985 = i__10982 + 1;
                  ret__10981 = G__10984;
                  i__10982 = G__10985;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____10980
            }
          }else {
            return and__3822__auto____10979
          }
        }else {
          return and__3822__auto____10978
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
    var tp__10994 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__10995 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__10996 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__10997 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____10998 = cljs.core.contains_QMARK_.call(null, tp__10994.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__10996.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__10996.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__10994, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__10997.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__10995, parent, ta__10996), "\ufdd0'descendants":tf__10997.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__10996, tag, td__10995)})
    }();
    if(cljs.core.truth_(or__3824__auto____10998)) {
      return or__3824__auto____10998
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
    var parentMap__11003 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__11004 = cljs.core.truth_(parentMap__11003.call(null, tag)) ? cljs.core.disj.call(null, parentMap__11003.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__11005 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__11004)) ? cljs.core.assoc.call(null, parentMap__11003, tag, childsParents__11004) : cljs.core.dissoc.call(null, parentMap__11003, tag);
    var deriv_seq__11006 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__10986_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__10986_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__10986_SHARP_), cljs.core.second.call(null, p1__10986_SHARP_)))
    }, cljs.core.seq.call(null, newParents__11005)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__11003.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__10987_SHARP_, p2__10988_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__10987_SHARP_, p2__10988_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__11006))
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
  var xprefs__11014 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____11016 = cljs.core.truth_(function() {
    var and__3822__auto____11015 = xprefs__11014;
    if(cljs.core.truth_(and__3822__auto____11015)) {
      return xprefs__11014.call(null, y)
    }else {
      return and__3822__auto____11015
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____11016)) {
    return or__3824__auto____11016
  }else {
    var or__3824__auto____11018 = function() {
      var ps__11017 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__11017) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__11017), prefer_table))) {
          }else {
          }
          var G__11021 = cljs.core.rest.call(null, ps__11017);
          ps__11017 = G__11021;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____11018)) {
      return or__3824__auto____11018
    }else {
      var or__3824__auto____11020 = function() {
        var ps__11019 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__11019) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__11019), y, prefer_table))) {
            }else {
            }
            var G__11022 = cljs.core.rest.call(null, ps__11019);
            ps__11019 = G__11022;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____11020)) {
        return or__3824__auto____11020
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____11024 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____11024)) {
    return or__3824__auto____11024
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__11042 = cljs.core.reduce.call(null, function(be, p__11034) {
    var vec__11035__11036 = p__11034;
    var k__11037 = cljs.core.nth.call(null, vec__11035__11036, 0, null);
    var ___11038 = cljs.core.nth.call(null, vec__11035__11036, 1, null);
    var e__11039 = vec__11035__11036;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__11037)) {
      var be2__11041 = cljs.core.truth_(function() {
        var or__3824__auto____11040 = be == null;
        if(or__3824__auto____11040) {
          return or__3824__auto____11040
        }else {
          return cljs.core.dominates.call(null, k__11037, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__11039 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__11041), k__11037, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__11037), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__11041)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__11041
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__11042)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__11042));
      return cljs.core.second.call(null, best_entry__11042)
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
    var and__3822__auto____11047 = mf;
    if(and__3822__auto____11047) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____11047
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____11048 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11049 = cljs.core._reset[goog.typeOf(x__2363__auto____11048)];
      if(or__3824__auto____11049) {
        return or__3824__auto____11049
      }else {
        var or__3824__auto____11050 = cljs.core._reset["_"];
        if(or__3824__auto____11050) {
          return or__3824__auto____11050
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____11055 = mf;
    if(and__3822__auto____11055) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____11055
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____11056 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11057 = cljs.core._add_method[goog.typeOf(x__2363__auto____11056)];
      if(or__3824__auto____11057) {
        return or__3824__auto____11057
      }else {
        var or__3824__auto____11058 = cljs.core._add_method["_"];
        if(or__3824__auto____11058) {
          return or__3824__auto____11058
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____11063 = mf;
    if(and__3822__auto____11063) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____11063
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____11064 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11065 = cljs.core._remove_method[goog.typeOf(x__2363__auto____11064)];
      if(or__3824__auto____11065) {
        return or__3824__auto____11065
      }else {
        var or__3824__auto____11066 = cljs.core._remove_method["_"];
        if(or__3824__auto____11066) {
          return or__3824__auto____11066
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____11071 = mf;
    if(and__3822__auto____11071) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____11071
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____11072 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11073 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____11072)];
      if(or__3824__auto____11073) {
        return or__3824__auto____11073
      }else {
        var or__3824__auto____11074 = cljs.core._prefer_method["_"];
        if(or__3824__auto____11074) {
          return or__3824__auto____11074
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____11079 = mf;
    if(and__3822__auto____11079) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____11079
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____11080 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11081 = cljs.core._get_method[goog.typeOf(x__2363__auto____11080)];
      if(or__3824__auto____11081) {
        return or__3824__auto____11081
      }else {
        var or__3824__auto____11082 = cljs.core._get_method["_"];
        if(or__3824__auto____11082) {
          return or__3824__auto____11082
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____11087 = mf;
    if(and__3822__auto____11087) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____11087
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____11088 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11089 = cljs.core._methods[goog.typeOf(x__2363__auto____11088)];
      if(or__3824__auto____11089) {
        return or__3824__auto____11089
      }else {
        var or__3824__auto____11090 = cljs.core._methods["_"];
        if(or__3824__auto____11090) {
          return or__3824__auto____11090
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____11095 = mf;
    if(and__3822__auto____11095) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____11095
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____11096 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11097 = cljs.core._prefers[goog.typeOf(x__2363__auto____11096)];
      if(or__3824__auto____11097) {
        return or__3824__auto____11097
      }else {
        var or__3824__auto____11098 = cljs.core._prefers["_"];
        if(or__3824__auto____11098) {
          return or__3824__auto____11098
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____11103 = mf;
    if(and__3822__auto____11103) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____11103
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____11104 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____11105 = cljs.core._dispatch[goog.typeOf(x__2363__auto____11104)];
      if(or__3824__auto____11105) {
        return or__3824__auto____11105
      }else {
        var or__3824__auto____11106 = cljs.core._dispatch["_"];
        if(or__3824__auto____11106) {
          return or__3824__auto____11106
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__11109 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__11110 = cljs.core._get_method.call(null, mf, dispatch_val__11109);
  if(cljs.core.truth_(target_fn__11110)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__11109)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__11110, args)
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
  var this__11111 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__11112 = this;
  cljs.core.swap_BANG_.call(null, this__11112.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__11112.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__11112.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__11112.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__11113 = this;
  cljs.core.swap_BANG_.call(null, this__11113.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__11113.method_cache, this__11113.method_table, this__11113.cached_hierarchy, this__11113.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__11114 = this;
  cljs.core.swap_BANG_.call(null, this__11114.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__11114.method_cache, this__11114.method_table, this__11114.cached_hierarchy, this__11114.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__11115 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__11115.cached_hierarchy), cljs.core.deref.call(null, this__11115.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__11115.method_cache, this__11115.method_table, this__11115.cached_hierarchy, this__11115.hierarchy)
  }
  var temp__3971__auto____11116 = cljs.core.deref.call(null, this__11115.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____11116)) {
    var target_fn__11117 = temp__3971__auto____11116;
    return target_fn__11117
  }else {
    var temp__3971__auto____11118 = cljs.core.find_and_cache_best_method.call(null, this__11115.name, dispatch_val, this__11115.hierarchy, this__11115.method_table, this__11115.prefer_table, this__11115.method_cache, this__11115.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____11118)) {
      var target_fn__11119 = temp__3971__auto____11118;
      return target_fn__11119
    }else {
      return cljs.core.deref.call(null, this__11115.method_table).call(null, this__11115.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__11120 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__11120.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__11120.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__11120.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__11120.method_cache, this__11120.method_table, this__11120.cached_hierarchy, this__11120.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__11121 = this;
  return cljs.core.deref.call(null, this__11121.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__11122 = this;
  return cljs.core.deref.call(null, this__11122.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__11123 = this;
  return cljs.core.do_dispatch.call(null, mf, this__11123.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__11125__delegate = function(_, args) {
    var self__11124 = this;
    return cljs.core._dispatch.call(null, self__11124, args)
  };
  var G__11125 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__11125__delegate.call(this, _, args)
  };
  G__11125.cljs$lang$maxFixedArity = 1;
  G__11125.cljs$lang$applyTo = function(arglist__11126) {
    var _ = cljs.core.first(arglist__11126);
    var args = cljs.core.rest(arglist__11126);
    return G__11125__delegate(_, args)
  };
  G__11125.cljs$lang$arity$variadic = G__11125__delegate;
  return G__11125
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__11127 = this;
  return cljs.core._dispatch.call(null, self__11127, args)
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
  var this__11128 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_11130, _) {
  var this__11129 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__11129.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__11131 = this;
  var and__3822__auto____11132 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____11132) {
    return this__11131.uuid === other.uuid
  }else {
    return and__3822__auto____11132
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__11133 = this;
  var this__11134 = this;
  return cljs.core.pr_str.call(null, this__11134)
};
cljs.core.UUID;
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            if(goog.string.startsWith(key, "aria-")) {
              element.setAttribute(key, val)
            }else {
              element[key] = val
            }
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    var child = root.firstChild;
    while(child) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
      child = child.nextSibling
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0 && index < 32768
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.tabIndex = -1;
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement
  }catch(e) {
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("clojure.browser.dom");
goog.require("cljs.core");
goog.require("goog.object");
goog.require("goog.dom");
clojure.browser.dom.append = function() {
  var append__delegate = function(parent, children) {
    cljs.core.apply.call(null, goog.dom.append, parent, children);
    return parent
  };
  var append = function(parent, var_args) {
    var children = null;
    if(goog.isDef(var_args)) {
      children = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return append__delegate.call(this, parent, children)
  };
  append.cljs$lang$maxFixedArity = 1;
  append.cljs$lang$applyTo = function(arglist__135282) {
    var parent = cljs.core.first(arglist__135282);
    var children = cljs.core.rest(arglist__135282);
    return append__delegate(parent, children)
  };
  append.cljs$lang$arity$variadic = append__delegate;
  return append
}();
clojure.browser.dom.DOMBuilder = {};
clojure.browser.dom._element = function() {
  var _element = null;
  var _element__1 = function(this$) {
    if(function() {
      var and__3822__auto____135295 = this$;
      if(and__3822__auto____135295) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$1
      }else {
        return and__3822__auto____135295
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$1(this$)
    }else {
      var x__2363__auto____135296 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____135297 = clojure.browser.dom._element[goog.typeOf(x__2363__auto____135296)];
        if(or__3824__auto____135297) {
          return or__3824__auto____135297
        }else {
          var or__3824__auto____135298 = clojure.browser.dom._element["_"];
          if(or__3824__auto____135298) {
            return or__3824__auto____135298
          }else {
            throw cljs.core.missing_protocol.call(null, "DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _element__2 = function(this$, attrs_or_children) {
    if(function() {
      var and__3822__auto____135299 = this$;
      if(and__3822__auto____135299) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$2
      }else {
        return and__3822__auto____135299
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$2(this$, attrs_or_children)
    }else {
      var x__2363__auto____135300 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____135301 = clojure.browser.dom._element[goog.typeOf(x__2363__auto____135300)];
        if(or__3824__auto____135301) {
          return or__3824__auto____135301
        }else {
          var or__3824__auto____135302 = clojure.browser.dom._element["_"];
          if(or__3824__auto____135302) {
            return or__3824__auto____135302
          }else {
            throw cljs.core.missing_protocol.call(null, "DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$, attrs_or_children)
    }
  };
  var _element__3 = function(this$, attrs, children) {
    if(function() {
      var and__3822__auto____135303 = this$;
      if(and__3822__auto____135303) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$3
      }else {
        return and__3822__auto____135303
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$3(this$, attrs, children)
    }else {
      var x__2363__auto____135304 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____135305 = clojure.browser.dom._element[goog.typeOf(x__2363__auto____135304)];
        if(or__3824__auto____135305) {
          return or__3824__auto____135305
        }else {
          var or__3824__auto____135306 = clojure.browser.dom._element["_"];
          if(or__3824__auto____135306) {
            return or__3824__auto____135306
          }else {
            throw cljs.core.missing_protocol.call(null, "DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$, attrs, children)
    }
  };
  _element = function(this$, attrs, children) {
    switch(arguments.length) {
      case 1:
        return _element__1.call(this, this$);
      case 2:
        return _element__2.call(this, this$, attrs);
      case 3:
        return _element__3.call(this, this$, attrs, children)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _element.cljs$lang$arity$1 = _element__1;
  _element.cljs$lang$arity$2 = _element__2;
  _element.cljs$lang$arity$3 = _element__3;
  return _element
}();
clojure.browser.dom.log = function() {
  var log__delegate = function(args) {
    return console.log(cljs.core.apply.call(null, cljs.core.pr_str, args))
  };
  var log = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, args)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__135307) {
    var args = cljs.core.seq(arglist__135307);
    return log__delegate(args)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
clojure.browser.dom.log_obj = function log_obj(obj) {
  return console.log(obj)
};
Element.prototype.clojure$browser$dom$DOMBuilder$ = true;
Element.prototype.clojure$browser$dom$DOMBuilder$_element$arity$1 = function(this$) {
  clojure.browser.dom.log.call(null, "js/Element (-element ", this$, ")");
  return this$
};
cljs.core.PersistentVector.prototype.clojure$browser$dom$DOMBuilder$ = true;
cljs.core.PersistentVector.prototype.clojure$browser$dom$DOMBuilder$_element$arity$1 = function(this$) {
  clojure.browser.dom.log.call(null, "PersistentVector (-element ", this$, ")");
  var tag__135308 = cljs.core.first.call(null, this$);
  var attrs__135309 = cljs.core.second.call(null, this$);
  var children__135310 = cljs.core.drop.call(null, 2, this$);
  if(cljs.core.map_QMARK_.call(null, attrs__135309)) {
    return clojure.browser.dom._element.call(null, tag__135308, attrs__135309, children__135310)
  }else {
    return clojure.browser.dom._element.call(null, tag__135308, null, cljs.core.rest.call(null, this$))
  }
};
clojure.browser.dom.DOMBuilder["string"] = true;
clojure.browser.dom._element["string"] = function() {
  var G__135323 = null;
  var G__135323__1 = function(this$) {
    clojure.browser.dom.log.call(null, "string (-element ", this$, ")");
    if(cljs.core.keyword_QMARK_.call(null, this$)) {
      return goog.dom.createElement(cljs.core.name.call(null, this$))
    }else {
      if("\ufdd0'else") {
        return goog.dom.createTextNode(cljs.core.name.call(null, this$))
      }else {
        return null
      }
    }
  };
  var G__135323__2 = function(this$, attrs_or_children) {
    clojure.browser.dom.log.call(null, "string (-element ", this$, " ", attrs_or_children, ")");
    var attrs__135311 = cljs.core.first.call(null, attrs_or_children);
    if(cljs.core.map_QMARK_.call(null, attrs__135311)) {
      return clojure.browser.dom._element.call(null, this$, attrs__135311, cljs.core.rest.call(null, attrs_or_children))
    }else {
      return clojure.browser.dom._element.call(null, this$, null, attrs_or_children)
    }
  };
  var G__135323__3 = function(this$, attrs, children) {
    clojure.browser.dom.log.call(null, "string (-element ", this$, " ", attrs, " ", children, ")");
    var str_attrs__135322 = cljs.core.truth_(function() {
      var and__3822__auto____135312 = cljs.core.map_QMARK_.call(null, attrs);
      if(and__3822__auto____135312) {
        return cljs.core.seq.call(null, attrs)
      }else {
        return and__3822__auto____135312
      }
    }()) ? cljs.core.reduce.call(null, function(o, p__135313) {
      var vec__135314__135315 = p__135313;
      var k__135316 = cljs.core.nth.call(null, vec__135314__135315, 0, null);
      var v__135317 = cljs.core.nth.call(null, vec__135314__135315, 1, null);
      var o__135318 = o == null ? {} : o;
      clojure.browser.dom.log.call(null, "o = ", o__135318);
      clojure.browser.dom.log.call(null, "k = ", k__135316);
      clojure.browser.dom.log.call(null, "v = ", v__135317);
      if(function() {
        var or__3824__auto____135319 = cljs.core.keyword_QMARK_.call(null, k__135316);
        if(or__3824__auto____135319) {
          return or__3824__auto____135319
        }else {
          return cljs.core.string_QMARK_.call(null, k__135316)
        }
      }()) {
        var G__135320__135321 = o__135318;
        G__135320__135321[cljs.core.name.call(null, k__135316)] = v__135317;
        return G__135320__135321
      }else {
        return null
      }
    }, {}, attrs) : null;
    clojure.browser.dom.log_obj.call(null, str_attrs__135322);
    if(cljs.core.seq.call(null, children)) {
      return cljs.core.apply.call(null, goog.dom.createDom, cljs.core.name.call(null, this$), str_attrs__135322, cljs.core.map.call(null, clojure.browser.dom._element, children))
    }else {
      return goog.dom.createDom(cljs.core.name.call(null, this$), str_attrs__135322)
    }
  };
  G__135323 = function(this$, attrs, children) {
    switch(arguments.length) {
      case 1:
        return G__135323__1.call(this, this$);
      case 2:
        return G__135323__2.call(this, this$, attrs);
      case 3:
        return G__135323__3.call(this, this$, attrs, children)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__135323
}();
clojure.browser.dom.element = function() {
  var element = null;
  var element__1 = function(tag_or_text) {
    clojure.browser.dom.log.call(null, "(element ", tag_or_text, ")");
    return clojure.browser.dom._element.call(null, tag_or_text)
  };
  var element__2 = function() {
    var G__135326__delegate = function(tag, children) {
      clojure.browser.dom.log.call(null, "(element ", tag, " ", children, ")");
      var attrs__135325 = cljs.core.first.call(null, children);
      if(cljs.core.map_QMARK_.call(null, attrs__135325)) {
        return clojure.browser.dom._element.call(null, tag, attrs__135325, cljs.core.rest.call(null, children))
      }else {
        return clojure.browser.dom._element.call(null, tag, null, children)
      }
    };
    var G__135326 = function(tag, var_args) {
      var children = null;
      if(goog.isDef(var_args)) {
        children = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__135326__delegate.call(this, tag, children)
    };
    G__135326.cljs$lang$maxFixedArity = 1;
    G__135326.cljs$lang$applyTo = function(arglist__135327) {
      var tag = cljs.core.first(arglist__135327);
      var children = cljs.core.rest(arglist__135327);
      return G__135326__delegate(tag, children)
    };
    G__135326.cljs$lang$arity$variadic = G__135326__delegate;
    return G__135326
  }();
  element = function(tag, var_args) {
    var children = var_args;
    switch(arguments.length) {
      case 1:
        return element__1.call(this, tag);
      default:
        return element__2.cljs$lang$arity$variadic(tag, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  element.cljs$lang$maxFixedArity = 1;
  element.cljs$lang$applyTo = element__2.cljs$lang$applyTo;
  element.cljs$lang$arity$1 = element__1;
  element.cljs$lang$arity$variadic = element__2.cljs$lang$arity$variadic;
  return element
}();
clojure.browser.dom.remove_children = function remove_children(id) {
  var parent__135329 = goog.dom.getElement(cljs.core.name.call(null, id));
  return goog.dom.removeChildren(parent__135329)
};
clojure.browser.dom.get_element = function get_element(id) {
  return goog.dom.getElement(cljs.core.name.call(null, id))
};
clojure.browser.dom.html__GT_dom = function html__GT_dom(s) {
  return goog.dom.htmlToDocumentFragment(s)
};
clojure.browser.dom.insert_at = function insert_at(parent, child, index) {
  return goog.dom.insertChildAt(parent, child, index)
};
clojure.browser.dom.ensure_element = function ensure_element(e) {
  if(cljs.core.keyword_QMARK_.call(null, e)) {
    return clojure.browser.dom.get_element.call(null, e)
  }else {
    if(cljs.core.string_QMARK_.call(null, e)) {
      return clojure.browser.dom.html__GT_dom.call(null, e)
    }else {
      if("\ufdd0'else") {
        return e
      }else {
        return null
      }
    }
  }
};
clojure.browser.dom.replace_node = function replace_node(old_node, new_node) {
  var old_node__135332 = clojure.browser.dom.ensure_element.call(null, old_node);
  var new_node__135333 = clojure.browser.dom.ensure_element.call(null, new_node);
  goog.dom.replaceNode(new_node__135333, old_node__135332);
  return new_node__135333
};
clojure.browser.dom.set_text = function set_text(e, s) {
  return goog.dom.setTextContent(clojure.browser.dom.ensure_element.call(null, e), s)
};
clojure.browser.dom.get_value = function get_value(e) {
  return clojure.browser.dom.ensure_element.call(null, e).value
};
clojure.browser.dom.set_properties = function set_properties(e, m) {
  return goog.dom.setProperties(clojure.browser.dom.ensure_element.call(null, e), cljs.core.apply.call(null, goog.object.create, cljs.core.interleave.call(null, cljs.core.keys.call(null, m), cljs.core.vals.call(null, m))))
};
clojure.browser.dom.set_value = function set_value(e, v) {
  return clojure.browser.dom.set_properties.call(null, e, cljs.core.ObjMap.fromObject(["value"], {"value":v}))
};
clojure.browser.dom.click_element = function click_element(e) {
  return clojure.browser.dom.ensure_element.call(null, e).click(cljs.core.List.EMPTY)
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__11805 = s;
      var limit__11806 = limit;
      var parts__11807 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__11806, 1)) {
          return cljs.core.conj.call(null, parts__11807, s__11805)
        }else {
          var temp__3971__auto____11808 = cljs.core.re_find.call(null, re, s__11805);
          if(cljs.core.truth_(temp__3971__auto____11808)) {
            var m__11809 = temp__3971__auto____11808;
            var index__11810 = s__11805.indexOf(m__11809);
            var G__11811 = s__11805.substring(index__11810 + cljs.core.count.call(null, m__11809));
            var G__11812 = limit__11806 - 1;
            var G__11813 = cljs.core.conj.call(null, parts__11807, s__11805.substring(0, index__11810));
            s__11805 = G__11811;
            limit__11806 = G__11812;
            parts__11807 = G__11813;
            continue
          }else {
            return cljs.core.conj.call(null, parts__11807, s__11805)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__11817 = s.length;
  while(true) {
    if(index__11817 === 0) {
      return""
    }else {
      var ch__11818 = cljs.core._lookup.call(null, s, index__11817 - 1, null);
      if(function() {
        var or__3824__auto____11819 = cljs.core._EQ_.call(null, ch__11818, "\n");
        if(or__3824__auto____11819) {
          return or__3824__auto____11819
        }else {
          return cljs.core._EQ_.call(null, ch__11818, "\r")
        }
      }()) {
        var G__11820 = index__11817 - 1;
        index__11817 = G__11820;
        continue
      }else {
        return s.substring(0, index__11817)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__11824 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____11825 = cljs.core.not.call(null, s__11824);
    if(or__3824__auto____11825) {
      return or__3824__auto____11825
    }else {
      var or__3824__auto____11826 = cljs.core._EQ_.call(null, "", s__11824);
      if(or__3824__auto____11826) {
        return or__3824__auto____11826
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__11824)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__11833 = new goog.string.StringBuffer;
  var length__11834 = s.length;
  var index__11835 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__11834, index__11835)) {
      return buffer__11833.toString()
    }else {
      var ch__11836 = s.charAt(index__11835);
      var temp__3971__auto____11837 = cljs.core._lookup.call(null, cmap, ch__11836, null);
      if(cljs.core.truth_(temp__3971__auto____11837)) {
        var replacement__11838 = temp__3971__auto____11837;
        buffer__11833.append([cljs.core.str(replacement__11838)].join(""))
      }else {
        buffer__11833.append(ch__11836)
      }
      var G__11839 = index__11835 + 1;
      index__11835 = G__11839;
      continue
    }
    break
  }
};
goog.provide("crate.util");
goog.require("cljs.core");
goog.require("clojure.string");
crate.util._STAR_base_url_STAR_ = null;
crate.util.as_str = function() {
  var as_str = null;
  var as_str__0 = function() {
    return""
  };
  var as_str__1 = function(x) {
    if(function() {
      var or__3824__auto____11841 = cljs.core.symbol_QMARK_.call(null, x);
      if(or__3824__auto____11841) {
        return or__3824__auto____11841
      }else {
        return cljs.core.keyword_QMARK_.call(null, x)
      }
    }()) {
      return cljs.core.name.call(null, x)
    }else {
      return[cljs.core.str(x)].join("")
    }
  };
  var as_str__2 = function() {
    var G__11842__delegate = function(x, xs) {
      return function(s, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__11843 = [cljs.core.str(s), cljs.core.str(as_str.call(null, cljs.core.first.call(null, more)))].join("");
            var G__11844 = cljs.core.next.call(null, more);
            s = G__11843;
            more = G__11844;
            continue
          }else {
            return s
          }
          break
        }
      }.call(null, as_str.call(null, x), xs)
    };
    var G__11842 = function(x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11842__delegate.call(this, x, xs)
    };
    G__11842.cljs$lang$maxFixedArity = 1;
    G__11842.cljs$lang$applyTo = function(arglist__11845) {
      var x = cljs.core.first(arglist__11845);
      var xs = cljs.core.rest(arglist__11845);
      return G__11842__delegate(x, xs)
    };
    G__11842.cljs$lang$arity$variadic = G__11842__delegate;
    return G__11842
  }();
  as_str = function(x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 0:
        return as_str__0.call(this);
      case 1:
        return as_str__1.call(this, x);
      default:
        return as_str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  as_str.cljs$lang$maxFixedArity = 1;
  as_str.cljs$lang$applyTo = as_str__2.cljs$lang$applyTo;
  as_str.cljs$lang$arity$0 = as_str__0;
  as_str.cljs$lang$arity$1 = as_str__1;
  as_str.cljs$lang$arity$variadic = as_str__2.cljs$lang$arity$variadic;
  return as_str
}();
crate.util.escape_html = function escape_html(text) {
  return clojure.string.replace.call(null, clojure.string.replace.call(null, clojure.string.replace.call(null, clojure.string.replace.call(null, crate.util.as_str.call(null, text), "&", "&amp;"), "<", "&lt;"), ">", "&gt;"), '"', "&quot;")
};
crate.util.to_uri = function to_uri(uri) {
  if(cljs.core.truth_(cljs.core.re_matches.call(null, /^\w+:.*/, uri))) {
    return uri
  }else {
    return[cljs.core.str(crate.util._STAR_base_url_STAR_), cljs.core.str(uri)].join("")
  }
};
crate.util.url_encode_component = function url_encode_component(s) {
  return encodeURIComponent(crate.util.as_str.call(null, s))
};
crate.util.url_encode = function url_encode(params) {
  return clojure.string.join.call(null, "&", function() {
    var iter__2462__auto____11871 = function iter__11859(s__11860) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__11860__11866 = s__11860;
        while(true) {
          if(cljs.core.seq.call(null, s__11860__11866)) {
            var vec__11867__11868 = cljs.core.first.call(null, s__11860__11866);
            var k__11869 = cljs.core.nth.call(null, vec__11867__11868, 0, null);
            var v__11870 = cljs.core.nth.call(null, vec__11867__11868, 1, null);
            return cljs.core.cons.call(null, [cljs.core.str(crate.util.url_encode_component.call(null, k__11869)), cljs.core.str("="), cljs.core.str(crate.util.url_encode_component.call(null, v__11870))].join(""), iter__11859.call(null, cljs.core.rest.call(null, s__11860__11866)))
          }else {
            return null
          }
          break
        }
      }, null)
    };
    return iter__2462__auto____11871.call(null, params)
  }())
};
crate.util.url = function() {
  var url__delegate = function(args) {
    var params__11874 = cljs.core.last.call(null, args);
    var args__11875 = cljs.core.butlast.call(null, args);
    return[cljs.core.str(crate.util.to_uri.call(null, [cljs.core.str(cljs.core.apply.call(null, cljs.core.str, args__11875)), cljs.core.str(cljs.core.map_QMARK_.call(null, params__11874) ? [cljs.core.str("?"), cljs.core.str(crate.util.url_encode.call(null, params__11874))].join("") : params__11874)].join("")))].join("")
  };
  var url = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return url__delegate.call(this, args)
  };
  url.cljs$lang$maxFixedArity = 0;
  url.cljs$lang$applyTo = function(arglist__11876) {
    var args = cljs.core.seq(arglist__11876);
    return url__delegate(args)
  };
  url.cljs$lang$arity$variadic = url__delegate;
  return url
}();
goog.provide("clojure.set");
goog.require("cljs.core");
clojure.set.bubble_max_key = function bubble_max_key(k, coll) {
  var max__11719 = cljs.core.apply.call(null, cljs.core.max_key, k, coll);
  return cljs.core.cons.call(null, max__11719, cljs.core.remove.call(null, function(p1__11717_SHARP_) {
    return max__11719 === p1__11717_SHARP_
  }, coll))
};
clojure.set.union = function() {
  var union = null;
  var union__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var union__1 = function(s1) {
    return s1
  };
  var union__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, cljs.core.conj, s2, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.conj, s1, s2)
    }
  };
  var union__3 = function() {
    var G__11723__delegate = function(s1, s2, sets) {
      var bubbled_sets__11722 = clojure.set.bubble_max_key.call(null, cljs.core.count, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, cljs.core.into, cljs.core.first.call(null, bubbled_sets__11722), cljs.core.rest.call(null, bubbled_sets__11722))
    };
    var G__11723 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11723__delegate.call(this, s1, s2, sets)
    };
    G__11723.cljs$lang$maxFixedArity = 2;
    G__11723.cljs$lang$applyTo = function(arglist__11724) {
      var s1 = cljs.core.first(arglist__11724);
      var s2 = cljs.core.first(cljs.core.next(arglist__11724));
      var sets = cljs.core.rest(cljs.core.next(arglist__11724));
      return G__11723__delegate(s1, s2, sets)
    };
    G__11723.cljs$lang$arity$variadic = G__11723__delegate;
    return G__11723
  }();
  union = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 0:
        return union__0.call(this);
      case 1:
        return union__1.call(this, s1);
      case 2:
        return union__2.call(this, s1, s2);
      default:
        return union__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  union.cljs$lang$maxFixedArity = 2;
  union.cljs$lang$applyTo = union__3.cljs$lang$applyTo;
  union.cljs$lang$arity$0 = union__0;
  union.cljs$lang$arity$1 = union__1;
  union.cljs$lang$arity$2 = union__2;
  union.cljs$lang$arity$variadic = union__3.cljs$lang$arity$variadic;
  return union
}();
clojure.set.intersection = function() {
  var intersection = null;
  var intersection__1 = function(s1) {
    return s1
  };
  var intersection__2 = function(s1, s2) {
    while(true) {
      if(cljs.core.count.call(null, s2) < cljs.core.count.call(null, s1)) {
        var G__11727 = s2;
        var G__11728 = s1;
        s1 = G__11727;
        s2 = G__11728;
        continue
      }else {
        return cljs.core.reduce.call(null, function(s1, s2) {
          return function(result, item) {
            if(cljs.core.contains_QMARK_.call(null, s2, item)) {
              return result
            }else {
              return cljs.core.disj.call(null, result, item)
            }
          }
        }(s1, s2), s1, s1)
      }
      break
    }
  };
  var intersection__3 = function() {
    var G__11729__delegate = function(s1, s2, sets) {
      var bubbled_sets__11726 = clojure.set.bubble_max_key.call(null, function(p1__11720_SHARP_) {
        return-cljs.core.count.call(null, p1__11720_SHARP_)
      }, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, intersection, cljs.core.first.call(null, bubbled_sets__11726), cljs.core.rest.call(null, bubbled_sets__11726))
    };
    var G__11729 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11729__delegate.call(this, s1, s2, sets)
    };
    G__11729.cljs$lang$maxFixedArity = 2;
    G__11729.cljs$lang$applyTo = function(arglist__11730) {
      var s1 = cljs.core.first(arglist__11730);
      var s2 = cljs.core.first(cljs.core.next(arglist__11730));
      var sets = cljs.core.rest(cljs.core.next(arglist__11730));
      return G__11729__delegate(s1, s2, sets)
    };
    G__11729.cljs$lang$arity$variadic = G__11729__delegate;
    return G__11729
  }();
  intersection = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return intersection__1.call(this, s1);
      case 2:
        return intersection__2.call(this, s1, s2);
      default:
        return intersection__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  intersection.cljs$lang$maxFixedArity = 2;
  intersection.cljs$lang$applyTo = intersection__3.cljs$lang$applyTo;
  intersection.cljs$lang$arity$1 = intersection__1;
  intersection.cljs$lang$arity$2 = intersection__2;
  intersection.cljs$lang$arity$variadic = intersection__3.cljs$lang$arity$variadic;
  return intersection
}();
clojure.set.difference = function() {
  var difference = null;
  var difference__1 = function(s1) {
    return s1
  };
  var difference__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, function(result, item) {
        if(cljs.core.contains_QMARK_.call(null, s2, item)) {
          return cljs.core.disj.call(null, result, item)
        }else {
          return result
        }
      }, s1, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.disj, s1, s2)
    }
  };
  var difference__3 = function() {
    var G__11731__delegate = function(s1, s2, sets) {
      return cljs.core.reduce.call(null, difference, s1, cljs.core.conj.call(null, sets, s2))
    };
    var G__11731 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11731__delegate.call(this, s1, s2, sets)
    };
    G__11731.cljs$lang$maxFixedArity = 2;
    G__11731.cljs$lang$applyTo = function(arglist__11732) {
      var s1 = cljs.core.first(arglist__11732);
      var s2 = cljs.core.first(cljs.core.next(arglist__11732));
      var sets = cljs.core.rest(cljs.core.next(arglist__11732));
      return G__11731__delegate(s1, s2, sets)
    };
    G__11731.cljs$lang$arity$variadic = G__11731__delegate;
    return G__11731
  }();
  difference = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return difference__1.call(this, s1);
      case 2:
        return difference__2.call(this, s1, s2);
      default:
        return difference__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  difference.cljs$lang$maxFixedArity = 2;
  difference.cljs$lang$applyTo = difference__3.cljs$lang$applyTo;
  difference.cljs$lang$arity$1 = difference__1;
  difference.cljs$lang$arity$2 = difference__2;
  difference.cljs$lang$arity$variadic = difference__3.cljs$lang$arity$variadic;
  return difference
}();
clojure.set.select = function select(pred, xset) {
  return cljs.core.reduce.call(null, function(s, k) {
    if(cljs.core.truth_(pred.call(null, k))) {
      return s
    }else {
      return cljs.core.disj.call(null, s, k)
    }
  }, xset, xset)
};
clojure.set.project = function project(xrel, ks) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__11733_SHARP_) {
    return cljs.core.select_keys.call(null, p1__11733_SHARP_, ks)
  }, xrel))
};
clojure.set.rename_keys = function rename_keys(map, kmap) {
  return cljs.core.reduce.call(null, function(m, p__11741) {
    var vec__11742__11743 = p__11741;
    var old__11744 = cljs.core.nth.call(null, vec__11742__11743, 0, null);
    var new__11745 = cljs.core.nth.call(null, vec__11742__11743, 1, null);
    if(function() {
      var and__3822__auto____11746 = cljs.core.not_EQ_.call(null, old__11744, new__11745);
      if(and__3822__auto____11746) {
        return cljs.core.contains_QMARK_.call(null, m, old__11744)
      }else {
        return and__3822__auto____11746
      }
    }()) {
      return cljs.core.dissoc.call(null, cljs.core.assoc.call(null, m, new__11745, cljs.core._lookup.call(null, m, old__11744, null)), old__11744)
    }else {
      return m
    }
  }, map, kmap)
};
clojure.set.rename = function rename(xrel, kmap) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__11734_SHARP_) {
    return clojure.set.rename_keys.call(null, p1__11734_SHARP_, kmap)
  }, xrel))
};
clojure.set.index = function index(xrel, ks) {
  return cljs.core.reduce.call(null, function(m, x) {
    var ik__11748 = cljs.core.select_keys.call(null, x, ks);
    return cljs.core.assoc.call(null, m, ik__11748, cljs.core.conj.call(null, cljs.core._lookup.call(null, m, ik__11748, cljs.core.PersistentHashSet.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, xrel)
};
clojure.set.map_invert = function map_invert(m) {
  return cljs.core.reduce.call(null, function(m, p__11758) {
    var vec__11759__11760 = p__11758;
    var k__11761 = cljs.core.nth.call(null, vec__11759__11760, 0, null);
    var v__11762 = cljs.core.nth.call(null, vec__11759__11760, 1, null);
    return cljs.core.assoc.call(null, m, v__11762, k__11761)
  }, cljs.core.ObjMap.EMPTY, m)
};
clojure.set.join = function() {
  var join = null;
  var join__2 = function(xrel, yrel) {
    if(function() {
      var and__3822__auto____11779 = cljs.core.seq.call(null, xrel);
      if(and__3822__auto____11779) {
        return cljs.core.seq.call(null, yrel)
      }else {
        return and__3822__auto____11779
      }
    }()) {
      var ks__11781 = clojure.set.intersection.call(null, cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, xrel))), cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, yrel))));
      var vec__11780__11782 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel], true) : cljs.core.PersistentVector.fromArray([yrel, xrel], true);
      var r__11783 = cljs.core.nth.call(null, vec__11780__11782, 0, null);
      var s__11784 = cljs.core.nth.call(null, vec__11780__11782, 1, null);
      var idx__11785 = clojure.set.index.call(null, r__11783, ks__11781);
      return cljs.core.reduce.call(null, function(ret, x) {
        var found__11786 = idx__11785.call(null, cljs.core.select_keys.call(null, x, ks__11781));
        if(cljs.core.truth_(found__11786)) {
          return cljs.core.reduce.call(null, function(p1__11749_SHARP_, p2__11750_SHARP_) {
            return cljs.core.conj.call(null, p1__11749_SHARP_, cljs.core.merge.call(null, p2__11750_SHARP_, x))
          }, ret, found__11786)
        }else {
          return ret
        }
      }, cljs.core.PersistentHashSet.EMPTY, s__11784)
    }else {
      return cljs.core.PersistentHashSet.EMPTY
    }
  };
  var join__3 = function(xrel, yrel, km) {
    var vec__11787__11788 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel, clojure.set.map_invert.call(null, km)], true) : cljs.core.PersistentVector.fromArray([yrel, xrel, km], true);
    var r__11789 = cljs.core.nth.call(null, vec__11787__11788, 0, null);
    var s__11790 = cljs.core.nth.call(null, vec__11787__11788, 1, null);
    var k__11791 = cljs.core.nth.call(null, vec__11787__11788, 2, null);
    var idx__11792 = clojure.set.index.call(null, r__11789, cljs.core.vals.call(null, k__11791));
    return cljs.core.reduce.call(null, function(ret, x) {
      var found__11793 = idx__11792.call(null, clojure.set.rename_keys.call(null, cljs.core.select_keys.call(null, x, cljs.core.keys.call(null, k__11791)), k__11791));
      if(cljs.core.truth_(found__11793)) {
        return cljs.core.reduce.call(null, function(p1__11751_SHARP_, p2__11752_SHARP_) {
          return cljs.core.conj.call(null, p1__11751_SHARP_, cljs.core.merge.call(null, p2__11752_SHARP_, x))
        }, ret, found__11793)
      }else {
        return ret
      }
    }, cljs.core.PersistentHashSet.EMPTY, s__11790)
  };
  join = function(xrel, yrel, km) {
    switch(arguments.length) {
      case 2:
        return join__2.call(this, xrel, yrel);
      case 3:
        return join__3.call(this, xrel, yrel, km)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$2 = join__2;
  join.cljs$lang$arity$3 = join__3;
  return join
}();
clojure.set.subset_QMARK_ = function subset_QMARK_(set1, set2) {
  var and__3822__auto____11796 = cljs.core.count.call(null, set1) <= cljs.core.count.call(null, set2);
  if(and__3822__auto____11796) {
    return cljs.core.every_QMARK_.call(null, function(p1__11763_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set2, p1__11763_SHARP_)
    }, set1)
  }else {
    return and__3822__auto____11796
  }
};
clojure.set.superset_QMARK_ = function superset_QMARK_(set1, set2) {
  var and__3822__auto____11798 = cljs.core.count.call(null, set1) >= cljs.core.count.call(null, set2);
  if(and__3822__auto____11798) {
    return cljs.core.every_QMARK_.call(null, function(p1__11794_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set1, p1__11794_SHARP_)
    }, set2)
  }else {
    return and__3822__auto____11798
  }
};
goog.provide("crate.binding");
goog.require("cljs.core");
goog.require("clojure.set");
crate.binding.SubAtom = function(atm, path, prevhash, watches) {
  this.atm = atm;
  this.path = path;
  this.prevhash = prevhash;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690678784
};
crate.binding.SubAtom.cljs$lang$type = true;
crate.binding.SubAtom.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "crate.binding/SubAtom")
};
crate.binding.SubAtom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__11488 = this;
  return goog.getUid(this$)
};
crate.binding.SubAtom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__11489 = this;
  var G__11490__11491 = cljs.core.seq.call(null, this__11489.watches);
  if(G__11490__11491) {
    var G__11493__11495 = cljs.core.first.call(null, G__11490__11491);
    var vec__11494__11496 = G__11493__11495;
    var key__11497 = cljs.core.nth.call(null, vec__11494__11496, 0, null);
    var f__11498 = cljs.core.nth.call(null, vec__11494__11496, 1, null);
    var G__11490__11499 = G__11490__11491;
    var G__11493__11500 = G__11493__11495;
    var G__11490__11501 = G__11490__11499;
    while(true) {
      var vec__11502__11503 = G__11493__11500;
      var key__11504 = cljs.core.nth.call(null, vec__11502__11503, 0, null);
      var f__11505 = cljs.core.nth.call(null, vec__11502__11503, 1, null);
      var G__11490__11506 = G__11490__11501;
      f__11505.call(null, key__11504, this$, oldval, newval);
      var temp__3974__auto____11507 = cljs.core.next.call(null, G__11490__11506);
      if(temp__3974__auto____11507) {
        var G__11490__11508 = temp__3974__auto____11507;
        var G__11514 = cljs.core.first.call(null, G__11490__11508);
        var G__11515 = G__11490__11508;
        G__11493__11500 = G__11514;
        G__11490__11501 = G__11515;
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
crate.binding.SubAtom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__11509 = this;
  if(cljs.core.truth_(f)) {
    return this$.watches = cljs.core.assoc.call(null, this__11509.watches, key, f)
  }else {
    return null
  }
};
crate.binding.SubAtom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__11510 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__11510.watches, key)
};
crate.binding.SubAtom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__11511 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<SubAtom: "], true), cljs.core._pr_seq.call(null, cljs.core.get_in.call(null, cljs.core.deref.call(null, this__11511.atm), this__11511.path), opts), ">")
};
crate.binding.SubAtom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__11512 = this;
  return cljs.core.get_in.call(null, cljs.core.deref.call(null, this__11512.atm), this__11512.path)
};
crate.binding.SubAtom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__11513 = this;
  return o === other
};
crate.binding.SubAtom;
crate.binding.subatom = function subatom(atm, path) {
  var path__11529 = cljs.core.coll_QMARK_.call(null, path) ? path : cljs.core.PersistentVector.fromArray([path], true);
  var vec__11528__11530 = cljs.core.instance_QMARK_.call(null, crate.binding.SubAtom, atm) ? cljs.core.PersistentVector.fromArray([atm.atm, cljs.core.concat.call(null, atm.path, path__11529)], true) : cljs.core.PersistentVector.fromArray([atm, path__11529], true);
  var atm__11531 = cljs.core.nth.call(null, vec__11528__11530, 0, null);
  var path__11532 = cljs.core.nth.call(null, vec__11528__11530, 1, null);
  var k__11533 = cljs.core.gensym.call(null, "subatom");
  var sa__11534 = new crate.binding.SubAtom(atm__11531, path__11532, cljs.core.hash.call(null, cljs.core.get_in.call(null, cljs.core.deref.call(null, atm__11531), path__11532)), null);
  cljs.core.add_watch.call(null, atm__11531, k__11533, function(_11535, _, ov, nv) {
    var latest__11536 = cljs.core.get_in.call(null, nv, path__11532);
    var prev__11537 = cljs.core.get_in.call(null, ov, path__11532);
    var latest_hash__11538 = cljs.core.hash.call(null, latest__11536);
    if(function() {
      var and__3822__auto____11539 = cljs.core.not_EQ_.call(null, sa__11534.prevhash, latest_hash__11538);
      if(and__3822__auto____11539) {
        return cljs.core.not_EQ_.call(null, prev__11537, latest__11536)
      }else {
        return and__3822__auto____11539
      }
    }()) {
      sa__11534.prevhash = latest_hash__11538;
      return cljs.core._notify_watches.call(null, sa__11534, cljs.core.get_in.call(null, ov, path__11532), latest__11536)
    }else {
      return null
    }
  });
  return sa__11534
};
crate.binding.sub_reset_BANG_ = function sub_reset_BANG_(sa, new_value) {
  cljs.core.swap_BANG_.call(null, sa.atm, cljs.core.assoc_in, sa.path, new_value);
  return new_value
};
crate.binding.sub_swap_BANG_ = function() {
  var sub_swap_BANG_ = null;
  var sub_swap_BANG___2 = function(sa, f) {
    return crate.binding.sub_reset_BANG_.call(null, sa, f.call(null, cljs.core.deref.call(null, sa)))
  };
  var sub_swap_BANG___3 = function(sa, f, x) {
    return crate.binding.sub_reset_BANG_.call(null, sa, f.call(null, cljs.core.deref.call(null, sa), x))
  };
  var sub_swap_BANG___4 = function(sa, f, x, y) {
    return crate.binding.sub_reset_BANG_.call(null, sa, f.call(null, cljs.core.deref.call(null, sa), x, y))
  };
  var sub_swap_BANG___5 = function(sa, f, x, y, z) {
    return crate.binding.sub_reset_BANG_.call(null, sa, f.call(null, cljs.core.deref.call(null, sa), x, y, z))
  };
  var sub_swap_BANG___6 = function() {
    var G__11540__delegate = function(sa, f, x, y, z, more) {
      return crate.binding.sub_reset_BANG_.call(null, sa, cljs.core.apply.call(null, f, cljs.core.deref.call(null, sa), x, y, z, more))
    };
    var G__11540 = function(sa, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__11540__delegate.call(this, sa, f, x, y, z, more)
    };
    G__11540.cljs$lang$maxFixedArity = 5;
    G__11540.cljs$lang$applyTo = function(arglist__11541) {
      var sa = cljs.core.first(arglist__11541);
      var f = cljs.core.first(cljs.core.next(arglist__11541));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11541)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11541))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11541)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11541)))));
      return G__11540__delegate(sa, f, x, y, z, more)
    };
    G__11540.cljs$lang$arity$variadic = G__11540__delegate;
    return G__11540
  }();
  sub_swap_BANG_ = function(sa, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return sub_swap_BANG___2.call(this, sa, f);
      case 3:
        return sub_swap_BANG___3.call(this, sa, f, x);
      case 4:
        return sub_swap_BANG___4.call(this, sa, f, x, y);
      case 5:
        return sub_swap_BANG___5.call(this, sa, f, x, y, z);
      default:
        return sub_swap_BANG___6.cljs$lang$arity$variadic(sa, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  sub_swap_BANG_.cljs$lang$maxFixedArity = 5;
  sub_swap_BANG_.cljs$lang$applyTo = sub_swap_BANG___6.cljs$lang$applyTo;
  sub_swap_BANG_.cljs$lang$arity$2 = sub_swap_BANG___2;
  sub_swap_BANG_.cljs$lang$arity$3 = sub_swap_BANG___3;
  sub_swap_BANG_.cljs$lang$arity$4 = sub_swap_BANG___4;
  sub_swap_BANG_.cljs$lang$arity$5 = sub_swap_BANG___5;
  sub_swap_BANG_.cljs$lang$arity$variadic = sub_swap_BANG___6.cljs$lang$arity$variadic;
  return sub_swap_BANG_
}();
crate.binding.notify = function notify(w, o, v) {
  return cljs.core._notify_watches.call(null, w, o, v)
};
crate.binding.bindable_coll = {};
crate.binding.bindable = {};
crate.binding._value = function _value(this$) {
  if(function() {
    var and__3822__auto____11546 = this$;
    if(and__3822__auto____11546) {
      return this$.crate$binding$bindable$_value$arity$1
    }else {
      return and__3822__auto____11546
    }
  }()) {
    return this$.crate$binding$bindable$_value$arity$1(this$)
  }else {
    var x__2363__auto____11547 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____11548 = crate.binding._value[goog.typeOf(x__2363__auto____11547)];
      if(or__3824__auto____11548) {
        return or__3824__auto____11548
      }else {
        var or__3824__auto____11549 = crate.binding._value["_"];
        if(or__3824__auto____11549) {
          return or__3824__auto____11549
        }else {
          throw cljs.core.missing_protocol.call(null, "bindable.-value", this$);
        }
      }
    }().call(null, this$)
  }
};
crate.binding._on_change = function _on_change(this$, func) {
  if(function() {
    var and__3822__auto____11554 = this$;
    if(and__3822__auto____11554) {
      return this$.crate$binding$bindable$_on_change$arity$2
    }else {
      return and__3822__auto____11554
    }
  }()) {
    return this$.crate$binding$bindable$_on_change$arity$2(this$, func)
  }else {
    var x__2363__auto____11555 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____11556 = crate.binding._on_change[goog.typeOf(x__2363__auto____11555)];
      if(or__3824__auto____11556) {
        return or__3824__auto____11556
      }else {
        var or__3824__auto____11557 = crate.binding._on_change["_"];
        if(or__3824__auto____11557) {
          return or__3824__auto____11557
        }else {
          throw cljs.core.missing_protocol.call(null, "bindable.-on-change", this$);
        }
      }
    }().call(null, this$, func)
  }
};
crate.binding.atom_binding = function(atm, value_func) {
  this.atm = atm;
  this.value_func = value_func
};
crate.binding.atom_binding.cljs$lang$type = true;
crate.binding.atom_binding.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "crate.binding/atom-binding")
};
crate.binding.atom_binding.prototype.crate$binding$bindable$ = true;
crate.binding.atom_binding.prototype.crate$binding$bindable$_value$arity$1 = function(this$) {
  var this__11558 = this;
  return this__11558.value_func.call(null, cljs.core.deref.call(null, this__11558.atm))
};
crate.binding.atom_binding.prototype.crate$binding$bindable$_on_change$arity$2 = function(this$, func) {
  var this__11559 = this;
  return cljs.core.add_watch.call(null, this__11559.atm, cljs.core.gensym.call(null, "atom-binding"), function() {
    return func.call(null, crate.binding._value.call(null, this$))
  })
};
crate.binding.atom_binding;
crate.binding.notifier = function(watches) {
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2147483648
};
crate.binding.notifier.cljs$lang$type = true;
crate.binding.notifier.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "crate.binding/notifier")
};
crate.binding.notifier.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__11560 = this;
  var G__11561__11562 = cljs.core.seq.call(null, this__11560.watches);
  if(G__11561__11562) {
    var G__11564__11566 = cljs.core.first.call(null, G__11561__11562);
    var vec__11565__11567 = G__11564__11566;
    var key__11568 = cljs.core.nth.call(null, vec__11565__11567, 0, null);
    var f__11569 = cljs.core.nth.call(null, vec__11565__11567, 1, null);
    var G__11561__11570 = G__11561__11562;
    var G__11564__11571 = G__11564__11566;
    var G__11561__11572 = G__11561__11570;
    while(true) {
      var vec__11573__11574 = G__11564__11571;
      var key__11575 = cljs.core.nth.call(null, vec__11573__11574, 0, null);
      var f__11576 = cljs.core.nth.call(null, vec__11573__11574, 1, null);
      var G__11561__11577 = G__11561__11572;
      f__11576.call(null, key__11575, this$, oldval, newval);
      var temp__3974__auto____11578 = cljs.core.next.call(null, G__11561__11577);
      if(temp__3974__auto____11578) {
        var G__11561__11579 = temp__3974__auto____11578;
        var G__11582 = cljs.core.first.call(null, G__11561__11579);
        var G__11583 = G__11561__11579;
        G__11564__11571 = G__11582;
        G__11561__11572 = G__11583;
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
crate.binding.notifier.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__11580 = this;
  return this$.watches = cljs.core.assoc.call(null, this__11580.watches, key, f)
};
crate.binding.notifier.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__11581 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__11581.watches, key)
};
crate.binding.notifier;
crate.binding.bound_collection = function(atm, notif, opts, stuff) {
  this.atm = atm;
  this.notif = notif;
  this.opts = opts;
  this.stuff = stuff
};
crate.binding.bound_collection.cljs$lang$type = true;
crate.binding.bound_collection.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "crate.binding/bound-collection")
};
crate.binding.bound_collection.prototype.crate$binding$bindable$ = true;
crate.binding.bound_collection.prototype.crate$binding$bindable$_value$arity$1 = function(this$) {
  var this__11584 = this;
  return cljs.core.map.call(null, "\ufdd0'elem", cljs.core.vals.call(null, this$.stuff))
};
crate.binding.bound_collection.prototype.crate$binding$bindable$_on_change$arity$2 = function(this$, func) {
  var this__11585 = this;
  return cljs.core.add_watch.call(null, this__11585.notif, cljs.core.gensym.call(null, "bound-coll"), function(_11587, _11588, _, p__11586) {
    var vec__11589__11590 = p__11586;
    var event__11591 = cljs.core.nth.call(null, vec__11589__11590, 0, null);
    var el__11592 = cljs.core.nth.call(null, vec__11589__11590, 1, null);
    var v__11593 = cljs.core.nth.call(null, vec__11589__11590, 2, null);
    return func.call(null, event__11591, el__11592, v__11593)
  })
};
crate.binding.bound_collection.prototype.crate$binding$bindable_coll$ = true;
crate.binding.bound_collection;
crate.binding.opt = function opt(bc, k) {
  return bc.opts.call(null, k)
};
crate.binding.bc_add = function bc_add(bc, path, key) {
  var sa__11596 = crate.binding.subatom.call(null, bc.atm, path);
  var elem__11597 = crate.binding.opt.call(null, bc, "\ufdd0'as").call(null, sa__11596);
  bc.stuff = cljs.core.assoc.call(null, bc.stuff, key, cljs.core.ObjMap.fromObject(["\ufdd0'elem", "\ufdd0'subatom"], {"\ufdd0'elem":elem__11597, "\ufdd0'subatom":sa__11596}));
  return crate.binding.notify.call(null, bc.notif, null, cljs.core.PersistentVector.fromArray(["\ufdd0'add", elem__11597, cljs.core.deref.call(null, sa__11596)], true))
};
crate.binding.bc_remove = function bc_remove(bc, key) {
  var notif__11600 = bc.notif;
  var prev__11601 = bc.stuff.call(null, key);
  bc.stuff = cljs.core.dissoc.call(null, bc.stuff, key);
  return crate.binding.notify.call(null, bc.notif, null, cljs.core.PersistentVector.fromArray(["\ufdd0'remove", (new cljs.core.Keyword("\ufdd0'elem")).call(null, prev__11601), null], true))
};
crate.binding.__GT_indexed = function __GT_indexed(coll) {
  if(cljs.core.map_QMARK_.call(null, coll)) {
    return cljs.core.seq.call(null, coll)
  }else {
    if(cljs.core.set_QMARK_.call(null, coll)) {
      return cljs.core.map.call(null, cljs.core.juxt.call(null, cljs.core.identity, cljs.core.identity), coll)
    }else {
      if("\ufdd0'else") {
        return cljs.core.map_indexed.call(null, cljs.core.vector, coll)
      }else {
        return null
      }
    }
  }
};
crate.binding.__GT_keyed = function __GT_keyed(coll, keyfn) {
  return cljs.core.into.call(null, cljs.core.PersistentHashSet.EMPTY, cljs.core.map.call(null, keyfn, crate.binding.__GT_indexed.call(null, coll)))
};
crate.binding.__GT_path = function() {
  var __GT_path__delegate = function(bc, segs) {
    return cljs.core.concat.call(null, function() {
      var or__3824__auto____11603 = crate.binding.opt.call(null, bc, "\ufdd0'path");
      if(cljs.core.truth_(or__3824__auto____11603)) {
        return or__3824__auto____11603
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), segs)
  };
  var __GT_path = function(bc, var_args) {
    var segs = null;
    if(goog.isDef(var_args)) {
      segs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return __GT_path__delegate.call(this, bc, segs)
  };
  __GT_path.cljs$lang$maxFixedArity = 1;
  __GT_path.cljs$lang$applyTo = function(arglist__11604) {
    var bc = cljs.core.first(arglist__11604);
    var segs = cljs.core.rest(arglist__11604);
    return __GT_path__delegate(bc, segs)
  };
  __GT_path.cljs$lang$arity$variadic = __GT_path__delegate;
  return __GT_path
}();
crate.binding.bc_compare = function bc_compare(bc, neue) {
  var prev__11622 = bc.stuff;
  var pset__11623 = cljs.core.into.call(null, cljs.core.PersistentHashSet.EMPTY, cljs.core.keys.call(null, prev__11622));
  var nset__11624 = crate.binding.__GT_keyed.call(null, neue, crate.binding.opt.call(null, bc, "\ufdd0'keyfn"));
  var added__11625 = cljs.core.into.call(null, cljs.core.sorted_set.call(null), clojure.set.difference.call(null, nset__11624, pset__11623));
  var removed__11626 = cljs.core.into.call(null, cljs.core.sorted_set.call(null), clojure.set.difference.call(null, pset__11623, nset__11624));
  var G__11627__11628 = cljs.core.seq.call(null, added__11625);
  if(G__11627__11628) {
    var a__11629 = cljs.core.first.call(null, G__11627__11628);
    var G__11627__11630 = G__11627__11628;
    while(true) {
      crate.binding.bc_add.call(null, bc, a__11629, a__11629);
      var temp__3974__auto____11631 = cljs.core.next.call(null, G__11627__11630);
      if(temp__3974__auto____11631) {
        var G__11627__11632 = temp__3974__auto____11631;
        var G__11639 = cljs.core.first.call(null, G__11627__11632);
        var G__11640 = G__11627__11632;
        a__11629 = G__11639;
        G__11627__11630 = G__11640;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__11633__11634 = cljs.core.seq.call(null, removed__11626);
  if(G__11633__11634) {
    var r__11635 = cljs.core.first.call(null, G__11633__11634);
    var G__11633__11636 = G__11633__11634;
    while(true) {
      crate.binding.bc_remove.call(null, bc, r__11635);
      var temp__3974__auto____11637 = cljs.core.next.call(null, G__11633__11636);
      if(temp__3974__auto____11637) {
        var G__11633__11638 = temp__3974__auto____11637;
        var G__11641 = cljs.core.first.call(null, G__11633__11638);
        var G__11642 = G__11633__11638;
        r__11635 = G__11641;
        G__11633__11636 = G__11642;
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
crate.binding.bound_coll = function() {
  var bound_coll__delegate = function(atm, p__11643) {
    var vec__11658__11659 = p__11643;
    var path__11660 = cljs.core.nth.call(null, vec__11658__11659, 0, null);
    var opts__11661 = cljs.core.nth.call(null, vec__11658__11659, 1, null);
    var vec__11662__11663 = cljs.core.truth_(opts__11661) ? cljs.core.PersistentVector.fromArray([path__11660, opts__11661], true) : cljs.core.PersistentVector.fromArray([null, path__11660], true);
    var path__11664 = cljs.core.nth.call(null, vec__11662__11663, 0, null);
    var opts__11665 = cljs.core.nth.call(null, vec__11662__11663, 1, null);
    var atm__11666 = cljs.core.not.call(null, path__11664) ? atm : crate.binding.subatom.call(null, atm, path__11664);
    var opts__11667 = cljs.core.assoc.call(null, opts__11665, "\ufdd0'path", path__11664);
    var opts__11668 = cljs.core.not.call(null, (new cljs.core.Keyword("\ufdd0'keyfn")).call(null, opts__11667)) ? cljs.core.assoc.call(null, opts__11667, "\ufdd0'keyfn", cljs.core.first) : cljs.core.assoc.call(null, opts__11667, "\ufdd0'keyfn", cljs.core.comp.call(null, (new cljs.core.Keyword("\ufdd0'keyfn")).call(null, opts__11667), cljs.core.second));
    var bc__11669 = new crate.binding.bound_collection(atm__11666, new crate.binding.notifier(null), opts__11668, cljs.core.sorted_map.call(null));
    cljs.core.add_watch.call(null, atm__11666, cljs.core.gensym.call(null, "bound-coll"), function(_11670, _11671, _, neue) {
      return crate.binding.bc_compare.call(null, bc__11669, neue)
    });
    crate.binding.bc_compare.call(null, bc__11669, cljs.core.deref.call(null, atm__11666));
    return bc__11669
  };
  var bound_coll = function(atm, var_args) {
    var p__11643 = null;
    if(goog.isDef(var_args)) {
      p__11643 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return bound_coll__delegate.call(this, atm, p__11643)
  };
  bound_coll.cljs$lang$maxFixedArity = 1;
  bound_coll.cljs$lang$applyTo = function(arglist__11672) {
    var atm = cljs.core.first(arglist__11672);
    var p__11643 = cljs.core.rest(arglist__11672);
    return bound_coll__delegate(atm, p__11643)
  };
  bound_coll.cljs$lang$arity$variadic = bound_coll__delegate;
  return bound_coll
}();
crate.binding.map_bound = function() {
  var map_bound__delegate = function(as, atm, p__11673) {
    var vec__11683__11684 = p__11673;
    var opts__11685 = cljs.core.nth.call(null, vec__11683__11684, 0, null);
    var opts__11686 = cljs.core.assoc.call(null, opts__11685, "\ufdd0'as", as);
    var atm__11687 = cljs.core.not.call(null, (new cljs.core.Keyword("\ufdd0'path")).call(null, opts__11686)) ? atm : crate.binding.subatom.call(null, atm, (new cljs.core.Keyword("\ufdd0'path")).call(null, opts__11686));
    var opts__11688 = cljs.core.not.call(null, (new cljs.core.Keyword("\ufdd0'keyfn")).call(null, opts__11686)) ? cljs.core.assoc.call(null, opts__11686, "\ufdd0'keyfn", cljs.core.first) : cljs.core.assoc.call(null, opts__11686, "\ufdd0'keyfn", cljs.core.comp.call(null, (new cljs.core.Keyword("\ufdd0'keyfn")).call(null, opts__11686), cljs.core.second));
    var bc__11689 = new crate.binding.bound_collection(atm__11687, new crate.binding.notifier(null), opts__11688, cljs.core.sorted_map.call(null));
    cljs.core.add_watch.call(null, atm__11687, cljs.core.gensym.call(null, "bound-coll"), function(_11690, _11691, _, neue) {
      return crate.binding.bc_compare.call(null, bc__11689, neue)
    });
    crate.binding.bc_compare.call(null, bc__11689, cljs.core.deref.call(null, atm__11687));
    return bc__11689
  };
  var map_bound = function(as, atm, var_args) {
    var p__11673 = null;
    if(goog.isDef(var_args)) {
      p__11673 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return map_bound__delegate.call(this, as, atm, p__11673)
  };
  map_bound.cljs$lang$maxFixedArity = 2;
  map_bound.cljs$lang$applyTo = function(arglist__11692) {
    var as = cljs.core.first(arglist__11692);
    var atm = cljs.core.first(cljs.core.next(arglist__11692));
    var p__11673 = cljs.core.rest(cljs.core.next(arglist__11692));
    return map_bound__delegate(as, atm, p__11673)
  };
  map_bound.cljs$lang$arity$variadic = map_bound__delegate;
  return map_bound
}();
crate.binding.binding_QMARK_ = function binding_QMARK_(b) {
  var G__11696__11697 = b;
  if(G__11696__11697) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____11698 = null;
      if(cljs.core.truth_(or__3824__auto____11698)) {
        return or__3824__auto____11698
      }else {
        return G__11696__11697.crate$binding$bindable$
      }
    }())) {
      return true
    }else {
      if(!G__11696__11697.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, crate.binding.bindable, G__11696__11697)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, crate.binding.bindable, G__11696__11697)
  }
};
crate.binding.binding_coll_QMARK_ = function binding_coll_QMARK_(b) {
  var G__11702__11703 = b;
  if(G__11702__11703) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____11704 = null;
      if(cljs.core.truth_(or__3824__auto____11704)) {
        return or__3824__auto____11704
      }else {
        return G__11702__11703.crate$binding$bindable_coll$
      }
    }())) {
      return true
    }else {
      if(!G__11702__11703.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, crate.binding.bindable_coll, G__11702__11703)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, crate.binding.bindable_coll, G__11702__11703)
  }
};
crate.binding.value = function value(b) {
  return crate.binding._value.call(null, b)
};
crate.binding.index = function index(sub_atom) {
  return cljs.core.last.call(null, sub_atom.path)
};
crate.binding.on_change = function on_change(b, func) {
  return crate.binding._on_change.call(null, b, func)
};
crate.binding.bound = function() {
  var bound__delegate = function(atm, p__11705) {
    var vec__11711__11712 = p__11705;
    var func__11713 = cljs.core.nth.call(null, vec__11711__11712, 0, null);
    var func__11715 = function() {
      var or__3824__auto____11714 = func__11713;
      if(cljs.core.truth_(or__3824__auto____11714)) {
        return or__3824__auto____11714
      }else {
        return cljs.core.identity
      }
    }();
    return new crate.binding.atom_binding(atm, func__11715)
  };
  var bound = function(atm, var_args) {
    var p__11705 = null;
    if(goog.isDef(var_args)) {
      p__11705 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return bound__delegate.call(this, atm, p__11705)
  };
  bound.cljs$lang$maxFixedArity = 1;
  bound.cljs$lang$applyTo = function(arglist__11716) {
    var atm = cljs.core.first(arglist__11716);
    var p__11705 = cljs.core.rest(arglist__11716);
    return bound__delegate(atm, p__11705)
  };
  bound.cljs$lang$arity$variadic = bound__delegate;
  return bound
}();
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.distance = function(box, coord) {
  if(coord.x >= box.left && coord.x <= box.right) {
    if(coord.y >= box.top && coord.y <= box.bottom) {
      return 0
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom
  }
  if(coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right
  }
  return goog.math.Coordinate.distance(coord, new goog.math.Coordinate(coord.x < box.left ? box.left : box.right, coord.y < box.top ? box.top : box.bottom))
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property)
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    if(opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node
    }else {
      doc = goog.dom.getOwnerDocument(opt_node)
    }
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute" || positionStyle == "relative")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var documentElement = dom.getDocument().documentElement;
  var scrollEl = dom.getDocumentScrollElement();
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && el != body && el != documentElement && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x)
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  visibleRect.left = Math.max(visibleRect.left, scrollX);
  visibleRect.top = Math.max(visibleRect.top, scrollY);
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  if(opt_center) {
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2
  }else {
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return goog.style.getSizeWithDisplay_(element)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var size = goog.style.getSizeWithDisplay_(element);
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return size
};
goog.style.getSizeWithDisplay_ = function(element) {
  var offsetWidth = element.offsetWidth;
  var offsetHeight = element.offsetHeight;
  var webkitOffsetsZero = goog.userAgent.WEBKIT && !offsetWidth && !offsetHeight;
  if((!goog.isDef(offsetWidth) || webkitOffsetsZero) && element.getBoundingClientRect) {
    var clientRect = goog.style.getBoundingClientRect_(element);
    return new goog.math.Size(clientRect.right - clientRect.left, clientRect.bottom - clientRect.top)
  }
  return new goog.math.Size(offsetWidth, offsetHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    var propToSet = goog.userAgent.WEBKIT ? "innerText" : "innerHTML";
    element[propToSet] = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = size.width + "px";
  style.height = size.height + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function(opt_className) {
  var outerDiv = goog.dom.createElement("div");
  if(opt_className) {
    outerDiv.className = opt_className
  }
  outerDiv.style.cssText = "visiblity:hidden;overflow:auto;" + "position:absolute;top:0;width:100px;height:100px";
  var innerDiv = goog.dom.createElement("div");
  goog.style.setSize(innerDiv, "200px", "200px");
  outerDiv.appendChild(innerDiv);
  goog.dom.appendChild(goog.dom.getDocument().body, outerDiv);
  var width = outerDiv.offsetWidth - outerDiv.clientWidth;
  goog.dom.removeNode(outerDiv);
  return width
};
goog.provide("crate.compiler");
goog.require("cljs.core");
goog.require("crate.binding");
goog.require("clojure.string");
goog.require("goog.style");
goog.require("goog.dom");
crate.compiler.xmlns = cljs.core.ObjMap.fromObject(["\ufdd0'xhtml", "\ufdd0'svg"], {"\ufdd0'xhtml":"http://www.w3.org/1999/xhtml", "\ufdd0'svg":"http://www.w3.org/2000/svg"});
crate.compiler.group_id = cljs.core.atom.call(null, 0);
crate.compiler.bindings = cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY);
crate.compiler.capture_binding = function capture_binding(tag, b) {
  return cljs.core.swap_BANG_.call(null, crate.compiler.bindings, cljs.core.conj, cljs.core.PersistentVector.fromArray([tag, b], true))
};
crate.compiler.as_content = function as_content(parent, content) {
  var G__11232__11233 = cljs.core.seq.call(null, content);
  if(G__11232__11233) {
    var c__11234 = cljs.core.first.call(null, G__11232__11233);
    var G__11232__11235 = G__11232__11233;
    while(true) {
      var child__11236 = c__11234 == null ? null : cljs.core.map_QMARK_.call(null, c__11234) ? function() {
        throw"Maps cannot be used as content";
      }() : cljs.core.string_QMARK_.call(null, c__11234) ? goog.dom.createTextNode(c__11234) : cljs.core.vector_QMARK_.call(null, c__11234) ? crate.compiler.elem_factory.call(null, c__11234) : cljs.core.seq_QMARK_.call(null, c__11234) ? as_content.call(null, parent, c__11234) : cljs.core.truth_(crate.binding.binding_coll_QMARK_.call(null, c__11234)) ? function() {
        crate.compiler.capture_binding.call(null, "\ufdd0'coll", c__11234);
        return as_content.call(null, parent, cljs.core.PersistentVector.fromArray([crate.binding.value.call(null, c__11234)], true))
      }() : cljs.core.truth_(crate.binding.binding_QMARK_.call(null, c__11234)) ? function() {
        crate.compiler.capture_binding.call(null, "\ufdd0'text", c__11234);
        return as_content.call(null, parent, cljs.core.PersistentVector.fromArray([crate.binding.value.call(null, c__11234)], true))
      }() : cljs.core.truth_(c__11234.nodeName) ? c__11234 : cljs.core.truth_(c__11234.get) ? c__11234.get(0) : "\ufdd0'else" ? goog.dom.createTextNode([cljs.core.str(c__11234)].join("")) : null;
      if(cljs.core.truth_(child__11236)) {
        goog.dom.appendChild(parent, child__11236)
      }else {
      }
      var temp__3974__auto____11237 = cljs.core.next.call(null, G__11232__11235);
      if(temp__3974__auto____11237) {
        var G__11232__11238 = temp__3974__auto____11237;
        var G__11239 = cljs.core.first.call(null, G__11232__11238);
        var G__11240 = G__11232__11238;
        c__11234 = G__11239;
        G__11232__11235 = G__11240;
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
crate.compiler.dom_binding = function() {
  var method_table__2537__auto____11241 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var prefer_table__2538__auto____11242 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var method_cache__2539__auto____11243 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var cached_hierarchy__2540__auto____11244 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var hierarchy__2541__auto____11245 = cljs.core._lookup.call(null, cljs.core.ObjMap.EMPTY, "\ufdd0'hierarchy", cljs.core.global_hierarchy);
  return new cljs.core.MultiFn("dom-binding", function(type, _11246, _) {
    return type
  }, "\ufdd0'default", hierarchy__2541__auto____11245, method_table__2537__auto____11241, prefer_table__2538__auto____11242, method_cache__2539__auto____11243, cached_hierarchy__2540__auto____11244)
}();
cljs.core._add_method.call(null, crate.compiler.dom_binding, "\ufdd0'text", function(_, b, elem) {
  return crate.binding.on_change.call(null, b, function(v) {
    goog.dom.removeChildren(elem);
    return crate.compiler.as_content.call(null, elem, cljs.core.PersistentVector.fromArray([v], true))
  })
});
cljs.core._add_method.call(null, crate.compiler.dom_binding, "\ufdd0'attr", function(_, p__11247, elem) {
  var vec__11248__11249 = p__11247;
  var k__11250 = cljs.core.nth.call(null, vec__11248__11249, 0, null);
  var b__11251 = cljs.core.nth.call(null, vec__11248__11249, 1, null);
  return crate.binding.on_change.call(null, b__11251, function(v) {
    return crate.compiler.dom_attr.call(null, elem, k__11250, v)
  })
});
cljs.core._add_method.call(null, crate.compiler.dom_binding, "\ufdd0'style", function(_, p__11252, elem) {
  var vec__11253__11254 = p__11252;
  var k__11255 = cljs.core.nth.call(null, vec__11253__11254, 0, null);
  var b__11256 = cljs.core.nth.call(null, vec__11253__11254, 1, null);
  return crate.binding.on_change.call(null, b__11256, function(v) {
    if(cljs.core.truth_(k__11255)) {
      return crate.compiler.dom_style.call(null, elem, k__11255, v)
    }else {
      return crate.compiler.dom_style.call(null, elem, v)
    }
  })
});
crate.compiler.dom_add = function dom_add(bc, parent, elem, v) {
  var temp__3971__auto____11259 = crate.binding.opt.call(null, bc, "\ufdd0'add");
  if(cljs.core.truth_(temp__3971__auto____11259)) {
    var adder__11260 = temp__3971__auto____11259;
    return adder__11260.call(null, parent, elem, v)
  }else {
    return goog.dom.appendChild(parent, elem)
  }
};
crate.compiler.dom_remove = function dom_remove(bc, elem) {
  var temp__3971__auto____11263 = crate.binding.opt.call(null, bc, "\ufdd0'remove");
  if(cljs.core.truth_(temp__3971__auto____11263)) {
    var remover__11264 = temp__3971__auto____11263;
    return remover__11264.call(null, elem)
  }else {
    return goog.dom.removeNode(elem)
  }
};
cljs.core._add_method.call(null, crate.compiler.dom_binding, "\ufdd0'coll", function(_, bc, parent) {
  return crate.binding.on_change.call(null, bc, function(type, elem, v) {
    var pred__11265__11268 = cljs.core._EQ_;
    var expr__11266__11269 = type;
    if(pred__11265__11268.call(null, "\ufdd0'add", expr__11266__11269)) {
      return crate.compiler.dom_add.call(null, bc, parent, elem, v)
    }else {
      if(pred__11265__11268.call(null, "\ufdd0'remove", expr__11266__11269)) {
        return crate.compiler.dom_remove.call(null, bc, elem)
      }else {
        throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(expr__11266__11269)].join(""));
      }
    }
  })
});
crate.compiler.handle_bindings = function handle_bindings(bs, elem) {
  var G__11289__11290 = cljs.core.seq.call(null, bs);
  if(G__11289__11290) {
    var G__11292__11294 = cljs.core.first.call(null, G__11289__11290);
    var vec__11293__11295 = G__11292__11294;
    var type__11296 = cljs.core.nth.call(null, vec__11293__11295, 0, null);
    var b__11297 = cljs.core.nth.call(null, vec__11293__11295, 1, null);
    var G__11289__11298 = G__11289__11290;
    var G__11292__11299 = G__11292__11294;
    var G__11289__11300 = G__11289__11298;
    while(true) {
      var vec__11301__11302 = G__11292__11299;
      var type__11303 = cljs.core.nth.call(null, vec__11301__11302, 0, null);
      var b__11304 = cljs.core.nth.call(null, vec__11301__11302, 1, null);
      var G__11289__11305 = G__11289__11300;
      crate.compiler.dom_binding.call(null, type__11303, b__11304, elem);
      var temp__3974__auto____11306 = cljs.core.next.call(null, G__11289__11305);
      if(temp__3974__auto____11306) {
        var G__11289__11307 = temp__3974__auto____11306;
        var G__11308 = cljs.core.first.call(null, G__11289__11307);
        var G__11309 = G__11289__11307;
        G__11292__11299 = G__11308;
        G__11289__11300 = G__11309;
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
crate.compiler.dom_style = function() {
  var dom_style = null;
  var dom_style__2 = function(elem, v) {
    if(cljs.core.string_QMARK_.call(null, v)) {
      elem.setAttribute("style", v)
    }else {
      if(cljs.core.map_QMARK_.call(null, v)) {
        var G__11330__11331 = cljs.core.seq.call(null, v);
        if(G__11330__11331) {
          var G__11333__11335 = cljs.core.first.call(null, G__11330__11331);
          var vec__11334__11336 = G__11333__11335;
          var k__11337 = cljs.core.nth.call(null, vec__11334__11336, 0, null);
          var v__11338 = cljs.core.nth.call(null, vec__11334__11336, 1, null);
          var G__11330__11339 = G__11330__11331;
          var G__11333__11340 = G__11333__11335;
          var G__11330__11341 = G__11330__11339;
          while(true) {
            var vec__11342__11343 = G__11333__11340;
            var k__11344 = cljs.core.nth.call(null, vec__11342__11343, 0, null);
            var v__11345 = cljs.core.nth.call(null, vec__11342__11343, 1, null);
            var G__11330__11346 = G__11330__11341;
            dom_style.call(null, elem, k__11344, v__11345);
            var temp__3974__auto____11347 = cljs.core.next.call(null, G__11330__11346);
            if(temp__3974__auto____11347) {
              var G__11330__11348 = temp__3974__auto____11347;
              var G__11350 = cljs.core.first.call(null, G__11330__11348);
              var G__11351 = G__11330__11348;
              G__11333__11340 = G__11350;
              G__11330__11341 = G__11351;
              continue
            }else {
            }
            break
          }
        }else {
        }
      }else {
        if(cljs.core.truth_(crate.binding.binding_QMARK_.call(null, v))) {
          crate.compiler.capture_binding.call(null, "\ufdd0'style", cljs.core.PersistentVector.fromArray([null, v], true));
          dom_style.call(null, elem, crate.binding.value.call(null, v))
        }else {
        }
      }
    }
    return elem
  };
  var dom_style__3 = function(elem, k, v) {
    var v__11349 = cljs.core.truth_(crate.binding.binding_QMARK_.call(null, v)) ? function() {
      crate.compiler.capture_binding.call(null, "\ufdd0'style", cljs.core.PersistentVector.fromArray([k, v], true));
      return crate.binding.value.call(null, v)
    }() : v;
    return goog.style.setStyle(elem, cljs.core.name.call(null, k), v__11349)
  };
  dom_style = function(elem, k, v) {
    switch(arguments.length) {
      case 2:
        return dom_style__2.call(this, elem, k);
      case 3:
        return dom_style__3.call(this, elem, k, v)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dom_style.cljs$lang$arity$2 = dom_style__2;
  dom_style.cljs$lang$arity$3 = dom_style__3;
  return dom_style
}();
crate.compiler.dom_attr = function() {
  var dom_attr = null;
  var dom_attr__2 = function(elem, attrs) {
    if(cljs.core.truth_(elem)) {
      if(!cljs.core.map_QMARK_.call(null, attrs)) {
        return elem.getAttribute(cljs.core.name.call(null, attrs))
      }else {
        var G__11372__11373 = cljs.core.seq.call(null, attrs);
        if(G__11372__11373) {
          var G__11375__11377 = cljs.core.first.call(null, G__11372__11373);
          var vec__11376__11378 = G__11375__11377;
          var k__11379 = cljs.core.nth.call(null, vec__11376__11378, 0, null);
          var v__11380 = cljs.core.nth.call(null, vec__11376__11378, 1, null);
          var G__11372__11381 = G__11372__11373;
          var G__11375__11382 = G__11375__11377;
          var G__11372__11383 = G__11372__11381;
          while(true) {
            var vec__11384__11385 = G__11375__11382;
            var k__11386 = cljs.core.nth.call(null, vec__11384__11385, 0, null);
            var v__11387 = cljs.core.nth.call(null, vec__11384__11385, 1, null);
            var G__11372__11388 = G__11372__11383;
            dom_attr.call(null, elem, k__11386, v__11387);
            var temp__3974__auto____11389 = cljs.core.next.call(null, G__11372__11388);
            if(temp__3974__auto____11389) {
              var G__11372__11390 = temp__3974__auto____11389;
              var G__11392 = cljs.core.first.call(null, G__11372__11390);
              var G__11393 = G__11372__11390;
              G__11375__11382 = G__11392;
              G__11372__11383 = G__11393;
              continue
            }else {
            }
            break
          }
        }else {
        }
        return elem
      }
    }else {
      return null
    }
  };
  var dom_attr__3 = function(elem, k, v) {
    if(cljs.core._EQ_.call(null, k, "\ufdd0'style")) {
      crate.compiler.dom_style.call(null, elem, v)
    }else {
      var v__11391 = cljs.core.truth_(crate.binding.binding_QMARK_.call(null, v)) ? function() {
        crate.compiler.capture_binding.call(null, "\ufdd0'attr", cljs.core.PersistentVector.fromArray([k, v], true));
        return crate.binding.value.call(null, v)
      }() : v;
      elem.setAttribute(cljs.core.name.call(null, k), v__11391)
    }
    return elem
  };
  dom_attr = function(elem, k, v) {
    switch(arguments.length) {
      case 2:
        return dom_attr__2.call(this, elem, k);
      case 3:
        return dom_attr__3.call(this, elem, k, v)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dom_attr.cljs$lang$arity$2 = dom_attr__2;
  dom_attr.cljs$lang$arity$3 = dom_attr__3;
  return dom_attr
}();
crate.compiler.re_tag = /([^\s\.#]+)(?:#([^\s\.#]+))?(?:\.([^\s#]+))?/;
crate.compiler.normalize_map_attrs = function normalize_map_attrs(map_attrs) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__11400) {
    var vec__11401__11402 = p__11400;
    var n__11403 = cljs.core.nth.call(null, vec__11401__11402, 0, null);
    var v__11404 = cljs.core.nth.call(null, vec__11401__11402, 1, null);
    if(v__11404 === true) {
      return cljs.core.PersistentVector.fromArray([n__11403, cljs.core.name.call(null, n__11403)], true)
    }else {
      return cljs.core.PersistentVector.fromArray([n__11403, v__11404], true)
    }
  }, cljs.core.filter.call(null, cljs.core.comp.call(null, cljs.core.boolean$, cljs.core.second), map_attrs)))
};
crate.compiler.normalize_element = function normalize_element(p__11405) {
  var vec__11431__11432 = p__11405;
  var tag__11433 = cljs.core.nth.call(null, vec__11431__11432, 0, null);
  var content__11434 = cljs.core.nthnext.call(null, vec__11431__11432, 1);
  if(!function() {
    var or__3824__auto____11435 = cljs.core.keyword_QMARK_.call(null, tag__11433);
    if(or__3824__auto____11435) {
      return or__3824__auto____11435
    }else {
      var or__3824__auto____11436 = cljs.core.symbol_QMARK_.call(null, tag__11433);
      if(or__3824__auto____11436) {
        return or__3824__auto____11436
      }else {
        return cljs.core.string_QMARK_.call(null, tag__11433)
      }
    }
  }()) {
    throw[cljs.core.str(tag__11433), cljs.core.str(" is not a valid tag name.")].join("");
  }else {
  }
  var vec__11437__11439 = cljs.core.re_matches.call(null, crate.compiler.re_tag, cljs.core.name.call(null, tag__11433));
  var ___11440 = cljs.core.nth.call(null, vec__11437__11439, 0, null);
  var tag__11441 = cljs.core.nth.call(null, vec__11437__11439, 1, null);
  var id__11442 = cljs.core.nth.call(null, vec__11437__11439, 2, null);
  var class__11443 = cljs.core.nth.call(null, vec__11437__11439, 3, null);
  var vec__11438__11450 = function() {
    var vec__11444__11445 = clojure.string.split.call(null, tag__11441, /:/);
    var nsp__11446 = cljs.core.nth.call(null, vec__11444__11445, 0, null);
    var t__11447 = cljs.core.nth.call(null, vec__11444__11445, 1, null);
    var ns_xmlns__11448 = crate.compiler.xmlns.call(null, cljs.core.keyword.call(null, nsp__11446));
    if(cljs.core.truth_(t__11447)) {
      return cljs.core.PersistentVector.fromArray([function() {
        var or__3824__auto____11449 = ns_xmlns__11448;
        if(cljs.core.truth_(or__3824__auto____11449)) {
          return or__3824__auto____11449
        }else {
          return nsp__11446
        }
      }(), t__11447], true)
    }else {
      return cljs.core.PersistentVector.fromArray([(new cljs.core.Keyword("\ufdd0'xhtml")).call(null, crate.compiler.xmlns), nsp__11446], true)
    }
  }();
  var nsp__11451 = cljs.core.nth.call(null, vec__11438__11450, 0, null);
  var tag__11452 = cljs.core.nth.call(null, vec__11438__11450, 1, null);
  var tag_attrs__11454 = cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.filter.call(null, function(p1__11394_SHARP_) {
    return!(cljs.core.second.call(null, p1__11394_SHARP_) == null)
  }, cljs.core.ObjMap.fromObject(["\ufdd0'id", "\ufdd0'class"], {"\ufdd0'id":function() {
    var or__3824__auto____11453 = id__11442;
    if(cljs.core.truth_(or__3824__auto____11453)) {
      return or__3824__auto____11453
    }else {
      return null
    }
  }(), "\ufdd0'class":cljs.core.truth_(class__11443) ? clojure.string.replace.call(null, class__11443, /\./, " ") : null})));
  var map_attrs__11455 = cljs.core.first.call(null, content__11434);
  if(cljs.core.map_QMARK_.call(null, map_attrs__11455)) {
    return cljs.core.PersistentVector.fromArray([nsp__11451, tag__11452, cljs.core.merge.call(null, tag_attrs__11454, crate.compiler.normalize_map_attrs.call(null, map_attrs__11455)), cljs.core.next.call(null, content__11434)], true)
  }else {
    return cljs.core.PersistentVector.fromArray([nsp__11451, tag__11452, tag_attrs__11454, content__11434], true)
  }
};
crate.compiler.parse_content = function parse_content(elem, content) {
  var attrs__11457 = cljs.core.first.call(null, content);
  if(cljs.core.map_QMARK_.call(null, attrs__11457)) {
    crate.compiler.dom_attr.call(null, elem, attrs__11457);
    return cljs.core.rest.call(null, content)
  }else {
    return content
  }
};
crate.compiler.create_elem = cljs.core.truth_(document.createElementNS) ? function(nsp, tag) {
  return document.createElementNS(nsp, tag)
} : function(_, tag) {
  return document.createElement(tag)
};
crate.compiler.elem_factory = function elem_factory(tag_def) {
  var bindings11468__11469 = crate.compiler.bindings;
  try {
    crate.compiler.bindings = cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY);
    var vec__11471__11472 = crate.compiler.normalize_element.call(null, tag_def);
    var nsp__11473 = cljs.core.nth.call(null, vec__11471__11472, 0, null);
    var tag__11474 = cljs.core.nth.call(null, vec__11471__11472, 1, null);
    var attrs__11475 = cljs.core.nth.call(null, vec__11471__11472, 2, null);
    var content__11476 = cljs.core.nth.call(null, vec__11471__11472, 3, null);
    var elem__11477 = crate.compiler.create_elem.call(null, nsp__11473, tag__11474);
    crate.compiler.dom_attr.call(null, elem__11477, attrs__11475);
    crate.compiler.as_content.call(null, elem__11477, content__11476);
    crate.compiler.handle_bindings.call(null, cljs.core.deref.call(null, crate.compiler.bindings), elem__11477);
    return elem__11477
  }finally {
    crate.compiler.bindings = bindings11468__11469
  }
};
crate.compiler.add_optional_attrs = function add_optional_attrs(func) {
  return function() {
    var G__11486__delegate = function(args) {
      if(cljs.core.map_QMARK_.call(null, cljs.core.first.call(null, args))) {
        var vec__11482__11483 = cljs.core.apply.call(null, func, cljs.core.rest.call(null, args));
        var tag__11484 = cljs.core.nth.call(null, vec__11482__11483, 0, null);
        var body__11485 = cljs.core.nthnext.call(null, vec__11482__11483, 1);
        if(cljs.core.map_QMARK_.call(null, cljs.core.first.call(null, body__11485))) {
          return cljs.core.apply.call(null, cljs.core.vector, tag__11484, cljs.core.merge.call(null, cljs.core.first.call(null, body__11485), cljs.core.first.call(null, args)), cljs.core.rest.call(null, body__11485))
        }else {
          return cljs.core.apply.call(null, cljs.core.vector, tag__11484, cljs.core.first.call(null, args), body__11485)
        }
      }else {
        return cljs.core.apply.call(null, func, args)
      }
    };
    var G__11486 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11486__delegate.call(this, args)
    };
    G__11486.cljs$lang$maxFixedArity = 0;
    G__11486.cljs$lang$applyTo = function(arglist__11487) {
      var args = cljs.core.seq(arglist__11487);
      return G__11486__delegate(args)
    };
    G__11486.cljs$lang$arity$variadic = G__11486__delegate;
    return G__11486
  }()
};
goog.provide("crate.core");
goog.require("cljs.core");
goog.require("crate.util");
goog.require("crate.compiler");
crate.core.group_id = cljs.core.atom.call(null, 0);
crate.core.html = function() {
  var html__delegate = function(tags) {
    var res__11223 = cljs.core.map.call(null, crate.compiler.elem_factory, tags);
    if(cljs.core.truth_(cljs.core.second.call(null, res__11223))) {
      return res__11223
    }else {
      return cljs.core.first.call(null, res__11223)
    }
  };
  var html = function(var_args) {
    var tags = null;
    if(goog.isDef(var_args)) {
      tags = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return html__delegate.call(this, tags)
  };
  html.cljs$lang$maxFixedArity = 0;
  html.cljs$lang$applyTo = function(arglist__11224) {
    var tags = cljs.core.seq(arglist__11224);
    return html__delegate(tags)
  };
  html.cljs$lang$arity$variadic = html__delegate;
  return html
}();
crate.core.h = crate.util.escape_html;
goog.provide("info.safariextension");
goog.require("cljs.core");
goog.require("clojure.browser.dom");
goog.require("crate.core");
info.safariextension.open_browser_window = function open_browser_window(url) {
  safari.application.openBrowserWindow();
  alert(window.self.name);
  return window.self.close()
};
info.safariextension.default$ = function default$() {
  var browser_window__560186 = safari.application.activeBrowserWindow;
  var tab__560187 = browser_window__560186.openTab();
  return tab__560187.url = [cljs.core.str(safari.extension.baseURI), cljs.core.str("black.html")].join("")
};
info.safariextension.handle_toolbar_item_clicked = function handle_toolbar_item_clicked(event) {
  if(cljs.core._EQ_.call(null, "black", event.command)) {
    return info.safariextension.open_browser_window.call(null, [cljs.core.str(safari.extension.baseURI), cljs.core.str("black.html")].join(""))
  }else {
    return null
  }
};
goog.exportSymbol("info.safariextension.handle_toolbar_item_clicked", info.safariextension.handle_toolbar_item_clicked);
safari.application.addEventListener("command", info.safariextension.handle_toolbar_item_clicked, false);
goog.provide("info.bar");
goog.require("cljs.core");
goog.require("clojure.browser.dom");
goog.require("crate.core");
info.bar.open_browser_window = function open_browser_window(url) {
  safari.application.openBrowserWindow();
  alert(window.self.name);
  return window.self.close()
};
goog.provide("info.play");
goog.require("cljs.core");
