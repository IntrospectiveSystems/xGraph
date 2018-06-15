(function ProxyPool() {
	class ProxyPool {
		async Start(com, fun) { this.save(_ => fun(null, com)); }

		async GetHostAndPort(com, fun) {
			this.Par.Port++;

			let pid = com.Pid || com.Passport.From;

			if (pid in this.Par.LookupTable) {
				com.Host = this.Par.LookupTable[pid].Host;
				com.Port = this.Par.LookupTable[pid].Port;
				com.Pid = this.Par.LookupTable[pid].Pid;
				fun(null, com);
				return;
			}

			let port = com.Port = this.Par.Port;
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