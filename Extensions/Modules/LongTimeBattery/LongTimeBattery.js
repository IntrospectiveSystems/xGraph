//# sourceURL=Battery.js
(
    /**
     * An idealized battery. The battery entity is able to charge, discharge, and stop the battery.
     * @param {number} this.Par.InitialCharge   The amount of charge the battery has on instatiation.
     * @param {number} this.Par.Capacity        The total capacity of charge that the battery can hold.
     * @param {object} this.Par.ChargeRate      An object holding the rate (charge/milliseconds) that the battery
     *                                              charges at.
     * @param {object} this.Par.DischargeRate   An object holding the rate (charge/milliseconds) that the battery
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
            Vlt.TimeUnits = {
                seconds: 1,
                minutes: 60,
                hours: 3600,
                days: 86400,
                years: 31536000
            }

			fun(null, com);
		}


		/**
         * The Charge command sets the battery to charge at the given charge rate (charge/milliseconds).
         * @param {object} com                  The command object.
         * @param {object} com.ForPeriod        The Period object reperesenting the period of time that will pass.
         * @param {number} com.ForPeriod.Time   The length of time passed.
         * @param {string} com.ForPeriod.Unit   The unit for the time passing. One of: seconds, minutes, hours,
         *                                          days, years
         * @return {number} com.DetphOfCharge   The batteries depth of charge after the period of time has passed.
         * @callback fun
         */
		Charge(com, fun){
            log.i("--Battery/Charge");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let currentCharge = Vlt.DepthOfCharge;

            Vlt.DepthOfCharge = currentCharge + (com.ForPeriod.Length * Vlt.TimeUnits[com.ForPeriod.Unit]);

            com.DepthOfCharge = Vlt.DepthOfCharge;

            fun(null, com);
		}


		/**
         * The Discharge command sets the battery to discharge at the given rate (charge/milliseconds).
         * @param {object} com   The command object.
         * @param {object} com.ForPeriod        The Period object reperesenting the period of time that will pass.
         * @param {number} com.ForPeriod.Time   The length of time passed.
         * @param {string} com.ForPeriod.Unit   The unit for the time passing. One of: seconds, minutes, hours,
         *                                          days, years
         * @return {number} com.DetphOfCharge   The batteries depth of charge after the period of time has passed.
         * @callback fun
         */
		Discharge(com, fun){
            log.i("--Battery/Discharge");
            let that = this;
            let Par = this.Par;
            let Vlt = this.Vlt;
            let errors = null;

            let currentCharge = Vlt.DepthOfCharge;

            Vlt.DepthOfCharge = currentCharge - (com.ForPeriod.Length * Vlt.TimeUnits[com.ForPeriod.Unit]);

            com.DepthOfCharge = Vlt.DepthOfCharge;

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


	}
	return {dispatch:Battery.prototype};
})();