// Demo stub. Existing auth method signatures are preserved.
import { delay, demoFailure, readDemo, writeDemo } from "./demo-state";
export function useAuth() {
  return {
    user: readDemo<null | { username: string }>("user", null),
    loading: false,
    signup: async (input: {
      username: string;
      email: string;
      password: string;
      referralCode?: string;
    }) => {
      await delay(850);
      if (demoFailure("signup") || input.email === "error@example.com")
        throw new Error(
          "We couldn’t create your account. Your details are still here — please try again.",
        );
      if (["taken", "sportypunter", "admin"].includes(input.username))
        throw new Error("That username is taken. Please choose another.");
      writeDemo("user", { username: input.username });
      writeDemo("booking", null);
    },
    login: async (identifier: string, _password: string) => {
      await delay(850);
      if (demoFailure("login") || identifier === "error@example.com")
        throw new Error(
          "We couldn’t log you in. Check your username or email and password, then try again.",
        );
      writeDemo("user", { username: identifier.split("@")[0] });
    },
  };
}
