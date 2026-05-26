import { expect, test } from '@playwright/test';
import { ManagerPage } from '../page-objects/manager-page';
import { CustomerPage } from '../page-objects/customer-page';
import { accNewCust } from '../test-data/customer.data';
import { CommonPage, DEFAULT_TIMEOUT } from '../utils/common';
let commonPage: CommonPage;
const fullName = `${accNewCust.firstName} ${accNewCust.lastName}`;

test.describe('Customer Page Tests', () => {
    let customerPage: CustomerPage;
    let managerPage: ManagerPage;

    test.beforeEach(async ({ page }) => {
        customerPage = new CustomerPage(page);
        managerPage = new ManagerPage(page);
        commonPage = new CommonPage(page);
        await commonPage.navigatePage();
    });
  

    async function setupCustomerSession(currency: string) {
        await commonPage.switchPage("manager");
        await managerPage.addCustomer(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode);
        await managerPage.openAccount(fullName, currency);
        await commonPage.backToHomePage();
        await commonPage.switchPage('customer');
        await commonPage.selectCustomerByName(fullName);
        await customerPage.btnLogin.click();
    };

    test('[Customer-01] - Customer successful login and view account information correctly', async () => {
        await commonPage.switchPage("manager");
        expect(await managerPage.addCustomer(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode)).toContain('Customer added successfully');

        //first currency is INR, second account is USD and third account is GBP
        expect(await managerPage.openAccount(fullName, accNewCust.currencies.inr)).toContain('Account created successfully');
        expect(await managerPage.openAccount(fullName, accNewCust.currencies.usd)).toContain('Account created successfully');
        expect(await managerPage.openAccount(fullName, accNewCust.currencies.gbp)).toContain('Account created successfully');

        //get account number from the table to verify with the account number in the customer page after login
        await managerPage.btnCustomers.click();
        let customerRow = await managerPage.findCustomerRowInTable(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode)
        expect(customerRow).not.toBeNull();
        let accountNumber = customerRow?.[3] ?? ''
        const accountList = accountNumber.trim().split(/\s+/); // example  = [ '1016', '1017', '1018' ]
        expect(accountList.length).toBe(3); // should have 3 accounts

        //login as customer 
        await commonPage.backToHomePage();
        await commonPage.switchPage('customer');
        await expect(customerPage.btnLogin).not.toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await commonPage.selectCustomerByName(fullName);
        await expect(customerPage.btnLogin).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await customerPage.btnLogin.click();

        //check default account info after login
        await expect(customerPage.page.getByText("Welcome " + fullName + " !!")).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        //default show the first added account which is INR account on the option list
        await expect(customerPage.accountSelect.locator('option:checked')).toHaveText(accountList[0], { timeout: DEFAULT_TIMEOUT });

        //check the buttons and account information are displayed correctly after login
        await expect(customerPage.btnTransactions).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.btnDeposit).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.btnWithdrawl).toBeVisible({ timeout: DEFAULT_TIMEOUT });

        await expect(customerPage.accountNumber).toHaveText(accountList[0]);//show correct account number after login
        await expect(customerPage.balance).toHaveText('0');//initial balance should be 0 after login for newly created account
        await expect(customerPage.currency).toHaveText(accNewCust.currencies.inr); //show correct currency 


        //this account list from customer table should be the same as the account list in the dropdown
        //if not means there is an issue with showing the account list in the dropdown after login
        const options = await customerPage.accountSelect.locator('option').all();
        const totalAccount = accountList.length;

        for (let i = 0; i < totalAccount; i++) {
            await expect(options[i]).toHaveText(accountList[i]);
            await customerPage.accountSelect.selectOption({ label: accountList[i] });

            if (i === 0) {
                await expect(customerPage.accountNumber).toHaveText(accountList[i]);
                await expect(customerPage.currency).toHaveText(accNewCust.currencies.inr, { timeout: DEFAULT_TIMEOUT });
            }

            if (i === 1) {
                await expect(customerPage.accountNumber).toHaveText(accountList[i]);
                await expect(customerPage.currency).toHaveText(accNewCust.currencies.usd, { timeout: DEFAULT_TIMEOUT })
            }

            if (i === 2) {
                await expect(customerPage.accountNumber).toHaveText(accountList[i]);
                await expect(customerPage.currency).toHaveText(accNewCust.currencies.gbp, { timeout: DEFAULT_TIMEOUT })
            }
        }

    });

    //update on logout persist
    test('[Customer-02] - Customer without account number login', async () => {
        await commonPage.switchPage("manager");
        expect(await managerPage.addCustomer(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode)).toContain('Customer added successfully');

        //login as customer 
        await commonPage.backToHomePage();
        await commonPage.switchPage('customer');
        await commonPage.selectCustomerByName(fullName);
        await customerPage.btnLogin.click();

        //check default account info after login
        await expect(customerPage.page.getByText("Welcome " + fullName + " !! Please open an account with us.")).toBeVisible({ timeout: DEFAULT_TIMEOUT });

        //check the buttons and account information not available
        await expect(customerPage.accountSelect).not.toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.btnTransactions).not.toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.btnDeposit).not.toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.btnWithdrawl).not.toBeVisible({ timeout: DEFAULT_TIMEOUT });
    });

    test('[Customer-03] - Deposit works correctly for user with multiple accounts', async () => {
        await commonPage.switchPage("manager");
        expect(await managerPage.addCustomer(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode)).toContain('Customer added successfully');

        //first currency is USD, second account is INR and third account is GBP
        let usdAccMcj = await managerPage.openAccount(fullName, accNewCust.currencies.usd);
        let inrAccMcj = await managerPage.openAccount(fullName, accNewCust.currencies.inr);
        let gbpAccMcj = await managerPage.openAccount(fullName, accNewCust.currencies.gbp);

        //get account number from the customer table 
        await managerPage.btnCustomers.click();
        let customerRow = await managerPage.findCustomerRowInTable(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode)
        expect(customerRow).not.toBeNull();
        let accountNumber = customerRow?.[3] ?? ''
        const accountList = accountNumber.trim().split(/\s+/); //[ '1016', '1017', '1018' ]
        expect(accountList.length).toBe(3); // should have 3 accounts

        //login as customer
        await commonPage.backToHomePage();
        await commonPage.switchPage('customer');
        await commonPage.selectCustomerByName(fullName);
        await customerPage.btnLogin.click();

        //select first account which is USD account and deposit amount
        //initial state balance should be 0
        await customerPage.selectCustomerAccount(accountList[0]);
        await expect(customerPage.accountSelect.locator('option:checked')).toHaveText(accountList[0], { timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.accountNumber).toHaveText(accountList[0]);
        await expect(customerPage.balance).toHaveText('0');
        await expect(customerPage.currency).toHaveText(accNewCust.currencies.usd);

        //deposit amount and verify the success message and updated balance after deposit
        await customerPage.deposit('1000');
        await expect(customerPage.page.getByText('Deposit Successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT });

        //state after deposit should be updated with the deposited amount
        await expect(customerPage.balance).toHaveText('1000'); //only this balance updated
        await expect(customerPage.accountNumber).toHaveText(accountList[0]); //show correct account number after deposit
        await expect(customerPage.currency).toHaveText(accNewCust.currencies.usd); //show correct currency after deposit

        //switch other account(Rupees) and verify the balance is not affected by the deposit in the first account
        await customerPage.selectCustomerAccount(accountList[1]);
        await expect(customerPage.accountSelect.locator('option:checked')).toHaveText(accountList[1], { timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.accountNumber).toHaveText(accountList[1]);
        await expect(customerPage.balance).toHaveText('0');//balance ni should not be updated with the deposit in the first account
        await expect(customerPage.currency).toHaveText(accNewCust.currencies.inr);

        //switch 3rd account(Pound) and verify the balance is not affected by the deposit in the first account
        await customerPage.selectCustomerAccount(accountList[2]);
        await expect(customerPage.accountSelect.locator('option:checked')).toHaveText(accountList[2], { timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.accountNumber).toHaveText(accountList[2]);
        await expect(customerPage.balance).toHaveText('0');//balance ni should not be updated with the deposit in the first account
        await expect(customerPage.currency).toHaveText(accNewCust.currencies.gbp);
    });

    test('[Customer-04] - Validate & prevent empty/invalid deposit amounts', async () => {
        await setupCustomerSession(accNewCust.currencies.inr);

        await customerPage.btnDeposit.click();
        await customerPage.formdepositBtn.click();//submit without fill up deposit amount
        expect(await commonPage.getTooltip(customerPage.page.getByPlaceholder('amount'))).toBe('Please fill out this field.');

        await expect(customerPage.balance).toHaveText('0');//original balance after login should be 0
        await customerPage.deposit('5.5');
        expect(await commonPage.getTooltip(customerPage.page.getByPlaceholder('amount'))).toBe('Please enter a valid value. The two nearest valid values are 5 and 6.'); //form validation message for input type number


        await customerPage.page.getByPlaceholder('amount').fill('0');
        await customerPage.formdepositBtn.click();
        expect(await commonPage.getTooltip(customerPage.page.getByPlaceholder('amount'))).toBe(''); //no validation message

        await customerPage.page.getByPlaceholder('amount').fill('-1');
        await customerPage.formdepositBtn.click();
        expect(await commonPage.getTooltip(customerPage.page.getByPlaceholder('amount'))).toBe(''); //no validation message

        await expect(customerPage.balance).toHaveText('0'); //balance should not be updated with invalid deposit amount
    });

    test('[Customer-05] - Withdraw success - valid amount', async () => {
        await commonPage.switchPage("manager");
        expect(await managerPage.addCustomer(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode)).toContain('Customer added successfully');

        //open account with GBP currency
        await managerPage.openAccount(fullName, accNewCust.currencies.gbp);

        await managerPage.btnCustomers.click();
        let customerRow = await managerPage.findCustomerRowInTable(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode)
        expect(customerRow).not.toBeNull();
        let listAccNumber = customerRow?.[3] ?? ''
        const accountList = listAccNumber.trim().split(/\s+/); //[ '1016', '1017', '1018' ]
        expect(accountList.length).toBe(1); // should have only 1 account

        //login as customer
        await commonPage.backToHomePage();
        await commonPage.switchPage('customer');
        await commonPage.selectCustomerByName(fullName);
        await customerPage.btnLogin.click();

        //select the only account which is GBP account and deposit amount       
        await customerPage.selectCustomerAccount(accountList[0]);
        await expect(customerPage.accountSelect.locator('option:checked')).toHaveText(accountList[0], { timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.accountNumber).toHaveText(accountList[0]);
        await expect(customerPage.balance).toHaveText('0'); //initial state balance should be 0
        await expect(customerPage.currency).toHaveText(accNewCust.currencies.gbp);

        //deposit amount
        let depositAmount = 1000
        await customerPage.deposit(depositAmount.toString());
        await expect(customerPage.page.getByText('Deposit Successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.balance).toHaveText('1000'); //balance should not be updated with the invalid withdraw amount

        //withdraw valid amount
        let withdrawAmount = 500;
        await customerPage.withdraw(withdrawAmount.toString());
        await expect(customerPage.page.getByText('Transaction successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.balance).toHaveText((depositAmount - withdrawAmount).toString()); //balance should be updated with the withdrawn amount

    });

    test('[Customer-06] - Withdraw Failed - invalid amount', async () => {
        await commonPage.switchPage("manager");
        expect(await managerPage.addCustomer(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode)).toContain('Customer added successfully');

        //open account with GBP currency
        await managerPage.openAccount(fullName, accNewCust.currencies.gbp);

        await managerPage.btnCustomers.click();
        let customerRow = await managerPage.findCustomerRowInTable(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode)
        expect(customerRow).not.toBeNull();
        let listAccNumber = customerRow?.[3] ?? ''
        const accountList = listAccNumber.trim().split(/\s+/); //[ '1016', '1017', '1018' ]
        expect(accountList.length).toBe(1); // should have only 1 account

        //login as customer
        await commonPage.backToHomePage();
        await commonPage.switchPage('customer');
        await commonPage.selectCustomerByName(fullName);
        await customerPage.btnLogin.click();

        //select first account which is GBP account and deposit amount       
        await customerPage.selectCustomerAccount(accountList[0]);
        await expect(customerPage.accountSelect.locator('option:checked')).toHaveText(accountList[0], { timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.accountNumber).toHaveText(accountList[0]);
        await expect(customerPage.balance).toHaveText('0'); //initial state balance should be 0
        await expect(customerPage.currency).toHaveText(accNewCust.currencies.gbp);

        //try to withdraw with balance 0 and verify the error message
        await customerPage.withdraw('1');
        await expect(customerPage.page.getByText('Transaction Failed. You can not withdraw amount more than the balance')).toBeVisible({ timeout: DEFAULT_TIMEOUT });

        await expect(customerPage.balance).toHaveText('0'); //balance should not be updated with the invalid withdraw amount

        //deposit amount
        let depositAmount = 100
        await customerPage.deposit(depositAmount.toString());
        await expect(customerPage.page.getByText('Deposit Successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.balance).toHaveText(depositAmount.toString()); //balance should be updated with the deposited amount

        //try to withdraw with amount more than balance and verify the error message
        await customerPage.withdraw((depositAmount + 10).toString());
        await expect(customerPage.page.getByText('Transaction Failed. You can not withdraw amount more than the balance')).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.balance).toHaveText(depositAmount.toString()); //balance should not be updated with the invalid withdraw amount       
    });

    test('[Customer-07] - Should prevent empty/invalid withdrawal amounts', async () => {
        await setupCustomerSession(accNewCust.currencies.gbp);

        //deposit some amount to have balance in the account before testing the withdraw with empty amount field
        await customerPage.deposit('100');
        await expect(customerPage.page.getByText('Deposit Successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.balance).toHaveText('100'); //balance should be updated with the deposited amount

        await customerPage.btnWithdrawl.click();
        await customerPage.formWithdrawBtn.click();//empty
        expect(await commonPage.getTooltip(customerPage.page.getByPlaceholder('amount'))).toBe('Please fill out this field.'); // form validation message
        await expect(customerPage.balance).toHaveText('100'); //balance should not be updated with invalid withdraw amount

        await customerPage.withdraw('5.5');
        expect(await commonPage.getTooltip(customerPage.page.getByPlaceholder('amount'))).toBe('Please enter a valid value. The two nearest valid values are 5 and 6.'); //HTML5 form validation message for input type number      

        await customerPage.page.getByPlaceholder('amount').fill('0');
        await customerPage.formWithdrawBtn.click();
        expect(await commonPage.getTooltip(customerPage.page.getByPlaceholder('amount'))).toBe(''); //no validation message  

        await customerPage.page.getByPlaceholder('amount').fill('-1');
        await customerPage.formWithdrawBtn.click();
        expect(await commonPage.getTooltip(customerPage.page.getByPlaceholder('amount'))).toBe(''); //no validation message    
        // balance should not be updated with invalid withdraw amount
        await expect(customerPage.balance).toHaveText('100');
    });

    test('[Customer-08] - Transaction correctly show for success/failed transaction (Credit/Debit)', async () => {
        await commonPage.switchPage("manager");
        expect(await managerPage.addCustomer(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode)).toContain('Customer added successfully');

        //add 2 account number to current customer
        expect(await managerPage.openAccount(fullName, accNewCust.currencies.inr)).toContain('Account created successfully');
        expect(await managerPage.openAccount(fullName, accNewCust.currencies.usd)).toContain('Account created successfully');

        //get account number from the table
        await managerPage.btnCustomers.click();
        let customerRow = await managerPage.findCustomerRowInTable(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode)
        expect(customerRow).not.toBeNull();
        let accountNumber = customerRow?.[3] ?? ''
        const accountList = accountNumber.trim().split(/\s+/); // example  = [ '1016', '1017', '1018' ]
        expect(accountList.length).toBe(2); // should have 2 accounts

        //login as customer 
        await commonPage.backToHomePage();
        await commonPage.switchPage('customer');
        await commonPage.selectCustomerByName(fullName);
        await customerPage.btnLogin.click();

        //select first account which is repee account and deposit amount
        //initial state balance should be 0
        await customerPage.selectCustomerAccount(accountList[0]);
        await expect(customerPage.accountSelect.locator('option:checked')).toHaveText(accountList[0], { timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.accountNumber).toHaveText(accountList[0]);
        await expect(customerPage.balance).toHaveText('0');
        await expect(customerPage.currency).toHaveText(accNewCust.currencies.inr);

        //initial state : no transaction table shown
        await customerPage.btnTransactions.click()
        await expect(commonPage.tableRow).toHaveCount(0);

        await customerPage.btnBack.click()
        //1st transaction : Failed
        await customerPage.withdraw('1');
        await expect(customerPage.page.getByText('Transaction Failed. You can not withdraw amount more than the balance')).toBeVisible({ timeout: DEFAULT_TIMEOUT });

        //2nd transaction : Success
        await customerPage.deposit('500'); //add money
        await expect(customerPage.page.getByText('Deposit Successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT })
        await expect(customerPage.balance).toHaveText('500', { timeout: DEFAULT_TIMEOUT }); //balance updated

        //3rd transaction : Success
        await customerPage.deposit('200'); //add money
        await expect(customerPage.page.getByText('Deposit Successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT })
        await expect(customerPage.balance).toHaveText('700', { timeout: DEFAULT_TIMEOUT }); //balance updated

        //4th transaction : Success
        await customerPage.withdraw('300') //withdraw money
        await expect(customerPage.page.getByText('Transaction successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.balance).toHaveText('400', { timeout: DEFAULT_TIMEOUT }); //balance should be updated with the withdrawn amount

        await customerPage.page.waitForTimeout(1000)
        customerPage.btnTransactions.click() //go in transaction page
        await expect(commonPage.tableRow).toHaveCount(3, { timeout: DEFAULT_TIMEOUT }); // current total row = 3 (failed not logged)

        //check transacation log
        const rows = await Promise.all([0, 1, 2].map(i => commonPage.tableRow.nth(i).locator('td').allTextContents()));
        // Row 1
        const [date1, amount1, type1] = rows[0];
        expect(amount1).toBe('500');
        expect(type1).toBe('Credit');

        // Row 2
        const [date2, amount2, type2] = rows[1];
        expect(amount2).toBe('200');
        expect(type2).toBe('Credit');

        // Row 3
        const [date3, amount3, type3] = rows[2];
        expect(amount3).toBe('300');
        expect(type3).toBe('Debit');

        await customerPage.btnBack.click()
        await customerPage.selectCustomerAccount(accountList[1]); //switch to 2nd account of current customer
        await expect(customerPage.accountSelect.locator('option:checked')).toHaveText(accountList[1], { timeout: DEFAULT_TIMEOUT });
        await expect(customerPage.accountNumber).toHaveText(accountList[1]);
        await expect(customerPage.balance).toHaveText('0'); //balance not affected
        await expect(customerPage.currency).toHaveText(accNewCust.currencies.usd);

        await customerPage.btnTransactions.click()
        await expect(commonPage.tableRow).toHaveCount(0);
    });

    test('[Customer-09] - Transaction filter work correctly)', async () => {
        await commonPage.switchPage("manager");
        expect(await managerPage.addCustomer(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode)).toContain('Customer added successfully');

        //add an account number to current customer
        expect(await managerPage.openAccount(fullName, accNewCust.currencies.usd)).toContain('Account created successfully');

        //login as customer 
        await commonPage.backToHomePage();
        await commonPage.switchPage('customer');
        await commonPage.selectCustomerByName(fullName);
        await customerPage.btnLogin.click();

        await expect(customerPage.balance).toHaveText('0');
        await expect(customerPage.currency).toHaveText(accNewCust.currencies.usd);

        //1st transaction : Success
        await customerPage.deposit('500'); //add money
        await expect(customerPage.page.getByText('Deposit Successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT })
        await customerPage.page.waitForTimeout(1000)

        //2nd transaction : Success
        await customerPage.withdraw('300') //withdraw money
        await expect(customerPage.page.getByText('Transaction successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await customerPage.page.waitForTimeout(1000)

        //3rd transaction : Success
        await customerPage.deposit('200'); //add money
        await expect(customerPage.page.getByText('Deposit Successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT })
        await expect(customerPage.balance).toHaveText('400', { timeout: DEFAULT_TIMEOUT }); //balance updated
        await customerPage.page.waitForTimeout(1000)

        customerPage.btnTransactions.click() //go in transaction page
        await expect(commonPage.tableRow).toHaveCount(3, { timeout: DEFAULT_TIMEOUT }); // current total row = 3 

        let rows = await customerPage.getTransactionRows(commonPage.tableRow);
        const firstRow = rows[0] //data row 1
        const middleRow = rows[1] //data row 2
        const lastRow = rows[2]; //data row 3

        await customerPage.btnStartTime.fill(customerPage.convert(lastRow.date)) //input filter date on start only
        rows = await customerPage.getTransactionRows(commonPage.tableRow);
        await expect(commonPage.tableRow).toHaveCount(1, { timeout: DEFAULT_TIMEOUT }); //result 1 row only
        expect(rows[0]).toEqual({ date: lastRow.date, amount: lastRow.amount, type: lastRow.type }); // verify correct transaction shown


        await customerPage.btnStartTime.fill(customerPage.convert(firstRow.date))//input filter date on start 
        const d = new Date(new Date(customerPage.convert(middleRow.date)).getTime() + 1000);
        const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
        await customerPage.btnEndTime.fill(end)//input filter date on end

        rows = await customerPage.getTransactionRows(commonPage.tableRow);
        await expect(commonPage.tableRow).toHaveCount(2, { timeout: DEFAULT_TIMEOUT });//result 2 row only
        expect(rows[0]).toEqual({ date: firstRow.date, amount: firstRow.amount, type: firstRow.type });// verify correct transaction shown
        expect(rows[1]).toEqual({ date: middleRow.date, amount: middleRow.amount, type: middleRow.type });

    });

    test('[Customer-10] - Transaction reset & Logout)', async () => {
        await commonPage.switchPage("manager");
        expect(await managerPage.addCustomer(accNewCust.firstName, accNewCust.lastName, accNewCust.postCode)).toContain('Customer added successfully');

        //add an account number to current customer
        expect(await managerPage.openAccount(fullName, accNewCust.currencies.usd)).toContain('Account created successfully');

        //login as customer 
        await commonPage.backToHomePage();
        await commonPage.switchPage('customer');
        await commonPage.selectCustomerByName(fullName);
        await customerPage.btnLogin.click();

        await expect(customerPage.balance).toHaveText('0');
        await expect(customerPage.currency).toHaveText(accNewCust.currencies.usd);

        //1st transaction : Success
        await customerPage.deposit('500'); //add money
        await expect(customerPage.page.getByText('Deposit Successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT })
       

        //2nd transaction : Success
        await customerPage.withdraw('300') //withdraw money
        await expect(customerPage.page.getByText('Transaction successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT });

        //3rd transaction : Success
        await customerPage.deposit('200'); //add money
        await expect(customerPage.page.getByText('Deposit Successful')).toBeVisible({ timeout: DEFAULT_TIMEOUT })
        await expect(customerPage.balance).toHaveText('400', { timeout: DEFAULT_TIMEOUT }); //balance updated
         await customerPage.page.waitForTimeout(1000)

        customerPage.btnTransactions.click() //go in transaction page
        await expect(commonPage.tableRow).toHaveCount(3, { timeout: DEFAULT_TIMEOUT }); // current total row = 3 

        await customerPage.btnReset.click()
        await expect(commonPage.tableRow).toHaveCount(0, { timeout: DEFAULT_TIMEOUT }); // current total row = 0

        await customerPage.btnBack.click()
        await expect(customerPage.balance).toHaveText('0');

        //logout and login back, transaction history no change from previous state
        await customerPage.btnLogout.click()
        await commonPage.selectCustomerByName(fullName);
        await customerPage.btnLogin.click();
        await expect(customerPage.balance).toHaveText('0');
        customerPage.btnTransactions.click() //go in transaction page
        await expect(commonPage.tableRow).toHaveCount(0, { timeout: DEFAULT_TIMEOUT }); // current total row = 0
    });
});