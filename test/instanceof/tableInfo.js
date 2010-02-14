/*
# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Initial Developer of the Original Code is
# Davide Ficano.
# Portions created by the Initial Developer are Copyright (C) 2009-2010
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#   Davide Ficano <davide.ficano@gmail.com>
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****
*/
if (typeof table2clipboard == "undefined") {
    var table2clipboard = {};
}

if (typeof table2clipboard.tableInfo == "undefined") {
    table2clipboard.tableInfo = {};
}

(function() {
    /**
     * Get structure info for passed table
     * @param table the table DOM node used to get tableInfo
     * @returns the object
     * {
     * tableNode : node,
     * rows : [{rowNode : node,
     *          cells : [{cellNode:node}]
     *        }]
     * }
     */
    this.getTableInfoFromTable = function(table) {
        var arrRow = new Array();
        var minColumn = 0;
        var maxColumn = -1;
        var rows = table.rows;

        for (var i = 0; i < rows.length; i++) {
            // rows[i] type is nsIDOMHTMLTableRowElement
            var row = rows[i];
            var cells = row.cells;
            var arrCol = new Array();
            var colsInRow = 0;

            for (var cc = 0; cc < cells.length; cc++) {
                // theCell type is HTMLTableCellElement
                var theCell = cells.item(cc);
                arrCol[cc] = {cellNode : theCell};
                var cs = parseInt(theCell.getAttribute("colspan"));
                if (cs > 0) {
                    // subtract column itself
                    // otherwise when adding length it is computed twice
                    colsInRow += cs - 1;
                }
            }

            // Adjust the value if row contains a colspan
            colsInRow += arrCol.length;
            if (maxColumn < colsInRow) {
                maxColumn = colsInRow;
            }
            arrRow.push({rowNode : row, cells : arrCol, colsInRow : colsInRow});
        }

        this.padCells(arrRow, minColumn, maxColumn);
        return {tableNode : table, rows : arrRow};
    }

    /**
     * Get structure info for table contained inside the passed selection
     * @param sel the selection object
     * @param tableNode the table DOM node, if null is determinated from
     * selection
     * @returns the object
     * {
     * tableNode : node,
     * rows : [{rowNode : node,
     *          cells : [{cellNode:node}]
     *        }]
     * }
     */
    this.getTableInfoFromSelection = function(sel, tableNode) {
        var arrRow = new Array();
        var minColumn = 100000;
        var maxColumn = -1;
        var columnCount = 0;

        for (var i = 0; i < sel.rangeCount; i += columnCount) {
            columnCount = this.getColumnsPerRow(sel, i);
            var row = sel.getRangeAt(i).startContainer;
            var cells = row.cells;

            var arrCol = new Array();
            var rangeIndexStart = i;
            var rangeIndexEnd = i + columnCount;
            var colsInRow = 0;

            for (var cc = 0; cc < cells.length && rangeIndexStart < rangeIndexEnd; cc++) {
                var theCell = cells.item(cc);

                if (sel.containsNode(theCell, false))  {
                    rangeIndexStart++;

                    arrCol[cc] = {cellNode : theCell};
                    if (minColumn > cc) {
                        minColumn = cc;
                    }
                    var cs = parseInt(theCell.getAttribute("colspan"));
                    if (cs > 0) {
                        // subtract column itself
                        // otherwise when adding length it is computed twice
                        colsInRow += cs - 1;
                    }
                } else {
                    arrCol[cc] = null;
                }
            }
            colsInRow += arrCol.length;
            if (maxColumn < colsInRow) {
                maxColumn = colsInRow;
            }
            arrRow.push({rowNode : row, cells : arrCol, colsInRow : colsInRow});
        }

        this.padCells(arrRow, minColumn, maxColumn);

        if (!tableNode && arrRow.length > 0) {
            tableNode = this.findTableFromNode(arrRow[0].rowNode);
        }

        return {tableNode : tableNode, rows : arrRow};
    }

    /**
     * Pad cell arrays to have all same dimension and remove starting blank cells
     * @param arrRow cells array
     * @param minColumn the minimum column count
     * @param maxColumn the maximum coloun count
     */
    this.padCells = function(arrRow, minColumn, maxColumn) {
        // Fill all rows to maximum number of cells
        for (var i = 0; i < arrRow.length; i++) {
            var cells = arrRow[i].cells;
            var fillCount = maxColumn - arrRow[i].colsInRow;
            for (var j = 0; j < fillCount; j++) {
                cells.push(null);
            }
            // remove empty rows at left
            arrRow[i].cells = cells.slice(minColumn);
        }
    }

    this.getColumnsPerRow = function(sel, startPos) {
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
    }

    /**
     * Get the node's ancestor with tagName
     * @param node starting node
     * @param tagName the ancestor tag name
     * @returns the ancestor or null
     */
    this.getAncestorByTagName = function(node, tagName) {
        const TEXT_NODE = Node.TEXT_NODE;
        tagName = tagName.toLowerCase();

        // find also non-text node that has not tag name (the document object)
        while (node
               && ((node.localName && node.localName.toLowerCase() != tagName)
                   || (!node.localName && node.nodeType != TEXT_NODE))) {
            node = node.parentNode;
        }
        return node;
    }

    this.findTableFromNode = function(node) {
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

            while (tableNode && tableNode.localName && tableNode.localName.toUpperCase() != "TABLE") {
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
    }

    /**
     * Get all nodes relative to TABLE tag, nested tables are not returned
     * @param doc the document to use
     * @param rootNode the root node from which start search
     * @returns {Array} dom nodes
     */
    this.getRootTables = function(doc, rootNode) {
        var treeWalker = doc.createTreeWalker(
            rootNode,
            NodeFilter.SHOW_ELEMENT,
            { acceptNode: function(node) {
                if (node.localName.toLowerCase() == "table") {
                    var parentNode = node.parentNode;
                    // skip nested tables
                    while (parentNode) {
                        if (parentNode.localName
                            && parentNode.localName.toLowerCase() == "table") {
                            return NodeFilter.FILTER_REJECT;
                        }
                        parentNode = parentNode.parentNode;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
                }
            },
            false);
        var nodeList = [];

        while (treeWalker.nextNode()) {
            nodeList.push(treeWalker.currentNode);
        }
        return nodeList;
    }
}).apply(table2clipboard.tableInfo);