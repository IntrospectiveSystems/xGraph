//# sourceURL=HelloWorld2
(/**
 * A HelloWorld2 'other' entity in the HelloWorld module which communicates with HelloWorld.
 * @param {object} this.Par     The Parameter object included in the module definition.
 *
 */
function HelloWorld2() {


    var dispatch = {
		Start: Start,
        OtherFunction: OtherFunction
    };


    //-----------------------------------------------------------------------------[Start(com,fun)

    /**
     * Start doing things, and start sending info between modules and functions and entities
     * @param {object} com      The command object.
     * @callback fun
     */
    function Start(com,fun) {
        log.i("--HelloWorld2/Start");

        //callback function handling
        if (fun){
            fun(null, com);
        }
    }

    //-----------------------------------------------------------------------[otherFunction(com,fun)
    /**
     * Function called by the HelloWorld.js entity.
     * This reads the data sent in com (msgProperties in HelloWorld.js), adds 1 to someValue,
     * and sends the results back.
     * To see the data, print out com.
     * @param {object} com              The command object.
     * @param {number} com.someValue    The value being passed between helloWorld and helloWorld2.
     * @callback fun
     *
     * @return {number} com.someValue   The value passed between helloWorld and helloWorld2, incremented by 1.
     */
    function OtherFunction(com,fun){
        log.i("--HelloWorld2/otherFunction: ");
        com.someValue = com.someValue + 1;
        //Callback
        if (fun){
            fun(null, com);
        }
	}


    return {
        dispatch: dispatch
    };

})();//Run it '()'
