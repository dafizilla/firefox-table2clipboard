function append_to_command_output_window(str) {
    console.log(str);
}

var output = "";

table2clipboard = {};
table2clipboard.common = {};
table2clipboard.common.log = function(str) {
    console.log(str);
//    append_to_command_output_window(str);
}


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
        this.attrsMap = {length : 0, map : []};
        //this.includeAttrs = {length : 0, map : []};
        //this.excludeAttrs = {length : 0, map : []};
    }

    AttributeRule.prototype = {
        /**
         * Add an attribute rule to the tag
         * @param attrName the attribute name
         * @param exclude if true the attribute must be removed, otherwise must be added
         */
        addAttribute : function(attrName, include) {
            if (!this.attrsMap.map[attrName]) {
                this.attrsMap.map[attrName] = {include: include};
                ++this.attrsMap.length;
            }
        }
    }

    AttributeRule.removeAttr = function(map, attrName) {
        if (map.map[attrName]) {
            --map.length;
            delete map.map[attrName];
        }
    }

// per l'attributo attr c'e' regola definita per il tag x?
// si, la applico
// no, c'e' una regola definita per *?
// si, la applico
// no, aggiungo l'attributo

    this.applyAttributeRules = function(rules, node, callback) {
        var newAttrs = [];
        var applied = false;

        if (rules) {
            var starRule = rules['*'];
            var starAttrsMap = starRule ? starRule.attrsMap.map : null;
            var tagRule = rules[node.localName.toLowerCase()];
            var attrs = node.attributes;
            var attrsMap;
            
            if (tagRule) {
                attrsMap = tagRule.attrsMap.map;
            } else {
                attrsMap = starAttrsMap;
                starAttrsMap = null;
            }

            if (starAttrsMap || attrsMap) {
                for (var i = 0; i < attrs.length; i++) {
                    var attr = attrs[i];
                    var attrInfo = attrsMap[attr.nodeName];
                    var canAddAttribute = true;

                    if (attrInfo) {
                        canAddAttribute = attrInfo.include;
                    } else {
                        if (starAttrsMap) {
                            var attrInfo = starAttrsMap[attr.nodeName];
                            if (attrInfo) {
                                canAddAttribute = attrInfo.include;
                            }
                        }
                    }
                    if (canAddAttribute) {
                        newAttrs.push({nodeName : attr.nodeName, nodeValue : attr.nodeValue});
                    }
                }
            }
        } else {
            newAttrs = node.attributes;
        }
        callback(node, newAttrs);
        return applied;
    }

    this.createRules = function(str) {
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
                rule.addAttribute(attr, !excludeAttr);
            }
        }
        return rules;
    }

this.AttributeRule = AttributeRule;
}).apply(table2clipboard.builders.html);


function printFilteredAttributes(node, attrs) {
    for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];

        output += (' ');
        output += (attr.nodeName);
        output += ('="');

        output += (attr.nodeValue);
        output += ('"');
    }
}


function printRules(rules) {
    for (i in rules) {
        var r = rules[i];
        var attrsMap = r.attrsMap.map;

        append_to_command_output_window("Rule for " + r.tagName);
        for (var attr in attrsMap) {
            var status = attrsMap[attr];
            append_to_command_output_window(attr + (status.include ? " included" : " excluded"));
        }
    }
}

function runRules() {
    var tests = [
        {   tag: '<td align="center" nowrap="nowrap" bgcolor="#eeeeee" scope="row"/>',
            expected: 'nowrap="nowrap" bgcolor="#eeeeee" scope="row"'},
        {   tag: '<body bgcolor="white"></body>',
            expected: ""},
        {   tag: '<body align="left" bgcolor="white" style="color:black"></body>',
            expected: 'align="left" style="color:black"'},
        //{tag: "", expected: ""},
        ];

    var parser = new DOMParser();
    var pattern = "*.align td.-align td.bgcolor *.-bgcolor";
    var rules = table2clipboard.builders.html.createRules(pattern);


    append_to_command_output_window("Pattern " + pattern);
    printRules(rules);
    append_to_command_output_window("\n");

    for (var i in tests) {
        var test = tests[i];
        output = "";

        var doc = parser.parseFromString(test.tag, "text/xml");
        var dom = doc.documentElement;

        table2clipboard.builders.html.applyAttributeRules(rules, dom, printFilteredAttributes);
        output = output.substring(1); // remove start space
        if (output != test.expected) {
            append_to_command_output_window("FAILED " + test.tag);
            append_to_command_output_window("Expected " + test.expected);
            append_to_command_output_window("Obtained " + output);
            append_to_command_output_window("");
        }
    }

}