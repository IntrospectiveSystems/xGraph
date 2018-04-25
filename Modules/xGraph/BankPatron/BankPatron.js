//# sourceURL=BankPatron.js
(/**
 * The BankPatron entity provides the user with a text interface to interact with a BankAccount.
 * The user is presented with 3 options: check balance, deposit funds, withdraw funds.
 * @param {pid} this.Par.BankAccount	The pid to send the UserCommand too, a BankAccount.
 *
 */
function BankPatron() {


	var dispatch = {
		Setup: Setup,
        StartUserInteraction: StartUserInteraction,
        Start: Start
	};


	/**
	 * When BankPatron is Setup, the command and user options are set up, and a stream to standard
	 * in is set up. When the user selects an option, the command is sent to BankAccount. BankAccount
	 * processes the command, and then returns a com.Message to BankPatron.
	 *
	 * @param {object} com 	The command object.
	 * @callback fun
	 */
	function Setup(com, fun){
		log.i("--BankPatron/Setup");

		//needed to keep the this context when in nested functions
		let that = this;
		let Vlt = this.Vlt;
		let Par = this.Par

		// this.Vlt holds temporary data. This is used to store info when the entity is running.
		// this.Vlt is temporary and will be reset when the system is reset.
		Vlt.options = {
			1: "Check Balance",
			2: "Deposit Funds",
			3: "Withdraw Funds"
		}
		Vlt.commands = {
			1: "CheckBalance",
			2: "Deposit",
			3: "Withdraw"
		}


		Vlt.stdin = process.stdin;

        if (fun)
            fun(null,com);

	}

	function Start(com, fun){
        log.i("--BankPatron/Start");
        let that = this;
        let Vlt = this.Vlt;
        let Par = this.Par
        let errors = null;

		//log.i("\n\nStarting an action loop!\n");
        //setTimeout(promptUser,1000);

        // clear the input stream and restart it
        // Standard in listens for any "data", and calls selectAction when it recieves data.


        let sayHelloCommand = {
            Cmd: "SayHello"
        };

        this.send(sayHelloCommand, Par.BankAccount, callback);

        function callback(err, cmd){
            if(err) {
                log.e(err);
                errors = err;
            }

            if(cmd.Ready) {
                let startUserInteraction = {
                    Cmd: "StartUserInteraction"
                };
                that.dispatch(startUserInteraction, backcall);

                function backcall(err, msg) {
                    if (err) {
                        log.e(err);
                        errors = err;
                    }
                }
            }
        }

        if (fun)
            fun(errors,com);






	}

    function StartUserInteraction(com, fun){
        log.i("--BankPatron/StartUserInteraction");
        let that = this;
        let Vlt = this.Vlt;
        let Par = this.Par

        // Prompt the user to select a command, then send that command to the BankAccount.

        promptAction();


        if (fun)
            fun(null,com);





        function promptAction() {

            Vlt.stdin.removeAllListeners('data');
            Vlt.stdin.addListener('data', readAction);
            // Prompt user in the console. Options are defined on setup.
            log.i("What action would you like to take \n" +
                JSON.stringify(Vlt.options, null, 2)
            );
        }


        function readAction(data) {

            // trim any extra spaces off the input
            Vlt.selection = data.toString().trim();
            log.i(Vlt.selection);

            // if the user input was not a valid selection, say so and prompt the user again.
            // else repeat the users selection, build and the command.
            if (!(Vlt.selection in Vlt.options)){

                log.i("Invalid selection: " + Vlt.selection);

            } else {

                log.i("You chose to " + Vlt.options[Vlt.selection]);

                if (Vlt.selection == 1) {
                    let userSelection = {};

                    userSelection.Cmd = "CheckBalance";
                    sendCommand(userSelection);

                } else {
                    promptAmount();
                }
            }
        }

        function promptAmount(){
            // change event function from selectAction to readAmount
            // Prompt the user to input an amount to be deposited/withdrawn
            // then send the command.
            that.Vlt.stdin.removeListener('data', readAction);
            that.Vlt.stdin.addListener('data', readAmount);

            log.i("Enter amount to " + that.Vlt.options[that.Vlt.selection])
        }

        function readAmount(userAmount){
            that.Vlt.amount = userAmount.toString().trim();

            if(isNaN(that.Vlt.amount || that.Vlt.amount < 0)){
                log.e("Amount to " + Vlt.selection + "must be a positive number.")

            } else {

                log.i("The amount is ", that.Vlt.amount);

                let userSelection = {};


                userSelection = {
                    Cmd: Vlt.commands[Vlt.selection],
                    Amount: that.Vlt.amount
                };

                sendCommand(userSelection);
            }
        }

        // Send the command object userSelection. Print the messaged recieved in the callback, and
        // prompt the user to make another selection.
        function sendCommand(userSelection) {
            that.send(userSelection, Par.BankAccount, callback);

            function callback(err, com){
                if (err)
                    log.e(err);
                if (com.Message)
                    log.i("BankAccount Returned: ", com.Message);

                promptAction()
            }
        }

        if (fun)
            fun(null,com);
    }

	return {
		dispatch: dispatch
	};
})();
