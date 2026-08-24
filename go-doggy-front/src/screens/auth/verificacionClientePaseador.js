import React, { useEffect, useState } from "react";
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_URL } from "../../utils/api";
import { styles } from "./styles/verificacionClientePaseadorStyle";

export default function VerificacionClientePaseador({ route, navigation }) {
	const tipo = route?.params?.tipo === "paseador" ? "paseador" : "cliente";
	const correo = String(route?.params?.correo || route?.params?.email || "").trim().toLowerCase();
	const esPaseador = tipo === "paseador";
	const [codigo, setCodigo] = useState("");
	const [loading, setLoading] = useState(false);
	const [resending, setResending] = useState(false);
	const [cooldown, setCooldown] = useState(0);
	const [error, setError] = useState("");

	const solicitarCodigo = async () => {
		if (!correo) {
			setError("No se encontró el correo registrado.");
			return false;
		}

		setResending(true);
		setError("");
		try {
			const response = await fetch(`${API_URL}/verificacion/solicitar`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ correo, tipo }),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "No se pudo enviar el código");
			setCooldown(30);
			return true;
		} catch (requestError) {
			setError(requestError.message);
			return false;
		} finally {
			setResending(false);
		}
	};

	useEffect(() => {
		solicitarCodigo();
	}, [correo, tipo]);

	useEffect(() => {
		if (!cooldown) return undefined;
		const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
		return () => clearInterval(timer);
	}, [cooldown]);

	const verificarCodigo = async () => {
		if (!/^\d{6}$/.test(codigo)) {
			setError("Ingresa el código de 6 dígitos.");
			return;
		}

		setLoading(true);
		setError("");
		try {
			const response = await fetch(`${API_URL}/verificacion/confirmar`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ correo, tipo, codigo }),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "Código inválido");
			Alert.alert("Correo verificado", "Tu cuenta está lista para iniciar sesión.", [
				{ text: "Continuar", onPress: () => navigation.reset({ index: 0, routes: [{ name: "Login", params: { tipo } }] }) },
			]);
		} catch (verificationError) {
			setError(verificationError.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity
				style={[styles.backButton, esPaseador ? styles.backButtonPaseador : styles.backButtonCliente]}
				onPress={() => navigation.navigate("Welcome", { tipo })}
			>
				<Text style={[styles.backText, esPaseador ? styles.backTextPaseador : styles.backTextCliente]}>← Volver</Text>
			</TouchableOpacity>
			<View style={styles.header} />
			<Image source={require("../../../assets/logo.png")} style={styles.backgroundImage} pointerEvents="none" />
			<View style={styles.verificationCard}>
				<Text style={styles.title}>Verifica tu correo</Text>
				<Text style={styles.subtitle}>
					Enviamos un código de 6 dígitos a{"\n"}
					<Text style={styles.email}>{correo || "tu correo"}</Text>
				</Text>
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Código de verificación:</Text>
					<TextInput
						style={styles.input}
						value={codigo}
						onChangeText={(value) => { setCodigo(value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
						keyboardType="number-pad"
						maxLength={6}
						editable={!loading}
						autoFocus
					/>
				</View>
				{error ? <Text style={styles.error}>{error}</Text> : null}
				<TouchableOpacity
					style={[styles.primaryButton, esPaseador ? styles.paseadorButton : styles.clienteButton, loading && styles.disabledButton]}
					onPress={verificarCodigo}
					disabled={loading || resending}
				>
					<Text style={styles.buttonText}>{loading ? "Verificando..." : "Verificar correo"}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.resendButton} onPress={solicitarCodigo} disabled={resending || cooldown > 0}>
					<Text style={styles.resendText}>{cooldown > 0 ? `Reenviar código en ${cooldown}s` : "Reenviar código"}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
