(async() => {
  console.debug('Loading App');
  await import('./app.js');
  console.debug('Finished Loading App');
})();
