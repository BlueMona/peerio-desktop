import React from 'react';
import { observer } from 'mobx-react';
import routerStore from '~/stores/router-store';
import uiStore from '~/stores/ui-store';
import { Button } from 'peer-ui';
import { t } from 'peerio-translator';
import T from '~/ui/shared-components/T';

interface NewUserProps {
    onClose: () => void;
}

@observer
export default class NewUser extends React.Component<NewUserProps> {
    goToSignup() {
        routerStore.navigateTo(routerStore.ROUTES.signup);
    }

    goToLogin = () => {
        uiStore.newUserPageOpen = false;
        routerStore.navigateTo(routerStore.ROUTES.login);
    };

    render() {
        return (
            <div className="new-user-page">
                <div className="top-bar">
                    <img src="static/img/logo-withtext-white.svg" />
                </div>
                <div className="content-parent">
                    <div className="content">
                        <T
                            k="title_newUserWelcome"
                            tag="h2"
                            className="heading"
                        />
                        <T
                            k="title_newUserWelcomeDescription"
                            tag="p"
                            className="guide-text"
                        />

                        <div className="buttons-container">
                            <Button
                                theme="affirmative"
                                onClick={this.goToSignup}
                            >
                                {t('button_CreateAccount')}
                            </Button>
                            <Button
                                theme="affirmative secondary"
                                onClick={this.goToLogin}
                            >
                                {t('button_login')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
