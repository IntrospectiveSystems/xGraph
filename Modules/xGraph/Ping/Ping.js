//# sourceURL=Ping
(
    /**
     * The Ping entity communicates with the Pong entities.
     * Starting with the Ping module, the Start() function calls Pong.
     * Encapsulating module is defined in the PingPong system config file.
     * @param {pid} this.Par.Pong   The Pid of the Pong entity.
     */
function Ping() {

    /*
        Define all commands. This will be returned so that the xGraph core knows what
        commands the entity can accept.
    */
    var dispatch = {
        Start: Start,
        Pong:Pong
    };


    //-------------------------------------------------------Start
    /**
     * The Start command sets up a setTimeout function that will send the first "Ping" command
     * to the entity referenced in this.Par.Pong.
     *
     * @param {object} com  The command object.
     * @callback fun
     */
    function Start(com,fun) {
        log.i("--Ping/Start");

        // Launch the ball by sending the first Ping a command to Pong
        // This command does not need any information back, so it is sent
        //  without a callback
        this.send({"Cmd":"Ping"}, this.Par.Pong);


        if (fun){
            fun(null, com);
        }
    }

    //-------------------------------------------------------Pong
    /**
     * The Pong command is sent from the Pong entity, Pong.js. When Pong is received,
     * this module prints "Pong" in the console, then sends a 'Ping' command to the
     * module referenced in this.Par.Pong.
     * @param {object} com  The command object.
     * @callback fun
     */
    function Pong(com, fun){
        log.i("          |      Pong");
        // some useful variables
        let that = this;
        let Par = this.Par;

        // Wait one second before sending Ping command back.
        // This prevents stack overflow due to infinent loop.
        setTimeout(sendCommand, 1000);

        function sendCommand() {
            // Send Ping command to the Pong Module. Like before, this command does not need
            //      any information back, so it is sent without a callback
            // Here you will see we have used the 'that' variable to retain the
            //      parent functions context.
            that.send({"Cmd": "Ping"}, Par.Pong);
        }

        // call the Callback
        if (fun){
            fun(null, com);
        }
    }

    // return the dispatch, the commands that this entity can receive.
    return {
        dispatch: dispatch
    };
})();
