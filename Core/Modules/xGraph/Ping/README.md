### Ping

v1.0

Introspective Systems

---
#### Description

This is the Ping module. This module works with the Pong module as an
example of how multiple modules (Ping and Pong) communicate inside a
system.

An example of this system can be found in `ExampleSystems/PingPong`.

When this system is run, the Ping module sends a `Ping` command to the
Pong module.

When the Ping module receives the `Pong` command, the Ping module sends
another `Ping` command to the Pong module.

---

### Module Definition Parameters

Below, the Parameters that Ping expects are defined.

- **Par.Pong** (*required*): The Pid of the Pong module.

---

### Output Commands

All the command that HelloWorld can send to other modules.

#### Cmd: 'Ping'
The `Ping` command is sent to the module referenced in `this.Par.Pong`,
ideally the Pong module.

###### Command Object
- **object.Cmd**: "Ping" (The command.)

###### Reference
`this.Par.Pong`

---

### Input Commands
The Input Commands are all the command that HelloWorld can
receive.

##### Pong(com, fun)
When Pong is received, Ping sends a `Ping` command to the module
referenced in `this.Par.Pong`.

###### Parameters
*(Pong does not expect any Parameters with a `Pong` command.)*
