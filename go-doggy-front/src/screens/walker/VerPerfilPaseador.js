import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "./VerPerfilPaseadorStyle";
import { API_URL } from "../../utils/api";
import storage from "../../utils/storage";

export default function VerPerfilPaseador({ navigation }) {
  const [perfil, setPerfil] = useState({});
  const [userImage, setUserImage] = useState(require("../../../assets/perfil.png"));
  const [fullName, setFullName] = useState("Paseador");

  useEffect(() => {
    const paseadorStr = storage.getItem("paseador");
    if (!paseadorStr) return;

    try {
      const data = JSON.parse(paseadorStr);
      setPerfil(data || {});

      const nombre = data.nombre || "";
      const apellido = data.apellido || "";
      const nombreCompleto = `${nombre} ${apellido}`.trim();
      setFullName(nombreCompleto || data.nombre_completo || "Paseador");

      if (data.url_foto_perfil) {
        setUserImage({ uri: `${API_URL}/uploads/${data.url_foto_perfil}` });
      }
    } catch (error) {
      console.warn("No se pudo parsear paseador almacenado", error);
    }
  }, []);

  const tarifa = Number(perfil.tarifa_base_hora || perfil.tarifa || perfil.tarifa_hora || 0).toFixed(2);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>↩</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileBox}>
          <Image source={userImage} style={styles.profileImage} />
          <Text style={styles.nameText}>{fullName}</Text>
          <Text style={styles.roleText}>Paseador</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Información del paseador</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre completo</Text>
            <Text style={styles.infoValue}>{fullName}</Text>
          </View>
          {perfil.biografia ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Biografía</Text>
              <Text style={styles.infoValue}>{perfil.biografia}</Text>
            </View>
          ) : null}
          {perfil.zona_operacion ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Zona de operación</Text>
              <Text style={styles.infoValue}>{perfil.zona_operacion}</Text>
            </View>
          ) : null}
          {perfil.telefono ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{perfil.telefono}</Text>
            </View>
          ) : null}
          {perfil.correo ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Correo</Text>
              <Text style={styles.infoValue}>{perfil.correo}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tarifa por hora</Text>
            <Text style={styles.infoValue}>${tarifa}</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={() => navigation.navigate("EditarPerfilPaseador")}
          >
            <Text style={styles.buttonText}>Editar perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.closeButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("InicioPaseador") }>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PaseosPaseador") }>
          <Text style={styles.tabIcon}>✅</Text>
          <Text style={styles.tabLabel}>Paseos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("NotificacionesPaseador") }>
          <Text style={styles.tabIcon}>🔔</Text>
          <Text style={styles.tabLabel}>Notificaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PerfilPaseador") }>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={styles.tabLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
