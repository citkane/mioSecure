module.exports = class ExternalInterface  {
    constructor(contexts){
        this.interface = {};
        contexts.forEach(key => {
            this.interface[key] = {
                create: {},
                read: {},
                update: {},
                delete: {}
            }
        })
    }
}