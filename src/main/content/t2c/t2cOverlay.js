/**
 * Author: Davide Ficano
 * Date  : 26-Dec-05
 */

var gTable2Clip = {
    _selectedTable : null,
    _tableUnderCursor : null,

    onLoad : function() {
        this.addListeners();
        this.prefs = new Table2ClipPrefs();

        table2clipboard.builders.html.registerAllHandlers();
    },

    onUnLoad : function() {
        this.removeListeners();
    },

    addListeners : function() {
        var menuItem = document.getElementById("context-t2c:contextMenu");
        if (menuItem) {
            var n = menuItem.parentNode;

            if (n) {
                n.addEventListener("popupshowing",
                                   this.onPopupShowingContextMenu, false);
            }
        }

        // don't use command dispatcher because the test routine can be slow
        // so call it directly only when menu is shown
        menuItem = document.getElementById("editMenu-t2c:CopyAllTables");
        if (menuItem) {
            var n = menuItem.parentNode;

            if (n) {
                n.addEventListener("popupshowing",
                                   this.onPopupShowingEdit, false);
            }
        }
    },

    removeListeners : function() {
        var menuItem = document.getElementById("context-t2c:contextMenu");
        if (menuItem) {
            var n = menuItem.parentNode;

            if (n) {
                n.removeEventListener("popupshowing",
                                   this.onPopupShowingContextMenu, false);
            }
        }

        menuItem = document.getElementById("editMenu-t2c:CopyAllTables");
        if (menuItem) {
            var n = menuItem.parentNode;

            if (n) {
                n.removeEventListener("popupshowing",
                                   this.onPopupShowingEdit, false);
            }
        }
    },

    onPopupShowingContextMenu : function(event) {
        if (event.target == this) {
            var node = document.popupNode;
            gTable2Clip._tableUnderCursor = table2clipboard.tableInfo.findTableFromNode(node);
            var isOnTable = gTable2Clip._tableUnderCursor != null;
            var hasSelectedCells = gTable2Clip.hasSelectedCells();
            var shouldShow = hasSelectedCells || isOnTable;

            gTable2Clip.showMenuItem("context-t2c:contextMenu", shouldShow);

            if (shouldShow) {
                // we disable SelectColumn menuitem when user clicks on TR or TBODY
                // because the cell isn't determinated (should be found from mouse coordinated)
                var isOnCell = table2clipboard.tableInfo.getCellNode(node) != null;

                gTable2Clip.showMenuItem("context-t2c:Copy", hasSelectedCells);
                gTable2Clip.showMenuItem("context-t2c:SelectTable", isOnTable);
                gTable2Clip.showMenuItem("context-t2c:CopyWholeTable", isOnTable);
                gTable2Clip.showMenuItem("context-t2c:SelectTableRow", isOnTable);
                gTable2Clip.showMenuItem("context-t2c:SelectTableColumn", isOnTable && isOnCell);
            }
        }
        return true;
    },

    onPopupShowingEdit : function(event) {
        var doc = document.commandDispatcher.focusedWindow.content.document;
        var tables = table2clipboard.tableInfo.getRootTables(doc, doc.body);
        var menuitem = document.getElementById("editMenu-t2c:CopyAllTables");

        if (tables.length > 0) {
            var label = table2clipboard.common.getFormattedMessage(
                        "copy.all.tables.label", [tables.length]);
            menuitem.setAttribute("label", label);
        }
        gTable2Clip.showMenuItem(menuitem, tables.length > 0);
        gTable2Clip.showMenuItem(document.getElementById("editMenu-t2c:Copy"),
                                 gTable2Clip.hasSelectedCells(),
                                 "disabled")
    },

    showMenuItem : function(menuItem, show, showAttr) {
        showAttr = typeof(showAttr) == "undefined" ? "hidden" : showAttr;
        if (menuItem.constructor === String) {
            menuItem = document.getElementById(menuItem);
        }
        if (show) {
            menuItem.removeAttribute(showAttr);
        } else {
            menuItem.setAttribute(showAttr, "true");
        }
    },

    copyTableSelection : function(event) {
        try {
            var arr;

            if (this._selectedTable) {
                arr = table2clipboard.tableInfo.getTableInfoFromTable(this._selectedTable);
            } else {
                var sel = document.commandDispatcher.focusedWindow.getSelection();
                // if it isn't called from context menu _tableUnderCursor is null
                arr = table2clipboard.tableInfo.getTableInfoFromSelection(sel, this._tableUnderCursor);
            }
            this.copyToClipboard(arr);
        } catch (err) {
            table2clipboard.common.logException(err, "T2C copyTableSelection: ");
        }
    },

    copyAllTables : function() {
        var doc = document.commandDispatcher.focusedWindow.content.document;
        var tables = table2clipboard.tableInfo.getRootTables(doc, doc.body);
        var tableInfos = [];

        for (var i in tables) {
            tableInfos.push(table2clipboard.tableInfo.getTableInfoFromTable(tables[i]));
        }
        this.copyToClipboard(tableInfos);
    },

    copyToClipboard : function(tableInfo) {
        with (table2clipboard.formatters) {
            var textHtml = html.format(tableInfo, this.getHtmlOptions());
            var textCSV = csv.format(tableInfo, this.prefs.getClipFormat());
        }

        var xferable = Components.classes["@mozilla.org/widget/transferable;1"]
                        .createInstance(Components.interfaces.nsITransferable);

        xferable.addDataFlavor("text/html");
        var htmlstring = Components.classes["@mozilla.org/supports-string;1"]
                        .createInstance(Components.interfaces.nsISupportsString);
        htmlstring.data = textHtml;
        xferable.setTransferData("text/html", htmlstring, textHtml.length * 2);

        xferable.addDataFlavor("text/unicode");
        var unicodestring = Components.classes["@mozilla.org/supports-string;1"]
                        .createInstance(Components.interfaces.nsISupportsString);
        unicodestring.data = textCSV;
        xferable.setTransferData("text/unicode", unicodestring, textCSV.length * 2);

        var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"]
                        .getService(Components.interfaces.nsIClipboard);
        clipboard.setData(xferable, null,
                          Components.interfaces.nsIClipboard.kGlobalClipboard);
    },

    /**
     * Return the options to use to copy HTML table
     * @returns the object {copyStyles, copyLinks, copyImages, copyFormElements}
     */
    getHtmlOptions : function() {
        return {copyStyles : this.prefs.getBool("copyStyles"),
            copyLinks : this.prefs.getBool("copyLinks"),
            copyImages : this.prefs.getBool("copyImages"),
            copyFormElements : this.prefs.getBool("copyFormElements"),
            attributeFiltersPattern: this.prefs.getString("attributeFiltersPattern")};
    },

    // From browser.js
    // Returns true if anything is selected.
    isContentSelection : function(sel) {
        return !sel.isCollapsed;
    },

    isTableSelection : function(node) {
        this._selectedTable = null;
        var nodeName = node.localName && node.localName.toLowerCase();

        if (nodeName == "tr" || nodeName == "th") {
            return true;
        }

        if (nodeName == "table") {
            this._selectedTable = node;
            return true;
        }
        var nl = node.childNodes;
        for (var i = 0; i < nl.length; i++) {
            if (node.localName.toLowerCase() == "table") {
                this._selectedTable = nl[i];
                return true;
            }
        }

        return false;
    },

    selectTable : function(table) {
        table = typeof(table) == "undefined" || table == null
            ? this._tableUnderCursor : table;
        if (table) {
            var focusedWindow = document.commandDispatcher.focusedWindow;
            var sel = focusedWindow.getSelection();
            sel.selectAllChildren(table);
        }
    },

    copyWholeTable : function(table) {
        table = typeof(table) == "undefined" || table == null
            ? this._tableUnderCursor : table;
        try {
            var arr = table2clipboard.tableInfo.getTableInfoFromTable(table);
            this.copyToClipboard(arr);
        } catch (err) {
            table2clipboard.common.logException(err, "T2C copyWholeTable: ");
        }
    },

    copySelectedCells : function() {
        if (this.hasSelectedCells()) {
            this.copyTableSelection();
        }
    },

    hasSelectedCells : function() {
        var focusedWindow = document.commandDispatcher.focusedWindow;
        if (focusedWindow) {
            var sel = focusedWindow.getSelection();
            return this.isContentSelection(sel)
                     && this.isTableSelection(sel.focusNode);
        }
        return false;
    },

    selectTableRow : function() {
        // get node under mouse pointer
        var tr = table2clipboard.tableInfo.getAncestorByTagName(document.popupNode, "tr");

        if (tr) {
            var sel = document.commandDispatcher.focusedWindow.getSelection();
            table2clipboard.tableInfo.selectCells(sel, tr.cells);
        }
    },

    selectTableColumn : function() {
        var sel = document.commandDispatcher.focusedWindow.getSelection();
        var cells = table2clipboard.tableInfo.getTableColumnsByNode(document.popupNode);
        table2clipboard.tableInfo.selectCells(sel, cells);
    },

    onOpenSettings : function(event) {
        toOpenWindowByType("t2c:settings",
                           "chrome://t2c/content/settings/settings.xul",
                           "chrome,resizable=yes,dependent=yes");
    }
}

window.addEventListener("load", function(event) {gTable2Clip.onLoad(event);}, false);
window.addEventListener("unload", function(event) {gTable2Clip.onUnLoad(event);}, false);