function crearControladorReservas(servicioReservas) {
  /**
   * Handler para GET /reservas (Vista HTML)
   * Obtiene el listado completo desde el servicio y renderiza la vista correspondiente.
   */
  async function listar(req, res) {
    const reservas = await servicioReservas.listar();
    res.render("reservas/lista", {
      titulo: "Listado de Reservas",
      reservas,
    });
  }

  /**
   * Handler para GET /reservas/nueva (Vista HTML)
   * Renderiza el formulario de alta vacío.
   */
  function mostrarFormulario(req, res) {
    res.render("reservas/nueva", {
      titulo: "Nueva Reserva",
      error: null,
      valores: {},
    });
  }

  /**
   * Handler para GET /reservas/:id (Vista HTML de detalle)
   */
  async function mostrarDetalle(req, res) {
    const reserva = await servicioReservas.obtenerPorId(req.params.id);
    if (!reserva) {
      return res.status(404).render("no-encontrado", {
        titulo: "Reserva no encontrada",
        mensaje: `No existe una reserva registrada con el identificador #${req.params.id}.`,
      });
    }
    res.render("reservas/detalle", {
      titulo: `Reserva #${reserva.id}`,
      reserva,
    });
  }

  /**
   * Handler para POST /reservas (Formulario Web)
   * Persiste la reserva validada y redirige al listado principal (302).
   */
  async function crear(req, res) {
    await servicioReservas.crear(req.reservaValidada);
    res.redirect("/reservas");
  }

  async function mostrarEdicion(req, res) {
    const reserva = await servicioReservas.obtenerPorId(req.params.id);
    if (!reserva) {
      return res.status(404).render("no-encontrado", {
        titulo: "Reserva no encontrada",
        mensaje: "No existe la reserva que querés editar.",
      });
    }
    res.render("reservas/editar", {
      titulo: "Editar reserva",
      error: null,
      id: reserva.id,
      valores: { ...reserva, estado: String(reserva.estado) },
    });
  }

  async function guardarEdicion(req, res) {
    const reserva = await servicioReservas.obtenerPorId(req.params.id);
    if (!reserva) {
      return res.status(404).render("no-encontrado", {
        titulo: "Reserva no encontrada",
        mensaje: "No existe la reserva que querés editar.",
      });
    }
    const datos = req.body ?? {};
    const valores = {
      estudiante: typeof datos.estudiante === "string" ? datos.estudiante : "",
      email: typeof datos.email === "string" ? datos.email : "",
      sala: typeof datos.sala === "string" ? datos.sala : "",
      fecha: typeof datos.fecha === "string" ? datos.fecha : "",
      turno: typeof datos.turno === "string" ? datos.turno : "",
      personas: typeof datos.personas === "string" ? datos.personas : "",
      estado: typeof datos.estado === "string" ? datos.estado : "",
    };
    const permitidos = [
      "estudiante",
      "email",
      "sala",
      "fecha",
      "turno",
      "personas",
      "estado",
    ];
    let hayCamposExtra = false;
    for (const campo of Object.keys(datos)) {
      if (!permitidos.includes(campo)) hayCamposExtra = true;
    }
    const personasNum = valores.personas.trim() === "" ? NaN : Number(valores.personas);
    const salaValida = ["Sala Norte", "Sala Sur", "Sala Multimedia"].includes(valores.sala);
    const turnoValido = ["Mañana", "Tarde", "Noche"].includes(valores.turno);
    const estadoValido = ["pendiente", "confirmada"].includes(valores.estado);
    if (
      hayCamposExtra ||
      !valores.estudiante.trim() ||
      !valores.email.trim().includes("@") ||
      !salaValida ||
      !valores.fecha.trim() ||
      !turnoValido ||
      !Number.isInteger(personasNum) ||
      personasNum < 1 ||
      personasNum > 6 ||
      !estadoValido
    ) {
      return res.status(400).render("reservas/editar", {
        titulo: "Editar reserva",
        error:
          "Completá todos los campos correctamente con valores válidos.",
        id: reserva.id,
        valores,
      });
    }
    const reemplazo = {
      estudiante: valores.estudiante.trim(),
      email: valores.email.trim(),
      sala: valores.sala,
      fecha: valores.fecha.trim(),
      turno: valores.turno,
      personas: personasNum,
      estado: valores.estado,
    };
    const actualizado = await servicioReservas.reemplazar(reserva.id, reemplazo);
    if (!actualizado) {
      return res.status(404).render("no-encontrado", {
        titulo: "Reserva no encontrada",
        mensaje: "La reserva ya no existe. No se guardaron cambios.",
      });
    }
    res.redirect(303, `/reservas/${actualizado.id}`);
  }


  /**
   * Handler para GET /api/reservas (API JSON)
   * Soporta filtro exacto por sala y rechaza parámetros repetidos con 400.
   */
  async function listarApi(req, res) {
    const reservas = await servicioReservas.listar();
    res.json(reservas);
  }

  async function listarApi(req, res) {
    const permitidos = ["sala", "orden", "pagina", "limite"];
    for (const campo of Object.keys(req.query)) {
      if (!permitidos.includes(campo)) {
        return res.status(400).json({ error: "Parámetro no permitido." });
      }
    }
    const sala = req.query.sala;
    if (sala !== undefined) {
      if (typeof sala !== "string" || sala.trim() === "") {
        return res
          .status(400)
          .json({ error: "El texto de sala debe tener contenido." });
      }
    }
    let orden = "estudiante";
    if (req.query.orden !== undefined) {
      orden = req.query.orden;
      if (
        orden !== "estudiante" &&
        orden !== "personas-asc" &&
        orden !== "personas-desc"
      ) {
        return res.status(400).json({ error: "Orden no permitido." });
      }
    }
    let pagina = 1;
    if (req.query.pagina !== undefined) {
      const valorPagina = req.query.pagina;
      if (typeof valorPagina !== "string" || valorPagina.trim() === "") {
        return res.status(400).json({ error: "Página inválida." });
      }
      const numPagina = Number(valorPagina);
      if (!Number.isInteger(numPagina) || numPagina < 1 || numPagina > 1000) {
        return res.status(400).json({ error: "Página fuera de rango." });
      }
      pagina = numPagina;
    }

    let limite = 2;
    if (req.query.limite !== undefined) {
      const valorLimite = req.query.limite;
      if (typeof valorLimite !== "string" || valorLimite.trim() === "") {
        return res.status(400).json({ error: "Límite inválido." });
      }
      const numLimite = Number(valorLimite);
      if (!Number.isInteger(numLimite) || numLimite < 1 || numLimite > 20) {
        return res.status(400).json({ error: "Límite fuera de rango." });
      }
      limite = numLimite;
    }

    const resultado = await servicioReservas.consultar(
      sala,
      orden,
      pagina,
      limite,
    );
    res.json(resultado);
  }

  /**
   * Handler para GET /api/reservas/:id (API JSON - Detalle)
   */
  async function obtenerApi(req, res) {
    const reserva = await servicioReservas.obtenerPorId(req.params.id);
    if (!reserva) {
      return res.status(404).json({ error: "Recurso no encontrado." });
    }
    res.json(reserva);
  }

  /**
   * Handler para POST /api/reservas (API JSON - Creación)
   * Responde con 201, el recurso guardado y la cabecera Location.
   */
  async function crearApi(req, res) {
    const reservaGuardada = await servicioReservas.crear(req.reservaValidada);
    res
      .status(201)
      .location(`/api/reservas/${reservaGuardada.id}`)
      .json(reservaGuardada);
  }

  // Handler para DELETE /api/reservas/:id (API JSON - Eliminación)
  async function eliminarApi(req, res) {
    const eliminado = await servicioReservas.eliminar(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ error: "Recurso no encontrado." });
    }
    res.status(204).end();
  }

  async function reemplazarApi(req, res) {
    const reserva = await servicioReservas.reemplazar(
      req.params.id,
      req.cambiosValidos,
    );
    if (!reserva) {
      return res.status(404).json({ error: "Recurso no encontrado." });
    }
    res.json(reserva);
  }

  async function actualizarApi(req, res) {
    const reserva = await servicioReservas.actualizar(
      req.params.id,
      req.cambiosValidos,
    );
    if (!reserva) {
      return res.status(404).json({ error: "Recurso no encontrado." });
    }
    res.json(reserva);
  }

  return {
    listar,
    mostrarFormulario,
    mostrarDetalle,
    crear,
    mostrarEdicion,
    guardarEdicion,
    listarApi,
    obtenerApi,
    crearApi,
    eliminarApi, // <-- NUEVO Añadido
    reemplazarApi, // <-- NUEVO Añadido
    actualizarApi, // <-- NUEVO Añadido
  };
}

// Exportación del constructor de controlador en formato CommonJS
module.exports = {
  crearControladorReservas,
};
