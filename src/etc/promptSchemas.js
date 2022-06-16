const prompt = require('prompt');
const colors = require("colors/safe");

function setPrompt(uid){
    prompt.message = colors.white.bold(`${uid} > `);
}
const promptSchemas = {
    createUser: {
        properties: {
            username:{
                message: colors.yellow('Your desired username'),
                required: true                
            },
            firstname: {
                message: colors.yellow('Your first Name'),
                required: true
            },
            lastname: {
                message: colors.yellow('Your last Name'),
                required: true
            },
            email: {
                message: colors.yellow('Your email'),
                required: true
            },
            emailconfirm: {
                message: colors.yellow('Confirm your email'),
                required: true
            },
            password: {
                message: colors.yellow('Please create a password'),
                required: true,
                hidden: true,
                replace: '*'
            },
            confirmation: {
                message: colors.yellow('Please confirm your password'),
                required: true,
                hidden: true,
                replace: '*'
            }
        },
        validate(result){
            const invalid = [];
            if(result.password !== result.confirmation) invalid.push('Passwords do not match, try again');
            if(result.email !== result.emailconfirm) invalid.push('Emails do not match, try again');
            if(invalid.length) return {
                invalid: invalid.join('\n')
            }
            return true;
        },
        title: 'POC security hook point',
        color: 'yellow'
    },
    login: {
        properties: {
            username: {
                message: colors.yellow('Please enter your registered username or email'),
                required: true
            },
            password: {
                message: colors.yellow('Please enter your password'),
                required: true,
                hidden: true,
                replace: '*'
            }
        },
        message: `
Credentials required to start a service
        `,
        title: 'POC security hook point',
        color: 'yellow'
    } 
}
module.exports = {
    promptSchemas,
    prompt,
    setPrompt
}