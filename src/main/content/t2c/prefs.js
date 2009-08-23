/**
 * Author: Davide Ficano
 * Date  : 26-Dec-05
 */

const T2CLIP_ROW_SEP        = "rowSep";
const T2CLIP_COL_SEP        = "colSep";
const T2CLIP_ROW_SEP_ATEND  = "rowSepAtEnd";
const T2CLIP_COPY_STYLES    = "copyStyles";
const T2CLIP_COPY_LINKS     = "copyLinks";

function Table2ClipFormat() {
}

Table2ClipFormat.prototype = {
    get rowSep() {
        return this._rowSep;
    },

    set rowSep(v) {
        this._rowSep = v;
    },

    get columnSep() {
        return this._columnSep;
    },

    set columnSep(v) {
        this._columnSep = v;
    },

    get appendRowSepAtEnd() {
        return this._appendRowSepAtEnd;
    },

    set appendRowSepAtEnd(b) {
        this._appendRowSepAtEnd = b;
    }
};

function Table2ClipPrefs() {
    this.prefBranch = Components
        .classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService)
        .getBranch("extensions.dafizilla.table2clip.");

    this.format = new Table2ClipFormat();
}

Table2ClipPrefs.prototype = {
    getString : function(prefName, defValue) {
        var prefValue;
        try {
            prefValue = this.prefBranch.getCharPref(prefName);
        } catch (ex) {
            prefValue = null;
        }
        return prefValue == null ? defValue : prefValue;
    },

    getBool : function(prefName, defValue) {
        var prefValue;
        try {
            prefValue = this.prefBranch.getBoolPref(prefName);
        } catch (ex) {
            prefValue = null;
        }
        return prefValue == null ? defValue : prefValue;
    },

    setString : function(prefName, prefValue) {
        this.prefBranch.setCharPref(prefName, prefValue);
    },

    setBool : function(prefName, prefValue) {
        this.prefBranch.setBoolPref(prefName, prefValue);
    },

    getClipFormat : function() {
        this.format.rowSep = this.getString(T2CLIP_ROW_SEP,
                                Table2ClipCommon.isOSWin() ? "\r\n" : "\n");
        this.format.columnSep = this.getString(T2CLIP_COL_SEP, "\t");
        this.format.appendRowSepAtEnd = this.getBool(T2CLIP_ROW_SEP_ATEND, true);

        return this.format;
    },

    setClipFormat : function(format) {
        this.format = format;
    },

    savePrefs : function() {
        this.setString(T2CLIP_ROW_SEP, this.format.rowSep);
        this.setString(T2CLIP_COL_SEP, this.format.columnSep);
        this.setBool(T2CLIP_ROW_SEP_ATEND, this.format.appendRowSepAtEnd);
    }
};