var request = require('request');
var srequest = require('sync-request');
var cheerio = require('cheerio');
var fs = require('fs');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var categories = [];

request.get('http://www.presentationgo.com', function(error, response, data){
    if (error) {
        console.log('We have a problem');
        console.log(error);
    } else {
        var $ = cheerio.load(data);
        var categoriesTags = $('nav.fusion-main-menu ul li ul li a');
        rimraf.sync('temp');
        categoriesTags.each(function(index, categoryTag){
            
            var categoryLink = categoryTag.attribs.href;
            var tempLinkArray = categoryLink.split(/\//);
            var categoryName = tempLinkArray[tempLinkArray.length - 2];
            var categoryParentName = tempLinkArray[tempLinkArray.length - 3];
            console.log(categoryParentName + " / " + categoryName);
            var path = 'temp/' + categoryParentName + '/' + categoryName;
            if (!fs.existsSync(path))
                mkdirp.sync(path);
            categories.push(
                {
                    name: categoryName,
                    parent: categoryParentName,
                    path: 'temp/'+categoryParentName+'/'+categoryName,
                    link: categoryLink,
                    presentations: []
                }
            );
        })
        fetchCategoryPages();
    }
});


function fetchCategoryPages() {
    categories.forEach(function(category, index){
        for (var i = 1; i < 10; i ++) {    
            var res = srequest('GET', category.link + 'page/' + i);;
            try {
                res = res.getBody("utf8");
                console.log("success");
            } catch(error) {
                console.log(error);
                return;
            }
            var $ = cheerio.load(res);
            var links = $("#content .fusion-portfolio-content-wrapper a");
            links.each(function(pi, item){
                console.log("Found link " + item.attribs.href);
                fetchPresentation(category, item.attribs.href);
            })
        }
    });
}

function fetchPresentation(category, presentationLink) {
    console.log("Fetching " + presentationLink + " for category " + category.parent +"/" + category.name);
    var resp = srequest("GET", presentationLink);
    var data;
    try {
        data = resp.getBody();
    } catch(error) {
        console.error("Retrying fetch " + presentationLink);
        fetchPresentation(category, presentationLink);
        return;
    }
    console.log("Fetched " + presentationLink + " for category " + category.parent +"/" + category.name);
    var $ = cheerio.load(data);
    var presentationName = $(".fusion-page-title-captions h1").text();
    var downloadLinks = $(".coldwnld");
    var path = category.path + "/" + presentationName + "/";
    if (!fs.existsSync(path))
        mkdirp.sync(path);
        
    downloadLinks.each(function(index, item){
        var presentationDownloadLink = item.attribs.href;
        downloadPresentation(presentationDownloadLink, path);
    })

    var imageLinks = $(".fusion-flexslider img");
    imageLinks.each(function(index, item){
        var imageLink = item.attribs.src;
        downloadPresentationImage(imageLink, path);
    })

}
function downloadPresentation(presentationLink, path) {
    var res = srequest("GET", presentationLink);
    var data;
    try {
        data = res.getBody();
    } catch (error) {
        console.error(error);
        console.log("Retrying download " + presentationLink);
        downloadPresentation(presentationLink, path);
        return
    }
    
    var splittedLink = presentationLink.split("/");
    fs.writeFileSync(path + splittedLink[splittedLink.length - 2], data);
    console.log("Saved " + presentationLink + " to " + path);

}

function downloadPresentationImage(presentationImageLink, path) {
    
    var res = srequest("GET", presentationImageLink);
    var data;
    try {
        data = res.getBody();
    } catch (error) {
        console.error(error);
        console.log("Retrying download " + presentationLink);
        downloadPresentationImage(presentationLink, path);
        return
    }
    
    var splittedLink = presentationImageLink.split("/");
    fs.writeFileSync(path + splittedLink[splittedLink.length - 2], data);
    console.log("Saved " + presentationImageLink + " to " + path);
}