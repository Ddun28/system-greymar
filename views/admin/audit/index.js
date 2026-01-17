// Auditoría - index.js

document.addEventListener('DOMContentLoaded', () => {
    const authData = localStorage.getItem('authData');
    if (!authData) {
        window.location.href = '/proyecto-3er-trayecto/login';
    }
    
    loadAuditLogs();
});

let auditData = [];

// Reusable mappings accesibles desde cualquier función
const actionColors = {
    'crear': 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-600 dark:text-white dark:border-green-700 shadow-sm rounded-full px-3 py-0.5 text-xs ring-1 ring-green-200 dark:ring-green-400',
    'editar': 'bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-600 dark:text-white dark:border-indigo-700 shadow-sm rounded-full px-3 py-0.5 text-xs ring-1 ring-indigo-200 dark:ring-indigo-400',
    'eliminar': 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-600 dark:text-white dark:border-red-700 shadow-sm rounded-full px-3 py-0.5 text-xs ring-1 ring-red-200 dark:ring-red-400'
};

const actionIcons = {
    'crear': 'fa-plus',
    'editar': 'fa-edit',
    'eliminar': 'fa-trash'
};

const tableNames = {
    'productos': 'Productos',
    'usuarios': 'Usuarios',
    'movimientos_inventario': 'Movimientos'
};

// Colores representativos para cada tabla (usa las utilidades de Tailwind)
const tableColors = {
    'productos': 'bg-emerald-500',
    'usuarios': 'bg-indigo-500',
    'movimientos_inventario': 'bg-amber-500',
    'categorias': 'bg-teal-500'
};
async function loadAuditLogs() {
    try {
        const filterTable = document.getElementById('filterTable').value;
        const filterAction = document.getElementById('filterAction').value;
        
        let url = '/proyecto-3er-trayecto/auditoria?limit=100';
        if (filterTable) url += `&tabla=${filterTable}`;
        if (filterAction) url += `&accion=${filterAction}`;
        
        const response = await fetch(url);
        const result = await response.json();

        if (result.status === 'success') {
            auditData = result.data;
            renderAuditLogs(result.data);
        } else {
            console.error(result.message);
        }
    } catch (error) {
        console.error('Error al cargar auditoría:', error);
    }
}

