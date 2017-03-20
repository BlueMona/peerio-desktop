const React = require('react');
const { observable } = require('mobx');
const { observer } = require('mobx-react');
const { t } = require('peerio-translator');
const { Dialog, IconButton, IconMenu, MenuDivider, MenuItem, Tooltip } = require('~/react-toolbox');
const MailSentSidebar = require('./MailSentSidebar');
const InlineFiles = require('../../messages/components/InlineFiles');
const { fileStore, systemWarnings, mailStore } = require('~/icebear');

const TooltipIcon = Tooltip()(IconButton); //eslint-disable-line

@observer
class MailSent extends React.Component {

    @observable deleteDialogActive = false;

    handleClose = () => {
        this.deleteDialogActive = false;
    };

    deleteGhost = () => {
        mailStore.remove(this.props.ghost)
            .then(() => {
                this.handleClose();
                systemWarnings.add({
                    content: 'ghost_snackbarDeleted'
                });
            });
    };

    handleDelete = () => {
        // requires confirmation only if the ghost is active
        if (!this.props.ghost.expired && !this.props.ghost.revoked) {
            this.deleteDialogActive = true;
        } else {
            this.deleteGhost();
        }
    };

    render() {
        const deleteActions = [
            { label: t('button_cancel'), onClick: () => { this.handleClose(); } },
            { label: t('button_ghostDeleteAction'), onClick: () => { this.deleteGhost(); }, primary: true }
        ];

        return (
            <div className="flex-row flex-grow-1">
                <div className="compose-view">
                    <div className="compose-meta sent">
                        <div className="flex-row flex-align-center flex-justify-between"
                             style={{ height: '36px' }}>
                            <div className="subject">{this.props.ghost.subject}</div>
                            <TooltipIcon
                                tooltip={t('delete_mail')}
                                tooltipDelay={250}
                                tooltipPosition="bottom"
                                icon="delete"
                                onClick={this.handleDelete} />

                            {this.props.ghost.files.length ?
                                <div className="attached-files">
                                    {this.props.ghost.files.length}
                                    <IconMenu icon="attachment">
                                        <MenuItem caption="Download all"
                                                  icon="file_download" />
                                        <MenuDivider />
                                        {this.props.ghost.files.map(f => {
                                            const file = fileStore.getById(f);
                                            return (
                                                <MenuItem key={f}
                                                          caption={file.name}
                                                          icon="file_download" />);
                                        })}
                                    </IconMenu>
                                </div> : null
                            }
                        </div>
                        <div className="date">{this.props.ghost.date.format('LLL')}</div>
                        <div className="to">{this.props.ghost.recipients.join(',')}</div>
                    </div>
                    <div className="mail-content sent-content">
                        {this.props.ghost.body}
                    </div>
                    {this.props.ghost.files !== 0 ? <InlineFiles files={this.props.ghost.files} /> : null}

                </div>
                <MailSentSidebar ghost={this.props.ghost} />
                <Dialog title={t('title_ghostDelete')}
                        actions={deleteActions}
                        active={this.deleteDialogActive}
                        onEscKeyDown={this.handleClose}
                        onOverlayClick={this.handleClose}>
                    {t('dialog_ghostDeleteText')}
                </Dialog>
            </div>
        );
    }
}

module.exports = MailSent;
