//# sourceURL=Battery.js
(
    /**
     * An idealized battery. The battery entity is able to charge, discharge, and stop the battery.
     * @param {number} this.Par.InitialCharge   The amount of charge the battery has on instatiation.
     * @param {number} this.Par.Capacity        The total capacity of charge that the battery can hold.
     * @param {object} this.Par.ChargeRate      An object holding the rate (charge/seconds) that the battery
     *                                              charges at.
     * @param {object} this.Par.DischargeRate   An object holding the rate (charge/Seconds) that the battery
     *                                              discharges at.
     */
    function Battery() {
	class Battery {
		Setup(com, fun) {
            log.i("--Battery/Setup");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            //setup class with initial parameters
            Vlt.DepthOfCharge = Par.InitialCharge;
            Vlt.Capacity = Par.Capacity;
            Vlt.ChargeRate = Par.ChargeRate;
            Vlt.DischargeRate = Par.DischargeRate;

            //additional attributes and holders
            Vlt.State = "Stopped";
			Vlt.ChargeTimeout = null;
			Vlt.DischargeTimeout = null;

			fun(null, com);
		}


		/**
         * The Charge command sets the battery to charge at the given charge rate (charge/milliseconds).
         * @param {object} com  The command object.
         * @callback fun
         */
		Charge(com, fun){
            log.i("--Battery/Charge");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            if(Vlt.State == "Discharging"){
                clearInterval(Vlt.DischargeTimeout);
            }

            let interval = Par.ChargeRate.Seconds * 1000;
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


		/**
         * The Discharge command sets the battery to discharge at the given rate (charge/milliseconds).
         * @param {object} com   The command object.
         * @callback fun
         */
		Discharge(com, fun){
            log.i("--Battery/Discharge");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            if(Vlt.State == "Charging"){
                clearInterval(Vlt.ChargeTimeout);
            }

            let interval = Par.DischargeRate.Seconds * 1000;
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


		/**
         * The Stop command stops the battery from charging or discharging.
         * @param {object} com  The command object.
         * @callback fun
         */
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


        /**
         * The GetDepthOfCharge command returns the batteries current DetphOfCharge.
         * @param {object} com                  The command object.
         * @return {number} com.DepthOfCharge   The current depth of charge of the battery.
         * @callback fun
         */
        GetDepthOfCharge(com, fun){
            log.i("--Battery/GetDepthOfCharge");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            com.DepthOfCharge = Vlt.DepthOfCharge

            fun(null, com);
        }


        /**
         * The GetState command returns the batteries current State.
         * @param {object} com          The command object.
         * @return {string} com.State   The current state of the battery.
         * @callback fun
         */
        GetState(com, fun){
            log.i("--Battery/GetState");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

		    com.State = Vlt.State;

		    fun(null, com);
        }

	}
	return {dispatch:Battery.prototype};
})();