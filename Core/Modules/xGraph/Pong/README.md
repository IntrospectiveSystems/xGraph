# [Pong Module]:

---
#### Description

This is the Pong module. This module works with the Ping module as an
example of how multiple modules (Ping and Pong) communicate inside a
system.

An example of this system can be found in
`MultipleModules/ExampleSystems/PingPong`.

Whenever the Pong module recieves the `Ping` command, the Pong module sends
a `Pong` command to the Pong module.

---

### Module Definition Parameters

Below, the Parameters that Ping expects are defined.

- **Par.Ping** (*required*): The Pid of the Ping module.

---

### Output Commands

All the command that HelloWorld can send to other modules.

#### Cmd: 'Pong'
The `Pong` command is sent to the module referenced in `this.Par.Ping`,
ideally the Pong module.

###### Command Object
- **object.Cmd**: "Pong" (The command.)

###### Reference
`this.Par.Ping`

---

### Input Commands
The Input Commands are all the command that HelloWorld can
receive.

##### Ping(com, fun)
When Ping is received, Pong sends a `Pong` command to the module
referenced in `this.Par.Ping`.

###### Parameters
*(Pong does not expect any Parameters with a `Pong` command.)*
