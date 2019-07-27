const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const { ADMIN_PUB_KEY } = require('../config');
const { _hash, NAMESPACE } = require('./Helper');

class WtrParameterState {
    constructor (context, signer = null) {
        this.context = context;
        this.timeout = 500;
        this.signer = signer;
        this.address = _makeWtrParameterAddress('WtrParameters');
    }

    getParameters() {
        return this.context.getState([this.address], this.timeout)
            .then ((values) => {
                let parameters = values[this.address];
                if (parameters === undefined) {
                    return null;
                } else {
                    return parameters;
                }
            })
            .catch ((error) => {
                throw new InvalidTransaction(error);
            });
    }

    addParameter(param, value) {
        if (ADMIN_PUB_KEY !== this.signer)
            throw new InvalidTransaction("You are not administrator.");
        return this.getParameters().then((parametersBuf) => {
            if (null === parametersBuf)
                parametersBuf = new Map([]);
            let parameters = _deserializeParameters(parametersBuf);
            parameters.set(param, value);
            let data = _serializeParameters(parameters);
            let entries = {
                [this.address]: data
            }

            return this.context.setState(entries, this.timeout);
        });
    }
}

const _serializeParameters = (parameters) => {
    let data = [];
    for (let parameter of parameters) {
        let name = parameter[0];
        let value = parameter[1];
        data.push([name, value].join(','));
    }
    data.sort();

    return Buffer.from(data.join('|'));
}

const _deserializeParameters = (parametersBuf) => {
    let parameters = parametersBuf.toString().split('|').map(x => x.split(','));

    return new Map(parameters);
}

const _makeWtrParameterAddress = (x) => NAMESPACE + _hash(x);

module.exports = {
    WtrParameterState,
}