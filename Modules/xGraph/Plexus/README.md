# Plexus

v1.0.0

Introspective Systems, LLC.


---
#### Plexus

Plexus is a dynamic router that routes connections, and assigns the
port to servers requesting publication. Plexus registers a server with a
channel name and host, and assigns that server a port. Plexus handles
connection requests by channel name.



---

#### Module Definition Parameters

Plexus has the following module definition parameters.

***(Plexus does not require any parameters to be defined in the
config.json file.)***

---

#### Output Commands

The Output Commands are all the command that Plexus can send to
other modules.

*(Plexus does not send any commands.)*

---

#### Input Commands
The Input Commands are all the commands that Plexus can
receive.


##### Setup(com, fun)

Setup the required vault variables


###### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| com | `Object`  |  | &nbsp; |
| fun | `Function`  |  | &nbsp; |




###### Returns


- `com`  



##### Publish(com, fun)

Publish a Proxy (server) to the Plexus




###### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| com | `Object`  |  | &nbsp; |
| com.Chan | `String`  | the channel that the server will be supporting | &nbsp; |
| com.Host | `String`  | the host that the server will be listening on | &nbsp; |
| fun | `Function`  | (err, com) | &nbsp; |




###### Returns


- `com.Port`  the port that the server shall listen at



##### Subscribe(com, fun)

A Proxy (client) can request the data of a Proxy server




###### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| com | `Object`  |  | &nbsp; |
| com.Chan | `String`  | the channel that the client will be connecting to | &nbsp; |
| fun | `Function`  | (err, com) | &nbsp; |




###### Returns


- `com.Host`  The host for the client to connect on
- `com.Port`  The port for the client to connect to
