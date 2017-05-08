(function CvtLwo() {
	var Par;

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		Convert: Convert
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--CvtLwo/Setup');
		this.Vlt.Graph = [];
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--CvtLwo/Start');
		if(fun)
			fun();
	}

	//---------------------------------------------------------Convert
	// Convert obj model into x3d format
	function Convert(com, fun) {
		Par = this.Par;
		var path = com.Path;
		Parse(path, done);

		function done(err, x3d) {
			if (x3d == null) {
				console.log(' ** ERR:Parse failed');
				if (fun)
					fun('Parse failed');
				return;
			}
			x3d.Name = com.Name;
			com.X3D = x3d;
			//	console.log('x3d', JSON.stringify(x3d, null, 2));
			console.log(' ** CvtObj processing completed');
			if (fun)
				fun(null, com);
		}
	}

	//-----------------------------------------------------Parse
	// Set output file
	function Parse(path, done) {
		console.log('..CvtLwo/Parse', path);
		var Math3D = require('math3d');
		var earcut = require('earcut');
		var fs = require('fs');
		var Pts = [];
		var UV;
		var Ply = [];
		var ixPly = [];
		var Tags = [];
		fs.readFile(path, function(err, buf) {
			if(err) {
				console.log(' ** ERR:' + err);
				if(fun)
					fun(err);
				return;
			}
			nsize = buf.length;
			console.log('nsize', nsize);
		//	for(var i=0; i<20; i++)
		//		console.log(i, buf[i], buf.toString('ascii', i, i+1));
			var ix = 0;
			var form = buf.toString('ascii', ix, ix+4);
			var nform = buf.readInt32BE(ix+4);
			var ix = 12;
			var chunk;
			while(ix < nform+8) {
				var id = buf.toString('ascii', ix, ix+4);
				var nchunk = buf.readInt32BE(ix+4);
				var chunk = buf.slice(ix+8, ix+nchunk+8);
				switch(id) {
					case 'TAGS':
						tags(nchunk, chunk);
						break;
					case 'LAYR':
						layr(nchunk, chunk);
						break;
					case 'PNTS':
						pnts(nchunk, chunk);
						break;
					case 'BBOX':
						bbox(nchunk, chunk);
						break;
					case 'VMAP':
						vmap(nchunk, chunk);
						break;
					case 'POLS':
						pols(nchunk, chunk);
						break;
					case 'PTAG':
						ptag(nchunk, chunk);
						break;
					case 'CLIP':
						clip(nchunk, chunk);
						break;
					case 'SURF':
						surf(nchunk, chunk);
						break;
					default:
						console.log(id, nchunk);
						break;
				}
				ix += nchunk + 8;
			}
		});

		function tags(ndata, data) {
			var i1 = 0;
			var state = 1;
			var str;
			for(let i=0; i<ndata; i++) {
				switch(state) {
					case 0:
						if(data[i] != 0) {
							i1 = i;
							state = 1;
						}
						break;
					case 1:
						if(data[i] == 0) {
							str = data.toString('ascii', i1, i);
							Tags.push(str);
							state = 0;
						}
						break;
				}
			}
			console.log('TAGS', ndata, Tags);
		}

		function layr(ndata, data) {
			var n = data.readInt16BE(0);
			var flag = data.readInt16BE(2);
			var x = data.readFloatBE(4);
			var y = data.readFloatBE(8);
			var z = data.readFloatBE(12);
			console.log('LAYR', ndata, 'Layer:' + n, 'flag:' + flag);
			console.log('     Pivot(' + x + ',' + y + ',' + z + ')');
		}

		function pnts(ndata, data) {
			var npts = ndata/12;
			console.log('PNTS', ndata, 'nPts:' + ndata/12);
			Pts = [];
			for(i=0; i<ndata/4; i++) {
				var val = data.readFloatBE(4*i);
				Pts.push(val);
			}
			console.log('     (' + Pts[0] + ',' + Pts[1] + ',' + Pts[2] + ')');
			console.log('     (' + Pts[3] + ',' + Pts[4] + ',' + Pts[5] + ')');
			console.log('         ...');
			var j = Pts.length - 4;
			console.log('     (' + Pts[j] + ',' + Pts[j+1] + ',' + Pts[j+2] + ')');
		}

		function bbox(ndata, data) {
			console.log('BBOX', ndata);
			var pts = [];
			for(var i=0; i<6; i++) {
				var val = data.readFloatBE(4*i);
				pts.push(val);
			}
			console.log('     Min:(' + pts[0] + ',' + pts[1] + ',' + pts[2] + ')');
			console.log('     Max:(' + pts[3] + ',' + pts[4] + ',' + pts[5] + ')');
		}

		function vmap(ndata, data) {
			var type = data.toString('ascii', 0, 4);
			var dim = data.readInt16BE(4);
			var str = '';
			var ilast;
			for(var i=6; i<ndata; i++) {
				if(data[i] == 0) {
					ilast = i+1;
					if(ilast % 2)
						ilast++;
					break;
				}
			}
			var name = data.toString('ascii', 6, ilast);
			console.log('VMAP', ndata, 'Type:' + type, 'Dim:' + dim, 'Name:' + name);
			if('type' != 'TXUV')
				return;
			var npt = Pnts.length/3;
			UV = new Float32Array(2*npt);
			var iuv = ilast;
			var ivrt;
			var u;
			var v;
			while(iuv < ndata) {
				ivrt = data.readInt16BE(iuv);
				u = data.readFloatBE(iuv+2);
				v = date.readFloatBE(iuv+6);
				UV[2*ivrt] = u;
				UV[2*ivrt+1] = v;
				iuv += 10;
			}
			for(var i=0; i<8; i++)
				console.log('      ', i, UV[2*i], UV[2*i+1]);
			console.log('           ...');
			for(var i=npt-3; i<npt; i++)
				console.log('      ', i, UV[2*i], UV[2*i+1]);
		}

		function pols(ndata, data) {
			Ply = [];
			var type = data.toString('ascii', 0, 4);
			console.log('POLS', ndata, 'Type:' + type);
			iply = 4;
			while(iply < ndata) {
				var ply = [];
				var ival = data.readInt16BE(iply);
				var nvrt = ival & 0x03FF;
				iply += 2;
				var ix;
				for(let i=0; i<nvrt; i++) {
					ix = data.readInt16BE(iply);
					ply.push(ix);
					iply += 2;
				}
				Ply.push(ply);
			}
			for(let iply=0; iply<3; iply++)
				console.log('     ' + iply + ':' + ply);
			console.log('        ...');
			iply1 = Ply.length - 2;
			for(var iply=iply1; iply<Ply.length; iply++)
				console.log('     ' + iply + ':' + ply);
		}

		function ptag(ndata, data) {
			var type = data.toString('ascii', 0, 4);
			console.log('PTAG', ndata, 'Type:' + type);
			if(type != 'SURF')
				return;
			var ix=4;
			while(ix < ndata) {
				var ixply = data.readInt16BE(ix);
				var itag = data.readInt16BE(ix+2);
				ixPly.push(ixply);
				ixPly.push(itag);
				ix += 4;
			}
			for(var i=0; i<8; i+=2)
				console.log('     ', ixPly[i], ixPly[i+1]);
			console.log('       ...');
			var nply = ixPly.length;
			for(var i=nply-8; i<nply; i+=2)
				console.log('     ', ixPly[i], ixPly[i+1]);
		}

		function clip(ndata, data) {
			var indx = data.readInt32BE(0);
			console.log('CLIP', ndata, 'Index:' + indx);
			var isub = 4;
			while(isub < ndata) {
				var id = data.toString('ascii', isub, isub+4);
				var nsub = data.readInt16BE(isub+4);
				switch(id) {
					case 'STIL':
						var i1 = isub+6;
						for(var i=i1; i<ndata; i++) {
							if(data[i] == 0) {
								var str = data.toString('ascii', i1, i);
								console.log('     ' + id, 'File:' + str);
								break;
							}
						}
						break;
					case 'FLAG':
						var ival = data.readInt32BE(isub+6);
						console.log('     FLAG', ival);
						break;
					default:
						console.log('     ' + id);
						break;
				}
				isub += nsub + 6;
			}
		}

		function surf(ndata, data) {
			var i1 = 0;
			var name;
			var source;
			for(let i=i1; i<ndata; i++) {
				if(data[i] == 0) {
					name = data.toString('ascii', i1, i);
					i1 = i+1;
					if(i1 % 2 == 1)
						i1++;
					break;
				}
			}
			for(let i=i1; i<ndata; i++) {
				if(data[i] == 0) {
					if(i == i1)
						source = '';
					else
						source = data.toString('ascii', i1, i);
					i1 = i+1;
					if(i1 % 2 == 1)
						i1++;
					break;
				}
			}
			console.log('SURF Name:' + name, 'Source:' + source);
			var isub = i1;
			var rgb;
			var val;
			var ival;
			var iblk1;
			var iblk2;
			while(isub < ndata) {
				var id = data.toString('ascii', isub, isub+4);
				var nsub = data.readInt16BE(isub+4);
				switch(id) {
					case 'COLR':
						rgb = [];
						rgb.push(data.readFloatBE(isub+6));
						rgb.push(data.readFloatBE(isub+10));
						rgb.push(data.readFloatBE(isub+14));
						console.log('     COLR', rgb);
						break;
					case 'LUMI':
					case 'DIFF':
					case 'SPEC':
					case 'REFL':
					case 'TRAN':
					case 'TRNL':
					case 'GLOS':
					case 'BUMP':
					case 'RIND':
					case 'SMAN':
						val = data.readFloatBE(isub+6);
						console.log('     ' + id, val);
						break;
					case 'SIDE':
						ival = data.readInt16BE(isub+6);
						console.log('     ' + id, ival);
						break;
					case 'ALPH':
						ival = data.readInt16BE(isub+6);
						val = data.readFloatBE(isub+8);
						console.log('     ALPH Mode:', ival, 'Val:', val);
						break;
					case 'BLOK':
						console.log('     BLOK', nsub);
						iblk1 = isub+6;
						iblk2 = iblk1 + nsub;
						while(iblk1 < iblk2) {
							var type = data.toString('ascii', iblk1, iblk1+4);
							var nblk = data.readInt16BE(iblk1+4);
							switch(type) {
								case 'IMAP':
									imap(nblk, data.slice(iblk1+6, iblk1+nblk+6));
									break;
								case 'TMAP':
									tmap(nblk, data.slice(iblk1+6, iblk1+nblk+6));
									break;
								case 'IMAG':
									ival = data.readInt16BE(iblk1+6);
									console.log('        ', type, nblk, 'Clip:' + ival);
									break;
								default:
									console.log('        ', type, nblk);
									break;
							}
							iblk1 += nblk + 6;
						}
						break;
					default:
						console.log('     ' + id);
						break;
				}
				isub += nsub + 6;
			}

			function imap(nbuf, buf) {
				var ord = 'Duh';
				var ibuf = 0;
				for(var i=0; i<nbuf; i++) {
					if(buf[i] == 0) {
						ord = buf.toString('ascii', 0, i);
						ibuf = i+1;
						if(ibuf % 2 == 1)
							ibuf++;
						break;
					}
				}
				console.log('         IMAP', nbuf, 'Ord:' + ord);
				while(ibuf < nbuf) {
					var type = buf.toString('ascii', ibuf, ibuf+4);
					var nprt = buf.readInt16BE(ibuf+4);
					switch(type) {
						case 'CHAN':
							var chan = buf.toString('ascii', ibuf+6, ibuf+10);
							console.log('             ' + type, 'Chan:', chan);
							break;
						default:
							console.log('             ' + type);
							break;
					}
					ibuf += nprt+6;
				}
			}

			function tmap(nbuf, buf) {
				console.log('         TMAP', nbuf);
				var ibuf = 0;
				while(ibuf < nbuf) {
					var type = buf.toString('ascii', ibuf, ibuf+4);
					var nprt = buf.readInt16BE(ibuf+4);
					console.log('             ' + type);
					ibuf += nprt+6;
				}
			}
		}

		function genx3d(wrap) {
			console.log('..genx3d');
			for (key in Mats) {
				console.log('Material', key);
				var mat = Mats[key];
				for (att in mat) {
					switch (att) {
						case 'Vrt':
						case 'Nrm':
						case 'UV':
						case 'Idx':
							console.log(att + ':' + mat[att].length);
							break;
						default:
							console.log(att + ':' + mat[att]);
							break;
					}
				}
			}
			var x3d = {};
			var root = [];
			var node = {};
			node.Name = "Nada";
			node.Pivot = [0, 0, 0];
			node.Parts = [];
			for (name in Mats) {
				var mat = Mats[name];
				if (mat.Idx.length < 3)
					continue;
				var part = {};
				part.Vrt = mat.Vrt;
				if (mat.Nrm.length > 0)
					part.Nrm = mat.Nrm;
				if (mat.UV.length > 0)
					part.UV = mat.UV;
				part.Idx = mat.Idx;
				if (mat.Diff.length > 0)
					part.Diffuse = mat.Diff;
				if (mat.Ambi.length > 0)
					part.Ambient = mat.Ambi;
				if (mat.Spec.length > 0)
					part.Specular = mat.Spec;
				if ('Text' in mat) {
					part.Texture = mat.Text;
					if ('Textures' in x3d) {
						x3d.Textures[mat.Text] = {};
					} else {
						x3d.Textures = {};
						x3d.Textures[mat.Text] = {};
					}
				}
				node.Parts.push(part);
			}
			root.push(node);
			x3d.Root = root;
			wrap(null, x3d);
		}
	}
})();
