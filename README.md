# 🚀 Aventura Matemática Interactiva 🌌

¡Una aplicación web divertida e interactiva diseñada para ayudar a niños de 5 a 12 años a aprender y practicar operaciones matemáticas básicas de una manera atractiva y estimulante!

<!-- Reemplaza con tu usuario/repo --> Licencia <!-- Asume licencia MIT, crea archivo LICENSE -->
<!-- Opcional: Añadir un GIF o Screenshot principal aquí -->
<!-- ![Demo Aventura Matemática](./screenshots/demo.gif) -->

## 📝 Descripción

Aventura Matemática Interactiva transforma el aprendizaje de las matemáticas en una experiencia lúdica. A través de desafíos interactivos, niveles progresivos, feedback inmediato y visualmente atractivo, y un sistema de recompensas (certificados), la aplicación busca fomentar la confianza y la competencia matemática en los niños. La interfaz es colorida, accesible y totalmente responsiva, adaptándose a móviles, tablets, PCs e incluso Smart TVs.

## ✨ Características Principales

- ✔ **Inicio de Sesión Simple**: Guarda el progreso del niño (Nombre, Apellido, Edad) usando LocalStorage.
- ✔ **Menú Principal Interactivo**: Tarjetas visualmente atractivas para seleccionar la operación matemática.
- ✔ **6 Operaciones Matemáticas**:
  - Suma ➕
  - Resta ➖
  - Multiplicación ✖️ (Con una sección dedicada para practicar tablas!)
  - División ➗
  - Potenciación ✨ (Ej: 3²)
  - Raíz Cuadrada √
- ✔ **Sistema de Niveles Progresivos**:
  - Básico: Operaciones sencillas (30 seg/ejercicio).
  - Intermedio: Mayor complejidad (20 seg/ejercicio).
  - Avanzado: Desafíos combinados y más rápidos (15 seg/ejercicio).
  - 10 ejercicios por nivel para cada operación.
- ✔ **Temporizador**: Añade un elemento de desafío en los niveles más avanzados.
- ✔ **Feedback Instantáneo y Educativo**:
  - ✅ Correcto: Mensaje de felicitación, sonido positivo y explicación opcional.
  - ❌ Incorrecto: Mensaje de ánimo, explicación visual y narración de voz (Web Speech API).
- ✔ **Tablas de Multiplicar**:
  - Interfaz dedicada para completar todas las tablas del 1 al 12.
  - Feedback visual inmediato y opción de revisión completa.
- ✔ **Seguimiento de Progreso**:
  - Contadores de aciertos/errores por nivel.
  - Gráfico de progreso por operación (Chart.js).
- ✔ **Certificados PDF**:
  - Generación automática de certificados (jsPDF) al completar niveles.
  - Certificado especial por completar todas las tablas de multiplicar.
  - Gran Certificado Final de "Campeón Matemático" al completar todos los módulos. 🏆

## 🛠️ Tecnologías Utilizadas

- ✔ **Frontend**:
  - HTML5, CSS3, JavaScript Puro (ES6+).
  - Bootstrap 5.
  - Font Awesome para iconos.
- ✔ **Gráficos**:
  - Chart.js para visualización de progreso.
- ✔ **Generación de PDF**:
  - jsPDF para generación de certificados.
- ✔ **Audio Interactivo**:
  - Web Speech API (Narración de Voz).
  - API Audio nativa para efectos de sonido.
- ✔ **Persistencia**:
  - LocalStorage para guardar progreso.

## 🚀 Demo en Vivo (Opcional)
<!-- [Puedes probar la aplicación aquí!](https://tu-usuario.github.io/tu-repositorio/) -->
(Añade el enlace si despliegas la aplicación, por ejemplo en GitHub Pages)

## 🎮 Cómo Empezar (Uso Local)

Como esta es una aplicación puramente frontend, no necesitas instalación compleja.

### 1️⃣ Clona el repositorio:
```bash
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
```
(Reemplaza TU_USUARIO/TU_REPOSITORIO con los detalles correctos)

### 2️⃣ Navega a la carpeta del proyecto:
```bash
cd TU_REPOSITORIO
```

### 3️⃣ Abre el archivo index.html:
Simplemente haz doble clic en el archivo index.html en tu explorador de archivos, o ábrelo desde tu navegador.

🚀 ¡Y eso es todo! La aplicación se ejecutará localmente.

## 📜 Licencia
Este proyecto está distribuido bajo la Licencia MIT. Consulta el archivo LICENSE para más detalles.

## 🤝 Contribuciones
Las contribuciones son bienvenidas. Para mejorar el proyecto, sigue estos pasos:

- [x] Haz un Fork del repositorio.
- [x] Crea una nueva rama (`git checkout -b feature/AmazingFeature`).
- [x] Realiza cambios y haz commit (`git commit -m "Añadiendo nueva función AmazingFeature"`).
- [x] Sube tu rama (`git push origin feature/AmazingFeature`).
- [x] Abre un Pull Request y espera revisión.

💡 Si tienes ideas adicionales, abre un Issue antes de hacer cambios.

## ✨ Agradecimientos

- 🔹 Bootstrap
- 🔹 Font Awesome
- 🔹 Chart.js
- 🔹 jsPDF
- 🔹 A la IA que ayudó en la conceptualización y generación de código inicial.
