(function ProxyPool() {
	class ProxyPool {
		async Start(com, fun) {
			let minPort = parseInt(this.Par.Port);
			for (let pid in this.Par.LookupTable) {
				minPort = Math.min(minPort, parseInt(this.Par.LookupTable[pid].Port));
			}
			let oldPort = this.Par.Port;
			this.Par.Port = minPort
			log.v(`ProxyPool Port ${oldPort} -> ${this.Par.Port}`)
			this.save(_ => fun(null, com));
		}

		async GetHostAndPort(com, fun) {
			// this.Par.Port++;
			let port = this.Par.Port
			let checkPortUsed = (port) => {
				for (let pid in this.Par.LookupTable) {
					if(port == this.Par.LookupTable[pid].Port) {
						return true;
					}
				}
				return false;
			};

			for(; true; port ++) {
				if(!checkPortUsed(port)) {
					break;
				}
			}

			let pid = com.Pid || com.Passport.From;
			if (pid in this.Par.LookupTable) {
				com.Host = this.Par.LookupTable[pid].Host;
				com.Port = this.Par.LookupTable[pid].Port;
				com.Pid = this.Par.LookupTable[pid].Pid;
				fun(null, com);
				return;
			}

			com.Port = port;
			let host = com.Host = this.Par.Host;
			let proxyPid = await new Promise(async (resolve) => {
				this.genModule({
					Module: 'xGraph.Proxy',
					Par: {
						Role: "Server",
						Port: port,
						Link: pid,
						Pool: this.Par.Pid
					}
				}, (err, apx) => {
					resolve(apx);
				});
			});

			this.Par.LookupTable[pid] = {
				Port: port,
				Host: host,
				Pid: proxyPid
			}

			this.save(_ => fun(null, com));
		}
	}

	return { dispatch: ProxyPool.prototype };
})();