const { TransactionProcessor } = require('sawtooth-sdk/processor');
const WtrTransactionHandler = require('./srcs/WtrTransactionHandler');

const tprocessor = new TransactionProcessor('tcp://127.0.0.1:4004');

tprocessor.addHandler(new WtrTransactionHandler);
tprocessor.start();