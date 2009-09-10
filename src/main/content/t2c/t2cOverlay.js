/**
 * Author: Davide Ficano
 * Date  : 26-Dec-05
 */

var gTable2Clip = {
    _selectedTable : null,
    _tableUnderCursor : null,

    onLoad : function() {
        var thiz = gTable2Clip;

        thiz.addListeners();

        var obs = table2clipboard.common.getObserverService();
        obs.addObserver(thiz, "t2clip:update-config", false);
        obs.notifyObservers(null, "t2clip:update-config", "");

        thiz.workaroundEditMenu();

        var builderNS = table2clipboard.builders.html;
        builderNS.registerHandler('a', builderNS.handlers.handleA);
        builderNS.registerHandler('img', builderNS.handlers.handleIMG);
        builderNS.registerHandler('br', builderNS.handlers.handleBR);
    },

    onUnLoad : function() {
        var thiz = gTable2Clip;

        var obs = table2clipboard.common.getObserverService();
        obs.removeObserver(thiz, "t2clip:update-config");
        thiz.removeListeners();
    },

    observe : function(subject, topic, state) {
        var thiz = gTable2Clip;

        if (topic == "t2clip:update-config") {
            thiz.prefs = new Table2ClipPrefs();
            thiz.format = thiz.prefs.getClipFormat();
        }
    },

    addListeners : function() {
        var thiz = gTable2Clip;

        var menuItem = document.getElementById("context-t2c:Copy");
        if (menuItem) {
            var n = menuItem.parentNode;

            if (n) {
                n.addEventListener("popupshowing",
                                   thiz.onPopupShowingContextMenu, false);
            }
        }
    },

    removeListeners : function() {
        var thiz = gTable2Clip;

        var menuItem = document.getElementById("context-t2c:Copy");
        if (menuItem) {
            var n = menuItem.parentNode;

            if (n) {
                n.removeEventListener("popupshowing",
                                   thiz.onPopupShowingContextMenu, false);
            }
        }
    },

    onPopupShowingContextMenu : function(event) {
        if (event.target == this) {
            var thiz = gTable2Clip;

            thiz.showMenuItem(document.getElementById("context-t2c:Copy"),
                              thiz.isCommandEnabled('cmd_copyT2C'));
            thiz.showMenuItem(document.getElementById("context-t2c:SelectTable"),
                              thiz.isCommandEnabled('cmd_selectTableT2C'));
            thiz.showMenuItem(document.getElementById("context-t2c:CopyWholeTable"),
                              thiz.isCommandEnabled('cmd_copyWholeTable'));
        }
        return true;
    },

    showMenuItem : function(menuItem, show) {
        if (show) {
            menuItem.removeAttribute("hidden");
        } else {
            menuItem.setAttribute("hidden", "true");
        }
    },

    goUpdateSelectMenuItems : function() {
        var thiz = gTable2Clip;
        goSetCommandEnabled("cmd_copyT2C", thiz.isCommandEnabled('cmd_copyT2C'));
    },

    copyTableSelection : function(event) {
        try {
            var arr;

            if (gTable2Clip._selectedTable) {
                arr = gTable2Clip.getTextArrayFromTable(gTable2Clip._selectedTable);
            } else {
                var sel = document.commandDispatcher.focusedWindow.getSelection();
                arr = gTable2Clip.getTextArrayFromSelection(sel);
            }
            gTable2Clip.copyToClipboard(arr);
        } catch (err) {
            table2clipboard.common.log("T2C copyTableSelection: " + err);
        }
    },

    copyToClipboard : function(tableInfo) {
        with (table2clipboard.formatters) {
            var textHtml = html.format(tableInfo, gTable2Clip.getHtmlOptions());
            var textCSV = csv.format(tableInfo, gTable2Clip.format);
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
     * Get structure info for passed table
     * @param table the table to obtain
     * @returns the object
     * {
     * tableNode : node,
     * rows : [{rowNode : node,
     *          cells : [textNode : node, cellNode : node]}
     *        ]
     * }
     */
    getTextArrayFromTable : function(table) {
        var thiz = gTable2Clip;
        var arrRow = new Array();
        var minColumn = 0;
        var maxColumn = -1;
        var rows = table.rows;

        for (var i = 0; i < rows.length; i++) {
            // rows[i] type is nsIDOMHTMLTableRowElement
            var row = rows[i];
            var cells = row.cells;
            var arrCol = new Array();

            for (var cc = 0; cc < cells.length; cc++) {
                // theCell type is HTMLTableCellElement
                var theCell = cells.item(cc);
                arrCol[cc] = {textNode : theCell, cellNode : theCell};
            }

            // Adjust the value if row contains a colspan
            if (maxColumn < arrCol.length) {
                maxColumn = arrCol.length;
            }
            arrRow.push({rowNode : row, cells : arrCol});
        }

        thiz.padCells(arrRow, minColumn, maxColumn);
        return {tableNode : table, rows : arrRow};
    },

    getTextArrayFromSelection : function(sel) {
        var thiz = gTable2Clip;
        var arrRow = new Array();
        var minColumn = 100000;
        var maxColumn = -1;
        var columnCount = 0;

        for (var i = 0; i < sel.rangeCount; i += columnCount) {
            columnCount = thiz.getColumnsPerRow(sel, i);
            var row = sel.getRangeAt(i).startContainer;
            var cells = row.cells;

            var arrCol = new Array();
            var rangeIndexStart = i;
            var rangeIndexEnd = i + columnCount;
            for (var cc = 0; cc < cells.length && rangeIndexStart < rangeIndexEnd; cc++) {
                var theCell = cells.item(cc);

                if (sel.containsNode(theCell, false))  {
                    var selNode = sel.getRangeAt(rangeIndexStart++).cloneContents();

                    arrCol[cc] = {textNode : selNode, cellNode : theCell};
                    if (minColumn > cc) {
                        minColumn = cc;
                    }
                } else {
                    arrCol[cc] = {textNode : null, cellNode : null};
                }
            }

            if (maxColumn < arrCol.length) {
                maxColumn = arrCol.length;
            }
            arrRow.push({rowNode : row, cells : arrCol});
        }

        thiz.padCells(arrRow, minColumn, maxColumn);
        return {tableNode : thiz._tableUnderCursor, rows : arrRow};
    },

    /**
     * Return the options to use to copy HTML table
     * @returns the object {copyStyles, copyLinks, copyImages}
     */
    getHtmlOptions : function() {
        return {copyStyles : gTable2Clip.prefs.getBool("copyStyles"),
            copyLinks : gTable2Clip.prefs.getBool("copyLinks"),
            copyImages : gTable2Clip.prefs.getBool("copyImages")};
    },

    /**
     * Pad cell arrays to have all same dimension and remove starting blank cells
     * @param arrRow cells array
     * @param minColumn the minimum column count
     * @param maxColumn the maximum coloun count
     */
    padCells : function(arrRow, minColumn, maxColumn) {
        // Fill all rows to maximum number of cells
        for (var i = 0; i < arrRow.length; i++) {
            var cells = arrRow[i].cells;
            var fillCount = maxColumn - cells.length;
            for (var j = 0; j < fillCount; j++) {
                cells.push(null);
            }
            // remove empty rows at left
            arrRow[i].cells = cells.slice(minColumn);
        }
    },

    getColumnsPerRow : function(sel, startPos) {
        var currPos = startPos;
        var range = sel.getRangeAt(currPos);
        var currRowIndex = range.startContainer.rowIndex;

        while (++currPos < sel.rangeCount) {
            range = sel.getRangeAt(currPos);

            if (range.startContainer.rowIndex != currRowIndex) {
                break;
            }
        }

        return currPos - startPos;
    },

    // From browser.js
    // Returns true if anything is selected.
    isContentSelection : function(sel) {
        return !sel.isCollapsed;
    },

    isTableSelection : function(sel) {
        gTable2Clip._selectedTable = null;
        try {
            sel.focusNode
                .QueryInterface(Components.interfaces.nsIDOMHTMLTableRowElement);
            return true;
        } catch (err) {
        }

        if (sel.focusNode instanceof HTMLTableElement) {
            gTable2Clip._selectedTable = sel.focusNode;
            return true;
        }

        var nl = sel.focusNode.childNodes;
        for (var i = 0; i < nl.length; i++) {
            if (nl[i] instanceof HTMLTableElement) {
                gTable2Clip._selectedTable = nl[i];
                return true;
            }
        }

        return false;
    },

    workaroundEditMenu : function() {
        // Since Thunderbird 2.0.0.16 the menu_EditPopup element exists
        // so It isn't necessary to add by hand
        if (document.getElementById("editMenu-t2c:Copy")) {
            return;
        }
        // TB and MZ don't contain a popup for edit menu so I move from view
        var fakeMenu = document.getElementById("fake-editMenu-t2c:Copy");
        if (fakeMenu) {
            var menuPaste = document.getElementById("menu_paste");
            if (menuPaste) {
                var newMenu = fakeMenu.cloneNode(false);
                newMenu.removeAttribute("hidden");
                newMenu.setAttribute("id", "editMenu-t2c:Copy");
                menuPaste.parentNode.insertBefore(newMenu, menuPaste);
            }
        }
    },

    selectTable : function(table) {
        if (table) {
            var focusedWindow = document.commandDispatcher.focusedWindow;
            var sel = focusedWindow.getSelection();
            sel.selectAllChildren(table);
        }
    },

    copyWholeTable : function(table) {
        try {
            var arr = gTable2Clip.getTextArrayFromTable(table);
            gTable2Clip.copyToClipboard(arr);
        } catch (err) {
            table2clipboard.common.log("T2C copyWholeTable: " + err);
        }
    },

    getTableUnderCursor : function() {
        if (!(gContextMenu && gContextMenu.target)) {
            return null;
        }
        var nodeUnderCursor = gContextMenu.target;
        var tableNode = null;

        if (nodeUnderCursor instanceof HTMLTableElement) {
            tableNode = nodeUnderCursor;
        } else if ((nodeUnderCursor instanceof HTMLTableCellElement)
                   || (nodeUnderCursor instanceof HTMLTableRowElement)) {
            tableNode = nodeUnderCursor.parentNode;

            while (tableNode && !(tableNode instanceof HTMLTableElement)) {
                tableNode = tableNode.parentNode;
            }
        } else {
            // Check if current node is inside a table cell
            var cellNode = nodeUnderCursor.parentNode;

            while (cellNode && !(cellNode instanceof HTMLTableCellElement)) {
                cellNode = cellNode.parentNode;
            }
            if (cellNode) {
                tableNode = cellNode.parentNode;
                while (tableNode && !(tableNode instanceof HTMLTableElement)) {
                    tableNode = tableNode.parentNode;
                }
            }
        }
        return tableNode;
    },

    /** nsIController implementation **/

    doCommand : function(command) {
        if (!gTable2Clip.isCommandEnabled(command)) {
            return;
        }
        if (command == "cmd_copyT2C") {
            gTable2Clip.copyTableSelection();
        } else if (command == "cmd_selectTableT2C") {
            gTable2Clip.selectTable(gTable2Clip._tableUnderCursor);
        } else if (command == "cmd_copyWholeTable") {
            gTable2Clip.copyWholeTable(gTable2Clip._tableUnderCursor);
        }
    },

    isCommandEnabled : function(command) {
        if (command == "cmd_copyT2C") {
            var focusedWindow = document.commandDispatcher.focusedWindow;
            if (focusedWindow) {
                var sel = focusedWindow.getSelection();
                return gTable2Clip.isContentSelection(sel)
                         && gTable2Clip.isTableSelection(sel);
            }
        } else if (command == "cmd_selectTableT2C") {
            gTable2Clip._tableUnderCursor = gTable2Clip.getTableUnderCursor();
            return gTable2Clip._tableUnderCursor != null;
        } else if (command == "cmd_copyWholeTable") {
            gTable2Clip._tableUnderCursor = gTable2Clip.getTableUnderCursor();
            return gTable2Clip._tableUnderCursor != null;
        }
        return false;
    },

    onEvent : function(eventName) {
    },

    supportsCommand : function(command) {
        return command == "cmd_copyT2C";
    },

    onOpenSettings : function(event) {
        window.openDialog("chrome://t2c/content/settings/settings.xul",
                          "_blank",
                          "chrome,modal,resizable=yes,dependent=yes");
    }
}

window.addEventListener("load", gTable2Clip.onLoad, false);
window.addEventListener("unload", gTable2Clip.onUnLoad, false);