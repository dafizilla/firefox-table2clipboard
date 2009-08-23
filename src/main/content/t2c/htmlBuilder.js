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
function Table2ClipBuilder(prefs) {
    this.isCanonical = false;

    this.htmlOutput = new Table2ClipHtmlOutput(this.isCanonical);
    this.nodeHandlers = [];
    this.prefs = prefs;

    this.copyStyles = this.prefs.getBool(T2CLIP_COPY_STYLES);

    if (this.prefs.getBool(T2CLIP_COPY_LINKS)) {
        this.nodeHandlers['a'] = this.handleLinksAsHtml;
    } else {
        this.nodeHandlers['a'] = this.handleLinksAsPlainText;
    }
}

Table2ClipBuilder.prototype = {
    handleLinksAsPlainText: function(t2cBuilder, node) {
	var output = new Table2ClipHtmlOutput(t2cBuilder.isCanonical);
        output.print(Table2ClipCommon.getTextNodeContent(node));
        
        return {content : output.getOutputText(),
		skipNode : false,
                skipChildren : false,
                skipAttributes : true};
    },

    handleLinksAsHtml : function(t2cBuilder, node) {
        var href = node.getAttribute('href');
        var uri = Components
            .classes["@mozilla.org/network/standard-url;1"]
            .createInstance(Components.interfaces.nsIURL);
        uri.spec = window.content.document.location;
    
	var output = new Table2ClipHtmlOutput(t2cBuilder.isCanonical);
        output.print(' ');
        output.print('href');
        output.print('="');
    
        output.normalizeAndPrint(uri.resolve(href), true);
        output.print('"');
        
        return {content : output.getOutputText(),
		skipNode : false,
                skipChildren : false,
                skipAttributes : true};
    },

    getNodeInfo : function(node) {
        var handler = this.nodeHandlers[node.localName.toLowerCase()];
        if (handler) {
            return handler(this, node);
        }
        return {content : "",
		skipNode : false,
                skipChildren : false,
                skipAttributes : false};
    },
    
    build : function(node) {
        // is there anything to do?
        if (node == null) {
            return;
        }

        var type = node.nodeType;

        switch (type) {
            case node.ELEMENT_NODE: {
                var style = node.ownerDocument.defaultView.getComputedStyle(node, null);
                if (style.getPropertyValue("display") == "none") {
                    return;
                }
                var nodeInfo = this.getNodeInfo(node);
                if (nodeInfo.skipNode) {
                    return;
                }
                this.htmlOutput.print('<');
                this.htmlOutput.print(node.nodeName);
		this.htmlOutput.print(nodeInfo.content);

                if  (!nodeInfo.skipAttributes) {
                    var attrs = node.attributes;
                    for (var i = 0; i < attrs.length; i++) {
                        var attr = attrs[i];
                        this.htmlOutput.print(' ');
                        this.htmlOutput.print(attr.nodeName);
                        this.htmlOutput.print('="');
    
                        this.htmlOutput.normalizeAndPrint(attr.nodeValue, true);
                        this.htmlOutput.print('"');
                    }
                }
                if (this.copyStyles) {
                    this.htmlOutput.print(' style="' + this.getStyleText(style) + '"');
                }
                this.htmlOutput.print('>');

                if (!nodeInfo.skipChildren) {
                    var child = node.firstChild;
                    while (child != null) {
                        this.build(child);
                        child = child.nextSibling;
                    }
                }
                break;
            }

            case node.ENTITY_REFERENCE_NODE: {
                if (this.isCanonical) {
                    var child = node.firstChild;
                    while (child != null) {
                        this.build(child);
                        child = child.nextSibling;
                    }
                }
                else {
                    this.htmlOutput.print('&');
                    this.htmlOutput.print(node.nodeName);
                    this.htmlOutput.print(';');
                }
                break;
            }

            case node.CDATA_SECTION_NODE: {
                if (this.isCanonical) {
                    this.htmlOutput.normalizeAndPrint(node.nodeValue, false);
                }
                else {
                    this.htmlOutput.print("<![CDATA[");
                    this.htmlOutput.print(node.nodeValue);
                    this.htmlOutput.print("]]>");
                }
                break;
            }

            case node.TEXT_NODE: {
                this.htmlOutput.normalizeAndPrint(node.nodeValue, false);
                break;
            }

        }

        if (type == Node.ELEMENT_NODE) {
	    this.htmlOutput.print("</");
	    this.htmlOutput.print(node.nodeName);
	    this.htmlOutput.print('>');
        }
    },

    getStyleText : function(style) {
        var computed = "";
        for (var i = 0; i < style.length; i++) {
            var cssPropName = style.item(i);
            computed += cssPropName + ":" + style.getPropertyValue(cssPropName) + ";";
        }
        
        return computed;
    },

    toHtml : function() {
        return this.htmlOutput.getOutputText();
    }
}

/**
 * Collect html output text using normalizing if necessary
 */
function Table2ClipHtmlOutput(isCanonical) {
    this.isCanonical = (typeof(isCanonical) == "undefined"
			|| isCanonical == null) ? false : isCanonical;
    this.htmlText = "";
}

Table2ClipHtmlOutput.prototype = {
    print : function(str) {
        this.htmlText += str;
    },
    
    println : function(str) {
        this.htmlText += str + "\n";
    },
    
    /** Normalizes and prints the given string. */
    normalizeAndPrint : function(s, isAttValue) {
        var len = (s != null) ? s.length : 0;
        for (var i = 0; i < len; i++) {
            var c = s.charAt(i);
	    this.print(Table2ClipCommon.getEntity(c, isAttValue));
        }
    },

    getOutputText : function() {
	return this.htmlText;
    }
}