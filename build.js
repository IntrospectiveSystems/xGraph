(async _ => {

	const Preprocessor = require('preprocessor');
	const fs = require('fs');
	const { compile } = require('nexe');
	
	fs.writeFileSync('src/gen/xgraph-linux.js', new Preprocessor(fs.readFileSync('src/xgraph.js'), '.').process({LINUX: true}));
	
	await compile({
		input: 'src/gen/xgraph-linux.js',
		output: 'bin/linux/bin/xgraph',
		target: 'linux-x64-8.4.0',
		bundle: true
	});
	
	fs.writeFileSync('src/gen/xgraph-windows.js', new Preprocessor(fs.readFileSync('src/xgraph.js'), '.').process({WINDOWS: true}));
	
	await compile({
		input: 'src/gen/xgraph-windows.js',
		output: 'bin/windows/bin/xgraph',
		target: 'windows-x64-8.4.0',
		bundle: true
	});
	
	fs.writeFileSync('src/gen/xgraph-mac.js', new Preprocessor(fs.readFileSync('src/xgraph.js'), '.').process({MAC: true}));
	
	await compile({
		input: 'src/gen/xgraph-mac.js',
		output: 'bin/mac/bin/xgraph',
		target: 'mac-x64-8.4.0',
		bundle: true
	});

	//move all required files to lib of system bin.                       -17 is errno: EEXISTS
	function ensureDir(dir) {try{fs.mkdirSync(dir);}catch(e){if(e.errno != -17)console.log(e);}}
	function copy(src, dst) {try {fs.writeFileSync(dst,fs.readFileSync(src));}catch(e){if(e.errno != -17)console.log(e);}}


	// copy everything into bin/lib
	ensureDir('bin/lib');
	ensureDir('bin/lib/Proxy');
	ensureDir('bin/lib/Nexus');

	copy('Nexus/Nexus/Nexus.js', 'bin/lib/Nexus/Nexus.js');
	copy('Nexus/Nexus/package.json', 'bin/lib/Nexus/package.json');
	copy('Nexus/Proxy/Proxy.js', 'bin/lib/Proxy/Proxy.js');
	copy('Nexus/Proxy/schema.json', 'bin/lib/Proxy/schema.json');


	//copy bin/lib into bin/linux/lib
	ensureDir('bin/linux/lib');
	ensureDir('bin/linux/lib/Nexus');
	ensureDir('bin/linux/lib/Proxy');
	
	copy('bin/lib/Nexus/Nexus.js', 'bin/linux/lib/Nexus/Nexus.js');
	copy('bin/lib/Nexus/package.json', 'bin/linux/lib/Nexus/package.json');
	copy('bin/lib/Proxy/Proxy.js', 'bin/linux/lib/Proxy/Proxy.js');
	copy('bin/lib/Proxy/schema.json', 'bin/linux/lib/Proxy/schema.json');

	
	//make the tar.gz ... msi ... mac dmg/pkg


})();
