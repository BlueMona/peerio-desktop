// @ts-check;
const React = require('react');
const { action, computed, observable } = require('mobx');
const { observer } = require('mobx-react');

const css = require('classnames');
const uiStore = require('~/stores/ui-store');
const T = require('~/ui/shared-components/T');
const { Button, MaterialIcon, ProgressBar } = require('peer-ui');
const FileSpriteIcon = require('~/ui/shared-components/FileSpriteIcon');

// Just for testing
const UPLOAD_FILES = [
    { name: 'file.jpg', iconType: 'img' },
    { name: 'file.jpg', iconType: 'img' },
    { name: 'file.jpg', iconType: 'img' },
    { name: 'file.jpg', iconType: 'img' }
];

const DOWNLOAD_FILES = [
    { name: 'file.jpg', iconType: 'img' },
    { name: 'file.jpg', iconType: 'img' },
    { name: 'file.jpg', iconType: 'img' },
    { name: 'file.jpg', iconType: 'img' }
];

@observer
class FileStatusWindow extends React.Component {
    @observable allCompleted = true;

    @observable bodyRef;

    setBodyRef = (ref) => {
        if (ref) this.bodyRef = ref;
    }

    @computed get hasScrollBar() {
        if (!this.bodyRef) return null;
        return this.bodyRef.scrollHeight > this.bodyRef.clientHeight;
    }

    @action.bound toggleWindow() {
        uiStore.fileStatusWindowCollapsed = !uiStore.fileStatusWindowCollapsed;
    }

    @computed get downloadQueue() { return DOWNLOAD_FILES.map(f => this.fileItem(f, 'download')); }
    @computed get uploadQueue() { return UPLOAD_FILES.map(f => this.fileItem(f, 'upload')); }

    fileItem(file, actionType) {
        const cancelFunction = `onCancel${actionType[0].toUpperCase() + actionType.slice(1)}`;

        return (
            <div className={css('file-item', { error: file.error })}>
                <FileSpriteIcon type={file.iconType} size="small" />
                <span className="file-name">{file.name}</span>

                {file.error
                    ? <MaterialIcon icon="error_outline" className="right-icon error" />
                    : file.completed
                        ? (
                            <span className="right-icon">
                                <MaterialIcon className="completed confirmation" icon="check" />
                                <Button
                                    className="find-file"
                                    icon="search"
                                    theme="small"
                                    onClick={() => this.findFile(file)}
                                />
                            </span>
                        )
                        : <Button
                            className="right-icon"
                            icon="highlight_off"
                            theme="small"
                            onClick={this[cancelFunction]}
                        />
                }

                {file.progress
                    ? <ProgressBar value={50} max={100} />
                    : null
                }
            </div>
        );
    }

    onCancelDownload() {
        console.log('cancel download');
    }

    onCancelUpload() {
        console.log('cancel upload');
    }

    findFile(file) {
        // Apparently there's already a way to navigate to a file in Files view?
        console.log(`find file ${file}`);
    }

    render() {
        if (!DOWNLOAD_FILES.length && !UPLOAD_FILES.length) return null;

        return (
            <div className={css('file-status-window', { collapsed: uiStore.fileStatusWindowCollapsed })}>
                <div className="title-bar">
                    <T k="title_fileStatus">{{ number: DOWNLOAD_FILES.length + UPLOAD_FILES.length }}</T>
                    <div className="buttons-container">
                        <Button
                            icon={uiStore.fileStatusWindowCollapsed ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                            onClick={this.toggleWindow}
                            theme="small"
                        />
                        {this.allCompleted
                            ? <Button
                                icon="close"
                                onClick={this.closeWindow}
                                theme="small"
                            />
                            : null
                        }
                    </div>
                </div>
                <div className={css('body', { 'has-scrollbar': this.hasScrollBar })}
                    ref={this.setBodyRef}
                    onClick={() => console.log(this.hasScrollBar)}
                >
                    {DOWNLOAD_FILES.length
                        ? <React.Fragment>
                            <div className="heading">
                                <T k="title_downloads" />&nbsp;
                                <span>({DOWNLOAD_FILES.length})</span>
                            </div>
                            <div className="files-container">
                                {this.downloadQueue}
                            </div>
                        </React.Fragment>
                        : null
                    }

                    {UPLOAD_FILES.length
                        ? <React.Fragment>
                            <div className="heading">
                                <T k="title_uploads" />&nbsp;
                                <span>({UPLOAD_FILES.length})</span>
                            </div>
                            <div className="files-container">
                                {this.uploadQueue}
                            </div>
                        </React.Fragment>
                        : null
                    }
                </div>
            </div>
        );
    }
}

module.exports = FileStatusWindow;