function renderAuditLogs(logs) {
    const auditList = document.getElementById('audit-list');
    
    if (!logs || logs.length === 0) {
        auditList.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <p>No hay registros de auditoría</p>
                </td>
            </tr>
        `;
        return;
    }
    
    auditList.innerHTML = logs.map((log, index) => {
        
        const fecha = new Date(log.created_at);
        const fechaStr = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const tblColor = tableColors[log.tabla] || 'bg-gray-400';

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-6 py-4 text-sm dark:text-white">${fechaStr}</td>
                <td class="px-6 py-4 dark:text-white">
                    <div class="flex items-center">
                        <i class="fas fa-user-circle text-gray-400 mr-2"></i>
                        ${log.usuario_nombre_actual || log.usuario_nombre || 'Sistema'}
                    </div>
                </td>
                <td class="px-6 py-4 dark:text-white">
                        <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold shadow-sm ring-1 ring-inset transition-colors duration-150 select-none bg-gray-50 text-gray-800 ring-gray-200 dark:bg-gray-700 dark:text-white dark:ring-gray-600" title="${tableNames[log.tabla] || log.tabla}">
                        <span class="h-2 w-2 rounded-full ${tblColor} ring-1 ring-white/30 shadow-sm"></span>
                        <i class="fas fa-table text-sm opacity-90"></i>
                        <span class="leading-none max-w-[10rem] truncate">${tableNames[log.tabla] || log.tabla}</span>
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold ${actionColors[log.accion] || ''}">
                        <i class="fas ${actionIcons[log.accion] || 'fa-info-circle'} text-sm opacity-90"></i>
                        <span class="leading-none">${log.accion.charAt(0).toUpperCase() + log.accion.slice(1)}</span>
                    </span>
                </td>
                <td class="px-6 py-4 dark:text-white text-sm">#${log.registro_id}</td>
                <td class="px-6 py-4">
                    <button onclick="showDetails(${index})" class="text-blue-600 hover:underline text-sm">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function showDetails(index) {
    const log = auditData[index];
    if (!log) return;
    const metaInfo = document.getElementById('metaInfo');
    const userInfo = document.getElementById('userInfo');
    const diffContainer = document.getElementById('diffContainer');

    let oldParsed = null;
    let newParsed = null;
    try {
        oldParsed = log.datos_anteriores ? JSON.parse(log.datos_anteriores) : null;
    } catch (e) {
        oldParsed = null;
    }
    try {
        newParsed = log.datos_nuevos ? JSON.parse(log.datos_nuevos) : null;
    } catch (e) {
        newParsed = null;
    }

    // If action is edit, try to fetch the current record and merge missing fields into newParsed
    if (log.accion === 'editar') {
        // Map audit table to API endpoint
        const tableToEndpoint = {
            'productos': 'products',
            'movimientos_inventario': 'movimientos',
            'usuarios': 'users',
            'categorias': 'categories'
        };

        const endpoint = tableToEndpoint[log.tabla] || log.tabla;
        try {
            const resp = await fetch(`/proyecto-3er-trayecto/${endpoint}/${log.registro_id}`);
            if (resp.ok) {
                const resJson = await resp.json();
                if (resJson.status === 'success' && resJson.data) {
                    const current = resJson.data;

                    // If newParsed missing or incomplete, merge current values for missing keys
                    if (!newParsed) newParsed = {};
                    if (oldParsed && typeof oldParsed === 'object') {
                        Object.keys(oldParsed).forEach(k => {
                            if (typeof newParsed[k] === 'undefined' || newParsed[k] === null || newParsed[k] === '') {
                                if (typeof current[k] !== 'undefined') {
                                    newParsed[k] = current[k];
                                }
                            }
                        });
                    }

                    // Also copy any keys present in current but not in newParsed (useful for created_at, usuario_id, etc.)
                    Object.keys(current).forEach(k => {
                        if (typeof newParsed[k] === 'undefined' || newParsed[k] === null || newParsed[k] === '') {
                            newParsed[k] = current[k];
                        }
                    });
                }
            }
        } catch (e) {
            // ignore network errors; we'll display existing values
        }
    }

    const actor = log.usuario_nombre_actual || log.usuario_nombre || 'Sistema';

    userInfo.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                <i class="fas fa-user"></i>
            </div>
            <div>
                <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">${actor}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${log.usuario_id ? `ID: #${log.usuario_id}` : ''}</div>
            </div>
        </div>
    `;

    const tblColor = tableColors[log.tabla] || 'bg-gray-400';

    metaInfo.innerHTML = `
        <div class="flex flex-wrap gap-2 text-xs">
            <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-200">IP: ${log.ip_address || 'N/D'}</span>
            <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold shadow-sm ring-1 ring-inset bg-gray-50 text-gray-800 ring-gray-200 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:text-black" title="${tableNames[log.tabla] || log.tabla}">
                <span class="h-2 w-2 rounded-full ${tblColor} ring-1 ring-white/30 shadow-sm"></span>
                <i class="fas fa-table text-sm opacity-90"></i>
                <span class="max-w-[12rem] truncate">Tabla: ${tableNames[log.tabla] || log.tabla}</span>
            </span>
            <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-200">Registro: #${log.registro_id}</span>
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold ${actionColors[log.accion] || ''}">${log.accion.charAt(0).toUpperCase() + log.accion.slice(1)}</span>
        </div>
    `;

    // Construir tabla de diferencias
    function formatVal(v) {
        if (v === null || typeof v === 'undefined') return '<span class="text-gray-400">(vacío)</span>';
        if (typeof v === 'object') return `<pre class="text-sm font-mono bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-2 rounded overflow-x-auto">${JSON.stringify(v, null, 2)}</pre>`;
        return `<span class="text-gray-800 dark:text-gray-100">${String(v)}</span>`;
    }

    function buildDiffTable(oldObj, newObj, accion) {
        const rows = [];

        // Label mapping for nicer display
        function displayKeyLabel(key) {
            const map = {
                'product_stock': 'Stock producto',
                'stock': 'Stock producto',
                'cantidad': 'Cantidad',
                'tipo': 'Tipo',
                'motivo': 'Motivo'
            };
            return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }

        if (accion === 'crear') {
            if (!newObj) return '<p class="text-sm text-gray-500">No hay datos nuevos.</p>';
            for (const key of Object.keys(newObj)) {
                rows.push(`<tr class="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800"><td class="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">${displayKeyLabel(key)}</td><td class="px-4 py-2 text-green-800 dark:text-green-300">${formatVal(newObj[key])}</td></tr>`);
            }
        } else if (accion === 'eliminar') {
            if (!oldObj) return '<p class="text-sm text-gray-500">No hay datos anteriores.</p>';
            for (const key of Object.keys(oldObj)) {
                rows.push(`<tr class="border-b dark:border-gray-700 bg-white/50 dark:bg-gray-800"><td class="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">${displayKeyLabel(key)}</td><td class="px-4 py-2 text-red-800 dark:text-red-300">${formatVal(oldObj[key])}</td></tr>`);
            }
        } else {
            // editar: mostrar solo campos que cambiaron
            const keys = new Set();
            if (oldObj && typeof oldObj === 'object') Object.keys(oldObj).forEach(k => keys.add(k));
            if (newObj && typeof newObj === 'object') Object.keys(newObj).forEach(k => keys.add(k));

            for (const key of Array.from(keys)) {
                const oldV = oldObj ? oldObj[key] : undefined;
                const newV = newObj ? newObj[key] : undefined;

                const oldStr = (typeof oldV === 'object') ? JSON.stringify(oldV) : String(oldV === undefined ? '' : oldV);
                const newStr = (typeof newV === 'object') ? JSON.stringify(newV) : String(newV === undefined ? '' : newV);

                if (oldStr !== newStr) {
                    rows.push(`<tr class="border-b dark:border-gray-700 bg-white/50 dark:bg-gray-800"><td class="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">${displayKeyLabel(key)}</td><td class="px-4 py-2 text-red-400 dark:text-red-300">${formatVal(oldV)}</td><td class="px-4 py-2 text-green-400 dark:text-green-300">${formatVal(newV)}</td></tr>`);
                }
            }

            if (rows.length === 0) {
                return '<p class="text-sm text-gray-500">No se detectaron cambios específicos.</p>';
            }
        }

        // Encapsular en una tabla
        if (accion === 'editar') {
            return `
                <table class="w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-4 py-2 text-left">Campo</th>
                            <th class="px-4 py-2 text-left">Anterior</th>
                            <th class="px-4 py-2 text-left">Nuevo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.join('')}
                    </tbody>
                </table>
            `;
        }

        // crear/eliminar
        return `
            <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th class="px-4 py-2 text-left">Campo</th>
                        <th class="px-4 py-2 text-left">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.join('')}
                </tbody>
            </table>
        `;
    }

    // Construir contenido del diff dependiendo de la tabla auditada: si el registro auditado es de movimientos, asegurarnos de mostrar solo campos relevantes al movimiento
    let displayOld = oldParsed;
    let displayNew = newParsed;

    // Si por alguna razón los datos incluyen objetos anidados con otros registros, intentar simplificar.
    // Ej: si nueva contiene { movimiento: {...}, producto: {...} } y la tabla es movimientos_inventario, tomar solo movimiento
    if (log.tabla === 'movimientos_inventario') {
        if (displayOld && displayOld.movimiento) displayOld = displayOld.movimiento;
        if (displayNew && displayNew.movimiento) displayNew = displayNew.movimiento;
    }

    // Para movimientos: enriquecer con stock del producto (antes/después) para mostrar en el diff
    if (log.tabla === 'movimientos_inventario') {
        try {
            const productId = displayOld?.producto_id || displayNew?.producto_id;
            if (productId) {
                const resp = await fetch(`/proyecto-3er-trayecto/products/${productId}`);
                if (resp.ok) {
                    const rj = await resp.json();
                    if (rj.status === 'success' && rj.data) {
                        const currentStock = parseInt(rj.data.stock || 0, 10);

                        const oldCantidad = displayOld ? parseInt(displayOld.cantidad || 0, 10) : 0;
                        const newCantidad = displayNew ? parseInt(displayNew.cantidad || 0, 10) : 0;
                        const oldTipo = displayOld ? (displayOld.tipo || 'entrada') : 'entrada';
                        const newTipo = displayNew ? (displayNew.tipo || oldTipo) : oldTipo;

                        const oldEffect = (oldTipo === 'entrada') ? oldCantidad : -oldCantidad;
                        const newEffect = (newTipo === 'entrada') ? newCantidad : -newCantidad;

                        // currentStock is after the edit (DB reflects commit). Compute stock before the edit:
                        const stockBefore = currentStock + oldEffect - newEffect;
                        const stockAfter = currentStock;

                        // Attach for diff rendering
                        if (!displayOld) displayOld = {};
                        if (!displayNew) displayNew = {};
                        displayOld.product_stock = stockBefore;
                        displayNew.product_stock = stockAfter;
                        // Save product name for header
                        displayNew._product_name = rj.data.nombre || rj.data.nombre || '';
                        displayOld._product_name = rj.data.nombre || '';
                    }
                }
            }
        } catch (e) {
            // ignore
        }
    }

    // Ensure we have a product name to display in header
    let displayProductName = '';
    if (log.tabla === 'movimientos_inventario') {
        displayProductName = displayNew._product_name || displayOld._product_name || '';
        // If still empty, try to fetch movement and product explicitly
        if (!displayProductName) {
            try {
                const mvResp = await fetch(`/proyecto-3er-trayecto/movimientos/${log.registro_id}`);
                if (mvResp.ok) {
                    const mvJson = await mvResp.json();
                    if (mvJson.status === 'success' && mvJson.data) {
                        const pid = mvJson.data.producto_id || mvJson.data.productoId || null;
                        if (pid) {
                            const pResp = await fetch(`/proyecto-3er-trayecto/products/${pid}`);
                            if (pResp.ok) {
                                const pJson = await pResp.json();
                                if (pJson.status === 'success' && pJson.data) displayProductName = pJson.data.nombre || '';
                            }
                        }
                    }
                }
            } catch (e) {}
        }
    } else if (log.tabla === 'productos') {
        displayProductName = (displayNew && (displayNew.nombre || displayNew.nombre)) || (displayOld && displayOld.nombre) || '';
    }

    // Build a compact header with action badge + product name
    const actionLabel = log.accion.charAt(0).toUpperCase() + log.accion.slice(1);
    const headerHtml = `
        <div class="mb-3 flex items-center justify-start gap-3">
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-semibold ${actionColors[log.accion] || ''}">${actionLabel}</span>
            ${displayProductName ? `<div class="text-sm font-semibold dark:text-gray-100">Producto: <span class="font-medium">${displayProductName}</span></div>` : ''}
        </div>
    `;

    diffContainer.innerHTML = headerHtml + `
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            ${buildDiffTable(displayOld, displayNew, log.accion)}
        </div>
    `;

    document.getElementById('detailsModal').classList.remove('hidden');
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.add('hidden');
}

// Cerrar modal al hacer clic fuera
document.getElementById('detailsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'detailsModal') {
        closeDetailsModal();
    }
});
