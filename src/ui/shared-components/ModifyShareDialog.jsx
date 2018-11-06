const React = require('react');
const { observable, computed, action } = require('mobx');
const { observer } = require('mobx-react');

const css = require('classnames');
const T = require('~/ui/shared-components/T');
const { t } = require('peerio-translator');
const { getContactByEvent } = require('~/helpers/icebear-dom');
const { Avatar, Dialog, List, ListItem, Button } = require('peer-ui');

/**
 * onSelectContact
 * onSelectChannel
 */
@observer
class ModifyShareDialog extends React.Component {
    @observable visible = false;
    @observable selection = [];

    componentDidMount() {
        this.selection = [];
    }

    @action.bound
    toggleRemove(contact) {
        // if contact was not in the array, push it there. If it was - it's now removed
        if (!this.selection.remove(contact)) {
            this.selection.push(contact);
        }
    }

    @computed
    get contacts() {
        return this.props.contacts;
    }

    @action.bound
    async onContactClick(ev) {
        const contact = await getContactByEvent(ev);
        this.selectedUsers.set(contact.username, contact);
    }

    @action.bound
    show() {
        this.visible = true;
        return new Promise(resolve => {
            this.resolve = resolve;
        });
    }

    @action.bound
    close() {
        this.visible = false;
        this.selection = [];
        this.resolve(null);
        this.resolve = null;
    }

    @action.bound
    removeSelectedContacts() {
        this.props.folder.removeParticipants(this.selection);
        this.close();
    }

    render() {
        if (!this.visible) return false;
        const dialogActions = [{ label: t('button_cancel'), onClick: this.close }];
        if (this.selection.length) {
            dialogActions.push({ label: t('button_save'), onClick: this.removeSelectedContacts });
        }
        return (
            <Dialog
                active
                noAnimation
                className="share-with-dialog share-folder modify-shared-with"
                actions={dialogActions}
                onCancel={this.close}
                title={t('title_sharedWith')}
            >
                <div className="share-with-contents">
                    <div className="chat-list-container">
                        <div className="list-dms-container">
                            <div className="p-list-heading">
                                <T k="title_contacts" />
                                &nbsp;({this.contacts.length})
                            </div>
                            <List className="list-chats list-dms">
                                {this.contacts.map(c => {
                                    return (
                                        <ModifyShareListItem
                                            key={c.username}
                                            contact={c}
                                            folder={this.props.folder}
                                            toggleRemove={this.toggleRemove}
                                        />
                                    );
                                })}
                            </List>
                        </div>
                    </div>
                    <div className="receipt-wrapper">
                        <Button
                            icon="person_add"
                            label={t('title_shareWithOthers')}
                            onClick={this.close}
                        />
                    </div>
                </div>
            </Dialog>
        );
    }
}

@observer
class ModifyShareListItem extends ListItem {
    @observable isClicked = false;

    @action.bound
    handleRemoveAndUndo() {
        this.isClicked = !this.isClicked;
        this.props.toggleRemove(this.props.contact);
    }

    render() {
        const c = this.props.contact;
        const fileCount = this.props.folder.store.getFilesSharedBy(c.username).length;
        return (
            <ListItem
                className={css('modify-share-list-item', {
                    expanded: this.isClicked
                })}
                leftContent={<Avatar key="a" contact={c} size="small" />}
                rightContent={
                    this.isClicked ? (
                        <Button onClick={this.handleRemoveAndUndo}>{t('button_undo')}</Button>
                    ) : this.props.folder.owner === c.username ? (
                        <T k="title_owner" className="badge" />
                    ) : (
                        <Button icon="remove_circle_outline" onClick={this.handleRemoveAndUndo} />
                    )
                }
            >
                <div>
                    <span className="full-name">{c.fullName}</span>
                    <span className="username">@{c.username}</span>
                    &nbsp;
                    {this.isClicked && <T k="title_removed" className="badge red" />}
                </div>

                {this.isClicked && fileCount ? (
                    <T k="title_unshareUserWarning" tag="div" className="remove-user-warning">
                        {{
                            fileCount,
                            user: c.firstName
                        }}
                    </T>
                ) : null}
            </ListItem>
        );
    }
}

module.exports = { ModifyShareDialog, ModifyShareListItem };
