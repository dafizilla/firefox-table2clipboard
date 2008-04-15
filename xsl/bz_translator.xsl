<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
                xmlns:html="http://www.w3.org/1999/xhtml"
                >
<xsl:output method="xml" indent="yes" />
<xsl:param name="first_locale_pos" />
    
    <!--
xmlstarlet tr /opt/devel/0dafiprj/srcmoz/common/xsl/bz_translator.xsl -s first_locale_pos=3 bz_listtrans_88_3114.xml | xmlstarlet fo -s 4
    -->
<xsl:template match="/">
    <extension>
        <locales>
    <xsl:apply-templates select="//html:div[@class='contentpane']/html:table/html:tr[html:td[1][text() != 'en-US'] and html:td[1] != 'it-IT']" mode="locale"/>
        </locales>
        <translators>
    <xsl:apply-templates select="//html:div[@class='contentpane']/html:table/html:tr[html:td[1][text() != 'en-US'] and html:td[1] != 'it-IT']" mode="translator"/>
        </translators>
    </extension>
</xsl:template>

<xsl:template match="html:div[@class='contentpane']/html:table/html:tr" mode="locale">
    <locale pos="{$first_locale_pos - 1 + position()}" code="{html:td[1]}" />
</xsl:template>

<xsl:template match="html:div[@class='contentpane']/html:table/html:tr" mode="translator">
    <translator code="{html:td[1]}"><xsl:value-of select="translate(html:td[3]/html:a, '&#x0a;&#x0d;', '  ')"/> (<xsl:value-of select="html:td[2]"/>)</translator>
</xsl:template>

</xsl:stylesheet>