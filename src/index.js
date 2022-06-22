const mqtt = require('mqtt');
const MioLang = require('@mio-core/miolang');
const MioUtils = require('./etc/MioUtils');

let appDetails, logger, config;
module.exports = class MioService extends MioUtils {
    constructor(_appDetails, _logger, _MioLang = MioLang){
        super(_MioLang, _appDetails, _logger);
        appDetails = _appDetails;
        logger = _logger;
        config = appDetails.config.get(appDetails.domain);
        this.thisModuleName = appDetails.thisModuleName;
        this.thisLocation = appDetails.thisLocation;
        this.thisServiceType = appDetails.thisServiceType

    }
    init(keyManager){
        return this.makeSession(keyManager)
            .then(session => {
                this.internalApi = session.internalApi.api;
                this.externalApi = session.externalApi;
                if(keyManager) {
                    keyManager.mio = this;
                }
                return this;
            })
    }
    connectMqtt(data){
        const { user, token } = data;
        logger.log('Connecting MQTT client to broker.')
        switch(appDetails.type) {
            case 'service':
                return this.connectMqttService(user, token);
            case 'device-iotas':
                return Promise.reject('not implemented');
            case 'device-sonoff':
                return Promise.reject('not implemented');
            default:
                return Promise.reject('not implemented');
        }
    }
    connectMqttService(user, token){
        return this.makeClient(
            config.get('mqttBroker.tcp'),
            user.credentials.username,
            appDetails.uid,
            token
        );
    }
    
    makeClient(location, username, clientId, token) {
        return new Promise((resolve, reject) => {
            const client = mqtt.connect(location, {
                username,
                clientId,
                password: token,
                protocolVersion: 5
            });
            client.on('connect', () => {
                logger.log('mqtt connected');
                resolve(client);
            })
            client.on('error', err => {
                logger.log(err.message);
            })
            this.mio.init(client);
        })               
    }

    publishPermissions() {
        return new Promise((resolve, reject) => {
            this.mio.create('miocore-auth.permissions.addPermissions', [this.externalApi]).then(() => {
                console.log('hello');
                resolve();
            })           
        })
    }
}