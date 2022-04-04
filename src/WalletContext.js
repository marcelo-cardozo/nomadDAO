import { useAddress, useEditionDrop, useVote } from "@thirdweb-dev/react";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { DROP_ADDRESS, VOTING_CONTRACT_ADDRESS } from "./constants";

const WalletContext = createContext({
  hasClaimedNFT: false,
  mintNft: async () => {},
  checkIfUserHasVoted: async (proposal, address) => false,
});

export function WalletContextProvider({ children }) {
  const [hasClaimedNFT, setHasClaimedNFT] = useState(false);

  const address = useAddress();
  const vote = useVote(VOTING_CONTRACT_ADDRESS);
  const editionDrop = useEditionDrop(DROP_ADDRESS);

  useEffect(() => {
    if (!address) return;

    async function checkUserHasClamedNFT() {
      try {
        const balance = await editionDrop.balanceOf(address, 0);
        if (balance.gt(0)) {
          setHasClaimedNFT(true);
          console.log("🌟 this user has a membership NFT!");
        } else {
          setHasClaimedNFT(false);
          console.log("😭 this user doesn't have a membership NFT.");
        }
      } catch (error) {
        setHasClaimedNFT(false);
        console.error("Failed to get balance", error);
      }
    }

    checkUserHasClamedNFT();
  }, [address, editionDrop]);

  const mintNft = useCallback(async () => {
    try {
      await editionDrop.claim("0", 1);
      console.log(
        `🌊 Successfully Minted! Check it out on OpenSea: https://testnets.opensea.io/assets/${editionDrop.getAddress()}/0`
      );
      setHasClaimedNFT(true);
    } catch (error) {
      setHasClaimedNFT(false);
      console.error("Failed to mint NFT", error);
    }
  }, [editionDrop]);

  const checkIfUserHasVoted = useCallback(
    async (proposal, address) => {
      return await vote.hasVoted(proposal.proposalId, address);
    },
    [vote]
  );

  return (
    <WalletContext.Provider
      value={useMemo(
        () => ({ hasClaimedNFT, mintNft, checkIfUserHasVoted }),
        [hasClaimedNFT, mintNft, checkIfUserHasVoted]
      )}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("Component must be a child from WalletContextProvider");
  }
  return context;
}
