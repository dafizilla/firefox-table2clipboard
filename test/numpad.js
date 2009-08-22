var domRangeTest = {
    updateRanges : function(table, editbox) {
        try {
        //var sel = document.commandDispatcher.focusedWindow.getSelection();
        var sel = window.getSelection();

        editbox.value = "Range count : " + sel.rangeCount;
        } catch(e) {
            alert(e);
        }
        //arr = gTable2Clip.getTextArrayFromSelection(sel);
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