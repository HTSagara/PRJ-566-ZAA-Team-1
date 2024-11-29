import { useState, useEffect, useContext } from "react";
import { View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedButton } from "@/components/ThemedButton";

import { Auth, AuthContext, User, getUser } from "@/utilities/authContext";

interface UserInfo {
  name: string;
  birthdate: string;
  email: string;
}

export default function user() {
  const backendApiUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL;

  const user = useContext(AuthContext) as User;

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [originalData, setOriginalData] = useState({
    name: "",
    birthdate: "",
    email: "",
  });

  useEffect(() => {
    async function init() {
      console.debug("inside user init()");

      const url = `${backendApiUrl}/user`;
      console.debug(`Calling GET ${url}...`);
      try {
        const res = await fetch(url, {
          headers: user.authorizationHeaders(),
        });

        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}`);
        }

        const data = (await res.json()) as UserInfo;
        console.debug("Successfully got user data", { data });

        setName(data.name);
        setBirthdate(data.birthdate);
        setEmail(data.email);
        setOriginalData(data); // Set the initial state
      } catch (err) {
        console.error("Unable to call GET /user", { err });
      }

      setLoading(false);
    }

    init();
  }, []);

  const handleSave = async () => {
    try {
      const url = `${backendApiUrl}/user`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          ...user.authorizationHeaders("application/json"),
        },
        body: JSON.stringify({ name, email, birthdate }),
      });

      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }

      console.debug("User details updated successfully");
      setEditMode(false);

      // Update original data
      setOriginalData({ name, email, birthdate });
    } catch (err) {
      console.error("Failed to update user details", { err });
    }
  };

  const handleCancel = () => {
    // Revert the state to the last saved original data
    setName(originalData.name);
    setBirthdate(originalData.birthdate);
    setEmail(originalData.email);
    setEditMode(false);
  };

  const handleDelete = async () => {
    // Ask for confirmation before deletion
    const confirmed = window.confirm(
      "So SAD to see you go :( Sure to DELETE your account?"
    );

    if (confirmed) {
      try {
        const user = await getUser();
        if (!user) {
          throw new Error("user is undefined");
        }
        const url = `${backendApiUrl}/user`;

        const res = await fetch(url, {
          method: "DELETE",
          headers: {
            ...user.authorizationHeaders(),
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}`);
        }

        console.log("User account deleted successfully");

        // Redirect to the landing page (reusing logout redirection logic)
        Auth.signOut();
      } catch (err) {
        console.error("Failed to delete user account", { err });
      }
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <Ionicons size={310} name="person-outline" style={styles.headerImage} />
      }
    >
      <ThemedView style={styles.centeredContainer}>
        <ThemedText type="title" style={styles.title}>
          User Profile
        </ThemedText>

        {loading ? (
          <View style={styles.inputContainer}>
            <ThemedText type="default">Loading user info...</ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.inputContainer}>
              <ThemedText type="default">Email</ThemedText>
              <ThemedTextInput
                style={styles.input}
                onChangeText={setEmail}
                value={email}
                editable={false}
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
              {editMode ? (
                <>
                  <ThemedButton
                    style={styles.button}
                    lightFg="white"
                    lightBg="rgb(34 197 94)"
                    darkFg="white"
                    darkBg="rgb(21 128 61)"
                    title="Save"
                    onPress={handleSave}
                  />
                  <ThemedButton
                    style={styles.button}
                    lightFg="white"
                    lightBg="rgb(185 28 28)"
                    darkFg="rgb(254 226 226)"
                    darkBg="rgb(248 113 113)"
                    title="Cancel"
                    onPress={handleCancel}
                  />
                </>
              ) : (
                <ThemedButton
                  style={styles.button}
                  lightFg="white"
                  lightBg="rgb(34 197 94)"
                  darkFg="white"
                  darkBg="rgb(21 128 61)"
                  title="Edit"
                  onPress={() => setEditMode(true)}
                />
              )}

              {!editMode && (
                <>
                  <ThemedButton
                    style={styles.button}
                    lightFg="white"
                    lightBg="rgb(34 197 94)"
                    darkFg="white"
                    darkBg="rgb(21 128 61)"
                    title="Sign Out"
                    onPress={() => Auth.signOut()}
                  />
                  <ThemedButton
                    style={styles.button}
                    lightFg="white"
                    lightBg="rgb(185 28 28)"
                    darkFg="rgb(254 226 226)"
                    darkBg="rgb(248 113 113)"
                    title="Delete"
                    onPress={handleDelete}
                  />
                </>
              )}
            </View>
          </>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },

  centeredContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  title: {
    textAlign: "center",
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
