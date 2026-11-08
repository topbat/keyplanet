function assetName(requestUrl) {
  const url = new URL(requestUrl);
  if (url.protocol !== 'keyplanet:' || url.host !== 'app' || url.username || url.password) {
    return null;
  }

  if (url.pathname === '/') return 'index.html';
  const filename = url.pathname.slice(1);
  return /^[a-z0-9][a-z0-9.-]*\.(html|css|js)$/.test(filename) ? filename : null;
}

module.exports = { assetName };
