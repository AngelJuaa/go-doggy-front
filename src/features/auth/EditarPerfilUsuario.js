import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { styles } from "./EditarPerfilUsuarioStyles";

export default function EditarPerfilUsuario({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState(null);

  useEffect(() => {
    const usuarioStr = localStorage.getItem("usuario");
    if (usuarioStr) {
      const usuario = JSON.parse(usuarioStr);
      const nombreCompleto = usuario.nombre_completo.split(" ");
      setNombre(nombreCompleto[0] || "");
      setApellido(nombreCompleto.slice(1).join(" ") || "");
      setCorreo(usuario.email || "");
      setTelefono(usuario.telefono || "");
      setFotoPerfil(usuario.url_foto_perfil);
      // Dirección no está en el usuario, dejar vacío
    }
  }, []);

  const guardarCambios = () => {
    // Lógica para guardar cambios
    alert("Cambios guardados");
    setIsEditing(false);
  };

  const toggleEdit = () => {
    if (isEditing) {
      guardarCambios();
    } else {
      setIsEditing(true);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 28 }}>↩</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Editar perfil</Text>
      <View style={styles.formCard}>
        <TouchableOpacity style={styles.avatarContainer}>
          {fotoPerfil ? (
            <Image source={{ uri: `http://localhost:3000/uploads/${fotoPerfil}` }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text>FOTO</Text>
            </View>
          )}
          <Text style={{ fontWeight: "bold", marginTop: 5 }}>Añadir foto</Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre:</Text>
            <TextInput style={styles.input} value={nombre} onChangeText={setNombre} editable={isEditing} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellido:</Text>
            <TextInput style={styles.input} value={apellido} onChangeText={setApellido} editable={isEditing} />
          </View>
        </View>
        <View style={styles.fullInputGroup}>
          <Text style={styles.label}>Correo:</Text>
          <TextInput style={styles.input} value={correo} onChangeText={setCorreo} editable={isEditing} />
        </View>
        <View style={styles.fullInputGroup}>
          <Text style={styles.label}>Dirección:</Text>
          <TextInput style={styles.input} value={direccion} onChangeText={setDireccion} editable={isEditing} />
        </View>
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña:</Text>
            <TextInput style={styles.input} secureTextEntry editable={isEditing} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono:</Text>
            <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" editable={isEditing} />
          </View>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={toggleEdit}>
          <Text style={styles.saveBtnText}>{isEditing ? "Guardar" : "Editar"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
