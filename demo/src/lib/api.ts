// Demo stub: preserve the production username-check contract.
import { delay, demoFailure } from "./demo-state";
export const api = {
  checkUsername: async (username: string) => {
    await delay(username === "taken" ? 700 : 250);
    if (demoFailure("username"))
      throw new Error("Availability check unavailable");
    return {
      available: !["taken", "sportypunter", "admin"].includes(username),
    };
  },
};
