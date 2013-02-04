function getURLMap(bodyHTML) {
    var urlMap = null;
    var urlMapStartIndex = bodyHTML.indexOf('"url_encoded_fmt_stream_map"');
    if (urlMapStartIndex != -1) {
        urlMap = bodyHTML.substring(urlMapStartIndex);
        var urlMapEndIndex = urlMap.indexOf('", ');
        if (urlMapEndIndex != -1) {
            urlMap = urlMap.substring(30, urlMapEndIndex);
        }
    }

    if (urlMap == null) throw 'Error: Couldn\'t find url map.';
    urlMap = urlMap.replace(/\\u0026/g, '&');
    return urlMap;
}

function getLinksAndFormats(urlMap) {
    var allLinks = urlMap.split(',');

    var linksAndFormats = new Array();
    var numOfLinks = 0;
    for (var i = 0; i < allLinks.length; i++) {
        var link = getCleanURL(allLinks[i]);
        var itagIndex = link.lastIndexOf('itag=');
        if (itagIndex != -1) {
            var fmt = parseInt(link.substring(itagIndex + 5));
            if (!isNaN(fmt)) {
                linksAndFormats[fmt.toString()] = link;
                numOfLinks++;
            }
            // else {
            //     alert('Ignoring link:\n' + link + '\nbecause tag at ' + itagIndex + ' is Nan.');
            // }
        }
        // else {
        //     alert('Ignoring link:\n' + link + '\nbecause itag index coud not be found');
        // }
    }
	
    if (numOfLinks == 0) throw 'Failed to find download links.';
    linksAndFormats[0] = numOfLinks;
    return linksAndFormats;
}

function getKeyAndVal(str) {
    var m = str.match(/^([^=]*)=(.*)$/);
    if (m)
    return [m[1], m[2]];
    return null;
}

function getCleanURL(url) {
    var mainParams = {};
    var splits = url.split("&");
    for (var i = 0; i < splits.length; i++) {
        var keyVal = getKeyAndVal(splits[i]);
        if (keyVal) mainParams[keyVal[0]] = keyVal[1];
    }
	
    var cleanURL = null;
    if ('url' in mainParams)
    cleanURL = unescape(mainParams['url']);
	
    else {
        // use regex
        var regexes = ['url=(http.+?videoplayback.+?id=.+?)(\u0026|&)quality=', '(http.+?videoplayback.+?id=.+?)(\u0026|&)'];
        for (var i = 0; i < regexes.length; i++) {
            var match = regexes[i].exec(url);
            if (match != null) {
                cleanURL = unescape(match[1]);
                break;
            }
        }
    }
   
    if (cleanURL) {
        // check for the signature
        if (cleanURL.indexOf('signature=') == -1 && cleanURL.indexOf('sig=') == -1) {
            var sig = null;
            if ('signature' in mainParams)
            sig = mainParams['signature'];
            else
            sig = mainParams['sig'];
		   
            if (sig) cleanURL = cleanURL + '&signature=' + sig;
        }
        else if (cleanURL.indexOf('sig=') != -1) {
            cleanURL.replace(/sig=/g, 'signature=');
        }
	   
        return cleanURL + '&title=' + document.title.match(/^(.*) - YouTube$/)[1];
    }
	
    return null;
}

