(function Html() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		GenPage: genPage
	};

	return {
		dispatch: dispatch
	};

	function genPage(com, fun) {
		var par = this.Par;
		var page = '';
		page += '<!DOCTYPE html>\n';
		page += '<html>\n';
		page += '<meta charset="utf-8" />\n';
		page += '<head>\n';
		page += '<title>GIS Screen</title>\n';
		var cfg = __Config;
		if ('Styles' in par) {
			var style = par.Styles;
			for (var isty = 0; isty < style.length; isty++) {
				page += '<link rel="stylesheet" type="text/css" href="' + style[isty] + '">\n';
			}
		}
		if ('Styles' in cfg) {
			var style = cfg.Styles;
			for (var isty = 0; isty < style.length; isty++) {
				page += '<link rel="stylesheet" type="text/css" href="' + style[isty] + '">\n';
			}
		}
		//page += '<link href="https://fonts.googleapis.com/css?family=Space+Mono" rel="stylesheet">';
		page += '<script src="/socket.io/socket.io.js"></script>\n';
		page += '<script src="Nxs.js"></script>\n';
		if ('Scripts' in par) {
			var script = par.Scripts;
			for (var iscr = 0; iscr < script.length; iscr++) {
				page += '<script src="' + script[iscr] + '"></script>\n';
			}
		}
		if ('Scripts' in cfg) {
			var script = cfg.Scripts;
			for (var iscr = 0; iscr < script.length; iscr++) {
				page += '<script src="' + script[iscr] + '"></script>\n';
			}
		}
		page += '<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n';
		page += '<script>\n';
		page += '	$(function() {\n';
		page += '		console.log("Hello Portland");\n';
		page += '		__Nexus.start("' + par.Start + '");\n';
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
		fun(null, com);
	}

})();
