//# sourceURL=Pong
(
 /**
 * The Pong entity expects a Ping command from the Ping entity.
 * @param {pid} this.Par.Ping   The Pid of the Ping entity.
 */
function Pong() {
    /*
     Define all commands. This will be returned so that the xGraph core knows what
     commands the entity can accept.
    */
    var dispatch = {
        Ping:Ping
    };

    //-------------------------------------------------------Pong
     /**
      * The Pong command is sent from the Pong entity, Pong.js. When Pong is received,
      * this module prints "Ping" in the console, then sends a 'Pong' command to the
      * module referenced in this.Par.Ping.
      * @param {object} com     The command object.
      * @callback fun
      */
    function Ping(com, fun){
        log.i("Ping      |");
        // some useful variables
        let that = this;
        let Par = this.Par;

        setTimeout(sendCommand, 1000);

        function sendCommand() {
            // Send the Pong command to the Ping Module.
            // Here you will see we have used the 'that' variable to retain the
            //      parent functions context.
            that.send({"Cmd": "Pong"}, Par.Ping);
        }

        if (fun) {
            fun(null, com);
        }
    }

     // return the dispatch, the commands that this entity can receive.
    return {
        dispatch: dispatch
    };
})();
