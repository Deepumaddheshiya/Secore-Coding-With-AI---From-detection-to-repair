class BankAccount {
private:
    double balance;

    void deductFees() {
        // Some code to deduct fees from the balance
    }

public:
    void deposit(double amount) {
        balance += amount;
    }

    double getBalance() {
        return balance;
    }
};
