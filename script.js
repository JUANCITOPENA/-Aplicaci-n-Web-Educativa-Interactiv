// Asegurarse de que jsPDF esté disponible globalmente si se carga vía CDN
const { jsPDF } = window.jspdf || {}; // Handle case where CDN might fail

document.addEventListener('DOMContentLoaded', () => {
    'use strict'; // Enable strict mode

    // --- Selección de Elementos del DOM ---
    // Modales
    const loginModalElement = document.getElementById('loginModal');
    const loginModal = loginModalElement ? new bootstrap.Modal(loginModalElement) : null;
    const incorrectModalElement = document.getElementById('incorrectFeedbackModal');
    const correctModalElement = document.getElementById('correctFeedbackModal');
    const incorrectModal = incorrectModalElement ? new bootstrap.Modal(incorrectModalElement) : null;
    const correctModal = correctModalElement ? new bootstrap.Modal(correctModalElement) : null;

    // Formularios y Navegación
    const loginForm = document.getElementById('login-form');
    const userInfoNav = document.getElementById('userInfoNav');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const reloadAppButton = document.getElementById('reloadApp'); // Para el logo

    // Secciones Principales
    const mainSelection = document.getElementById('main-selection');
    const exerciseSection = document.getElementById('exercise-section');
    const multiplicationSection = document.getElementById('multiplication-section');
    const progressSection = document.getElementById('progress-section'); // Contiene el gráfico

    // Elementos de la Sección de Ejercicios
    const backToMainBtn = document.getElementById('back-to-main');
    const exerciseTitle = document.getElementById('exercise-title');
    const levelButtons = document.querySelectorAll('.level-btn');
    const questionArea = document.getElementById('question-area');
    const answerInput = document.getElementById('answer-input');
    const submitAnswerBtn = document.getElementById('submit-answer');
    const nextQuestionBtn = document.getElementById('next-question');
    const generateReportBtn = document.getElementById('generate-report-btn'); // Certificado de nivel
    const timerArea = document.getElementById('timer-area');
    const timeLeftSpan = document.getElementById('time-left');
    const currentExerciseNumberSpan = document.getElementById('current-exercise-number');
    const totalExercisesPerLevelSpan = document.getElementById('total-exercises-per-level');
    const moduleProgressDiv = document.getElementById('module-progress');
    const correctCountSpan = document.getElementById('correct-count'); // Aciertos nivel actual
    const targetCountSpan = document.getElementById('target-count'); // Objetivo nivel (10)

    // Elementos de la Sección de Multiplicación
    const backToMainMultBtn = document.getElementById('back-to-main-mult');
    const multiplicationGrid = document.getElementById('multiplication-grid');
    const checkAllTablesBtn = document.getElementById('check-all-tables-btn');
    const generateMultReportBtn = document.getElementById('generate-mult-report-btn'); // Certificado tablas
    const multProgressDiv = document.getElementById('mult-progress');
    const multCorrectCountSpan = document.getElementById('mult-correct-count');
    const multTargetCountSpan = document.getElementById('mult-target-count');

    // Gráfico y Certificado Final
    const progressChartCtx = document.getElementById('progressChart')?.getContext('2d');
    const progressChartContainer = document.getElementById('progress-chart-container'); // Contenedor del gráfico
    const generateFinalReportBtn = document.getElementById('generate-final-report-btn'); // Certificado final

    // Elementos de los Modales de Feedback
    const incorrectModalMessage = document.getElementById('incorrect-message');
    const correctModalMessage = document.getElementById('correct-message');
    const incorrectExplanationDiv = document.getElementById('incorrect-explanation');
    const correctExplanationDiv = document.getElementById('correct-explanation');

    // Footer
    const yearSpan = document.getElementById('current-year');

    // --- Estado de la Aplicación ---
    let userData = { firstName: '', lastName: '', age: null }; // Datos del usuario
    let currentExerciseType = null; // Tipo de ejercicio actual ('suma', 'resta', etc.)
    let currentLevel = 'basico';    // Nivel actual ('basico', 'intermedio', 'avanzado')
    let currentExerciseIndex = 0;   // Índice del ejercicio dentro del nivel (0 a 9)
    const exercisesPerLevel = 10;   // Cantidad de ejercicios por nivel
    totalExercisesPerLevelSpan.textContent = exercisesPerLevel; // Actualizar UI
    let score = {};                 // Objeto para almacenar el progreso (se carga/inicializa)
    let progressChart;              // Instancia del gráfico Chart.js
    let timerInterval;              // ID del intervalo del temporizador
    let timeRemaining;              // Segundos restantes en el temporizador
    const timerDurations = { basico: 30, intermedio: 20, avanzado: 15 }; // Duración del timer por nivel (ajustado avanzado)

    // --- Estructura de Datos por Defecto para 'score' ---
    // Define cómo debe lucir la estructura de progreso inicial o si no hay datos guardados
    function getDefaultScoreStructure() {
        const defaultLevelCorrect = { basico: 0, intermedio: 0, avanzado: 0 };
        const defaultLevelCompleted = { basico: false, intermedio: false, avanzado: false };
        const defaultOperation = { totalCorrect: 0, attempted: 0, completedLevels: { ...defaultLevelCompleted }, correctInLevel: { ...defaultLevelCorrect } };

        return {
            suma: { ...defaultOperation, completedLevels: { ...defaultLevelCompleted }, correctInLevel: { ...defaultLevelCorrect } },
            resta: { ...defaultOperation, completedLevels: { ...defaultLevelCompleted }, correctInLevel: { ...defaultLevelCorrect } },
            division: { ...defaultOperation, completedLevels: { ...defaultLevelCompleted }, correctInLevel: { ...defaultLevelCorrect } },
            potenciacion: { ...defaultOperation, completedLevels: { ...defaultLevelCompleted }, correctInLevel: { ...defaultLevelCorrect } },
            raiz: { ...defaultOperation, completedLevels: { ...defaultLevelCompleted }, correctInLevel: { ...defaultLevelCorrect } },
            multiplicacionTablas: { correct: 0, attempted: 0, completed: false }, // Estructura específica para tablas
        };
    }

    // --- Web Speech API (Narración) ---
    const synthVoice = window.speechSynthesis;
    let voices = []; // Array para guardar voces en español
    // Función para obtener las voces disponibles (especialmente en español)
    function populateVoiceList() {
      if(typeof synthVoice === 'undefined') { /*console.warn("Speech Synthesis not supported");*/ return; }
      voices = synthVoice.getVoices().filter(voice => voice.lang.startsWith('es'));
      //if (voices.length === 0) console.warn("No Spanish voices found for speech synthesis.");
    }
    // Intenta poblar la lista inmediatamente y luego escucha cambios
    populateVoiceList();
    if (typeof synthVoice !== 'undefined' && synthVoice.onvoiceschanged !== undefined) {
      synthVoice.onvoiceschanged = populateVoiceList; // Actualizar si las voces cambian
    }
    // Función para hablar texto usando una voz en español si está disponible
    function speak(text, rate = 0.98, pitch = 1.0) {
        if (!text || typeof synthVoice === 'undefined' || synthVoice.speaking) {
             // console.log("Narración (Skipped/Fallback):", text); // Evitar interrupciones o si no hay soporte
             return;
        }
        try {
            synthVoice.cancel(); // Cancela cualquier habla anterior
            const utterance = new SpeechSynthesisUtterance(text);
            // Prioriza voces de Google en español, luego otras variantes de español
            let selectedVoice = voices.find(voice => voice.name.toLowerCase().includes('google') && voice.lang.startsWith('es')) ||
                              voices.find(voice => voice.lang === 'es-ES') || voices.find(voice => voice.lang === 'es-MX') ||
                              voices.find(voice => voice.lang === 'es-US') || voices.find(voice => voice.lang.startsWith('es')); // Fallback a cualquier voz española

            if (selectedVoice) { // Si se encontró una voz adecuada
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
            } else {
                // console.warn("No specific Spanish voice found, using browser default for speech.");
                // Usar la voz por defecto del navegador si no se encuentra una específica
            }
            utterance.pitch = pitch; // Tono de la voz
            utterance.rate = rate;   // Velocidad del habla
            utterance.volume = 0.9; // Volumen (0 a 1)
            synthVoice.speak(utterance); // Iniciar el habla
        } catch (error) {
            console.error("Speech synthesis error:", error);
        }
    }

    // --- Sonidos (Tone.js) ---
    // Función helper para reproducir sonidos asegurando que el AudioContext esté iniciado
     const playSound = (soundFunc) => {
         if (typeof Tone === 'undefined') { /*console.warn("Tone.js not loaded.");*/ return; }
         // Iniciar AudioContext en la primera interacción si es necesario
         if (Tone.context.state !== 'running') {
            Tone.start().then(() => {
                try { soundFunc(); } catch(e) { console.error("Tone sound error after start:", e); }
            }).catch(e => console.error("Tone.start error:", e));
         } else {
             // Si ya está corriendo, ejecutar la función de sonido
             try { soundFunc(); } catch(e) { console.error("Tone sound error:", e); }
         }
    };
    // Definiciones de los diferentes sonidos de la aplicación
    const correctSound = () => playSound(() => new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.2 } }).toDestination().triggerAttackRelease("C5", "16n", Tone.now()));
    const incorrectSound = () => playSound(() => new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 } }).toDestination().triggerAttackRelease("G2", "8n", Tone.now()));
    const levelSound = () => playSound(() => new Tone.PluckSynth({ attackNoise: 0.5, dampening: 6000, resonance: 0.7 }).toDestination().triggerAttack("E4", Tone.now()));
    const clickSound = () => playSound(() => new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 2, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).toDestination().triggerAttackRelease("C#2", "64n", Tone.now()));
    const reportSound = () => playSound(() => new Tone.Synth({ oscillator: { type: 'sine' } }).toDestination().triggerAttackRelease("A4", "8n", Tone.now()));
    const congratsSound = () => playSound(() => { const s = new Tone.Synth({ oscillator: { type: 'sine' } }).toDestination(); s.triggerAttackRelease("C5", "16n", "+0"); s.triggerAttackRelease("E5", "16n", "+0.1"); s.triggerAttackRelease("G5", "8n", "+0.2"); });
    const finalCongratsSound = () => playSound(() => { const s = new Tone.FMSynth({ harmonicity: 1.5, modulationIndex: 3, detune: 0, oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.8 }, modulation: { type: "square" }, modulationEnvelope: { attack: 0.05, decay: 0.1, sustain: 0.6, release: 0.5 } }).toDestination(); s.triggerAttackRelease("C4", "1n", "+0"); s.triggerAttackRelease("G4", "1n", "+0.5"); s.triggerAttackRelease("C5", "0.5n", "+1.0"); });

    // --- Cargar/Guardar Progreso (LocalStorage) ---
    // Guarda el estado actual del usuario y su progreso
    function saveProgress() {
        try {
            const progressData = { userData, score };
            localStorage.setItem('mathAdventureProgress_v4', JSON.stringify(progressData)); // Usar clave versionada
        } catch (e) { console.error("Error saving progress:", e); }
    }
    // Carga el progreso guardado o inicializa si no existe/es inválido
    function loadProgress() {
         try {
            const savedProgress = localStorage.getItem('mathAdventureProgress_v4');
            const defaultScore = getDefaultScoreStructure();
            score = {}; // Reset score before loading/merging

            if (savedProgress) {
                const progressData = JSON.parse(savedProgress);
                // Validar y asignar userData
                if (progressData.userData && progressData.userData.firstName && progressData.userData.lastName && progressData.userData.age >= 5 && progressData.userData.age <= 12) {
                    userData = progressData.userData;
                } else {
                     console.warn("Invalid or missing user data in storage. Resetting.");
                     userData = { firstName: '', lastName: '', age: null };
                }

                // Deep merge: Asegura que todas las claves/subclaves existan, combinando datos guardados con la estructura por defecto
                Object.keys(defaultScore).forEach(opKey => {
                    score[opKey] = {
                        ...defaultScore[opKey], // Valores por defecto
                        ...(progressData.score?.[opKey] || {}), // Sobrescribir con datos guardados si existen
                        // Combinar sub-objetos explícitamente
                        completedLevels: { ...defaultScore[opKey].completedLevels, ...(progressData.score?.[opKey]?.completedLevels || {}) },
                        correctInLevel: { ...defaultScore[opKey].correctInLevel, ...(progressData.score?.[opKey]?.correctInLevel || {}) }
                    };
                    // Limpiar posibles NaN u otros datos inválidos en el progreso cargado
                    Object.keys(score[opKey].correctInLevel || {}).forEach(level => {
                        if(isNaN(score[opKey].correctInLevel[level])) score[opKey].correctInLevel[level] = 0;
                    });
                    if(isNaN(score[opKey].totalCorrect)) score[opKey].totalCorrect = 0;
                    if(isNaN(score[opKey].attempted)) score[opKey].attempted = 0;
                    if(opKey === 'multiplicacionTablas') {
                        if(isNaN(score[opKey].correct)) score[opKey].correct = 0;
                        if(isNaN(score[opKey].attempted)) score[opKey].attempted = 0;
                        if(typeof score[opKey].completed !== 'boolean') score[opKey].completed = false;
                    }
                });

                // Si los datos del usuario son válidos después de cargar, mostrar la app
                if (userData.firstName) {
                    showMainScreen();
                    updateUserInfoNav();
                    checkAllModulesCompleted();
                } else {
                    // Si no, forzar login y limpiar datos potencialmente corruptos
                    console.warn("User data still invalid after loading attempt, forcing login.");
                    score = getDefaultScoreStructure(); // Reset score
                    localStorage.removeItem('mathAdventureProgress_v4');
                    if (loginModal) loginModal.show();
                }

            } else {
                // No hay progreso guardado, usar por defecto y mostrar login
                score = getDefaultScoreStructure();
                if (loginModal) loginModal.show();
            }
        } catch (e) {
             // Error al cargar o parsear, limpiar y mostrar login
             console.error("Error loading/parsing progress:", e);
             score = getDefaultScoreStructure();
             userData = { firstName: '', lastName: '', age: null };
             localStorage.removeItem('mathAdventureProgress_v4');
             if (loginModal) loginModal.show();
        }
        // Actualizar gráfico SIEMPRE después de cargar/inicializar el score
        updateProgressChart();
    }

    // --- Lógica de Inicio de Sesión ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevenir envío normal del formulario
            clickSound(); // Sonido de click

            const firstNameInput = document.getElementById('firstName');
            const lastNameInput = document.getElementById('lastName');
            const ageInput = document.getElementById('age');
            let isValid = true; // Flag de validación

            // Resetear validación previa
            [firstNameInput, lastNameInput, ageInput].forEach(input => input.classList.remove('is-invalid'));

            // Validar Nombre
            if (!firstNameInput.value.trim()) {
                firstNameInput.classList.add('is-invalid'); isValid = false;
            }
            // Validar Apellido
            if (!lastNameInput.value.trim()) {
                lastNameInput.classList.add('is-invalid'); isValid = false;
            }
            // Validar Edad
            const ageValue = parseInt(ageInput.value);
            if (isNaN(ageValue) || ageValue < 5 || ageValue > 12) {
                ageInput.classList.add('is-invalid'); isValid = false;
                speak("La edad debe ser un número entre 5 y 12 años.");
            }

            // Si algo no es válido, detener y avisar
            if (!isValid) {
                speak("Por favor, completa todos los campos correctamente.");
                // Encontrar el primer campo inválido y enfocarlo
                const firstInvalid = loginForm.querySelector('.is-invalid');
                if(firstInvalid) firstInvalid.focus();
                return;
            }

            // Guardar datos válidos
            userData.firstName = firstNameInput.value.trim();
            userData.lastName = lastNameInput.value.trim();
            userData.age = ageValue;

            // Inicializar score si es el primer inicio de sesión
            if (Object.keys(score).length === 0 || !score.suma) { // Chequeo básico si score está vacío o incompleto
                score = getDefaultScoreStructure();
            }

            saveProgress(); // Guardar datos y score inicial
            if (loginModal) loginModal.hide(); // Ocultar modal
            showMainScreen(); // Mostrar pantalla principal
            updateUserInfoNav(); // Actualizar nombre en la barra de navegación
            speak(`¡Hola ${userData.firstName}! ¡Prepárate para la aventura matemática! Elige un desafío.`);
        });
    }
    // Actualiza la información del usuario en la barra de navegación
     function updateUserInfoNav() {
         if (userData.firstName && userInfoNav) {
             userInfoNav.textContent = `${userData.firstName} (${userData.age} años)`;
             userInfoNav.classList.remove('d-none');
         } else if (userInfoNav) {
             userInfoNav.classList.add('d-none');
         }
     }

    // --- Lógica del Modo Nocturno ---
    // Cambia entre modo claro y oscuro
    function toggleDarkMode() {
        clickSound(); // Sonido de click
        const body = document.body;
        body.classList.toggle('dark-mode'); // Alternar clase en el body
        const isDarkMode = body.classList.contains('dark-mode'); // Verificar estado actual
        if (darkModeToggle) { // Actualizar icono y tooltip
            darkModeToggle.classList.toggle('fa-moon', !isDarkMode);
            darkModeToggle.classList.toggle('fa-sun', isDarkMode);
            darkModeToggle.title = isDarkMode ? 'Cambiar a modo diurno' : 'Cambiar a modo nocturno';
        }
        localStorage.setItem('darkMode', isDarkMode); // Guardar preferencia
        if (progressChart) updateChartAppearance(isDarkMode); // Actualizar colores del gráfico
    }
    // Aplica el modo guardado al cargar la página
    function applyInitialDarkMode() {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        if (savedDarkMode) {
            document.body.classList.add('dark-mode');
            if (darkModeToggle) {
                darkModeToggle.classList.replace('fa-moon','fa-sun');
                darkModeToggle.title = 'Cambiar a modo diurno';
            }
        } else {
             if (darkModeToggle) {
                 darkModeToggle.classList.replace('fa-sun','fa-moon');
                 darkModeToggle.title = 'Cambiar a modo nocturno';
             }
        }
        // La apariencia del gráfico se actualiza después de que se crea/carga
    }

    // --- Actualizar Apariencia del Gráfico (Modo Claro/Oscuro) ---
    function updateChartAppearance(isDarkMode) {
        if (!progressChartCtx || !progressChart) return; // Salir si no hay gráfico
        // Definir colores según el modo
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDarkMode ? '#e4e6eb' : '#495057';
        const barBgColor = isDarkMode ? 'rgba(37, 117, 252, 0.7)' : 'rgba(106, 17, 203, 0.7)'; // Azul / Morado
        const barBorderColor = isDarkMode ? '#2575fc' : '#6a11cb';
        const barHoverBgColor = isDarkMode ? 'rgba(37, 117, 252, 0.9)' : 'rgba(106, 17, 203, 0.9)';
        const barHoverBorderColor = isDarkMode ? '#539BFF' : '#8A4CFF';
        const titleColor = isDarkMode ? '#ffffff' : '#333333';
        const tooltipBgColor = isDarkMode ? 'rgba(42, 42, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';

        // Aplicar colores a las opciones del gráfico
        const options = progressChart.options;
        if (options.scales && options.scales.x && options.scales.y) {
            options.scales.x.grid.color = gridColor;
            options.scales.y.grid.color = gridColor;
            options.scales.x.ticks.color = textColor;
            options.scales.y.ticks.color = textColor;
        }
        if (options.plugins && options.plugins.title) options.plugins.title.color = titleColor;
        if (options.plugins && options.plugins.tooltip) {
            options.plugins.tooltip.backgroundColor = tooltipBgColor;
            options.plugins.tooltip.titleColor = textColor;
            options.plugins.tooltip.bodyColor = textColor;
            options.plugins.tooltip.borderColor = gridColor;
        }

        // Aplicar colores a los datasets
        progressChart.data.datasets.forEach(dataset => {
            dataset.backgroundColor = barBgColor;
            dataset.borderColor = barBorderColor;
            dataset.hoverBackgroundColor = barHoverBgColor;
            dataset.hoverBorderColor = barHoverBorderColor;
        });

        progressChart.update(); // Redibujar el gráfico con los nuevos colores
    }

    // --- Lógica de Navegación entre Secciones ---
    // Muestra una sección específica y oculta las demás
    function showSection(sectionId) {
         const sections = [mainSelection, exerciseSection, multiplicationSection]; // Lista de secciones principales
         sections.forEach(section => {
             if (section && section.id !== sectionId) { // Ocultar todas excepto la deseada
                 section.classList.add('d-none');
             }
         });
          // Manejar visibilidad del gráfico por separado
         if (progressSection) progressSection.classList.add('d-none');

         const sectionToShow = document.getElementById(sectionId);
         if (sectionToShow) {
             sectionToShow.classList.remove('d-none'); // Mostrar la sección objetivo
         } else {
             console.error(`Error: Sección con ID ${sectionId} no encontrada.`);
             return; // Salir si la sección no existe
         }

         // Lógica específica: Mostrar gráfico solo con la pantalla principal
         if (sectionId === 'main-selection' && progressSection) {
             progressSection.classList.remove('d-none');
             updateProgressChart(); // Actualizar gráfico al mostrar pantalla principal
         }
    }
    // Función wrapper para mostrar la pantalla principal (Selección de Ejercicio)
    function showMainScreen() {
        clickSound();
        showSection('main-selection'); // Mostrar la sección principal y el gráfico
        currentExerciseType = null; // Resetear tipo de ejercicio
        stopTimer(); // Detener cualquier temporizador activo
        checkAllModulesCompleted(); // Verificar si se muestra el botón de certificado final
    }
    // Función wrapper para mostrar la pantalla de Ejercicios Estándar
    function showExerciseSectionWrapper(exerciseType) {
        if (!score[exerciseType]) { // Verificar si la estructura de score existe
             console.error(`Intento de iniciar ejercicio inválido: ${exerciseType}`);
             speak("Hubo un problema al iniciar este ejercicio.");
             return;
         }
        clickSound();
        currentExerciseType = exerciseType; // Establecer tipo actual
        currentLevel = 'basico'; // Empezar siempre en básico
        currentExerciseIndex = 0; // Empezar desde el primer ejercicio
        showSection('exercise-section'); // Mostrar la sección de ejercicio
        updateModuleProgressUI(); // Actualizar contadores, etc.

        // Establecer título del ejercicio
        const titles = { suma: "Sumas Divertidas", resta: "Restas Increíbles", division: "Divisiones Exactas", potenciacion: "Potencias Poderosas", raiz: "Raíces Cuadradas" };
        exerciseTitle.textContent = titles[currentExerciseType] || "Ejercicio";

        // Marcar el botón de nivel 'básico' como activo
        levelButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.level-btn[data-level="basico"]`)?.classList.add('active');

        generateQuestion(); // Generar la primera pregunta
        generateReportBtn?.classList.add('d-none'); // Ocultar botón de certificado de nivel
    }
    // Función wrapper para mostrar la pantalla de Tablas de Multiplicar
    function showMultiplicationSectionWrapper() {
         clickSound();
         currentExerciseType = 'multiplicacionTablas'; // Establecer tipo actual
         showSection('multiplication-section'); // Mostrar la sección de tablas
         generateMultiplicationTables(); // Crear las tablas
         updateMultProgressUI(); // Actualizar contadores de tablas
         // Mostrar botón de certificado de tablas solo si ya están completas
         generateMultReportBtn?.classList.toggle('d-none', !score.multiplicacionTablas.completed);
    }

    // --- Lógica Central de Ejercicios ---
    // Establece el nivel de dificultad para el ejercicio actual
    function setLevel(level) {
        // No cambiar si ya está en ese nivel, o si es el módulo de tablas, o no hay ejercicio seleccionado
        if (!currentExerciseType || currentExerciseType === 'multiplicacionTablas' || currentLevel === level) return;
        levelSound(); // Sonido de cambio de nivel
        currentLevel = level; // Actualizar nivel
        currentExerciseIndex = 0; // Resetear progreso al cambiar nivel
        // Actualizar botones de nivel
        levelButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.level-btn[data-level="${level}"]`)?.classList.add('active');
        updateModuleProgressUI(); // Resetear contadores de UI para el nuevo nivel
        generateQuestion(); // Generar primera pregunta del nuevo nivel
        generateReportBtn?.classList.add('d-none'); // Ocultar botón de certificado
        speak(`Nivel ${formatLevel(level)} seleccionado.`);
    }

    // Genera un número entero aleatorio en un rango (inclusivo)
    function getRandomInt(min, max) {
         min = Math.ceil(min); max = Math.floor(max);
         return (max < min) ? min : Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Crea el texto/HTML para la explicación en los modales de feedback
    function createExplanationHTML(type, n1, n2, answer, isTimeout = false) {
        let html = "";
        let explanationCore = "";
        // Iconos para cada operación
        const icons = { suma: '➕', resta: '➖', division: '➗', potenciacion: '✨', raiz: '√' };
        const icon = icons[type] || '';

        // Generar explicación central según el tipo de operación
        switch (type) {
            case 'suma': explanationCore = `Sumar ${icon} <strong>${n1}</strong> y <strong>${n2}</strong> es juntar. ¡El resultado es <strong>${answer}</strong>!`; break;
            case 'resta': explanationCore = `Restar ${icon} <strong>${n2}</strong> de <strong>${n1}</strong> es quitar. ¡Te quedan <strong>${answer}</strong>!`; break;
            case 'division': explanationCore = `Dividir ${icon} <strong>${n1}</strong> entre <strong>${n2}</strong> es repartir. ¡Cada parte es <strong>${answer}</strong>! (Porque ${n2} × ${answer} = ${n1})`; break;
            case 'potenciacion':
                 let factors = n2 > 1 ? Array(n2).fill(`<strong>${n1}</strong>`).join(' × ') : `<strong>${n1}</strong>`;
                 explanationCore = `Potencia ${icon} <strong>${n1}<sup>${n2}</sup></strong> es multiplicar ${n1} por sí mismo ${n2} veces: ${factors} = <strong>${answer}</strong>.`;
                break;
            case 'raiz': explanationCore = `La raíz ${icon} cuadrada de <strong>${n1}</strong> (√${n1}) busca un número que por sí mismo dé ${n1}. ¡Es <strong>${answer}</strong>! (${answer} × ${answer} = ${n1})`; break;
            default: explanationCore = `La respuesta correcta es <strong>${answer}</strong>.`;
        }

        // Formatear mensaje final (diferente si fue por tiempo agotado)
        if (isTimeout) {
            html = `<p>¡Oh no! Se acabó el tiempo ⏳.</p> <p>La respuesta correcta era <strong>${answer}</strong>.</p><hr><p>${explanationCore}</p><p>¡Ánimo para la próxima! 😉</p>`;
            if(incorrectExplanationDiv) incorrectExplanationDiv.classList.add('time-out-explanation');
        } else {
            html = explanationCore;
            if(incorrectExplanationDiv) incorrectExplanationDiv.classList.remove('time-out-explanation');
        }
        return html;
    }

    // Genera y muestra la siguiente pregunta para el tipo y nivel actual
    function generateQuestion() {
        // --- Verificación 1: Nivel ya completado ---
        if (score[currentExerciseType]?.completedLevels[currentLevel]) {
             handleLevelCompletionVisuals(); // Mostrar estado completado y salir
             return;
        }
        // --- Verificación 2: Se alcanzaron los 10 ejercicios ---
        if (currentExerciseIndex >= exercisesPerLevel) {
             // Esto debería ser manejado por checkLevelCompletion, pero es un fallback
             console.warn(`Se alcanzó el índice ${currentExerciseIndex} pero el nivel ${currentLevel} de ${currentExerciseType} no está marcado como completo.`);
             handleLevelCompletion(); // Forzar manejo de finalización
             return;
        }

        // --- Preparar UI para nueva pregunta ---
        stopTimer(); // Detener timer anterior
        if (answerInput) { answerInput.value = ''; answerInput.disabled = false; answerInput.classList.remove('is-valid', 'is-invalid'); answerInput.focus(); }
        if (submitAnswerBtn) { submitAnswerBtn.disabled = false; submitAnswerBtn.classList.remove('d-none'); }
        if (nextQuestionBtn) nextQuestionBtn.classList.add('d-none');
        if (timerArea) timerArea.classList.add('d-none');
        if (currentExerciseNumberSpan) currentExerciseNumberSpan.textContent = currentExerciseIndex + 1;

        // --- Generar números y respuesta ---
        let questionText = ''; let num1, num2, correctAnswer;
        // Configuración de rangos por nivel
        const ranges = {
            basico: { suma: [1, 10], resta: [1, 10], divMaxRes: 5, potMaxBase: 4, potMaxExp: 2, raizMaxRoot: 6 },
            intermedio: { suma: [10, 50], resta: [10, 50], divMaxRes: 8, potMaxBase: 6, potMaxExp: 3, raizMaxRoot: 10 },
            avanzado: { suma: [20, 100], resta: [20, 100], divMaxRes: 12, potMaxBase: 8, potMaxExp: 4, raizMaxRoot: 14 }
        };
        const currentRange = ranges[currentLevel];

        // Generación específica por tipo de operación
        try {
            switch (currentExerciseType) {
                case 'suma':
                    num1 = getRandomInt(currentRange.suma[0], currentRange.suma[1]);
                    num2 = getRandomInt(currentRange.suma[0], currentRange.suma[1]);
                    correctAnswer = num1 + num2; questionText = `${num1} + ${num2} = ?`; break;
                case 'resta':
                    num1 = getRandomInt(currentRange.resta[0] + Math.floor((currentRange.resta[1] - currentRange.resta[0]) * 0.3), currentRange.resta[1]); // Evitar restas muy pequeñas
                    num2 = getRandomInt(currentRange.resta[0], num1); // Asegurar resultado no negativo
                    correctAnswer = num1 - num2; questionText = `${num1} - ${num2} = ?`; break;
                case 'division': // Asegurar división exacta
                    correctAnswer = getRandomInt(1, currentRange.divMaxRes);
                    num2 = getRandomInt(2, currentRange.divMaxRes + 1); // Divisor
                    num1 = correctAnswer * num2; // Dividendo
                    questionText = `${num1} ÷ ${num2} = ?`; break;
                case 'potenciacion':
                    num1 = getRandomInt(2, currentRange.potMaxBase); // Base
                    num2 = getRandomInt(2, currentRange.potMaxExp); // Exponente
                    // Prevenir resultados excesivamente grandes en avanzado
                    if (currentLevel === 'avanzado' && num1 > 5 && num2 > 3) num2 = 3;
                    if (currentLevel === 'avanzado' && num1 > 8 && num2 > 2) num2 = 2;
                    correctAnswer = Math.pow(num1, num2);
                    if (correctAnswer > 50000) { generateQuestion(); return; } // Regenerar si es muy grande
                    questionText = `${num1}<sup>${num2}</sup> = ?`; break; // Usar <sup> para exponente
                case 'raiz': // Asegurar raíces cuadradas perfectas
                    correctAnswer = getRandomInt(2, currentRange.raizMaxRoot); // La raíz
                    num1 = correctAnswer * correctAnswer; // El número bajo la raíz
                    questionText = `√${num1} = ?`; break;
                default: throw new Error(`Tipo de ejercicio desconocido: ${currentExerciseType}`);
            }
        } catch (error) {
             console.error("Error generating question details:", error);
             if (questionArea) questionArea.innerHTML = "Error al generar pregunta."; return;
        }

        // --- Mostrar Pregunta y Empezar Timer ---
        if (questionArea) {
            questionArea.innerHTML = questionText;
            // Guardar datos en el elemento para usarlos en la explicación
            questionArea.dataset.n1 = num1;
            questionArea.dataset.n2 = num2; // Puede ser undefined para raíz
            questionArea.dataset.answer = correctAnswer;
        }
        startTimer(timerDurations[currentLevel]); // Iniciar temporizador
    }

    // Inicia el temporizador para la pregunta actual
    function startTimer(seconds) {
        timeRemaining = seconds;
        if (timeLeftSpan) timeLeftSpan.textContent = timeRemaining;
        if (timerArea) timerArea.classList.remove('d-none', 'pulsing'); // Mostrar timer y resetear pulso
        // Limpiar intervalo anterior si existe
        clearInterval(timerInterval);
        // Crear nuevo intervalo
        timerInterval = setInterval(() => {
            timeRemaining--;
            if (timeLeftSpan) timeLeftSpan.textContent = timeRemaining;
            // Añadir clase 'pulsing' cuando queden 5 segundos o menos
            if (timerArea && timeRemaining <= 5 && timeRemaining > 0) {
                 timerArea.classList.add('pulsing');
            }
            // Si el tiempo llega a 0
            if (timeRemaining <= 0) {
                stopTimer(); // Detener intervalo
                handleAnswer(false, true); // Procesar como respuesta incorrecta por tiempo agotado
            }
        }, 1000); // Ejecutar cada segundo
    }
    // Detiene el temporizador actual
    function stopTimer() {
        clearInterval(timerInterval); // Limpiar intervalo
        if (timerArea) { // Ocultar área del timer y quitar pulso
            timerArea.classList.add('d-none');
            timerArea.classList.remove('pulsing');
        }
    }

    // Procesa la respuesta del usuario (correcta, incorrecta o por tiempo)
    function handleAnswer(isCorrect, timedOut = false) {
        stopTimer(); // Detener timer al responder
        // Deshabilitar input y botón de comprobar
        if (answerInput) answerInput.disabled = true;
        if (submitAnswerBtn) { submitAnswerBtn.disabled = true; submitAnswerBtn.classList.add('d-none'); }

        // Obtener datos de la pregunta para la explicación
        const n1 = parseInt(questionArea.dataset.n1);
        const n2 = parseInt(questionArea.dataset.n2); // Puede ser NaN si no aplica (ej. raíz)
        const answer = parseInt(questionArea.dataset.answer);
        const explanationHTML = createExplanationHTML(currentExerciseType, n1, n2, answer, timedOut);
        let speakExplanation = explanationHTML.replace(/<[^>]*>/g, " ").replace(/\s+/g, ' ').trim(); // Texto plano para hablar

        // Actualizar contador de intentos
        score[currentExerciseType].attempted++;

        // Procesar si es correcta
        if (isCorrect) {
            correctSound(); // Sonido de acierto
            if (answerInput) answerInput.classList.add('is-valid'); // Estilo de input correcto
            if (answerInput) answerInput.classList.remove('is-invalid');

            // Incrementar contadores de aciertos
            score[currentExerciseType].correctInLevel[currentLevel]++;
            score[currentExerciseType].totalCorrect++;
            currentExerciseIndex++; // Avanzar al siguiente ejercicio

            // Mostrar modal de feedback correcto
            if (correctModalMessage) correctModalMessage.textContent = "¡Fantástico! ¡Respuesta Correcta!";
            if (correctExplanationDiv) { // Mostrar explicación (opcionalmente)
                correctExplanationDiv.innerHTML = explanationHTML;
                correctExplanationDiv.style.display = 'block';
            }
            if (correctModal) correctModal.show();
            speak("¡Correcto! " + speakExplanation, 0.95); // Narrar feedback

        } else { // Procesar si es incorrecta o tiempo agotado
            incorrectSound(); // Sonido de error
            if (answerInput) answerInput.classList.add('is-invalid'); // Estilo de input incorrecto
            if (answerInput) answerInput.classList.remove('is-valid');
            // El índice NO avanza si la respuesta es incorrecta

            // Preparar mensajes para modal y narración
            let incorrectMsg = `¡Casi! La respuesta correcta era <strong>${answer}</strong>.`;
            let speakMsg = `Incorrecto. La respuesta correcta es ${answer}.`;
            if (timedOut) {
                incorrectMsg = `¡Se acabó el tiempo! La respuesta era <strong>${answer}</strong>.`;
                speakMsg = `¡Tiempo! La respuesta correcta es ${answer}.`;
            }
            // Mostrar modal de feedback incorrecto
            if (incorrectModalMessage) incorrectModalMessage.innerHTML = incorrectMsg;
            if (incorrectExplanationDiv) {
                incorrectExplanationDiv.innerHTML = explanationHTML;
                incorrectExplanationDiv.style.display = 'block';
            }
            if (incorrectModal) incorrectModal.show();
            speak(speakMsg + " " + speakExplanation, 0.9); // Narrar feedback
        }

        updateModuleProgressUI(); // Actualizar contadores en la UI
        const levelJustCompleted = checkLevelCompletion(); // Verificar si se completó el nivel con esta respuesta

        // Mostrar botón 'Siguiente' si el nivel NO está completo y aún quedan ejercicios
        if (!levelJustCompleted && currentExerciseIndex < exercisesPerLevel) {
             if (nextQuestionBtn) nextQuestionBtn.classList.remove('d-none');
        } else {
             if (nextQuestionBtn) nextQuestionBtn.classList.add('d-none'); // Ocultar si se completó o es el último
        }

        saveProgress(); // Guardar el estado actualizado
    }

    // Actualiza los contadores de progreso del nivel actual en la UI
    function updateModuleProgressUI() {
         const correctInLevel = score[currentExerciseType]?.correctInLevel?.[currentLevel] || 0;
         if (correctCountSpan) correctCountSpan.textContent = correctInLevel;
         if (targetCountSpan) targetCountSpan.textContent = exercisesPerLevel;
         // Asegurarse que el número de ejercicio no exceda el total
         if (currentExerciseNumberSpan) currentExerciseNumberSpan.textContent = Math.min(currentExerciseIndex + 1, exercisesPerLevel);
    }

    // Verifica si se han completado los 10 ejercicios del nivel actual
    function checkLevelCompletion() {
        const correctInLevel = score[currentExerciseType]?.correctInLevel?.[currentLevel] || 0;
        if (correctInLevel >= exercisesPerLevel) {
            // Si se completó AHORA (y no estaba completado antes)
            if (!score[currentExerciseType].completedLevels[currentLevel]) {
                score[currentExerciseType].completedLevels[currentLevel] = true; // Marcar como completado
                congratsSound(); // Sonido de felicitación
                speak(`¡Increíble ${userData.firstName}! Has completado el nivel ${formatLevel(currentLevel)} de ${getModuleName(currentExerciseType)}. ¡Puedes ver tu certificado de nivel!`);
                saveProgress(); // Guardar el estado de completado
                checkAllModulesCompleted(); // Verificar si esto completa todo el juego
            }
            handleLevelCompletionVisuals(); // Actualizar UI para mostrar estado completado
            return true; // Indicar que el nivel está completo
        }
        return false; // Indicar que el nivel no está completo
    }

    // Actualiza la UI para reflejar que un nivel ha sido completado
    function handleLevelCompletionVisuals() {
         if (questionArea) questionArea.innerHTML = `<i class="fas fa-check-circle text-success me-2"></i>¡Nivel ${formatLevel(currentLevel)} completado!`;
         if (answerInput) { answerInput.disabled = true; answerInput.value = ''; answerInput.classList.remove('is-valid', 'is-invalid'); }
         if (submitAnswerBtn) submitAnswerBtn.classList.add('d-none');
         if (nextQuestionBtn) nextQuestionBtn.classList.add('d-none'); // No hay siguiente pregunta
         if (generateReportBtn) generateReportBtn.classList.remove('d-none'); // Mostrar botón de certificado
         stopTimer(); // Asegurarse que el timer esté detenido
    }

    // Formatea la clave del nivel (e.g., 'basico' -> 'Básico')
    function formatLevel(levelKey) {
        if (!levelKey) return '';
        return levelKey.charAt(0).toUpperCase() + levelKey.slice(1);
    }

    // Valida y procesa la respuesta ingresada por el usuario
    function checkAnswer() {
        clickSound(); // Sonido de click
        if (!answerInput) return; // Salir si el input no existe
        const userAnswerStr = answerInput.value.trim();

        // Validar si la respuesta está vacía
        if (userAnswerStr === '') {
            speak("Escribe tu respuesta en el cuadro.");
            answerInput.focus(); answerInput.classList.add('is-invalid');
            setTimeout(() => answerInput.classList.remove('is-invalid'), 1500); // Quitar estilo inválido después de un tiempo
            return;
        }
        // Validar si es un número
        const userAnswer = parseInt(userAnswerStr);
        if (isNaN(userAnswer)) {
            speak("Por favor, ingresa solo números.");
            answerInput.value = ''; answerInput.focus();
            answerInput.classList.add('is-invalid');
            setTimeout(() => answerInput.classList.remove('is-invalid'), 1500);
            return;
        }
        // Si es válido, procesar
        answerInput.classList.remove('is-invalid'); // Quitar estilo inválido si lo tenía
        const correctAnswer = parseInt(questionArea.dataset.answer); // Obtener respuesta correcta del elemento
        handleAnswer(userAnswer === correctAnswer); // Llamar a la función principal de manejo de respuesta
    }

    // --- Lógica de Tablas de Multiplicar ---
    // Genera dinámicamente las tarjetas para cada tabla de multiplicar
    function generateMultiplicationTables() {
        if (!multiplicationGrid) return; // Salir si el contenedor no existe
        multiplicationGrid.innerHTML = ''; // Limpiar contenido anterior
        let totalInputs = 0; // Contador para el total de respuestas (12x12)

        // Crear una tarjeta para cada tabla (del 1 al 12)
        for (let i = 1; i <= 12; i++) {
            const col = document.createElement('div');
            col.className = 'col-12 col-sm-6 col-md-4 col-lg-4 col-xl-3 d-flex'; // Clases de Bootstrap para layout responsivo
            const card = document.createElement('div');
            card.className = 'multiplication-table-card w-100'; // Estilo de tarjeta
            const title = document.createElement('h6');
            title.textContent = `Tabla del ${i}`; card.appendChild(title); // Título de la tabla

            // Crear una fila para cada multiplicación (del 1 al 12) dentro de la tarjeta
            for (let j = 1; j <= 12; j++) {
                totalInputs++; // Incrementar contador total de inputs
                const item = document.createElement('div'); item.className = 'multiplication-item'; // Contenedor de la fila
                const questionSpan = document.createElement('span'); questionSpan.textContent = `${i} × ${j} = `; // Texto de la pregunta
                const input = document.createElement('input'); input.type = 'number'; input.dataset.correctAnswer = i * j; input.setAttribute('aria-label', `Respuesta para ${i} por ${j}`); input.inputMode = "numeric"; // Input para la respuesta
                const feedbackIconsContainer = document.createElement('div'); // Contenedor para los iconos de feedback
                feedbackIconsContainer.style.display = 'inline-flex'; feedbackIconsContainer.style.alignItems = 'center'; feedbackIconsContainer.style.marginLeft = 'auto'; // Alinear a la derecha
                const feedbackIconCorrect = document.createElement('i'); feedbackIconCorrect.className = 'fas fa-check-circle feedback-icon correct-icon'; feedbackIconCorrect.style.opacity = '0'; // Icono correcto (oculto)
                const feedbackIconIncorrect = document.createElement('i'); feedbackIconIncorrect.className = 'fas fa-times-circle feedback-icon incorrect-icon'; feedbackIconIncorrect.style.opacity = '0'; // Icono incorrecto (oculto)
                feedbackIconsContainer.appendChild(feedbackIconCorrect); feedbackIconsContainer.appendChild(feedbackIconIncorrect); // Añadir iconos al contenedor
                item.appendChild(questionSpan); item.appendChild(input); item.appendChild(feedbackIconsContainer); // Añadir pregunta, input e iconos a la fila
                card.appendChild(item); // Añadir fila a la tarjeta

                // Añadir listener al input para feedback en tiempo real (opcional pero mejora UX)
                input.addEventListener('input', (e) => handleMultiplicationInput(e.target));
            }
            col.appendChild(card); // Añadir tarjeta a la columna
            multiplicationGrid.appendChild(col); // Añadir columna al grid
        }
        // Actualizar contador total en la UI
        if(multTargetCountSpan) multTargetCountSpan.textContent = totalInputs;
        updateMultProgressUI(); // Actualizar contador de aciertos
        // Mostrar/ocultar botón de certificado según estado guardado
        generateMultReportBtn?.classList.toggle('d-none', !score.multiplicacionTablas.completed);
    }
    // Maneja el cambio en un input individual de las tablas para dar feedback visual inmediato
    function handleMultiplicationInput(inputElement) {
        const correctAnswer = parseInt(inputElement.dataset.correctAnswer);
        const userAnswerStr = inputElement.value.trim();
        const feedbackContainer = inputElement.nextElementSibling; // El div contenedor de iconos
        const correctIcon = feedbackContainer?.querySelector('.correct-icon');
        const incorrectIcon = feedbackContainer?.querySelector('.incorrect-icon');

        // Resetear estilos previos
        inputElement.classList.remove('correct', 'incorrect');
        if (correctIcon) correctIcon.style.opacity = '0';
        if (incorrectIcon) incorrectIcon.style.opacity = '0';

        // Validar y aplicar estilo/icono
        if (userAnswerStr !== '') {
            const userAnswer = parseInt(userAnswerStr);
            if (!isNaN(userAnswer)) {
                if (userAnswer === correctAnswer) {
                    inputElement.classList.add('correct');
                    if (correctIcon) correctIcon.style.opacity = '1';
                    // Opcional: Sonido suave de acierto aquí si se desea feedback inmediato muy frecuente
                    // correctSound();
                } else {
                    inputElement.classList.add('incorrect');
                    if (incorrectIcon) incorrectIcon.style.opacity = '1';
                     // Opcional: Sonido suave de error aquí
                     // incorrectSound();
                }
            }
        }
    }

    // Revisa todas las respuestas de las tablas de multiplicar al presionar el botón "Revisar Todo"
    function checkAllMultiplicationTables() {
        clickSound(); // Sonido de click
        let correctCount = 0; let attemptedCount = 0;
        const inputs = multiplicationGrid.querySelectorAll('input[type="number"]');
        let firstErrorInput = null; // Para enfocar el primer error

        // Iterar sobre todos los inputs
        inputs.forEach(input => {
            handleMultiplicationInput(input); // Validar y mostrar feedback visual para cada uno
            if (input.classList.contains('correct')) {
                correctCount++; // Contar aciertos
                attemptedCount++; // Contar como intento
            } else if (input.value.trim() !== '') { // Si está incorrecto pero tiene valor
                attemptedCount++;
                 if (!firstErrorInput) firstErrorInput = input; // Marcar como primer error
            } else { // Si está vacío al revisar todo
                 if (!firstErrorInput) firstErrorInput = input;
                 input.classList.add('incorrect'); // Marcar vacío como incorrecto
                 const incorrectIcon = input.nextElementSibling?.querySelector('.incorrect-icon');
                 if(incorrectIcon) incorrectIcon.style.opacity = '1';
            }
        });

        // Actualizar estado global de las tablas
        score.multiplicacionTablas.correct = correctCount;
        score.multiplicacionTablas.attempted = attemptedCount;
        updateMultProgressUI(); // Actualizar contadores en la UI

        // Comprobar si todas están correctas
        if (correctCount === inputs.length) {
            // Si se completó AHORA
            if (!score.multiplicacionTablas.completed) {
                 congratsSound(); // Sonido de felicitación
                 speak(`¡Increíble ${userData.firstName}! Has completado todas las tablas de multiplicar correctamente. ¡Eres un campeón de las tablas! Puedes ver tu certificado.`);
            }
            score.multiplicacionTablas.completed = true; // Marcar como completado
            generateMultReportBtn?.classList.remove('d-none'); // Mostrar botón de certificado
            checkAllModulesCompleted(); // Verificar si esto completa todo
        } else {
            // Si hay errores
             incorrectSound(); // Sonido de error general
             speak(`Tienes ${correctCount} respuestas correctas de ${inputs.length}. Revisa las que están marcadas e inténtalo de nuevo.`);
             generateMultReportBtn?.classList.add('d-none'); // Ocultar botón de certificado
             // Enfocar el primer error encontrado para facilitar la corrección
             if (firstErrorInput) { firstErrorInput.focus(); firstErrorInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        }
        saveProgress(); // Guardar el progreso actualizado
    }
    // Actualiza los contadores de progreso de las tablas en la UI
     function updateMultProgressUI() {
         if(multCorrectCountSpan) multCorrectCountSpan.textContent = score.multiplicacionTablas.correct || 0;
         // Calcular total de inputs dinámicamente o usar constante 144
         const totalInputs = multiplicationGrid?.querySelectorAll('input[type="number"]').length || 144;
         if(multTargetCountSpan) multTargetCountSpan.textContent = totalInputs;
     }

    // --- Lógica del Gráfico de Progreso ---
    // Actualiza o crea el gráfico de barras con el progreso general
    function updateProgressChart() {
        // No actualizar si el contexto no existe o si la sección principal no está visible
        if (!progressChartCtx || !mainSelection || mainSelection.classList.contains('d-none')) {
             if (progressSection) progressSection.classList.add('d-none'); // Ocultar sección si no aplica
             return;
        }
         if (progressSection) progressSection.classList.remove('d-none'); // Asegurar que la sección del gráfico sea visible

        // Preparar datos para el gráfico
        const labels = ['Suma', 'Resta', 'División', 'Potencia', 'Raíz', 'Tablas'];
        // Sumar aciertos de todos los niveles para cada operación estándar
        const data = [
            (score.suma?.correctInLevel?.basico || 0) + (score.suma?.correctInLevel?.intermedio || 0) + (score.suma?.correctInLevel?.avanzado || 0),
            (score.resta?.correctInLevel?.basico || 0) + (score.resta?.correctInLevel?.intermedio || 0) + (score.resta?.correctInLevel?.avanzado || 0),
            (score.division?.correctInLevel?.basico || 0) + (score.division?.correctInLevel?.intermedio || 0) + (score.division?.correctInLevel?.avanzado || 0),
            (score.potenciacion?.correctInLevel?.basico || 0) + (score.potenciacion?.correctInLevel?.intermedio || 0) + (score.potenciacion?.correctInLevel?.avanzado || 0),
            (score.raiz?.correctInLevel?.basico || 0) + (score.raiz?.correctInLevel?.intermedio || 0) + (score.raiz?.correctInLevel?.avanzado || 0),
            score.multiplicacionTablas?.correct || 0 // Aciertos directos de tablas
        ];
         const isDarkMode = document.body.classList.contains('dark-mode'); // Verificar tema actual

        // Si el gráfico ya existe, actualizar datos y apariencia
        if (progressChart) {
            progressChart.data.labels = labels;
            progressChart.data.datasets[0].data = data;
            updateChartAppearance(isDarkMode); // Aplicar colores del tema
        } else { // Si no existe, crearlo
            progressChart = new Chart(progressChartCtx, {
                type: 'bar', // Tipo de gráfico
                data: {
                    labels: labels, // Eje Y (operaciones)
                    datasets: [{
                        label: 'Aciertos Totales', // Leyenda (opcional)
                        data: data,              // Datos (número de aciertos)
                        borderWidth: 1,          // Ancho del borde de la barra
                        borderRadius: 8,         // Bordes redondeados
                        barThickness: 'flex',    // Grosor flexible
                        maxBarThickness: 50      // Grosor máximo
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, // Hacerlo responsivo
                    indexAxis: 'y', // Eje Y para las etiquetas (barras horizontales)
                    scales: {
                        y: { beginAtZero: true }, // Eje Y (operaciones) empieza en 0
                        x: { ticks: { stepSize: 5 } } // Eje X (aciertos), marcas cada 5
                    },
                    plugins: {
                        legend: { display: false }, // Ocultar leyenda
                        title: { display: true, text: 'Resumen de Aciertos Globales', font: { size: 18, weight: 'bold' }, padding: { top: 10, bottom: 20 } },
                        tooltip: { borderWidth: 1, bodyFont: { size: 14 }, titleFont: { size: 16, weight: 'bold' } }
                    },
                    animation: { duration: 1000, easing: 'easeOutExpo' } // Animación suave al cargar/actualizar
                }
            });
             updateChartAppearance(isDarkMode); // Aplicar colores del tema después de crearlo
        }
    }

    // --- Generación de Certificados PDF ---
    // Genera un PDF para un nivel completado, tablas completadas o el certificado final
    function generatePdfReport(moduleKey, isFinal = false, isTableCert = false) {
        if (!jsPDF) { console.error("jsPDF no está cargado!"); speak("Error al generar el certificado."); return; }
        if (!userData.firstName) { speak("Error: Faltan datos del usuario."); return; }
        reportSound(); // Sonido al generar reporte

        // Configuración del documento PDF (apaisado)
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20; // Margen interior
        const userName = `${userData.firstName} ${userData.lastName}`;
        let moduleName = "";
        let specificLevel = "";

        // Determinar el contexto (nivel, tablas o final)
        if (!isFinal && !isTableCert) { // Certificado de Nivel
            if (!moduleKey || !score[moduleKey]) { console.error(`Datos inválidos para certificado de nivel: ${moduleKey}`); return; }
            moduleName = getModuleName(moduleKey);
            specificLevel = currentLevel; // Nivel que se acaba de completar
        } else if (isTableCert) { // Certificado de Tablas
             moduleName = getModuleName('multiplicacionTablas');
             moduleKey = 'multiplicacionTablas'; // Asegurar que moduleKey sea correcto
        }
        // Si es final, moduleName y specificLevel quedan vacíos

        // --- Diseño del Certificado ---
        // Colores del borde según el tipo
        let borderColor1 = '#6a11cb', borderColor2 = '#2575fc'; // Default Nivel (Morado/Azul)
        if (isFinal) { borderColor1 = '#FFD700'; borderColor2 = '#FFA500'; }      // Final (Oro/Naranja)
        else if (isTableCert) { borderColor1 = '#2575fc'; borderColor2 = '#0dcaf0'; } // Tablas (Azul/Cian)
        else { // Nivel específico (Verde/Amarillo)
            const levelColors = { basico: ['#28a745', '#90EE90'], intermedio: ['#ffc107', '#FFD700'], avanzado: ['#dc3545', '#ff6b6b'] };
            borderColor1 = levelColors[specificLevel][0] || '#28a745';
            borderColor2 = levelColors[specificLevel][1] || '#ffc107';
        }

        // Dibujar doble borde decorativo
        doc.setLineWidth(1.5); doc.setDrawColor(borderColor1);
        doc.rect(margin / 2, margin / 2, pageWidth - margin, pageHeight - margin); // Borde exterior
        doc.setLineWidth(0.8); doc.setDrawColor(borderColor2);
        doc.rect(margin / 2 + 3, margin / 2 + 3, pageWidth - margin - 6, pageHeight - margin - 6); // Borde interior

        // Título Principal
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(30); // Tamaño grande para el título
        let title = ""; let titleColor = [106, 17, 203]; // Default Morado

        if (isFinal) { title = "🏆 ¡GRAN CAMPEÓN MATEMÁTICO! 🏆"; titleColor = [218, 165, 32]; }
        else if (isTableCert) { title = "📜 ¡MAESTRÍA EN TABLAS! 📜"; titleColor = [37, 117, 252]; }
        else { title = `🏅 ¡NIVEL ${formatLevel(specificLevel)} SUPERADO! 🏅`; titleColor = hexToRgb(borderColor1); } // Usar color del borde

        doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
        doc.text(title, pageWidth / 2, margin + 25, { align: 'center' });

        // Texto "Otorgado a"
        doc.setFontSize(16); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
        let yPos = margin + 50;
        doc.text("Este certificado se otorga a:", pageWidth / 2, yPos, { align: 'center' });
        yPos += 18;

        // Nombre del Usuario (Destacado)
        doc.setFontSize(32); doc.setFont('helvetica', 'bold'); doc.setTextColor(106, 17, 203); // Morado principal
        doc.text(userName, pageWidth / 2, yPos, { align: 'center' });
        yPos += 25;

        // Descripción del Logro
        doc.setFontSize(14); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
        let achievementText = "";
        if (isFinal) { achievementText = `Por completar exitosamente todos los desafíos y niveles de la Aventura Matemática Interactiva, demostrando una habilidad excepcional y perseverancia.`; }
        else if (isTableCert) { achievementText = `Por demostrar un dominio completo de las Tablas de Multiplicar del 1 al 12. ¡Un verdadero experto en multiplicación!`; }
        else { achievementText = `Por superar con éxito el Nivel ${formatLevel(specificLevel)} del módulo de ${moduleName}, mostrando gran aprendizaje y dedicación.`; }

        // Dividir texto largo para que quepa en el ancho
        const splitAchievement = doc.splitTextToSize(achievementText, pageWidth - 2 * margin - 40);
        doc.text(splitAchievement, pageWidth / 2, yPos, { align: 'center' });
        yPos += (splitAchievement.length * 6) + 20; // Ajustar posición Y según líneas de texto

        // Fecha y "Firma"
        doc.setFontSize(12); doc.setFont('helvetica', 'italic'); doc.setTextColor(100, 100, 100);
        doc.text(`Emitido el: ${date}`, margin + 10, pageHeight - margin - 10);
        doc.text("Aventura Matemática Interactiva", pageWidth - margin - 10, pageHeight - margin - 10, { align: 'right' });
        // Opcional: Línea para firma (simbólica)
        // doc.setLineWidth(0.3); doc.setDrawColor(150);
        // doc.line(pageWidth - margin - 80, pageHeight - margin - 15, pageWidth - margin - 10, pageHeight - margin - 15);

        // Opcional: Añadir un pequeño icono decorativo
        try { // Usar try-catch por si el icono no funciona en todos los visores PDF
             doc.setFontSize(25);
             doc.setTextColor(borderColor2[0], borderColor2[1], borderColor2[2]);
             let iconCode = '\uf135'; // Rocket
             if(isTableCert) iconCode = '\uf0ce'; // Table icon
             else if(isFinal) iconCode = '\uf091'; // Trophy icon
             else if (moduleKey === 'suma') iconCode = '\u002b'; // Plus
             // ... añadir más iconos si se desea
             doc.text(iconCode, margin + 15, pageHeight - margin - 20 ); // Posicionar icono
        } catch(e) { console.log("Icon font error in PDF"); }


        // --- Guardar PDF ---
        let filename = "";
        if (isFinal) {
            filename = `Certificado_Final_${userData.firstName}_${userData.lastName}.pdf`;
            finalCongratsSound(); // Sonido especial final
        } else if (isTableCert) {
            filename = `Certificado_Tablas_${userData.firstName}.pdf`;
            congratsSound();
        } else {
            filename = `Certificado_${moduleName}_Nivel_${specificLevel}_${userData.firstName}.pdf`;
            congratsSound();
        }

        doc.save(filename); // Descargar el archivo PDF
        // Notificación hablada
        speak(isFinal ? `¡Felicidades ${userData.firstName}! Tu certificado final ha sido generado.` : `Tu certificado para ${moduleName} ${isTableCert ? '' : ('Nivel ' + formatLevel(specificLevel))} ha sido generado.`);
    }
    // Helper para convertir color HEX a RGB (necesario para jsPDF.setTextColor)
    function hexToRgb(hex) {
        let r = 0, g = 0, b = 0;
        // 3 digits
        if (hex.length == 4) {
            r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16);
        }
        // 6 digits
        else if (hex.length == 7) {
            r = parseInt(hex[1] + hex[2], 16); g = parseInt(hex[3] + hex[4], 16); b = parseInt(hex[5] + hex[6], 16);
        }
        return [r, g, b];
    }


    // Obtiene el nombre legible del módulo a partir de su clave
     function getModuleName(key) {
         const names = {
             suma: "Suma", resta: "Resta", multiplicacionTablas: "Tablas de Multiplicar",
             division: "División", potenciacion: "Potenciación", raiz: "Raíz Cuadrada"
         };
         return names[key] || key; // Devuelve la clave si no encuentra el nombre
     }

    // Verifica si TODOS los niveles de TODAS las operaciones (y tablas) están completados
     function checkAllModulesCompleted() {
         let allComplete = true;
         const standardOps = ['suma', 'resta', 'division', 'potenciacion', 'raiz'];
         const levels = ['basico', 'intermedio', 'avanzado'];

         // Verificar operaciones estándar
         standardOps.forEach(opKey => {
             if (!score[opKey]) { // Si falta la estructura de score para esta operación
                  allComplete = false;
                  // console.warn(`Missing score structure for ${opKey} in checkAllModulesCompleted`);
                  return; // Salir del forEach para esta operación
             }
             levels.forEach(level => {
                 // Si algún nivel no está marcado como completado
                 if (!score[opKey].completedLevels?.[level]) {
                     allComplete = false;
                 }
             });
         });

         // Verificar tablas de multiplicar
         if (!score.multiplicacionTablas?.completed) {
             allComplete = false;
         }

         // Mostrar u ocultar el botón de certificado final según el estado
         if (generateFinalReportBtn) {
            generateFinalReportBtn.classList.toggle('d-none', !allComplete);
         }
         // console.log("Check All Modules Completed Status:", allComplete); // Para depuración
     }

    // --- Configuración Inicial de Event Listeners ---
    function setupEventListeners() {
        // --- Event Listeners Principales ---

        // Click en el logo para recargar/ir al inicio
        if (reloadAppButton) {
            reloadAppButton.onclick = () => {
                clickSound();
                location.reload(); // Solución simple para reiniciar
            };
        }

        // Click en las Tarjetas de Ejercicio (Usando Delegación de Eventos)
        if (mainSelection) {
            mainSelection.addEventListener('click', (event) => {
                const card = event.target.closest('.exercise-card'); // Encuentra la tarjeta clickeada
                if (card) {
                    const exerciseType = card.dataset.exercise; // Obtiene el tipo de ejercicio
                    if (exerciseType === 'multiplicacionTablas') {
                        showMultiplicationSectionWrapper(); // Muestra sección de tablas
                    } else if (score[exerciseType]) { // Si es un ejercicio estándar y existe en score
                        showExerciseSectionWrapper(exerciseType); // Muestra sección de ejercicios
                    } else {
                        console.warn(`Intento de seleccionar ejercicio no válido o sin datos: ${exerciseType}`);
                        speak(`El ejercicio de ${getModuleName(exerciseType)} no está listo.`);
                    }
                }
            });
        }

        // Botones de Volver al Menú
        if (backToMainBtn) backToMainBtn.onclick = showMainScreen;
        if (backToMainMultBtn) backToMainMultBtn.onclick = showMainScreen;

        // Botones de Nivel (Usando Delegación)
        const levelButtonContainer = document.querySelector('.level-buttons');
        if(levelButtonContainer){
            levelButtonContainer.addEventListener('click', (event) => {
                if(event.target.classList.contains('level-btn')){
                    setLevel(event.target.dataset.level);
                }
            });
        }

        // Botones y Input de Respuesta en Ejercicios
        if (submitAnswerBtn) submitAnswerBtn.onclick = checkAnswer;
        if (answerInput) {
            answerInput.addEventListener('keypress', (e) => {
                // Permitir solo números y tecla Enter/Backspace/Delete/Flechas
                if (e.key === 'Enter' && submitAnswerBtn && !submitAnswerBtn.disabled) {
                    e.preventDefault(); checkAnswer();
                } else if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                    e.preventDefault(); // Prevenir entrada de otros caracteres
                }
            });
             // Prevenir pegar texto no numérico
            answerInput.addEventListener('paste', (e) => {
                const pasteData = e.clipboardData?.getData('text');
                if (pasteData && !/^\d+$/.test(pasteData)) {
                    e.preventDefault();
                }
            });
        }
        if (nextQuestionBtn) nextQuestionBtn.onclick = () => { clickSound(); generateQuestion(); };

        // Botones de Multiplicación
        if (checkAllTablesBtn) checkAllTablesBtn.onclick = checkAllMultiplicationTables;

        // Botones de Certificado
        if (generateReportBtn) { // Certificado de Nivel
            generateReportBtn.onclick = () => {
                if (currentExerciseType && score[currentExerciseType]?.completedLevels[currentLevel]) {
                    generatePdfReport(currentExerciseType, false, false);
                } else { speak("Debes completar los 10 ejercicios de este nivel primero."); }
            };
        }
        if (generateMultReportBtn) { // Certificado de Tablas
            generateMultReportBtn.onclick = () => {
                if (score.multiplicacionTablas.completed) {
                    generatePdfReport('multiplicacionTablas', false, true);
                } else { speak("Debes completar todas las tablas primero."); }
            };
        }
        if (generateFinalReportBtn) { // Certificado Final
            generateFinalReportBtn.onclick = () => {
                checkAllModulesCompleted(); // Re-verificar estado
                if (!generateFinalReportBtn.classList.contains('d-none')) {
                     generatePdfReport(null, true, false);
                } else { speak("Aún no has completado todos los desafíos."); }
            };
        }

        // Toggle Modo Oscuro/Claro
        if (darkModeToggle) darkModeToggle.onclick = toggleDarkMode;

        // Actualizar año en el footer
        if (yearSpan) yearSpan.textContent = new Date().getFullYear();

         // Forzar inicio del AudioContext en la primera interacción del usuario (alternativa)
         /*
         let audioContextStarted = false;
         const startAudioContext = () => {
             if (!audioContextStarted && typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
                 Tone.start().then(() => {
                     audioContextStarted = true;
                     console.log("AudioContext started on user interaction.");
                 }).catch(e => console.error("Error starting AudioContext:", e));
             }
             // Remover el listener después del primer intento para no acumularlos
             document.body.removeEventListener('click', startAudioContext);
             document.body.removeEventListener('keydown', startAudioContext);
         };
         document.body.addEventListener('click', startAudioContext, { once: true });
         document.body.addEventListener('keydown', startAudioContext, { once: true });
         */
    }

    // --- Inicialización de la Aplicación ---
    function initializeApp() {
        console.log("Inicializando Aventura Matemática v4...");
        applyInitialDarkMode(); // Aplicar tema guardado
        loadProgress();         // Cargar datos o mostrar login
        setupEventListeners();    // Configurar interactividad
        console.log("Aventura Matemática lista.");
        // Opcional: Mensaje de bienvenida inicial si el usuario ya está logueado
        // if(userData.firstName) {
        //     speak(`Bienvenido de nuevo ${userData.firstName}. ¡Listo para más aventuras!`);
        // }
    }

    // Iniciar la aplicación una vez que el DOM esté completamente cargado
    initializeApp();

}); // Fin de DOMContentLoaded