// Demo stub (not production code): fakes the backend auth so the real pages run.
export function useAuth() {
  return {
    user: null as null | { username: string },
    loading: false,
    signup: async (_input: {
      username: string;
      email: string;
      password: string;
      referralCode?: string;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    },
    login: async (_identifier: string, _password: string) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    },
  };
}
