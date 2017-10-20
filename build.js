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

	//move all required files to lib of system bin.
	try {fs.mkdirSync('bin/lib');}catch(e){console.log(e);}
	try {fs.mkdirSync('bin/lib/Nexus');}catch(e){console.log(e);}
	try {fs.writeFileSync('bin/lib/Nexus/Nexus.js',fs.readFileSync('Nexus/Nexus/Nexus.js'));}catch(e){console.log(e);}
	try {fs.writeFileSync('bin/lib/Nexus/package.json',fs.readFileSync('Nexus/Nexus/package.json'));}catch(e){console.log(e);}
	try {fs.mkdirSync('bin/lib/Proxy');	}catch(e){console.log(e);}
	try {fs.writeFileSync('bin/lib/Proxy/Proxy.js',fs.readFileSync('Nexus/Proxy/Proxy.js'));}catch(e){console.log(e);}
	try {fs.writeFileSync('bin/lib/Proxy/schema.json',fs.readFileSync('Nexus/Proxy/schema.json'));}catch(e){console.log(e);}

	
	//make the tar.gz ... msi ... mac dmg/pkg


})();
