//# sourceURL=Controller.js
//jshint esversion: 6
(function Controller() {

	let fs, path, async;

	class Controller {
		Start(com, fun) {
			fs = this.require('fs');
			path = this.require('path');
			async = this.require('async');

			this.Vlt.threads = [];
			this.Vlt.frames = {};
			this.Vlt.Directory = this.Par.Directory || (process.cwd()+"/Simulations");

			// this.send({ Cmd: 'AddFolder', Dir: 'Marcus' }, this.Par.Pid, () => {
				fun(null, com);
			// });
		}
		AddFolder(com, fun) {
			debugger;
			let that = this;
			fs.readdir(path.join(this.Vlt.Directory, com.Dir), (err, files) => {
				async.eachSeries(files, function (item, next) {
					if (item == 'renders') {
						next();
						return;
					}
					let filepath = path.join(that.Vlt.Directory, com.Dir, item);
					fs.readFile(filepath, (err, data) => {
						// console.log(data.toString());
						let objString = data.toString();
						let obj = JSON.parse(objString);
						// debugger;
						obj.Attempts = 0;
						obj.Cmd = 'FrameData';
						obj.Dir = path.join(that.Vlt.Directory, com.Dir)
						that.Vlt.frames[item.replace('.json', '')] = obj;
						that.send({ Cmd: 'Notify' }, that.Par.Pid, () => { });
						setTimeout(function() {
							next();
						}, 100);
					});
				}, function done() {
					console.log('Finished Loading frames');
				});
			});
			fun(null, com);
		}
		RendererReady(com, fun) {
			this.Vlt.threads.push(com.Passport.From);
			this.send({ Cmd: 'Notify' }, this.Par.Pid, () => { });
			fun(null, com);
		}
		Notify(com, fun) {
			console.log(' -- RenderController/Notify');
			console.log(this.Vlt.threads.length +
									' thread' + (this.Vlt.threads.length == 1 ? '' : 's') + 
									', ' + Object.keys(this.Vlt.frames).length + ' frame' +
									(Object.keys(this.Vlt.frames).length == 1 ? '' : 's'));
			let that = this;
			if (this.Vlt.threads.length == 0 || this.Vlt.frames.length == 0) {
				console.log("No changes made...MRG");
				fun(null, com);
				return;
			}

			while (this.Vlt.threads.length != 0 && Object.keys(this.Vlt.frames).length != 0) {
				let frame = getFrameCommand();
				console.log('Pairing ' + this.Vlt.threads[0] + ' with frame ' + frame);
				// that.send({ Cmd: "FrameData", Forward: this.Vlt.threads[0]}, this.Par.Browser, () => {});
				let cmd = this.Vlt.frames[frame];
				cmd.Name = frame;
				cmd.Forward = this.Vlt.threads[0];
				that.send(cmd, this.Par.Browser, (err, cmd) => {
					// THIS IS THE PART WHERE WE SAVE THE IMAGE OR SOMETHING
					let renderFolder = path.join(cmd.Dir, 'renders');
					if (!fs.existsSync(renderFolder)) fs.mkdirSync(renderFolder);
					let imagepath = path.join(renderFolder, cmd.Name + '.png');
					fs.writeFile(imagepath, new Buffer(cmd.Image.split(',')[1], 'base64'), (err) => {
						delete this.Vlt.frames[frame];
					});
				});
				this.Vlt.threads.shift();
			}

			function getFrameCommand() {
				let i = 0;
				// debugger;
				while(true) {
					for (let frame in that.Vlt.frames) {
						if (that.Vlt.frames[frame].Attempts == i) {
							that.Vlt.frames[frame].Attempts ++;
							return frame;
						}
						console.log('Lookin for a frame...', frame, that.Vlt.frames[frame].Attempts);
					}
					i ++;
				}
			}
		}
	}

	return {
		dispatch: Controller.prototype
	};

})();