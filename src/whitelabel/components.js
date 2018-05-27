const config = require('~/config');

let UserSearchError = require('~/ui/shared-components/UserSearchError');
let SignupLink = require('~/ui/login/SignupLink');
let Copyright = require('~/ui/settings/components/Copyright');
let PoweredBy = require('~/ui/login/PoweredBy');

// All whitelabels
if (config.whiteLabel.name) {
    Copyright = require('~/ui/settings/components/Copyright_WL');
    PoweredBy = require('~/ui/login/PoweredBy_WL');
}

// Medcryptor
if (config.appLabel === 'medcryptor') {
    UserSearchError = require('~/ui/shared-components/UserSearchError_medcryptor');
    SignupLink = require('~/ui/login/SignupLink_medcryptor');
}

module.exports = {
    UserSearchError,
    SignupLink,
    Copyright,
    PoweredBy
};
