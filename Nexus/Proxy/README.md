# Proxy v1.0.0

_Introspective Systems, LLC_

---
Proxy is a core module used to create TCP socket connections between two modules in different systems. Can 
operate as either a Server linked to a specific Module within the same system, or as a Client connected to another Proxy
or other TCP connection. Modules send commands to the Proxy as if it were the destination module without requiring 
additional parameters.

Proxy can be setup to connect directly to another Proxy or TCP socket, or by linking through the Plexus Module. To connect
through a Plexus simply set the Plexus Parameter to the name of the Plexus server

---
Proxy requires different parameters depending on what role it has been defined.

#### Roles
Role | Required Parameters
--- | --- |
Client | Role, Host, Port
Server | Role, Link, Port


### Parameters

**Role**: _String_ - Set to either 'Client' or 'Server'. Determines the Proxy's operation mode.

**Host**: _String_ - Set to the URL of the server the Proxy will connect to.

**Port**: _Integer_ - Set to the port to open as a server, or the port to connect to as a client.

**Link**: _String_ - Used in Server mode to route incoming commands received over the TCP connection to another module in the system.

**Plexus** _String_ - 
### Input Commands

Proxy will route any dispatched command other than Start or Setup to the socket connection.

### Output Commands

Proxy will route any command received through the socket connection to the module defined in Par.