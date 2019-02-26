const jszip = require('jszip');
const path = require('path');
const fs = require('fs');


module.exports = class JSZipPacker {
    
    async loadModuleFromDirectory(directoryPath) {
        return new Promise (async (resolve) => {			

            if (!await dirExists(directoryPath)) {           
				resolve(false);
				return;
            }
            
            let contents = fs.readdirSync(directoryPath);
			try {				
				let zippedModule = await zip(directoryPath).catch((err) => {
					resolve(false);
				});
				let base64Module = zippedModule.toString('base64');
				resolve(base64Module);			
			} catch (err) {
				resolve(false);
			}
		})
	}

    async saveModuleToDirectory(directoryPath, base64String) {
        return new Promise( async (resolve) => {
			try {
				let module = Buffer.from(base64String, 'base64');
				unzip(directoryPath, module).then(() => {
					resolve(true);
				}).catch((err) => {					
					resolve(false);
				})
			} catch (err) {				
				resolve(false);
				return;			
			}			
		});    
    };
	
}

function dirExists(directory) {
    return new Promise((resolve) => {
        fs.lstat(directory, (err, stats) => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);                
            }            
        })       
    })
}


function zip(ModPath) {
	return new Promise(async (resolve, reject) => {
		let module = new jszip();

		//recursively zip the module
		await zipDir(module, ModPath);

		module.generateAsync({ type: "nodebuffer" }).then((data, err) => {
			if (err) {				
				reject(err);
			} else {				
				resolve(data);
			}
		});

		async function zipDir(root, containingPath) {
			let files;
			try {
				files = fs.readdirSync(containingPath);
			}
			catch (err) {								
				reject(err);
				return;
			}
			if (!files) {							
				reject(err);
				return;
			}
			for (let ifile = 0; ifile < files.length; ifile++) {
				var file = files[ifile];
				if (file.substr(0,4)==".git" || (file == "xgraph.log")) continue;
				var path = containingPath + '/' + file;
				let stat = await new Promise(async (res, rej) => {
					fs.lstat(path, (err, stat) => {
						if (err) rej(err)
						else res(stat);
					})
				});

				if (stat) {
					if (!stat.isDirectory()) {
						try {
							var dat = fs.readFileSync(path);
						} catch (err) {
							return;
						}
						root.file(file, dat);
					} else {
						await zipDir(root.folder(file), path)
					}
				}
			}
		}
	})
}

function unzip(directoryPath, file) {
	return new Promise((resolve, reject) => {
		try {
			jszip.loadAsync(file).then((zip) => {
				try {
					fs.mkdirSync(directoryPath);
				} catch(err) {					
					reject(err);
					return;
				}
				
				zip.forEach((relativePath, file) => {
					if (file.dir) {
						try {
							fs.mkdirSync(path.join(directoryPath, relativePath));                
						} catch(err) {
							reject(err)              
						}
					} else {
						fs.writeFileSync(path.join(directoryPath, relativePath));
					}
				}) 
				resolve(true);   				
			});
		} catch(err) {
			reject(err);	
		}
	});	
}