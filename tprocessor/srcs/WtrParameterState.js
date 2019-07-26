const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const { ADMIN_PUB_KEY } = require('../config');
const { _hash, NAMESPACE } = require('./Helper');

class WtrParameterState {
    constructor (context, signer = null) {
        this.context = context;
        this.timeout = 500;
        this.signer = signer;
        this.address = _makeWtrParameterAddress(user);
    }

    getParameters() {
        return this.context.getState([this.address], this.timeout)
            .then ((values) => {
                let parameters = values[this.address];
                if (parameterss === undefined) {
                    return null;
                } else {
                    return parameters;
                }
            })
            .catch ((error) => {
                throw new InvalidTransaction(error);
            })
    }

    addParameter(param, value) {
        if (ADMIN_PUB_KEY !== this.signer)
            throw new InvalidTransaction("You are not administrator.");
        return this.getParameters().then((parametersBuf) => {
            if (null === parametersBuf)
                parametersBuf = [];
            let parameters = _deserializeParameters(parametersBuf);
            parameters[param] = value;
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
    //data.push([coins].join(''));

//    return Buffer.from(data.join(''));
}

const _deserializeParameters = (parametersBuf) => {

}

const _makeWtrParameterAddress = (x) => NAMESPACE + _hash(x);

module.exports = {
    WtrParameterState,
}