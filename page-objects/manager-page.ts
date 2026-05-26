import { Page, Locator } from '@playwright/test';
import { CommonPage } from '../utils/common';
let commonPage: CommonPage;

export class ManagerPage {
    readonly page: Page;
    readonly btnAddCustomer: Locator;
    readonly btnOpenAccount: Locator;
    readonly btnCustomers: Locator;
    readonly txtFirstName: Locator;
    readonly txtLastName: Locator
    readonly txtPostCode: Locator;
    readonly btnProcess: Locator;
    readonly btnSubmitAddCustomer: Locator;
    readonly customerTable: Locator;

    constructor(page: Page) {
        this.page = page;
        this.btnAddCustomer = this.page.getByRole('button', { name: 'Add Customer' });
        this.btnOpenAccount = this.page.getByRole('button', { name: 'Open Account' });
        this.btnCustomers = this.page.getByRole('button', { name: 'Customers' });
        this.txtFirstName = this.page.getByPlaceholder('First Name');
        this.txtLastName = this.page.getByPlaceholder('Last Name');
        this.txtPostCode = this.page.getByPlaceholder('Post Code');
        this.btnProcess = this.page.getByRole('button', { name: 'Process' });
        this.btnSubmitAddCustomer = this.page.locator('form[name="myForm"]').getByRole('button', { name: 'Add Customer' });
        this.customerTable = this.page.locator('table');
    }

    async addCustomer(firstName: string, lastName: string, postCode: string) {
        await this.btnAddCustomer.first().click();
        await this.txtFirstName.fill(firstName);
        await this.txtLastName.fill(lastName);
        await this.txtPostCode.fill(postCode);

        let alertMessage = '';
        this.page.once('dialog', async dialog => {
            alertMessage = dialog.message();
            await dialog.accept();
        });

        await this.btnSubmitAddCustomer.click();
        return alertMessage;
    }

    async openAccount(name: string, currency: string) {
        commonPage = new CommonPage(this.page);
        await this.btnOpenAccount.click();
        await commonPage.selectCustomerByName(name);
        await commonPage.selectCurrency(currency);

        let alertMessage = '';
        this.page.once('dialog', async dialog => {
            alertMessage = dialog.message();
            await dialog.accept();
        });

        await this.btnProcess.click();
        return alertMessage;
    }

    async findCustomerRowInTable(firstName: string, lastName: string, postCode: string) {
        const row = this.getCustomerRow(firstName, lastName, postCode);
        const count = await row.count();

        if (count === 0) {
            return null;
        }

        await row.first().waitFor({ state: 'visible', timeout: 10000 });
        const cols = await row.first().locator('td').allTextContents();

        return [
            (cols[0] ?? '').trim(),
            (cols[1] ?? '').trim(),
            (cols[2] ?? '').trim(),
            (cols[3] ?? '').trim()
        ];
    }

    public getCustomerRow(firstName: string, lastName: string, postCode: string) {
        const row = this.page
            .locator('tr')
            .filter({ has: this.page.locator('td', { hasText: firstName }) })

            .filter({ has: this.page.locator('td', { hasText: lastName }) })
            .filter({ has: this.page.locator('td', { hasText: postCode }) })
        return row;
    }

    async deleteCustomer(firstName: string, lastName: string, postCode: string) {
        const cust = this.getCustomerRow(firstName, lastName, postCode)
        await cust.getByRole('button', { name: 'Delete' }).click();
    }

}