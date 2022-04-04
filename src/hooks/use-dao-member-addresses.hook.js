import { useEditionDrop } from "@thirdweb-dev/react";
import { useEffect, useState } from "react";
import { DROP_ADDRESS } from "../constants";
import { useWalletContext } from "../WalletContext";

export function useDAOMemberAddresses() {
  const { hasClaimedNFT } = useWalletContext();
  const editionDrop = useEditionDrop(DROP_ADDRESS);

  // The array holding all of our members addresses.
  const [memberAddresses, setMemberAddresses] = useState([]);

  // This useEffect grabs all the addresses of our members holding our NFT.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // Grab the users who hold our NFT with tokenId 0.
    const getAllAddresses = async () => {
      try {
        const memberAddresses =
          await editionDrop.history.getAllClaimerAddresses(0);
        setMemberAddresses(memberAddresses);
        console.log("🚀 Members addresses", memberAddresses);
      } catch (error) {
        console.error("failed to get member list", error);
      }
    };
    getAllAddresses();
  }, [hasClaimedNFT, editionDrop.history]);

  return { data: memberAddresses };
}
