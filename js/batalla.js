    // Variables
    const API_URL = 'https://digi-api.com/api/v1/digimon?pageSize=500';

    // Categorizacion de digimones en buenos y malos en funcion de su "type"
    const EQUIPOS = {
        luz: 'Vaccine',
        sombra: 'Virus',
    };

    // Mazo de cartas de cada categoria
    let mazosDisponibles = {
        luz: [],
        sombra: [],
    };

    let mazoJugador = []; // humano
    let mazoRival = []; // compu

    let puntosJugador = 0;
    let puntosRival = 0;

    let ronda = 0; // arrancamos en cero son 3

    let juegoActivo = false; // estado del juego

    // Elementos del DOM
    const panelJugador = document.getElementById('player-panel');
    const panelRival = document.getElementById('cpu-panel');

    const contenedorCartasJugador = document.getElementById('player-cards');
    const contenedorCartasRival = document.getElementById('cpu-cards');

    const displayEquipoJugador = document.getElementById('player-equipo-display');
    const displayEquipoRival = document.getElementById('cpu-equipo-display');

    const displayPuntosJugador = document.getElementById('player-score');
    const displayPuntosRival = document.getElementById('cpu-score');

    const estadoJugador = document.getElementById('player-status');
    const estadoRival = document.getElementById('cpu-status');
    const capaCarga = document.getElementById('loading-overlay');
    
    // Elementos del Modal
    const capaModal = document.getElementById('modal-overlay');
    const contenidoModal = document.getElementById('modal-content');
    const tituloModal = document.getElementById('modal-title');
    const mensajeModal = document.getElementById('modal-message');

    // Quien pertenece al equipo luz y quien a sombra
    const equipoJugador = localStorage.getItem('eleccionJugador');
    const equipoRival = equipoJugador === 'luz' ? 'sombra' : 'luz';

    // Por si las moscas
    // Asumir 'luz' para que el juego no se rompa si entran directamente a batalla.html
    if (!equipoJugador) {
            localStorage.setItem('eleccionJugador', 'luz'); //dejamos guardado por default luz
            window.location.reload(); 
    }

    // Utils
    function obtenerEnteroRandom(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function seleccionarCartasRandom(pool, count) {
        const selected = [];
        const availableIndices = Array.from({ length: pool.length }, (_, i) => i);

        for (let i = 0; i < count; i++) {
            if (availableIndices.length === 0) break; 
            
            const indiceRandom = obtenerEnteroRandom(0, availableIndices.length);
            const poolIndex = availableIndices.splice(indiceRandom, 1)[0];
            
            // La API no trae algun power
            // Resolvemos asignar un poder aleatorio para el atributo fuerza de cada digimon
            const power = obtenerEnteroRandom(5, 11); 
            selected.push({
                ...pool[poolIndex],
                power: power
            });
        }
        return selected;
    }
    
    // Función para esperar (sleep) en milisegundos
    function esperar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Carga de la API
    async function traerDataEquipo(nombreEquipo, contadorReintentos = 0) {
        const filterValue = EQUIPOS[nombreEquipo];
        
        // Usamos 'type' para el filtro
        const url = `${API_URL}&type=${filterValue}`; 
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status} para ${nombreEquipo}`);
            }
            const data = await response.json();

            
            const digimonList = data.content; 
            
            // Filtrar porque solo queremos digimon con imagen
            const filteredData = digimonList
                .filter(d => d.image && d.name)
                .map(d => ({
                    ...d,
            // Truncar nombre compuesto por UI
            name: d.name.split(" ")[0]
}));

console.log(`Cargadas ${filteredData.length} cartas de equipo ${nombreEquipo} (${filterValue}).`);
return filteredData;

        } catch (error) {
            // Si falla al contactar a la API
            console.error(`Error al cargar ${nombreEquipo}: `, error.message);                
            return []; 
        }
    }
    
    
    // Creando las cartas
    function crearElementoCarta(carta, esJugador = true, index) {
        const cardSlot = document.createElement('div');
        cardSlot.className = 'card-slot';
        cardSlot.dataset.index = index;
        cardSlot.dataset.power = carta.power;

        const equipoActual = esJugador ? equipoJugador : equipoRival;
        cardSlot.classList.add(`is-${equipoActual}`);

        // Frente de la carta
        const front = document.createElement('div');
        front.className = 'card-front';
        // Borde segun el equipo
        const colorBorde = esJugador ? 
            (equipoJugador === 'luz' ? '#FCD34D' : '#3B82F6') : 
            (equipoRival === 'luz' ? '#FCD34D' : '#3B82F6');
        front.style.borderColor = colorBorde;
        
        const name = document.createElement('p');
        name.className = 'card-name';
        name.textContent = carta.name;
        
        const img = document.createElement('img');
        img.className = 'card-image';
        img.src = carta.image;
        
        const powerDisplay = document.createElement('div');
        powerDisplay.className = 'card-power';
        powerDisplay.textContent = `PWR: ${carta.power}`;

        front.appendChild(name);
        front.appendChild(img);
        front.appendChild(powerDisplay);
        
        // Parte de atras de la carta
        const back = document.createElement('div');
        back.className = 'card-back';
        back.style.borderColor = colorBorde;
        back.innerHTML = 'D'; // capaz algun icono? o imagen geometrica tipo naipes?
        
        cardSlot.appendChild(front);
        cardSlot.appendChild(back);

        // TODAS las cartas boca abajo
        cardSlot.classList.add('card-flipped'); 
        // si es la del humano le agregamos el evento
        if (esJugador) {
            cardSlot.addEventListener('click', () => manejarMovidaJugador(cardSlot));
        }

        return cardSlot;
    }

    // Armamos los mazos en pantalla
    function renderizarMazos() {
        contenedorCartasJugador.innerHTML = '';
        contenedorCartasRival.innerHTML = '';

        // Renderizar cartas del jugador (boca abajo)
        mazoJugador.forEach((card, index) => {
            const cardEl = crearElementoCarta(card, true, index);
            contenedorCartasJugador.appendChild(cardEl);
        });

        // Renderizar cartas del CPU (boca abajo)
        mazoRival.forEach((card, index) => {
            const cardEl = crearElementoCarta(card, false, index);
            contenedorCartasRival.appendChild(cardEl);
        });
    }
    

    // JUEGO
    /**
     * Determina el ganador de una ronda.
     * @param {object} cartaJugador - Carta elegida por el jugador
     * @param {object} cartaRival - Carta elegida por la CPU
     * @returns {string} 'jugador', 'rival', o 'empate'
     */
    function chequearGanadorRonda(cartaJugador, cartaRival) {
        if (cartaJugador.power > cartaRival.power) {
            return 'jugador';
        } else if (cartaRival.power > cartaJugador.power) {
            return 'rival';
        } else {
            return 'empate';
        }
    }
    
    // Simula el movimiento de la computadora (elige la carta al azar)
    function movidaRival() {
        // Elegir cartas que no han sido jugadas y que estan boca abajo
        const cartasDisponibles = Array.from(contenedorCartasRival.querySelectorAll('.card-slot.card-flipped:not(.jugada)'));
        if (cartasDisponibles.length === 0) return null; // no hay ninguna disponible

        const indiceRandom = obtenerEnteroRandom(0, cartasDisponibles.length);
        const cartaRivalEl = cartasDisponibles[indiceRandom];
        
        const indiceCarta = parseInt(cartaRivalEl.dataset.index);
        return {
            elementoCarta: cartaRivalEl,
            dataCarta: mazoRival[indiceCarta]
        };
    }

    
    async function manejarMovidaJugador(elementoCartaJugador) {
        // Si el juego no esta activo o la carta ya fue usada sale con return
        if (!juegoActivo || elementoCartaJugador.classList.contains('jugada')) return;
        
        juegoActivo = false; // Bloquea los clicks durante el turno
        elementoCartaJugador.classList.add('jugada');

        const dataCartaJugador = mazoJugador[parseInt(elementoCartaJugador.dataset.index)];
        
        // Mostrar carta del jugador (quita la clase 'flipped')
        elementoCartaJugador.classList.remove('card-flipped'); 
        estadoJugador.textContent = `Tenés a ${dataCartaJugador.name} (${dataCartaJugador.power})!`;

        // CPU elige carta
        const movidaRivalData = movidaRival();
        if (!movidaRivalData) {
                estadoJugador.textContent = "Error: Mazo del Rival vacío.";
                juegoActivo = true;
                return;
        }
        
        movidaRivalData.elementoCarta.classList.add('jugada');
        estadoRival.textContent = `Oponente eligió su carta...`;

        // Esperar un momento antes de revelar la carta del CPU
        await esperar(1000);

        //Mostrar la carta del CPU
        movidaRivalData.elementoCarta.classList.remove('card-flipped');
        estadoRival.textContent = `${movidaRivalData.dataCarta.name} (${movidaRivalData.dataCarta.power}) vs ${dataCartaJugador.name} (${dataCartaJugador.power})!`;


        // Determinar el ganador
        const ganador = chequearGanadorRonda(dataCartaJugador, movidaRivalData.dataCarta);
        ronda++;
        
        // Actualizar marcador y UI
        await esperar(1500); 

        let mensaje;
        if (ganador === 'jugador') {
            puntosJugador++;
            elementoCartaJugador.classList.add('round-win');
            movidaRivalData.elementoCarta.classList.add('round-lose');
            mensaje = `Ronda ${ronda} GANADA!`;
        } else if (ganador === 'rival') {
            puntosRival++;
            elementoCartaJugador.classList.add('round-lose');
            movidaRivalData.elementoCarta.classList.add('round-win');
            mensaje = `Ronda ${ronda} perdida.`;
        } else {
            // En caso de empate, no se añade clase de resultado, pero se marca como jugada.
            mensaje = `Ronda ${ronda} EMPATE.`;
        }

        displayPuntosJugador.textContent = `Puntuación: ${puntosJugador}`;
        displayPuntosRival.textContent = `Puntuación: ${puntosRival}`;
        estadoJugador.textContent = mensaje;
        estadoRival.textContent = mensaje;

        // Verificar si termino el juego o hay otra ronda
        await esperar(2000); 
        
        // Si las 3 rondas terminaron o alguien ganó 2
        if (puntosJugador === 2 || puntosRival === 2 || ronda === 3) { 
            terminarJuego();
        } else {
            // Se dejan las clases de resultado para que el borde y sombra sean permanentes
            estadoJugador.textContent = `¡Siguiente ronda! Elegí otra carta.`;
            estadoRival.textContent = "Esperando tu movimiento...";
            juegoActivo = true;
        }
    }
    

    function terminarJuego() {
        juegoActivo = false;
        let mensajeFinal;
        let claseResultado;
        
        if (puntosJugador > puntosRival) {
            mensajeFinal = `¡GANASTE LA BATALLA ${puntosJugador} a ${puntosRival}! ¡Un crack!`;
            claseResultado = 'modal-win'; // que clase css aplicar
            tituloModal.textContent = "VICTORIA";
        } else if (puntosRival > puntosJugador) {
            mensajeFinal = `DERROTA... El CPU ganó ${puntosRival} a ${puntosJugador}.`;
            claseResultado = 'modal-lose'; // que clase css aplicar
            tituloModal.textContent = "DERROTA";
        } else {
            mensajeFinal = `¡EMPATE! Batalla igualada ${puntosJugador} a ${puntosRival}. Jugate otra!`;
            claseResultado = 'modal-tie'; // que clase css aplicar
            tituloModal.textContent = "EMPATE";
        }
        
        mensajeModal.textContent = mensajeFinal;
        
        // Limpiar clases y aplicar la nueva
        contenidoModal.className = ''; 
        contenidoModal.classList.add(claseResultado);
        
        // Mostrar modal
        capaModal.style.display = 'flex';
        setTimeout(() => contenidoModal.classList.add('visible'), 50);
        
    }
    
    
    function jugarDeNuevo() {
        // Ocultar modal
        contenidoModal.classList.remove('visible');
        capaModal.style.display = 'none';
        
        // Reiniciar limpiando el estado del juego
        // variables
        puntosJugador = 0;
        puntosRival = 0;
        ronda = 0;
        // UI
        displayPuntosJugador.textContent = `Puntuación: 0`;
        displayPuntosRival.textContent = `Puntuación: 0`;
        
        // Volver a generar mazos y mostrarlos
        const poolJugador = equipoJugador === 'luz' ? mazosDisponibles.luz : mazosDisponibles.sombra;
        const poolRival = equipoRival === 'luz' ? mazosDisponibles.luz : mazosDisponibles.sombra;
        
        
        mazoJugador = seleccionarCartasRandom(poolJugador, 3);
        mazoRival = seleccionarCartasRandom(poolRival, 3);
        
        
        renderizarMazos();
        
        juegoActivo = true;
        estadoJugador.textContent = "Cartas listos! Elegí una carta oculta para empezar la Ronda 1.";
        estadoRival.textContent = "Esperando tu movimiento...";
    }

    // Start del juego / acomodar la UI
    function configurarUI() {
        displayEquipoJugador.textContent = equipoJugador.toUpperCase();
        displayEquipoRival.textContent = equipoRival.toUpperCase();

        // Aplicar clases de estilo al jugador
        if (equipoJugador === 'luz') {
            panelJugador.classList.add('is-luz', 'player-is-luz');
        } else { 
            panelJugador.classList.add('is-sombra', 'player-is-sombra');
        }
        
        // Aplicar clases de estilo a la CPU
        if (equipoRival === 'luz') {
            panelRival.classList.add('is-luz', 'cpu-is-luz');
        } else { 
            panelRival.classList.add('is-sombra', 'cpu-is-sombra');
        }
        
        estadoJugador.textContent = "Cargando cartas...";
        estadoRival.textContent = "Cargando cartas...";
    }
    
    
    async function arrancarElJuego() {
        configurarUI();
        
        // Cargar datos de ambas equipos en paralelo
        capaCarga.textContent = "Cargando mazos... ¡No te duermas!";
        const [luzPool, sombraPool] = await Promise.all([
            traerDataEquipo('luz'),
            traerDataEquipo('sombra')
        ]);
        
        mazosDisponibles.luz = luzPool;
        mazosDisponibles.sombra = sombraPool;

        // Comprobar que haya suficientes cartas para jugar sino SE ROMPE
        const cartasRequeridas = 3;
        if (mazosDisponibles.luz.length < cartasRequeridas || mazosDisponibles.sombra.length < cartasRequeridas) {
            capaCarga.textContent = "¡Error! No hay suficientes cartas para armar los mazos. Revisa la conexión o el filtro de la API.";
            return;
        }

        // Los mazos iniciales (3 cartas c/u)
        const poolJugador = equipoJugador === 'luz' ? mazosDisponibles.luz : mazosDisponibles.sombra;
        const poolRival = equipoRival === 'luz' ? mazosDisponibles.luz : mazosDisponibles.sombra;
        
        mazoJugador = seleccionarCartasRandom(poolJugador, cartasRequeridas);
        mazoRival = seleccionarCartasRandom(poolRival, cartasRequeridas);

        // Renderizar la UI y comenzar el juego
        renderizarMazos();
        capaCarga.style.display = 'none'; // Ocultar overlay
        
        juegoActivo = true;
        estadoJugador.textContent = "Todo Listo! Elegí una carta para empezar la Ronda 1.";
        estadoRival.textContent = "Esperando tu movimiento...";

        console.log("YASTA - Juego listo.");
    }

    // Inicio del juego
    arrancarElJuego();