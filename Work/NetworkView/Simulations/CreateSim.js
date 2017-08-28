let readlineSync = require('readline-sync');

let name = readlineSync.question('Sim Name: ');
if(name == "") name = "sine"
let size = readlineSync.question('Size: ');
if(size == "") size = 100;
else size = parseInt(size);
let time = readlineSync.question('time (100 is a full period): ');
if (time == "") time = 100;
else time = parseInt(time);
let waveCount = readlineSync.question('Wave count: ');
if (waveCount == "") waveCount = 1;
else waveCount = parseInt(waveCount);

// console.log('"' + size + '"');
let waves = []
for (let i = 0; i < waveCount; i++) {
	let x = readlineSync.question('X: ');
	let y = readlineSync.question('Y: ');
	let amplitude = readlineSync.question('Amplitude (1): ');
	let stretch = readlineSync.question('Stretch (1): ');
	let speed = readlineSync.question('Speed (1): ');

	x = parseInt(x);
	if (x != x) {
		console.log('Noooooooope, Neeeeeeext');
		continue;
	}

	y = parseInt(y);
	if (y != y) {
		console.log('Noooooooope, Neeeeeeext');
		continue;
	}

	amplitude = parseInt(amplitude);
	if (amplitude != amplitude) {
		amplitude = 1;
	}

	speed = parseInt(speed);
	if (speed != speed) {
		speed = 1
	}

	stretch = parseInt(stretch);
	if (stretch != stretch) {
		stretch = 1
	}

	let wave = [x, y, amplitude, speed, stretch];
	waves.push(wave);
}
let dat = [];
let fs = require('fs');
fs.mkdirSync(name);
for(let t = 0; t < time; t ++) {
	for (let w = 0; w < waves.length; w++) {
		for (let i = 0, j = 0, k = 0; j < size; i++ , i = i == size ? 0 : i, j = i == 0 ? j + 1 : j, k++) {
			// console.log(i, j, k);
			let distance = Math.sqrt(Math.pow(waves[w][0] - i, 2) + Math.pow(waves[w][1] - j, 2));
			if (w == 0) dat[k] = 0;
			dat[k] += Math.sin((distance - ((t / 100) * (waves[w][3] * waves[w][4]))) / (5 * waves[w][4])) * (1 - (distance / size)) * waves[w][2];
			// time ++;
		}
	}
	let cmd = {Cmd: "SetArray", Data: dat, Size: size};
	let str = JSON.stringify(cmd);
	let path = name + "/" + t + '.json';
	fs.writeFileSync(path, str);
}
// let size = readlineSync.question('');
// let size = readlineSync.question('Sim Name');

