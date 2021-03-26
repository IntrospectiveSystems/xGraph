### MultipleSystem Example:

---

The MultipleSystems example shows how multiple systems can communicate
directly by assigning the BankAccount system the role of the server and
BankPatron the role of the client. The `Host` and `Port` are provided
directly in the system structure object.

1. **BankAccount** must be run first.
2. Then run **BankPatron**.

Multiple copies of the BankPatron system can be started they will all
interact with the one bank system that has been started.


To run each xGraph system, navigate to the system's directory (the
directory containg a config.json file) and type 

    xgraph run

in your terminal.

---

