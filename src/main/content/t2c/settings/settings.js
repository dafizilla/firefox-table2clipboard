/**
 * Author: Davide Ficano
 * Date  : 26-Dec-05
 */
var gTable2ClipSettings = {
    onLoad : function() {
        this.prefs = new Table2ClipPrefs();
        this.initControls();
        window.sizeToContent();
    },

    onAccept : function() {
        var isValid = true;

        try {
            var format = new Table2ClipFormat();
            format.rowSep = this.escape(this.oRowSep.value);
            format.columnSep = this.escape(this.oColumnSep.value);
            format.appendRowSepAtEnd = this.oAppendSep.checked;

            this.prefs.setClipFormat(format);

            // TODO must be handled by savePrefs
            this.prefs.setBool("copyLinks", this.oCopyLinks.checked);
            this.prefs.setBool("copyStyles", this.oCopyStyles.checked);
            this.prefs.setBool("copyImages", this.oCopyImages.checked);
            this.prefs.setBool("copyFormElements", this.oCopyFormElements.checked);

            this.prefs.savePrefs();
            table2clipboard.common.getObserverService()
                .notifyObservers(null, "t2clip:update-config", "");
        } catch (err) {
            alert("gTable2ClipSettings.onAccept: " + err);
        }

        return isValid;
    },

    initControls : function() {
        this.specials = new Array();
        this.specials["tab"] = "\\t";
        this.specials["newline"] = "\\n";

        this.oRowSep = document.getElementById("rowSep");
        this.oColumnSep = document.getElementById("columnSep");
        this.oAppendSep = document.getElementById("appendRowSep");

        this.oCopyLinks = document.getElementById("copyLinks");
        this.oCopyStyles = document.getElementById("copyStyles");
        this.oCopyImages = document.getElementById("copyImages");
        this.oCopyFormElements = document.getElementById("copyFormElements");

        this.initValues(true);
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
            var navWin = this.getNavigationWindow();
            var browser = navWin.document.getElementById("content");

            browser.selectedTab = browser.addTab(url);
        } catch (err) {
            // This isn't a browser (e.g. Thunderbird, NVU)
            try {
                table2clipboard.common.loadExternalUrl(url);
            } catch (err) {
            }
        }
    },

    initValues : function(changeProfilePath) {
        var format = this.prefs.getClipFormat();

        this.oRowSep.value = this.unescape(format.rowSep);
        this.oColumnSep.value = this.unescape(format.columnSep);
        this.oAppendSep.checked = format.appendRowSepAtEnd;

        this.oCopyLinks.checked = this.prefs.getBool("copyLinks");
        this.oCopyStyles.checked = this.prefs.getBool("copyStyles");
        this.oCopyImages.checked = this.prefs.getBool("copyImages");
        this.oCopyFormElements.checked = this.prefs.getBool("copyFormElements");
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
        var control = document.getElementById(controlName);

        if (control) {
            control.value += this.specials[charDesc];
        }
    }
};
