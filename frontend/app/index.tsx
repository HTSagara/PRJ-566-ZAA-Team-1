import {
  Image,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Redirect } from 'expo-router';

import { Auth, User, getUser } from '@/utilities/auth';

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function init() {
      const user = await getUser();
      if (!user) {
        console.info('No user was found');
        return;
      }
      setUser(user);

      // Log the user info for debugging purposes
      console.log({ user }, 'User Info');
    }

    init();
  }, []);

  if (user) {
    return <Redirect href="/library" />;
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/landingPage_image.jpg')}
        style={styles.Logo}
      />

      <View style={styles.headerRight}>
        <TouchableOpacity onPress={() => Auth.federatedSignIn()} style={styles.uploadButton}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.centerText}>Let's start a Journey of New gen Book Reader</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  Logo: {
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
  headerRight: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  uploadButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    position: 'absolute',
    top: '45%',
    left: '33%',
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  centerText: {
    color: "#FFFFFF",
    fontSize: 32, // Larger text
    fontWeight: "bold",
    textAlign: 'center',
  },
});

