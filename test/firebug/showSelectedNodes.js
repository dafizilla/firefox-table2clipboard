var sel = window.getSelection();
var r = sel.getRangeAt(0);

var s = new XMLSerializer();
var d = r.cloneContents();
var str = s.serializeToString(d);

var str2 = "";

var row = sel.getRangeAt(0).startContainer;
var cells = row.cells;

for (var cc = 0; cc < cells.length; cc++) {
  var theCell = cells.item(cc);

  if (sel.containsNode(theCell, false))  {
     var s = new XMLSerializer();
     var d = theCell;
     str2 += s.serializeToString(d);
  }
}

console.log(str);
console.log(str2);