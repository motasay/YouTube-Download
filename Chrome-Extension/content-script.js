function getURLMap(bodyHTML)
{
	var urlMap = null;
	var urlMapStartIndex = bodyHTML.indexOf('"url_encoded_fmt_stream_map"');
	if (urlMapStartIndex != -1)
	{
	  urlMap = bodyHTML.substring(urlMapStartIndex);
	  var urlMapEndIndex = urlMap.indexOf('", ');
	  if (urlMapEndIndex != -1)
	  {
		 urlMap = urlMap.substring(0, urlMapEndIndex);
	  }
	}
	
	if (urlMap == null)
	  throw 'Error: Couldn\'t find url map.';
	urlMap = urlMap.replace(/\\u0026/g, '&');
	return urlMap;
}

function getCleanURL(url, requiredParameters)
{
   url = unescape(url);
	var queryIndex = url.indexOf('?') + 1;
	var cleanedURL = url.substring(0, queryIndex);
	var paramsMap  = url.substring(queryIndex).split("&");
	for (var i = 0; i < requiredParameters.length; i++) {
		var param = requiredParameters[i];
		var value = getValueForParameter(paramsMap, param);
		if (value != null) {
			cleanedURL = cleanedURL + param + "=" + value;
			if (i + 1 != requiredParameters.length)
				cleanedURL = cleanedURL + "&";
		}
		
		if (param.toLowerCase() === 'sparams')
		{
			// loop through its the parameters specified here
			var sparams = value.split(',');
			for (var j = 0; j < sparams.length; j++)
			{
				param = sparams[j];
				if (requiredParameters.indexOf(param) == -1)
				{
					value = getValueForParameter(paramsMap, param);
					if (value != null)
					{
						cleanedURL = cleanedURL + param + "=" + value;
						if (i + 1 != requiredParameters.length)
							cleanedURL = cleanedURL + "&";
					}
// 					else
// 					{
// 						alert('Required param ' + param + ' not found.');
// 					}
				}
			}
		}
	}
	
	return cleanedURL;
}

function getValueForParameter(paramsMap, param)
{
	var val = null;
	for (var i = 0; i < paramsMap.length; i++) {
		if (paramsMap[i].indexOf(param + '=') == 0)
		{
			val = paramsMap[i].substring(paramsMap[i].indexOf("=") + 1);
			break;
		}
	}
	
	if (val == null && param.toLowerCase() === 'signature')
	{
		// signature may be there as "sig"
		val = getValueForParameter(paramsMap, "sig");
	}
	
	return val;
}

function getLinksAndFormats(urlMap)
{
  urlMap = unescape(urlMap);
  urlMap = unescape(urlMap);
  var myRegexp = new RegExp('url=(http.+?videoplayback.+?id=.+?)(\\\\u0026|&)quality=', 'g');
  var requiredParameters = ['upn', 'sparams', 'fexp', 'key', 'expire', 'itag', 'ipbits', 'sver', 'ratebypass', 'mt', 'ip', 'mv','source', 'ms', 'cp', 'id','newshard', 'signature', 'gcr'];
  var match = myRegexp.exec(urlMap);
  
  var linksAndFormats = new Array();
  var numOfLinks = 0;
  while (match != null) {
	 var link = getCleanURL(match[1], requiredParameters);
	 var itagIndex = link.lastIndexOf('itag=');
	 if (itagIndex != -1) {
		 var fmt = parseInt(link.substring(itagIndex+5));
		 if (!isNaN(fmt)) {
			 linksAndFormats[fmt.toString()] = link;
			 numOfLinks++;
		 }
	 }
	 match = myRegexp.exec(urlMap);
  }
  if (numOfLinks==0)
	 throw 'Failed to find download links.';
  linksAndFormats[0] = numOfLinks;
  return linksAndFormats;
}

