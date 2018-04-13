#! /usr/bin/env node

(async _ => {

	// imports
	const Preprocessor = require('preprocessor');
	const fs = require('fs');
	const tar = require('targz');
	const { compile } = require('nexe');
	const createPackage = require('osx-pkg');
	const createMsi = require('msi-packager');
	const pkg = require("./package.json");
	const { execSync } = require('child_process');
	const platform = process.platform;
	const rmrf = require('rimraf');

	//helper functions
	function ensureDir(dir) { try { fs.mkdirSync(dir); } catch (e) {if ((e.errno != -17) && (e.errno != -4075)) console.log(e); } }
	function copy(src, dst) { try { fs.writeFileSync(dst, fs.readFileSync(src)); } catch (e) {if ((e.errno != -17) && (e.errno != -4075)) console.log(e); } }
	function rmdir(dir) { try { fs.writeFileSync(dst, fs.readFileSync(src)); } catch (e) {if ((e.errno != -17) && (e.errno != -4075)) console.log(e); } }
	function createMacTarball() {
		console.log("Alternative Mac tar.gz being created since package capability is not available.")
		//make for mac
		tar.compress({
			src: "bin/mac/",
			dest: 'bin/xgraph_mac.tar.gz'
		}, function (err) {
			if (err) {
				console.log(err);
			} else {
				console.log("Mac: Done!");
			}
		});
	}


	// real code in here
	try {
			
		
		rmrf.sync('bin');

		ensureDir('bin');

		ensureDir('temp');

		ensureDir('bin/linux');
		ensureDir('bin/linux/bin');

		ensureDir('bin/mac');
		ensureDir('bin/mac/bin');

		ensureDir('bin/windows');
		ensureDir('bin/windows/bin');

		// take src/xgraph and shape it for nexe by cutting off the hashbang declaration
		// save the result to temp/xgraph
		let xgraphFile = fs.readFileSync('src/xgraph.js');
		xgraphFile = xgraphFile.toString();
		xgraphFile = xgraphFile.split('// -:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-:--:-')[1]
		fs.writeFileSync('temp/xgraph.js', xgraphFile);
		copy('src/Nexus.js', 'temp/Nexus.js');
		copy('src/Genesis.js', 'temp/Genesis.js');

		console.log('COMPILING LINUX');

		// compile temp/xgraph
		await compile({
			input: 'temp/xgraph.js',
			output: 'bin/linux/bin/xgraph',
			target: 'linux-x64-8.4.0',
			bundle: true,
			resources: ['src/Nexus.js', 'src/Genesis.js'],
			fakeArgv: true
		});

		console.log('COMPILING WINDOWS');

		await compile({
			input: 'temp/xgraph.js',
			output: 'bin/windows/bin/xgraph.exe',
			target: 'windows-x64-8.4.0',
			bundle: true,
			resources: ['src/Nexus.js', 'src/Genesis.js'],
			fakeArgv: true
		});

		console.log('COMPILING MACOS');

		await compile({
			input: 'temp/xgraph.js',
			output: 'bin/mac/bin/xgraph',
			target: 'mac-x64-8.4.0',
			bundle: true,
			resources: ['src/Nexus.js', 'src/Genesis.js'],
			fakeArgv: true
		});

		// copy('src/Nexus.js', 'bin/mac/bin/Nexus.js');
		// copy('src/Nexus.js', 'bin/windows/bin/Nexus.js');

		// copy('src/Genesis.js', 'bin/mac/bin/Genesis.js');
		// copy('src/Genesis.js', 'bin/windows/bin/Genesis.js');

		// tar.compress({
		// 	src: "bin/linux/",
		// 	dest: 'bin/xgraph_linux.tar.gz'
		// }, function (err) {
		// 	if (err) {
		// 		console.log(err);
		// 	} else {
		// 		console.log("Linux: Done!");
		// 	}
		// });

		// try {
		// 	var canCreatePackage = false;
		
		// 	if (/^linux/.test(platform)) {
		// 		let xar = '';
		// 		try {
		// 			xar = (execSync('which xar').toString());
		// 		}catch(e) {}
		// 		if (xar != '') {
		// 			let bomUtils = (execSync('which mkbom').toString());
		// 			if (bomUtils != '') {
		// 				canCreatePackage = true;
		// 			} else {
		// 				console.log("Missing xar: please install using");
		// 				console.log("  'wget https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/xar/xar-1.5.2.tar.gz && tar -zxvf ./xar-1.5.2.tar.gz && cd ./xar-1.5.2 && ./configure && make && sudo make install'");
		// 			}
		// 		} else {
		// 			console.log("Missing bomutils: please install using");
		// 			console.log("  'git clone https://github.com/hogliux/bomutils && cd bomutils && make && sudo make install'")
		// 		}
		// 	} 

		// 	if (canCreatePackage) {
		// 		console.log("Building mac pkg installer.")
		// 		let buildResults = (execSync('./build_mac_pkg.sh').toString());
		// 		console.log(buildResults);
		// 		console.log("Mac: Done!");
		// 	} else {
		// 		createMacTarball();
		// 	}

		// 	//make for windows
		// 	var options = {
		// 		source: 'bin/windows',
		// 		output: 'bin/xgraph.msi',
		// 		name: 'xGraph',
		// 		upgradeCode: '67dd6b8a-fedf-4aa3-925a-d0dc4f620d8f',
		// 		version: pkg.version,
		// 		manufacturer: 'Introspective Systems, LLC.',
		// 		iconPath: 'IS.png',
		// 		executable: 'bin/windows/bin/xgraph.exe',
		// 		arch: 'x64',
		// 	};

		// 	console.log("Ignore the following DeprecationWarning from msi-packager for asynchronous function without callback.");
		// 	await new Promise(resolve => {
		// 		createMsi(options, function (err) {
		// 			if (/^win/.test(platform)) {
		// 				console.log("MSI creation can only be done on mac or linux.");
		// 				console.log('Windows: FAILED!');
		// 			} else {
		// 				if (err) throw err
		// 				console.log('Windows: Done!');
		// 			}
		// 			resolve();
		// 		});
		// 	});
		// } catch (e) {
		// 	console.log(e);
		// 	console.log('TODO: revisit how packaging works...');
		// }


	}catch (e) {
		console.log('build failed');
		console.log(e);

		try {
			rmrf.sync('temp');
		} catch(e) {}

		process.exit(1);
	}
	try {
		rmrf.sync('temp');
	} catch(e) {}

})();
