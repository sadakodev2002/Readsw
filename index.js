const mySecret = process.env['12345']
qrwa = null
PORT = process.env.PORT || 80 || 8080 || 3000
const qrcode = require('qrcode')
const express = require('express')
const app = express()
app.enable('trust proxy')
app.set("json spaces",2)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.all('*', async (req, res) => {
    if (qrwa) return res.type('.jpg').send(qrwa)
    res.send('QRCODE BELUM TERSEDIA. SILAHKAN REFRESH TERUS MENERUS')
})
app.listen(PORT, async() => {
    console.log(`express listen on port ${PORT}`)
})

const Pino = require("pino")
const {
    default: makeWASocket, 
    fetchLatestBaileysVersion, 
    MessageRetryMap, 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay
} = require('@adiwajshing/baileys')
const msgRetryCounterMap = MessageRetryMap || { }

const startSock = async() => {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    // fetch latest version of WA Web
    const { version, isLatest } = await fetchLatestBaileysVersion()
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)
    //Funtion agar pesan bot tidak pending 
  
const getMessage = async (key) => {
if(store) {
const msg = await store.loadMessage(key.remoteJid, key.id, undefined)
return msg?.message || undefined
}
return {
conversation: 'hallo'
}
      }
  
    const sock = makeWASocket({
        version,
        logger: Pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        getMessage,
        markOnlineOnConnect: false
        //msgRetryCounterMap
    })
    sock.ev.process(
        async(events) => {
            // sesuatu tentang koneksi berubah
            // mungkin ditutup, atau kami menerima semua pesan offline atau koneksi dibuka
            if(events['connection.update']) {
                const update = events['connection.update']
                const { connection, lastDisconnect, qr } = update
                if (qr) {
                    let qrkode = await qrcode.toDataURL(qr, { scale: 20 })
                    qrwa = Buffer.from(qrkode.split`,`[1], 'base64')
                }

                if(connection === 'open') qrwa = null
                if(connection === 'close') {
                    qrwa = null
                    if ((lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
                        await startSock()
                    } else {
                        console.log('Connection closed. You are logged out.')
                    }
                }
                console.log('connection update', update)
            }
            
            // selalu offline
            if(events['presence.update']) {
                await sock.sendPresenceUpdate('unavailable')
            }
            
            // menerima pesan baru
            if(events['messages.upsert']) {
              const upsert = events['messages.upsert']
              //console.log(JSON.stringify(upsert, '', 2))
              for (let msg of upsert.messages) {
                if (msg.key.remoteJid === 'status@broadcast') {
                    //console.log(JSON.stringify(upsert, '', 2))
                    if (msg.message?.protocolMessage) return
                    console.log(`Lihat status ${msg.pushName} ${msg.key.participant.split('@')[0]}\n`)
                    await sock.readMessages([msg.key])
                    await delay(1000)
                    return sock.readMessages([msg.key])
                }
              }
            }

            // kredensial diperbarui -- simpan
            if(events['creds.update']) {
                await saveCreds()
            }


        }
    )

    return sock
}

startSock()
process.on('uncaughtException', console.error)
