### Proxy v1.1.0

_Introspective Systems, LLC_

---
Proxy is a core module used to create TCP socket connections between two
modules in different systems. Proxy can operate as either a Server linked
to a specific Module within the same system, or as a Client connected to
another Proxy or other TCP connection. Then, modules can send commands
to the Proxy as if it were the destination module.

---

#### Roles
Proxy's role must be assigned in it's module definition. The Proxy's
role is set in the `Role` parameter of it's module definition.

Proxy requires different parameters depending on what role it has been
assigned.

Role | Required Parameters
--- | --- |
Client | Role, Host, Port
Server | Role, Link, Port

Here is an example of two systems using the Proxy. The first uses Proxy
as a server module, setting the `Port` and the `Link` directly. The second
uses Proxy as a client module, setting the Host and the Port directly.

The `MultipleSystems\BankAccount` system structure object. Proxy is used
here as a server.
```
{
    "Sources": {
        "xGraph": "{xGraph}"
    },
    "Modules": {
        "Bank": {
            "Module": "xGraph.BankAccount"
        },
        "BankServer": {
            "Module": "xGraph.Proxy",
            "Par": {
                "Port": 27002,
                "Role": "Server",
                "Link": "$Bank"
            }
        }
    }
}
```

The `MultipleSystems\BankPatron` system structure object. Proxy is used
here as a client.
```
{
	"Sources": {
      "xGraph": "{xGraph}"
    },
    "Modules": {
        "BankPatron": {
			"Module": "xGraph.BankPatron",
			"Par":{
				"BankAccount":"$BankServer"
			}
        },
        "BankServer": {
            "Module": "xGraph.Proxy",
            "Par": {
				"Host": "127.0.0.1",
				"Port": 27002,
				"Role": "Client",
				"Poll": true
            }
        }
    }
}
```
#### Module Definition Parameters

**Role**: _String_ - Either 'Client' or 'Server'. Determines the
                        Proxy's operation mode.

**Host**: _String_ - The URL of the server the Proxy will connect to.

**Port**: _Integer_ - The port to open as a server, or the port
                        to connect to as a client.

**Link**: _String_ - Used when proxy is a Server. A reference to the
                        module that incoming commands received over the
                        TCP connection are routed to.

#### Input Commands

Proxy will route any dispatched command other than Start or Setup to
the socket connection.

#### Output Commands

Proxy will route any command received through the socket connection to
the module defined in Par.
