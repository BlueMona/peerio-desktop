import { remote as electron, OpenDialogOptions } from 'electron';
import fs from 'fs';
import path from 'path';
import util from 'util';
import _ from 'lodash';
import sanitize from 'sanitize-filename';
import { t } from 'peerio-translator';
import { fileHelpers, errors } from 'peerio-icebear';
import { File } from 'peerio-icebear/dist/models';
import { IUploadFolder } from 'peerio-icebear/dist/models/files/file-store';

const lstatAsync = util.promisify(fs.lstat);
const readdirAsync = util.promisify(fs.readdir);

export function selectDownloadFolder(): Promise<string | null> {
    return new Promise(resolve => {
        const win = electron.getCurrentWindow();
        electron.dialog.showOpenDialog(
            win,
            {
                buttonLabel: t('button_download') as string, // TODO: remove when t() fixed
                properties: ['openDirectory', 'treatPackageAsDirectory', 'createDirectory']
            },
            folders => {
                if (!folders || !folders.length) {
                    resolve(null);
                } else {
                    resolve(folders[0]);
                }
            }
        );
    });
}

export function pickSavePath(
    folderPath: string,
    nameWithoutExtension: string,
    extension = ''
): string {
    console.log(folderPath);
    console.log(nameWithoutExtension);
    console.log(extension);
    let defaultPath: string;
    let counter = 0;
    do {
        defaultPath = path.join(
            folderPath,
            sanitize(nameWithoutExtension, { replacement: '_' }).concat(
                counter ? ` (${counter})` : '',
                extension ? `.${extension}` : ''
            )
        );
        ++counter;
    } while (fs.existsSync(defaultPath));
    return defaultPath;
}

export function requestDownloadPath(fileName: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let p = sanitize(fileName, { replacement: '_' });
        try {
            const downloadsDir = electron.app.getPath('downloads');
            // TODO: maybe use path.join here?
            p = `${downloadsDir}/${p}`;
        } catch (err) {
            console.log(err);
        }

        let filters;
        let ext = path.extname(path.basename(p));
        // On Windows, set up "Save as type" filters if the file has an extension.
        if (process.platform === 'win32' && ext.length > 1) {
            ext = ext.substring(1); // strip dot
            filters = [
                {
                    name: t('dialog_fileTypeForExtension', {
                        extension: ext.toUpperCase()
                    }), // '{extension} File'
                    extensions: [ext]
                },
                {
                    name: t('dialog_fileTypeAllFiles'), // 'All Files'
                    extensions: ['*']
                }
            ];
        }

        const win = electron.getCurrentWindow();
        electron.dialog.showSaveDialog(
            win,
            {
                defaultPath: p,
                filters
            },
            fileSavePath => {
                if (fileSavePath) resolve(fileSavePath);
                else reject(new errors.UserCancelError('User cancelled save dialog.'));
            }
        );
    });
}

// todo: do this in a mobx reaction
export function downloadFile(file: File): Promise<boolean> {
    let finalPath: string;
    return requestDownloadPath(file.name)
        .then(p => {
            finalPath = p;
            return file.download(p);
        }) // todo: file.cached is a temporary hack
        .then(
            () => file.cached && electron.app.dock && electron.app.dock.downloadFinished(finalPath)
        )
        .then(() => file.cached && electron.shell.showItemInFolder(finalPath));
}

export function pickLocalFiles(): Promise<string[]> {
    return new Promise(resolve => {
        const properties: OpenDialogOptions['properties'] = [
            'openFile',
            'multiSelections',
            'treatPackageAsDirectory'
        ];
        if (process.platform === 'darwin') properties.push('openDirectory');
        const win = electron.getCurrentWindow();
        electron.dialog.showOpenDialog(win, { properties }, resolve);
    });
}

interface FileList {
    success: string[];
    error: string[];
    restricted: string[];
    successBytes?: number;
}

/**
 * Takes an array of file/folder paths,
 * returns an array of passed files and all files in passed folders recursively
 * @param paths mixed files/folders paths
 */
export async function getFileList(paths: string[]): Promise<FileList> {
    const ret: FileList = {
        success: [],
        error: [],
        restricted: []
    };
    if (!paths) return ret;
    ret.successBytes = 0;
    for (let i = 0; i < paths.length; i++) {
        const p = paths[i];
        try {
            const stat = await lstatAsync(p);
            if (stat.isFile()) {
                ret.success.push(p);
                ret.successBytes += stat.size;
                continue;
            }
            if (stat.isDirectory()) {
                // going into recursion
                const namesInDir = await readdirAsync(p);
                for (let j = 0; j < namesInDir.length; j++) {
                    namesInDir[j] = path.join(p, namesInDir[j]);
                }
                const nested = await getFileList(namesInDir);
                ret.success.push(...nested.success);
                ret.error.push(...nested.error);
                ret.restricted.push(...nested.restricted);
                ret.successBytes += nested.successBytes;
                continue;
            }
            ret.error.push(p);
        } catch (err) {
            ret.error.push(p);
            console.error(err);
        }
    }
    ret.success = _.uniq(ret.success);
    ret.error = _.uniq(ret.error);
    ret.restricted = _.uniq(ret.restricted);
    return ret;
}

export type FileTree = string | null | IUploadFolder;

export async function getFileTree(filePath: string): Promise<FileTree> {
    try {
        const stat = await lstatAsync(filePath);
        if (stat.isFile()) {
            return filePath;
        }
        if (stat.isDirectory()) {
            const folder: FileTree = {
                name: fileHelpers.getFileName(filePath),
                folders: [],
                files: []
            };

            const namesInDir = await readdirAsync(filePath);
            for (const nameInDir of namesInDir) {
                const child = await getFileTree(path.join(filePath, nameInDir));
                if (!child) continue;

                if (typeof child === 'object') {
                    folder.folders.push(child);
                } else {
                    folder.files.push(child);
                }
            }
            return folder;
        }
        return null;
    } catch (err) {
        console.error(err);
        return null;
    }
}
