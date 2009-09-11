// http://getfirebug.com/commandline.html

var cells = [
"/html/body/div/div[2]/div/table/tbody/tr[4]/td[2]",
"/html/body/div/div[2]/div/table/tbody/tr[4]/td[3]",
"/html/body/div/div[2]/div/table/tbody/tr[4]/td[5]",
"/html/body/div/div[2]/div/table/tbody/tr[6]/td[8]",
"/html/body/div/div[2]/div/table/tbody/tr[6]/td[9]"];

window.getSelection().removeAllRanges();

for (var i in cells) {
    var range = document.createRange()
    var node = $x(cells[i])[0];

    range.selectNode(node);

    window.getSelection().addRange(range); 
    console.log(node);
}
