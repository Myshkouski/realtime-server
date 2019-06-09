import { withRequest, withSocket, withClient } from './decorators'
import { ContextError, AssertionError } from './errors.js'
// const INSPECT_SYMBOL = Symbol.for('nodejs.util.inspect.custom')

class Context {
    constructor(proto) {
        this._context = proto
    }

    assert(condition, code, message) {
        if (!condition) {
            this.throw(new AssertionError(code, message))
        }
    }

    ['throw'](err) {
        if (err instanceof ContextError) {
            throw err
        }

        const { code, message } = err

        throw new ContextError(code, message)
    }
}

@withRequest
@withSocket
export class UpgradeContext extends Context { }

@withRequest
@withSocket
@withClient
export class ClientContext extends Context { }
