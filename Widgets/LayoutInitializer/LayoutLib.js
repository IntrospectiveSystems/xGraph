
if (window.DIV == undefined) window.DIV = function DIV(selectorish) {
	let elem = $(document.createElement('div'));
	// debugger;
	if (selectorish) {
		if (selectorish.search(/[#\.]/) == -1) {
			elem.addClass(selectorish);
			return elem;
		}
		let params = selectorish.split(/(?=\.)/g);
		for (let i in params) {
			if (params[i].startsWith('#')) elem.attr('id', params[i].substr(1));
			else if (params[i].startsWith('.')) elem.addClass(params[i].substr(1));
		}
	}
	return elem;
}

if (window.STYLE == undefined) window.STYLE = function STYLE() {
	return $(document.createElement('style'));
}

if (window.IMG == undefined) window.IMG = function IMG(width, height, src) {

	let elem = $(document.createElement('img'));

	if(!height && !src) {
		src = width;
	} else if (!src) {
		elem.css('width', width);
		elem.css('height', height);
		src = `http://placehold.it/${width}x${height}`;
	}

	elem.attr('src', src);


	return elem;
}


$.fn.extend({
	cssVar: function (name) {
		// debugger;

		let color = com.Vlt.div.css('--text').trim().replace('#', '');
		// color = 'C0FFEE';
		if (color.length == 3) color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
		color = color.split("").reverse().join("");
		let valueTable = "0123456789ABCDEF"
		let result = 0;
		for (let i = 0, digitValue = 1; i < color.length; i++ , digitValue *= 16) {
			let onesValue = valueTable.indexOf(color[i]); // find the hex digits decimal value, using the above string.
			let value = onesValue * digitValue; // find the value of this digit in its place.
			result |= value; // value is effectively digit masked, and adding would involve sign errors...
		}

		return result;
	}
});