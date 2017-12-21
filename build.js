(async _ => {
	
	
	const Preprocessor = require('preprocessor');
	const fs = require('fs');
	const tar = require('targz');
	const { compile } = require('nexe');
	const createPackage = require('osx-pkg');
	var createMsi = require('msi-packager');
	const pkg = require("./package.json");

	ensureDir('bin');
	ensureDir('src/gen');
	ensureDir('bin/linux');
	ensureDir('bin/linux/bin');
	ensureDir('bin/mac');
	ensureDir('bin/mac/bin');
	ensureDir('bin/windows');
	ensureDir('bin/windows/bin');

	function load(filename) {
		return `function(){
			return ${fs.readFileSync(filename)}
		};`;
	}

	function doImports(filename) {
		let file = fs.readFileSync(filename).toString();
		let outfile = `const version = "${pkg.version}"\n`;
		for (let line of file.split('\n')) {
			line = line.trim();
			if (line.startsWith('// $')) {
				line = line.substr(4);
				let idx = line.indexOf('$');
				let key = line.substr(0, idx).trim();
				let val = line.substr(idx + 1).trim();
				let result = eval(val);
				line = `let ${key} = ${result}`;
			}
			outfile += line + '\n';
		}
		fs.writeFileSync(filename, outfile);
	}

	fs.writeFileSync('src/gen/xgraph-linux.js', new Preprocessor(fs.readFileSync('src/xgraph.js'), '.').process({ LINUX: true }));
	doImports('src/gen/xgraph-linux.js');
	fs.writeFileSync('src/gen/xgraph-linux.js', new Preprocessor(fs.readFileSync('src/gen/xgraph-linux.js'), '.').process({ COMPILED: true }));
	

	await compile({
		input: 'src/gen/xgraph-linux.js',
		output: 'bin/linux/bin/xgraph',
		target: 'linux-x64-8.4.0',
		bundle: true,
		fakeArgv: false
	});

	fs.writeFileSync('src/gen/xgraph-windows.js', new Preprocessor(fs.readFileSync('src/xgraph.js'), '.').process({ WINDOWS: true }));
	doImports('src/gen/xgraph-windows.js');
	fs.writeFileSync('src/gen/xgraph-windows.js', new Preprocessor(fs.readFileSync('src/gen/xgraph-windows.js'), '.').process({ COMPILED: true }));
	
	await compile({
		input: 'src/gen/xgraph-windows.js',
		output: 'bin/windows/bin/xgraph.exe',
		target: 'windows-x64-8.4.0',
		bundle: true,
		fakeArgv: false
	});

	fs.writeFileSync('src/gen/xgraph-mac.js', new Preprocessor(fs.readFileSync('src/xgraph.js'), '.').process({ MAC: true }));
	doImports('src/gen/xgraph-mac.js');
	fs.writeFileSync('src/gen/xgraph-mac.js', new Preprocessor(fs.readFileSync('src/gen/xgraph-mac.js'), '.').process({ MAC: true }));
	
	await compile({
		input: 'src/gen/xgraph-mac.js',
		output: 'bin/mac/bin/xgraph',
		target: 'mac-x64-8.4.0',
		bundle: true,
		fakeArgv: false
	});


	//move all required files to lib of system bin.
	function ensureDir(dir) { try { fs.mkdirSync(dir); } catch (e) {if ((e.errno != -17) &&(e.errno != -4075)) console.log(e); } }
	function copy(src, dst) { try { fs.writeFileSync(dst, fs.readFileSync(src)); } catch (e) {if ((e.errno != -17) && (e.errno != -4075)) console.log(e); } }


	// copy everything into bin/lib
	ensureDir('bin/lib')
	ensureDir('bin/lib/Nexus');

	fs.writeFileSync('bin/lib/Nexus/Nexus.js', new Preprocessor(fs.readFileSync('Core/src/Nexus.js'), '.').process({ BUILT: true }));
	
	//copy bin/lib into bin/linux/lib
	ensureDir('bin/linux');
	ensureDir('bin/linux/lib');
	ensureDir('bin/linux/lib/Nexus');

	copy('bin/lib/Nexus/Nexus.js', 'bin/linux/lib/Nexus/Nexus.js');

	//copy bin/lib into bin/windows/lib
	ensureDir('bin/windows/bin')
	ensureDir('bin/windows/bin/lib');
	ensureDir('bin/windows/bin/lib/Nexus');

	copy('bin/lib/Nexus/Nexus.js', 'bin/windows/bin/lib/Nexus/Nexus.js');

	//copy bin/lib into bin/windows/lib
	ensureDir('bin/mac')
	ensureDir('bin/mac/lib');
	ensureDir('bin/mac/lib/Nexus');

	copy('bin/lib/Nexus/Nexus.js', 'bin/mac/lib/Nexus/Nexus.js');


	//make the tar.gz ... msi ... mac dmg/pkg
	//make for linux 
	tar.compress({
		src: "bin/linux/",
		dest: 'bin/xgraph_linux.tar.gz'
	}, function (err) {
		if (err) {
			console.log(err);
		} else {
			console.log("Linux: Done!");
		}
	});

	// //make for mac
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

	//make for windows
	var options = {
		source: 'bin/windows',
		output: 'bin/xgraph.msi',
		name: 'xGraph',
		upgradeCode: '67dd6b8a-fedf-4aa3-925a-d0dc4f620d8f',
		version: pkg.version,
		manufacturer: 'Introspective Systems, LLC.',
		iconPath: 'IS.png',
		executable: 'bin/windows/bin/xgraph.exe',
		arch: 'x64',
	};

	createMsi(options, function (err) {
		//if (err) throw err
		console.log('Windows: Done!');
	});
})();
