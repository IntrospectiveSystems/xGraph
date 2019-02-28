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


function extractTar(base64, basePath, name) {
	let bin = atob(base64);
	//BEGIN TMP STUFF (NEEDS CLEANING)
	tmp.dir(async function _tempFileCreated(err, tempPath, cleanupCallback) {
		if (err) throw err;
		//Do the thing with the temp
		//cleanupCallback(); if we need it
	});
	//END TMP STUFF
	fs.createReadStream(`${name}.tar`).pipe(tar.extract(basePath));
	return;
}

function packTar(basePath) {
	let base64;
	tmp.dir(async function _tempFileCreated(err, tempPath, cleanupCallback) {
		if (err) throw err;
		//Do the thing with the temp
		//cleanupCallback(); if we need it
		let filePath = path.join(tempPath, 'toConvert.tar');
		let tempTar = tar.pack(basePath).pipe(fs.createWriteStream(filePath));
		tempTar.on('finish', function () {
			return new Promise(res => {
				fs.readFile(filePath, (err, data) => {
					if (err) throw err;
					base64 = btoa(data);
					res(base64);
				});
			});
		});
	});
}

console.log(packTar('./'));