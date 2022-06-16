let mioConnect, logger, config;
module.exports = class Session {
    constructor(_mioConnect, appDetails, _logger) {
        mioConnect = _mioConnect;
        logger = _logger;
        config = appDetails.config.get(appDetails.domain);
        this.internalApi = new appDetails.InternalApi(logger, config);
        this.externalApi = new appDetails.ExternalApi(this.internalApi.api).interface;
    }

    init(keyManager) {
        const mio = mioConnect.makeMioLang(this); 
        return this.internalApi.init(mio, keyManager).then(() => this);
    }
};