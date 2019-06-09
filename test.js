const RealtimeServer = require('.')

const realtimeServer = new RealtimeServer()

realtimeServer
    .message(ctx => {
        ctx.send(`echo: ${ ctx.message }`)
    })
    .broadcast(ctx => {
        ctx.publish(ctx.message)
    })

setInterval(() => {
    realtimeServer.publish('test')
}, 5000)

realtimeServer.on('error', console.error)

realtimeServer.listen(8008)