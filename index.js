require('json5/lib/register');

const glob = require('glob');
const _ = require('lodash');
const request = require('request');
const util = require('util');
const fsExtra = require('fs-extra');
const configTemplate = require('./utils/config-template');

const safeParse = str => {
  try {
    return JSON.parse(`${str}`);
  } catch(e) {
    return str;
  }
}
const pRequest = (options) => new Promise((resolve, reject) => request(options, (err, response, body) => err ? resolve(console.log(err), {
  note: `Request does not work at the moment: ${err}`
}) : resolve([response, safeParse(body)])));


const files = glob.sync('input/**/*.json5');

(async () => files.filter(fileName => !fileName.match('input/example/')).forEach(async(fileName) => {
    console.log(`[=] Processing "${fileName}"`);
    try {
      const requestOptions = require(`./${fileName}`);
      const [_, responseBody] = await pRequest(requestOptions);

      fsExtra.outputFileSync(fileName.replace('input/', 'output/').replace('.json5', '.ts'), configTemplate(requestOptions, responseBody));
      console.log(`[=] Processed "${fileName}"`)
    } catch(e) {
      console.log(`Error on processing ${fileName} `, e.message);
      console.log(e);
    }
  }))();