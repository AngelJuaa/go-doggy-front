import React, { useState, useCallback, useRef } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "./styles/PerfilUsuarioStyles";
import { s, vs, ms } from "../../utils/responsive";
import storage from "../../utils/storage";
import { API_URL, apiFetch } from "../../utils/api";
import useToast from "../../utils/useToast";

export default function PerfilUsuario({ navigation }) {
  const [userName, setUserName] = useState("Usuario");
  const [userImage, setUserImage] = useState(
    require("../../../assets/perfil.png"),
  );
  const [hoveredTab, setHoveredTab] = useState(null);
  const [modalMascotas, setModalMascotas] = useState(false);
  const { showToast, ToastComponent } = useToast();
  const mascotasRef = useRef([]);

  useFocusEffect(
    useCallback(() => {
      const usuarioStr = storage.getItem("usuario");
      if (usuarioStr) {
        const usuario = JSON.parse(usuarioStr);
        const nombreCompleto = usuario.nombre_completo.split(" ");
        const primerNombre = nombreCompleto[0] || "Usuario";
        const primerApellido = nombreCompleto[1] || "";
        setUserName(`${primerNombre} ${primerApellido}`.trim());
        if (usuario.url_foto_perfil) {
          setUserImage({ uri: `${API_URL}/uploads/${usuario.url_foto_perfil}` });
        }
        // Cargar mascotas para poder navegar a editar
        apiFetch(`/mascotas/${usuario.usuario_id}`)
          .then((data) => { mascotasRef.current = data || []; })
          .catch(() => {});
      }
    }, []),
  );
  const opciones = [
    {
      id: 1,
      nombre: "Editar perfil",
      icon: "👤",
      screen: "EditarPerfilUsuario",
    },
    { id: 2, nombre: "Editar mascota", icon: "🐾", screen: "EditarMascota" },
    { id: 3, nombre: "Calificaciones", icon: "📋", screen: "Calificaciones" },
    { id: 4, nombre: "Billetera", icon: "💼", screen: "BilleteraUsuario" },
    { id: 5, nombre: "Seguridad", icon: "🛡️", screen: "SeguridadUsuario" },
    { id: 6, nombre: "Ayuda", icon: "❓", screen: "AyudaUsuario" },
    // (la ruta AyudaUsuario ya está registrada)
    {
      id: 7,
      nombre: "Configuraciones",
      icon: "⚙️",
      screen: "ConfiguracionUsuario",
    },
    { id: 8, nombre: "Legal", icon: "⚖️", screen: "LegalUsuario" },
    { id: 9, nombre: "Cerrar sesion", icon: "🚪", screen: "Login" },
  ];

  const handlePress = (opcion) => {
    if (opcion.screen) {
      if (opcion.id === 9) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      } else if (opcion.id === 2) {
        const mascotas = mascotasRef.current;
        if (!mascotas || mascotas.length === 0) {
          showToast("No tienes mascotas registradas.", "info");
        } else {
          setModalMascotas(true);
        }
      } else {
        navigation.navigate(opcion.screen);
      }
    } else {
      console.log(`La pantalla para ${opcion.nombre} aún no está definida.`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>↩</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: vs(90) }}>
        {/* Cabecera del Perfil */}
        <View style={styles.profileSection}>
          <View style={styles.userNameContainer}>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
          <Image source={userImage} style={styles.profileImage} />
        </View>

        <View style={styles.optionsList}>
          {opciones.map((opcion) => (
            <TouchableOpacity
              key={opcion.id}
              style={styles.optionItem}
              onPress={() => handlePress(opcion)} // Disparador del clic
            >
              <Text style={{ fontSize: ms(22), marginRight: s(18) }}>
                {opcion.icon}
              </Text>
              <Text style={styles.optionText}>{opcion.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(0)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(0)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("Inicio_cliente")}
        >
          {hoveredTab === 0 && <Text style={styles.tabLabel}>Inicio</Text>}
          <Image
            source={require("../../../assets/casa.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(1)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(1)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("Servicio_Cliente_Inicio")}
        >
          {hoveredTab === 1 && <Text style={styles.tabLabel}>Servicio</Text>}
          <Image
            source={require("../../../assets/puntos.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(2)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(2)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => {
            showToast("El mapa estará disponible pronto.", "info")
          }}
        >
          {hoveredTab === 2 && <Text style={styles.tabLabel}>Mapa</Text>}
          <Image
            source={require("../../../assets/maps.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(3)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(3)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("NotificacionesUsuario")}
        >
          {hoveredTab === 3 && (
            <Text style={styles.tabLabel}>Notificaciones</Text>
          )}
          <Image
            source={require("../../../assets/Notificaciones.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
      </View>
      {/* MODAL SELECTOR DE MASCOTAS */}
      <Modal
        visible={modalMascotas}
        transparent
        animationType="slide"
        onRequestClose={() => setModalMascotas(false)}
      >
        <View style={mStyles.overlay}>
          <View style={mStyles.sheet}>
            <Text style={mStyles.sheetTitle}>¿Qué mascota deseas editar?</Text>
            <ScrollView>
              {mascotasRef.current.map((m) => (
                <TouchableOpacity
                  key={m.mascota_id}
                  style={mStyles.mascotaItem}
                  onPress={() => {
                    setModalMascotas(false);
                    navigation.navigate("EditarMascota", { mascota: m });
                  }}
                >
                  <Image
                    source={
                      m.url_foto
                        ? { uri: `${API_URL}/uploads/${m.url_foto}` }
                        : require("../../../assets/perro1.jpg")
                    }
                    style={mStyles.mascotaImg}
                  />
                  <View style={mStyles.mascotaInfo}>
                    <Text style={mStyles.mascotaNombre}>{m.nombre}</Text>
                    <Text style={mStyles.mascotaRaza}>{m.raza || "Sin raza"}</Text>
                  </View>
                  <Text style={mStyles.mascotaArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={mStyles.cancelBtn}
              onPress={() => setModalMascotas(false)}
            >
              <Text style={mStyles.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {ToastComponent}
    </View>
  );
}

const mStyles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet:        { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "70%" },
  sheetTitle:   { fontSize: 17, fontWeight: "bold", color: "#333", marginBottom: 16, textAlign: "center" },
  mascotaItem:  { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  mascotaImg:   { width: 52, height: 52, borderRadius: 26, marginRight: 14, backgroundColor: "#eee" },
  mascotaInfo:  { flex: 1 },
  mascotaNombre:{ fontSize: 15, fontWeight: "bold", color: "#333" },
  mascotaRaza:  { fontSize: 13, color: "#888", marginTop: 2 },
  mascotaArrow: { fontSize: 22, color: "#99D9C1", fontWeight: "bold" },
  cancelBtn:    { marginTop: 16, alignItems: "center", paddingVertical: 12, backgroundColor: "#f5f5f5", borderRadius: 12 },
  cancelTxt:    { fontSize: 15, color: "#666", fontWeight: "600" },
});
