# Plexus 

v1.0.0

Introspective Systems, LLC.


---
#### Plexus

The Plexus entity is the Apex and only entity of the Plexus Module.
This entity requres its Setup function invoked during the Setup phase of Nexus startup.


---

### Module Definition Parameters

Parameters are defined in the module definition and stored in this.Par.
Some are required, while some may be optional. Below, the Parameters
that Plexus expects to be defined.

***(Plexus does not require any parameters to be defined in the
config.json file.)***

---

### Output Commands

The Output Commands are all the command that Plexus can send to
other modules.

***(Plexus does not send any commands)***

---

### Input Commands
The Input Commands are all the commands that Plexus can
receive.


#### Setup(com, fun) 

Setup the required vault variables


##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| com | `Object`  |  | &nbsp; |
| fun | `Function`  |  | &nbsp; |




##### Returns


- `com`  



#### Publish(com, fun) 

Publish a Proxy (server) to the Plexus




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| com | `Object`  |  | &nbsp; |
| com.Chan | `String`  | the channel that the server will be supporting | &nbsp; |
| com.Host | `String`  | the host that the server will be listening on | &nbsp; |
| fun | `Function`  | (err, com) | &nbsp; |




##### Returns


- `com.Port`  the port that the server shall listen at



#### Subscribe(com, fun) 

A Proxy (client) can request the data of a Proxy server




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| com | `Object`  |  | &nbsp; |
| com.Chan | `String`  | the channel that the client will be connecting to | &nbsp; |
| fun | `Function`  | (err, com) | &nbsp; |




##### Returns


- `com.Host`  The host for the client to connect on
- `com.Port`  The port for the client to connet to




*Documentation generated with [doxdox](https://github.com/neogeek/doxdox).*
