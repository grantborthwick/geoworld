var http = require('http'),
	url = require('url'),
	fs = require('fs'),
  path = require('path'),
	uglifyJS = require("uglify-js"),
	cleanCSS = require("clean-css"),
	manifest = require("./manifest.json");

// ==========================================
// Ensure the release directory exists
//-------------------------------------------	

if (!fs.existsSync('release')) {
  console.log("Creating release directory since it does not exist yet...");
  fs.mkdirSync('release');
}

//===========================================
// JavaScript processing
//-------------------------------------------

// Watch the files in the manifest.javascripts array
//  and re-process the combined, minified JavaScript any time a change is made
manifest.javascripts.forEach( function(fileName, index, array) {

	fs.watch(fileName, function(event, filename){	
		var minifiedJS = uglifyJS.minify(manifest.javascripts, manifest.testJavascriptOptions);
        var sourceMapFix = "\n //# sourceMappingURL="+manifest.testJavascriptOptions.outSourceMap;
        // Write combined, minified, JavaScript file to release directory
        // Don't switch this back. To debug, turn on source maps in your browser if they aren't already: http://net.tutsplus.com/tutorials/tools-and-tips/source-maps-101/
        fs.writeFile('release/geoworld.js', minifiedJS.code + sourceMapFix, function(err) {
          if(err) {
            console.error("Could not write release/geoworld.js file\n" + err);
            return;
          }
          console.log("wrote file: release/geoworld.js");
        });
        fs.writeFile('release/out.js.map', minifiedJS.map, function(err){
          if(err){
            console.error("Could not write release/out.js.map\n "+err);
            return;
          }
          console.log("wrote file: release/out.js.map");
        });
	});
});

console.log("Watching for changes in JavaScript");


//==============================================
// CSS processing
//----------------------------------------------

// Watch the files in the manifest.stylesheets array file and re-process it any time changes are made
manifest.stylesheets.forEach(function(fileName, index, array) {

	fs.watch(fileName, function(event, fileName) {
		console.log(fileName + " changed, reprocessing " + fileName);
		
		// Read CSS from filenames in the manifest
		var cssSource = "";
		manifest.stylesheets.forEach(function(fileName, index, array) {
			cssSource = cssSource.concat(fs.readFileSync('src/css/geoworld.css', 'utf8'));
		});

		// Minify the CSS code using clean css
		var minifiedCSS = cleanCSS().minify(cssSource);

		// Write the finalized CSS code to the release directory
		fs.writeFile('release/geoworld.css', minifiedCSS, function(err) {
			if(err) {
				console.error("Could not write release/geoworld.css file\n" + err);
				return;
			}
			console.log("wrote file: release/geoworld.css");
		});
	});
	
});

console.log("Watching for changes in CSS");


//==============================================
// Image processing
//----------------------------------------------

function processImageDirectory(dir) {
  fs.watch(dir, function (event, fileName) {

    // If a file exists, copy it 
    // note -- removing a file does not delete it from releases!
    if (fileName !== null) {
      console.log(fileName + " changed, reprocessing " + fileName);
      fs.createReadStream(dir + '/' + fileName).pipe(fs.createWriteStream('release/' + fileName));
    }
  });
}
processImageDirectory('resources/spritesheets');
processImageDirectory('resources/tilesets');

console.log("Watching for changes in spritesheets");

//==============================================
// HTML pre-processing
//----------------------------------------------

// For now just copy all HTML files from the src directory
fs.watch('src/html', function (event, fileName) {
  if (fileName !== null) {
    console.log("src/html/" + fileName + " changed, reprocessing " + fileName);
    fs.createReadStream('src/html/' + fileName).pipe(fs.createWriteStream('release/' + fileName));
  }
});

console.log("Watching for changes in html");

//==============================================
// Level pre-processing
//----------------------------------------------

//For now, levels are just copied into the release directory
manifest.levels.forEach(function (fileName, index, array) {
  fs.watch('resources/levels/' + fileName, function (event, levelFileName) {
    fs.createReadStream('resources/levels/' + levelFileName).pipe(fs.createWriteStream('release/' + levelFileName));
    console.log("wrote file: release/" + levelFileName);
  });
});

console.log("Watching for changes in levels");