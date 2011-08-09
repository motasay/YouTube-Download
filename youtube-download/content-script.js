var myFlashVars = document.getElementById('movie_player').getAttribute('flashvars');
myFlashVars = myFlashVars.replace('%25', '%'); // remove the % escapes
myFlashVars = myFlashVars.replace('%25', '%');
var indexOfUrlMap = myFlashVars.indexOf('url_encoded_fmt_stream_map=')+27;
var indexOfNextAtt = myFlashVars.indexOf('&watermark');
myFlashVars = myFlashVars.substring(indexOfUrlMap,indexOfNextAtt);
myFlashVars = unescape(myFlashVars);

var links = myFlashVars.split(',');

var linksAndFormats = new Array();
var numOfLinks = 0;
for (var i=0; i < links.length; i++) {
  var link = unescape(links[i]);
  // skip the first 3 dots to remove the ISP part from the link
  for (var j = 0; j < 3; j++) {
     var indexOfDot = link.indexOf('.');
     link = link.substring(indexOfDot+1, link.length-1);
  }
  link = 'http://' + link.substring(0, link.indexOf('&fallback'));

  var lastIndex = link.lastIndexOf('itag=');
  if (lastIndex != -1) {
     var fmt = link.substring(lastIndex+5, link.length);  
     if (isNaN(fmt)) // maybe there is some chars appended to it. Try to fix it
        fmt = parseInt(fmt);
   
     if (!isNaN(fmt) && link != null) {
        linksAndFormats[fmt.toString()] = link;
        numOfLinks++;
     }
  }
}

// Display them
if (numOfLinks > 0) {
   var download_div = document.createElement('span');
   download_div.id = 'youtube-download-span';
   var style = download_div.style;
   style.backgroundColor = '#CCFFCC';
   style.padding = '5px';
   style.borderRadius = '1em';
   style.lineHeight = '160%';
   style.display = 'inline-block';
   style.margin = '5px auto';
   var container_div = document.createElement('div');
   container_div.style.textAlign = 'center';
   
   var standardLinksHTML = '';
   var hdLinksHTML = '';
   var thereIsHD = false;
   var addDash = false;
   
  /** FMT mapping from youtube's videos' source:
   *  37 = 1920X1080 MP4
   *  22 = 1280X720  MP4
   *  45 = 1280X720  WebM
   *  35 = 854X480   FLV
   *  44 = 854X480   WebM
   *  34 = 640X360   FLV
   *  18 = 640X360   MP4
   *  43 = 640X360   WebM
   *  5  = 320X240   FLV
   */
   
   if (linksAndFormats['5']) {
      standardLinksHTML += '<a href=\'' + linksAndFormats['5'] + '\'>240p(flv)%20%20%20%20%20</a>';
      addDash = true;
    }
    
    if (linksAndFormats['18']) {
       if (addDash)
          standardLinksHTML += ' - ';
       standardLinksHTML += '<a href=\'' + linksAndFormats['18'] + '\'>360p(mp4)%20%20%20%20%20</a>';
       addDash = true;
    }
    
    if (linksAndFormats['34']) {
       if (addDash)
          standardLinksHTML += ' - ';
       standardLinksHTML += '<a href=\'' + linksAndFormats['34'] + '\'>360p(flv)%20%20%20%20%20</a>';
       addDash = true;
    }
    
    if (linksAndFormats['43']) {
       if (addDash)
          standardLinksHTML += ' - ';
       standardLinksHTML += '<a href=\'' + linksAndFormats['43'] + '\'>360p(WebM)%20%20%20%20%20</a>';
       addDash = true;
    }
    
    if (linksAndFormats['35']) {
       if (addDash) 
          standardLinksHTML += ' - ';
       standardLinksHTML += '<a href=\'' + linksAndFormats['35'] + '\'>480p(flv)%20%20%20%20%20</a>';
    }
    
    if (linksAndFormats['44']) {
       if (addDash)
          standardLinksHTML += ' - ';
       standardLinksHTML += '<a href=\'' + linksAndFormats['44'] + '\'>480p(WebM)%20%20%20%20%20</a>';
       addDash = true;
    }
    
    addDash = false;
    if (linksAndFormats['22']) {
       hdLinksHTML += '<a href=\'' + linksAndFormats['22'] + '\'>720p(mp4)%20%20%20%20%20</a>';
       thereIsHD = true;
       addDash = true;
    }
    
    if (linksAndFormats['45']) {
       hdLinksHTML += '<a href=\'' + linksAndFormats['45'] + '\'>720p(WebM)%20%20%20%20%20</a>';
       thereIsHD = true;
       addDash = true;
    }
    
    if (linksAndFormats['37']) {
       if (addDash) 
          hdLinksHTML += ' - ';
       hdLinksHTML += '<a href=\'' + linksAndFormats['37'] + '\'>1080p(mp4)</a>';
    }
    
    if (thereIsHD)
       download_div.innerHTML = unescape('<h3>Download: (' + numOfLinks + ' links found)</h3>' + '<p style="text-align:left;">Standard: ' + standardLinksHTML + '<br />' + 'High Def: ' + hdLinksHTML + '</p>');
    else
       download_div.innerHTML = unescape('<h3>Download: (' + numOfLinks + ' links found)</h3>' + '<p style="text-align:left;">Standard: ' + standardLinksHTML + '</p>');
    
    container_div.appendChild(download_div);
    document.body.insertBefore(container_div,document.body.firstChild);
}