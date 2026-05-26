import { Page, Locator } from '@playwright/test';
type Transaction = {
    date: string;
    amount: string;
    type: string;
};

export class CustomerPage {
    readonly page: Page;
    readonly btnLogin: Locator;
    readonly btnLogout: Locator;
    readonly btnTransactions: Locator;
    readonly btnDeposit: Locator;
    readonly btnWithdrawl: Locator;
    readonly accountInfo: Locator;
    readonly accountNumber: Locator;
    readonly balance: Locator;
    readonly currency: Locator;
    readonly accountSelect: Locator;
    readonly formdepositBtn: Locator;
    readonly formWithdrawBtn: Locator;
    readonly amountInput: Locator;
    readonly btnBack: Locator;
    readonly btnReset: Locator
    readonly btnStartTime: Locator
    readonly btnEndTime: Locator


    constructor(page: Page) {
        this.page = page;
        this.btnLogin = this.page.getByRole('button', { name: 'Login' });
        this.btnLogout = this.page.getByRole('button', { name: 'Logout' });
        this.btnTransactions = this.page.getByRole('button', { name: 'Transactions' });
        this.btnDeposit = this.page.getByRole('button', { name: 'Deposit' });
        this.btnWithdrawl = this.page.getByRole('button', { name: 'Withdrawl' });
        this.accountInfo = this.page.locator('div.center', { hasText: 'Account Number' });
        this.accountNumber = this.accountInfo.locator('strong').nth(0);
        this.balance = this.accountInfo.locator('strong').nth(1);
        this.currency = this.accountInfo.locator('strong').nth(2);
        this.accountSelect = this.page.locator('#accountSelect');
        this.formdepositBtn = this.page.locator('form').getByRole('button', { name: 'Deposit' });
        this.formWithdrawBtn = this.page.locator('form').getByRole('button', { name: 'Withdraw' });
        this.amountInput = this.page.locator('form').getByPlaceholder('amount');
        this.btnBack = this.page.getByRole('button', { name: "Back" })
        this.btnReset = this.page.getByRole('button', { name: "Reset" })
        this.btnStartTime = this.page.locator('#start')
        this.btnEndTime = this.page.locator('#end')


    }

    async selectCustomerAccount(accNumber: string) {
        await this.accountSelect.click();
        await this.accountSelect.selectOption({ label: accNumber }); //select option by visible text
    }

    async deposit(amount: string) {
        await this.btnDeposit.first().click();
        await this.amountInput.fill(amount);
        await this.formdepositBtn.click();
    }

    async withdraw(amount: string) {
        await this.btnWithdrawl.click();
        await this.amountInput.fill(amount);
        await this.formWithdrawBtn.click();
    }

    async getTransactionRows(rowLocator: Locator): Promise<Transaction[]> {
        const count = await rowLocator.count();
        const rows: Transaction[] = [];

        for (let i = 0; i < count; i++) {
            const cols = rowLocator.nth(i).locator('td');

            rows.push({
                date: (await cols.nth(0).textContent())?.trim() ?? '',
                amount: (await cols.nth(1).textContent())?.trim() ?? '',
                type: (await cols.nth(2).textContent())?.trim() ?? '',
            });
        }

        return rows;
    }
    public convert(t: string) {
        const [monthStr, day, year, time, meridiem] = t.split(/[\s,]+/);

        const months: any = {
            Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
            Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
        };

        let [hh, mm, ss] = time.split(':').map(Number);

        if (meridiem === 'PM' && hh !== 12) hh += 12;
        if (meridiem === 'AM' && hh === 12) hh = 0;

        return `${year}-${String(months[monthStr.slice(0, 3)]).padStart(2, '0')}-${day.padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    }

}