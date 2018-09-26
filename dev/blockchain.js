/**
 * Blockchain
 */

const sha256 = require("sha256");
const networkNodeUrl = process.argv[3];

function Blockchain() {
  this.chain = [];
  this.pendingTransactions = [];
	this currentNodeUrl = networkNodeUrl;
	this.networkNodes = [];

  this.createNewBlock(0, "0", "0");
}

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
  const newBlock = {
    hash,
    index: this.chain.length + 1,
    nonce,
    previousBlockHash,
    timestamp: Date.now(),
    transactions: this.pendingTransactions
  };

  this.pendingTransactions = [];

  this.chain.push(newBlock);

  return newBlock;
};

Blockchain.prototype.getLastBlock = function() {
  return this.chain[this.chain.length - 1];
};

Blockchain.prototype.createNewTransaction = function(
  amount,
  sender,
  recipient
) {
  const newTransaction = {
    amount,
    recipient,
    sender
  };

  this.pendingTransactions.push(newTransaction);

  return this.getLastBlock()["index"] + 1;
};

Blockchain.prototype.hashBlock = function(
  previousBlockHash,
  currentBlockData,
  nonce
) {
  return sha256(
    `${previousBlockHash}${nonce.toString()}${JSON.stringify(currentBlockData)}`
  );
};

Blockchain.prototype.proofOfWork = function(
  previousBlockHash,
  currentBlockData
) {
  let nonce = 0;
  let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

  while (hash.substring(0, 4) !== "0000") {
    nonce++;
    hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  }

  return nonce;
};

module.exports = Blockchain;
