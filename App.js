import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import WelcomePregunta from "./src/screens/welcome/WelcomePregunta";
import Welcome from "./src/screens/welcome/Welcome";
import Login from "./src/screens/auth/Login";
import RegistroUsuario from "./src/screens/auth/RegistroUsuario";
import RegistroPaseador from "./src/screens/auth/RegistroPaseador";
import InicioCliente from "./src/screens/cliente/InicioCliente";
import InicioPaseador from "./src/screens/walker/InicioPaseador";

import ServicioClienteInicio from "./src/screens/cliente/servicios/inicio/ServicioClienteInicio";
import ServicioClienteComida from "./src/screens/cliente/servicios/comida/ServicioClienteComida";
import ServicioClienteEstetica from "./src/screens/cliente/servicios/estetica/ServicioClienteEstetica";
import ServicioClienteAccesorios from "./src/screens/cliente/servicios/accesorios/ServicioClienteAccesorios";
import ServicioClientePromociones from "./src/screens/cliente/servicios/promociones/ServicioClientePromociones";
import ServicioClienteOfertas from "./src/screens/cliente/servicios/ofertas/ServicioClienteOfertas";
import ServicioClientePaseador from "./src/screens/cliente/servicios/paseador/ServicioClientePaseador";
import ServicioPaseadorDetalles from "./src/screens/detalles_servicios/paseador/ServicioPaseadorDetalles";
import ServicioComidaDetalles from "./src/screens/detalles_servicios/comida/ServicioComidaDetalles";
import ServicioEsteticaDetalles from "./src/screens/detalles_servicios/estetica/ServicioEsteticaDetalles";
import ServicioAccesoriosDetalles from "./src/screens/detalles_servicios/accesorios/ServicioAccesoriosDetalles";
import ServicioPromocionesDetalles from "./src/screens/detalles_servicios/promociones/ServicioPromocionesDetalles";
import ServicioOfertasDetalles from "./src/screens/detalles_servicios/ofertas/ServicioOfertasDetalles";

import PerfilUsuario from "./src/screens/user/PerfilUsuario";
import EditarPerfilUsuario from "./src/screens/user/EditarPerfilUsuario";
import EditarMascota from "./src/screens/pets/EditarMascota";
import RegistroMascota from "./src/screens/pets/RegistroMascota";
import CalificacionesUsuario from "./src/screens/user/CalificacionesUsuario";
import ConfiguracionUsuario from "./src/screens/user/ConfiguracionUsuario";
import LegalUsuario from "./src/screens/user/LegalUsuario";
import SeguridadUsuario from "./src/screens/user/SeguridadUsuario";
import MascotaDetalles from "./src/screens/pets/MascotaDetalles";

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
        <Stack.Screen name="Inicio_cliente" component={InicioCliente} />
        <Stack.Screen name="Inicio_paseador" component={InicioPaseador} />
        <Stack.Screen
          name="Servicio_Cliente_Inicio"
          component={ServicioClienteInicio}
        />
        <Stack.Screen
          name="Servicio_Cliente_Comida"
          component={ServicioClienteComida}
        />
        <Stack.Screen
          name="Servicio_Cliente_Estetica"
          component={ServicioClienteEstetica}
        />
        <Stack.Screen
          name="Servicio_Cliente_Accesorios"
          component={ServicioClienteAccesorios}
        />
        <Stack.Screen
          name="Servicio_Cliente_Promociones"
          component={ServicioClientePromociones}
        />
        <Stack.Screen
          name="Servicio_Cliente_Ofertas"
          component={ServicioClienteOfertas}
        />
        <Stack.Screen
          name="Servicio_Cliente_Paseador"
          component={ServicioClientePaseador}
        />
        <Stack.Screen
          name="Servicio_Detalles_Paseador"
          component={ServicioPaseadorDetalles}
        />
        <Stack.Screen
          name="Servicio_Detalles_Comida"
          component={ServicioComidaDetalles}
        />
        <Stack.Screen
          name="Servicio_Detalles_Estetica"
          component={ServicioEsteticaDetalles}
        />
        <Stack.Screen
          name="Servicio_Detalles_Accesorios"
          component={ServicioAccesoriosDetalles}
        />
        <Stack.Screen
          name="Servicio_Detalles_Promociones"
          component={ServicioPromocionesDetalles}
        />
        <Stack.Screen
          name="Servicio_Detalles_Ofertas"
          component={ServicioOfertasDetalles}
        />
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
