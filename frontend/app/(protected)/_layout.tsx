import { useState, useEffect } from "react";
import { Redirect, Slot } from "expo-router";

import Loading from "@/components/Loading";
import { User, getUser, AuthContext } from "@/utilities/authContext";
import { BookContext } from "@/utilities/bookContext";
import { type Book } from "@/utilities/backendService";

export default function DrawerLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [books, setBooks] = useState<Book[]>([]);
  const bookContext = { books, setBooks };

  useEffect(() => {
    async function init() {
      const user = await getUser();
      setUser(user);
      setLoading(false);

      if (!user) {
        console.info("No user was found");
        return;
      }

      // Log the user info for debugging purposes
      console.log({ user }, "User Info");
    }

    init();
  }, []);

  if (loading) {
    return <Loading message="Fetching user..." />;
  } else if (!user) {
    return <Redirect href="/" />;
  } else {
    return (
      <AuthContext.Provider value={user}>
        <BookContext.Provider value={bookContext}>
          <Slot />
        </BookContext.Provider>
      </AuthContext.Provider>
    );
  }
}
