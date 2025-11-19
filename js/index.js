 const cardLuz = document.getElementById('card-luz');
        const cardSombra = document.getElementById('card-sombra');
        const botonArrancar = document.getElementById('start-button');
        const mensajeEstado = document.getElementById('status-message');
        
        let equipoElegido = ''; 
        const claveDeLaSeleccion = 'eleccionJugador'; 

        // Logica de Selección
        function seleccionarEquipo(equipo) { 
            equipoElegido = equipo; 
            
            // Limpiar clases de seleccion para arrancar seguro
            cardLuz.classList.remove('selected-luz');
            cardSombra.classList.remove('selected-sombra');

            // Aplicar clase a lo seleccionado
            if (equipo === 'luz') {
                cardLuz.classList.add('selected-luz');
            } else if (equipo === 'sombra') {
                cardSombra.classList.add('selected-sombra');
            }
            
            //Habilitar botón y actualizar estado
            botonArrancar.disabled = false;
            mensajeEstado.textContent = `Seleccionaste el equipo ${equipo.toUpperCase()}. ¡A fajarse!`;
        }

        // Eventos
        cardLuz.addEventListener('click', () => seleccionarEquipo('luz'));
        cardSombra.addEventListener('click', () => seleccionarEquipo('sombra'));

        botonArrancar.addEventListener('click', () => { 
            if (equipoElegido) {
                // Guardar la seleccion del jugador 
                localStorage.setItem(claveDeLaSeleccion, equipoElegido);
                
                // Redireccionar a la pantalla de batalla
                window.location.href = 'batalla.html';
            }
        });

        // Chusmear si ya hay una seleccion guardada
        const seleccionQueYaExistia = localStorage.getItem(claveDeLaSeleccion); 
        if (seleccionQueYaExistia) {
            seleccionarEquipo(seleccionQueYaExistia); 
            // cambiar el mensaje inicial si ya hay una seleccion
            mensajeEstado.textContent = `Estás en el Equipo ${seleccionQueYaExistia.toUpperCase()}. Podés cambiarlo o ir a la batalla.`;
        }