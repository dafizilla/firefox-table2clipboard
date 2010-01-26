if (typeof(table2clipboard) == "undefined") {
    var table2clipboard = {};
}

table2clipboard.common = {};

(function() {
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
        case '\xA0':
            return "&nbsp;";
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
        default:
            return ch;
    }
    // make happy lint
    return ch;
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
