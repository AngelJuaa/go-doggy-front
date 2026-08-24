import React, { useState } from "react";
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_URL } from "../../utils/api";
import { styles } from "./styles/recuperarContraseniaClientePaseadorStyle";

export default function RecuperarContraseniaClientePaseador({ route, navigation }) {
	const tipo = route?.params?.tipo === "paseador" ? "paseador" : "cliente";
	const esPaseador = tipo === "paseador";
	const [correo, setCorreo] = useState("");
	const [codigo, setCodigo] = useState("");
	const [mostrarCodigo, setMostrarCodigo] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const enviarCodigo = async () => {
		const correoNormalizado = correo.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)) {
			setError("Ingresa un correo válido.");
			return;
		}
		setLoading(true);
		setError("");
		try {
			const response = await fetch(`${API_URL}/recuperacion/solicitar`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ correo: correoNormalizado, tipo }),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "No se pudo enviar el código");
			setCorreo(correoNormalizado);
			setMostrarCodigo(true);
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	};

	const verificarCodigo = async () => {
		if (!/^\d{6}$/.test(codigo)) {
			setError("Ingresa el código de 6 dígitos.");
			return;
		}
		setLoading(true);
		setError("");
		try {
			const response = await fetch(`${API_URL}/recuperacion/verificar`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ correo, tipo, codigo }),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "El código no es válido");
			navigation.navigate("RegistrarNuevaContrasenia", { tipo, correo, codigo });
		} catch (verificationError) {
			setError(verificationError.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity style={[styles.backButton, esPaseador ? styles.backButtonPaseador : styles.backButtonCliente]} onPress={() => navigation.navigate("Login", { tipo })}>
				<Text style={[styles.backText, esPaseador ? styles.backTextPaseador : styles.backTextCliente]}>← Volver</Text>
			</TouchableOpacity>
			<View style={styles.header} />
			<Image source={require("../../../assets/logo.png")} style={styles.backgroundImage} pointerEvents="none" />
			<View style={styles.card}>
				{!mostrarCodigo ? (
					<>
						<Text style={styles.title}>Recuperar contraseña</Text>
						<Text style={styles.message}>Ingresa el correo de la cuenta que quieres recuperar.</Text>
						<View style={styles.inputGroup}>
							<TextInput style={styles.input} value={correo} onChangeText={(value) => { setCorreo(value); setError(""); }} placeholder="Ingresa el correo a recuperar" placeholderTextColor="#777" keyboardType="email-address" autoCapitalize="none" autoFocus />
						</View>
						{error ? <Text style={styles.error}>{error}</Text> : null}
						<TouchableOpacity style={[styles.primaryButton, esPaseador ? styles.paseadorButton : styles.clienteButton, loading && styles.disabledButton]} onPress={enviarCodigo} disabled={loading}>
							<Text style={styles.buttonText}>{loading ? "Enviando..." : "Enviar"}</Text>
						</TouchableOpacity>
					</>
				) : (
					<>
						<Text style={styles.title}>Verifica tu correo</Text>
						<Text style={styles.message}>Se envio un codigo de verificacion al correo <Text style={styles.email}>{correo}</Text></Text>
						<View style={styles.inputGroup}>
							<Text style={styles.label}>Código de verificación:</Text>
							<TextInput style={[styles.input, styles.codeInput]} value={codigo} onChangeText={(value) => { setCodigo(value.replace(/\D/g, "").slice(0, 6)); setError(""); }} keyboardType="number-pad" maxLength={6} autoFocus editable={!loading} />
						</View>
						{error ? <Text style={styles.error}>{error}</Text> : null}
						<TouchableOpacity style={[styles.primaryButton, esPaseador ? styles.paseadorButton : styles.clienteButton, loading && styles.disabledButton]} onPress={verificarCodigo} disabled={loading}>
							<Text style={styles.buttonText}>{loading ? "Verificando..." : "Verificar"}</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.secondaryButton} onPress={() => { setMostrarCodigo(false); setCodigo(""); setError(""); }} disabled={loading}>
							<Text style={styles.secondaryText}>Cambiar correo</Text>
						</TouchableOpacity>
					</>
				)}
			</View>
		</View>
	);
}
