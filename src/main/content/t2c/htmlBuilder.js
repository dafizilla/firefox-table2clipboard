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

if (typeof(table2clipboard.builders) == "undefined") {
    table2clipboard.builders = {};
}

if (typeof(table2clipboard.builders.html) == "undefined") {
    table2clipboard.builders.html = {};
}

(function() {
/**
 * Contains informations about a node to output, this object is returned by
 * node handlers
 * Below are described the object properties
 *   content - the user generated content to output for node (default == "")
 *   skipNode - do not output node and its children
 *   skipTagName - do not output tag name, both the open tag and close tag
 *   (eg <a> and </a>) (default == false) used when #content handles tag
 *   skipChildren - do not output node children (ie stop recursive traversal
 *   for children)
 *   skipAttributes - do not output node attributes
 */
function OutputNodeInfo() {
    this.content = "";
    this.skipTagName = false;
    this.skipNode = false;
    this.skipChildren = false;
    this.skipAttributes = false;
}

this.OutputNodeInfo = OutputNodeInfo;

/**
 * Contains all handlers used by HTML builder
 */
nodeHandlers = [];

this.registerHandler = function(tagName, handler) {
    if (handler) {
        nodeHandlers[tagName.toLowerCase()] = handler;
    } else {
        alert("Unable to add invalid handler for tag name " + tagName);
    }
};

this.getHandler = function(tagName) {
    return nodeHandlers[tagName.toLowerCase()];
};

this.handlers = {
    /**
     * Generate output for links.
     * If copyLinks is true normalize relative target URLs to document location
     * otherwise the tag A is removed and the output contains only the link
     * description generated using children nodes
     * @param t2cBuilder the builder running this handler
     * @param node the node to use to generate output info
     * @returns OutputNodeInfo
     */
    handleA: function(t2cBuilder, node) {
        var nodeInfo = new OutputNodeInfo();

        if (t2cBuilder.options.copyLinks) {
            var href = node.getAttribute('href');
            var uri = Components
                .classes["@mozilla.org/network/standard-url;1"]
                .createInstance(Components.interfaces.nsIURL);
            uri.spec = window.content.document.location;

            var output = new HtmlOutput(t2cBuilder.isCanonical);
            output.print(' ');
            output.print('href');
            output.print('="');

            output.normalizeAndPrint(uri.resolve(href), true);
            output.print('"');

            nodeInfo.content = output.getOutputText();
            nodeInfo.skipAttributes = true;
        } else {
            var output = new HtmlOutput(t2cBuilder.isCanonical);
            output.print(table2clipboard.common.getTextNodeContent(node));

            nodeInfo.content = output.getOutputText();
            nodeInfo.skipTagName = true;
            nodeInfo.skipAttributes = true;
            nodeInfo.skipChildren = true;
        }

        return nodeInfo;
    },

    /**
     * Generate output for BR tags, the output form is "<BR>" instead of "<BR></BR>"
     * @param t2cBuilder the builder running this handler
     * @param node the node to use to generate output info
     * @returns OutputNodeInfo
     */
    handleBR: function(t2cBuilder, node) {
        var output = new HtmlOutput(t2cBuilder.isCanonical);
        output.print("<BR>");

        var nodeInfo = new OutputNodeInfo();
        nodeInfo.content = output.getOutputText();
        nodeInfo.skipTagName = true;
        nodeInfo.skipAttributes = true;
        nodeInfo.skipChildren = true;

        return nodeInfo;
    },

    handleIMG: function(t2cBuilder, node) {
        if (t2cBuilder.options.copyImages) {
            var nodeInfo = new OutputNodeInfo();
            nodeInfo.content = "";
            nodeInfo.skipTagName = false;
            nodeInfo.skipAttributes = false;
            nodeInfo.skipChildren = false;

            return nodeInfo;
        } else {
            return null;
        }
    }
};

/**
 * Collect HTML output text, if necessary normalize it encoding entities
 */
function HtmlOutput(isCanonical) {
    this.isCanonical = (typeof(isCanonical) == "undefined"
            || isCanonical == null) ? false : isCanonical;
    this.htmlText = "";
}

HtmlOutput.prototype = {
    print : function(str) {
        this.htmlText += str;
    },

    println : function(str) {
        this.htmlText += str + "\n";
    },

    /** Normalizes and prints the given string. */
    normalizeAndPrint : function(s, isAttValue) {
        this.print(table2clipboard.common.htmlEncode(s, isAttValue));
    },

    getOutputText : function() {
        return this.htmlText;
    },

    printNodeAttributes : function(node, excludedAttrs) {
        var attrs = node.attributes;
        for (var i = 0; i < attrs.length; i++) {
            var attr = attrs[i];
            if (excludedAttrs && excludedAttrs[attr.nodeName]) {
                continue;
            }
            this.print(' ');
            this.print(attr.nodeName);
            this.print('="');

            this.normalizeAndPrint(attr.nodeValue, true);
            this.print('"');
        }
    }
}

this.HtmlOutput = HtmlOutput;

/**
 * Builder used to generate HTML from a node (and its descendants)
 * @param options the options to use to generate HTML
 * Below are described the options object properties
 *   copyLinks - if true copy the links as clickable otherwise output only the link text
 *   copyImages - if true copy the IMG tags otherwise skip it and their descendant
 */
function Builder(options) {
    this.isCanonical = false;
    this.htmlOutput = new HtmlOutput(this.isCanonical);
    this.defaultNodeInfo = new OutputNodeInfo();
    this.options = options;
}

Builder.prototype = {
    getNodeInfo : function(node) {
        var handler = table2clipboard.builders.html.getHandler(node.localName);
        if (handler) {
            return handler(this, node);
        }
        return this.defaultNodeInfo;
    },

    build : function(node, stylesMap) {
        this._stylesMap = stylesMap;
        this._internalBuild(node);
        this._stylesMap = null;
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

                if (this._stylesMap) {
                    table2clipboard.css.utils.addStyles(node, this._stylesMap);
                }
                skipTagName = nodeInfo.skipTagName;
                if (!skipTagName) {
                    this.htmlOutput.print('<');
                    this.htmlOutput.print(node.nodeName);
                }
                this.htmlOutput.print(nodeInfo.content);

                if  (!nodeInfo.skipAttributes) {
                    this.htmlOutput.printNodeAttributes(node);
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

    toHtml : function() {
        return this.htmlOutput.getOutputText();
    }
}

this.Builder = Builder;
}).apply(table2clipboard.builders.html);
