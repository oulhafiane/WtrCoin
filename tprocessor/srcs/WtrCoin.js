const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const { MINTER_PUB_KEY } = require('../config');
const { _hash, NAMESPACE } = require('./Helper');

class WtrCoin {
    constructor (context, user, signer = null) {
        this.context = context;
        this.timeout = 500;
        this.signer = signer;
        this.user = user;
        this.address = _makeWtrCoinAddress(user);
    }

    getBalance() {
        return this.context.getState([this.address], this.timeout)
            .then ((values) => {
                let coins = values[this.address];
                console.log("testing coins : " + this.address + " => " + coins);
                if (coins === undefined) {
                    return 0;
                } else {
                    console.log("User : " + this.user + " => " + coins);
                    return coins;
                }
            })
            .catch ((error) => {
                throw new InvalidTransaction(error);
            })
    }

    mintWtrCoin(coinsToDeposit) {
        if (MINTER_PUB_KEY !== this.signer)
            throw new InvalidTransaction("You are not the minter, you are " + this.signer);
        return this.getBalance().then((coins) => {
            if (isNaN(coins))
                console.log("mint coins : " + coins);
            else
                console.log("okk ye");
            return ;
            let newCoins = parseInt(coinsToDeposit) + parseInt(coins);
            let data = _serializeCoins(newCoins.toString());
            let entries = {
                [this.address]: data
            }

            return this.context.setState(entries, this.timeout);
        });
    }
}

const _serializeCoins = (coins) => {
    let data = [];
    data.push([coins].join(''));

    return Buffer.from(data.join(''));
}

const _makeWtrCoinAddress = (x) => NAMESPACE + _hash(x);

module.exports = {
    WtrCoin,
    _serializeCoins
}