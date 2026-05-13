import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import WelcomePregunta from "./src/features/auth/WelcomePregunta";
import Welcome from "./src/features/auth/Welcome";
import Login from "./src/features/auth/Login";
import RegistroUsuario from "./src/features/auth/RegistroUsuario";
import RegistroPaseador from "./src/features/auth/RegistroPaseador";
import Inicio_cliente from "./src/features/auth/Inicio_cliente";
import Servicio_Cliente_Inicio from "./src/features/auth/Servicio_Cliente_Inicio";
import Servicio_Cliente_Comida from "./src/features/auth/Servicio_Cliente_Comida";
import Servicio_Cliente_Estetica from "./src/features/auth/Servicio_Cliente_Estetica";
import Servicio_Cliente_Accesorios from "./src/features/auth/Servicio_Cliente_Accesorios";
import Servicio_Cliente_Promociones from "./src/features/auth/Servicio_Cliente_Promociones";
import Servicio_Cliente_Ofertas from "./src/features/auth/Servicio_Cliente_Ofertas";
import Servicio_Cliente_Paseador from "./src/features/auth/Servicio_Cliente_Paseador";
import Servicio_Detalles_Paseador from "./src/features/auth/Servicio_Detalles_Paseador";
import Servicio_Detalles_Comida from "./src/features/auth/Servicio_Detalles_Comida";
import Servicio_Detalles_Estetica from "./src/features/auth/Servicio_Detalles_Estetica";
import Servicio_Detalles_Accesorios from "./src/features/auth/Servicio_Detalles_Accesorios";
import Servicio_Detalles_Promociones from "./src/features/auth/Servicio_Detalles_Promociones";
import Servicio_Detalles_Ofertas from "./src/features/auth/Servicio_Detalles_Ofertas";
import PerfilUsuario from "./src/features/auth/PerfilUsuario";
import EditarPerfilUsuario from "./src/features/auth/EditarPerfilUsuario";
import EditarMascota from "./src/features/auth/EditarMascota";
import RegistroMascota from "./src/features/auth/RegistroMascota";
import CalificacionesUsuario from "./src/features/auth/CalificacionesUsuario";
import ConfiguracionUsuario from "./src/features/auth/ConfiguracionUsuario";
import LegalUsuario from "./src/features/auth/LegalUsuario";
import SeguridadUsuario from "./src/features/auth/SeguridadUsuario";
import MascotaDetalles from "./src/features/auth/MascotaDetalles";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="WelcomePregunta"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="WelcomePregunta" component={WelcomePregunta} />
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="RegistroUsuario" component={RegistroUsuario} />
        <Stack.Screen name="RegistroPaseador" component={RegistroPaseador} />
        <Stack.Screen name="Inicio_cliente" component={Inicio_cliente} />
        <Stack.Screen name="Servicio_Cliente_Inicio" component={Servicio_Cliente_Inicio} />
        <Stack.Screen name="Servicio_Cliente_Comida" component={Servicio_Cliente_Comida} />
        <Stack.Screen name="Servicio_Cliente_Estetica" component={Servicio_Cliente_Estetica} />
        <Stack.Screen name="Servicio_Cliente_Accesorios" component={Servicio_Cliente_Accesorios} />
        <Stack.Screen name="Servicio_Cliente_Promociones" component={Servicio_Cliente_Promociones} />
        <Stack.Screen name="Servicio_Cliente_Ofertas" component={Servicio_Cliente_Ofertas} />
        <Stack.Screen name="Servicio_Cliente_Paseador" component={Servicio_Cliente_Paseador} />
        <Stack.Screen name="Servicio_Detalles_Paseador" component={Servicio_Detalles_Paseador} />
        <Stack.Screen name="Servicio_Detalles_Comida" component={Servicio_Detalles_Comida} />
        <Stack.Screen name="Servicio_Detalles_Estetica" component={Servicio_Detalles_Estetica} />
        <Stack.Screen name="Servicio_Detalles_Accesorios" component={Servicio_Detalles_Accesorios} />
        <Stack.Screen name="Servicio_Detalles_Promociones" component={Servicio_Detalles_Promociones} />
        <Stack.Screen name="Servicio_Detalles_Ofertas" component={Servicio_Detalles_Ofertas} />
        <Stack.Screen name="PerfilUsuario" component={PerfilUsuario} />
        <Stack.Screen
          name="EditarPerfilUsuario"
          component={EditarPerfilUsuario}
        />
        <Stack.Screen name="EditarMascota" component={EditarMascota} />
        <Stack.Screen name="RegistroMascota" component={RegistroMascota} />
        <Stack.Screen name="Calificaciones" component={CalificacionesUsuario} />
        <Stack.Screen
          name="ConfiguracionUsuario"
          component={ConfiguracionUsuario}
        />
        <Stack.Screen name="LegalUsuario" component={LegalUsuario} />
        <Stack.Screen name="SeguridadUsuario" component={SeguridadUsuario} />
        <Stack.Screen name="MascotaDetalles" component={MascotaDetalles} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
