// Variable global para almacenar los productos cargados
let listaProductos = [];
const telefonoNegocio = "584121198804";

// 1. CARGAR Y PROCESAR EL ARCHIVO EXCEL (.CSV SEPARADO POR PUNTO Y COMA)
async function cargarProductosDesdeCSV() {
    try {
        const respuesta = await fetch('productos.csv');
        if (!respuesta.ok) throw new Error('No se pudo leer el archivo productos.csv');
        
        const textoCVS = await respuesta.text();
        
        // Dividir por líneas eliminando los retornos de carro (\r) comunes en Windows/Excel
        const lineas = textoCVS.split('\n').map(linea => linea.replace('\r', '').trim());
        const encabezados = lineas[0].split(';').map(e => e.trim());

        listaProductos = [];

        for (let i = 1; i < lineas.length; i++) {
            if (!lineas[i]) continue; // Ignorar líneas vacías
            
            const valores = lineas[i].split(';');
            let producto = {};
            
            encabezados.forEach((encabezado, index) => {
                let valor = valores[index] ? valores[index].trim() : '';
                producto[encabezado] = valor;
            });
            
            listaProductos.push(producto);
        }

        // Renderizar los productos en la interfaz
        renderizarProductos(listaProductos);
        inicializarBuscador();

    } catch (error) {
        console.error('Error al cargar el catálogo:', error);
    }
}

// 2. FUNCIÓN PARA DIBUJAR LOS PRODUCTOS EN EL HTML
function renderizarProductos(productosFiltrados) {
    // Limpiar todas las rejillas antes de pintar
    document.querySelectorAll('.products-grid').forEach(grid => grid.innerHTML = '');

    productosFiltrados.forEach(producto => {
        const contenedor = document.getElementById(producto.contenedorId);
        
        if (contenedor) {
            const precioMostrado = producto.precioi3 ? `$${producto.precioi3}` : 'Consultar';
            const textoMensaje = `¡Hola! Me interesa información y precio sobre el producto: ${producto.nombre}`;
            const urlWhatsApp = `https://wa.me/${telefonoNegocio}?text=${encodeURIComponent(textoMensaje)}`;

            // Si el campo tagBadge está vacío, se asigna uno por defecto
            let etiqueta = producto.tagBadge;
            if (!etiqueta) {
                if(producto.contenedorId.includes('avicola')) etiqueta = "Avícola";
                else if(producto.contenedorId.includes('agro')) etiqueta = "Agrícola";
                else if(producto.contenedorId.includes('alimentos')) etiqueta = "Alimentos";
                else if(producto.contenedorId.includes('mascotas')) etiqueta = "Mascotas";
                else etiqueta = "Veterinaria";
            }

            const productHTML = `
                <div class="product-item">
                    <div class="product-img" 
                        data-img="img/${producto.claseImg}" 
                        data-nombre="${producto.nombre}"
                        style="background-image: url('img/${producto.claseImg}'); background-size: cover; background-position: center;">
                    </div>
                    <div class="product-details">
                        <span class="badge ${producto.claseBadge}">${etiqueta}</span>
                        <span class="badge badge-primary">${precioMostrado}</span>
                        <h6>${producto.nombre}</h6>
                        <p>${producto.descripcion || 'Para más detalles e indicaciones sobre este producto, consulta con nuestros asesores.'}</p>
                        <a href="${urlWhatsApp}" target="_blank" class="btn-product-wa">
                            <i class="fab fa-whatsapp"></i> Consultar Precio
                        </a>
                    </div>
                </div>
            `;
            contenedor.innerHTML += productHTML;
        }
    });

    gestionarElementosVacios();
}

// 3. LÓGICA DEL BUSCADOR EN TIEMPO REAL
function inicializarBuscador() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search');

    if (!searchInput) return;

    // Remover manejadores previos para evitar duplicados si se reinicializa
    const nuevoInputHandler = (e) => {
        const tildesYMinusculas = termino => 
            termino.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const busqueda = tildesYMinusculas(e.target.value);

        if (clearBtn) {
            clearBtn.style.display = busqueda.length > 0 ? 'block' : 'none';
        }

        const filtrados = listaProductos.filter(producto => {
            return tildesYMinusculas(producto.nombre).includes(busqueda) || 
                   tildesYMinusculas(producto.descripcion).includes(busqueda);
        });

        renderizarProductos(filtrados);
    };

    searchInput.replaceWith(searchInput.cloneNode(true));
    const elementoLimpio = document.getElementById('search-input');

    elementoLimpio.addEventListener('input', nuevoInputHandler);

    if (clearBtn) {
        clearBtn.replaceWith(clearBtn.cloneNode(true));
        const nuevoClearBtn = document.getElementById('clear-search');
        
        nuevoClearBtn.addEventListener('click', () => {
            elementoLimpio.value = '';
            nuevoClearBtn.style.display = 'none';
            renderizarProductos(listaProductos);
            elementoLimpio.focus();
        });
    }
}

// 4. OCULTAR SECCIONES VACÍAS
function gestionarElementosVacios() {
    document.querySelectorAll('.rubro-block').forEach(bloque => {
        let tieneProductosVisibles = false;
        
        bloque.querySelectorAll('.products-grid').forEach(grid => {
            const tituloSubcategoria = grid.previousElementSibling;
            
            if (grid.children.length === 0) {
                if (tituloSubcategoria && tituloSubcategoria.classList.contains('subcategory-title')) {
                    tituloSubcategoria.classList.add('hidden');
                }
            } else {
                if (tituloSubcategoria && tituloSubcategoria.classList.contains('subcategory-title')) {
                    tituloSubcategoria.classList.remove('hidden');
                }
                tieneProductosVisibles = true;
            }
        });

        if (!tieneProductosVisibles) {
            bloque.classList.add('hidden');
        } else {
            bloque.classList.remove('hidden');
        }
    });
}

// 5. LÓGICA PARA AMPLIAR IMÁGENES (VENTANA MODAL)
function inicializarModalImagenes() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const captionText = document.getElementById('modal-caption');
    const closeBtn = document.querySelector('.modal-close');

    if (!modal || !modalImg) return;

    document.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('product-img')) {
            const rutaImagen = e.target.getAttribute('data-img');
            const nombreProducto = e.target.getAttribute('data-nombre');
            
            modal.style.display = "block";
            modalImg.src = rutaImagen;
            captionText.innerHTML = nombreProducto;
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            modal.style.display = "none";
        });
    }

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
}

// Inicialización de la aplicación
document.addEventListener("DOMContentLoaded", () => {
    cargarProductosDesdeCSV();
    inicializarModalImagenes();
});