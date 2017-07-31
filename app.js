var request = require('request');
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
        categoriesTags.each(function(){
            var categoryTag = $(this);
            var categoryLink = categoryTag.attr('href');
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
                    link: categoryLink
                }
            );

            fetchCategoryPages();
        })
    }
});


function fetchCategoryPages() {
    categories.forEach(function(category){
        for (var i = 1; i < 10; i ++) {
            request.get(category.link + 'page/' + i, function(error, response, data){
                if (error || response.statusCode == 404) {
                    console.log("Here is an error! " + category.name + ' ' + i );
                } else {
                    var $ = cheerio.load(data);
                    var link = $(".content .fusion-portfolio-content-wrapper a").attr('href');

                    
                }
            })
        }
    });
}