import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useEffect, useState } from "react";
import myEpicNft from './utils/MyEpicNFT.json';

import { ethers } from "ethers";
const TWITTER_HANDLE = 'BigBunny1400';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const CONTRACT_ADDRESS = "0xD29a79b289220DE44fa802FFdc3F06664507AAb4";
const openSeaLink = `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/token_id`;
const App = () => {

  const [currentAccount, setCurrentAccount] = useState("");
  const [hasMintedAnNFT, setHasMintedAnNFT] = useState(false)
  const [lastIdMinted, setLastIdMinted] = useState(0)
  const [userNFTId, setUserNFTId] = useState(0)
  const [totalAmountToBeMinted, setTotalAmountToBeMinted] = useState(0)

  useEffect(async () => {
    if (!currentAccount) return;
    const { ethereum } = window;

    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    try {
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);
      const lastIdMinted = await connectedContract.getCurrentAmountOfNFTsMinted();

      setLastIdMinted(parseInt(lastIdMinted._hex));
      const totalAmountToBeMinted = await connectedContract.getMaxAmountOfNFTsToMinted();
      setTotalAmountToBeMinted(parseInt(totalAmountToBeMinted._hex));
      console.log("Last id minted:", lastIdMinted);
      console.log("Total amount to be minted:", totalAmountToBeMinted);
    }
    catch (error) {
      console.log(error);
    }
  }, [currentAccount])

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener()
      setCurrentAccount(account)
    } else {
      console.log("No authorized account found")
    }
  }

  /*
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);

      // String, hex code of the chainId of the Rinkebey test network
      const rinkebyChainId = "0x4";
      if (chainId !== rinkebyChainId) {
        alert("You are not connected to the Rinkeby Test Network!");
      }

      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener()
    } catch (error) {
      console.log(error)
    }
  }
  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);
        console.log("Last id minted:", lastIdMinted);

        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.")
        await nftTxn.wait();

        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);


      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          setUserNFTId(tokenId.toNumber());
          setHasMintedAnNFT(true)
        });

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])


  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          <p>
            Make sure to connect using the Rinkeby Network 😏
          </p>
          <p className="gradient-text">
            {`${lastIdMinted}/${totalAmountToBeMinted} NFTs minted so far`}
          </p>
          {currentAccount === "" ? (
            <button onClick={connectWallet} className="cta-button connect-wallet-button">
              Connect to Wallet
            </button>
          ) : (
            !hasMintedAnNFT ? <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
              Mint NFT
            </button> : (
              <a href={openSeaLink.replace("token_id", userNFTId)} >
                <button style={{
                  marginLeft: "10px",
                }} className="cta-button connect-wallet-button">
                  Congrats! Now you can see your NFT on OpenSea
                </button>
              </a>
            )
          )}

        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;