import sdk from "./1-initialize-sdk.js";
import { readFileSync } from "fs";
import { DROP_ADDRESS } from "./constants.js";

const editionDrop = sdk.getEditionDrop(DROP_ADDRESS);

(async () => {
  try {
    await editionDrop.createBatch([
      {
        name: "Christ the Redeemer - Rio",
        description: "This NFT will give you access to NomadDAO!",
        image: readFileSync("scripts/assets/membership.png"),
      },
    ]);
    console.log("✅ Successfully created a new NFT in the drop!");
  } catch (error) {
    console.error("failed to create the new NFT", error);
  }
})();
