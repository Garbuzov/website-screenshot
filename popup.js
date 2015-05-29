// Copyright (c) 2012,2013 Peter Coles - http://mrcoles.com/ - All rights reserved.
// Use of this source code is governed by the MIT License found in LICENSE

//
// utility methods
//
function show(id) {
    $('#' + id).show();
}

function hide(id) {
    $('#' + id).hide();
}

//
// URL Matching test - to verify we can talk to this URL
//
var matches = ['http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'],
    noMatches = [/^https?:\/\/chrome.google.com\/.*$/];

function testURLMatches(url) {
    // couldn't find a better way to tell if executeScript
    // wouldn't work -- so just testing against known urls
    // for now...
    var r, i;
    for (i=noMatches.length-1; i>=0; i--) {
        if (noMatches[i].test(url)) {
            return false;
        }
    }
    for (i=matches.length-1; i>=0; i--) {
        r = new RegExp('^' + matches[i].replace(/\*/g, '.*') + '$');
        if (r.test(url)) {
            return true;
        }
    }
    return false;
}

//
// start doing stuff immediately! - including error cases
//

$('#form').submit(function(event){

    var link = $('#pageUrl').val();
    var links =  $('#pages').val().split("\n");

    chrome.runtime.sendMessage({"msg": "start", "url" : links}, function(){
        chrome.runtime.sendMessage({"msg": 'ready'});
    });

    event.preventDefault();
})