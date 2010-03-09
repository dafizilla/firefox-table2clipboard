clickedTable = null;
      
function getAncestorsString(node) {
    var arr = [];
    
    while (node) {
        arr.push(node.localName);
        node = node.parentNode;
    }
    return arr.join("->");
}
    
function onloadPage() {
    document.getElementById("selectRowButton").addEventListener("click", function(event) {
        var sel = window.getSelection();
        var tr = document.getElementById("tr2-tbl3");
        table2clipboard.tableInfo.selectCells(sel, tr.cells);
    }, true);

    document.getElementById("selectColumnButton").addEventListener("click", function(event) {
        var sel = window.getSelection();
        var cell = document.getElementById("td1-tbl3");
        var cells = table2clipboard.tableInfo.getTableColumnsByNode(cell);
        table2clipboard.tableInfo.selectCells(sel, cells);
    }, true);
    
    window.addEventListener('mousemove', function(event) {
        var node = event.target;
        var s = node.localName + "<br/>"
                + getAncestorsString(node);
                + ((node instanceof HTMLTableElement) ? "HTMLTableElement"
                  : (node instanceof HTMLTableCellElement) ? "HTMLTableCellElement"
                  : (node instanceof HTMLTableRowElement) ? "HTMLTableRowElement"
                  : "");
            
        document.getElementById("elementInfo").innerHTML = s;

        var safeId = function(node) {
            return node && node.id;
        }
    
        var findTableFromNode = t2c.findTableFromNode(node);
        var findTableFromNodeLocalName = table2clipboard.tableInfo.findTableFromNode(node);
        var xpath = findParentTableXPATH(node);
        var ancestor = table2clipboard.tableInfo.getAncestorByTagName(node, "table");
    
        document.getElementById("isTableSelection1").innerHTML = t2c.isTableSelection(node);
        document.getElementById("isTableSelection2").innerHTML = t2cPureHTML.isTableSelection(node);
        document.getElementById("tableFromNode1").innerHTML = safeId(findTableFromNode) + " xpath " + safeId(xpath);
        document.getElementById("tableFromNode2").innerHTML = safeId(findTableFromNodeLocalName) + " ancestor " + safeId(ancestor);
    }, true);
  
    document.getElementById("copyButton").addEventListener("click", function(event) {
        t2c.copyWholeTable(clickedTable);
    }, true);

    window.addEventListener('mousedown', function(event) {
      var node = event.target;

      try {
          
      if (event.altKey) {
          clickedTable = t2cPureHTML.findTableFromNode(node);
  
          document.getElementById("selectedTable").innerHTML = "under mouse " + clickedTable.id;
          t2c.copyWholeTable(clickedTable);
      } else if (event.shiftKey) {
          var sel = window.getSelection();

          if (!sel.isCollapsed && t2cPureHTML.isTableSelection(sel.focusNode.parentNode)) {
              var arr = table2clipboard.tableInfo.getTableInfoFromSelection(sel, this._tableUnderCursor);
              t2c.copyToClipboard(arr);
              //if (sel.rangeCount) {
              //document.getElementById("selectedTable").innerHTML = "--" + sel.getRangeAt(0).startContainer.cells;
              //} else {
              //document.getElementById("selectedTable").innerHTML = "none2";
              //}
          } else {
              document.getElementById("selectedTable").innerHTML = "none1" + sel.isCollapsed + "," + sel.focusNode
              + "-" + sel.getRangeAt(0).startContainer.parentNode;
          }
      }
      } catch (err) {
          alert(err);
      }
    }, true);
  }

var t2c = {
    isTableSelection : function(node) {
        this._selectedTable = null;
        try {
            node
                .QueryInterface(Components.interfaces.nsIDOMHTMLTableRowElement);
            return true;
        } catch (err) {
        }

        if (node instanceof HTMLTableElement) {
            this._selectedTable = node;
            return true;
        }

        var nl = node.childNodes;
        for (var i = 0; i < nl.length; i++) {
            if (nl[i] instanceof HTMLTableElement) {
                this._selectedTable = nl[i];
                return true;
            }
        }

        return false;
    },

    findTableFromNode : function(node) {
        var tableNode = null;

        if (node instanceof HTMLTableElement) {
            tableNode = node;
        } else if ((node instanceof HTMLTableCellElement)
                   || (node instanceof HTMLTableRowElement)) {
            tableNode = node.parentNode;

            while (tableNode && !(tableNode instanceof HTMLTableElement)) {
                tableNode = tableNode.parentNode;
            }
        } else {
            // Check if current node is inside a table cell
            var cellNode = node.parentNode;

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

    copyWholeTable : function(table) {
        try {
            var arr = table2clipboard.tableInfo.getTableInfoFromTable(table);
            this.copyToClipboard(arr);
        } catch (err) {
          alert(err);
            table2clipboard.common.log("T2C copyWholeTable: " + err);
        }
    },

    copyToClipboard : function(tableInfo) {
        with (table2clipboard.formatters) {
            var textHtml = html.format(tableInfo, this.getHtmlOptions());
            //var textCSV = csv.format(tableInfo, this.format);
        }
        document.getElementById("output").value = "----" + textHtml;
    },

    /**
     * Return the options to use to copy HTML table
     * @returns the object {copyStyles, copyLinks, copyImages, copyFormElements}
     */
    getHtmlOptions : function() {
        return {copyStyles : true,//gTable2Clip.prefs.getBool("copyStyles"),
            copyLinks : true,//gTable2Clip.prefs.getBool("copyLinks"),
            copyImages : true,//gTable2Clip.prefs.getBool("copyImages"),
            copyFormElements : true};//gTable2Clip.prefs.getBool("copyFormElements")};
    }
};

var t2cPureHTML = {
    isTableSelection : function(node) {
        this._selectedTable = null;
        var nodeName = node.localName && node.localName.toUpperCase();

        if (nodeName == "TR" || nodeName == "TH") {
            return true;
        }

        if (nodeName == "TABLE") {
            this._selectedTable = node;
            return true;
        }
        var nl = node.childNodes;
        for (var i = 0; i < nl.length; i++) {
            if (node.localName.toUpperCase() == "TABLE") {
                this._selectedTable = nl[i];
                return true;
            }
        }

        return false;
    }
}

function findParentTableXPATH(node) {
    return document.evaluate('ancestor-or-self::table',
            node,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        .singleNodeValue;
}
