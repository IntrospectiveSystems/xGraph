module.exports = {
	node: {
		fs: 'empty',
		child_process: 'empty'
	},
	output: {
		library: 'Nexus',
		libraryTarget: 'umd',
		filename: 'Nexus.js'
	},
	entry: './lib/Nexus.js',
	// optimization: {
	// 	minimize: false
	// },
	resolve: {
		alias: {
			'./Cache.js': './IDBCache.js',
			// 'jszip': './jszip.js',
			// 'mkdirp': './jszip.js',
			// 'signale': './jszip.js',
			// 'strip-comments': './jszip.js',
			// 'uuid/v4': './jszip.js',
			// 'volatile': './jszip.js'
		}
	}
};