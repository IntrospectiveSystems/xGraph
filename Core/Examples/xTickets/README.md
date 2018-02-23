### xTickets (A System of Systems Example)

xTickets is an example of a complicated system of systems built using
the xGraph platform. xTickets consists of two systems: Tickets and
Website. The Tickets system is the ticket server, managing and saving
ticket and user data, while Website is a browser based graphical user
interface for the Tickets system.

xTickets modules come from two places: xGraph core modules, which are
fully documented and ready to use in other systems, and xTicket modules.
In this same way, you can create modules for your systems and integrate
them into systems that use xGraph Core modules. The xTickets systems
show how you can use xGraph to be creative when making your own system.
You can use xGraph to make systems that work for your unique problem!

#### Getting Started

You can run xTickets locally to see a complicated system of systems in action.
(See our
[Systems Guide](https://github.com/IntrospectiveSystems/xGraph/wiki/1.2-Systems-Guide)
for information on what an xGraph system looks like, how it works, and
how to run each system.)

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
xTickets is a system of systems, so you will have to run two systems to
run xTickets. First, you will run Tickets. Then, when Tickets has
launched, it will be listening for the Website system. Now you can run
the Website system. Finally, you can access the Website GUI by visiting
`localhost:8080/login`.

##### localhost and Google Authentication
Typically, xGraph systems can be accessed using an IP address instead of
localhost. It is only necessary to use `localhost` when accessing xTickets
because of the way Google Authentication works.

---