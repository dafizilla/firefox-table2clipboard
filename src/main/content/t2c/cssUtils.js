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

var Table2ClipCSSUtils = {
    cssStyles : [
        "background-color",
        
        "border-bottom-color",
        "border-bottom-style",
        "border-bottom-width",
        "border-left-color",
        "border-left-style",
        "border-left-width",
        "border-right-color",
        "border-right-style",
        "border-right-width",
        "border-top-color",
        "border-top-style",
        "border-top-width",
        
        "font-family",
        "font-size",
        "font-style",
        "font-variant",
        "font-weight",
        
        "margin-bottom",
        "margin-left",
        "margin-right",
        "margin-top",
        
        "padding-bottom",
        "padding-left",
        "padding-right",
        "padding-top",
        
        "border-collapse",
        "border-spacing",
        "empty-cells",
        "table-layout",
        
        "color",
        "direction",
        "line-height",
        "text-align",
        "text-decoration",
        "text-indent",
        "text-shadow",
        "text-transform",
        "unicode-bidi",
        "vertical-align",
        "white-space",
        "word-spacing"
    ],

    /**
     * Get the string in the HTML style attribute format, eg. css-prop: css-value.
     * Only the styles meaningful for applications like Microsoft Excel and
     * OpenOffice Calc are returned.
     * @param node the node from which get style
     * @returns the string containing the CSS style values
     */
    getStyleTextByNode : function(node) {
        var nodeWindow = node.ownerDocument.defaultView;
	return this.getStyleText(nodeWindow.getComputedStyle(node, null));
    },

    /**
     * Get the string in the HTML style attribute format, eg. css-prop: css-value.
     * Only the styles meaningful for applications like Microsoft Excel and
     * OpenOffice Calc are returned.
     * @param style the CSSStyleDeclaration object
     * @returns the string containing the CSS style values
     */
    getStyleText : function(cssStyleDeclaration) {
        var computed = "";

        for (var i = 0; i < this.cssStyles.length; i++) {
            var cssPropName = this.cssStyles[i];
            var cssPropValue = cssStyleDeclaration.getPropertyValue(cssPropName);

            computed += cssPropName + ":" + cssPropValue + ";";
        }

        return computed;
    }
}