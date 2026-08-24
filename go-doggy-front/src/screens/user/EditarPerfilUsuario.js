import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { styles } from "./styles/EditarPerfilUsuarioStyles";
import { s, vs, ms } from "../../utils/responsive";
import storage from "../../utils/storage";
import { API_URL, apiFetch } from "../../utils/api";

export default function EditarPerfilUsuario({ navigation }) {
  const [perfil, setPerfil] = useState(null);
  const [direccion, setDireccion] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoPerfilAsset, setFotoPerfilAsset] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [coloniasDisponibles, setColoniasDisponibles] = useState([]);
  const [callesDisponibles, setCallesDisponibles] = useState([]);
  const [loadingDireccion, setLoadingDireccion] = useState(false);
  const [loadingCalles, setLoadingCalles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const usuarioStr = storage.getItem("usuario");
        if (!usuarioStr) return;

        const usuario = JSON.parse(usuarioStr);
        setPerfil(usuario);
        setFotoPerfil(usuario.url_foto_perfil ? `${API_URL}/uploads/${usuario.url_foto_perfil}` : null);

        const usuarioId = Number(usuario.usuario_id || 0);
        if (!usuarioId) return;

        const response = await fetch(`${API_URL}/direccion/usuario/${usuarioId}`);
        if (!response.ok) return;

        const direcciones = await response.json();
        setDireccion(Array.isArray(direcciones) ? direcciones[0] || null : null);
      } catch (error) {
        console.warn("No se pudo cargar el perfil:", error);
      }
    };

    cargarPerfil();
  }, []);

  const valor = (dato) => (dato === undefined || dato === null || dato === "" ? "Sin registro" : String(dato));

  const actualizarPerfil = (campo, nuevoValor) => {
    setPerfil((actual) => ({ ...actual, [campo]: nuevoValor }));
  };

  const actualizarDireccion = (campo, nuevoValor) => {
    setDireccion((actual) => ({ ...actual, [campo]: nuevoValor }));
  };

  const cargarCalles = async ({ codigoPostal, pais, estado, ciudad, colonia, latitud, longitud }) => {
    if (!codigoPostal || !pais || !estado || !ciudad) return;

    setLoadingCalles(true);
    try {
      const query = new URLSearchParams({
        codigo_postal: codigoPostal,
        pais,
        estado,
        ciudad,
      });

      if (colonia) query.append("colonia", colonia);
      if (latitud) query.append("latitud", String(latitud));
      if (longitud) query.append("longitud", String(longitud));

      const data = await apiFetch(`/direccion/calles?${query.toString()}`);
      setCallesDisponibles(data.calles || []);
    } catch (error) {
      console.warn("No se pudieron cargar las calles:", error);
      setCallesDisponibles([]);
    } finally {
      setLoadingCalles(false);
    }
  };

  const cargarDireccionPorCodigoPostal = async (codigoPostal) => {
    if (codigoPostal.length !== 5) return;

    setLoadingDireccion(true);
    setColoniasDisponibles([]);
    setCallesDisponibles([]);

    try {
      const data = await apiFetch(`/direccion/codigo-postal/${codigoPostal}`);
      const colonias = data.colonias || [];
      const coloniaInicial = colonias[0] || "";
      const datosDireccion = {
        codigo_postal: codigoPostal,
        pais: data.pais || "",
        estado: data.estado || "",
        ciudad: data.ciudad || "",
        colonia: coloniaInicial,
        calle: "",
        numero_calle: "",
        latitud: data.latitud || "",
        longitud: data.longitud || "",
      };

      setDireccion((actual) => ({ ...actual, ...datosDireccion }));
      setColoniasDisponibles(colonias);

      await cargarCalles({
        codigoPostal,
        pais: datosDireccion.pais,
        estado: datosDireccion.estado,
        ciudad: datosDireccion.ciudad,
        colonia: coloniaInicial,
        latitud: datosDireccion.latitud,
        longitud: datosDireccion.longitud,
      });
    } catch (error) {
      console.warn("No se pudo autocompletar el código postal:", error);
      setDireccion((actual) => ({
        ...actual,
        pais: "",
        estado: "",
        ciudad: "",
        colonia: "",
        calle: "",
        numero_calle: "",
      }));
    } finally {
      setLoadingDireccion(false);
    }
  };

  const cambiarCodigoPostal = (texto) => {
    const codigoPostal = texto.replace(/\D/g, "").slice(0, 5);
    actualizarDireccion("codigo_postal", codigoPostal);

    if (codigoPostal.length < 5) {
      setColoniasDisponibles([]);
      setCallesDisponibles([]);
      setDireccion((actual) => ({
        ...actual,
        pais: "",
        estado: "",
        ciudad: "",
        colonia: "",
        calle: "",
        numero_calle: "",
      }));
      return;
    }

    cargarDireccionPorCodigoPostal(codigoPostal);
  };

  const seleccionarColonia = async (colonia) => {
    actualizarDireccion("colonia", colonia);
    actualizarDireccion("calle", "");
    await cargarCalles({
      codigoPostal: direccion?.codigo_postal,
      pais: direccion?.pais,
      estado: direccion?.estado,
      ciudad: direccion?.ciudad,
      colonia,
      latitud: direccion?.latitud,
      longitud: direccion?.longitud,
    });
  };

  const seleccionarFoto = async () => {
    try {
      if (Platform.OS !== "web") {
        const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permiso.granted) {
          Alert.alert("Permiso denegado", "Se necesitan permisos para acceder a las fotos.");
          return;
        }
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!resultado.canceled) {
        const asset = resultado.assets[0];
        setFotoPerfil(asset.uri);
        setFotoPerfilAsset(asset);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo seleccionar la foto.");
    }
  };

  const guardarCambios = async () => {
    const usuarioId = Number(perfil?.usuario_id || 0);
    const nombreCompleto = String(perfil?.nombre_completo || perfil?.nombre || "").trim();
    const telefono = String(perfil?.telefono || "").trim();
    const correo = String(perfil?.email || perfil?.correo || "").trim();
    const camposDireccion = ["codigo_postal", "pais", "estado", "ciudad", "colonia", "calle", "numero_calle"];
    const direccionIncompleta = camposDireccion.some((campo) => !String(direccion?.[campo] || "").trim());

    if (!usuarioId || !nombreCompleto || !telefono || !correo) {
      setSaveStatus({ tipo: "error", texto: "Nombre, teléfono y correo son obligatorios." });
      Alert.alert("Datos incompletos", "Nombre, teléfono y correo son obligatorios.");
      return;
    }

    if (direccionIncompleta) {
      setSaveStatus({ tipo: "error", texto: "Completa los datos obligatorios de la dirección." });
      Alert.alert("Dirección incompleta", "Completa código postal, ubicación, colonia, calle y número exterior.");
      return;
    }

    setSaving(true);
    setSaveStatus(null);
    try {
      let perfilActualizado;
      if (fotoPerfilAsset?.uri) {
        const formData = new FormData();
        formData.append("nombre_completo", nombreCompleto);
        formData.append("telefono", telefono);
        formData.append("email", correo);

        const responseFoto = await fetch(fotoPerfilAsset.uri);
        const fotoBlob = await responseFoto.blob();
        formData.append("foto", fotoBlob, "perfil.jpg");

        const response = await fetch(`${API_URL}/usuario/${usuarioId}`, {
          method: "PUT",
          body: formData,
        });
        perfilActualizado = await response.json();
        if (!response.ok) {
          throw new Error(perfilActualizado.message || "No se pudo actualizar la fotografía.");
        }
      } else {
        perfilActualizado = await apiFetch(`/usuario/${usuarioId}`, {
          method: "PUT",
          body: JSON.stringify({
            nombre_completo: nombreCompleto,
            telefono,
            email: correo,
          }),
        });
      }

      const datosDireccion = {
        codigo_postal: String(direccion.codigo_postal).trim(),
        pais: String(direccion.pais).trim(),
        estado: String(direccion.estado).trim(),
        ciudad: String(direccion.ciudad).trim(),
        colonia: String(direccion.colonia).trim(),
        calle: String(direccion.calle).trim(),
        numero_calle: String(direccion.numero_calle).trim(),
        numero_interior: String(direccion.numero_interior || "").trim(),
        referencias_casa: String(direccion.referencias_casa || direccion.referencias_Casa || "").trim(),
        latitud: direccion.latitud || 0,
        longitud: direccion.longitud || 0,
      };

      const direccionActualizada = direccion.direccion_id
        ? await apiFetch(`/direccion/${direccion.direccion_id}`, {
            method: "PUT",
            body: JSON.stringify(datosDireccion),
          })
        : await apiFetch("/direccion", {
            method: "POST",
            body: JSON.stringify({ ...datosDireccion, usuario_id: usuarioId }),
          });

      const siguientePerfil = { ...perfil, ...perfilActualizado.usuario };
      storage.setItem("usuario", JSON.stringify(siguientePerfil));
      setPerfil(siguientePerfil);
      setFotoPerfil(siguientePerfil.url_foto_perfil ? `${API_URL}/uploads/${siguientePerfil.url_foto_perfil}` : fotoPerfil);
      setFotoPerfilAsset(null);
      setDireccion(direccionActualizada.direccion || { ...direccion, direccion_id: direccionActualizada.direccion_id });
      setIsEditing(false);
      setSaveStatus({ tipo: "success", texto: "Información actualizada exitosamente." });
      Alert.alert("Cambios guardados", "Tu perfil y dirección fueron actualizados.");
    } catch (error) {
      const mensaje = error.message || "Intenta nuevamente.";
      setSaveStatus({ tipo: "error", texto: mensaje });
      Alert.alert("No se pudieron guardar los cambios", mensaje);
    } finally {
      setSaving(false);
    }
  };

  const datosPerfil = [
    { etiqueta: "Nombre", valor: perfil?.nombre_completo || perfil?.nombre, editar: (texto) => actualizarPerfil("nombre_completo", texto) },
    { etiqueta: "Teléfono", valor: perfil?.telefono, editar: (texto) => actualizarPerfil("telefono", texto), teclado: "phone-pad" },
    { etiqueta: "Código postal", valor: direccion?.codigo_postal, editar: cambiarCodigoPostal, teclado: "number-pad", maxLength: 5, tipo: "codigoPostal" },
    { etiqueta: "País", valor: direccion?.pais, editar: (texto) => actualizarDireccion("pais", texto), bloqueado: true },
    { etiqueta: "Estado", valor: direccion?.estado, editar: (texto) => actualizarDireccion("estado", texto), bloqueado: true },
    { etiqueta: "Ciudad", valor: direccion?.ciudad, editar: (texto) => actualizarDireccion("ciudad", texto), bloqueado: true },
    { etiqueta: "Colonia", valor: direccion?.colonia, editar: seleccionarColonia, tipo: "colonia" },
    { etiqueta: "Calle", valor: direccion?.calle, editar: (texto) => actualizarDireccion("calle", texto), tipo: "calle" },
    { etiqueta: "Número de la calle", valor: direccion?.numero_calle || direccion?.numero_externo, editar: (texto) => actualizarDireccion("numero_calle", texto), teclado: "number-pad" },
    { etiqueta: "Número interior (opcional)", valor: direccion?.numero_interior, editar: (texto) => actualizarDireccion("numero_interior", texto) },
    { etiqueta: "Referencias de casa (opcional)", valor: direccion?.referencias_casa || direccion?.referencias_Casa, editar: (texto) => actualizarDireccion("referencias_casa", texto), multilinea: true },
    { etiqueta: "Correo", valor: perfil?.email || perfil?.correo, editar: (texto) => actualizarPerfil("email", texto), teclado: "email-address" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View />
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: ms(26) }}>↩</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Ver perfil</Text>
        {saveStatus ? (
          <View style={[styles.saveStatus, saveStatus.tipo === "success" ? styles.saveStatusSuccess : styles.saveStatusError]}>
            <Text style={styles.saveStatusText}>{saveStatus.texto}</Text>
          </View>
        ) : null}
        <View style={styles.formCard}>
          <View style={styles.avatarContainer}>
            {fotoPerfil ? (
              <Image
                source={{ uri: fotoPerfil }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar}>
                <Text>FOTO</Text>
              </View>
            )}
            <Text style={{ fontWeight: "bold", marginTop: vs(5) }}>Fotografía de perfil</Text>
            {isEditing ? (
              <TouchableOpacity style={styles.photoButton} onPress={seleccionarFoto}>
                <Text style={styles.photoButtonText}>Cambiar foto</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {datosPerfil.map((dato) => (
            <View key={dato.etiqueta} style={styles.fullInputGroup}>
              <Text style={styles.label}>{dato.etiqueta}:</Text>
              {isEditing ? (
                dato.tipo === "colonia" ? (
                  <>
                    <Text style={styles.profileValue}>{valor(dato.valor)}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionList}>
                      {coloniasDisponibles.map((colonia) => (
                        <TouchableOpacity
                          key={colonia}
                          style={[styles.optionChip, dato.valor === colonia && styles.optionChipSelected]}
                          onPress={() => dato.editar(colonia)}
                        >
                          <Text style={[styles.optionChipText, dato.valor === colonia && styles.optionChipTextSelected]}>{colonia}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                ) : (
                  <>
                    <TextInput
                      style={[styles.input, dato.bloqueado && styles.inputDisabled]}
                      value={dato.valor === undefined || dato.valor === null ? "" : String(dato.valor)}
                      onChangeText={dato.editar}
                      keyboardType={dato.teclado || "default"}
                      maxLength={dato.maxLength}
                      editable={!dato.bloqueado}
                      multiline={dato.multilinea}
                    />
                    {dato.tipo === "codigoPostal" && loadingDireccion ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#4A8F6A" />
                        <Text style={styles.loadingText}>Buscando dirección...</Text>
                      </View>
                    ) : null}
                    {dato.tipo === "calle" && loadingCalles ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#4A8F6A" />
                        <Text style={styles.loadingText}>Buscando calles...</Text>
                      </View>
                    ) : null}
                    {dato.tipo === "calle" && callesDisponibles.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionList}>
                        {callesDisponibles
                          .filter((calle) => calle.toLowerCase().includes(String(dato.valor || "").toLowerCase()))
                          .slice(0, 8)
                          .map((calle) => (
                            <TouchableOpacity key={calle} style={styles.optionChip} onPress={() => dato.editar(calle)}>
                              <Text style={styles.optionChipText}>{calle}</Text>
                            </TouchableOpacity>
                          ))}
                      </ScrollView>
                    ) : null}
                  </>
                )
              ) : (
                <Text style={styles.profileValue}>{valor(dato.valor)}</Text>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            disabled={saving}
            onPress={() => (isEditing ? guardarCambios() : setIsEditing(true))}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Editar información"}
            </Text>
          </TouchableOpacity>
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
          <Image source={require("../../../assets/casa.png")} style={styles.tabIconImg} />
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
          <Image source={require("../../../assets/puntos.png")} style={styles.tabIconImg} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(2)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(2)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("MapaCliente")}
        >
          {hoveredTab === 2 && <Text style={styles.tabLabel}>Mapa</Text>}
          <Image source={require("../../../assets/maps.png")} style={styles.tabIconImg} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(3)}
          onMouseLeave={() => setHoveredTab(null)}
          onPressIn={() => setHoveredTab(3)}
          onPressOut={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("NotificacionesCliente")}
        >
          {hoveredTab === 3 && <Text style={styles.tabLabel}>Notificaciones</Text>}
          <Image source={require("../../../assets/Notificaciones.png")} style={styles.tabIconImg} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
