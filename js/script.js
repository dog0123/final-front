// --- Configuración Global ---
const API_URL = 'https://digi-api.com/api/v1/digimon';
const CARD_COUNT = 3; // 3 cartas por jugador

// Referencias al DOM
const playerPanel = document.getElementById('player-panel');
const cpuPanel = document.getElementById('cpu-panel');
const playerCardsContainer = document.getElementById('player-cards');
const cpuCardsContainer = document.getElementById('cpu-cards');
const loadingOverlay = document.getElementById('loading-overlay');
const playerFactionDisplay = document.getElementById('player-faction-display');
const cpuFactionDisplay = document.getElementById('cpu-faction-display');
const playerStatus = document.getElementById('player-status');

// Estado del Juego
let playerFaction = '';
let cpuFaction = '';
let playerCards = [];
let cpuCards = [];
let isGameReady = false;

/**
 * Inicializa el juego: establece las facciones y comienza la carga de cartas.
 */
async function initializeGame() {
    // ASUMIMOS que el jugador eligió LUZ o SOMBRA en un paso anterior y lo guardó.
    // Usaremos 'sombra' por defecto si no hay elección guardada para demostrar la UI de sombra.
    const storedFaction = localStorage.getItem('eleccionJugador') || 'sombra';
    
    playerFaction = storedFaction.toLowerCase();
    
    // Determinar la facción de la CPU (la opuesta)
    cpuFaction = playerFaction === 'luz' ? 'sombra' : 'luz';
    
    playerFactionDisplay.textContent = playerFaction.toUpperCase();
    cpuFactionDisplay.textContent = cpuFaction.toUpperCase();
    
    // Configuramos la UI para el tema de la facción (usando las clases CSS planas)
    setupFactionUI(playerFaction, cpuFaction);

    // Iniciar la carga de cartas
    await loadCards();
}

/**
 * Ajusta los colores de los paneles según la facción del jugador usando las clases CSS.
 * @param {string} playerF - Faccion del jugador ('luz' o 'sombra').
 * @param {string} cpuF - Faccion de la CPU.
 */
function setupFactionUI(playerF, cpuF) {
    if (playerF === 'luz') {
        playerPanel.classList.add('player-is-luz');
    } else { 
        playerPanel.classList.add('player-is-sombra');
    }
    
    if (cpuF === 'luz') {
         cpuPanel.classList.add('cpu-is-luz');
    } else { 
         cpuPanel.classList.add('cpu-is-sombra');
    }
}

/**
 * Conecta con la API, obtiene todas las cartas y filtra las 6 necesarias.
 */
async function loadCards() {
    loadingOverlay.style.display = 'flex'; // Mostrar overlay de carga

    try {
        // 1. Obtener todas las cartas (limitamos a 500)
        playerStatus.textContent = `Buscando cartas para ${playerFaction.toUpperCase()} y ${cpuFaction.toUpperCase()}...`;
        
        const response = await fetch(`${API_URL}?pageSize=500`); 

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.statusText}`);
        }

        const data = await response.json();
        const allDigimons = data.content || [];
        
        // 2. Definir las facciones (SIMULACIÓN basada en 'level')
        // LUZ: Digimons de nivel 'Rookie', 'Champion', 'Ultimate', 'Mega'
        const LUZ_LEVELS = ['Rookie', 'Champion', 'Ultimate', 'Mega'];
        
        // 3. Filtrar las cartas por facción simulada
        // Nos aseguramos de que tengan un nivel definido y un nombre.
        const lightCards = allDigimons.filter(d => LUZ_LEVELS.includes(d.level) && d.name && d.level);
        const darkCards = allDigimons.filter(d => !LUZ_LEVELS.includes(d.level) && d.name && d.level);
        
        // 4. Chequeo de suficiencia y selección
        if (lightCards.length < CARD_COUNT || darkCards.length < CARD_COUNT) {
             throw new Error("La API no devolvió suficientes cartas. (Se necesitan 3 de cada facción).");
        }

        // Seleccionar cartas al azar
        playerCards = getRandomCards(playerFaction === 'luz' ? lightCards : darkCards, CARD_COUNT);
        cpuCards = getRandomCards(cpuFaction === 'luz' ? lightCards : darkCards, CARD_COUNT);

        // IMPRESIÓN EN CONSOLA (PUNTO PEDIDO)
        console.log(`\n--- Cartas del Jugador (${playerFaction.toUpperCase()}) ---`);
        console.log(playerCards.map(c => `[${c.level}] ${c.name}`));

        console.log(`\n--- Cartas de la CPU (${cpuFaction.toUpperCase()}) ---`);
        console.log(cpuCards.map(c => `[${c.level}] ${c.name}`));

        // 5. Renderizar la UI
        renderCards(playerCards, playerCardsContainer, 'player');
        renderCards(cpuCards, cpuCardsContainer, 'cpu');
        
        playerStatus.textContent = "¡Mazos listos! Elige tu primera carta para empezar la batalla.";
        isGameReady = true;

    } catch (error) {
        console.error('💣 Error fatal al cargar el juego:', error);
        playerStatus.textContent = `Error al cargar. (Ver consola): ${error.message}`;
    } finally {
        loadingOverlay.style.display = 'none'; // Ocultar overlay de carga
    }
}

/**
 * Obtiene N cartas al azar de un array.
 */
function getRandomCards(array, num) {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num).map(card => ({ ...card })); 
}

/**
 * Dibuja los slots de cartas boca abajo y maneja el evento de click (solo log).
 */
function renderCards(cards, container, owner) {
    container.innerHTML = ''; 
    cards.forEach((card, index) => {
        const cardSlot = document.createElement('div');
        
        cardSlot.className = 'card-slot';
        cardSlot.textContent = owner === 'player' ? 'ELEGIR' : '?';
        
        cardSlot.setAttribute('data-index', index);
        cardSlot.setAttribute('data-owner', owner);
        
        // Lógica de click (sin combatir, solo log)
        cardSlot.addEventListener('click', (e) => {
            if (!isGameReady || owner !== 'player') return; 
            
            const cardIndex = e.target.getAttribute('data-index');
            const selectedCard = playerCards[cardIndex];
            
            console.log(`\n--- CARTA SELECCIONADA (SOLO LOG, SIN COMBATE) ---`);
            console.log(`Jugador: ${owner.toUpperCase()}`);
            console.log(`Índice: ${cardIndex}`);
            console.log(`Nombre de Carta: ${selectedCard.name}`);
            console.log(`Nivel (para combate): ${selectedCard.level}`);
            
            playerStatus.textContent = `Has seleccionado ${selectedCard.name}. (Aún no combatimos)`;
        });

        container.appendChild(cardSlot);
    });
}

// Iniciar el juego al cargar la página
window.onload = initializeGame;