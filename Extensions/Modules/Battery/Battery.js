//# sourceURL=Battery.js
(function Battery() {
	class Battery {
		Setup(com, fun) {
            log.i("--Battery/Setup");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            Vlt.DepthOfCharge = Par.InitialCharge;
            Vlt.State = "Stopped";

			Vlt.ChargeTimeout = null;
			Vlt.DischargeTimeout = null;

			fun(null, com);
		}

		Start(com, fun){


			fun(null, com);
		}

		Charge(com, fun){
            log.i("--Battery/Charge");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            if(Vlt.State == "Discharging"){
                clearInterval(Vlt.DischargeTimeout);
            }

            let interval = Par.ChargeRate.Milliseconds;
			let charge = Par.ChargeRate.Charge;

            Vlt.ChargeTimeout = setInterval(iterativeCharge, interval);

            Vlt.State = "Charging";


            fun(null, com);

            function iterativeCharge(){
				log.v(Vlt.DepthOfCharge);
            	if(Vlt.DepthOfCharge < Par.Capacity){
            		if(Vlt.DepthOfCharge + charge <= Par.Capacity) {
                        Vlt.DepthOfCharge += charge;
                    } else {
            			Vlt.DepthOfCharge = Par.Capacity;
					}
				}
			}


		}

		Discharge(com, fun){
            log.i("--Battery/Discharge");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            if(Vlt.State == "Charging"){
                clearInterval(Vlt.ChargeTimeout);
            }

            let interval = Par.DischargeRate.Milliseconds;
            let charge = Par.DischargeRate.Charge;

            Vlt.DischargeTimeout = setInterval(iterativeDischarge, interval);

            Vlt.State = "Discharging";

            fun(null, com);

            function iterativeDischarge(){
                log.v(Vlt.DepthOfCharge);
                if(Vlt.DepthOfCharge > 0){
                    if(Vlt.DepthOfCharge - charge >= 0) {
                        Vlt.DepthOfCharge -= charge;
                    } else {
                        Vlt.DepthOfCharge = 0;
                    }
                }
            }
		}

		Stop(com, fun){
            log.i("--Battery/Stop");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            if(Vlt.State == "Charging"){
                clearInterval(Vlt.ChargeTimeout);
                Vlt.State = "Stopped";
            } else if(Vlt.State == "Discharging"){
                clearInterval(Vlt.DischargeTimeout);
                Vlt.State = "Stopped";
            }

            fun(null, com);
        }
	}
	return {dispatch:Battery.prototype};
})();