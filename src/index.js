const Session = require('./etc/Session');
const MioSecurityUtils = require('./etc/MioSecurityUtils');
const {
    promptSchemas,
    prompt,
    setPrompt
} = require('./etc/promptSchemas');
const colors = require("colors/safe");

let MioLang, appDetails, logger, config;
module.exports = class MioUtils extends MioSecurity {
    constructor(_MioLang, _appDetails, _logger) {
        super(_appDetails, _logger)
        appDetails = _appDetails;
        MioLang = _MioLang;
        logger = _logger;
        config = appDetails.config.get(appDetails.domain);
        setPrompt(appDetails.uid);
    }

    prompt(_schema, message, resolve, reject) {
        function doPrompt(self){
            const schema = promptSchemas[_schema];
            if(!schema) return reject(Error(`PromptSchema "${_schema}" was not found`));
            if(schema.color && colors[schema.color]) {
                if(message) message = colors[schema.color](message);
                schema.message = colors[schema.color](schema.message);
            }

            logger.prompt(message || schema.message, schema.title, schema.color);
            prompt.start();
            prompt.get(schema, (err, result) => {
                if(err) return reject(err);
                if(schema.validate) {
                    const v = schema.validate(result);
                    if(v.invalid) return self.prompt(_schema, v.invalid, resolve, reject);
                }
                resolve(result);
            })
        }
        if(resolve && reject){
            doPrompt(this);
        } else {
            return new Promise((_resolve, _reject) => {
                resolve = _resolve;
                reject = _reject;
                doPrompt(this);
            })
        }
    }

    makeSession(keyManager){
        return new Session(this, appDetails, logger).init(keyManager)
            .then(session => {
                logger.logMadesession();
                return session;
            });
    }

    makeMioLang(session) {
        this.mio = new MioLang(session, logger, appDetails.uid).mio;
        return this.mio;
    }
}