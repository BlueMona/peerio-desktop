import { action } from 'mobx';

import { User, fileStore } from 'peerio-icebear';
import { File, FileFolder } from 'peerio-icebear/dist/models';

import { selectDownloadFolder } from '~/helpers/file';

export type ShareContext = 'sharefiles' | 'sharefolders' | '';

/*
 * TODO: any of these that could be sensibly placed on the icebear models might
 * as well be there.
 *
 * in keeping with the OO style of icebear (such as it exists) it might make
 * sense to have augmented versions of the file/folder models for
 * environment-specific actions (eg. where we use dom or electron apis) in
 * desktop, mobile, etc., rather than static methods as in this file. that's
 * something that could be explored later.
 *
 * (this would also probably make a lot more sense for view-model properties
 * like "selected", etc., which currently just reside on the models proper.)
 */

export function isFileOrFolderMoveable(fileOrFolder: File | FileFolder): boolean {
    // if the root folder doesn't have any folders in it, we can't move anything anywhere.
    if (!fileStore.folderStore.root.hasNested) return false;
    // if a folder is shared, it's not moveable.
    if (fileOrFolder.isFolder && fileOrFolder.isShared) return false;
    return true;
}

export function fileDownloadUIEnabled(file: File): boolean {
    return file.readyForDownload && !file.downloading;
}

export function isFileShareable(file: File): boolean {
    return file.readyForDownload && file.canShare;
}

export function isFileOwnedByCurrentUser(file: File): boolean {
    return file.fileOwner === User.current.username;
}

export async function downloadFolder(folder: FileFolder): Promise<void> {
    const path = await selectDownloadFolder();
    if (!path) return;
    fileStore.bulk.downloadOne(folder, path);
}

export function deleteFileOrFolder(fileOrFolder: File | FileFolder): void {
    fileStore.bulk.removeOne(fileOrFolder);
}

export const handleSearch = action((val: string) => {
    fileStore.searchQuery = val;
});

export const toggleFileOrFolderSelected = action((fileOrFolder: File | FileFolder) => {
    fileOrFolder.selected = !fileOrFolder.selected;
});

export const setCurrentFolder = action((folder: FileFolder) => {
    if (folder !== fileStore.folderStore.currentFolder) {
        fileStore.folderStore.currentFolder = folder;
        fileStore.searchQuery = '';
        fileStore.clearSelection();
    }
});
