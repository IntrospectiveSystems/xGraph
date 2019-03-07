const tar = require('tar-fs');
const fs = require('fs');
const path = require('path');
const atob = require('atob');
const btoa = require('btoa');
const tmp = require('tmp');

module.exports = {
	extractTar,
	packTar
};


function extractTar(base64, outputDir) {
	return new Promise(res => {
		let bin = atob(base64);
		tmp.dir(async function _tempFileCreated(err, tempPath, cleanupCallback) {
			if (err) throw err;
			//Do the thing with the temp
			//cleanupCallback(); if we need it
			let filePath = path.join(tempPath, 'converted.tar');
			fs.writeFile(filePath, bin, (err, data) =>{
				if(err) console.log(err);
				let pipe = fs.createReadStream(filePath).pipe(tar.extract(outputDir));
				pipe.on('finish', _ => {
					res();
				});
			});
		});
	});
}

function packTar(basePath) {
	return new Promise(res => {
		let base64;
		tmp.dir(async function _tempFileCreated(err, tempPath, cleanupCallback) {
			if (err) throw err;
			//Do the thing with the temp
			//cleanupCallback(); if we need it
			let filePath = path.join(tempPath, 'toConvert.tar');

			// tar.c({
			// 	gzip: false,
			// 	file: filePath
			// }, [
			// 	basePath
			// ]).then(_ => {
			let pipe = tar.pack(basePath).pipe(fs.createWriteStream(filePath));
			pipe.on('finish', function () {
				fs.readFile(filePath, (err, data) => {
					if (err) throw err;
					base64 = btoa(data);
					res(base64);
				});
			});
		});
	});
}
//TESTS VVVVVVVVVVVVVVVVVV
// (async _=> {
// 	let b64 = await packTar('./../lib');
// 	let bin = atob(b64);
// 	fs.writeFileSync('testTar.tar', bin);

// 	await extractTar(b64, './../TestTarFolder');
// 	// await extractTar((await packTar('./../../xGraph')), './../hgfdsa');
// })();