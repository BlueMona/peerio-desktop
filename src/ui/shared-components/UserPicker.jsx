const React = require('react');
const { observable, computed, when } = require('mobx');
const { observer } = require('mobx-react');
const { Button, Chip, FontIcon, IconButton, Input, List,
        ListItem, ListSubHeader, Tooltip, ProgressBar } = require('~/react-toolbox');
const { t } = require('peerio-translator');
const { fileStore, contactStore } = require('~/icebear');
const css = require('classnames');
const Avatar = require('~/ui/shared-components/Avatar');

const TooltipIcon = Tooltip()(IconButton); //eslint-disable-line

@observer
class UserPicker extends React.Component {
    @observable selected = [];
    @observable query = '';
    @observable notGood = true;
    accepted = false;

    @computed get selectedFiles() {
        return fileStore.getSelectedFiles();
    }

    @computed get options() {
        return contactStore.contacts.filter(c => !c.loading && !c.notFound && !this.selected.includes(c));
    }

    @computed get isValid() {
        return !!this.selected.find(s => !s.loading && !s.notFound);
    }

    handleTextChange = newVal => {
        const newValLower = newVal.toLowerCase();
        if (newValLower.length > 1 && ', '.includes(newValLower[newValLower.length - 1])) {
            this.query = newValLower.substr(0, newValLower.length - 1).trim();
            this.tryAcceptUsername();
            return;
        }
        this.query = newValLower.trim();
    };

    // Don't use onKeyPress it won't catch backspace
    // Don't use onKeyUp - text change fires earlier
    handleKeyDown = e => {
        if (e.key === 'Enter' && this.query !== '') this.tryAcceptUsername();
        if (e.key === 'Backspace' && this.query === '' && this.selected.length > 0) {
            this.selected.remove(this.selected[this.selected.length - 1]);
        }
    };

    tryAcceptUsername() {
        if (this.selected.find(s => s.username === this.query)) {
            return;
        }
        const c = contactStore.getContact(this.query);
        this.selected.push(c);
        when(() => !c.loading, () => {
            setTimeout(() => c.notFound && this.selected.remove(c), 3000);
        });
        this.query = '';
    }


    accept = () => {
        if (this.accepted || !this.isValid) return;
        this.accepted = true;
        this.selected.forEach(s => {
            if (s.notFound) this.selected.remove(s);
        });
        this.props.onAccept(this.selected);
    };

    handleClose = () => {
        this.props.onClose();
    };

    render() {
        return (
            <div className="user-picker">
                <div className={css('flex-col selected-items', { banish: !this.props.sharing })} >
                    <List >
                        {/* TODO: dynamic file icon based on file type */}
                        <ListSubHeader caption={t('selectedFiles')} />
                        {/* FIXME:  Should load selected files not entire file library. */}
                        {this.selectedFiles.map(f => <ListItem
                            leftIcon="insert_drive_file"
                            caption={f.name}
                            rightIcon="remove_circle_outline" />)}

                    </List>
                </div>
                <div className="flex-row flex-justify-center"
                     style={{ width: '100%' }}>
                    <div className="flex-col"
                        style={{
                            width: '600px',
                            marginLeft: '64px',
                            marginRight: '64px',
                            marginTop: '168px' }}>
                        <div className="chat-creation-header">
                            <div className="title">{this.props.title}</div>
                            <IconButton icon="close" onClick={this.handleClose} />
                        </div>
                        <div className="new-message-search">
                            <FontIcon value="search" />
                            <div className="chip-wrapper">
                                {this.selected.map(c =>
                                    <Chip key={c.username} className={css('chip-label', { 'not-found': c.notFound })}
                                              onDeleteClick={() => this.selected.remove(c)} deletable>
                                        { c.loading ? <ProgressBar type="linear" mode="indeterminate" /> : c.username }
                                    </Chip>
                                    )}
                                <Input placeholder={t('userSearch')} value={this.query}
                                           onChange={this.handleTextChange} onKeyDown={this.handleKeyDown} />
                            </div>
                            {/* TODO: make label dynamic */}
                            <Button className={css('confirm', { hide: !this.selected.length })}
                                    label={this.props.button || 'go'}
                                    onClick={this.accept} disabled={!this.isValid} />
                        </div>
                        <List selectable ripple >
                            <ListSubHeader caption="Your contacts" />
                            <div className="user-list">
                                { this.options.map(c =>
                                    <ListItem key={c.username}
                                              avatar={<Avatar contact={c} />}
                                              caption={c.username}
                                              legend={`${c.firstName} ${c.lastName}`}
                                              onClick={() => this.selected.push(c)}
                                              className={css({ warning: this.notGood })}
                                              rightIcon={this.notGood ?
                                                  <TooltipIcon tooltip="Somethings wrong!"
                                                               tooltipDelay={200}
                                                               tooltipPosition="right"
                                                               icon="error_outline" />
                                                  : null} />
                                    )}
                            </div>
                        </List>
                    </div>
                </div>
            </div>
        );
    }
}


module.exports = UserPicker;
