import sdk from "./1-initialize-sdk.js";
import { readFileSync } from "fs";

const editionDrop = sdk.getEditionDrop(
  "0x58365BCf9cf7A3f2841cED9c66B97437c0310f20"
);

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
