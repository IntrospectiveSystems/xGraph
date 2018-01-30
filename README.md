# [build-cli](https://github.com/IntrospectiveSystems/xGraph#readme) *1.0.0*



### Nexus/Plexus/Plexus.js


#### Plexus() 

The Plexus entity, the Apex and only entity of the Plexus Module.
This entity requres its Setup function called during the Setup phase of Nexus startup






##### Returns


- `Void`



#### Setup(com, fun) 

Setup the required vault variables




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| com | `Object`  |  | &nbsp; |
| fun | `Function`  |  | &nbsp; |




##### Returns


- `Void`



#### Publish(com) 

Publish a Proxy (server) to the Plexus




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| com | `Object`  |  | &nbsp; |
| com.Chan | `String`  | the channel that the server will be supporting | &nbsp; |
| com.Host | `String`  | the host that the server will be listening on | &nbsp; |




##### Returns


- `Void`



#### Subscribe(com) 

A Proxy (client) can request the data of a Proxy server




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| com | `Object`  |  | &nbsp; |
| com.Chan | `String`  | the channel that the client will be connecting to | &nbsp; |




##### Returns


- `Void`




*Documentation generated with [doxdox](https://github.com/neogeek/doxdox).*
