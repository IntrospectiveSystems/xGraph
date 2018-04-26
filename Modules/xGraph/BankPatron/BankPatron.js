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
	 * in is set up.
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

    /**
     * Start sends a command to the BankAccount module (this.Par.BankAccount).
     * When it receives a callback from BankAccount with the command argument Ready set to true,
     * BankPatron dispatches it's StartUserInteraction command, which launches the text interface.
     * @param {object} com  The command object.
     * @callback fun
     */
	function Start(com, fun){
        log.i("--BankPatron/Start");
        let that = this;
        let Par = this.Par;
        let errors = null;

        // Send a BankPatronWaiting command to the Par.BankAccount module,
        // so the text interface doesn't start before the rest of the system.
        let bankPatronWaitingCommand = {
            Cmd: "BankPatronWaiting"
        };

        that.send(bankPatronWaitingCommand, Par.BankAccount, bankAccountResponse);

        function bankAccountResponse(err, cmd){
            if(err) {
                log.e(err);
                errors = err;
            }

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

        if (fun)
            fun(errors,com);
	}

    /**
     * StartUserInteraction starts the text user interface for interacting with the BankAccount module.
     * Users are presented with three options: Check Balance, Deposit Funds or Withdraw Funds.
     * If the user chooses to Deposit or Withdraw funds, the user is then prompted to enter an amount.
     * @param {object} com   The command object.
     * @callback fun
     */
    function StartUserInteraction(com, fun){
        log.i("--BankPatron/StartUserInteraction");
        let that = this;
        let Vlt = this.Vlt;
        let Par = this.Par

        // Start by prompting the user to select a command.
        promptAction();


        if (fun)
            fun(null,com);

        // displays the initial prompt
        function promptAction() {
            // change event function to readAmount
            // Prompt the user to input an amount to be deposited/withdrawn
            // then send the command.
            Vlt.stdin.removeAllListeners('data');
            Vlt.stdin.addListener('data', readAction);
            // Prompt user in the console. Options are defined on setup.
            log.i("What action would you like to take \n" +
                JSON.stringify(Vlt.options, null, 2)
            );
        }


        // reads the selection from the initial prompt
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

        // display the prompt for selections requiring an amount
        function promptAmount(){
            // change event function from selectAction to readAmount
            // Prompt the user to input an amount to be deposited/withdrawn
            // then send the command.
            Vlt.stdin.removeListener('data', readAction);
            Vlt.stdin.addListener('data', readAmount);

            log.i("Type `x` to cancel.");
            log.i("Enter amount to " + Vlt.options[Vlt.selection]);

        }

        // reads the amount entered
        function readAmount(userAmount){
            Vlt.amount = userAmount.toString().trim();

            if (Vlt.amount == 'x' || Vlt.amount == 'X') {
                log.i("Canceling " + Vlt.options[Vlt.selection] + ".");
                promptAction();

            } else if(isNaN(Vlt.amount) || Vlt.amount < 0){
                log.i("Amount to " + Vlt.amount + " must be a positive number.");
                log.i("Type `x` to cancel.");
                log.i("Please enter an amount to deposit.");

            } else {
                log.i("The amount is ", Vlt.amount);

                let userSelection = {};


                userSelection = {
                    Cmd: Vlt.commands[Vlt.selection],
                    Amount: Vlt.amount
                };

                sendCommand(userSelection);
            }
        }

        // Send the command object userSelection.
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
