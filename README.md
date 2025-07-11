# SimpleSwap UI

A React front-end for interacting with the SimpleSwap smart contract deployed on the Sepolia testnet. This UI lets you:

* Connect your MetaMask wallet
* Query the current price of Token A in terms of Token B
* Swap Token A for Token B
* Add liquidity to the A–B pool
* Remove liquidity from the pool

---

## 📸 Demo

![SimpleSwap UI Screenshot](screenshot.png)

---

## 🛠 Tech Stack

* **Smart Contracts:** Solidity 0.8.20, Hardhat
* **Testing:** Mocha, Chai, solidity-coverage
* **Ethereum Lib:** ethers.js
* **Frontend:** React (Create React App)

---

## 🔧 Prerequisites

1. Node.js v16+ and npm
2. MetaMask browser extension
3. Sepolia testnet tokens for Token A and Token B

---

## ⚙️ Setup & Configuration

1. **Clone & install**

   ```bash
   git clone https://github.com/GuillermoSiaira/simpleswap-ui.git
   cd simpleswap-ui
   npm install
   ```

2. **Environment variables**
   Create a file named `.env` at the project root with the following contents:

   ```ini
   REACT_APP_TOKEN_A=0xc3C4B92ccD54E42e23911F5212fE628370d99e2E
   REACT_APP_TOKEN_B=0x19546E766F5168dcDbB1A8F93733fFA23Aa79D52
   REACT_APP_SWAP_ADDRESS=0xBfBe54b54868C37034Cfa6A8E9E5d045CC1B8278
   ```

---

## 🚀 Running Locally

* **Start Dev Server**

  ```bash
  npm start
  ```

  Opens [http://localhost:3000/](http://localhost:3000/) in your browser.

* **Build for Production**

  ```bash
  npm run build
  ```

---

## 📜 Available Scripts

* `npm start` — Launches the development server
* `npm run build` — Bundles the app into the `build/` folder
* `npm test` — Runs the React test suite
* `npm run coverage` — Generates Solidity coverage report via Hardhat

---

## 🖥 Usage Guide

1. **Connect Wallet**

   * Click **"Connect Wallet"** and authorize in MetaMask (Sepolia network).

2. **Price Query**

   * Click **"Show Price of A in B"** to fetch the on-chain price.

3. **Swap A → B**

   * Enter the amount of Token A.
   * Specify slippage tolerance (default 1%).
   * Click **"Swap"** to execute the transaction.
   * Confirmation message appears on success.

4. **Add Liquidity**

   * Enter desired amounts of Token A and Token B.
   * Click **"Add Liquidity"** to mint LP tokens and update reserves.

5. **Remove Liquidity**

   * (If implemented) enter LP amount and click **"Remove Liquidity"**.

---

## 📊 Coverage Report

After running tests and coverage:

```bash
npx hardhat coverage
```

Open `coverage/index.html` in your browser to see:

* **Statements:** 98% covered
* **Branches:** 79% covered
* **Functions:** 92% covered
* **Lines:** 98% covered

This report lives in the `coverage/` folder of the contract project.

---

## ☁️ Live Deployment

Front-end is deployed on Vercel:

[https://simpleswap-jonufvl4y-guillermosiairas-projects.vercel.app](https://simpleswap-jonufvl4y-guillermosiairas-projects.vercel.app)

---

## 📝 License

This project is licensed under the MIT License. Feel free to reuse and adapt!
