<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
<xsl:output method="text" omit-xml-declaration="yes"/>
<xsl:param name="use-exploded-chrome"/>
<xsl:include href="common-install.xsl"/>
<xsl:template match="extension">
<xsl:text>content	</xsl:text><xsl:value-of select="@name"/><xsl:text>	</xsl:text><xsl:value-of select="$chrome-path"/>/content<xsl:value-of select="chrome-extension-directory"/>/
<xsl:text>skin	</xsl:text><xsl:value-of select="@name"/>	classic/1.0	<xsl:value-of select="$chrome-path"/>/skin/classic<xsl:value-of select="chrome-extension-directory"/>/

<xsl:apply-templates select="styles/style" mode="chrome-manifest"/>

<xsl:text>
</xsl:text>
<xsl:apply-templates select="overlays/overlay" mode="chrome-manifest"/>

<xsl:text>
</xsl:text>

<xsl:apply-templates select="locales/locale" mode="chrome-manifest"/>
</xsl:template>
</xsl:stylesheet>
