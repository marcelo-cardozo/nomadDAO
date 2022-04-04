import {
  ChainId,
  useAddress,
  useMetamask,
  useNetwork,
  useToken,
  useVote,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { GOV_TOKEN_ADDRESS, VOTING_CONTRACT_ADDRESS } from "./constants";
import { useDAOMemberTokenAmounts } from "./hooks/use-dao-member-amounts.hook";
import { useListProposals } from "./hooks/use-list-proposals.hook";
import { shortenAddress } from "./utils";
import { useWalletContext } from "./WalletContext";

const App = () => {
  const address = useAddress();
  const connectWithMetamask = useMetamask();
  const voteModule = useVote(VOTING_CONTRACT_ADDRESS);
  const tokenModule = useToken(GOV_TOKEN_ADDRESS);
  const network = useNetwork();

  const { hasClaimedNFT, mintNft, checkIfUserHasVoted } = useWalletContext();
  const { data: memberList } = useDAOMemberTokenAmounts();
  const { data: proposals } = useListProposals();

  const [hasVoted, setHasVoted] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  // We also need to check if the user already voted.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // If we haven't finished retrieving the proposals from the useEffect above
    // then we can't check if the user voted yet!
    if (!proposals.length) {
      return;
    }

    Promise.all(
      proposals
        .filter((proposal) => proposal.state === 1)
        .map((proposal) => checkIfUserHasVoted(proposal, address))
    )
      .then((result) => {
        if (result.indexOf(false) >= 0) {
          setHasVoted(false);
          console.log("🙂 User has not voted yet");
        } else {
          setHasVoted(true);
          console.log("🥵 User has already voted all proposals");
        }
      })
      .catch((error) => {
        console.error("Failed to check if wallet has voted", error);
      });
  }, [hasClaimedNFT, proposals, address, checkIfUserHasVoted]);

  console.log("👋 Address:", address);

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

  if (network?.[0].data.chain.id !== ChainId.Rinkeby) {
    return (
      <div className="unsupported-network">
        <h2>Please connect to Rinkeby</h2>
        <p>
          This dapp only works on the Rinkeby network, please switch networks in
          your connected wallet.
        </p>
      </div>
    );
  }

  const handleMintNFT = async () => {
    setIsClaiming(true);
    await mintNft();
    setIsClaiming(false);
  };

  if (hasClaimedNFT) {
    return (
      <div className="member-page">
        <h1>🛩️DAO Member Page</h1>
        <p>Congratulations on being a member</p>
        <div>
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
          <div>
            <h2>Active Proposals</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                //before we do async things, we want to disable the button to prevent double clicks
                setIsVoting(true);

                // lets get the votes from the form for the values
                const votes = proposals.map((proposal) => {
                  let voteResult = {
                    proposalId: proposal.proposalId,
                    //abstain by default
                    vote: 2,
                  };
                  proposal.votes.forEach((vote) => {
                    const elem = document.getElementById(
                      proposal.proposalId + "-" + vote.type
                    );

                    if (elem.checked) {
                      voteResult.vote = vote.type;
                      return;
                    }
                  });
                  return voteResult;
                });

                // first we need to make sure the user delegates their token to vote
                try {
                  // we'll check if the wallet still needs to delegate their tokens before they can vote
                  const delegation = await tokenModule.getDelegationOf(address);
                  // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
                  if (delegation === ethers.constants.AddressZero) {
                    //if they haven't delegated their tokens yet, we'll have them delegate them before voting
                    await tokenModule.delegateTo(address);
                  }
                  // then we need to vote on the proposals
                  try {
                    await Promise.all(
                      votes.map(async (vote) => {
                        // before voting we first need to check whether the proposal is open for voting
                        // we first need to get the latest state of the proposal
                        const proposal = await voteModule.get(vote.proposalId);
                        // then we check if the proposal is open for voting (state === 1 means it is open)
                        if (proposal.state === 1) {
                          // if it is open for voting, we'll vote on it
                          return voteModule.vote(vote.proposalId, vote.vote);
                        }
                        // if the proposal is not open for voting we just return nothing, letting us continue
                        return;
                      })
                    );
                    try {
                      // if any of the proposals are ready to be executed we'll need to execute them
                      // a proposal is ready to be executed if it is in state 4
                      await Promise.all(
                        votes.map(async (vote) => {
                          // we'll first get the latest state of the proposal again, since we may have just voted before
                          const proposal = await voteModule.get(
                            vote.proposalId
                          );

                          //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                          if (proposal.state === 4) {
                            return voteModule.execute(vote.proposalId);
                          }
                        })
                      );
                      // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
                      setHasVoted(true);
                      // and log out a success message
                      console.log("successfully voted");
                    } catch (err) {
                      console.error("failed to execute votes", err);
                    }
                  } catch (err) {
                    console.error("failed to vote", err);
                  }
                } catch (err) {
                  console.error("failed to delegate tokens");
                } finally {
                  // in *either* case we need to set the isVoting state to false to enable the button again
                  setIsVoting(false);
                }
              }}
            >
              <div className="proposals-wrapper">
                {proposals.map((proposal, index) => {
                  const proposalWasVoted = !proposal.votes.every((vote) =>
                    vote.count.isZero()
                  );
                  return (
                    <div key={proposal.proposalId} className="card">
                      <h5>{proposal.description}</h5>
                      <div>
                        {proposal.votes.map((vote) => (
                          <div key={vote.type}>
                            <input
                              type="radio"
                              id={proposal.proposalId + "-" + vote.type}
                              name={proposal.proposalId}
                              value={vote.type}
                              disabled={
                                proposalWasVoted || proposal.state !== 1
                              }
                              //default the "abstain" vote to chedked
                              defaultChecked={
                                (proposalWasVoted && !vote.count.isZero()) ||
                                (!proposalWasVoted && vote.type === 2)
                              }
                            />
                            <label
                              htmlFor={proposal.proposalId + "-" + vote.type}
                            >
                              {vote.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button disabled={isVoting || hasVoted} type="submit">
                {isVoting
                  ? "Voting..."
                  : hasVoted
                  ? "You Already Voted All Proposals"
                  : "Submit Votes"}
              </button>
              <small>
                This will trigger multiple transactions that you will need to
                sign.
              </small>
            </form>
          </div>
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
      <button disabled={isClaiming} onClick={handleMintNFT}>
        {isClaiming ? "Minting..." : "Mint your nft (FREE)"}
      </button>
    </div>
  );
};

export default App;
