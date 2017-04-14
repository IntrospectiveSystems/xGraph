(function Page() {
	var fs = require('fs');
	var async = require('async');
	var jszip = require("jszip");

	//-----------------------------------------------------dispatch
	var dispatch = {
		GenPage: genPage,
		GetModule: getModule,
		GetGlobal: getGlobal
	};

	return {
		dispatch: dispatch
	};

	function genPage(com, fun) {
		console.log('--Html/genPage');
		var Par = this.Par;
		// TBD: The browser.json should be referenced by parameter
		fs.readFile('browser.json', gen);

		function gen(err, data) {
			if(err) {
				console.log(' ** ERR:Cannot read browser.json');
				if(fun)
					fun('Cannot read browser.json');
				return;
			}
			var obj = JSON.parse(data.toString());
			obj.pidServer = Par.Pid;
			if('Apx' in Par)
				obj.Apx = Par.Apx;
			var config = JSON.stringify(obj);
			var page = '';
			page += '<!DOCTYPE html>\n';
			page += '<html>\n';
			page += '<meta charset="utf-8" />\n';
			page += '<head>\n';
			page += '<title>GIS Screen</title>\n';
			if ('Styles' in Par) {
				var style = Par.Styles;
				for (var isty = 0; isty < style.length; isty++) {
					page += '<link rel="stylesheet" type="text/css" href="' + style[isty] + '">\n';
				}
			}
			//page += '<link href="https://fonts.googleapis.com/css?family=Space+Mono" rel="stylesheet">';
			page += '<script src="/socket.io/socket.io.js"></script>\n';
			page += '<script src="Nxs.js"></script>\n';
			if ('Scripts' in Par) {
				var script = Par.Scripts;
				for (var iscr = 0; iscr < script.length; iscr++) {
					page += '<script src="' + script[iscr] + '"></script>\n';
				}
			}
			page += '<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n';
			page += '<script>\n';
			page += '	$(function() {\n';
			page += '		console.log("Hello Portland");\n';
			page += "		__Nexus.start('" + config + "');\n";
			page += '	});\n';
			page += '</script>\n';
			page += '</head>\n';
			page += '<body id="Body" style="height:100vh;" class="container-fluid">\n';
			page += '<div id="Frame" style="height:100%;">\n';
			page += '<div id="Grok" style="height:100%;">\n';
			page += '</div>\n';
			page += '</div>\n';
			page += '</body>\n';
			com.Html = page;
			console.log(page);
			if(fun)
				fun(null, com);
		}
	}

	//-----------------------------------------------------getModule
	// Retrieve module from module server
	// For now is retrieved from local file system
	function getModule(com, fun) {
		console.log('--Page/getModule');
		console.log(JSON.stringify(com));
		var that = this;
		/*
		var zip1 = new jszip();
		console.log('Support', jszip.support.uint8array);
		zip1.file("hello.txt", "Hello World\n");
		zip1.generateAsync({type:'base64'}).then(function(data) {
			console.log('content', data);
			console.log('A');
			var zip2 = new jszip();
			console.log('B', zip2);
			zip2.loadAsync(data, {base64: true}).then(function(zip){
				zip.file('hello.txt').async('string').then(function(str){
					console.log('Finally', str);
				});
			});
			console.log('C');
		});*/
		var zip = new jszip();
		var dir = that.Nxs.genPath(com.Module);
		var man = [];
		console.log('dir', dir);
		fs.readdir(dir, function(err, files) {
			if(err) {
				console.log(' ** ERR:Cannot read module directory');
				if(fun)
					fun('Cannot read module directlry');
				return;
			}
			async.eachSeries(files, build, ship);
		})

		function build(file, func) {
			var path = dir + '/' + file;
			fs.readFile(path, add);

			function add(err, data) {
				var str = data.toString();
				zip.file(file, str);
				man.push(file);
				func();
			}
		}

		function ship() {
			zip.file('manifest.json', JSON.stringify(man));
			zip.generateAsync({type:'base64'}).then(function(data) {
				com.Zip = data;
				fun(null, com);
			});
		}
	}

	//-----------------------------------------------------getGlobal
	function getGlobal(com, fun) {
		console.log('--Page/getGlobal');
		if('Symbol' in com) {
			com.Pid = this.Nxs.getGlobal(com.Symbol);
			if (fun)
				fun(null, com);
			return;
		}
		if(fun)
			fun('Symbol not defined');
	}

})();
