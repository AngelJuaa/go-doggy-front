import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

export default function Inicio_Paseador({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity>
          <Text style={styles.navIcon}>☰</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.navIcon}>↩</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Inicio</Text>
      </View>

      <View style={styles.mapContainer}>
        <Image
          source={require("../../../assets/maps.png")}
          style={styles.mapImage}
        />
        <View style={styles.alertIcon}>
          <Text style={styles.alertText}>!</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Paseos disponibles</Text>
        <View style={styles.matchCard}>
          <Text style={styles.cardInfo}>User9673 - Garfield</Text>
          <TouchableOpacity style={styles.matchBtn}>
            <Text>🐾 MATCH</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomTab}>
        <Image
          source={require("../../../assets/casa.png")}
          style={styles.tabIconImg}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  navIcon: { fontSize: 28 },
  titleContainer: {
    alignSelf: "center",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 30,
    paddingVertical: 5,
    borderRadius: 20,
  },
  titleText: { fontSize: 22 },
  mapContainer: {
    width: "90%",
    height: 350,
    alignSelf: "center",
    marginTop: 20,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 3,
  },
  mapImage: { width: "100%", height: "100%", resizeMode: "cover" },
  alertIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "red",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  alertText: { color: "white", fontWeight: "bold", fontSize: 20 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: "bold" },
  matchCard: {
    backgroundColor: "#A3D9C9",
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  bottomTab: {
    flexDirection: "row",
    backgroundColor: "#A3D9C9",
    height: 75,
    position: "absolute",
    bottom: 0,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabIconImg: { width: 45, height: 45, resizeMode: "contain" },
});
