const fs = require('fs-extra');
const death = require('death');

process.on('exit', code => fs.appendFileSync('log.json', JSON.stringify({ stamp: new Date().toISOString(), message: `Exit ${code}` }) + '\n'));
process.on('SIGINT', signal => fs.appendFileSync('log.json', JSON.stringify({ stamp: new Date().toISOString(), message: `Signal ${signal}` }) + '\n'));
process.on('SIGKILL', signal => fs.appendFileSync('log.json', JSON.stringify({ stamp: new Date().toISOString(), message: `Signal ${signal}` }) + '\n'));
process.on('SIGQUIT', signal => fs.appendFileSync('log.json', JSON.stringify({ stamp: new Date().toISOString(), message: `Signal ${signal}` }) + '\n'));
process.on('SIGTERM', signal => fs.appendFileSync('log.json', JSON.stringify({ stamp: new Date().toISOString(), message: `Signal ${signal}` }) + '\n'));

death((signal, error) => fs.appendFileSync('log.json', JSON.stringify({ stamp: new Date().toISOString(), message: `Death ${signal} ${error}` }) + '\n'));

async function log(/** @type {string} */ message) {
  await fs.appendFile('log.json', JSON.stringify({ stamp: new Date().toISOString(), message }) + '\n');
}

void async function () {
  await log('Running…');
  setTimeout(async () => await log('Timeout done'), 60 * 1000);
  console.log('Self PID:', process.pid);
}()
