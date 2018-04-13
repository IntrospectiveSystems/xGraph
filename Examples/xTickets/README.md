### xTickets
#### A System of Systems Example

xTickets is an example of a system of systems built using the xGraph
platform. *For an example of a simple system, see the HelloWorld
example system, `.\Examples\HelloWorld\`.*

xTickets is an example of an application that consists of a backend
system and a frontend system. xTickets shows how you can build a fully
functional application using the xGraph platform.

xTickets consists of two systems, Tickets (`.\Examples\xTickets\Systems\Tickets\`)
and Website (`.\Examples\xTickets\Systems\Website\`). The Tickets system
is the ticket server (or backend), which manages and saves ticket and
user data. The Website system is a browser based graphical user
interface (or frontend) for the Tickets system, which allows users to
view tickets, interact with current tickets, and create new tickets.

##### Custom Built Modules

When you are building a solution using the xGraph platform, it is likely
that you will want to create modules that are unique to your problem.
The xTickets systems are built using custom modules, found in
`.\Examples\xTickets\Modules\`, which are built specifically for the
xTickets system, as well as xGraph core modules, found in `.\Modules\`.

Just like we have done in xTickets, you can create modules for your
systems and integrate them into systems that use xGraph Core modules
the same way the xTickets system is built. Be creative when making your
own system. You can use xGraph to make systems that work for your
unique problem!


#### Getting Started

##### Google Authentification
Before using xTickets, you must register your app to get Google OAuth
credentials. Everything you need to do this can be found in the
[Before You Begin](https://developers.google.com/identity/sign-in/web/sign-in#before_you_begin)
section of Google's "Integrating Google Sign-In into your web app" site.
1. First, click on the "Configure A Project" button.
2. Select or create a project.
3. Next, it will ask you where you are calling from. Here, select `Web browser`.
4. Finally, it will ask for the Authorized Javascript Origin. Here, you
can enter `http://localhost:8080`.

Once you have your credentials, you will have to add them to the Tickets'
system structure file, `Tickets\config.json`. These are saved in the
`Google` module definition, with the key's `ClientID` and `ClientSecret`,
respectively.

Once this is in place, you are all set to run your systems.

##### Running Systems of Systems

*See our
[Systems Guide](https://github.com/IntrospectiveSystems/xGraph/wiki/1.2-Systems-Guide)
for information on what an xGraph system looks like, how it works, and
how to run each system.*

You can run xTickets locally to see a system of systems in action.
Because it is a system of systems, you will have to run two systems to
run the full xTickets application.

First, run the Tickets system. If you are in the the root directory,
you can run the system by running this command:

```
xgraph reset --cwd ./Examples/xTickets/Systems/Tickets/ --local ./Examples/xTickets/Modules/ --Core ./Modules/
```

Now the Tickets system is waiting for the Website system to launch.

Next, run the Website system. If you are in the root directory, you can
run the Website system by running this command:

```
xgraph reset --cwd ./Examples/xTickets/Systems/Website/ --local ./Examples/xTickets/Modules/ --Core ./Modules/
```

Now you can access the Website system, a browser based GUI, by visiting
`localhost:8080/login`.

##### localhost and Google Authentication
Typically, xGraph systems can be accessed using an IP address instead of
localhost. It is only necessary to use `localhost` when accessing xTickets
because of the way Google Authentication works.

---
