import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedButton } from "@/components/ThemedButton";

import { Auth, getUser } from "@/utilities/auth";

interface UserInfo {
  name: string;
  birthdate: string;
  email: string;
}

export default function user() {

  const backendApiUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    async function init() {
      const user = await getUser();
      if (!user) {
        console.info('No user was found');
        return;
      }

      // Log the user info for debugging purposes
      console.log({ user }, 'User Creds');

      const url = `${backendApiUrl}/user`;
      console.debug(`Calling GET ${url}...`);

      try {
        const res = await fetch(url, {
          // Generate headers with the proper Authorization bearer token to pass.
          // We are using the `authorizationHeaders()` helper method we defined
          // earlier, to automatically attach the user's ID token.
          headers: user.authorizationHeaders(),
        });

        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}`);
        }

        const data = (await res.json()) as UserInfo;
        console.debug('Successfully got user data', { data });

        setName(data.name);
        setBirthdate(data.birthdate);
        setEmail(data.email);
      } 
      catch (err) {
        console.error('Unable to call GET /user', { err });
      }
    }

    init();
  }, []);


  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <Ionicons size={310} name="person-outline" style={styles.headerImage} />
      }
    >
      <ThemedView style={styles.centeredContainer}> 
        <ThemedText type="title" style={styles.title}>User Profile</ThemedText>

        <View style={styles.inputContainer}>
          <ThemedText type="default">Email</ThemedText>
          <ThemedTextInput
            style={styles.input}
            onChangeText={setEmail}
            value={email}
            editable={editMode}
          />
          <ThemedText type="default">Name</ThemedText>
          <ThemedTextInput
            style={styles.input}
            onChangeText={setName}
            value={name}
            editable={editMode}
          />
          <ThemedText type="default">Birthdate</ThemedText>
          <ThemedTextInput
            style={styles.input}
            onChangeText={setBirthdate}
            value={birthdate}
            editable={editMode}
          />
        </View>

        <View style={styles.buttonContainer}>
          <ThemedButton 
            style={styles.button}
            lightFg="white" lightBg="rgb(34 197 94)"
            darkFg="white" darkBg="rgb(21 128 61)"
            title="Edit"
            onPress={() => console.log("edit button")}/>

          <ThemedButton 
            style={styles.button}
            lightFg="white" lightBg="rgb(34 197 94)"
            darkFg="white" darkBg="rgb(21 128 61)"
            title="Log Out"
            onPress={() => Auth.signOut()}/>

          <ThemedButton 
            style={styles.button}
            lightFg="white" lightBg="rgb(185 28 28)"
            darkFg="rgb(254 226 226)" darkBg="rgb(248 113 113)"
            title="Delete"
            onPress={() => console.log("delete button")}/>
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
};

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },

  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20, 
  },

  title: {
    textAlign: 'center',
    fontSize: 20,
    paddingHorizontal: 16,
  },

  inputContainer: {
    width: 750,
    marginTop: 32,
  },

  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: 750,
    marginTop: 32,
  },

  button: {
    width: 150,
  },

});
