// src/App.js

/* global BigInt */
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import simpleSwapAbi from "./SimpleSwapABI.json";

// Minimal ERC-20 ABI so we can call approve()
const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)"
];

function App() {
  // — State hooks —
  const [account, setAccount]             = useState("");
  const [price, setPrice]                 = useState("");
  const [reserves, setReserves]           = useState({ A: "0", B: "0" });
  const [amountIn, setAmountIn]           = useState("");
  const [estimatedOut, setEstimatedOut]   = useState("");
  const [estimatedOutWei, setEstimatedOutWei] = useState(0n);
  const [slippage, setSlippage]           = useState(1);      // % tolerance
  const [swapStatus, setSwapStatus]       = useState("");
  const [swapTxHash, setSwapTxHash]       = useState("");
  const [liqA, setLiqA]                   = useState("");
  const [liqB, setLiqB]                   = useState("");
  const [liqStatus, setLiqStatus]         = useState("");
  const [liqTxHash, setLiqTxHash]         = useState("");
  const [removeAmount, setRemoveAmount]   = useState("");
  const [removeResult, setRemoveResult]   = useState({ A: null, B: null });

  // — Sepolia addresses —
  const tokenA   = "0xc3C4B92ccD54E42e23911F5212fE628370d99e2E";
  const tokenB   = "0x19546E766F5168dcDbB1A8F93733fFA23Aa79D52";
  const swapAddr = "0xBfBe54b54868C37034Cfa6A8E9E5d045CC1B8278";

  // — Connect wallet & switch network to Sepolia —
  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not detected");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }]
      });
    } catch {}
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
  }

  // — Load reserves whenever account or after liquidity change —
  useEffect(() => {
    if (!account) return;
    (async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const swap = new ethers.Contract(swapAddr, simpleSwapAbi, provider);
      const [rA, rB] = await swap.getReserves(tokenA, tokenB);
      setReserves({
        A: ethers.formatEther(rA),
        B: ethers.formatEther(rB)
      });
    })();
  }, [account, liqTxHash]);

  // — Show price —
  async function showPrice() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const swap = new ethers.Contract(swapAddr, simpleSwapAbi, provider);
    const raw  = await swap.getPrice(tokenA, tokenB);
    setPrice(ethers.formatEther(raw));
  }

  // — Estimate swap output on input change —
  async function onInChange(e) {
    const val = e.target.value;
    setAmountIn(val);
    setSwapStatus(""); setSwapTxHash("");
    if (!val || !account) {
      setEstimatedOut("");
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const swap = new ethers.Contract(swapAddr, simpleSwapAbi, provider);
    const [rA, rB] = await swap.getReserves(tokenA, tokenB);
    const rawOut   = await swap.getAmountOut(
      ethers.parseEther(val),
      rA, rB
    );
    setEstimatedOutWei(rawOut);
    setEstimatedOut(ethers.formatEther(rawOut));
  }

  // — Perform swap with slippage protection —
  async function doSwap() {
    if (!estimatedOutWei || !account) return;
    setSwapStatus(""); setSwapTxHash("");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }]
      });
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const inputWei = ethers.parseEther(amountIn);

      // approve
      const tokenAContract = new ethers.Contract(tokenA, erc20Abi, signer);
      const txA = await tokenAContract.approve(swapAddr, inputWei);
      await txA.wait();

      // calculate min output after slippage
      const minOut = (estimatedOutWei * BigInt(100 - slippage)) / 100n;

      // swap
      const swap = new ethers.Contract(swapAddr, simpleSwapAbi, signer);
      const tx   = await swap.swapExactTokensForTokens(
        inputWei,
        minOut,
        [tokenA, tokenB],
        account,
        0
      );
      setSwapStatus("Swapping…");
      const receipt = await tx.wait();
      setSwapStatus("Swap complete!");
      setSwapTxHash(receipt.transactionHash);
    } catch (err) {
      console.error(err);
      setSwapStatus("Swap failed: " + (err.message || err));
    }
  }

  // — Add liquidity —
  async function doAddLiquidity() {
    if (!liqA || !liqB || !account) return;
    setLiqStatus(""); setLiqTxHash("");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }]
      });
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const aWei = ethers.parseEther(liqA);
      const bWei = ethers.parseEther(liqB);

      // approve A
      const tokenAContract = new ethers.Contract(tokenA, erc20Abi, signer);
      const txA = await tokenAContract.approve(swapAddr, aWei);
      await txA.wait();
      // approve B
      const tokenBContract = new ethers.Contract(tokenB, erc20Abi, signer);
      const txB = await tokenBContract.approve(swapAddr, bWei);
      await txB.wait();

      // add liquidity
      const swap = new ethers.Contract(swapAddr, simpleSwapAbi, signer);
      const tx   = await swap.addLiquidity(
        tokenA, tokenB,
        aWei, bWei,
        0n, 0n,
        account,
        0
      );
      setLiqStatus("Adding liquidity…");
      const receipt = await tx.wait();
      setLiqStatus("Liquidity added!");
      setLiqTxHash(receipt.transactionHash);
    } catch (err) {
      console.error(err);
      setLiqStatus("Add liquidity failed: " + (err.message || err));
    }
  }

  // — Remove liquidity (stub) —
  async function doRemoveLiquidity() {
    if (!removeAmount || !account) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const swap = new ethers.Contract(swapAddr, simpleSwapAbi, provider);
    const liqWei = ethers.parseEther(removeAmount);
    const [outA, outB] = await swap.removeLiquidity(
      tokenA, tokenB,
      liqWei,
      0n, 0n,
      account,
      0
    );
    setRemoveResult({
      A: ethers.formatEther(outA),
      B: ethers.formatEther(outB)
    });
  }

  return (
    <div style={{ maxWidth: 420, margin: "auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1>SimpleSwap UI</h1>

      {/* Connect */}
      <button onClick={connectWallet}>
        {account ? "Sepolia Connected" : "Connect Wallet (Sepolia)"}
      </button>
      {account && <p>Account: {account}</p>}

      <hr />

      {/* Show Price */}
      <h2>Price</h2>
      <button onClick={showPrice}>Show Price of A in B</button>
      {price && <p>🔄 {price}</p>}

      <hr />

      {/* Display Reserves */}
      <h2>Pool Reserves</h2>
      <p>Token A: {reserves.A}</p>
      <p>Token B: {reserves.B}</p>

      <hr />

      {/* Swap */}
      <h2>Swap A → B</h2>
      <input
        type="number"
        placeholder="Amount of A"
        value={amountIn}
        onChange={onInChange}
        style={{ width: "100%", padding: 8, marginBottom: 6 }}
      />
      <p>Estimated B: {estimatedOut || "–"}</p>
      <label>
        Slippage tolerance (%):
        <input
          type="number"
          value={slippage}
          onChange={e => setSlippage(Number(e.target.value))}
          style={{ width: 60, marginLeft: 8 }}
        />
      </label>
      <button
        onClick={doSwap}
        disabled={!estimatedOut}
        style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
      >
        Swap
      </button>
      {swapStatus && <p>{swapStatus}</p>}
      {swapTxHash && (
        <p>
          <a
            href={`https://sepolia.etherscan.io/tx/${swapTxHash}`}
            target="_blank" rel="noreferrer"
          >
            View swap tx on Etherscan
          </a>
        </p>
      )}

      <hr />

      {/* Add Liquidity */}
      <h2>Add Liquidity</h2>
      <input
        type="number"
        placeholder="Amount A"
        value={liqA}
        onChange={e => setLiqA(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 6 }}
      />
      <input
        type="number"
        placeholder="Amount B"
        value={liqB}
        onChange={e => setLiqB(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 6 }}
      />
      <button
        onClick={doAddLiquidity}
        disabled={!liqA || !liqB}
        style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
      >
        Add Liquidity
      </button>
      {liqStatus && <p>{liqStatus}</p>}
      {liqTxHash && (
        <p>
          <a
            href={`https://sepolia.etherscan.io/tx/${liqTxHash}`}
            target="_blank" rel="noreferrer"
          >
            View liquidity tx on Etherscan
          </a>
        </p>
      )}

      <hr />

      {/* Remove Liquidity (stub) */}
      <h2>Remove Liquidity</h2>
      <input
        type="number"
        placeholder="LP Token Amount"
        value={removeAmount}
        onChange={e => setRemoveAmount(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 6 }}
      />
      <button
        onClick={doRemoveLiquidity}
        disabled={!removeAmount}
        style={{ display: "block", width: "100%", padding: 10 }}
      >
        Remove Liquidity
      </button>
      {removeResult.A !== null && (
        <p>
          You will get A: {removeResult.A}, B: {removeResult.B}
        </p>
      )}
    </div>
  );
}

export default App;
