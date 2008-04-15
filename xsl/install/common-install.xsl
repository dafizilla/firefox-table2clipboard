<?xml version='1.0' encoding='utf-8' ?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" 
                xmlns:em="http://www.mozilla.org/2004/em-rdf#"
                xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

<xsl:variable name="extension-file">
    <xsl:choose>
        <xsl:when test="$use-exploded-chrome = 'true'">
            <xsl:value-of select="'plainfiles'"/>
        </xsl:when>
        <xsl:otherwise>
            <xsl:value-of select="concat(//extension/@name, '.jar')"/>
        </xsl:otherwise>
    </xsl:choose>
</xsl:variable>

<xsl:variable name="chrome-path">
    <xsl:choose>
        <xsl:when test="$use-exploded-chrome = 'true'">
            <xsl:value-of select="'chrome/plainfiles'"/>
        </xsl:when>
        <xsl:otherwise>
            <xsl:value-of select="concat('jar:chrome/', //extension/@name, '.jar!')"/>
        </xsl:otherwise>
    </xsl:choose>
</xsl:variable>

<xsl:template match="//locale" mode="install.js">
<xsl:text>&quot;</xsl:text><xsl:value-of select="@code"/><xsl:text>&quot;</xsl:text>
<xsl:choose>
    <xsl:when test="position() != last()"><xsl:text>,</xsl:text>
    <xsl:choose>
    <xsl:when test="(position() mod 4) = 0"><xsl:text>
                                    </xsl:text>
    </xsl:when>
    <xsl:otherwise><xsl:text> </xsl:text></xsl:otherwise>
    </xsl:choose>
    </xsl:when>
</xsl:choose>
</xsl:template>

<xsl:template match="//skin" mode="install.js">
<xsl:text>&quot;</xsl:text><xsl:value-of select="."/><xsl:text>&quot;</xsl:text>
<xsl:choose>
    <xsl:when test="position() != last()"><xsl:text>,</xsl:text>
    <xsl:choose>
    <xsl:when test="(position() mod 4) = 0"><xsl:text>
                                    </xsl:text>
    </xsl:when>
    <xsl:otherwise><xsl:text> </xsl:text></xsl:otherwise>
    </xsl:choose>
    </xsl:when>
</xsl:choose>
</xsl:template>

<xsl:template match="//pref" mode="install.js">
<xsl:text>&quot;</xsl:text><xsl:value-of select="."/><xsl:text>&quot;</xsl:text>
<xsl:choose>
    <xsl:when test="position() != last()"><xsl:text>,</xsl:text>
    <xsl:choose>
    <xsl:when test="(position() mod 4) = 0"><xsl:text>
                                    </xsl:text>
    </xsl:when>
    <xsl:otherwise><xsl:text> </xsl:text></xsl:otherwise>
    </xsl:choose>
    </xsl:when>
</xsl:choose>
</xsl:template>

<xsl:template match="//locale" mode="chrome-manifest">
<xsl:text>locale	</xsl:text><xsl:value-of select="//extension/@name"/>
<xsl:text>	</xsl:text>
<xsl:value-of select="@code"/>
<xsl:value-of select="name"/><xsl:text>	</xsl:text><xsl:value-of select="$chrome-path"/>/locale/<xsl:value-of select="@code"/><xsl:value-of select="//extension/chrome-extension-directory"/>/<xsl:text>
</xsl:text>
</xsl:template>

<xsl:template match="//style" mode="chrome-manifest">
<xsl:text>style	</xsl:text><xsl:value-of select="@uri"/><xsl:text>	</xsl:text><xsl:value-of select="@value"/><xsl:text>
</xsl:text>
</xsl:template>

<xsl:template match="//overlay" mode="chrome-manifest">
<xsl:text>overlay	</xsl:text><xsl:value-of select="@uri"/><xsl:text>	</xsl:text><xsl:value-of select="@value"/><xsl:text>
</xsl:text>
</xsl:template>

</xsl:stylesheet>
