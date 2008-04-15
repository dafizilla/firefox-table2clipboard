<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
                xmlns:em="http://www.mozilla.org/2004/em-rdf#"
                xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<xsl:output method="xml" indent="yes" />
<xsl:template match="//compatibility/application" mode="update.rdf">
    <xsl:comment><xsl:value-of select="concat(' ',description, ' ')"/></xsl:comment>
    <em:targetApplication>
      <RDF:Description>
        <em:id><xsl:value-of select="id"/></em:id>
        <em:minVersion><xsl:value-of select="minVersion"/></em:minVersion>
        <em:maxVersion><xsl:value-of select="maxVersion"/></em:maxVersion>
        <em:updateLink><xsl:value-of select="//updateLink"/></em:updateLink>
        <em:updateHash></em:updateHash>
      </RDF:Description>
    </em:targetApplication>
</xsl:template>
    
<xsl:template match="extension">
<RDF:RDF xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:em="http://www.mozilla.org/2004/em-rdf#">

     <RDF:Description RDF:about="urn:mozilla:extension:{uuid}">
        <em:updates>
            <RDF:Seq>
                <RDF:li RDF:resource="urn:mozilla:extension:{uuid}:{version}"/>
            </RDF:Seq>
        </em:updates>
        <em:version><xsl:value-of select="version"/></em:version>
        <em:updateLink><xsl:value-of select="updateLink"/></em:updateLink>
     </RDF:Description>

    <RDF:Description RDF:about="urn:mozilla:extension:{uuid}:{version}">
        <em:version><xsl:value-of select="version"/></em:version>
    
<xsl:apply-templates select="compatibility/application" mode="update.rdf"/>

    </RDF:Description>
 </RDF:RDF>
</xsl:template>
</xsl:stylesheet>