### BankPatron

---
#### Description

This is the BankPatron Module. This module, together with the BankAccount
and BankPatron systems, is an example of how an xGraph system can work
with another system. The BankPatron module acts as a command line user
interface, prompting the user to make a selection, and then sending that
command to the BankAccount system.

---

### Module Definition Parameters

- **Par.BankAccount** (*required*): The Pid, the CheckBalance, Deposit,
                                    and Withdraw commands.

---

### Output Commands
The following Commands can be sent by BankPatron.

##### Cmd: 'CheckBalance'
CheckBalance is sent to the module referenced at `this.Par.BankAccount`.
CheckBalance attempts to get a balance from a bank account. CheckBalance
expects a callback with a "Message" key in the command object,
`object.Message`.

###### Command Object
- **object.Cmd**: "CheckBalance" (The command.)

###### Reference
`this.Par.BankAccount`


##### Cmd: 'Deposit'
Deposit is sent to the module referenced at `this.Par.BankAccount`. In the command
object, Deposit sends an amount to be deposited. Deposit expects a callback
with a "Message" key in the command object, `object.Message`.

###### Command Object
- **object.Cmd**: "CheckBalance" (The command.)
- **object.Amount**: The amount to be deposited. Must be a positive number.

###### Reference
`this.Par.BankAccount`


##### Cmd: 'Withdraw'
Withdraw is sent to the module referenced at `this.Par.BankAccount`. In the command
object, Withdraw sends an amount to be withdrawn. Withdraw expects a callback
with a "Message" key in the command object, `object.Message`.

###### Command Object
- **object.Cmd**: "CheckBalance" (The command.)
- **object.Amount**: The amount to be deposited. Must be a positive number.

###### Reference
`this.Par.BankAccount`


---

### Input Commands
The following Commands can be received by BankPatron.

##### Setup(com, fun)
Setup is called when BankPatron is instantiated. It sets up a stream from
standard in, waits for user input, and sends the appropriate command to
the BankAccount. Users can choose to "Check Balance", "Deposit", or "Withdraw".
If the user selects "Deposit" or "Withdraw", they are prompted to enter an
amount.

###### Parameters
- **com** (*required*): The command object.
- **fun** (*required*): The callback function.
