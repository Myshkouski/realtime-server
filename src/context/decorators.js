const requestContextDescriptors = Object.getOwnPropertyDescriptors({
    get request() {
        return this._context.request
    },

    get method() {
        return this.request.method
    },

    get url() {
        return this.request.url
    },

    get headers() {
        return this.request.headers
    }
})

const requestDecorator = Context => {
    Object.defineProperties(Context.prototype, requestContextDescriptors)
}

export { requestDecorator as withRequest }

export const withSocket = Context => {
    Object.defineProperties(Context.prototype, Object.getOwnPropertyDescriptors({
        get socket() {
            return this._context.socket
        },

        get head() {
            return this._context.head
        }
    }))
}

export const withClient = Context => {
    Object.defineProperties(Context.prototype, Object.getOwnPropertyDescriptors({
        get websocket() {
            return this._context.websocket
        },

        get statusCode() {
            return this._context.statusCode
        },

        send(message) {
            message = this.serialize(message)
            return this.websocket.send(message)
        }
    }))
}

export const withMessage = Context => {
    Object.defineProperties(Context.prototype, Object.getOwnPropertyDescriptors({
        message: null,
        serialize() {},
        deserialize() {}
    }))
}