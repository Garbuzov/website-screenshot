chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  console.log(request.msg);
  if (request.msg == 'loadPage') {
    request.url.forEach(function(link){
      screenLink(link);
    });
    callback(); 
  } else if (request.msg === 'capturePage') {
    capturePage(request, sender, callback);
    return true;
  } else if (request.msg == 'ready') {
    console.log('Done');
  }
  
});

/**
 * Screen Link
 */ 
function screenLink(link) {
  chrome.tabs.create({url: link}, function(tab){
    chrome.tabs.executeScript(tab.id, {file: 'page.js'}, function() {     
      sendScrollMessage(tab);
    });
  });
}

var screenshot, contentURL = '';


/**
 * 
 */
function sendScrollMessage(tab) {
  contentURL = tab.url;
  screenshot = {};
  
  chrome.tabs.sendMessage(tab.id, {msg: 'scrollPage'}, function() {
    
    openPage();    
  });
}

/**
 * Capture page
 */
 function capturePage(data, sender, callback) {
    var canvas;

    // $('#bar').get(0).style.width = parseInt(data.complete * 100, 10) + '%';

    // Get window.devicePixelRatio from the page, not the popup
    var scale = data.devicePixelRatio && data.devicePixelRatio !== 1 ?
        1 / data.devicePixelRatio : 1;

    // if the canvas is scaled, then x- and y-positions have to make
    // up for it
    if (scale !== 1) {
        data.x = data.x / scale;
        data.y = data.y / scale;
        data.totalWidth = data.totalWidth / scale;
        data.totalHeight = data.totalHeight / scale;
    }


    if (!screenshot.canvas) {
        canvas = document.createElement('canvas');
        canvas.width = data.totalWidth;
        canvas.height = data.totalHeight;
        screenshot.canvas = canvas;
        screenshot.ctx = canvas.getContext('2d');

        // sendLogMessage('TOTALDIMENSIONS: ' + data.totalWidth + ', ' + data.totalHeight);

        // // Scale to account for device pixel ratios greater than one. (On a
        // // MacBook Pro with Retina display, window.devicePixelRatio = 2.)
        // if (scale !== 1) {
        //     // TODO - create option to not scale? It's not clear if it's
        //     // better to scale down the image or to just draw it twice
        //     // as large.
        //     screenshot.ctx.scale(scale, scale);
        // }
    }

    // sendLogMessage(data);

    /*chrome.tabs.query({'active': true}, function(tab) {*/
      chrome.tabs.captureVisibleTab( null, {format: 'png', quality: 100}, function(dataURI) {
            if (dataURI) {
              var image = new Image();
              image.onload = function() {
                // sendLogMessage('img dims: ' + image.width + ', ' + image.height);

                screenshot.ctx.drawImage(image, data.x, data.y);
                
                callback(true);
              };
              image.src = dataURI;              
            }
        });
  //});

}

/**
 *
*/
function openPage() {
    // standard dataURI can be too big, let's blob instead
    // http://code.google.com/p/chromium/issues/detail?id=69227#c27

    var dataURI = screenshot.canvas.toDataURL();

    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // create a blob for writing to a file
    var blob = new Blob([ab], {type: mimeString});

    // come up with file-system size with a little buffer
    var size = blob.size + (1024/2);

    // come up with a filename
    var name = contentURL.split('?')[0].split('#')[0];
    if (name) {
        name = name
            .replace(/^https?:\/\//, '')
            .replace(/[^A-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^[_\-]+/, '')
            .replace(/[_\-]+$/, '');
        name = '-' + name;
    } else {
        name = '';
    }
    name = name + '.png';

    function onwriteend(e) {

        chrome.downloads.download({
            url: 'filesystem:chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/temporary/' + name,
            filename: name
        });

        console.log(e);
    }

    function errorHandler() {
        show('uh-oh');
    }

    // create a blob for writing to a file
    window.webkitRequestFileSystem(window.TEMPORARY, size, function(fs){        

        fs.root.getFile(name, {create: true}, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = onwriteend;
                fileWriter.write(blob);               
            }, errorHandler);
        }, errorHandler);
    }, errorHandler);
}


