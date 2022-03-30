import sdk from "./1-initialize-sdk.js";
import { GOV_TOKEN_ADDRESS } from "./constants.js";

// This is the address of our ERC-20 contract printed out in the step before.
const token = sdk.getToken(GOV_TOKEN_ADDRESS);

(async () => {
  try {
    const amount = 21_000_000;
    // Interact with your deployed ERC-20 contract and mint the tokens!
    await token.mint(amount);
    const totalSupply = await token.totalSupply();

    // Print out how many of our token's are out there now!
    console.log(
      "✅ There now is",
      totalSupply.displayValue,
      "$NOMAD in circulation"
    );
  } catch (error) {
    console.error("Failed to print money", error);
  }
})();
