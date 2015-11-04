'use strict'

class AbstractSelector {
    constructor() {}

    static compose() {
        throw new Error("Abstract method.")
    }

    static decompose() {
        throw new Error("Abstract method.")
    }
}

module.exports = AbstractSelector;