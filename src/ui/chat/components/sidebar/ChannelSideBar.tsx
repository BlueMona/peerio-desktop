import React from 'react';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import css from 'classnames';

import { Button, CustomIcon, Dialog, List, ListItem } from 'peer-ui';
import { chatStore } from 'peerio-icebear';
import { t } from 'peerio-translator';

import ChatNameEditor from '~/ui/chat/components/ChatNameEditor';
import T from '~/ui/shared-components/T';
import ELEMENTS from '~/whitelabel/helpers/elements';

import MembersSection from './MembersSection';
import FilesSection from './FilesSection';

const MEMBERS = 'members';
const FILES = 'files';

interface ChannelSideBarProps {
    open: boolean;
    onAddParticipants: () => void;
}

@observer
export default class ChannelSideBar extends React.Component<ChannelSideBarProps> {
    // Switching between textarea and static text is not really needed, we could always use textarea
    // but there's some bug with chrome or react-toolbox that shifts
    // entire view up a bit if textarea renders on app start
    @observable chatPurposeEditorVisible = false;
    @observable showFiles;
    @observable openSection: 'members' | 'files' = MEMBERS;

    chatPurposeTextarea: HTMLInputElement | undefined;

    @observable deleteChannelDialogVisible;
    @action.bound
    toggleDeleteChannelDialog() {
        this.deleteChannelDialogVisible = !this.deleteChannelDialogVisible;
    }

    deleteChannel() {
        const chat = chatStore.activeChat;
        if (!chat) return;

        try {
            chat.delete();
        } catch (err) {
            console.error(err);
        }
    }

    @observable deleteChannelDescriptionVisible;
    @action.bound
    toggleDeleteChannelDescription() {
        this.deleteChannelDescriptionVisible = !this.deleteChannelDescriptionVisible;
    }

    @observable leaveChannelDialogVisible;
    @action.bound
    toggleLeaveChannelDialog() {
        this.leaveChannelDialogVisible = !this.leaveChannelDialogVisible;
    }

    @action.bound
    leaveChannel() {
        const chat = chatStore.activeChat;
        if (!chat) return;
        try {
            chat.leave().then(() => {
                this.leaveChannelDialogVisible = false;
                chatStore.switchToFirstChat();
            });
        } catch (err) {
            console.error(err);
        }
    }

    readonly showChatPurposeEditor = () => {
        if (!chatStore.activeChat.canIAdmin) return;
        this.chatPurposeEditorVisible = true;
    };
    readonly hideChatPurposeEditor = () => {
        this.chatPurposeEditorVisible = false;
    };
    readonly chatPurposeEditorRef = (ref: HTMLInputElement | null) => {
        if (ref) {
            this.chatPurposeTextarea = ref;
        }
    };

    // todo: this needs to be made smarter when we have at least one more section
    onToggleSection = section => {
        if (this.openSection === section) {
            this.openSection = null;
        } else {
            this.openSection = section;
        }
    };

    render() {
        const chat = chatStore.activeChat;
        if (!chat || !chatStore.loaded) return null;
        const { canIAdmin } = chat;
        const canILeave = ELEMENTS.channelSideBar.canILeave(chat.canILeave);
        const hasFiles = chat.recentFiles.length;

        return (
            <div className={css('chat-sidebar', { open: this.props.open })}>
                <div>
                    <div className="title">{t('title_About')}</div>
                    <div>
                        <ChatNameEditor
                            className="title-editor"
                            showLabel
                            tabIndex="-1"
                            readOnly={!canIAdmin}
                        />
                        <div onClick={this.showChatPurposeEditor}>
                            {this.chatPurposeEditorVisible ? (
                                <ChatNameEditor
                                    showLabel
                                    tabIndex="-1"
                                    purpose
                                    multiline
                                    readOnly={!canIAdmin}
                                    onBlur={this.hideChatPurposeEditor}
                                    className="purpose-editor"
                                    autoFocus
                                />
                            ) : (
                                <div className="purpose-container">
                                    {chat.purpose ? (
                                        [
                                            <T
                                                tag="div"
                                                k="title_purpose"
                                                className="purpose-label"
                                                key="1"
                                            />,
                                            <div key="2" className="purpose-text">
                                                {chat.purpose}
                                            </div>
                                        ]
                                    ) : (
                                        <T
                                            tag="div"
                                            k="title_purpose"
                                            className="purpose-label-big"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="sidebar-section">
                    <List clickable>
                        {canILeave ? (
                            <ListItem
                                className="custom-icon-hover-container"
                                disabled={chatStore.hidingChat}
                                caption={t('button_leaveChannel')}
                                onClick={this.toggleLeaveChannelDialog}
                                leftContent={<CustomIcon icon="leave" hover />}
                            />
                        ) : null}
                        {canIAdmin ? (
                            <ListItem
                                className="admin-controls delete-room"
                                leftIcon="delete"
                                caption={t('button_deleteChannel')}
                                onClick={this.toggleDeleteChannelDialog}
                            />
                        ) : null}
                    </List>
                </div>
                <MembersSection
                    onAddParticipants={this.props.onAddParticipants}
                    onToggle={() => this.onToggleSection(MEMBERS)}
                    open={this.openSection === MEMBERS}
                />
                {hasFiles ? (
                    <FilesSection
                        onToggle={() => this.onToggleSection(FILES)}
                        open={this.openSection === FILES}
                    />
                ) : null}
                <Dialog
                    active={this.deleteChannelDialogVisible}
                    title={t('title_confirmChannelDelete')}
                    actions={[
                        {
                            label: t('button_cancel'),
                            onClick: this.toggleDeleteChannelDialog
                        },
                        {
                            label: t('button_delete'),
                            onClick: this.deleteChannel
                        }
                    ]}
                    headerImage="./static/img/illustrations/dialog-delete-room.svg"
                    theme="error"
                >
                    <T k="title_actionIrreversible" />
                    <Button icon="help_outline" onClick={this.toggleDeleteChannelDescription} />
                    {this.deleteChannelDescriptionVisible ? (
                        <T k="title_deleteChannelDescription" tag="p" />
                    ) : null}
                </Dialog>
                <Dialog
                    active={this.leaveChannelDialogVisible}
                    title={t('title_confirmChannelLeave')}
                    actions={[
                        {
                            label: t('button_cancel'),
                            onClick: this.toggleLeaveChannelDialog
                        },
                        {
                            label: t('button_leave'),
                            onClick: this.leaveChannel
                        }
                    ]}
                    headerImage="./static/img/illustrations/dialog-leave-room.svg"
                >
                    <T k="title_confirmChannelLeaveDescription" />
                </Dialog>
            </div>
        );
    }
}
