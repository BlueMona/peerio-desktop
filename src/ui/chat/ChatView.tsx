import React from 'react';
import { action, computed, observable, reaction, when, IReactionDisposer } from 'mobx';
import { observer } from 'mobx-react';
import css from 'classnames';
import { DropTarget } from 'react-dnd';

import { Button, CustomIcon, Dialog, MaterialIcon, ProgressBar, Tooltip } from 'peer-ui';
import { chatStore, chatInviteStore, t } from 'peerio-icebear';
import { Contact, Chat } from 'peerio-icebear/dist/models';

import config from '~/config';
import routerStore from '~/stores/router-store';
import sounds from '~/helpers/sounds';
import DragDropTypes from '../files/helpers/dragDropTypes';
import uiStore from '~/stores/ui-store';
import beaconStore from '~/stores/beacon-store';

import UserPicker from '~/ui/shared-components/UserPicker';
import FullCoverLoader from '~/ui/shared-components/FullCoverLoader';
import ELEMENTS from '~/whitelabel/helpers/elements';
import ZeroChats from '~/whitelabel/components/ZeroChats';
import Beacon from '~/ui/shared-components/Beacon';
import UploadDialog from '~/ui/shared-components/UploadDialog';

import MessageInput from './components/MessageInput';
import MessageList from './components/MessageList';
import MessageSideBar from './components/sidebar/MessageSideBar';
import ChatSideBar from './components/sidebar/ChatSideBar';
import ChannelSideBar from './components/sidebar/ChannelSideBar';
import ChatNameEditor from './components/ChatNameEditor';
import ShareToChatProgress from './components/ShareToChatProgress';
import PendingDM from './components/PendingDM';

@observer
export default class ChatView extends React.Component {
    reactionsToDispose!: IReactionDisposer[];

    @observable.ref filesToShare: string[] | null = null;

    @observable showUserPicker = false;

    componentDidMount() {
        this.reactionsToDispose = [
            reaction(
                () => chatStore.activeChat,
                () => {
                    this.showUserPicker = false;
                }
            ),
            when(
                () => chatStore.activeChat && chatStore.activeChat.recentFiles.length > 0,
                () => {
                    beaconStore.addBeacons('infoPanel_desktop');
                }
            )
        ];

        if (chatInviteStore.activeInvite) {
            routerStore.navigateTo(routerStore.ROUTES.channelInvite);
        }

        ELEMENTS.chatView.checkActiveSpace();

        if (!chatStore.chats.length && !chatInviteStore.received.length) {
            beaconStore.addBeacons('startChat');
        }

        if (chatStore.directMessages.length > config.beacons.dmCountPinPrompt) {
            beaconStore.addBeacons('pin_desktop');
        }
    }

    componentWillUnmount() {
        this.reactionsToDispose.forEach(dispose => dispose());
        beaconStore.clearBeacons();
    }

    @action.bound
    setFilesToShare(files: string[]) {
        this.filesToShare = files;
    }

    @action.bound
    cancelShare() {
        this.filesToShare = null;
    }

    addParticipants = (contacts: Contact[]) => {
        chatStore.activeChat.addParticipants(contacts);
        this.closeUserPicker();
    };

    static playErrorSound() {
        if (uiStore.prefs.errorSoundsEnabled) sounds.destroy.play();
    }

    @action.bound
    openUserPicker() {
        this.showUserPicker = true;
    }

    @action.bound
    closeUserPicker() {
        this.showUserPicker = false;
    }

    @action.bound
    toggleSidebar() {
        uiStore.prefs.chatSideBarIsOpen = !uiStore.prefs.chatSideBarIsOpen;
        uiStore.selectedMessage = null;
    }

    get sidebar() {
        if (!chatStore.activeChat) return null;
        if (uiStore.selectedMessage) {
            return <MessageSideBar />;
        }
        return chatStore.activeChat.isChannel ? (
            <ChannelSideBar
                open={uiStore.prefs.chatSideBarIsOpen}
                onAddParticipants={this.openUserPicker}
            />
        ) : (
            <ChatSideBar open={uiStore.prefs.chatSideBarIsOpen} />
        );
    }

    render() {
        if (!chatStore.chats.length && !chatInviteStore.received.length) {
            return <ZeroChats />;
        }

        const chat = chatStore.activeChat;
        if (!chat) return null;

        if (chat.isInvite) {
            return <PendingDM />;
        }

        return (
            <>
                <div className="message-view">
                    <ChatHeader
                        chat={chat}
                        toggleSidebar={this.toggleSidebar}
                        sidebarIsOpen={uiStore.prefs.chatSideBarIsOpen}
                    />
                    <div className="messages-and-sidebar-container">
                        {this.showUserPicker ? (
                            <div className="create-new-chat">
                                <UserPicker
                                    className="add-users-to-room"
                                    closeable
                                    onClose={this.closeUserPicker}
                                    onAccept={this.addParticipants}
                                    exceptContacts={chat.allParticipants}
                                    title={t('title_addParticipants')}
                                    noDeleted
                                    context={ELEMENTS.chatView.currentContext}
                                />
                            </div>
                        ) : (
                            <ChatMainView chat={chat} onDropFiles={this.setFilesToShare} />
                        )}
                        {this.sidebar}
                    </div>
                    {chat.leaving ? <FullCoverLoader show /> : null}
                </div>
                {this.filesToShare ? (
                    <UploadDialog deactivate={this.cancelShare} files={this.filesToShare} />
                ) : null}
            </>
        );
    }
}