function getHTMLForLinks(linksAndFormats) {
    var numOfLinks = linksAndFormats[0];
    var standardLinksHTML = '';
    var hdLinksHTML = '';
    var thereIsHD = false;
    var addDash = false;
    /** FMT mapping from youtube's videos' source:
    *  37 = 1920X1080 MP4
    *  46 = 1920X1080 WebM
    *  22 = 1280X720  MP4
    *  45 = 1280X720  WebM
    *  35 = Large     FLV
    *  44 = Large     WebM
    *  34 = Medium    FLV
    *  18 = Medium    MP4
    *  43 = Medium    WebM
    *  5  = Small     FLV
    */

    var addedSmall = false;
    if (linksAndFormats['5']) {
        standardLinksHTML += 'Small (<a href=\'' + linksAndFormats['5'] + '\'><span style="font-weight:normal">FLV</span></a>)%20%20%20%20%20';
        addDash = true;
    }

    var openedBracket = false,
    closedBracket = false;
    if (linksAndFormats['18']) {
        if (addDash) standardLinksHTML += ' - ';
        standardLinksHTML += 'Medium (<a href=\'' + linksAndFormats['18'] + '\'><span style="font-weight:normal">MP4</span></a>';
        addDash = false;
        openedBracket = true;
    }

    if (linksAndFormats['34']) {
        if (!openedBracket) standardLinksHTML += '- Medium (';
        else standardLinksHTML += ', ';
        standardLinksHTML += '<a href=\'' + linksAndFormats['34'] + '\'><span style="font-weight:normal">FLV</span></a>';
        openedBracket = true;
    }

    if (linksAndFormats['43']) {
        if (!openedBracket) standardLinksHTML += '- Medium (';
        else standardLinksHTML += ', ';
        standardLinksHTML += '<a href=\'' + linksAndFormats['43'] + '\'><span style="font-weight:normal">WebM</span></a>)';
        addDash = true;
        openedBracket = true;
        closedBracket = true;
    }

    if (openedBracket && !closedBracket) standardLinksHTML += ')';
    if (!addDash && (linksAndFormats['18'] || linksAndFormats['34'])) addDash = true;
    openedBracket = false, closedBracket = false;

    if (linksAndFormats['35']) {
        if (addDash) standardLinksHTML += ' - ';
        standardLinksHTML += 'Large (<a href=\'' + linksAndFormats['35'] + '\'><span style="font-weight:normal">FLV</span></a>';
        addDash = false;
        openedBracket = true;
    }

    if (linksAndFormats['44']) {
        if (!openedBracket) standardLinksHTML += '- Large (';
        else standardLinksHTML += ', ';
        standardLinksHTML += '<a href=\'' + linksAndFormats['44'] + '\'><span style="font-weight:normal">WebM</span></a>)';
        addDash = true;
        openedBracket = true;
        closedBracket = true;
    }
    if (openedBracket && !closedBracket) standardLinksHTML += ')';

    addDash = false, openedBracket = false, closedBracket = false;
    if (linksAndFormats['22']) {
        hdLinksHTML += '720p (<a href=\'' + linksAndFormats['22'] + '\'><span style="font-weight:normal">MP4</span></a>';
        thereIsHD = true;
        addDash = true;
        openedBracket = true;
    }

    if (linksAndFormats['45']) {
        if (!openedBracket) hdLinksHTML += '- 720p (';
        else hdLinksHTML += ', ';
        hdLinksHTML += '<a href=\'' + linksAndFormats['45'] + '\'><span style="font-weight:normal">WebM</span></a>)';
        thereIsHD = true;
        addDash = true;
        openedBracket = true;
        closedBracket = true;
    }
    if (openedBracket && !closedBracket) hdLinksHTML += ')';

    if (!addDash && (linksAndFormats['22'] || linksAndFormats['45'])) addDash = true;
    openedBracket = false, closedBracket = false;

    if (linksAndFormats['37']) {
        if (addDash) hdLinksHTML += ' - ';
        hdLinksHTML += '1080p (<a href=\'' + linksAndFormats['37'] + '\'><span style="font-weight:normal">MP4</span></a>';
        thereIsHD = true;
        addDash = true;
        openedBracket = true;
    }
    if (linksAndFormats['46']) {
        if (!openedBracket) hdLinksHTML += '- 1080p (';
        else hdLinksHTML += ', ';
        hdLinksHTML += '<a href=\'' + linksAndFormats['45'] + '\'><span style="font-weight:normal">WebM</span></a>)';
        thereIsHD = true;
        addDash = true;
        openedBracket = true;
        closedBracket = true;
    }
    if (openedBracket && !closedBracket) hdLinksHTML += ')';

    var title = '<h2 style="color:#333;text-shadow:1px 1px #fff;">Download (' + numOfLinks + ' links found)</h2><p style="color:#555;text-align:center;font-weight:bold">';
    if (thereIsHD) return unescape(title + standardLinksHTML + '<br />' + hdLinksHTML + '</p>');
    else return unescape(title + standardLinksHTML + '</p>');
}

function start() {
    if (document.URL.indexOf('.youtube.com/watch?v=') == -1) return;

    var error = null;
    var urlMap = null;
    var linksAndFormats = null;
    try {
        urlMap = getURLMap(document.body.innerHTML);
        linksAndFormats = getLinksAndFormats(urlMap);
    } catch (err) {
        error = err;
    }

    var download_div = document.createElement('span');
    download_div.id = 'youtube-download-span';
    var style = download_div.style;
    style.padding = '5px';
    style.borderRadius = '1em';
    style.lineHeight = '1.6';
    style.display = 'inline-block';
    style.margin = '5px auto';
    style.boxShadow = '4px 4px 3px #999';
    style.border = '1px #999 solid';
    style.backgroundColor = '#ffe';

    if (error == null) {
        // Append the links to the div
        download_div.innerHTML = getHTMLForLinks(linksAndFormats);
    } else {
        // Display the error
        download_div.innerHTML = unescape('<h3 style="color:#cc0000;">' + error + '</h3>');
    }
    var container_div = document.createElement('div');
    container_div.style.textAlign = 'center';
    container_div.appendChild(download_div);
    document.body.insertBefore(container_div, document.body.firstChild);
}

start();
