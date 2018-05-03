### BankAccount

v1.1

Introspective Systems

---
#### Description

This is the BankAccount Module. This module, together with the
BankAccount and BankPatron systems, is an example of how an xGraph system
can work with another system. The BankAccount module acts as an account,
with the ability to check the balance of the account, deposit to the
account, or withdrawal from the account, by acting on the "Check Balance,
"Deposit", and "Withdraw" commands.

---

#### Module Definition Parameters

Below, the parameters that BankAccount expects are defined.

- **Par.Balance** (*optional*) The initial balance of the account.

---

#### Output Commands

(*BankAccount does not send any commands.*)


---

### Input Commands

#### Cmd: "Start"
The Start is sent to the BankAccount module when BankAccount is run in
an xGraph system. Start checks to see if there was a Balance parameter
defined for this instance. If there is no starting balance, instantiate
`this.Par.Balance` to 0.

###### Parameters
- **com** (*required*): The command object.
- **fun** (*required*): The callback function.


#### Cmd: "CheckBalance"
The `CheckBalance` command has no parameters and returns the current
account balance.

###### Parameters
- **com** (*required*): The command object.
- **fun** (*required*): The callback function.

###### Returns
- **com.Message**: A message with the current account balance.


#### Cmd: "Deposit"
The `Deposit` command takes an amount to be deposited and adds it
in the account balance.

###### Parameters
- **com** (*required*): The command object.
- **com.Amount** (*required*): The amount to be deposited. Must be a
    positive number.
- **fun** (*required*): The callback function.


#### Cmd: "Withdrawal"
The `Withdrawal` command takes an amount to be withdrawn and removes it
from the account balance.

- **com** (*required*): The command object.
- **com.Amount** (*required*): The amount to be withdrawn. Must be a
    positive number.
- **fun** (*required*): The callback function.
