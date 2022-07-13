import {prepareEnvironment} from '@gmrchk/cli-testing-library';

describe('scrooge', () => {
    it('should fail without any params', async () => {
        const {execute, cleanup} = await prepareEnvironment();

        const {code} = await execute(
            'node',
            './cli.js',
        );

        expect(code).toBe(1);

        await cleanup();
    });

    it('should replicate Beancount transactions', async () => {
        const {writeFile, spawn, readFile, cleanup} = await prepareEnvironment();

        await writeFile('.beancount', `
* Equity Accounts
1980-05-12 open Equity:Opening-Balances

* Expenses
1980-05-12 open Expenses:Home:Rent
1980-05-12 open Expenses:Home:Electricity
1980-05-12 open Expenses:Home:Internet
1980-05-12 open Expenses:Home:Phone
1980-05-12 open Expenses:Financial:Fees

* Banking
2020-01-01 open Assets:US:BofA
  address: "123 America Street, LargeTown, USA"
  institution: "Bank of America"
  phone: "+1.012.345.6789"
2020-01-01 open Assets:US:BofA:Checking                   USD
  account: "00234-48574897"

2020-01-01 * "Opening Balance for checking account"
  Assets:US:BofA:Checking                         3308.12 USD
  Equity:Opening-Balances                        -3308.12 USD

2020-01-02 balance Assets:US:BofA:Checking        3308.12 USD

2020-01-04 * "BANK FEES" "Monthly bank fee"
  Assets:US:BofA:Checking                           -4 USD

2020-01-04 * "RiverBank Properties" "Paying the rent"
  Assets:US:BofA:Checking                        -2400 USD

2020-01-09 * "EDISON POWER" ""
  Assets:US:BofA:Checking                          -65 USD

2020-01-18 * "Verizon Wireless" ""
  Assets:US:BofA:Checking                          -69.56 USD

2020-01-22 * "Wine-Tarner Cable" ""
  Assets:US:BofA:Checking                          -80.06 USD

2020-01-30 balance Assets:US:BofA:Checking         689.50 USD
        `);

        const {waitForText, writeText, wait, pressKey, waitForFinish, getExitCode} = await spawn(
            'node',
            './cli.js .beancount',
        );

        await waitForText('? Account');
        await writeText('Fees');
        await wait(10);
        await pressKey('enter');
        await waitForText('? Add additional posting?');
        await pressKey('enter');
        await waitForText('? Account');
        await writeText('Rent');
        await wait(10);
        await pressKey('enter');
        await waitForText('? Add additional posting?');
        await pressKey('enter');
        await waitForText('? Account');
        await writeText('Electricity');
        await wait(10);
        await pressKey('enter');
        await waitForText('? Add additional posting?');
        await pressKey('enter');
        await waitForText('? Account');
        await writeText('Phone');
        await wait(10);
        await pressKey('enter');
        await waitForText('? Add additional posting?');
        await pressKey('enter');
        await waitForText('? Account');
        await writeText('Internet');
        await wait(10);
        await pressKey('enter');
        await waitForText('? Add additional posting?');
        await pressKey('enter');
        await waitForFinish();

        expect(getExitCode()).toBe(0);
        expect(await readFile('.beancount')).toBe(`
* Equity Accounts
1980-05-12 open Equity:Opening-Balances

* Expenses
1980-05-12 open Expenses:Home:Rent
1980-05-12 open Expenses:Home:Electricity
1980-05-12 open Expenses:Home:Internet
1980-05-12 open Expenses:Home:Phone
1980-05-12 open Expenses:Financial:Fees

* Banking
2020-01-01 open Assets:US:BofA
  address: "123 America Street, LargeTown, USA"
  institution: "Bank of America"
  phone: "+1.012.345.6789"
2020-01-01 open Assets:US:BofA:Checking                   USD
  account: "00234-48574897"

2020-01-01 * "Opening Balance for checking account"
  Assets:US:BofA:Checking                         3308.12 USD
  Equity:Opening-Balances                        -3308.12 USD

2020-01-02 balance Assets:US:BofA:Checking        3308.12 USD

2020-01-04 * "BANK FEES" "Monthly bank fee"
  Assets:US:BofA:Checking                           -4.00 USD
  Expenses:Financial:Fees

2020-01-04 * "RiverBank Properties" "Paying the rent"
  Assets:US:BofA:Checking                        -2400.00 USD
  Expenses:Home:Rent

2020-01-09 * "EDISON POWER" ""
  Assets:US:BofA:Checking                          -65.00 USD
  Expenses:Home:Electricity

2020-01-18 * "Verizon Wireless" ""
  Assets:US:BofA:Checking                          -69.56 USD
  Expenses:Home:Phone

2020-01-22 * "Wine-Tarner Cable" ""
  Assets:US:BofA:Checking                          -80.06 USD
  Expenses:Home:Internet

2020-01-30 balance Assets:US:BofA:Checking         689.50 USD
        `);

        await cleanup();
    });
});
