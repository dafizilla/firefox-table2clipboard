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

