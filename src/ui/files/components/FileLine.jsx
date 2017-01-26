const React = require('react');
const { observable } = require('mobx');
const { observer } = require('mobx-react');
const css = require('classnames');
const FileActions = require('./FileActions');
const FileLoading = require('./FileLoading');
const { Checkbox, ProgressBar } = require('~/react-toolbox');
const { fileStore } = require('~/icebear');
const { downloadFile } = require('~/helpers/file');

@observer
class FileLine extends React.Component {
    @observable showActions=false;
    toggleChecked = val => {
        this.props.file.selected = val;
    };
    deleteFile = () => {
        if (confirm(`Remove file ${this.props.file.name}?`)) {
            fileStore.remove(this.props.file);
        }
    };
    cancelUploadOrDownload = () => {
        if (this.props.file.uploading) fileStore.cancelUpload(this.props.file);
        else fileStore.cancelDownload(this.props.file);
    };
    download = () => {
        downloadFile(this.props.file);
    };
    onShowActions = () => {
        this.showActions = true;
    };
    onHideActions = () => {
        this.showActions = false;
    };

    render() {
        const file = this.props.file;
        if (!file.show) return null;
        return (
            <tr className={css({ selected: this.checked,
                'selected-row': file.selected,
                'waiting-3rd-party': file.waitingForThirdParty })}
                onMouseEnter={this.onShowActions} onMouseLeave={this.onHideActions}>
                <td>
                    {(file.downloading || file.uploading)
                        ? <FileLoading loading={file.downloading ? 'file_download' : 'file_upload'}
                                       onCancel={this.cancelUploadOrDownload} />
                        : <Checkbox disabled={!file.readyForDownload} checked={file.selected} onChange={this.toggleChecked} />
                    }</td>
                <td>{file.name}</td>
                <td>{file.owner}</td>
                <td className="text-right">{file.uploadedAt && file.uploadedAt.toLocaleString()}</td>
                <td className="hide-text text-right">{file.sizeFormatted}</td>
                <td className="hide-text uppercase">{file.ext}</td>
                {
                    this.showActions
                    ? <FileActions downloadDisabled={!file.readyForDownload || file.downloading}
                                   shareDisabled newFolderDisabled deleteDisabled={false}
                                   onDelete={this.deleteFile} onDownload={this.download} />
                    : null
                }

                <td className="loading">
                    {(file.downloading || file.uploading)
                        ? <ProgressBar type="linear" mode="determinate" value={file.progress}
                                       buffer={file.progressBuffer} max={file.progressMax} />
                        : null }
                </td>
            </tr>
        );
    }
}

module.exports = FileLine;