interface ChatHeaderProps {
    chat: Chat;
    toggleSidebar: () => void;
    sidebarIsOpen: boolean;
}

@observer
class ChatHeader extends React.Component<ChatHeaderProps> {
    @observable chatNameEditorVisible = false;

    showChatNameEditor = () => {
        if (!(chatStore.activeChat.canIAdmin && chatStore.activeChat.isChannel)) return;
        this.chatNameEditorVisible = true;
    };

    hideChatNameEditor = () => {
        this.chatNameEditorVisible = false;
    };

    @observable jitsiDialogVisible = false;

    toggleJitsiDialog = () => {
        this.jitsiDialogVisible = !this.jitsiDialogVisible;
    };

    postJitsiLink = () => {
        const jitsiLink = chatStore.generateJitsiUrl();
        chatStore.activeChat && chatStore.activeChat.createVideoCall(jitsiLink);

        this.toggleJitsiDialog();
    };

    readonly jitsiActions = [
        { label: t('button_cancel'), onClick: this.toggleJitsiDialog },
        { label: t('button_startVideoCall'), onClick: this.postJitsiLink }
    ];

    render() {
        const chat = chatStore.activeChat;

        if (!chat) return null;

        const participants = chat.participantUsernames;

        let listMembers = participants[0];
        for (let i = 1; i < participants.length; i++) {
            if (`${listMembers}, ${participants[i]}`.length < 100) {
                listMembers += `, ${participants[i]}`;
            } else {
                listMembers += ' ...';
                break;
            }
        }

        return (
            <>
                <div className="message-toolbar">
                    <div className="message-toolbar-inner">
                        <div className="title" onClick={this.showChatNameEditor}>
                            {this.chatNameEditorVisible ? (
                                <ChatNameEditor
                                    showLabel={false}
                                    className="name-editor"
                                    readOnly={!chat.canIAdmin}
                                    onBlur={this.hideChatNameEditor}
                                    autoFocus
                                />
                            ) : (
                                <div className="name-editor-inner">
                                    {chat.canIAdmin && chat.isChannel ? (
                                        <MaterialIcon icon="edit" />
                                    ) : null}
                                    {chat.isChannel ? (
                                        ELEMENTS.chatView.title(
                                            ELEMENTS.chatEditor.displayName(chat)
                                        )
                                    ) : (
                                        <div className="title-content">{chat.name}</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="meta-nav">
                            {chat.isChannel ? (
                                <div className="member-count">
                                    <MaterialIcon
                                        icon="person"
                                        tooltip={listMembers}
                                        tooltipPosition="bottom"
                                    />
                                    {chat.allParticipants.length || ''}
                                </div>
                            ) : chat.changingFavState ? (
                                <ProgressBar circular size="small" />
                            ) : (
                                <div
                                    className={css(
                                        'pin-toggle',
                                        'clickable',
                                        'custom-icon-hover-container'
                                    )}
                                >
                                    <Beacon
                                        name="pin_desktop"
                                        type="spot"
                                        description={t('description_pin_beacon')}
                                        size={40}
                                        onContentClick={chat.toggleFavoriteState}
                                        offsetY={-2}
                                        markReadOnUnmount
                                    >
                                        <Button
                                            onClick={chat.toggleFavoriteState}
                                            theme="small no-hover"
                                        >
                                            <CustomIcon
                                                active={chat.isFavorite}
                                                icon={chat.isFavorite ? 'pin-on' : 'pin-off'}
                                                className="small"
                                                hover={!chat.isFavorite}
                                            />
                                        </Button>
                                    </Beacon>
                                    <Tooltip
                                        text={
                                            chat.isFavorite
                                                ? t('button_unpinChat')
                                                : t('button_pinChat')
                                        }
                                        position="bottom"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="message-toolbar-inner-right">
                        <Button
                            icon="videocam"
                            disabled={!chat || !chat.canSendJitsi}
                            onClick={this.toggleJitsiDialog}
                            tooltip={t('button_startVideoCall')}
                            tooltipPosition="bottom"
                            tooltipSize="small"
                        />
                        <Beacon
                            type="spot"
                            name="infoPanel_desktop"
                            description={t('description_infoPanel_beacon_desktop')}
                            position="right"
                            onContentClick={this.props.toggleSidebar}
                            markReadOnUnmount
                        >
                            <Button
                                icon="chrome_reader_mode"
                                onClick={this.props.toggleSidebar}
                                active={this.props.sidebarIsOpen}
                                tooltip={t('button_toggleSidebar')}
                                tooltipPosition="bottom"
                                tooltipSize="small"
                            />
                        </Beacon>
                    </div>
                </div>
                <Dialog
                    active={this.jitsiDialogVisible}
                    actions={this.jitsiActions}
                    onCancel={this.toggleJitsiDialog}
                    title={t('title_videoCall')}
                >
                    {t('dialog_videoCall')}
                </Dialog>
            </>
        );
    }
}

interface ChatMainViewProps {
    chat: Chat;
    onDropFiles: (files: string[]) => void;
    connectDropTarget?: (el: JSX.Element) => JSX.Element;
    isBeingDraggedOver?: boolean;
}

@DropTarget<ChatMainViewProps>(
    [DragDropTypes.NATIVEFILE],
    {
        drop(props, monitor) {
            if (monitor.didDrop()) return; // drop was already handled
            props.onDropFiles(monitor.getItem().files.map(f => f.path));
        }
    },
    (connect, monitor) => ({
        connectDropTarget: connect.dropTarget(),
        isBeingDraggedOver: monitor.isOver({ shallow: true })
    })
)
@observer
class ChatMainView extends React.Component<ChatMainViewProps> {
    scrollToBottom(): void {
        if (this.messageListRef.current) {
            this.messageListRef.current.scrollToBottom();
        }
    }

    @computed
    get shareInProgress(): boolean {
        const chat = chatStore.activeChat;
        if (!chat) return false;
        return (
            (chat.uploadQueue && chat.uploadQueue.length > 0) ||
            (chat.folderShareQueue && chat.folderShareQueue.length > 0)
        );
    }

    /**
     * Create a new Message keg with the given plaintext and send it to server as part of this chat.
     * @param text The plaintext of the message.
     */
    sendMessage(text: string): void {
        try {
            chatStore.activeChat.sendMessage(text).catch(() => ChatView.playErrorSound());
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Create a new Message keg with the given plaintext and send it to server as part of this chat.
     * @param richText A ProseMirror document tree, in JSON.
     * @param legacyText The rendered HTML of the rich text, for back-compat with older clients
     */
    @action.bound
    sendRichTextMessage(richText: unknown, legacyText: string): void {
        try {
            this.scrollToBottom();
            chatStore.activeChat
                .sendRichTextMessage(richText, legacyText)
                .catch(() => ChatView.playErrorSound());
        } catch (err) {
            console.error(err);
        }
    }

    @action.bound
    sendAck(): void {
        try {
            this.scrollToBottom();
            chatStore.activeChat.sendAck().catch(() => ChatView.playErrorSound());
        } catch (err) {
            console.error(err);
        }
    }

    @action.bound
    shareFilesAndFolders(filesAndFolders) {
        try {
            this.scrollToBottom();
            chatStore.activeChat
                .shareFilesAndFolders(filesAndFolders)
                .catch(() => ChatView.playErrorSound());
        } catch (err) {
            console.error(err);
        }
    }

    @observable.ref messageListRef = React.createRef<MessageList>();

    jumpToBottom = () => {
        const chat = chatStore.activeChat;

        if (chat.canGoDown) {
            chat.reset();
            return;
        }

        this.scrollToBottom();
    };

    @computed
    get pageScrolledUp() {
        return this.messageListRef.current && this.messageListRef.current.pageScrolledUp;
    }

    render() {
        const { connectDropTarget, isBeingDraggedOver, chat } = this.props;

        return connectDropTarget(
            <div
                className={css('messages-container', {
                    'messages-container-droppable-hovered': isBeingDraggedOver
                })}
            >
                {chatStore.chats.length === 0 && !chatStore.loading ? null : (
                    <MessageList ref={this.messageListRef} />
                )}
                {this.shareInProgress ? (
                    <ShareToChatProgress
                        uploadQueue={chat.uploadQueue}
                        folderShareQueue={chat.folderShareQueue}
                    />
                ) : null}
                <MessageInput
                    readonly={!chat || !chat.metaLoaded || chat.isReadOnly}
                    placeholder={
                        chat
                            ? t('title_messageInputPlaceholder', {
                                  chatName: `${chat.isChannel ? '# ' : ''}${chat.name}`
                              })
                            : null
                    }
                    onSend={this.sendRichTextMessage}
                    onAck={this.sendAck}
                    onFileShare={this.shareFilesAndFolders}
                    messageListScrolledUp={this.pageScrolledUp}
                    onJumpToBottom={this.jumpToBottom}
                    shareInProgress={this.shareInProgress}
                />
            </div>
        );
    }
}
