//# sourceURL=BankAccount.js
(
/**
 * BankAccount entity (this entity, the BankAccount() JavaScript function) represents a bank account.
 * BankAccount acts as an account, responds to the commands "CheckBalance", "Deposit", and "Withdraw", and is able to
 * check the balance, deposit funds, or withdrawal funds from an account.
 * @param {number=} Balance 	The balance of the account.
 *
 */
function BankAccount() {

    let err = null;

    var dispatch = {
		Start: Start,
		Deposit: Deposit,
		Withdraw: Withdrawal,
		CheckBalance: CheckBalance
    };


    /**
	 * The Start command is sent when BankAccount is generated.
     * @param {object} com 	The command object.
     * @callback fun
     */
	function Start(com, fun){
		log.i("--BankAccount/Start");
		
		if (!("Balance" in this.Par))
			this.Par.Balance = 0;
		
		fun(null, com);
	}

    /**
	 * The Deposit command takes an Amount parameter and adds that amount into the account Balance.
	 * Amount must be a positive number or the deposit will not be made.
     * @param {object} com 				The command object.
	 * @param {number} com.Amount		The amount to be deposited. Must be a positive number.
     * @callback fun
	 * @return {string} com.Message 	A message containing either the new account balance or an error message.
     */
    function Deposit(com, fun){
        log.i("--BankAccount/Deposit", com.Amount);
		let that = this;
        let Par = this.Par;
        let message = "";

        let amount = Number(com.Amount);

		if (amount < 0){
			message = "it's not a deposit if you're withdrawing funds...";
			log.i(message);

			err = "No Deposit Made";
			com.Message= message;

		} else {

            Par.Balance = Number(Par.Balance) + Number(amount);
            message = "Your new balance is " + Par.Balance;
            log.i(message);
            com.Message = message;

            //write the this.Par object to the cache -- persistent when the system restarts
            this.save();
        }
        if (fun)
            fun (err, com);
	}

    /**
	 * The Withdrawal command takes an Amount parameter and subtracts that amount from the account Balance.
	 * Amount must be a positive number or the withdrawal will not be made.
     * @param {object} com				The command object.
	 * @param {number} com.Amount 		The amount to be withdrawn. Must be a positive number.
     * @callback fun
	 * @return {string} com.Message 	A message containing either the new account balance or an error message.
     */
	function Withdrawal(com, fun){
        log.i("--BankAccount/Withdrawl", com.Amount);

        let err = null;

        let message = "";

		if (com.Amount < 0){
			message = "it's not a Withdrawl if you're depositng funds..."
			log.i(message);
			com.Message = message;

			//we can pass back an error message and return promptly
			err = "No Withdrawl Made";

		} else {

            this.Par.Balance -= com.Amount;
            if (this.Par.Balance < 0) {

                message = "Youve certainly done it this time... " +
                    "\n Overdraw fee of $100\n";

                this.Par.Balance = this.Par.Balance - 100;
            }

            message += "Your new balance is " + this.Par.Balance;

            log.i(message);

            //write the this.Par object to the cache -- persistent when the system restarts
            this.save();
        }
		com.Message = message;

		if (fun)
            fun (err, com);
	}

    /**
	 * CheckBalance does not require any parameters. This command prints the account balance, then sends a message
	 * that includes the balance through the callback.
     * @param {object} com				The command object.
     * @callback fun
     * @return {string} com.Message		A message including the account balance.
     */
	function CheckBalance(com, fun){
        log.i("--BankAccount/CheckBalance");

		let message = "Your balance is "+ this.Par.Balance
		log.i(message);
		com.Message = message;

		if (fun){
			fun(null, com);
		}
    }


    return {
        dispatch: dispatch
    };
})();
