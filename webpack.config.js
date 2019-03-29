const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
// const Visualizer = require('webpack-visualizer-plugin');
const Visualizer = require('webpack-visualizer-plugin-with-assets');


module.exports = {
	entry: {
		Nexus: './browser/nxs.js',
		// xGraph: './browser/xgraph.js'
	},

	node: {
		fs: 'empty',
		child_process: 'empty'
	},

	output: {
		library: 'xgraph',
		libraryTarget: 'umd',
		filename: '[name].js'
	},

	module: {
		rules: [
			{
				//so what, we check every single require to see if it
				// matches this, and use the shebang loader? because
				// webpack cant handle the complete node spec? 
				// G E N I U S
				test: /xgraph\.js?$/,
				loader: 'shebang-loader'
				// just wait until someone prepends a number with a zero,
				// kiddo. 0700? these utilities are a joke.
			}
		]
	},

	// idk what mode production does, but it yells at me if i dont
	// update: it seems to do literally nothing, so
	mode: 'production',

	// this turns off minifying. easier to debug.
	// TODO turn this off, eventually.
	optimization: {
		minimize: false
	},

	// idk, i think the visualizer requires it.
	// profile: true,

	//replace the very serverside files, with some browser equivalents.
	resolve: {
		alias: {
			'./Cache.js': '../browser/IDBCache.js',
			'../lib/Cache.js': '../browser/IDBCache.js',
			'./Logger.js': '../browser/Logger.js',
			'../lib/Logger.js': '../browser/Logger.js',
			// 'jszip': './jszip.js',
			// 'mkdirp': './jszip.js',
			// 'signale': './jszip.js',
			// 'strip-comments': './jszip.js',
			// 'uuid/v4': './jszip.js',
			// 'volatile': './jszip.js'
		}
	},

	// look. i dont know. okay? questions, look them up on npm.
	// i dont have answers.
	plugins: [
		new HtmlWebpackPlugin({
			// because apparently htmlwebpackinlinesourceplugin cant think for itself.
			inlineSource: '.(js|css)$'
		}),
		new HtmlWebpackInlineSourcePlugin(),
		new LiveReloadPlugin({
			appendScriptTag: true,
			delay: 1000
		}),
		new Visualizer({
			filename: 'stats.html'
		})
	]
};