      clickedTable = null;
    function onloadPage() {
      window.addEventListener('mousemove', function(event) {
        var node = event.target;
        var s = node.localName + " "
                + ((node instanceof HTMLTableElement) ? "HTMLTableElement"
                  : (node instanceof HTMLTableCellElement) ? "HTMLTableCellElement"
                  : (node instanceof HTMLTableRowElement) ? "HTMLTableRowElement"
                  : "");
                
        document.getElementById("elementInfo").innerHTML = s;

        var findTableFromNode = t2c.findTableFromNode(node);
        var findTableFromNodeLocalName = t2cPureHTML.findTableFromNode(node);
        
        document.getElementById("isTableSelection1").innerHTML = t2c.isTableSelection(node);
        document.getElementById("isTableSelection2").innerHTML = t2cPureHTML.isTableSelection(node);
        document.getElementById("tableFromNode1").innerHTML = findTableFromNode && findTableFromNode.id;
        document.getElementById("tableFromNode2").innerHTML = findTableFromNodeLocalName && findTableFromNodeLocalName.id;
      }, true);
      
      document.getElementById("copyButton").addEventListener("click", function(event) {
        t2c.copyWholeTable(clickedTable);
      }, true);


      window.addEventListener('mousedown', function(event) {
        var node = event.target;
        try {
            
        if (event.metaKey) {
            clickedTable = t2cPureHTML.findTableFromNode(node);
    
            document.getElementById("selectedTable").innerHTML = clickedTable.id;
            t2c.copyWholeTable(clickedTable);
        } else if (event.shiftKey) {
            var sel = window.getSelection();

            document.getElementById("selectedTable").innerHTML = "<<>>";
            if (!sel.isCollapsed && tableSelection.isTableSelection(sel.focusNode)) {
                var arr = tableSelection.getTextArrayFromSelection(sel);
                t2c.copyToClipboard(arr);
                //if (sel.rangeCount) {
                //document.getElementById("selectedTable").innerHTML = "--" + sel.getRangeAt(0).startContainer.cells;
                //} else {
                //document.getElementById("selectedTable").innerHTML = "none2";
                //}
            } else {
                document.getElementById("selectedTable").innerHTML = "none1";
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
            var arr = tableSelection.getTextArrayFromTable(table);
            this.copyToClipboard(arr);
        } catch (err) {
          alert(err);
            table2clipboard.common.log("T2C copyWholeTable: " + err);
        }
    },

    copyToClipboard : function(tableSelection) {
        with (table2clipboard.formatters) {
            var textHtml = html.format(tableSelection, this.getHtmlOptions());
            //var textCSV = csv.format(tableSelection, this.format);
        }
        document.getElementById("output").value = textHtml;
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
    },
};

var t2cPureHTML = {
    findTableFromNode : function(node) {
        var tableNode = null;
        var nodeName = node.localName.toUpperCase();

        if (nodeName == "TABLE") {
            tableNode = node;
        } else if (nodeName == "TD"
                   || nodeName == "TR"
                   || nodeName == "TH"
                   || nodeName == "TBODY"
                   || nodeName == "THEAD"
                   || nodeName == "TFOOT"
                   || nodeName == "CAPTION") {
            tableNode = node.parentNode;

            while (tableNode && tableNode.localName.toUpperCase() != "TABLE") {
                tableNode = tableNode.parentNode;
            }
        } else {
            // Check if current node is inside a table cell
            var cellNode = node.parentNode;

            // if cellNode is the document element the localName property doesn't exist
            while (cellNode && cellNode.localName && cellNode.localName.toUpperCase() != "TD") {
                cellNode = cellNode.parentNode;
            }
            if (cellNode) {
                tableNode = cellNode.parentNode;
                while (tableNode && tableNode.localName && tableNode.localName.toUpperCase() != "TABLE") {
                    tableNode = tableNode.parentNode;
                }
            }
        }

        return tableNode;
    },

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
