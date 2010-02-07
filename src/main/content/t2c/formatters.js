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
# Portions created by the Initial Developer are Copyright (C) 2009
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

if (typeof(table2clipboard) == "undefined") {
    var table2clipboard = {};
}

if (typeof(table2clipboard.formatters) == "undefined") {
    table2clipboard.formatters = {};
}

///////
/// HTML formatter
///////

table2clipboard.formatters.html = {};

(function() {
var htmlBuildersNS = table2clipboard.builders.html;

this.format = function(tableInfo, options) {
    var stylesMap;
    var excludeStylesMap;

    if (options.copyStyles) {
        stylesMap = [];
        excludeStylesMap = null;
    } else {
        stylesMap = null;
        excludeStylesMap = htmlBuildersNS.stylesAttributesMap;
    }

    var strTable = "";
    // check if tableInfo is an array
    if (Object.prototype.toString.apply(tableInfo) === '[object Array]') {
        for (var i in tableInfo) {
            strTable += createHTMLTable(tableInfo[i], options, stylesMap, excludeStylesMap);
        }
    } else {
        strTable += createHTMLTable(tableInfo, options, stylesMap, excludeStylesMap);
    }

    var strStyles = "";
    if (stylesMap) {
        for (var selector in stylesMap) {
            strStyles += selector + "\n";
        }

        if (strStyles != "") {
            strStyles = "<STYLE>\n" + strStyles + "\n</STYLE>\n";
        }
    }

    var str = "<HTML>\n";
    str += "<HEAD>\n";
    str += strStyles;
    str += "</HEAD>\n";
    str += "<BODY>\n" + strTable + "\n</BODY>\n"
    str += "</HTML>";

    return str;
}

function getNodeAttrs(node, excludeStylesMap) {
    if (node) {
        var attrs = new htmlBuildersNS.HtmlOutput(false);
        attrs.printNodeAttributes(node, excludeStylesMap);

        return attrs.getOutputText();
    }
    return "";
}

function createHTMLTable(tableInfo, options, stylesMap, excludeStylesMap) {
    var strTable = "";
    strTable += "<TABLE " + getNodeAttrs(tableInfo.tableNode, excludeStylesMap) + ">\n";
    strTable += "<TBODY>\n";

    if (stylesMap) {
        table2clipboard.css.utils.addStyles(tableInfo.tableNode, stylesMap);
    }
    var rows = tableInfo.rows;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var cells = row.cells;

        strTable += "<TR " + getNodeAttrs(row.rowNode, excludeStylesMap) + ">\n";
        if (stylesMap) {
            table2clipboard.css.utils.addStyles(row.rowNode, stylesMap);
        }

        for (var j = 0; j < cells.length; j++) {
            var cell = cells[j];

            if (cell) {
                var builder = new htmlBuildersNS.Builder(options);
                builder.build(cell.cellNode, stylesMap);
                strTable += builder.toHtml();
            } else {
                strTable += "<TD>&nbsp;</TD>";
            }
        }
        strTable += "\n</TR>\n";
    }
    strTable += "\n</TBODY>\n</TABLE>\n";

    return strTable;
}
}).apply(table2clipboard.formatters.html);

///////
/// CSV formatter
///////

table2clipboard.formatters.csv = {};

(function() {
var reLineBreak = /[\n\r]/g;
var reDuplicateQuote = /\"/g; // "

// str must be surronded with quotes if contains new lines
// if contains new lines and inside str there are quotes
// they must be escaped by duplicating the quote character
var handleSpecials = function(str) {
    if (reLineBreak.test(str)) {
        str = "\"" + str.replace(reDuplicateQuote, "\"\"") + "\"";
    }
    return str;
}

this.format = function(tableInfo, options) {
    var str = "";

    // check if tableInfo is an array
    if (Object.prototype.toString.apply(tableInfo) === '[object Array]') {
        for (var i in tableInfo) {
            str += createCSV(tableInfo[i], options) + "\n";
        }
    } else {
        str = createCSV(tableInfo, options);
    }

    return str;
}

function createCSV(tableInfo, options) {
    var rows = tableInfo.rows;
    var lastRow = rows.length - 1;
    var str = "";

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var cells = row.cells;
        var lastCol = cells.length - 1;

        for (var j = 0; j < cells.length; j++) {
            var cell = cells[j];
            var cellText = "";
            var colspan = -1;

            if (cell) {
                cellText = table2clipboard.common.getTextNodeContent(cell.cellNode);
                colspan = cell.cellNode.getAttribute("colspan");
            }
            str += handleSpecials(table2clipboard.common.trim(cellText));
            for (var cs = 1; cs < colspan; cs++) {
                str += options.columnSep;
            }
            if (j < lastCol) {
                str += options.columnSep;
            }
        }
        if (i < lastRow || options.appendRowSepAtEnd) {
            str += options.rowSep;
        }
    }
    return str;
}
}).apply(table2clipboard.formatters.csv);