import { useMemo } from "react";
import { useDAOMemberAddresses } from "./use-dao-member-addresses.hook";
import { useMemberTokenAmounts } from "./use-member-token-amounts.hook";

export function useDAOMemberTokenAmounts() {
  const { data: memberAddresses } = useDAOMemberAddresses();
  const { data: memberTokenAmounts } = useMemberTokenAmounts();

  // Now, we combine the memberAddresses and memberTokenAmounts into a single array
  return {
    data: useMemo(() => {
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
    }, [memberAddresses, memberTokenAmounts]),
  };
}
