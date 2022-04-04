// A fancy function to shorten someones wallet address, no need to show the whole thing.
export const shortenAddress = (str) => {
  return str.substring(0, 6) + "..." + str.substring(str.length - 4);
};
