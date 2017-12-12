# Perceptron 

v1.0.0

Introspective Systems, LLC.


---
#### Perceptron

The Perceptron entity is the Apex and only entity of the Perceptron Module. This entity requres its Setup function invoked during the Setup phase of Nexus startup.

The main capability of this entity is to initialize and work with a neataptic.js perceptron network. 

---

### Module Definition Parameters

Parameters are defined in the module definition and stored in the Par attribute 
of the Entities this attribute.
Some are required, while some are optional. Below, the Parameters
that Perceptron expects to be defined.

Three Pars can be set in the module definition, but they are all optional. 


`{"InitializeOnSetup":"Boolean"}` - where the Boolean, if set to true calls the initialize command during the Setup Phase. 

`{"TrainingSetSize":"Integer"}` - where the Integer defines the number of I/O sets in the training set.

`{"NetworkDimensions":["Integer", "Integer", "Integer"]}` - where Integer is replaced by an integer, the first in the array defines the number of input variables, the last defines the number of output variables, and the others define the number of nodes in each inner layer. (ex. [3,4,4,1] defines a neural network with 3 input variables, 2 layers of 4 nodes each (these are the hidden layers) and 1 output variable)

An example of how this looks in the module definition of a config.json
``` json
{
  "Perceptron": {
    "Module": "xGraph:Perceptron",
    "Source": "xGraph",
    "Par": {
      "NetworkDimensions": [2,3,4,4,2],
      "TrainingSetSize": 2000,
      "InitializeOnSetup": true
    }
  }
}
```

---

### Output Commands

None

---

### Input Commands
The Input Commands are all the commands that Perceptron can
receive.

Initialize the neural network.

Example: 

```json
{
  "Cmd": "Initialize"
}
```

Train the neural network.

Example:

```json
{
 "Cmd": "Train", 
 "Input": [0,1],
 "Output": [1]
}
```

Evaluate an input.

Example:

```json
{
 "Cmd": "Evaluate",
 "Input": [0,0]
}
```
