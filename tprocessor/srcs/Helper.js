const { FAMILY_NAME } = require('../config');
const crypto = require('crypto');
const _hash = (x) => crypto.createHash('sha512').update(x).digest('hex').toLowerCase().substring(0, 64);
const NAMESPACE = _hash(FAMILY_NAME).substring(0, 6);
const _makeWtrAddress = (x) => NAMESPACE + _hash(x);

module.exports = {
    _hash,
    _makeWtrAddress,
    NAMESPACE
}