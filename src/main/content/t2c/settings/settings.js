/**
 * Author: Davide Ficano
 * Date  : 26-Dec-05
 */
var gTable2ClipSettings = {
    onLoad : function() {
        gTable2ClipSettings.prefs = new Table2ClipPrefs();
        gTable2ClipSettings.initControls();
        window.sizeToContent();
    },

    onAccept : function() {
        var isValid = true;
        var thiz = gTable2ClipSettings;
        try {
            var format = new Table2ClipFormat();
            format.rowSep = thiz.escape(thiz.oRowSep.value);
            format.columnSep = thiz.escape(thiz.oColumnSep.value);
            format.appendRowSepAtEnd = thiz.oAppendSep.checked;

            thiz.prefs.setClipFormat(format);
            thiz.prefs.savePrefs();
            Table2ClipCommon.getObserverService()
                .notifyObservers(null, "t2clip:update-config", "");
        } catch (err) {
            alert("gTable2ClipSettings.onAccept: " + err);
        }

        return isValid;
    },

    initControls : function() {
        var thiz = gTable2ClipSettings;

        thiz.specials = new Array();
        thiz.specials["tab"] = "\\t";
        thiz.specials["newline"] = "\\n";

        thiz.oRowSep = document.getElementById("rowSep");
        thiz.oColumnSep = document.getElementById("columnSep");
        thiz.oAppendSep = document.getElementById("appendRowSep");

        thiz.initValues(true);
    },

    getNavigationWindow : function() {
        var windowManager = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService();
        var windowManagerInterface = windowManager.QueryInterface(Components.interfaces.nsIWindowMediator);
        var win = windowManagerInterface.getMostRecentWindow("navigator:browser");

        if (!win) {
            win = window.openDialog(
                "chrome://browser/content/browser.xul",
                "_blank",
                "chrome,all,dialog=no",
                "about:blank", null, null);
        }

        return win;
    },

    openUrl : function(aEvent) {
        var url = aEvent.currentTarget.getAttribute("url");

        try {
            var navWin = gTable2ClipSettings.getNavigationWindow();
            var browser = navWin.document.getElementById("content");

            browser.selectedTab = browser.addTab(url);
        } catch (err) {
            // This isn't a browser (e.g. Thunderbird, NVU)
            try {
                Table2ClipCommon.loadExternalUrl(url);
            } catch (err) {
            }
        }
    },

    initValues : function(changeProfilePath) {
        var thiz = gTable2ClipSettings;
        var format = thiz.prefs.getClipFormat();

        thiz.oRowSep.value = thiz.unescape(format.rowSep);
        thiz.oColumnSep.value = thiz.unescape(format.columnSep);
        thiz.oAppendSep.checked = format.appendRowSepAtEnd;
    },

    unescape : function(str2unescape) {
        var str = "";
        var len = str2unescape.length;

        for (var i = 0; i < len; i++) {
            var ch = str2unescape.charAt(i);
            switch (ch) {
                case '\t':
                    str += "\\t";
                    break;
                case '\n':
                    str += "\\n";
                    break;
                case '\r':
                    str += "\\r";
                    break;
                case '\\':
                    str += "\\";
                    break;
                default:
                    str += ch;
                    break;
            }
        }

        return str;
    },

    escape : function(str2escape) {
        var str = "";
        var len = str2escape.length;

        for (var i = 0; i < len; ++i) {
            var ch = str2escape.charAt(i);

            if (ch == '\\') {
                if ((i + 1) >= len) {
                    break;
                }
                ch = str2escape.charAt(++i);
                switch (ch) {
                    case '\\':
                        str += '\\';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 'n':
                        str += '\n';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    default:
                        str += ch;
                        break;
                }
            } else {
                str += ch;
            }
        }

        return str;
    },

    insertSpecial : function(controlName, charDesc) {
        var thiz = gTable2ClipSettings;
        var control = document.getElementById(controlName);

        if (control) {
            control.value += thiz.specials[charDesc];
        }
    }
};
