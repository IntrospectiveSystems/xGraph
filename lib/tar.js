const tar = require('tar-fs');
const fs = require('fs');
// const path = require('path');
const atob = require('atob');
let tmp = require('tmp');

module.exports = {
	extractTar,
	packTar
};


function extractTar(base64, basePath, name) {
	let bin = atob(base64);
	//BEGIN TMP STUFF (NEEDS CLEANING)
	tmp.dir(async function _tempFileCreated(err, path, cleanupCallback) {
		if(err) throw err;
		//Do the thing with the temp
		//cleanupCallback(); if we need it
	});
	//END TMP STUFF
	fs.createReadStream(`${name}.tar`).pipe(tar.extract(basePath));
	return;
}

function packTar(basePath) {
	let pack = tar.pack(basePath, {
		entries: [`${loc}.${type}`]
	});
	pack.pipe(fs.createWriteStream(`${loc}.tar`));
	const base64 = 'hjfincveiknjsdeljkn';
	return base64;
}