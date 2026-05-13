import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "./PerfilUsuarioStyles";

export default function PerfilUsuario({ navigation }) {
  const [userName, setUserName] = useState("Usuario");
  const [userImage, setUserImage] = useState(require("../../../assets/perfil.png"));
  const [hoveredTab, setHoveredTab] = useState(null);

  useEffect(() => {
    const usuarioStr = localStorage.getItem("usuario");
    if (usuarioStr) {
      const usuario = JSON.parse(usuarioStr);
      const nombreCompleto = usuario.nombre_completo.split(" ");
      const primerNombre = nombreCompleto[0] || "Usuario";
      const primerApellido = nombreCompleto[1] || "";
      setUserName(`${primerNombre} ${primerApellido}`.trim());
      if (usuario.url_foto_perfil) {
        setUserImage({ uri: `http://localhost:3000/uploads/${usuario.url_foto_perfil}` });
      }
    }
  }, []);
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
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
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

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Cabecera del Perfil */}
        <View style={styles.profileSection}>
          <View style={styles.userNameContainer}>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
          <Image
            source={userImage}
            style={styles.profileImage}
          />
        </View>

        <View style={styles.optionsList}>
          {opciones.map((opcion) => (
            <TouchableOpacity
              key={opcion.id}
              style={styles.optionItem}
              onPress={() => handlePress(opcion)} // Disparador del clic
            >
              <Text style={{ fontSize: 24, marginRight: 20 }}>
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
          onPress={() => {/* Navegar a Mapa */}}
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
          onPress={() => {/* Navegar a Notificaciones */}}
        >
          {hoveredTab === 3 && <Text style={styles.tabLabel}>Notificaciones</Text>}
          <Image
            source={require("../../../assets/Notificaciones.png")}
            style={styles.tabIconImg}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
