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
     * Create a tag/attributes filter
     * @param tagName the tag name
     * @param excludeTag if true the tag must be excluded by filters
     */
    function TagFilter(tagName, excludeTag) {
        this.tagName = tagName;
        this.excludeTag = excludeTag === true;
        this.attrsMap = {};
    }

    TagFilter.prototype = {
        /**
         * Add an attribute filter to the tag
         * @param attrName the attribute name
         * @param include if true the attribute must be included by filters, otherwise must be removed
         */
        addAttribute : function(attrName, include) {
            if (!this.attrsMap[attrName]) {
                this.attrsMap[attrName] = {include: include};
            }
        }
    }

    /**
     * Apply the specified filters to the passed attributes and returns an array
     * with the matched ones, array contains {nodeName, nodeValue} objects
     * @param filters the filters map
     * @param nodeName the node name
     * @param attributes the attributes array to filter, array contains
     * {nodeName, nodeValue} objects
     * @returns array containing matching attributes
     */
    this.applyAttributeFilters = function(filters, nodeName, attributes) {
        var newAttrs = [];

        if (filters) {
            var starFilter = filters['*'];
            var starAttrsMap = starFilter ? starFilter.attrsMap : null;
            var tagFilter = filters[nodeName.toLowerCase()];
            var attrsMap;

            if (tagFilter) {
                attrsMap = tagFilter.attrsMap;
            } else {
                attrsMap = starAttrsMap;
                starAttrsMap = null;
            }

            if (starAttrsMap || attrsMap) {
                var attrs = attributes;

                for (var i = 0; i < attrs.length; i++) {
                    var attr = attrs[i];
                    var attrInfo = attrsMap[attr.nodeName] || attrsMap['*'];
                    var canAddAttribute = true;

                    if (attrInfo) {
                        canAddAttribute = attrInfo.include;
                    } else {
                        if (starAttrsMap) {
                            var attrInfo = starAttrsMap[attr.nodeName] || starAttrsMap['*'];
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
            newAttrs = attributes;
        }
        return newAttrs;
    }

    this.createAttributeFilters = function(str) {
        if (!str) {
            return null;
        }

        str = str.replace(/^\s+/, '').replace(/\s+$/, '');

        if (str.length == 0) {
            return null;
        }
        var filters = [];
        var patterns = str.toLowerCase().split(/\s/g);

        for (var i in patterns) {
            var pattern = patterns[i];
            var tokens = pattern.match(/(-?)(.*)\.(-?)(.*)/);

            if (tokens) {
                var excludeTag = tokens[1] == '-';
                var tag = tokens[2];
                var excludeAttr = tokens[3] == '-';
                var attr = tokens[4];

                var filter = filters[tag];
                if (!filter) {
                    filter = new TagFilter(tag, excludeTag);
                    filters[tag] = filter;
                }
                filter.addAttribute(attr, !excludeAttr);
            }
        }
        return filters;
    }

this.TagFilter = TagFilter;
}).apply(table2clipboard.builders.html);
