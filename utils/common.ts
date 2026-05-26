import { Page, Locator, expect } from '@playwright/test';
export const DEFAULT_TIMEOUT = 10000;
export class CommonPage {
    readonly page: Page;
    readonly userSelect: Locator;
    readonly currencySelect: Locator;
    readonly btnHome: Locator;
    readonly btnCustLogin: Locator;
    readonly btnManagerLogin: Locator;
    readonly tableRow: Locator


    constructor(page: Page) {
        this.page = page;
        this.userSelect = this.page.locator('#userSelect');
        this.currencySelect = this.page.locator('#currency');
        this.btnHome = this.page.getByRole('button', { name: 'Home' });
        this.btnCustLogin = this.page.getByRole('button', { name: 'Customer Login' });
        this.btnManagerLogin = this.page.getByRole('button', { name: 'Bank Manager Login' });
        this.tableRow = this.page.locator('table.table tbody tr.ng-scope');
    }

    async backToHomePage() {
        await this.btnHome.click();
        await expect(this.btnCustLogin).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(this.btnManagerLogin).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await this.page.waitForURL(/login/);
    }

    async navigatePage() {
        await this.page.goto('./');
        await expect(this.page.getByText("XYZ Bank")).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    }

    async switchPage(role: string) {
        if (role === 'customer') {
            await this.btnCustLogin.click();
            await expect(this.page).toHaveURL(/customer/, { timeout: DEFAULT_TIMEOUT });
        }

        if (role === 'manager') {
            await this.btnManagerLogin.click();
            await expect(this.page).toHaveURL(/manager/, { timeout: DEFAULT_TIMEOUT });
        }

    }

    async getTooltip(locator: Locator) {
        return await locator.evaluate(
            (el: HTMLInputElement) => el.validationMessage
        );

    }

    async selectCustomerByName(name: string) {
        await this.userSelect.click();
        await this.userSelect.selectOption({ label: name });
        await expect(this.userSelect.locator('option:checked')).toHaveText(name, { timeout: DEFAULT_TIMEOUT }); // need to study how to use expect with select element
    }
    async selectCurrency(currency: string) {
        await this.currencySelect.click();
        await this.currencySelect.selectOption({ label: currency, value: currency });
        await expect(this.currencySelect.locator('option:checked')).toHaveText(currency, { timeout: DEFAULT_TIMEOUT }); // need to study how to use expect with select element
    }
}