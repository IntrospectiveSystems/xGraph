function promptAsync(message, preset, fun) {

}


if('process' in window) {

	window.prompt = function (message, preset, fun) {

		if(!fun) {
			fun = preset;
			preset = "";
		}

		let OVERLAY = DIV();
		OVERLAY.css('position', 'fixed');
		OVERLAY.css('left', '0px');
		OVERLAY.css('top', '0px');
		OVERLAY.css('width', '100vw');
		OVERLAY.css('height', '100vh');
		OVERLAY.css('color', 'var(--view-color)');
		OVERLAY.css('font-family', 'sans-serif');
		OVERLAY.css('background-color', 'rgba(0, 0, 0, .3)');

		let card = DIV();
		card.css('margin', '0px auto');
		card.css('background-color', 'white');
		card.css('width', '300px');
		// card.css('height', '200px');
		card.css('border-radius', '3px');
		card.css('margin-top', 'calc(50vh - 100px)');
		card.css('padding', '8px');
		
		let title = DIV();
		title.html(message);

		let input = $(document.createElement('input'));
		input.css('box-sizing', 'border-box');
		input.css('padding', '2px 6px');
		input.css('margin-top', '16px');
		input.css('margin-bottom', '16px');
		input.css('width', '100%');
		input.css('border', 'none');
		input.css('border-bottom', '1px solid var(--view-color)');
		input.val(preset);

		let accept = DIV();
		accept.html('OKAY');
		accept.css('background-color', 'var(--accent-color)');
		accept.css('color', 'white');
		accept.css('float', 'right');
		accept.css('padding', '4px 12px');
		accept.css('border-radius', '3px');
		accept.css('clear', 'both');
		accept.css('cursor', 'pointer');
		accept.css('box-shadow', '0px 3px 5px rgba(0, 0, 0, .6)');
		accept.on('click', function (evt) {
			OVERLAY.remove();
			fun(input.val());
		});

		let floatReset = DIV();
		floatReset.css('clear', 'both');

		card.append(title);
		card.append(input);
		card.append(accept);
		card.append(floatReset);

		OVERLAY.append(card);

		document.body.appendChild(OVERLAY[0]);

		// debugger;

	}

}else {

	window.prompt = (function() {
		let oldPrompt = window.prompt;

		return function (message, preset, fun) {

			if(fun) {
				fun(oldPrompt.call(window, message, preset));
			}else {
				fun = preset;
				fun(oldPrompt.call(window, message));
			}

		}

	})()

}