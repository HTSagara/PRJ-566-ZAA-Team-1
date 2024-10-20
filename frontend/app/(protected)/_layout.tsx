import { useState, useEffect } from 'react';
import { Redirect, Slot } from 'expo-router';

import { User, getUser, AuthContext } from '@/utilities/auth';
import Loading from '@/components/Loading';

export default function DrawerLayout() {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function init() {

      console.log('inside protected init()')

      const user = await getUser();
      setUser(user);
      setLoading(false);

      if (!user) {
        console.info('No user was found');
        return;
      }

      // Log the user info for debugging purposes
      console.log({ user }, 'User Info');
    }

    init();
  }, []);

  if (loading) {
    return <Loading message='Fetching user...'/>
  }

  else if (!user) {
    return <Redirect href="/" />;
  }

  else {
    return (
      <AuthContext.Provider value={user}>
        <Slot />
      </AuthContext.Provider>
    );
  }
}
