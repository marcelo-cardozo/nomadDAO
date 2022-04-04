import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";

// Import thirdweb provider and Rinkeby ChainId
import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import { WalletContextProvider } from "./WalletContext";

// This is the chainId your dApp will work on.
const activeChainId = ChainId.Rinkeby;

// Wrap your app with the thirdweb provider
ReactDOM.render(
  <React.StrictMode>
    <ThirdwebProvider desiredChainId={activeChainId}>
      <WalletContextProvider>
        <App />
      </WalletContextProvider>
    </ThirdwebProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
