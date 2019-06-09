import { Socket } from 'net'
import { IncomingMessage } from 'http'
import ws from '@alexeimyshkouski/ws'

interface ContextProto {
    app: any
}

interface BroadcastContextProto {

}

interface RequestContextProto extends ContextProto {
    request: IncomingMessage
}

interface UpgradeContextProto extends RequestContextProto {
    socket: Socket
    head: Buffer
}

interface ClientContextProto extends UpgradeContextProto {
    websocket: ws.Websocket
    statusCode: number
}