const compose = require('koa-compose')
const WebSocket = require('@alexeimyshkouski/ws')
const http = require('http')

const createContext = require('./createContext')

const debug = require('debug')('realtime:server')

const DEFAULT_UPGRADE_STATUS_CODE = 101
const DEFAULT_WS_CLOSE_CODE = 1008

const DEFAULT_OPTIONS = {
    perMessageDeflate: {
        zlibDeflateOptions: {
            chunkSize: 1024,
            memLevel: 7,
            level: 3,
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },

        // Other options settable:
        // Defaults to negotiated value.
        clientNoContextTakeover: true,
        // Defaults to negotiated value.
        serverNoContextTakeover: true,
        // Defaults to negotiated value.
        clientMaxWindowBits: 10,
        // Defaults to negotiated value.
        serverMaxWindowBits: 10,

        // Below options specified as default values.
        // Limits zlib concurrency for perf.
        concurrencyLimit: 10,
        // Size (in bytes) below which messages
        // should not be compressed.
        threshold: 1024,
    }
}

const FORCED_OPTIONS = {
    noServer: true
}

function serialize(message) {
    if (Buffer.isBuffer(message)) {
        return message
    }

    const typeOfMessage = typeof message

    if (typeOfMessage === 'string') {
        return message
    }

    if (typeOfMessage === 'object') {
        return JSON.stringify(message)
    }

    throw new TypeError('Cannot stringify message of type "' + typeOfMessage + '"')
}

async function _handleUpgrade(req, socket, head, extensions, headers) {
    const ctx = createContext({
        app: this,
        req,
        socket,
        head,
        extensions,
        statusCode: DEFAULT_UPGRADE_STATUS_CODE
    })

    try {
        await this._composedUpgradeMiddleware(ctx)
    } catch (error) {
        this.emit('error', error)
    }

    this.completeUpgrade(req, socket, head, extensions, headers)

    return ctx
}

async function _handleMessage(websocket, req, socket, head, extensions, headers, message) {
    const ctx = createContext({
        app: this,
        message,
        websocket,
        req,
        socket,
        statusCode: DEFAULT_WS_CLOSE_CODE,
        serialize,
        send(message) {
            message = this.serialize(message)
            websocket.send(message)
        },
        publish(message) {
            message = this.serialize(message)

            for (let websocket of this.app.clients) {
                if (websocket !== this.websocket) {
                    websocket.send(message)
                }
            }
        }
    })

    try {
        await this._composedMessageMiddleware(ctx)
    } catch (error) {
        this.emit('error', error)
    }

    // if (ctx.statusCode === DEFAULT_WS_STATUS_CODE) {
    //   ctx.websocket.close(ctx.statusCode, ctx.status)
    // }

    return ctx
}

function _handleError(websocket, error) {
    websocket.terminate()
    // this.emit('error', error)
}

class WebsocketServer extends WebSocket.Server {
    constructor(options = {}) {
        super(Object.assign({}, DEFAULT_OPTIONS, options, FORCED_OPTIONS))

        const upgradeMiddleware = []
        this._upgradeMiddleware = upgradeMiddleware
        this._composedUpgradeMiddleware = compose(upgradeMiddleware)
        this._isUpgradeMiddlewareUsed = false

        const messageMiddleware = []
        this._messageMiddleware = messageMiddleware
        this._composedMessageMiddleware = compose(messageMiddleware)

        const broadcastMiddleware = []
        this._broadcastMiddleware = broadcastMiddleware
        this._composedBroadcastMiddleware = compose(broadcastMiddleware)

        this
            .on('upgrade', _handleUpgrade.bind(this))
            .on('connection', (websocket, req, socket, head, extensions, headers) => {
                websocket
                    .on('message', _handleMessage.bind(this, websocket, req, socket, head, extensions, headers))
                    .once('error', _handleError.bind(this, websocket))
            })
    }

    upgrade(fn) {
        if (this._isUpgradeMiddlewareUsed) {
            throw new Error('Upgrade middleware should be used before message middlewares')
        }

        const upgradeMiddleware = this._upgradeMiddleware
        upgradeMiddleware.push(fn.bind(this))
        this._composedUpgradeMiddleware = compose(upgradeMiddleware)

        debug('defined upgrade middleware')

        return this
    }

    message(fn) {
        this._isUpgradeMiddlewareUsed = true

        const _messageMiddleware = this._messageMiddleware
        _messageMiddleware.push(fn.bind(this))
        this._composedMessageMiddleware = compose(_messageMiddleware)

        debug('defined message middleware')

        return this
    }

    broadcast(fn) {
        const _broadcastMiddleware = this._broadcastMiddleware
        _broadcastMiddleware.push(fn.bind(this))
        this._composedBroadcastMiddleware = compose(_broadcastMiddleware)

        debug('defined broadcast middleware')

        return this
    }

    async publish(message) {
        const ctx = createContext({
            app: this,
            message,
            serialize,
            publish(message) {
                message = this.serialize(message)
                for (const websocket of this.app.clients) {
                    websocket.send(message)
                }
            }
        })

        return await this._composedBroadcastMiddleware(ctx)
    }

    callback() {
        // no callback passed to ws server, instead it emits 'upgrade' event
        return this.handleUpgrade.bind(this)
    }

    listen(...args) {
        const server = http.createServer()

        server.on('upgrade', this.callback())

        server.listen(...args)

        return server
    }
}

module.exports = WebsocketServer