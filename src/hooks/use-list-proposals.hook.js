import { useVote } from "@thirdweb-dev/react";
import { useEffect, useState } from "react";
import { VOTING_CONTRACT_ADDRESS } from "../constants";
import { useWalletContext } from "../WalletContext";

export function useListProposals() {
  const { hasClaimedNFT } = useWalletContext();
  const vote = useVote(VOTING_CONTRACT_ADDRESS);
  const [proposals, setProposals] = useState([]);

  // Retrieve all our existing proposals from the contract.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // A simple call to vote.getAll() to grab the proposals.
    const getAllProposals = async () => {
      try {
        const proposals = await vote.getAll();
        console.log("proposals:", proposals);
        setProposals(proposals);
      } catch (error) {
        console.log("failed to get proposals", error);
      }
    };
    getAllProposals();
  }, [hasClaimedNFT, vote]);

  return { data: proposals };
}
