#!/usr/bin/env node
import {readFile, writeFile} from 'node:fs/promises';
import Fuse from 'fuse.js';
import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import meow from 'meow';

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

const cli = meow(`
	Usage
	  $ scrooge <file>

	Examples
	  $ scrooge .beancount
`, {
    importMeta: import.meta,
});

const beancount = await readFile(cli.input[0], 'utf8');
const lines = beancount.split(/\r?\n/);
const accounts = [];

function searchAccounts(answers, input = '') {
    return new Promise(resolve => {
        const fuse = new Fuse(accounts);

        resolve(fuse.search(input).map(account => account.item));
    });
}

for (const [index, line] of lines.entries()) {
    const account = line.match(/open (.+)/);
    if (account) {
        accounts.push(account[1]);
    }

    const transaction = line.match(/\d+-\d+-\d+ \* "(.+)"/);
    if (transaction && !lines[index + 2]) {
        lines[index + 1] = lines[index + 1].replace(
            /(\d+)(\.)?(\d+)?/,
            (match, p1, p2, p3) => p1 + '.' + (p3 ? p3.padEnd(2, '0') : '00'),
        );

        console.log(`\n🫘 ${transaction[1]}`);
        console.log(`${lines[index + 1]}`);

        /* eslint-disable-next-line no-await-in-loop */
        const answer = await inquirer.prompt([{
            type: 'autocomplete',
            name: 'account',
            message: 'Account',
            source: searchAccounts,
        }]);

        lines.splice(index + 2, 0, `  ${answer.account}`);

        /* eslint-disable-next-line no-await-in-loop */
        await writeFile(cli.input[0], lines.join('\n'));
    }
}
