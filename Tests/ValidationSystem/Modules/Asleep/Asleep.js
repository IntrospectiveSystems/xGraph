(function Asleep() {
	class Asleep {

		Ping(com, fun) {
			fun(null, com);
		}

	}

	return {dispatch: Asleep.prototype};
})()