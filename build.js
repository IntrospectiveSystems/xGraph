(async _ => {

	const Preprocessor = require('preprocessor');
	const fs = require('fs');
	const { compile } = require('nexe');
	
	fs.writeFileSync('src/gen/xgraph-linux.js', new Preprocessor(fs.readFileSync('src/xgraph.js'), '.').process({LINUX: true}));
	
	await compile({
		input: 'src/gen/xgraph-linux.js',
		output: 'bin/linux/xgraph',
		target: 'linux-x64-8.4.0',
		bundle: true
	});
	
	fs.writeFileSync('src/gen/xgraph-windows.js', new Preprocessor(fs.readFileSync('src/xgraph.js'), '.').process({WINDOWS: true}));
	
	await compile({
		input: 'src/gen/xgraph-windows.js',
		output: 'bin/windows/xgraph',
		target: 'windows-x64-8.4.0',
		bundle: true
	});
	
	fs.writeFileSync('src/gen/xgraph-mac.js', new Preprocessor(fs.readFileSync('src/xgraph.js'), '.').process({MAC: true}));
	
	await compile({
		input: 'src/gen/xgraph-mac.js',
		output: 'bin/mac/xgraph',
		target: 'mac-x64-8.4.0',
		bundle: true
	});

})();
