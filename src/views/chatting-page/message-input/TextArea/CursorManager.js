var IGNORE_ELEMENT_LIST = "AREA;BASE;BR;COL;EMBED;HR;IMG;INPUT;KEYGEN;LINK;MENUITEM;META;PARAM;SOURCE;TRACK;WBR;BASEFONT;BGSOUND;FRAME;ISINDEX".split(';');

function arrayContains(arr, e) {
    for (var t = arr.length; t--;) {
        if (arr[t] === e) {
            return true;
        }
    }
    return false
}

function isElementNode(e) {
    return 1 === e.nodeType && !arrayContains(IGNORE_ELEMENT_LIST, e.nodeName)
}

function getFirstChild(e) {
    for (var t = e.lastChild; t && 1 !== t.nodeType && t.previousSibling;) {
        t = t.previousSibling;
    }
    return t;
}

var CursorManager = {};

CursorManager.setEndOfContenteditable = function (e) {
    for (; getFirstChild(e) && isElementNode(getFirstChild(e));)
        e = getFirstChild(e);

    var range, selection;
    if (document.createRange) {
        range = document.createRange();
        range.selectNodeContents(e);
        range.collapse(false);
        selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        if (document.selection) {
            range = document.body.createTextRange();
            range.moveToElementText(e);
            range.collapse(false);
            range.select();
        }
    }

};

CursorManager.currentSelection = function () {
    if (window.getSelection) {
        var e = window.getSelection();
        if (e.getRangeAt && e.rangeCount)
            return e.getRangeAt(0)
    } else if (document.selection && document.selection.createRange)
        return document.selection.createRange()
};

CursorManager.insertHtmlAtCursor = function (e) {
    var selection, range;
    if (window.getSelection) {
        selection = window.getSelection()
        if (selection.getRangeAt && selection.rangeCount) {
            range = selection.getRangeAt(0);
            range.deleteContents();
            var node = document.createElement("span");
            node.innerHTML = e;
            var i = node.childNodes[0];
            range.insertNode(i);
            selection.removeAllRanges();
            range = range.cloneRange();
            range.selectNode(i);
            range.collapse(false);
            selection.addRange(range);
        }
    } else {
        if (document.selection && document.selection.createRange) {
            range = document.selection.createRange();
            range.pasteHTML(e);
            range.select();
        }
    }
};

CursorManager.restoreSelection = function (selRange) {
    if (selRange) {
        if (window.getSelection) {
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(selRange)
        } else {
            document.selection && selRange.select && selRange.select();
        }
    }
};

CursorManager.moveCaret = function (e) {
    var selection, range;
    if (window.getSelection) {
        selection = window.getSelection();
        if (selection.rangeCount > 0) {
            var r = selection.focusNode;
            var i = selection.focusOffset + e;
            selection.collapse(r, Math.min(r.length, i))
        }
    } else {
        selection = window.document.selection;
        if ("Control" !== selection.type) {
            range = selection.createRange();
            range.move("character", e);
            range.select();
        }
    }
};


CursorManager.saveCursor = function () {
    CursorManager.selRange = CursorManager.currentSelection()
};

CursorManager.restoreCursor = function () {
    CursorManager.restoreSelection(CursorManager.selRange)
};


export default CursorManager;


