import {
  useAddress,
  useEditionDrop,
  useMetamask,
  useToken,
} from "@thirdweb-dev/react";
import { useEffect, useMemo, useState } from "react";
import { DROP_ADDRESS, GOV_TOKEN_ADDRESS } from "./constants";

function useDAOMemberAddresses({ hasClaimedNFT }) {
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
  return { memberAddresses };
}

function useMemberTokenAmounts({ hasClaimedNFT }) {
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
  return { memberTokenAmounts };
}

function useDAOMemberTokenAmounts({ hasClaimedNFT }) {
  const { memberAddresses } = useDAOMemberAddresses({ hasClaimedNFT });
  const { memberTokenAmounts } = useMemberTokenAmounts({ hasClaimedNFT });

  // Now, we combine the memberAddresses and memberTokenAmounts into a single array
  return useMemo(() => {
    return memberAddresses.map((address) => {
      // We're checking if we are finding the address in the memberTokenAmounts array.
      // If we are, we'll return the amount of token the user has.
      // Otherwise, return 0.
      const member = memberTokenAmounts?.find(
        ({ holder }) => holder === address
      );

      return {
        address,
        tokenAmount: member?.balance.displayValue || "0",
      };
    });
  }, [memberAddresses, memberTokenAmounts]);
}

const App = () => {
  // Use the hooks thirdweb give us.
  const address = useAddress();
  const connectWithMetamask = useMetamask();
  const editionDrop = useEditionDrop(DROP_ADDRESS);

  const [hasClaimedNFT, setHasClaimedNFT] = useState();
  const [isClaiming, setIsClaiming] = useState(false);
  const memberList = useDAOMemberTokenAmounts({ hasClaimedNFT });

  // A fancy function to shorten someones wallet address, no need to show the whole thing.
  const shortenAddress = (str) => {
    return str.substring(0, 6) + "..." + str.substring(str.length - 4);
  };

  console.log("👋 Address:", address);

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

  // This is the case where the user hasn't connected their wallet
  // to your web app. Let them call connectWallet.
  if (!address) {
    return (
      <div className="landing">
        <h1>Welcome to NomadDAO</h1>
        <button onClick={connectWithMetamask} className="btn-hero">
          Connect your wallet
        </button>
      </div>
    );
  }

  const mintNft = async () => {
    try {
      setIsClaiming(true);
      await editionDrop.claim("0", 1);
      console.log(
        `🌊 Successfully Minted! Check it out on OpenSea: https://testnets.opensea.io/assets/${editionDrop.getAddress()}/0`
      );
      setHasClaimedNFT(true);
    } catch (error) {
      setHasClaimedNFT(false);
      console.error("Failed to mint NFT", error);
    } finally {
      setIsClaiming(false);
    }
  };

  if (hasClaimedNFT) {
    return (
      <div className="member-page">
        <h1>🛩️DAO Member Page</h1>
        <p>Congratulations on being a member</p>
        <div>
          <h2>Member List</h2>
          <table className="card">
            <thead>
              <tr>
                <th>Address</th>
                <th>Token Amount</th>
              </tr>
            </thead>
            <tbody>
              {memberList.map((member) => {
                return (
                  <tr key={member.address}>
                    <td>{shortenAddress(member.address)}</td>
                    <td>{member.tokenAmount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (hasClaimedNFT == null)
    return (
      <div className="mint-nft">
        <h1>Loading...</h1>
      </div>
    );
  // This is the case where we have the user's address
  // which means they've connected their wallet to our site!
  return (
    <div className="mint-nft">
      <h1>Mint your free 🛩️DAO Membership NFT</h1>
      <button disabled={isClaiming} onClick={mintNft}>
        {isClaiming ? "Minting..." : "Mint your nft (FREE)"}
      </button>
    </div>
  );
};

export default App;
