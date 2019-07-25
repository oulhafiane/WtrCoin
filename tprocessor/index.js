const { TransactionProcessor } = require('sawtooth-sdk/processor');
const WtrHandler = require('./srcs/WtrHandler');

const tprocessor = new TransactionProcessor('tcp://127.0.0.1:4004');

tprocessor.addHandler(new WtrHandler());
tprocessor.start();