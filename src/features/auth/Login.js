import React, { useState, useEffect } from "react";
import { Text, View, TextInput, TouchableOpacity, Image } from "react-native";
import { loginStyles as styles } from "./LoginStyles";

export default function Login({ route, navigation }) {
  const { tipo } = route.params || { tipo: "cliente" };

  // 🎯 Estados
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // ⏱️ Efecto para el temporizador de espera
  useEffect(() => {
    if (!isWaiting) return;

    const interval = setInterval(() => {
      setRemainingTime(prev => {
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
    // Validación básica
    if (!email || !password) {
      alert("Completa todos los campos");
      return;
    }

    // Si está en espera, no permitir más intentos
    if (isWaiting) {
      alert(`Espera ${remainingTime} segundos antes de intentar nuevamente.`);
      return;
    }

    console.log("🚀 Intentando login...");

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();
      console.log("Respuesta:", data);

      if (response.ok) {
        // ✅ Login exitoso
        setAttempts(0);
        setEmail('');
        setPassword('');

        // 💾 Guardar sesión
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        // 🔀 Navegación
        if (tipo === "cliente") {
          navigation.navigate("Inicio_cliente");
        } else {
          navigation.navigate("Inicio_paseador");
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
          alert(data.message || "Correo o contraseña incorrectos");
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
        style={{
          position: "absolute",
          top: 50,
          left: 20,
          zIndex: 10,
          padding: 10,
        }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ fontSize: 16, color: "#333", fontWeight: "bold" }}>
          ← Volver
        </Text>
      </TouchableOpacity>

      <View style={styles.header}></View>

      {/* 🖼️ Imagen de fondo */}
      <Image
        source={require("../../../assets/logo.png")}
        style={styles.backgroundImage}
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
            onChangeText={setEmail}
            editable={!isWaiting}
          />
        </View>

        {/* 🔐 Campo de Contraseña */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña:</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showPassword}
              placeholder="******"
              value={password}
              onChangeText={setPassword}
              editable={!isWaiting}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              disabled={isWaiting}
            >
              <Text style={styles.eyeText}>
                {showPassword ? "🙈" : "👁️"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🔘 Botón de Iniciar Sesión */}
        <TouchableOpacity
          style={[styles.loginButton, isWaiting && styles.disabledButton]}
          disabled={isWaiting}
          onPress={iniciarSesion}
        >
          <Text style={styles.buttonText}>
            {isWaiting ? `⏳ Espera ${remainingTime}s` : 'Iniciar Sesión'}
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
            {attempts >= 3 ? "✨ ¿Olvidaste tu contraseña?" : "¿Olvidaste tu contraseña?"}
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}