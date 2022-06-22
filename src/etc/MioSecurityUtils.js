const axios = require('axios');
const NodeRSA = require('node-rsa');

/* Leave these here!!! needed for runChallenge. */
const { hashElement } = require('folder-hash');
const checksum = require('checksum');
const fs = require('fs-extra');
const path = require('path');
/**/

const keyPath = path.join(require.main.filename, '../../keys');
if(!fs.existsSync(keyPath)) fs.mkdirSync(keyPath);
const packagePath = path.join(require.main.filename, '../../package.json');
const pack = require(packagePath);

let appDetails, logger, config;
module.exports = class MioSecurityUtils {
    constructor(_appDetails, _logger) {
        appDetails = _appDetails;
        logger = _logger;
        config = appDetails.config.get(appDetails.domain);
        const https = config.get('authServer.rest.https');
        const protocol = https ? 'https://' : 'http://';
        const publicConfig = {
            baseURL: `${protocol}${config.get('authServer.rest.location')}:${config.get('authServer.rest.port')}/auth`
        }
        if(config.get('authServer.rest.basicauth.public.use')){
            publicConfig.auth = {
                username: config.get('authServer.rest.basicauth.public.username'),
                password: config.get('authServer.rest.basicauth.public.password')
            }
        }
        const protectedConfig = {
            baseURL: `${protocol}${config.get('authServer.rest.location')}:${config.get('authServer.rest.port')}/admin`
        }
        if(config.get('authServer.rest.basicauth.protected.use')){
            protectedConfig.auth = {
                username: config.get('authServer.rest.basicauth.protected.username'),
                password: config.get('authServer.rest.basicauth.protected.password')
            }
        }
        this.publicAuth = axios.create(publicConfig)
        this.privateAuth = axios.create(protectedConfig)
        this.version = pack.version;
        this.npm = pack.name;
    }
    register(){
        switch (appDetails.type) {
            case 'service':
                this.publicKeyPath = path.join(keyPath, 'domain_public.pem');
                if(!fs.existsSync(this.publicKeyPath)) return this.serviceLogin(`
Service "${appDetails.uid}" is running on the "${appDetails.domain}" domain for the first time.
Please enter valid installer credentials:
                `);
                const publicKey = fs.readFileSync(this.publicKeyPath, 'utf8')
                this.publicKey = new NodeRSA(publicKey);
                return this.privateAuth.post('/challenge/service', {
                    publicKey,
                    serviceName: appDetails.uid
                })
                .then(res => {
                    logger.log('Public key is valid, now running challenge.')
                    return res.data
                });

            case 'device-iotas':
                return Promise.reject('not implemented');
            case 'device-sonoff':
                return Promise.reject('not implemented');
            default:
                return Promise.reject('not implemented');
        }
    }
    serviceLogin(message){
        return this.prompt('login', message)
            .then(result => this.privateAuth.post('/login/service', {
                username: result.username,
                password: result.password,
                serviceName: appDetails.uid,
                version: this.version,
                npm: this.npm
            }))
            .then(res => fs.writeFileSync(this.publicKeyPath, res.data))
            .then(() => logger.log(`Public key successfully saved to ${this.publicKeyPath}`))
            .then(() => this.register())
            .catch(err => {
                return this.serviceLogin(`${err.response.status}: ${err.response.data}`)
            })
    }
    getServiceToken(challengeResult){
        switch(appDetails.type) {
            case 'service':
                challengeResult = this.publicKey.encrypt(challengeResult, 'base64')
                return this.privateAuth.post('/token/service', { challengeResult, serviceName: appDetails.uid })
                    .then(res => {
                        logger.log('Challenge succesfully completed.')
                        return res.data;
                    })
        }
        return Promise.resolve(true);
    }
    runChallenge(challenge){
        challenge = this.publicKey.decryptPublic(challenge, 'utf-8');
        return eval(challenge);
    }
}