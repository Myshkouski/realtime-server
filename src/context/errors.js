export class ContextError extends Error {
    constructor(code, message) {
        super(message)
        this.code = code
    }
}

export class AssertionError extends ContextError {
    constructor(code, message) {
        super(code, 'Assertion failed' + message ? ': ' + message : '')
    }
}