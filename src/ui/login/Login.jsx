/* eslint-disable jsx-a11y/no-static-element-interactions */
import * as telemetry from '~/telemetry';
const React = require('react');
const { Component } = require('react');
const { Button } = require('peer-ui');
const { config, socket, User, validation, warnings } = require('peerio-icebear');
const { observable, computed, when } = require('mobx');
const { observer } = require('mobx-react');
const { t } = require('peerio-translator');
const ValidatedInput = require('~/ui/shared-components/ValidatedInput');
const FullCoverLoader = require('~/ui/shared-components/FullCoverLoader');
const T = require('~/ui/shared-components/T');
const OrderedFormStore = require('~/stores/ordered-form-store');
const css = require('classnames');
const autologin = require('~/helpers/autologin');
const routerStore = require('~/stores/router-store');
const updaterStore = require('~/stores/updater-store');
const uiStore = require('~/stores/ui-store');

const PoweredByLogin = require('~/whitelabel/components/PoweredByLogin');
const SignupLink = require('~/whitelabel/components/SignupLink');
const { validators } = validation; // use common validation from core
import * as Mock from '~/ui/shared-components/MockUI';
import { MaterialIcon } from 'peer-ui';
import { clientApp } from 'peerio-icebear';

class LoginStore extends OrderedFormStore {
    @observable fieldsExpected = 2;

    // also has observables usernameValid, usernameDirty created by ValidatedInput
    @observable username = '';
    @observable passcodeOrPassphrase = '';

    // non ValidatedInput-enhanced observables
    @observable busy = true;
    @observable passwordVisible = false;
    @observable lastAuthenticatedUser = undefined;

    @computed
    get hasErrors() {
        return !(
            this.initialized && // store has its input properties
            this.usernameValid &&
            this.passcodeOrPassphraseValid && // fields ok
            socket.connected
        ); // server is available
    }
}

@observer
class Login extends Component {
    constructor() {
        super();
        this.loginStore = new LoginStore();
    }

    componentDidMount() {
        User.getLastAuthenticated().then(lastUserObject => {
            const dev = config.devAutologin;
            if (dev) {
                setTimeout(() => {
                    this.loginStore.username = dev.username;
                    this.loginStore.passcodeOrPassphrase = dev.passphrase;
                    this.loginStore.busy = false;
                }, 500);
                if (dev.autologin) {
                    setTimeout(() => this.login(true), 1000);
                }
                if (dev.navigateTo) {
                    when(
                        () =>
                            routerStore.currentRoute && routerStore.currentRoute.startsWith('/app'),
                        () => routerStore.navigateTo(dev.navigateTo)
                    );
                }
                return;
            }
            if (lastUserObject) {
                uiStore.newUserPageOpen = false;
                this.loginStore.lastAuthenticatedUser = lastUserObject;
                this.loginStore.username = lastUserObject.username;
                autologin
                    .getPassphrase(this.loginStore.username)
                    .then(passphrase => {
                        if (!passphrase) {
                            this.loginStore.busy = false;
                            return;
                        }
                        this.loginStore.passcodeOrPassphrase = passphrase;
                        if (updaterStore.lastUpdateFailed) {
                            this.loginStore.busy = false;
                            return;
                        }
                        this.login(true);
                    })
                    .catch(() => {
                        this.loginStore.busy = false;
                    });
            } else {
                this.loginStore.busy = false;
                if (uiStore.newUserPageOpen) {
                    routerStore.navigateTo(routerStore.ROUTES.newUser);
                }
            }
        });

        // For telemetry: listen for active2FARequest to determine if user has 2FA enabled
        this.twoFaReaction = when(
            () =>
                clientApp &&
                clientApp.active2FARequest &&
                clientApp.active2FARequest.type === 'login',
            () => {
                this.twoFaEnabled = true;
            }
        );

        this.startTime = Date.now();
    }

    componentWillUnmount() {
        if (!uiStore.newUserPageOpen) {
            telemetry.login.duration(this.startTime);
        }

        if (this.twoFaReaction) this.twoFaReaction();
    }

    togglePasswordVisibility = () => {
        this.loginStore.passwordVisible = !this.loginStore.passwordVisible;
        if (this.akRef) this.akRef.focus();
        telemetry.login.toggleAkVisibility(this.loginStore.passwordVisible);
    };

    unsetLastUser = () => {
        telemetry.login.changeUser();
        return User.removeLastAuthenticated().then(() => {
            this.loginStore.lastAuthenticatedUser = undefined;
            this.loginStore.username = undefined;
        });
    };

    onLoginClick = () => {
        this.login();
        telemetry.login.onLoginClick();
    };

