class SemVer {
	constructor(str, defaultVersion) {
		if (!str) {
			// console.warn(`Version not specified, assuming ${defaultVersion} for compatibility.`);
			str = defaultVersion;
		}
		let parts = str.split('.');
		let version = [];
		if (parts.length > 0 && parts.length < 4);
		for (let i = 0; i < parts.length; i++) {
			let thing = parseInt(parts[i]);
			if (thing === thing) {
				version.push(thing);
			}
		}
		while (version.length < 3) {
			version.push(0);
		}

		[this.major, this.minor, this.patch] = version;

	}

	valueOf() {
		return (this.major * 1e6) + (this.minor * 1e3) + (this.patch);
	}
}
module.exports = SemVer;