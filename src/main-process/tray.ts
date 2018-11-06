import { app, Menu, Tray } from 'electron';
import * as path from 'path';

let tray = null;

export default function setTrayIcon() {
    // TODO(dchest): when translations are available
    // in the main process, we'll use proper keys for
    // menu items, but for now, we need to get app name.
    let appName = app.getName();
    if (appName === 'Peerio 2') appName = 'Peerio';

    tray = new Tray(
        // Note: .ico works only on windows, throws on other platforms.
        path.join(app.getAppPath(), 'build/static/img/windows-tray-icon.ico')
    );
    const contextMenu = Menu.buildFromTemplate([
        {
            label: `Show ${appName}`,
            click() {
                app.emit('activate');
            }
        },
        {
            type: 'separator'
        },
        {
            label: `Quit ${appName}`,
            click() {
                app.quit();
            }
        }
    ]);
    tray.setToolTip(appName);
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        app.emit('activate');
    });
}
