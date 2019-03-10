#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const fetch = require('node-fetch');
const AsciiTable = require('ascii-table');

/*-----------------------------
  Global variable definitions 
-------------------------------*/

const storePath = path.join(os.homedir(), '.talerts', 'repos.json');
const envFilePath = path.join(os.homedir(), '.talerts', '.env');
require('dotenv').config({path: envFilePath});

const { githubToken, githubSecret, webhookUrl, owner } = process.env;

const help = 'possible commands: list, setup, add, remove, enable, disable';
const missingRepoHelp = 'please specify a repo.';

const store = JSON.parse(storeRaw);

/*-------------------------
  Function definitions 
--------------------------*/

const runSetup = () => {
  console.log(`let's get you up and running first with your credentials.`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', () => {
    console.log('\nsetup cancelled - no changes made.')
    rl.pause();
  });

  rl.question('Your GitHub username: ', (owner) => {
    rl.question('Your GitHub Token: ', (token) => {
      rl.question('Your webhook signing secret: ', (secret) => {
        rl.question('Your webhook URL: ', (webhookUrl) => {
          const fileContents = [ 
            `githubToken='${token}'`,
            `githubSecret='${secret}'`,
            `webhookUrl='${webhookUrl}'`,
            `owner='${owner}'`
          ].join('\n');

          fs.writeFileSync(envFilePath, fileContents);
          console.log('saved new settings.');

          rl.close();
        });
      });
    });
  });
};

const writeStore = (store) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(storePath, JSON.stringify(store), 'utf8', (error) => {
      if (error) reject(error);
      resolve();
    });
  });
}

const fetchHandler = (res) => {
  return new Promise((resolve, reject) => { 
    if (!res.ok) reject(new Error(`error calling GitHub API, status was ${res.status}`)); 
    resolve(res);
  });
};

const createWebhookPayload = ({active}) => { 
  return {
    "name": "web",
    "active": active,
    "events": [
      "pull_request",
      "issues",
      "check_suite"
    ],
    "config": {
      "url": webhookUrl,
      "content_type": "json",
      "secret": githubSecret
    }
  }
}

const listWebhooks = () => {
  if (!Object.keys(store).length) return console.log('no webhooks currently added.');

  const table = new AsciiTable();
  table.setHeading('repo', 'enabled');
  for (item in store) {
    table.addRow(item, store[item]['enabled']);
  }
  console.log(table.toString());
}

// GitHub API hitters

const removeWebhook = () => {
  const url = `https://api.github.com/repos/${owner}/${repo}/hooks/${store[repo]['id']}`;

  const options = {
    method: 'DELETE',
    headers: {
      'Authorization': `token ${githubToken}`,
      'User-Agent': owner
    }
  }

  return fetch(url, options);
}

const addWebhook = () => {
  const payload = createWebhookPayload({active:true});
  const url = `https://api.github.com/repos/${owner}/${repo}/hooks`;

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `token ${githubToken}`,
      'Content-Type': 'application/json',
      'User-Agent': owner
    },
    body: JSON.stringify(payload)
  };

  return fetch(url, options);
}

const editWebhook = ({active}) => {
  const payload = createWebhookPayload({active});
  const url = `https://api.github.com/repos/${owner}/${repo}/hooks/${store[repo]['id']}`;

  const options = {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${githubToken}`,
      'Content-Type': 'application/json',
      'User-Agent': owner
    },
    body: JSON.stringify(payload)
  };

  return fetch(url, options);
}

/*-------------------------
  Start processing input
--------------------------*/

const args = process.argv;
const command = args[2];
if (!command) return console.log(help);

const repo = args[3];
if (!githubToken && command !== 'setup') return runSetup();
if (!repo && command !== 'list' && command !== 'setup') return console.log(missingRepoHelp);

switch(command) {
  case 'list':
    listWebhooks();
    break;

  case 'setup':
    runSetup();
    break;

  case 'add':
    if (store[repo]) return console.log(`${repo} is already added.`);

    addWebhook()
      .then(fetchHandler)
      .then((res) => res.json())
      .then((res) => {store[repo] = {enabled: true, id: res.id}})
      .then(() => writeStore(store))
      .then(() => listWebhooks())
      .catch((error) => {throw new Error(`webhook could not be added: ${error.toString()}`)});
    break;

  case 'remove':
    if (!store[repo]) return console.log(`${repo} did not have a webhook anyway.`);

    removeWebhook()
      .then(fetchHandler)
      .then(() => delete store[repo])
      .then(() => writeStore(store))
      .then(() => listWebhooks())
      .catch((error) => {throw new Error(`webhook could not be removed: ${error.toString()}`)});
    break;

  case 'enable':
    if (!store[repo]) return console.log(`${repo} does not have a webhook to enable. Perhaps add one?`);

    editWebhook({active:true})
      .then(fetchHandler)
      .then(() => {store[repo]['enabled'] = true})
      .then(() => writeStore(store))
      .then(() => listWebhooks())
      .catch((error) => {throw new Error(`webhook could not be enabled: ${error.toString()}`)});
    break;

  case 'disable':
    if (!store[repo]) return console.log(`${repo} does not have a webhook to disable. Perhaps add one?`);

    editWebhook({active:false})
      .then(fetchHandler)
      .then(() => {store[repo]['enabled'] = false})
      .then(() => writeStore(store))
      .then(() => listWebhooks())
      .catch((error) => {throw new Error(`webhook could not be disbled: ${error.toString()}`)});
    break;

  default:
    // console log out the help dialog
    console.log(help);
}