function getHTMLForLinks(linksAndFormats)
{
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
  
  var openedBracket = false, closedBracket = false;
  if (linksAndFormats['18']) {
	 if (addDash)
		standardLinksHTML += ' - ';
	 standardLinksHTML += 'Medium (<a href=\'' + linksAndFormats['18'] + '\'><span style="font-weight:normal">MP4</span></a>';
	 addDash = false;
	 openedBracket = true;
  }
  
  if (linksAndFormats['34']) {
	 if (!openedBracket)
		standardLinksHTML += '- Medium (';
	 else
		standardLinksHTML += ', ';
	 standardLinksHTML += '<a href=\'' + linksAndFormats['34'] + '\'><span style="font-weight:normal">FLV</span></a>';
	 openedBracket = true;
  }
  
  if (linksAndFormats['43']) {
	 if (!openedBracket)
		standardLinksHTML += '- Medium (';
	 else
		standardLinksHTML += ', ';
	 standardLinksHTML += '<a href=\'' + linksAndFormats['43'] + '\'><span style="font-weight:normal">WebM</span></a>)';
	 addDash = true;
	 openedBracket = true;
	 closedBracket = true;
  }
  
  if (openedBracket && !closedBracket)
	 standardLinksHTML += ')';
  if (!addDash && (linksAndFormats['18'] || linksAndFormats['34']))
	 addDash = true;
  openedBracket = false, closedBracket = false;
  
  if (linksAndFormats['35']) {
	 if (addDash) 
		standardLinksHTML += ' - ';
	 standardLinksHTML += 'Large (<a href=\'' + linksAndFormats['35'] + '\'><span style="font-weight:normal">FLV</span></a>';
	 addDash = false;
	 openedBracket = true;
  }
  
  if (linksAndFormats['44']) {
	 if (!openedBracket)
		standardLinksHTML += '- Large (';
	 else
		standardLinksHTML += ', ';
	 standardLinksHTML += '<a href=\'' + linksAndFormats['44'] + '\'><span style="font-weight:normal">WebM</span></a>)';
	 addDash = true;
	 openedBracket = true;
	 closedBracket = true;
  }
  if (openedBracket && !closedBracket)
	 standardLinksHTML += ')';
	 
  addDash = false, openedBracket = false, closedBracket = false;
  if (linksAndFormats['22']) {
	 hdLinksHTML += '720p (<a href=\'' + linksAndFormats['22'] + '\'><span style="font-weight:normal">MP4</span></a>';
	 thereIsHD = true;
	 addDash = true;
	 openedBracket = true;
  }
  
  if (linksAndFormats['45']) {
	 if (!openedBracket)
		hdLinksHTML += '- 720p (';
	 else
		hdLinksHTML += ', ';
	 hdLinksHTML += '<a href=\'' + linksAndFormats['45'] + '\'><span style="font-weight:normal">WebM</span></a>)';
	 thereIsHD = true;
	 addDash = true;
	 openedBracket = true;
	 closedBracket = true;
  }
  if (openedBracket && !closedBracket)
	 hdLinksHTML += ')';
	 
  if (!addDash && (linksAndFormats['22'] || linksAndFormats['45']))
	 addDash = true;
  openedBracket = false, closedBracket = false;
  
  if (linksAndFormats['37']) {
	 if (addDash) 
		hdLinksHTML += ' - ';
	 hdLinksHTML += '1080p (<a href=\'' + linksAndFormats['37'] + '\'><span style="font-weight:normal">MP4</span></a>';
	 thereIsHD = true;
	 addDash = true;
	 openedBracket = true;
  }
  if (linksAndFormats['46']) {
	 if (!openedBracket)
		hdLinksHTML += '- 1080p (';
	 else
		hdLinksHTML += ', ';
	 hdLinksHTML += '<a href=\'' + linksAndFormats['45'] + '\'><span style="font-weight:normal">WebM</span></a>)';
	 thereIsHD = true;
	 addDash = true;
	 openedBracket = true;
	 closedBracket = true;
  }
  if (openedBracket && !closedBracket)
	 hdLinksHTML += ')';

  if (thereIsHD)
	 return unescape('<h3>Download: (' + numOfLinks + ' links found)</h3>' + '<p style="text-align:left;">Standard: <span style="font-weight: bold">' + standardLinksHTML + '</span><br />' + 'High Def: <span style="font-weight: bold">' + hdLinksHTML + '</span></p>');
  else
	 return unescape('<h3>Download: (' + numOfLinks + ' links found)</h3>' + '<p style="text-align:left;">Standard: <span style="font-weight: bold">' + standardLinksHTML + '</span></p>');
}

function start()
{
	if (document.URL.indexOf('http://www.youtube.com/watch?v=') == -1) return;
	
	var error = null;
	var urlMap = null;
	var linksAndFormats = null;
	try
	{
		urlMap = getURLMap(document.body.innerHTML);
		linksAndFormats = getLinksAndFormats(urlMap);
	}
	catch(err)
	{
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
	var container_div = document.createElement('div');
	container_div.style.textAlign = 'center';
	
	if (error == null)
	{
	  // Append the links to the div
	  style.backgroundColor = '#CCFFCC';
	  download_div.innerHTML = getHTMLForLinks(linksAndFormats)
	}
	else
	{
	  // Display the error
	  style.backgroundColor = '#FFF';
	  download_div.innerHTML = unescape('<h3 style="color:red;">' + error + '</h3>');
	}
	container_div.appendChild(download_div);
	document.body.insertBefore(container_div,document.body.firstChild);
}

start();