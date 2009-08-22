/**
 * Author   : Davide Ficano
 * Date     : 26-Dec-05
 */

// Under mozilla composer <stringbundleset id="stringbundleset"> isn't available
// so we use nsIStringBundleService

Table2ClipCommon.locale = Components.classes["@mozilla.org/intl/stringbundle;1"]
    .getService(Components.interfaces.nsIStringBundleService)
    .createBundle("chrome://t2c/locale/t2c.properties");

function Table2ClipCommon() {
    return this;
}

Table2ClipCommon.isOSWin = function() {
    return top.window.navigator.platform.indexOf("Win") >= 0;
}

Table2ClipCommon.getLocalizedMessage = function(msg) {
    return Table2ClipCommon.locale.GetStringFromName(msg);
}

Table2ClipCommon.getFormattedMessage = function(msg, ar) {
    return Table2ClipCommon.locale.formatStringFromName(msg, ar, ar.length);
}

Table2ClipCommon.getObserverService = function () {
    const CONTRACTID_OBSERVER = "@mozilla.org/observer-service;1";
    const nsObserverService = Components.interfaces.nsIObserverService;

    return Components.classes[CONTRACTID_OBSERVER].getService(nsObserverService);
}

Table2ClipCommon.loadExternalUrl = function(url) {
    var uri = Components.classes["@mozilla.org/network/standard-url;1"]
                .createInstance(Components.interfaces.nsIURI);
    uri.spec = url;
    var prot = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                .getService(Components.interfaces.nsIExternalProtocolService);
    prot.loadUrl(uri);
}

Table2ClipCommon.log = function(message) {
    Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService)
            .logStringMessage(message);
}

Table2ClipCommon.htmlEncode = function(txt) {
    return txt.replace(/[<>&"]/g, Table2ClipCommon.getEntity);
}
    
Table2ClipCommon.getEntity = function(ch)
{
    switch (ch) {
        case "<":
            return "&lt;";
        case ">":
            return "&gt;";
        case "&":
            return "&amp;";
        case "\"":
            return "&quot;";
        default:
            return ch;
    }
}

Table2ClipCommon.isTargetATextBox = function(node) {
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

Table2ClipCommon.getTextNodeContent = function(node) {
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
        } else if (Table2ClipCommon.isTargetATextBox(nl[i])) {
            // replace all new lines/carriage returns with a single blank space
            str += nl[i].value.replace(/(\r\n|\r|\n)+/g, " ");
            // ignore children
            // textareas can contain initial text as node
            continue;
        }
        if (nl[i].hasChildNodes()) {
            str += Table2ClipCommon.getTextNodeContent(nl[i]);
        }
    }
    return str;
}