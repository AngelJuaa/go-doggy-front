import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { s, vs, ms } from "../../utils/responsive";
import storage from "../../utils/storage";
import { API_URL } from "../../utils/api";

export default function PerfilPaseador({ navigation }) {
  const [userName, setUserName] = useState("Paseador");
  const [userImage, setUserImage] = useState(require("../../../assets/perfil.png"));

  useEffect(() => {
    const usuarioStr = storage.getItem("usuario");
    if (usuarioStr) {
      const usuario = JSON.parse(usuarioStr);
      const nombre = usuario.nombre_completo?.split(" ").slice(0, 2).join(" ") || "Paseador";
      setUserName(nombre);
      if (usuario.url_foto_perfil) {
        setUserImage({ uri: `${API_URL}/uploads/${usuario.url_foto_perfil}` });
      }
    }
  }, []);

  const opciones = [
    { id: 0, nombre: "Editar perfil", icon: "👤", screen: "EditarPerfilPaseador" },
    { id: 1, nombre: "Historial paseos", icon: "📋", screen: "PaseosPaseador" },
    { id: 2, nombre: "Calificaciones", icon: "⭐", screen: "Calificaciones" },
    { id: 3, nombre: "Gráficas", icon: "📊", screen: "GananciasPaseador" },
    { id: 4, nombre: "Seguridad", icon: "🛡️", screen: "SeguridadUsuario" },
    { id: 5, nombre: "Ayuda", icon: "❓", screen: null },
    { id: 6, nombre: "Configuraciones", icon: "⚙️", screen: "ConfiguracionUsuario" },
    { id: 7, nombre: "Legal", icon: "⚖️", screen: "LegalUsuario" },
    { id: 8, nombre: "Cerrar sesión", icon: "🚪", screen: "Login" },
  ];

  const handlePress = (op) => {
    if (op.id === 8) {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } else if (op.screen) {
      navigation.navigate(op.screen);
    }
  };

  // Recargar datos del usuario al volver de editar perfil
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      const usuarioStr = storage.getItem("usuario");
      if (usuarioStr) {
        const usuario = JSON.parse(usuarioStr);
        const nombre = usuario.nombre_completo?.split(" ").slice(0, 2).join(" ") || "Paseador";
        setUserName(nombre);
        if (usuario.url_foto_perfil) {
          setUserImage({ uri: `${API_URL}/uploads/${usuario.url_foto_perfil}` });
        }
      }
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>↩</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: vs(90) }}>
        <View style={styles.profileSection}>
          <View style={styles.nameContainer}>
            <Text style={styles.nameText}>{userName}</Text>
          </View>
          <Image source={userImage} style={styles.profileImage} />
          <Text style={styles.roleTag}>🦮 Paseador</Text>
        </View>

        <View style={styles.optionsList}>
          {opciones.map((op) => (
            <TouchableOpacity key={op.id} style={styles.optionItem} onPress={() => handlePress(op)}>
              <Text style={{ fontSize: ms(22), marginRight: s(18) }}>{op.icon}</Text>
              <Text style={styles.optionText}>{op.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Inicio_paseador")}>
          <Text style={styles.tabIcon}>🏠</Text><Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PaseosPaseador")}>
          <Text style={styles.tabIcon}>✅</Text><Text style={styles.tabLabel}>Paseos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("NotificacionesUsuario")}>
          <Text style={styles.tabIcon}>🔔</Text><Text style={styles.tabLabel}>Notificaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
          <Text style={styles.tabIcon}>👤</Text><Text style={styles.tabLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  header: { paddingTop: vs(50), paddingHorizontal: s(20), alignItems: "flex-end" },
  back: { fontSize: ms(26) },
  profileSection: { alignItems: "center", marginBottom: vs(25) },
  nameContainer: { backgroundColor: "#FFF9E6", paddingHorizontal: s(35), paddingVertical: vs(9), borderRadius: s(25), marginBottom: vs(18) },
  nameText: { fontSize: ms(24), fontFamily: "serif" },
  profileImage: { width: s(140), height: s(140), borderRadius: s(70), borderWidth: 1, borderColor: "#000" },
  roleTag: { marginTop: vs(10), fontSize: ms(14), fontWeight: "bold", color: "#99D9C1" },
  optionsList: { paddingHorizontal: s(28) },
  optionItem: { flexDirection: "row", alignItems: "center", marginBottom: vs(18) },
  optionText: { fontSize: ms(18), fontWeight: "bold" },
  bottomTab: { flexDirection: "row", backgroundColor: "#99D9C1", height: vs(65), justifyContent: "space-around", alignItems: "center" },
  tabItem: { alignItems: "center", gap: vs(2) },
  tabIcon: { fontSize: ms(20) },
  tabLabel: { fontSize: ms(10), fontWeight: "bold", color: "#1A1A1A" },
});
