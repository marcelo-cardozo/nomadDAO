import { useToken } from "@thirdweb-dev/react";
import { useEffect, useState } from "react";
import { GOV_TOKEN_ADDRESS } from "../constants";
import { useWalletContext } from "../WalletContext";

export function useMemberTokenAmounts() {
  const { hasClaimedNFT } = useWalletContext();
  const token = useToken(GOV_TOKEN_ADDRESS);

  // Holds the amount of token each member has in state.
  const [memberTokenAmounts, setMemberTokenAmounts] = useState([]);

  // This useEffect grabs the # of token each member holds.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    const getAllBalances = async () => {
      try {
        const amounts = await token.history.getAllHolderBalances();
        setMemberTokenAmounts(amounts);
        console.log("👜 Amounts", amounts);
      } catch (error) {
        console.error("failed to get member balances", error);
      }
    };
    getAllBalances();
  }, [hasClaimedNFT, token.history]);
  return { data: memberTokenAmounts };
}
