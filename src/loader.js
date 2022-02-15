(async () => {
  console.debug('Loading App');
  await import('./index.jsx');
  console.debug('Finished Loading App');
})();
