const express = require("express");
const bodyParser = require("body-parser");
const uuid = require("uuid/v1");
const rp = require("request-promise");
const port = process.argv[2];

const Blockchain = require("./blockchain");

const app = express();
const bitcoin = new Blockchain();
const nodeAddress = uuid()
  .split("-")
  .join("");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => res.send("Hello blockchain"));

// get the current blockchain
app.get("/blockchain", (req, res) => res.send(bitcoin));

// create a new transaction
app.post("/transaction", (req, res) => {
  const { amount, sender, recipient } = req.body;
  const blockIndex = bitcoin.createNewTransaction(amount, sender, recipient);

  res.json(`Transaction created successfully at block ${blockIndex}`);
});

// mine a new block
app.get("/mine", (req, res) => {
  const prevBlock = bitcoin.getLastBlock();
  const prevBlockHash = prevBlock["hash"];
  const currentBlockData = {
    transactions: bitcoin.pendingTransactions,
    index: prevBlock["index"] + 1
  };
  const nonce = bitcoin.proofOfWork(prevBlockHash, currentBlockData);
  const blockHash = bitcoin.hashBlock(prevBlockHash, currentBlockData, nonce);

  // reward the miner
  // 00 is our mining reward ID
  bitcoin.createNewTransaction(12.5, "00", nodeAddress);
  // create new block
  const newBlock = bitcoin.createNewBlock(nonce, prevBlockHash, blockHash);

  res.json({
    message: "Successfully mined new block",
    block: newBlock
  });
});

// register a new node and broadcast it to the network
app.post("/register-and-broadcast-node", (req, res) => {
  const { newNodeUrl } = req.body;
  const regNodePromises = [];

  // push new node into the network if it doesn't exist yet
  if (!bitcoin.networkNodes.includes(newNodeUrl)) {
    bitcoin.networkNodes.push(newNodeUrl);
  }

  // create requests for each current node in the network
  bitcoin.networkNodes.forEach(networkNode => {
    const requestOptions = {
      uri: `${networkNode}/register-node`,
      method: "POST",
      body: { newNodeUrl },
      json: true
    };

    regNodePromises.push(rp(requestOptions));
  });

  // make the requests for all the nodes
  // if all promises are successful we can register all current nodes with the new node
  Promise.all(regNodePromises)
    .then(data => {
      const bulkRegistrationOptions = {
        uri: `${newNodeUrl}/register-nodes-bulk`,
        method: "POST",
        body: {
          allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]
        },
        json: true
      };

      return rp(bulkRegistrationOptions);
    })
    .then(data => {
      res.json({
        note: "Success! New node successfully registered with the network",
        data
      });
    })
    .catch(err => {
      res.json({
        err,
        message: "ERROR while registering the new node in the network"
      });
    });
});

app.listen(port, () => console.log(`Listening on port: ${port}`));
