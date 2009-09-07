/**
 * Author   : Davide Ficano
 * Date     : 26-Dec-05
 */

if (typeof(table2clipboard) == "undefined") {
    var table2clipboard = {};
}

table2clipboard.common = {};

(function() {
// Under mozilla composer <stringbundleset id="stringbundleset"> isn't available
// so we use nsIStringBundleService

var locale = Components.classes["@mozilla.org/intl/stringbundle;1"]
    .getService(Components.interfaces.nsIStringBundleService)
    .createBundle("chrome://t2c/locale/t2c.properties");

this.isOSWin = function() {
    return top.window.navigator.platform.indexOf("Win") >= 0;
}

this.getLocalizedMessage = function(msg) {
    return locale.GetStringFromName(msg);
}

this.getFormattedMessage = function(msg, ar) {
    return locale.formatStringFromName(msg, ar, ar.length);
}

this.getObserverService = function () {
    return Components.classes["@mozilla.org/observer-service;1"]
        .getService(Components.interfaces.nsIObserverService);
}

this.loadExternalUrl = function(url) {
    var uri = Components.classes["@mozilla.org/network/standard-url;1"]
                .createInstance(Components.interfaces.nsIURI);
    uri.spec = url;
    var prot = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                .getService(Components.interfaces.nsIExternalProtocolService);
    prot.loadUrl(uri);
}

this.log = function(message) {
    Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService)
            .logStringMessage(message);
}

this.htmlEncode = function(s, isAttValue, isCanonical) {
    if (typeof (isAttValue) == "undefined" || isAttValue == null) {
        isAttValue = true;
    }
    if (typeof (isCanonical) == "undefined" || isCanonical == null) {
        isCanonical = false;
    }
    var len = s ? s.length : 0;
    var str = "";
    for (var i = 0; i < len; i++) {
        str += this.getEntity(s.charAt(i), isAttValue, isCanonical);
    }
    return str;
}

this.getEntity = function(ch, isAttValue, isCanonical) {
    switch (ch) {
        case '<':
            return "&lt;";
        case '>':
            return "&gt;";
        case '&':
            return "&amp;";
        case '"':
            // A '"' that appears in character data
            // does not need to be escaped.
            return isAttValue ? "&quot;" : "\"";
        case '\r':
            // If CR is part of the document's content, it
            // must not be printed as a literal otherwise
            // it would be normalized to LF when the document
            // is reparsed.
            return "&#xD;";
        case '\n':
            if (isCanonical) {
                return "&#xA;";
            }
            // else, default print char
        case '\xA0':
            return "&nbsp;";
        default:
            return ch;
    }
    // make happy lint
    return ch;
}

this.isTargetATextBox = function(node) {
    if (!node || node.nodeType != Node.ELEMENT_NODE)
        return false;

    if (node.localName.toUpperCase() == "INPUT") {
        var attrib = "";
        var type = node.getAttribute("type");

        if (type)
            attrib = type.toUpperCase();

        return( (attrib != "IMAGE") &&
                (attrib != "CHECKBOX") &&
                (attrib != "RADIO") &&
                (attrib != "SUBMIT") &&
                (attrib != "RESET") &&
                (attrib != "FILE") &&
                (attrib != "HIDDEN") &&
                (attrib != "RESET") &&
                (attrib != "BUTTON") &&
                (attrib != "PASSWORD") );
    } else  {
        return(node.localName.toUpperCase() == "TEXTAREA");
    }
}

this.getTextNodeContent = function(node) {
    var str = "";
    var nl = node.childNodes;

    for (var i = 0; i < nl.length; i++) {
        if (nl[i].nodeType == Node.ELEMENT_NODE) {
            var style = nl[i].ownerDocument.defaultView.getComputedStyle(nl[i], null);
            if (style.getPropertyValue("display") == "none") {
                continue;
            }
        }
        if (nl[i].nodeType == Node.TEXT_NODE) {
            str += nl[i].nodeValue;
        } else if (this.isTargetATextBox(nl[i])) {
            // replace all new lines/carriage returns with a single blank space
            str += nl[i].value.replace(/(\r\n|\r|\n)+/g, " ");
            // ignore children
            // textareas can contain initial text as node
            continue;
        }
        if (nl[i].hasChildNodes()) {
            str += this.getTextNodeContent(nl[i]);
        }
    }
    return str;
}

this.trim = function(str) {
    var retStr = "";

    if (str) {
        var re = /^[ \s]+/g;
        retStr = str.replace(re, "");
        re = /[ \s]+$/g;
        retStr = retStr.replace(re, "");

        // remove inner tabs
        var re = /[\t\n\r]+/g;
        retStr = retStr.replace(re, "");
    }
    return retStr;
}
}).apply(table2clipboard.common);
