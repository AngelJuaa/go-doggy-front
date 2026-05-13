import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "./Inicio_clienteStyles";

export default function Inicio_cliente({ route, navigation }) {

  // ========================
  // ESTADOS
  // ========================
  const [mascotas, setMascotas] = useState([]);
  const [hoveredTab, setHoveredTab] = useState(null);

  // ========================
  // FUNCIONES
  // ========================
  const irPerfil = () => navigation.navigate("PerfilUsuario");
  const regresar = () => navigation.goBack();
  const irRegistroMascota = () => navigation.navigate("RegistroMascota");

  useFocusEffect(
    useCallback(() => {
      const cargarMascotas = async () => {
        try {
          // Obtener usuario de localStorage
          const usuarioGuardado = localStorage.getItem("usuario");
          if (!usuarioGuardado) {
            console.error("No hay usuario guardado en localStorage");
            setMascotas([]);
            return;
          }

          const usuario = JSON.parse(usuarioGuardado);
          const usuarioId = usuario.usuario_id;
          
          console.log("Cargando mascotas para usuario ID:", usuarioId);

          const response = await fetch(`http://localhost:3000/mascotas/${usuarioId}`);
          const data = await response.json();
          console.log("Mascotas cargadas:", data);
          setMascotas(data);
        } catch (error) {
          console.error("Error cargando mascotas:", error);
          setMascotas([]);
        }
      };
      cargarMascotas();
    }, [])
  );

  useEffect(() => {
    console.log("Estado mascotas:", mascotas);
  }, [mascotas]);

  // ========================
  // UI
  // ========================
  return (
    <View style={styles.container}>

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={irPerfil}>
          <Text style={styles.navIcon}>☰</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={regresar}>
          <Text style={styles.navIcon}>↩</Text>
        </TouchableOpacity>
      </View>

      {/* TÍTULO */}
      <Text style={styles.titleText}>Mis mascotas</Text>

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {mascotas.length === 0 ? (
          <View style={{ padding: 30, alignItems: "center" }}>
            <Text style={{ color: "#555" }}>No tienes mascotas registradas aún.</Text>
            <Text style={{ color: "#555" }}>Usa + para crear una nueva.</Text>
          </View>
        ) : (
          mascotas.map((mascota, index) => (
            <TouchableOpacity key={`${mascota.nombre}-${index}`} style={styles.petCard} onPress={() => navigation.navigate("MascotaDetalles", { mascota })}>
              <Image
                source={mascota.url_foto ? { uri: `http://localhost:3000/uploads/${mascota.url_foto}` } : require("../../../assets/perro1.jpg")}
                style={styles.petImage}
              />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{mascota.nombre}</Text>
                <Text style={styles.petDetails}>Animal: {mascota.raza}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* BOTÓN BUSCAR */}
        <TouchableOpacity style={styles.searchCircle}>
          <Text style={styles.searchText}>Buscar paseador</Text>
        </TouchableOpacity>

        {/* BOTÓN AGREGAR */}
        <TouchableOpacity style={styles.addButton} onPress={irRegistroMascota}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* BARRA INFERIOR */}
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