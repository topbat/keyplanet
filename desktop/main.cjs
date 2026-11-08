const { app, BrowserWindow, net, protocol, session } = require('electron');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const { assetName } = require('./assets.cjs');

const home = 'keyplanet://app/';
const smokeTest = process.argv.includes('--smoke-test');
const contentSecurityPolicy = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

protocol.registerSchemesAsPrivileged([
  { scheme: 'keyplanet', privileges: { standard: true, secure: true } },
]);

async function serveAsset(request) {
  if (request.method !== 'GET') return new Response(null, { status: 405 });
  const filename = assetName(request.url);
  if (!filename) return new Response(null, { status: 404 });

  const url = pathToFileURL(join(app.getAppPath(), 'dist', filename));
  const asset = await net.fetch(url.href).catch(() => null);
  if (!asset) return new Response(null, { status: 404 });

  const headers = new Headers(asset.headers);
  headers.set('Content-Security-Policy', contentSecurityPolicy);
  return new Response(asset.body, { status: asset.status, headers });
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 850,
    show: !smokeTest,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  await window.loadURL(home);

  if (smokeTest) {
    const ready = await window.webContents.executeJavaScript(`
      Boolean(document.querySelector('#home-courses [data-start="keyboard"]')) &&
      localStorage.length >= 0
    `);
    if (!ready) throw new Error('桌面端首页未完成初始化');
    app.exit(0);
  }
}

function launchFailed(error) {
  console.error(error);
  app.exit(1);
}

app.whenReady().then(() => {
  protocol.handle('keyplanet', serveAsset);
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow().catch(launchFailed);
  });
  return createWindow();
}).catch(launchFailed);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
