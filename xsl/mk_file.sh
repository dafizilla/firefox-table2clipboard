DEST_DIR=tmp/
XSL_DIR=xsl

if [ "$1" == "true" ];
then
    echo "UpdateURL informations have been added to install.rdf"
else
    echo "UpdateURL informations not added"
fi

xsltproc --path $XSL_DIR -o $DEST_DIR/tmp.xml -stringparam generate-updateurl "$1" $XSL_DIR/install/install.rdf.xsl extension.xml
# Pretty print the xml
xmllint -o $DEST_DIR/install.rdf --format $DEST_DIR/tmp.xml

xsltproc --path $XSL_DIR -o $DEST_DIR/chrome.manifest $XSL_DIR/install/chrome.manifest.xsl extension.xml

xsltproc --path $XSL_DIR -o $DEST_DIR/install.js $XSL_DIR/install/install.js.xsl extension.xml

xsltproc --path $XSL_DIR -o $DEST_DIR/tmp.xml $XSL_DIR/install/contents.rdf.xsl extension.xml
# Pretty print the xml
xmllint -o $DEST_DIR/contents.rdf --format $DEST_DIR/tmp.xml

rm $DEST_DIR/tmp.xml
