/**
 * Author: Davide Ficano
 * Date  : 26-Dec-05
 */

var gTable2Clip = {
    _selectedTable : null,
    _tableUnderCursor : null,

    onLoad : function() {
        var thiz = gTable2Clip;

        thiz.reLineBreak = /[\n\r]/g;
        thiz.reDuplicateQuote = /\"/g; // "

        thiz.addListeners();

        var obs = Table2ClipCommon.getObserverService();
        obs.addObserver(thiz, "t2clip:update-config", false);
        obs.notifyObservers(null, "t2clip:update-config", "");

        thiz.workaroundEditMenu();
    },

    onUnLoad : function() {
        var thiz = gTable2Clip;

        var obs = Table2ClipCommon.getObserverService();
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
            Table2ClipCommon.log("T2C copyTableSelection: " + err);
        }
    },
    
    copyToClipboard : function(arr) {
        var textHtml = gTable2Clip.getHtml(arr, gTable2Clip.format);
        var textCSV = gTable2Clip.getCSV(arr, gTable2Clip.format);

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

    getHtml : function(arr, format) {
        var rc = arr.length;
        var cc = arr[0].length;
        var str = "";

        str += "<table>";
        for (var i = 0; i < rc; i++) {
            str += "<tr>";
            for (var j = 0; j < cc; j++) {
                var cellText = arr[i][j]
                    ? Table2ClipCommon.htmlEncode(arr[i][j]) : "&nbsp;"
                str += "<td>" + cellText + "</td>";
            }
            str += "</tr>";
        }
        str += "</table>";

        return str;
    },

    getCSV : function(arr, format) {
        var rc = arr.length;
        var cc = arr[0].length;
        var lastRow = rc - 1;
        var lastCol = cc - 1;
        var str = "";

        for (var i = 0; i < rc; i++) {
            for (var j = 0; j < cc; j++) {
                var cellText = arr[i][j]
                        ? gTable2Clip.handleSpecials(gTable2Clip.trim(arr[i][j]))
                        : ""
                str += cellText;
                if (j < lastCol) {
                    str += format.columnSep;
                }
            }
            if (i < lastRow || format.appendRowSepAtEnd) {
                str += format.rowSep;
            }
        }

        return str;
    },

    getTextArrayFromTable : function(table) {
        var thiz = gTable2Clip;
        var arrRow = new Array();
        var minColumn = 0;
        var maxColumn = -1;
        var rows = table.rows;

        for (var i = 0; i < rows.length; i++) {
            // rows[i] type is nsIDOMHTMLTableRowElement
            var cells = rows[i].cells;
            var arrCol = new Array();

            for (var cc = 0; cc < cells.length; cc++) {
                // theCell type is HTMLTableCellElement
                var theCell = cells.item(cc);
                arrCol[cc] = gTable2Clip.getTextNodeContent(theCell);
            }

            // Adjust the value if row contains a colspan
            if (maxColumn < arrCol.length) {
                maxColumn = arrCol.length;
            }
            arrRow.push(arrCol);
        }

        // Fill all rows to maximum number of cells
        for (i = 0; i < arrRow.length; i++) {
            var fillCount = maxColumn - arrRow[i].length;
            for (var j = 0; j < fillCount; j++) {
                arrRow[i].push("");
            }
            // remove empty rows at left
            arrRow[i] = arrRow[i].slice(minColumn);
        }
        return arrRow;
    },

    getTextArrayFromSelection : function(sel) {
        var thiz = gTable2Clip;
        var arrRow = new Array();
        var minColumn = 100000;
        var maxColumn = -1;
        var columnCount = 0;

        for (var i = 0; i < sel.rangeCount; i += columnCount) {
            columnCount = thiz.getColumnsPerRow(sel, i);

            var cells = sel.getRangeAt(i).startContainer.cells;

            var arrCol = new Array();
            var rangeIndexStart = i;
            var rangeIndexEnd = i + columnCount;
            for (var cc = 0; cc < cells.length && rangeIndexStart < rangeIndexEnd; cc++) {
                var theCell = cells.item(cc);
                if (sel.containsNode(theCell, false))  {
                    var selNode = sel.getRangeAt(rangeIndexStart++).cloneContents();
                    arrCol[cc] = gTable2Clip.getTextNodeContent(selNode);
                    if (minColumn > cc) {
                        minColumn = cc;
                    }
                }
            }

            if (maxColumn < arrCol.length) {
                maxColumn = arrCol.length;
            }
            arrRow.push(arrCol);
        }

        // Fill all rows to maximum number of cells
        for (i = 0; i < arrRow.length; i++) {
            var fillCount = maxColumn - arrRow[i].length;
            for (var j = 0; j < fillCount; j++) {
                arrRow[i].push("");
            }
            // remove empty rows at left
            arrRow[i] = arrRow[i].slice(minColumn);
        }
        return arrRow;
    },

    getTextNodeContent : function(node) {
        var str = "";
        var nl = node.childNodes;

        for (var i = 0; i < nl.length; i++) {
            if (this.skipNode(nl[i])) {
                continue;
            } else if (nl[i].nodeType == Node.TEXT_NODE) {
                str += nl[i].nodeValue;
            }
            if (nl[i].hasChildNodes()) {
                str += gTable2Clip.getTextNodeContent(nl[i]);
            }
        }
        return str;
    },

    skipNode : function(node) {
        if (node.nodeType == Node.ELEMENT_NODE) {
            var style = node.ownerDocument.defaultView.getComputedStyle(node, null);
            if (style.getPropertyValue("display") == "none") {
                return true;
            }
        }
        return false;
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

    trim : function(str) {
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
    },


    // str must be surronded with quotes if contains new lines
    // if contains new lines and inside str there are quotes
    // they must be escaped by duplicating the quote character
    handleSpecials : function(str) {
        if (gTable2Clip.reLineBreak.test(str)) {
            str = "\""
                  + str.replace(gTable2Clip.reDuplicateQuote, "\"\"")
                  + "\"";
        }
        return str;
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
            Table2ClipCommon.log("T2C copyWholeTable: " + err);
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
    }
}

window.addEventListener("load", gTable2Clip.onLoad, false);
window.addEventListener("unload", gTable2Clip.onUnLoad, false);