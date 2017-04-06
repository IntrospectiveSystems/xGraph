(function Page() {
	var fs = require('fs');
	var jszip = require("jszip");

	//-----------------------------------------------------dispatch
	var dispatch = {
		GenPage: genPage,
		GetModule: getModule
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

	function getModule(com, fun) {
		console.log('--Page/getModule');
		console.log(JSON.stringify(com));
		if(fun)
			fun();
	}

})();
