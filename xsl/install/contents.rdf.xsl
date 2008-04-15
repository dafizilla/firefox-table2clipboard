<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
                xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<xsl:output method="xml" indent="yes" />
<xsl:param name="use-exploded-chrome"/>
<xsl:include href="common-install.xsl"/>

<xsl:template match="//overlay" mode="contents.rdf-list">
    <RDF:li RDF:resource="{@uri}"/>
</xsl:template>

<xsl:template match="//overlay" mode="contents.rdf-element">
  <xsl:comment><xsl:value-of select="concat(' ', @description, ' ')"/></xsl:comment>
  <RDF:Seq RDF:about="{@uri}">
    <RDF:li><xsl:value-of select="@value"/></RDF:li>
  </RDF:Seq>
</xsl:template>

<xsl:template match="extension">
<RDF:RDF xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
     xmlns:chrome="http://www.mozilla.org/rdf/chrome#">

  <RDF:Seq RDF:about="urn:mozilla:package:root">
    <RDF:li RDF:resource="urn:mozilla:package:{@name}"/>
  </RDF:Seq>

  <RDF:Description RDF:about="urn:mozilla:package:{@name}"
                   chrome:author="{author}"
                   chrome:authorURL="{homepage}"
                   chrome:description="{description}"
                   chrome:displayName="{title-name}"
                   chrome:extension="true"
                   chrome:name="{@name}"
                   chrome:settingsURL="chrome://{@name}/{optionurl-path}"
                   chrome:iconURL="chrome://{@name}/{iconurl-path}">
  </RDF:Description>

  <RDF:Seq RDF:about="urn:mozilla:overlays">
    <xsl:apply-templates select="overlays/overlay" mode="contents.rdf-list"/>
  </RDF:Seq>

  <xsl:apply-templates select="overlays/overlay" mode="contents.rdf-element" />

</RDF:RDF>
</xsl:template>
</xsl:stylesheet>

