### MultipleSystemsWithPlexus Example

---

The MultipleSystemsWithPlexus example consists of three separate systems
that communicate and work together. Plexus serves as a dynamic router,
BankAccount manages the account and acts as a backend. BankPatron provides
a textual user interface for accessing the BankAccount.

This example shows how multiple systems can communicate through a Plexus,
a dynamic router module. Plexus waits for a server request, from BankAccount,
and creates a channel for communication. BankPatron can then communicate
with BankAccount through the proxy by the channel name.

1. The **Plexus** system should be run first.
2. Then the **BankAccount** system.
3. Lastly, run the **BankPatron** system.

Multiple copies of the BankPatron system can be started they will all
interact with the one BankAccount system that has been started and
registered with the plexus.


To run each xGraph system, navigate to the system's directory (the
directory containg a config.json file) and type 

    xgraph run

in your terminal.

---