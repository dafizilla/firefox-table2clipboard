// This code is heavily inspired by Chris Pederick (useragentswitcher) install.js
var contentFlag         = CONTENT | PROFILE_CHROME;
var displayName         = "@EXT_TITLE_NAME@";
var error               = null;
var folder              = getFolder("Current User", "chrome");
var localeFlag          = LOCALE | PROFILE_CHROME;
var name                = "@EXT_NAME@";
var jarName             = name + ".jar";
var existsInApplication = File.exists(getFolder(getFolder("chrome"), jarName));
var existsInProfile     = File.exists(getFolder(folder, jarName));
var skinFlag            = SKIN | PROFILE_CHROME;
var version             = "@VERSION@";

var locales             = new Array("en-US", "it-IT" ,"de-DE" ,"es-ES",
                                    "fr-FR", "nl-NL" ,"pl-PL", "tr-TR",
                                    "ru-RU", "zh-CN", "sk-SK", "pt-BR",
                                    "bg-BG", "da-DK", "fa-IR");
var skins               = new Array("classic");

// If the extension exists in the application folder or it doesn't exist in the profile folder and the user doesn't want it installed to the profile folder
if(existsInApplication || (!existsInProfile && !confirm("Do you want to install the " + displayName + " extension into your profile folder?\n(Cancel will install into the application folder)")))
{
    contentFlag = CONTENT | DELAYED_CHROME;
    folder      = getFolder("chrome");
    localeFlag  = LOCALE | DELAYED_CHROME;
    skinFlag    = SKIN | DELAYED_CHROME;
}

initInstall(displayName, name, version);
setPackageFolder(folder);
error = addFile(name, version, "chrome/" + jarName, folder, null);

// If adding the JAR file succeeded
if(error == SUCCESS)
{
    folder = getFolder(folder, jarName);

    registerChrome(contentFlag, folder, "content/" + name + "/");
    for (var i = 0; i < locales.length; i++) {
        registerChrome(localeFlag, folder, "locale/" + locales[i] + "/" + name + "/");
    }

    for (var i = 0; i < skins.length; i++) {
        registerChrome(skinFlag, folder, "skin/" + skins[i] + "/" + name + "/");
    }

    error = performInstall();

    // If the install failed
    if(error != SUCCESS && error != 999 && error != -239)
    {
        displayError(error);
    	cancelInstall(error);
    }
    else
    {
        alert("The installation of the " + displayName + " extension succeeded.");
    }
}
else
{
    displayError(error);
	cancelInstall(error);
}

// Displays the error message to the user
function displayError(error)
{
    // If the error code was -215
    if(error == -215)
    {
        alert("The installation of the " + displayName + " extension failed.\nOne of the files being overwritten is read-only.");
    }
    else if(error == -235)
    {
        alert("The installation of the " + displayName + " extension failed.\nThere is insufficient disk space.");
    }
    else
    {
        alert("The installation of the " + displayName + " extension failed.\nThe error code is: " + error);
    }
}