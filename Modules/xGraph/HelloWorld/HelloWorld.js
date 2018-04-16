//# sourceURL=HelloWorld
(
/**
 * The HelloWorld entity, in the HelloWorld module, communicates with the HelloWorld2 entity.
 * @param {object} this.Par     The Parameter object included in the module definition.
 * @param {Pid} this.Par.Friend The Pid of the Friend entity, as defined in the module's schema.
 */
function HelloWorld() {


    /*
        Define all the commands that this entity accepts. This will be returned so the nexus knows which commands
        to send to this entity.
    */
    var dispatch = {
        Setup: Setup,
        Start: Start
    };


    /**
     * The Setup command is sent from the core when the system is run. In this entity, Setup simply prints
     * the example parameter SomePar, if it is available.
     *
     * @param com
     * @callback fun
     *
     */
    function Setup(com,fun) {
        log.i("--HelloWorld/Setup");

        // Nothing happens here, continue on...

        if(this.Par.SomePar) {
            log.i("There is a parameter SomePar valued: " + this.Par.SomePar);
        }

        if (fun){
            fun(null, com);
        }
    }

    //-----------------------------------------------------------------------------Start
    /**
     * Start doing things, and start sending info between modules and functions and entities
     * @param {object} com      The command object.
     * @callback fun
     */
    function Start(com,fun) {
        log.i("--HelloWorld/Start");

		/*
        	The following "let" statement will assign the current 'this' context to a variable
        	'that', in case the context is needed elsewhere out of scope. The 'this' context is
        	only going to be passed down the chain of functions called within functions, but not up.
		//
        	"THIS context was passed from THAT function" ultimately.
		//
        	Using 'that' in this example program isn't explicitly necessary, but it is our standard,
        	and fosters good practices.
        */
        let that = this;

        /*
            The err variable is a place to put error messages to be sent back through the callback.
         */
        let err = null;

        // Define an object to hold message to be sent to the OtherEntity (HelloWorld2.js)...
        /*
			The 'Cmd' parameter holds the name of the command we want to send to 'OtherEntity'.
			The other entity "HelloWorld2" must accept this command or it will be ignored.
			The someValue parameter is passed with the command to the other entity.
		*/
        var commandObject = {
            Cmd: "OtherFunction",
            someValue: 1
        };

        process.stdin.on('readable', readAndSendMessage);

        function readAndSendMessage(){
            let message = process.stdin.read();
            if(message != null){

                /*  sends the command object and the callback function to the xGraph part (entity or module, depending on
                    the fractal layer) specified in the Pid.
                    function send(com, pid, fun)
                */
                // the initialCommand defined above
                //this.Par.Friend is defined in the schema.json
                that.send(commandObject, that.Par.Friend, callback);
            }



            function callback(err,com){
                log.i("----Recieved callback from Other, someValue is now: ", com.someValue);
                commandObject.someValue = com.someValue;
                log.i("--xGraph Repeats: [" + message.toString().trim() + "]");
                log.i("HelloWorld is Listening... Type Something!");
            }
        }

        log.i("\n\nWelcome to xGraph!\n\n"+
            "HelloWorld is Listening... Type Something!");



        /*
            This if statement must be at the end of every function x
            to make use of, or maintain connection to the Nexus, or
            whichever function has called this function x.
        //
            Each "if(fun)" block adds a link to the callback chain
            starting from whatever called the function; in this case,
            the Nexus.
        //
            'fun' is the callback function
        */
        if (fun){
            fun(null, com);
        }
    }


    return {
        dispatch: dispatch
    };

})();
