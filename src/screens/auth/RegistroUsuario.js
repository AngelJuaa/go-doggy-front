import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { s, vs, ms } from "../../utils/responsive";
import * as ImagePicker from "expo-image-picker";
import { styles } from "./styles/RegistroUsuarioStyles";
import { API_URL, apiFetch } from "../../utils/api";

export default function RegistroUsuario({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorNombre, setErrorNombre] = useState("");
  const [errorTelefono, setErrorTelefono] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirmPassword, setErrorConfirmPassword] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [errorFoto, setErrorFoto] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [pais, setPais] = useState("");
  const [estado, setEstado] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [colonia, setColonia] = useState("");
  const [calle, setCalle] = useState("");
  const [numeroCalle, setNumeroCalle] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [coloniasDisponibles, setColoniasDisponibles] = useState([]);
  const [callesDisponibles, setCallesDisponibles] = useState([]);
  const [loadingDireccion, setLoadingDireccion] = useState(false);
  const [loadingCalles, setLoadingCalles] = useState(false);
  const [errorCodigoPostal, setErrorCodigoPostal] = useState("");
  const [errorColonia, setErrorColonia] = useState("");
  const [errorCalle, setErrorCalle] = useState("");
  const [errorNumeroCalle, setErrorNumeroCalle] = useState("");

  const resetDireccionDependiente = () => {
    setPais("");
    setEstado("");
    setCiudad("");
    setColonia("");
    setCalle("");
    setNumeroCalle("");
    setLatitud("");
    setLongitud("");
    setColoniasDisponibles([]);
    setCallesDisponibles([]);
  };

  const cargarCalles = async ({ cp, country, state, city, neighborhood, lat, lng }) => {
    if (!cp || !country || !state || !city) return;

    setLoadingCalles(true);
    setCallesDisponibles([]);

    try {
      const query = new URLSearchParams({
        codigo_postal: cp,
        pais: country,
        estado: state,
        ciudad: city,
      });

      if (neighborhood) {
        query.append("colonia", neighborhood);
      }

      if (lat) {
        query.append("latitud", String(lat));
      }

      if (lng) {
        query.append("longitud", String(lng));
      }

      const data = await apiFetch(`/direccion/calles?${query.toString()}`);
      setCallesDisponibles(data.calles || []);
    } catch (error) {
      console.log("Error cargando calles:", error);
      setCallesDisponibles([]);
    } finally {
      setLoadingCalles(false);
    }
  };

  const cargarDireccionPorCodigoPostal = async (cp) => {
    if (cp.length !== 5) return;

    setLoadingDireccion(true);
    setErrorCodigoPostal("");
    resetDireccionDependiente();

    try {
      const data = await apiFetch(`/direccion/codigo-postal/${cp}`);
      setPais(data.pais || "");
      setEstado(data.estado || "");
      setCiudad(data.ciudad || "");
      setLatitud(data.latitud ? String(data.latitud) : "");
      setLongitud(data.longitud ? String(data.longitud) : "");

      const colonias = data.colonias || [];
      setColoniasDisponibles(colonias);

      if (colonias.length > 0) {
        const coloniaInicial = colonias[0];
        setColonia(coloniaInicial);
        await cargarCalles({
          cp,
          country: data.pais || "",
          state: data.estado || "",
          city: data.ciudad || "",
          neighborhood: coloniaInicial,
          lat: data.latitud,
          lng: data.longitud,
        });
      }
    } catch (error) {
      console.log("Error cargando dirección:", error);
      setErrorCodigoPostal("No se pudo autocompletar ese código postal");
      resetDireccionDependiente();
    } finally {
      setLoadingDireccion(false);
    }
  };

  const onChangeCodigoPostal = (text) => {
    const limpio = text.replace(/\D/g, "").slice(0, 5);
    setCodigoPostal(limpio);
    setErrorCodigoPostal("");

    if (limpio.length < 5) {
      resetDireccionDependiente();
    }

    if (limpio.length === 5) {
      cargarDireccionPorCodigoPostal(limpio);
    }
  };

  const seleccionarColonia = async (coloniaSeleccionada) => {
    setColonia(coloniaSeleccionada);
    setErrorColonia("");
    await cargarCalles({
      cp: codigoPostal,
      country: pais,
      state: estado,
      city: ciudad,
      neighborhood: coloniaSeleccionada,
      lat: latitud,
      lng: longitud,
    });
  };

  // 📷 Función para seleccionar fotografía
  const seleccionarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          "Permiso denegado",
          "Se necesitan permisos para acceder a las fotos",
        );
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!resultado.canceled) {
        setFotoPerfil(resultado.assets[0]);
        setErrorFoto("");
      }
    } catch (error) {
      console.log("Error al seleccionar foto:", error);
      Alert.alert("Error", "No se pudo seleccionar la foto");
    }
  };

  const registrarUsuario = async () => {
    setErrorNombre("");
    setErrorTelefono("");
    setErrorCorreo("");
    setErrorPassword("");
    setErrorConfirmPassword("");
    setErrorFoto("");
    setErrorCodigoPostal("");
    setErrorColonia("");
    setErrorCalle("");
    setErrorNumeroCalle("");

    let hasError = false;

    if (!nombre.trim()) {
      setErrorNombre("El nombre es obligatorio");
      hasError = true;
    }
    if (telefono.length < 10) {
      setErrorTelefono("El teléfono debe tener 10 dígitos");
      hasError = true;
    }
    if (!/\S+@\S+\.\S+/.test(correo)) {
      setErrorCorreo("Correo inválido");
      hasError = true;
    }
    if (
      password.length <= 8 ||
      !/[A-Z]/.test(password) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      setErrorPassword(
        "La contraseña debe tener más de 8 caracteres, 1 mayúscula y 1 carácter especial",
      );
      hasError = true;
    }
    if (password !== confirmPassword) {
      setErrorConfirmPassword("Las contraseñas no coinciden");
      hasError = true;
    }
    if (!fotoPerfil) {
      setErrorFoto("Selecciona una fotografía de perfil");
      hasError = true;
    }
    if (codigoPostal.length !== 5) {
      setErrorCodigoPostal("Ingresa un código postal válido de 5 dígitos");
      hasError = true;
    }
    if (!pais || !estado || !ciudad) {
      setErrorCodigoPostal("Primero autocompleta la dirección con el código postal");
      hasError = true;
    }
    if (!colonia) {
      setErrorColonia("Selecciona una colonia");
      hasError = true;
    }
    if (!calle) {
      setErrorCalle("Ingresa la calle");
      hasError = true;
    }
    const numeroCalleLimpio = numeroCalle.trim();
    if (!numeroCalleLimpio) {
      setErrorNumeroCalle("Ingresa el número de la calle");
      hasError = true;
    } else if (!/^\d{1,4}$/.test(numeroCalleLimpio)) {
      setErrorNumeroCalle("Solo se aceptan 4 dígitos o menos");
      hasError = true;
    }

    if (hasError) return;

    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("telefono", telefono);
      formData.append("email", correo);
      formData.append("password", password);
      formData.append("codigo_postal", codigoPostal);
      formData.append("pais", pais);
      formData.append("estado", estado);
      formData.append("ciudad", ciudad);
      formData.append("colonia", colonia);
      formData.append("calle", calle);
      formData.append("numero_calle", numeroCalleLimpio);
      formData.append("latitud", latitud || "0");
      formData.append("longitud", longitud || "0");

      // Agregar foto si existe
      if (fotoPerfil) {
        const response = await fetch(fotoPerfil.uri);
        const blob = await response.blob();
        formData.append("foto", blob, "foto.jpg");
      }

      console.log("🚀 Enviando datos de registro...");
      console.log("Nombre:", nombre, "Teléfono:", telefono, "Email:", correo);
      console.log("Foto seleccionada:", fotoPerfil ? "Sí" : "No");

      const response = await fetch(`${API_URL}/registro`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Respuesta del servidor:", response.status, data);

      if (response.ok) {
        Alert.alert("Éxito", "Usuario registrado correctamente");
        navigation.navigate("Login");
      } else {
        const missingFields = Array.isArray(data.missingFields)
          ? data.missingFields.join(", ")
          : "";

        const detailMessage = missingFields
          ? `${data.message || "Error al registrar"}. Campos: ${missingFields}`
          : data.message || "Error al registrar";

        Alert.alert("Error", detailMessage);
      }
    } catch (error) {
      console.log("❌ Error en registro:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    }
  };

  /// Lo que se ve

  const callesFiltradas = calle.trim()
    ? callesDisponibles
      .filter((item) => item.toLowerCase().includes(calle.trim().toLowerCase()))
      .slice(0, 8)
    : [];

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 45,
          left: 18,
          zIndex: 20,
          backgroundColor: "rgba(0,0,0,0.45)",
          borderRadius: 20,
          paddingVertical: 7,
          paddingHorizontal: 14,
        }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "bold" }}>← Volver</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={require("../../../assets/logo.png")}
          style={styles.headerImage}
        />

        {/* 🔥 FORMULARIO COMPLETO */}
        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre:</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={(text) => {
                setNombre(text);
                setErrorNombre("");
              }}
            />
            <Text style={{ color: "red" }}>{errorNombre}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Teléfono:</Text>
            <TextInput
              style={styles.input}
              value={telefono}
              onChangeText={(text) => {
                setTelefono(text);
                setErrorTelefono("");
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Text style={{ color: "red" }}>{errorTelefono}</Text>
          </View>



          <View style={styles.inputContainer}>
            <Text style={styles.label}>Código postal:</Text>
            <TextInput
              style={styles.input}
              value={codigoPostal}
              onChangeText={onChangeCodigoPostal}
              keyboardType="number-pad"
              maxLength={5}
              placeholder="Ej. 76116"
            />
            {loadingDireccion && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#4A8F6A" />
                <Text style={styles.loadingText}>Buscando dirección...</Text>
              </View>
            )}
            <Text style={{ color: "red" }}>{errorCodigoPostal}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>País:</Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={pais} editable={false} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Estado:</Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={estado} editable={false} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ciudad:</Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={ciudad} editable={false} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Colonia:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionList}>
              {coloniasDisponibles.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.optionChip, colonia === item && styles.optionChipSelected]}
                  onPress={() => seleccionarColonia(item)}
                >
                  <Text style={[styles.optionChipText, colonia === item && styles.optionChipTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={{ color: "red" }}>{errorColonia}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Calle:</Text>
            <TextInput
              style={styles.input}
              value={calle}
              onChangeText={(text) => {
                setCalle(text);
                setErrorCalle("");
              }}
              placeholder="Ej. Av. Reforma"
            />
            {loadingCalles ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#4A8F6A" />
                <Text style={styles.loadingText}>Buscando calles...</Text>
              </View>
            ) : null}
            {callesFiltradas.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.optionList}
              >
                {callesFiltradas.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.optionChip}
                    onPress={() => {
                      setCalle(item);
                      setErrorCalle("");
                    }}
                  >
                    <Text style={styles.optionChipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
            <Text style={{ color: "red" }}>{errorCalle}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Número de la calle:</Text>
            <TextInput
              style={styles.input}
              value={numeroCalle}
              onChangeText={(text) => {
                  const limpio = text.replace(/\D/g, "").slice(0, 4);
                  setNumeroCalle(limpio);
                setErrorNumeroCalle("");
              }}
                keyboardType="number-pad"
                maxLength={4}
              placeholder="Ej. 124"
            />
            <Text style={{ color: "red" }}>{errorNumeroCalle}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo:</Text>
            <TextInput
              style={styles.input}
              value={correo}
              onChangeText={(text) => {
                setCorreo(text);
                setErrorCorreo("");
              }}
              keyboardType="email-address"
            />
            <Text style={{ color: "red" }}>{errorCorreo}</Text>
          </View>


          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña:</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorPassword("");
                }}
                secureTextEntry={!mostrarPassword}
              />
              <TouchableOpacity
                onPress={() => setMostrarPassword(!mostrarPassword)}
              >
                <Text style={{ marginLeft: 10 }}>
                  {mostrarPassword ? "🙈" : "👁"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: "red" }}>{errorPassword}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmar contraseña:</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrorConfirmPassword("");
                }}
                secureTextEntry={!mostrarPassword}
              />
              <TouchableOpacity
                onPress={() => setMostrarPassword(!mostrarPassword)}
              >
                <Text style={{ marginLeft: 10 }}>
                  {mostrarPassword ? "🙈" : "👁"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: "red" }}>{errorConfirmPassword}</Text>
          </View>

          {/* 📷 Fotografía de Perfil */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Fotografía de perfil:</Text>
            {fotoPerfil ? (
              <View style={{ alignItems: "center", marginBottom: 10 }}>
                <Image
                  source={{ uri: fotoPerfil.uri }}
                  style={{
                    width: s(110),
                    height: s(110),
                    borderRadius: s(55),
                    marginBottom: vs(10),
                    borderWidth: 2,
                    borderColor: "#7CEDA3",
                  }}
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: "#ff6b6b",
                    paddingHorizontal: s(14),
                    paddingVertical: vs(7),
                    borderRadius: s(5),
                  }}
                  onPress={() => setFotoPerfil(null)}
                >
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: ms(13) }}>
                    ❌ Cambiar foto
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={{
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: "#7CEDA3",
                  borderRadius: s(10),
                  padding: s(18),
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(124, 237, 163, 0.1)",
                }}
                onPress={seleccionarFoto}
              >
                <Text style={{ fontSize: ms(36), marginBottom: vs(8) }}>📷</Text>
                <Text style={{ color: "#555", fontWeight: "bold", fontSize: ms(14) }}>
                  Selecciona una foto
                </Text>
              </TouchableOpacity>
            )}
            <Text style={{ color: "red" }}>{errorFoto}</Text>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={registrarUsuario}>
            <Text style={styles.submitBtnText}>Registrarse</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
