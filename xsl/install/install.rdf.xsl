<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:em="http://www.mozilla.org/2004/em-rdf#"
                version="1.0">
<!--<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"-->
<!--                xmlns:xalan="http://xml.apache.org/xslt">-->
<!--<xsl:output method="xml" indent="yes" xalan:indent-amount="2" omit-xml-declaration="no"/>-->
<xsl:output method="xml" indent="yes" />
<xsl:param name="generate-updateurl"/>
<xsl:param name="use-exploded-chrome"/>
<xsl:include href="common-install.xsl"/>

<xsl:template match="//locale" mode="install.rdf">
<em:locale>locale/<xsl:value-of select="@code"/><xsl:value-of select="//extension/chrome-extension-directory"/>/</em:locale>
</xsl:template>

<xsl:template match="//contributor" mode="install.rdf">
        <em:contributor><xsl:value-of select="." disable-output-escaping="yes"/></em:contributor>
</xsl:template>

<xsl:template match="//translator" mode="install.rdf">
        <em:translator><xsl:value-of select="." disable-output-escaping="yes"/></em:translator>
</xsl:template>

<xsl:template match="//compatibility/application" mode="install.rdf">
    <xsl:comment><xsl:value-of select="concat(' ',description, ' ')"/></xsl:comment>
    <em:targetApplication>
      <Description>
        <em:id><xsl:value-of select="id"/></em:id>
        <em:minVersion><xsl:value-of select="minVersion"/></em:minVersion>
        <em:maxVersion><xsl:value-of select="maxVersion"/></em:maxVersion>
      </Description>
    </em:targetApplication>
</xsl:template>

<xsl:template match="extension">
<RDF xmlns="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

  <Description about="urn:mozilla:install-manifest">
    <em:id><xsl:value-of select="uuid"/></em:id>
    <em:name><xsl:value-of select="title-name"/></em:name>
    <em:version><xsl:value-of select="version"/></em:version>
    <em:description><xsl:value-of select="description"/></em:description>
    <em:creator><xsl:value-of select="author"/></em:creator>

<xsl:apply-templates select="translators/translator" mode="install.rdf"/>
<xsl:apply-templates select="contributors/contributor" mode="install.rdf"/>

    <em:homepageURL><xsl:value-of select="homepage"/></em:homepageURL>

    <xsl:if test="$generate-updateurl = 'true'">
    <em:updateURL><xsl:value-of select="updateurl"/></em:updateURL>
    <em:updateKey>MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD3PgNKVyoQIfygs5ZetbWKi1
		  WP4QZo/OisHBpKI2ke/ZATE60S4kr5+3iNAjV9Vj4jG797nL2N/Cq8OnMDna+rB
		  /xFw5n7mU0gswZk8HBz8euWAuoo0lD/HoNattF79quYEFDU/H8gblKyH529NiQw
		  26bUyAC61RYTxWHgSAlIxQIDAQAB
    </em:updateKey>
    </xsl:if>

    <xsl:if test="string-length(optionurl-path) != 0">
    <xsl:comment> Front End Integration Hooks (used by Extension Manager) </xsl:comment>
    <em:optionsURL>chrome://<xsl:value-of select="@name"/><xsl:value-of select="optionurl-path"/></em:optionsURL>
    </xsl:if>
    <xsl:if test="string-length(iconurl-path) != 0">
    <em:iconURL>chrome://<xsl:value-of select="@name"/>/<xsl:value-of select="iconurl-path"/></em:iconURL>
    </xsl:if>

    <em:file>
      <Description about="urn:mozilla:extension:file:{$extension-file}">
        <em:package>content<xsl:value-of select="chrome-extension-directory"/>/</em:package>
        <xsl:apply-templates select="locales/locale" mode="install.rdf"/>
        <em:skin>skin/classic<xsl:value-of select="chrome-extension-directory"/>/</em:skin>
      </Description>
    </em:file>

<xsl:apply-templates select="compatibility/application" mode="install.rdf"/>
  </Description>
</RDF>
</xsl:template>
</xsl:stylesheet>
