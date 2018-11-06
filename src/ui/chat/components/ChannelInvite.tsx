import React from 'react';
import { action, observable, reaction, IReactionDisposer } from 'mobx';
import { observer } from 'mobx-react';
import css from 'classnames';

import { chatStore, chatInviteStore, contactStore, User } from 'peerio-icebear';
import { t } from 'peerio-translator';
import { ProgressBar, Button, Divider } from 'peer-ui';

import T from '~/ui/shared-components/T';
import AvatarWithPopup from '~/ui/contact/components/AvatarWithPopup';
import EmojiImage from '~/ui/emoji/Image';
import routerStore from '~/stores/router-store';

const urls = require('~/config').default.translator.urlMap;

interface ChannelInviteProps {
    className?: string; // TODO: audit -- isn't this component only mounted on the root? never receives this prop...
}

@observer
export default class ChannelInvite extends React.Component<ChannelInviteProps> {
    readonly maxAvatars = 4;
    readonly maxParticipants = 6;

    @observable inProgress = false;
    disposer!: IReactionDisposer;

    componentDidMount() {
        // TODO: refactor when better server/sdk support for room invites
        this.disposer = reaction(
            () => !chatStore.chats.length && !chatInviteStore.received.length,
            () => {
                routerStore.navigateTo(routerStore.ROUTES.chats);
            }
        );
    }

    componentWillUnmount() {
        this.disposer();
    }

    @action.bound
    async acceptInvite() {
        const kegDbId = chatInviteStore.activeInvite.kegDbId;
        chatInviteStore.deactivateInvite();
        this.inProgress = true;
        try {
            await chatInviteStore.acceptInvite(kegDbId);
            routerStore.navigateTo(routerStore.ROUTES.chats);
        } catch (e) {
            console.error(e);
        }
        this.inProgress = false;
    }

    @action.bound
    rejectInvite() {
        chatInviteStore.rejectInvite(chatInviteStore.activeInvite.kegDbId);
    }

    toUpgrade() {
        return window.open(urls.upgrade);
    }

    get declineControl() {
        return (
            <div className={css('channel-invite', this.props.className)}>
                <div className="invite-content decline-content">
                    <EmojiImage emoji="v" size="large" />
                    <div className="text">
                        {t('title_userOut', { name: User.current.username })}
                    </div>
                </div>
            </div>
        );
    }

    get renderParticipants() {
        const { channelName, participants, username } = chatInviteStore.activeInvite;
        if (!username) return null;

        const participantsToShow: JSX.Element[] = [
            // First avatar is always the person who sent the invite
            <div className="admin" key={username}>
                <AvatarWithPopup contact={contactStore.getContact(username)} tooltip />
                <T k="title_admin" className="badge" />
            </div>
        ];

        for (
            let i = 0;
            i < participants.length && participantsToShow.length < this.maxAvatars;
            i++
        ) {
            const participant = participants[i];

            if (participant !== username && participant !== User.current.username) {
                participantsToShow.push(
                    <AvatarWithPopup
                        key={participant}
                        contact={contactStore.getContact(participant)}
                        tooltip
                    />
                );
            }
        }

        return (
            <div className="participant-list">
                <span>
                    <T k="title_whoIsInRoom" className="already-in-room" tag="span">
                        {{ roomName: channelName }}
                    </T>
                </span>
                <div className="avatars">
                    {participantsToShow}
                    {participants.length > this.maxParticipants ? (
                        <div className="more-participants">
                            +{participants.length - this.maxParticipants}
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    render() {
        if (chatInviteStore.activeInvite && chatInviteStore.activeInvite.declined)
            return this.declineControl;
        if (this.inProgress) return <ProgressBar />;
        const { activeInvite } = chatInviteStore;
        if (!activeInvite) return null;
        const { channelName } = activeInvite;

        return (
            <div className={css('channel-invite', this.props.className)}>
                <div className="invite-content">
                    <img src="./static/img/illustrations/room-invite.svg" />
                    <div className="text">
                        <T k="title_roomInviteTitle">{{ roomName: channelName }}</T>
                    </div>
                </div>

                {User.current.channelsLeft > 0 ? (
                    <div className="participants">
                        <Divider />
                        {this.renderParticipants}
                    </div>
                ) : null}

                {User.current.channelsLeft > 0 ? (
                    <div className="buttons">
                        <Button label={t('button_declineInvite')} onClick={this.rejectInvite} />
                        <Button
                            label={t('button_joinRoom')}
                            theme="affirmative"
                            onClick={this.acceptInvite}
                        />
                    </div>
                ) : (
                    <div className="upgrade-prompt">
                        <div className="upgrade-content">
                            <span className="upgrade-text">
                                👋 <T k="title_roomInviteUpgradeNotice" tag="span" />
                            </span>
                            <Button label={t('button_upgrade')} onClick={this.toUpgrade} />
                        </div>
                        <Button
                            label={t('button_declineInvite')}
                            theme="affirmative secondary"
                            onClick={this.rejectInvite}
                        />
                    </div>
                )}
            </div>
        );
    }
}
