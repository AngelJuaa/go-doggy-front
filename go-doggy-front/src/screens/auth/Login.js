import React, { useState, useEffect } from "react";
import { Text, View, TextInput, TouchableOpacity, Image } from "react-native";
import { loginStyles as styles } from "./styles/LoginStyles";
import { s, vs, ms } from "../../utils/responsive";
import storage from "../../utils/storage";
import { API_URL } from "../../utils/api";

export default function Login({ route, navigation }) {
  const { tipo } = route.params || { tipo: "cliente" };

  // 🎯 Estados
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [attempts, setAttempts] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // ⏱️ Efecto para el temporizador de espera
  useEffect(() => {
    if (!isWaiting) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsWaiting(false);
          setAttempts(0); // Reinicia los intentos después de esperar
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWaiting]);

  // 🔐 Función para iniciar sesión
  const iniciarSesion = async () => {
    const nextErrors = {
      email: "",
      password: "",
    };

    if (!email.trim()) {
      nextErrors.email = "El correo está vacío";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        nextErrors.email = "Ingresa un correo válido";
      }
    }

    if (!password.trim()) {
      nextErrors.password = "La contraseña está vacía";
    }

    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      if (nextErrors.email && nextErrors.password) {
        alert("Los campos están vacíos");
      } else if (nextErrors.email) {
        alert(nextErrors.email);
      } else if (nextErrors.password) {
        alert(nextErrors.password);
      }
      return;
    }

    // Si está en espera, no permitir más intentos
    if (isWaiting) {
      alert(`Espera ${remainingTime} segundos antes de intentar nuevamente.`);
      return;
    }

    console.log("🚀 Intentando login como:", tipo);

    try {
      // Seleccionar endpoint y campos según tipo
      const endpoint = tipo === "paseador" ? "/login-paseador" : "/login";
      const bodyData = tipo === "paseador" 
        ? { correo: email, contrasenia: password }
        : { email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      console.log("Respuesta:", data);

      if (response.ok) {
        // ✅ Login exitoso
        setAttempts(0);
        setEmail("");
        setPassword("");

        // 💾 Guardar sesión con la clave correcta
        const keyToStore = tipo === "paseador" ? "paseador" : "usuario";
        const userToStore = tipo === "paseador" ? data.paseador : data.usuario;
        const keyToRemove = tipo === "paseador" ? "usuario" : "paseador";
        storage.removeItem(keyToRemove);
        storage.setItem("active_role", tipo === "paseador" ? "paseador" : "cliente");
        storage.setItem(keyToStore, JSON.stringify(userToStore));

        // 🔀 Navegación
        if (tipo === "paseador") {
          navigation.navigate("InicioPaseador");
        } else {
          navigation.navigate("Inicio_cliente");
        }
      } else {
        // ❌ Login fallido
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
          // Bloquea después de 3 intentos
          setIsWaiting(true);
          setRemainingTime(60);
          alert("⛔ Demasiados intentos fallidos. Espera 1 minuto.");
        } else {
          alert(data.message || "Verifique lo que escribió. Correo o contraseña incorrectos.");
        }
      }
    } catch (error) {
      console.log("Error:", error);
      alert("Error de conexión con el servidor");
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔙 Botón Volver */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate("Welcome");
          }
        }}
      >
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>

      <View style={styles.header}></View>

      {/* 🖼️ Imagen de fondo */}
      <Image
        source={require("../../../assets/logo.png")}
        style={styles.backgroundImage}
        pointerEvents="none"
      />

      {/* 📝 Tarjeta de Login */}
      <View style={styles.loginCard}>
        {/* 📧 Campo de Correo */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo:</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu correo"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors((prev) => ({ ...prev, email: "" }));
            }}
            editable={!isWaiting}
          />
          {errors.email ? (
            <Text style={{ color: "#d9534f", fontSize: 12, marginTop: 4 }}>
              {errors.email}
            </Text>
          ) : null}
        </View>

        {/* 🔐 Campo de Contraseña */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña:</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              secureTextEntry={!showPassword}
              placeholder="******"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              editable={!isWaiting}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              disabled={isWaiting}
            >
              <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>
          {errors.password ? (
            <Text style={{ color: "#d9534f", fontSize: 12, marginTop: 4 }}>
              {errors.password}
            </Text>
          ) : null}
        </View>

        {/* 🔘 Botón de Iniciar Sesión */}
        <TouchableOpacity
          style={[styles.loginButton, isWaiting && styles.disabledButton]}
          disabled={isWaiting}
          onPress={iniciarSesion}
        >
          <Text style={styles.buttonText}>
            {isWaiting ? `⏳ Espera ${remainingTime}s` : "Iniciar Sesión"}
          </Text>
        </TouchableOpacity>

        {/* 🔗 Olvidaste Contraseña */}
        <TouchableOpacity
          onPress={() =>
            alert("Funcionalidad de recuperación de contraseña próximamente")
          }
          disabled={isWaiting}
        >
          <Text
            style={[
              styles.forgotPasswordText,
              attempts >= 3 && styles.highlightedText,
            ]}
          >
            {attempts >= 3
              ? "✨ ¿Olvidaste tu contraseña?"
              : "¿Olvidaste tu contraseña?"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
