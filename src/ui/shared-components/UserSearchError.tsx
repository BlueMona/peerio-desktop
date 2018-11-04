import React from 'react';
import { observer } from 'mobx-react';

import T from '~/ui/shared-components/T';
import { t } from 'peerio-translator';
import { Button, MaterialIcon } from 'peer-ui';

interface UserSearchErrorProps {
    onInvite: () => void;
    userAlreadyAdded?: boolean;
    userNotFound?: boolean;
    suggestInviteEmail?: boolean;
}

@observer
export default class UserSearchError extends React.Component<UserSearchErrorProps> {
    invite = () => {
        this.props.onInvite();
    };

    render() {
        return (
            <div className="user-search-error">
                <div className="search-error-text">
                    <MaterialIcon icon="help_outline" />
                    {this.props.userAlreadyAdded ? (
                        <T k="error_userAlreadyAdded" tag="div">
                            {{ user: this.props.userAlreadyAdded }}
                        </T>
                    ) : null}
                    {this.props.userNotFound ? (
                        <T k="error_userNotFoundTryEmail" tag="div">
                            {{ user: this.props.userNotFound }}
                        </T>
                    ) : null}
                    {this.props.suggestInviteEmail ? (
                        <T k="title_inviteContactByEmail">
                            {{ email: this.props.suggestInviteEmail }}
                        </T>
                    ) : null}
                </div>
                {this.props.suggestInviteEmail ? (
                    <Button onClick={this.invite} label={t('button_invite')} />
                ) : null}
            </div>
        );
    }
}
