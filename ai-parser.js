var fs = require('fs');
var convert = require('xml-js');
var base64Img = require('base64-img');
var commandLineArgs = require('command-line-args')

var optionDefinitions = [
  { name: 'verbose', alias: 'v', type: Boolean },
  { name: 'src', type: String, multiple: true, defaultOption: true }
];

var options = commandLineArgs(optionDefinitions);
console.info('options', options);

function ai2xmp(filename) {
    var fileContent = fs.readFileSync('./' + filename, {encoding: 'utf-8'});
    var token = {start: '<x:xmpmeta', end: '</x:xmpmeta>'};
    var start = fileContent.indexOf(token.start);
    var end = fileContent.indexOf(token.end);
    return fileContent.substring(start, end + token.end.length)
}

function xmp2json (xmp) {
    return convert.xml2json(xmp, {compact: true, spaces: 4});
}

function base64_to_image (mimeType, b64) {

}

options.src.forEach(function (filename) {
    var xmp = ai2xmp(filename);
    var json = xmp2json(xmp);
    // console.info('...', 'json', json);
    // var thumbnails = json['x:xmpmeta']['rdf:RDF']['xmp:Thumbnails']['rdf:Alt']['rdf:li']
    // var thumbnail = {
    //     width: thumbnails['xmpGImg:width']['_text'],
    //     height: thumbnails['xmpGImg:height']['_text'],
    //     mimeType: 'image/' + thumbnails['xmpGImg:format']['_text'].toLowerCase(),
    //     base64: thumbnails['xmpGImg:image']['_text']
    // };
    // console.info('...', 'thumbnails', thumbnails);
    fs.writeFileSync('./' + filename + '.json', json);
});
