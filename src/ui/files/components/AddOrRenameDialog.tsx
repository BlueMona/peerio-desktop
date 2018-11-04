import React from 'react';
import { observable, computed, action } from 'mobx';
import { observer } from 'mobx-react';
import { Dialog, Input } from 'peer-ui';
import { t } from 'peerio-translator';
import { fileStore } from 'peerio-icebear';
import { FileFolder } from 'peerio-icebear/dist/models';

// As of 22/08/18, only folders can be renamed, not files, so there's a bit of
// naming/typing weirdness.

@observer
export default class AddOrRenameFolderDialog extends React.Component {
    /**
     * Reference to the promise resolver to allow the caller to await the dialog
     * closing. When the resolver is set to null, the dialog is hidden.
     */
    @observable.ref resolver: (() => void) | null = null;

    @observable inputValue: string;

    /**
     * The file or folder to rename.
     * If null, we're adding a new folder.
     */
    @observable.ref folderToRename: FileFolder | null = null;

    /**
     * @param fileOrFolder The file or folder to rename; if undefined, we're
     *                     adding a new folder.
     */
    @action.bound
    show(fileOrFolder?: FileFolder) {
        if (fileOrFolder) {
            this.folderToRename = fileOrFolder;
            this.inputValue = fileOrFolder.name;
        } else {
            // TODO: to be added to icebear
            // this.inputValue = t('default_newFolderName');
            this.inputValue = '';
        }

        return new Promise(res => {
            this.resolver = res;
        });
    }

    @action.bound
    close() {
        this.resolver();
        this.resolver = null;
        this.inputValue = null;
        this.folderToRename = null;
    }

    @computed
    get canPerformAddOrRename(): boolean {
        return this.inputValue.trim().length > 0;
    }

    readonly performRename = () => {
        if (this.canPerformAddOrRename) {
            this.folderToRename.rename(this.inputValue);
        }
        this.close();
    };

    readonly performAddFolder = () => {
        if (this.canPerformAddOrRename) {
            fileStore.folderStore.currentFolder.createFolder(this.inputValue);
        }
        this.close();
    };

    @action.bound
    onInputChange(val: string) {
        this.inputValue = val;
    }

    readonly onInputKeyDown = (ev: React.KeyboardEvent) => {
        if (ev.key === 'Enter' && this.canPerformAddOrRename) {
            if (this.folderToRename) {
                this.performRename();
            } else {
                this.performAddFolder();
            }
        }
    };

    render() {
        if (!this.resolver) {
            return null;
        }

        const dialogActions = [
            { label: t('button_cancel'), onClick: this.close },
            this.folderToRename
                ? {
                      label: t('button_rename'),
                      disabled: !this.canPerformAddOrRename,
                      onClick: this.performRename
                  }
                : {
                      label: t('button_create'),
                      disabled: !this.canPerformAddOrRename,
                      onClick: this.performAddFolder
                  }
        ];

        return (
            <Dialog
                title={t(this.folderToRename ? 'button_rename' : 'button_newFolder')}
                active
                size="small"
                actions={dialogActions}
                onCancel={this.close}
                className="add-folder-popup"
            >
                <Input
                    placeholder={t('title_folderName')}
                    value={this.inputValue}
                    onChange={this.onInputChange}
                    onKeyDown={this.onInputKeyDown}
                    autoFocus
                />
            </Dialog>
        );
    }
}
