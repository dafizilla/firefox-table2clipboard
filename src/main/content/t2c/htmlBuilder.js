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

/**
 * Contains informations about a node to output, this object is returned by
 * node handlers
 * Below are described the object properties
 *   content - the user generated content to output for node (default == "")
 *   skipNode - do not output node and its children
 *   skipTagName - do not output tag name, both the open tag and close tag
 *   	(eg <a> and </a>) (default == false) used when #content handles tag
 *   skipChildren - do not output node children (ie stop recursive traversal
 *   	for children)
 *   skipAttributes - do not output node attributes
 */
function Table2ClipOutputNodeInfo() {
    this.content = "";
    this.skipTagName = false;
    this.skipNode = false;
    this.skipChildren = false;
    this.skipAttributes = false;
}

/**
 * Contains all handlers used by HTML builder
 */
var Table2ClipBuilderHandlers = {
    /**
     * Generate output for links as plain text, the tag A is removed and the
     * output contains only the link description generated using children nodes
     * @param t2cBuilder the builder running this handler
     * @param node the node to use to generate output info
     * @returns Table2ClipOutputNodeInfo
     */
    handleLinksAsPlainText: function(t2cBuilder, node) {
	var output = new Table2ClipHtmlOutput(t2cBuilder.isCanonical);
        output.print(Table2ClipCommon.getTextNodeContent(node));

	var nodeInfo = new Table2ClipOutputNodeInfo();
        nodeInfo.content = output.getOutputText();
	nodeInfo.skipTagName = true;
	nodeInfo.skipAttributes = true;
	nodeInfo.skipChildren = true;

	return nodeInfo;
    },

    /**
     * Generate output for links as tag A, normalize relative target URLs to
     * document location
     * @param t2cBuilder the builder running this handler
     * @param node the node to use to generate output info
     * @returns Table2ClipOutputNodeInfo
     */
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

	if (t2cBuilder.copyStyles) {
	    var style = Table2ClipCSSUtils.getStyleTextByNode(node);
	    
	    if (style != "") {
		output.print(' style="' + style + '"');
	    }
	}

	var nodeInfo = new Table2ClipOutputNodeInfo();
        nodeInfo.content = output.getOutputText();
	nodeInfo.skipAttributes = true;

	return nodeInfo;
    },

    /**
     * Generate output for BR tags, the output form is "<BR>" instead of "<BR></BR>"
     * @param t2cBuilder the builder running this handler
     * @param node the node to use to generate output info
     * @returns Table2ClipOutputNodeInfo
     */
    handleBR: function(t2cBuilder, node) {
	var output = new Table2ClipHtmlOutput(t2cBuilder.isCanonical);
        output.print("<BR>");

	var nodeInfo = new Table2ClipOutputNodeInfo();
        nodeInfo.content = output.getOutputText();
	nodeInfo.skipTagName = true;
	nodeInfo.skipAttributes = true;
	nodeInfo.skipChildren = true;

	return nodeInfo;
    }
};

/**
 * Collect HTML output text, if necessary normalize it encoding entities
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
	this.print(Table2ClipCommon.htmlEncode(s, isAttValue));
    },

    getOutputText : function() {
	return this.htmlText;
    }
}

/**
 * Builder used to generate HTML from a node (and its descendants)
 * @param options the options to use to generate HTML
 * Below are described the options object properties
 *   copyStyles - copy the node styles otherwise styles are empty
 *   copyLinks - copy the links as clickable otherwise output only the link text
 */
function Table2ClipBuilder(options) {
    this.isCanonical = false;
    this.htmlOutput = new Table2ClipHtmlOutput(this.isCanonical);
    this.copyStyles = options.copyStyles;
    this.defaultNodeInfo = new Table2ClipOutputNodeInfo();

    this.nodeHandlers = [];
    if (options.copyLinks) {
        this.nodeHandlers['a'] = Table2ClipBuilderHandlers.handleLinksAsHtml;
    } else {
        this.nodeHandlers['a'] = Table2ClipBuilderHandlers.handleLinksAsPlainText;
    }
    this.nodeHandlers['br'] = Table2ClipBuilderHandlers.handleBR;
}

Table2ClipBuilder.prototype = {
    getNodeInfo : function(node) {
        var handler = this.nodeHandlers[node.localName.toLowerCase()];
        if (handler) {
            return handler(this, node);
        }
        return this.defaultNodeInfo;
    },

    build : function(node) {
	this._internalBuild(node);
    },

    _internalBuild : function(node) {
        // is there anything to do?
        if (node == null) {
            return;
        }

        var type = node.nodeType;
	var skipTagName = false;

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
		skipTagName = nodeInfo.skipTagName;
		if (!skipTagName) {
		    this.htmlOutput.print('<');
		    this.htmlOutput.print(node.nodeName);
		}
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

		    if (this.copyStyles) {
			var style = Table2ClipCSSUtils.getStyleText(style);
			if (style != "") {
			    this.htmlOutput.print(' style="' + style + '"');
			}
		    }
                }
		if (!skipTagName) {
		    this.htmlOutput.print('>');
		}

                if (!nodeInfo.skipChildren) {
                    var child = node.firstChild;
                    while (child != null) {
                        this._internalBuild(child);
                        child = child.nextSibling;
                    }
                }
                break;
            }

            case node.ENTITY_REFERENCE_NODE: {
                if (this.isCanonical) {
                    var child = node.firstChild;
                    while (child != null) {
                        this._internalBuild(child);
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
	    if (!skipTagName) {
		this.htmlOutput.print("</");
		this.htmlOutput.print(node.nodeName);
		this.htmlOutput.print('>');
	    }
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