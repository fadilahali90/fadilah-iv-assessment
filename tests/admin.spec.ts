import { expect, test } from '@playwright/test';
import { ManagerPage } from '../page-objects/manager-page';
import { CommonPage, DEFAULT_TIMEOUT } from '../utils/common';
import { accHarry, adminNewCust } from '../test-data/customer.data';
let commonPage: CommonPage;

test.describe('Manager Page Tests', () => {
    let managerPage: ManagerPage;
    test.beforeEach(async ({ page }) => {
        managerPage = new ManagerPage(page);
        commonPage = new CommonPage(page);
        await commonPage.navigatePage();
        await commonPage.switchPage("manager"); //Prerequisite to be in manager page
    });

    test('[Manager-01] - Login Manager', async () => {
        await expect(managerPage.btnAddCustomer).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(managerPage.btnOpenAccount).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(managerPage.btnCustomers).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    });

    test('[Manager-02] - Add a new customer successfully', async () => {
        await managerPage.btnCustomers.click();
        const existingCustomer = await managerPage.findCustomerRowInTable(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode);

        //delete customer if exist 
        if (existingCustomer) {
            await managerPage.deleteCustomer(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode);
        }

        // Test case for verifying the successful addition of a new customer
        expect(await managerPage.addCustomer(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode)).toContain('Customer added successfully');
        await managerPage.btnCustomers.click();
        expect(managerPage.getCustomerRow(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode)).toHaveCount(1);

        // same name,family name,different post code
        const postCode2 = '57101';
        expect(await managerPage.addCustomer(adminNewCust.firstName, adminNewCust.lastName, postCode2)).toContain('Customer added successfully');
        await managerPage.btnCustomers.click();
        expect(managerPage.getCustomerRow(adminNewCust.firstName, adminNewCust.lastName, postCode2)).toHaveCount(1);
    });
    test('[Manager-03] - Validate empty fields on Add Customer', async () => {
        await managerPage.btnAddCustomer.click();
        await managerPage.btnSubmitAddCustomer.click();

        expect(await commonPage.getTooltip(managerPage.txtFirstName)).toBe('Please fill out this field.');//error on first name
        await managerPage.txtFirstName.fill(adminNewCust.firstName);

        await managerPage.btnSubmitAddCustomer.click();
        expect(await commonPage.getTooltip(managerPage.txtFirstName)).toBe(''); //no more error on first name
        expect(await commonPage.getTooltip(managerPage.txtLastName)).toBe('Please fill out this field.'); //error on lastName
        await managerPage.txtLastName.fill(adminNewCust.lastName);

        await managerPage.btnSubmitAddCustomer.click();
        expect(await commonPage.getTooltip(managerPage.txtFirstName)).toBe('');
        expect(await commonPage.getTooltip(managerPage.txtLastName)).toBe('');
        expect(await commonPage.getTooltip(managerPage.txtPostCode)).toBe('Please fill out this field.');
    });

    test('[Manager-04] - Should not add a duplicate customer', async () => {
        await managerPage.btnCustomers.click();
        const existingCustomer = await managerPage.findCustomerRowInTable(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode);

        //if not exist then add customer
        if (!existingCustomer) {
            expect(await managerPage.addCustomer(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode)).toContain('Customer added successfully');
        }

        //create new same customer
        expect(await managerPage.addCustomer(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode)).toContain('Please check the details. Customer may be duplicate.');

        //check in customer table only 1 entry of the user added
        await managerPage.btnCustomers.click();
        expect(managerPage.getCustomerRow(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode)).toHaveCount(1); // should only have 1 entry for the customer
    });

    test('[Manager-05] - Delete an existing customer successfully', async () => {
        await managerPage.btnCustomers.click();
        const existingCustomer = await managerPage.findCustomerRowInTable(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode);

        //if not exist then add customer first before delete
        if (!existingCustomer) {
            expect(await managerPage.addCustomer(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode)).toContain('Customer added successfully');
        }

        await managerPage.btnCustomers.click();
        await managerPage.deleteCustomer(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode);
        expect(managerPage.getCustomerRow(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode)).toHaveCount(0);
    });

    test('[Manager-06] - Search Cutomer in table', async () => {
        expect(await managerPage.addCustomer(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode)).toContain('Customer added successfully');
        await managerPage.findCustomerRowInTable(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode);

        await managerPage.btnCustomers.click();
        let totalRow = await commonPage.tableRow.count()
        expect(totalRow).toBeGreaterThan(1) //should display all customer

        await managerPage.page.getByPlaceholder("Search Customer").fill(adminNewCust.firstName)
        totalRow = await commonPage.tableRow.count()
        expect(totalRow).toEqual(1)
        expect(managerPage.getCustomerRow(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode)).toHaveCount(1);
    });

    test('[Manager-07] - Open account for existing customer wth all currency', async () => {
        expect(await managerPage.addCustomer(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode)).toContain('Customer added successfully');
        let openAccountAlertMessage = await managerPage.openAccount(adminNewCust.firstName + ' ' + adminNewCust.lastName, adminNewCust.currencies.usd);
        expect(openAccountAlertMessage).toContain('Account created successfully');
        const accountNumberDollar = openAccountAlertMessage.match(/\d+$/)?.[0];

        //pound
        let openAccountAlertMessage2 = await managerPage.openAccount(adminNewCust.firstName + ' ' + adminNewCust.lastName, adminNewCust.currencies.gbp);
        expect(openAccountAlertMessage2).toContain('Account created successfully');
        const accountNumberPound = openAccountAlertMessage2.match(/\d+$/)?.[0];

        //rupee
        let openAccountAlertMessage3 = await managerPage.openAccount(adminNewCust.firstName + ' ' + adminNewCust.lastName, adminNewCust.currencies.inr);
        expect(openAccountAlertMessage3).toContain('Account created successfully');
        const accountNumberRupee = openAccountAlertMessage3.match(/\d+$/)?.[0];

        await managerPage.btnCustomers.click();
        let customerRow = await managerPage.findCustomerRowInTable(adminNewCust.firstName, adminNewCust.lastName, adminNewCust.postCode);
        await expect(customerRow).not.toBeNull();
        expect(customerRow?.[3]).toEqual(accountNumberDollar + " " + accountNumberPound + " " + accountNumberRupee); // check account number in table match
    });

    test('[Manager-08] - Validate empty fields on Open Account', async () => {
        await managerPage.btnOpenAccount.click();
        await managerPage.btnProcess.click();

        expect(await commonPage.getTooltip(commonPage.userSelect)).toBe('Please select an item in the list.');
        await commonPage.selectCustomerByName(accHarry.firstName + ' ' + accHarry.lastName);

        await managerPage.btnProcess.click();
        expect(await commonPage.getTooltip(commonPage.currencySelect)).toBe('Please select an item in the list.');

    });
});