    login = (isAutologin = false) => {
        if (this.loginStore.busy && !isAutologin) return;
        if (!isAutologin && this.loginStore.hasErrors) return;
        if (isAutologin && !socket.connected) {
            socket.onceConnected(() => this.login(true));
            return;
        }
        this.loginStore.busy = true;
        const user = new User();
        user.username = this.loginStore.username || this.loginStore.lastAuthenticatedUser.username;
        user.passphrase = this.loginStore.passcodeOrPassphrase;
        user.autologinEnabled = isAutologin;
        User.current = user;

        user.login()
            .then(() => {
                telemetry.login.loginSuccess(isAutologin, this.twoFaEnabled);
                if (!User.current.autologinEnabled) {
                    return autologin.shouldSuggestEnabling().then(suggest => {
                        if (suggest) {
                            autologin.enable();
                            autologin.dontSuggestEnablingAgain();
                        }
                        routerStore.navigateTo(routerStore.ROUTES.loading);
                    });
                }
                return routerStore.navigateTo(routerStore.ROUTES.loading);
            })
            .catch(() => {
                User.current = null;
                this.loginStore.busy = false;
                let errorMsg = 'error_wrongAK';

                // Error messages in snackbar
                if (user.blacklisted) {
                    errorMsg = 'error_accountSuspendedTitle';
                    warnings.addSevere('error_accountSuspendedText', 'error_accountSuspendedTitle');
                }
                if (user.deleted) {
                    errorMsg = 'title_accountDeleted';
                    warnings.addSevere('title_accountDeleted');
                }

                // Error message below AK input
                this.loginStore.passcodeOrPassphraseValidationMessageText = errorMsg;

                telemetry.login.loginFail();
            });
    };

    handleKeyPress = e => {
        if (e.key === 'Enter') {
            this.login();
        }
    };

    usernameHandleKeyPress = e => {
        if (e.key === '@') {
            telemetry.login.onLoginWithEmail();
        }
        this.handleKeyPress(e);
    };

    onAKRef = ref => {
        this.akRef = ref;
    };

    getWelcomeBlock = () => {
        return (
            <div className="welcome-back">
                <T k="title_welcomeBackFirstnameExclamation" tag="h2" className="heading">
                    {{
                        firstName:
                            this.loginStore.lastAuthenticatedUser.firstName ||
                            this.loginStore.lastAuthenticatedUser.username
                    }}
                </T>
                <T k="title_switchUser" tag="div" className="subtitle">
                    {{
                        username:
                            this.loginStore.lastAuthenticatedUser.firstName ||
                            this.loginStore.lastAuthenticatedUser.username,
                        switchUser: text => {
                            return (
                                <a className="clickable" onClick={this.unsetLastUser}>
                                    {text}
                                </a>
                            );
                        }
                    }}
                </T>
            </div>
        );
    };

    render() {
        return (
            <div className="login">
                <FullCoverLoader show={this.loginStore.busy} />
                <div className="mock-ui-container">
                    <div className="mock-app-ui">
                        <div className="row top">
                            <Mock.Line shade="verydark" width={1} className="tall" />
                            <Mock.Line shade="verydark" width={1} className="tall" />
                        </div>

                        <div className="row profile">
                            <Mock.Avatar />
                            <div className="profile-text">
                                <div className="lines-container">
                                    <Mock.Line shade="medium" width={3} className="tall" />
                                    <Mock.Line shade="light" width={2} />
                                    <Mock.Line shade="light" width={3} />
                                </div>

                                <div className="lines-container">
                                    <Mock.Line shade="medium" width={3} className="tall" />
                                    <Mock.Line shade="light" width={6} />
                                    <Mock.Line shade="light" width={3} />
                                </div>
                            </div>
                        </div>

                        <div className="row icons">
                            <MaterialIcon icon="star" className="gold" />
                            <MaterialIcon icon="question_answer" />
                        </div>
                    </div>
                </div>
                <div className="real-ui-container">
                    <div className="real-ui-content-container">
                        <img
                            alt="Peerio logo"
                            className="logo"
                            src="static/img/logo-withtext.svg"
                        />
                        {this.loginStore.lastAuthenticatedUser ? (
                            this.getWelcomeBlock()
                        ) : (
                            <h2 className="heading">{t('title_welcomeBackPeriod')}</h2>
                        )}
                        <PoweredByLogin />
                        <ValidatedInput
                            label={t('title_username')}
                            name="username"
                            position="0"
                            lowercase="true"
                            store={this.loginStore}
                            validator={validators.usernameLogin}
                            onKeyPress={this.usernameHandleKeyPress}
                            className={css({
                                banish: this.loginStore.lastAuthenticatedUser
                            })}
                            theme="dark"
                            telemetry={{
                                item: 'USERNAME',
                                location: 'SIGN_IN',
                                sublocation: 'SIGN_IN'
                            }}
                        />
                        <div className="password">
                            <ValidatedInput
                                type={this.loginStore.passwordVisible ? 'text' : 'password'}
                                label={t('title_AccountKey')}
                                position="1"
                                store={this.loginStore}
                                validator={validators.stringExists}
                                name="passcodeOrPassphrase"
                                onKeyPress={this.handleKeyPress}
                                ref={this.onAKRef}
                                theme="dark"
                                telemetry={{
                                    item: 'ACCOUNT_KEY',
                                    location: 'SIGN_IN',
                                    sublocation: this.loginStore.lastAuthenticatedUser
                                        ? 'WELCOME_BACK'
                                        : 'SIGN_IN'
                                }}
                            />
                            <Button
                                icon="visibility"
                                active={this.loginStore.passwordVisible}
                                tooltip={
                                    this.loginStore.passwordVisible
                                        ? t('title_hideAccountKey')
                                        : t('title_showAccountKey')
                                }
                                tooltipPosition="top"
                                onClick={this.togglePasswordVisibility}
                            />
                        </div>
                        <T k="title_whereToFind" className="find-ak" />
                        <div className="login-button-container">
                            <Button
                                label={t('button_login')}
                                onClick={this.onLoginClick}
                                disabled={this.loginStore.hasErrors}
                                theme="affirmative"
                            />
                        </div>

                        <SignupLink />
                    </div>
                </div>
            </div>
        );
    }
}

export default Login;
