var tableInfo = {
    /**
     * Get structure info for passed table
     * @param table the table to obtain
     * @returns the object
     * {
     * tableNode : node,
     * rows : [{rowNode : node,
     *          cells : [{cellNode:node}]
     *        }]
     * }
     */
    getTextArrayFromTable : function(table) {
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
    },

    getTextArrayFromSelection : function(sel) {
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
        // if it isn't called from context menu _tableUnderCursor is null
        var tableNode = this._tableUnderCursor;

        if (!tableNode && arrRow.length > 0) {
            tableNode = gTable2Clip.findTableFromNode(arrRow[0].rowNode);
        }

        return {tableNode : tableNode, rows : arrRow};
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
            var fillCount = maxColumn - arrRow[i].colsInRow;
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
}