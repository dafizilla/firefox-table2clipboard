eval(ko.projects.findPart('macro', 'append_to_command_output_window', 'container').value);
append_to_command_output_window("", true);

table2clipboard = {};
table2clipboard.common = {};
table2clipboard.common.log = function(str) {
//    append_to_command_output_window(str);
}


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
    function AttributeRule(tagName, excludeTag) {
        this.tagName = tagName;
        this.excludeTag = excludeTag === true;
        this.includeAttrs = {length : 0, map : []};
        this.excludeAttrs = {length : 0, map : []};
    }

    AttributeRule.prototype = {
        addIncludeAttr : function(attrName) {
            this.addElement(this.includeAttrs, attrName);
        },

        addExcludeAttr : function(attrName) {
            this.addElement(this.excludeAttrs, attrName);
        },

        addElement : function(map, attrName) {
            if (!map.map[attrName]) {
                map.map[attrName] = 1;
                ++map.length;
            }
        }
    }

    AttributeRule.removeAttr = function(map, attrName) {
        if (map.map[attrName]) {
            --map.length;
            delete map.map[attrName];
        }
    }

    this.applyAttributeRules = function(rules, node, callback) {
        var newAttrs = [];
        var applied = false;

        if (rules) {
            var rule = rules[node.localName.toLowerCase()] || rules['*'];

            if (rule) {
                table2clipboard.common.log("using tag " + rule.tagName);
                attributes(rule, node.attributes, newAttrs);
                applied = true;
            }
        } else {
            newAttrs = node.attributes;
        }
        callback(node, newAttrs);
        return applied;
    }

    function attributes(rule, attrs, newAttrs) {
        var includeAll = rule.includeAttrs.length == 0 || rule.includeAttrs.map['*'];

        for (var i = 0; i < attrs.length; i++) {
            var attr = attrs[i];

                table2clipboard.common.log("using attr " + attr.nodeName);
            if (rule.excludeAttrs.map[attr.nodeName]) {
                table2clipboard.common.log("exclude attr " + attr.nodeName);
                continue;
            }
            if (includeAll || rule.includeAttrs.map[attr.nodeName]) {
                table2clipboard.common.log("include attr " + attr.nodeName);
                newAttrs.push({nodeName : attr.nodeName, nodeValue : attr.nodeValue});
            }
        }

        return newAttrs;
    }

    this.createRules = function(str, makeDiff) {
        str = str.replace(/^\s+/, '').replace(/\s+$/, '');

        if (str.length == 0) {
            return null;
        }
        var rules = [];
        var patterns = str.toLowerCase().split(/\s/g);

        for (var i in patterns) {
            var pattern = patterns[i];
            var tokens = pattern.match(/(-?)(.*)\.(-?)(.*)/);

            if (tokens) {
                var excludeTag = tokens[1] == '-';
                var tag = tokens[2];
                var excludeAttr = tokens[3] == '-';
                var attr = tokens[4];

                var rule = rules[tag];
                if (!rule) {
                    rule = new AttributeRule(tag, excludeTag);
                    rules[tag] = rule;
                }
                if (excludeAttr) {
                    rule.addExcludeAttr(attr);
                } else {
                    rule.addIncludeAttr(attr);
                }
            }
        }
        return makeDiff ? resolve(rules) : rules;
    }

    function diff(map1, map2) {
        for (var i in map1.map) {
            AttributeRule.removeAttr(map2, i);
        }
    }
    
    function resolve(rules) {
        var starRules = rules['*'];
        if (starRules) {
            for (var i in rules) {
                var rule = rules[i];
                if (rule.tagName != '*') {
                    diff(starRules.includeAttrs, rule.excludeAttrs);
                    diff(starRules.excludeAttrs, rule.includeAttrs);
                }
            }
        }
        
        return rules;
    }

this.AttributeRule = AttributeRule;
}).apply(table2clipboard.builders.html);


function printFilteredAttributes(node, attrs) {
    for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];

        s += (' ');
        s += (attr.nodeName);
        s += ('="');

        s += (attr.nodeValue);
        s += ('"');
    }
}


function printRules(rules) {
    for (i in rules) {
        var r = rules[i];
        
        append_to_command_output_window("Rule for " + r.tagName);
        for (var inc in r.includeAttrs.map) {
            append_to_command_output_window("Include " + inc);
        }
        for (var inc in r.excludeAttrs.map) {
            append_to_command_output_window("Exclude " + inc);
        }
    }
}

var body = document.createElement("body");
body.setAttribute("bgcolor", "white");

//var td = document.createElement("td");
//td.setAttribute("align", "center");
//td.setAttribute("nowrap", "nowrap");
//td.setAttribute("bgcolor", "#eeeeee");
//td.setAttribute("scope", "row");

var tests = [
    {   tag: "<td align='center' nowrap='nowrap' bgcolor='#eeeeee' scope='row'/>",
        expected: "nowrap='nowrap' bgcolor='#eeeeee' scope='row'"},
    {   tag: "<body bgcolor='white'></body>",
        expected: ""},
    {   tag: "<body align='left' bgcolor='white' style='color:black'></body>",
        expected: "style='color:black'"},
    //{tag: "", expected: ""},
    ];

var parser = new DOMParser();
var pattern = "*.align td.-align td.bgcolor *.-bgcolor";
var rules = table2clipboard.builders.html.createRules(pattern);

printRules(rules);
append_to_command_output_window("\n");

for (var i in tests) {
    var test = tests[i];
    var s = "";

    var doc = parser.parseFromString(test.tag, "text/xml");
    var dom = doc.documentElement;

    table2clipboard.builders.html.applyAttributeRules(rules, dom, printFilteredAttributes);
    if (s != test.expected) {
        append_to_command_output_window("FAILED " + test.tag);
        append_to_command_output_window("Expected " + test.expected);
        append_to_command_output_window("Obtained " + s);
        append_to_command_output_window("");
    }
}


