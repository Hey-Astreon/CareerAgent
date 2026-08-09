const { runAllProviders } = require('./src/lib/providers/registry');

async function main() {
  console.log('Starting provider diagnostics...');
  await runAllProviders();
  console.log('Diagnostics completed.');
  process.exit(0);
}

main().catch((e) => {
  console.error('Error during diagnostics:', e);
  process.exit(1);
});
