const sanitizeHtml = require('sanitize-html');
const ideasModels = require('../Models/ideasModels');
const { validateLength, prisma } = ideasModels;
const { activeIdeaWhere, expiredIdeaWhere, parseDateOnly, todayAsUtcDate } = require('../lib/dateUtils');

// Sanitizar texto — eliminar todo HTML
const clean = (str) => str ? sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim() : str;

// Convertir archivo en memoria a data URI base64
const fileToBase64 = (file) => {
    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
};

exports.getAllIdeas = async (req, res) => {
    const { id, search, tag } = req.query;

    // Buscar por ID (tu lógica original)
    if(id){
        const ideaFound = await prisma.idea.findFirst({
            where: { id, ...activeIdeaWhere() },
            include: { tags: { include: { tag: true } } }
        });

        if(ideaFound){
            return res.status(200).json({
                ...ideaFound,
                tags: ideaFound.tags.map(t => t.tag.nombre)
            });
        }
        return res.status(404).json({Error: 'Idea no existe'});
    }

    // Filtros de búsqueda y etiquetas
    const filters = [activeIdeaWhere()];

    if(search){
        const s = clean(search);
        filters.push({ OR: [
            { titulo: { contains: s } },
            { descripcion: { contains: s } },
            { ubicacion: { contains: s } }
        ] });
    }

    if(tag){
        const tags = Array.isArray(tag) ? tag : [tag];
        filters.push({ tags: {
            some: {
                tag: { nombre: { in: tags } }
            }
        } });
    }

    const where = { AND: filters };

    const ideas = await prisma.idea.findMany({
        where,
        include: { tags: { include: { tag: true } } },
        orderBy: { creadoEl: 'desc' }
    });

    const transformed = ideas.map(idea => ({
        ...idea,
        tags: idea.tags.map(t => t.tag.nombre)
    }));

    res.status(200).json({ ideas: transformed, total: transformed.length });
}

exports.createIdea = async (req, res) => {
    const titulo = clean(req.body.titulo);
    const descripcion = clean(req.body.descripcion);
    const ubicacion = clean(req.body.ubicacion);
    const { tags, fecha, fechaFin, destacado, precio, precioEstado, fuenteNombre, fuenteUrl } = req.body;

    if(!titulo || !ubicacion || !tags){
        return res.status(400).json({Error: 'Faltan datos'})
    }

    if(!validateLength(titulo, 1, 200) || !validateLength(ubicacion, 1, 100)){
        return res.status(400).json({Error: 'Los datos debe tener entre 1 y 100 caracteres'})
    }

    if(descripcion && !validateLength(descripcion, 0, 5000)){
        return res.status(400).json({Error: 'La descripción no puede superar los 5000 caracteres'})
    }

    const tagNames = clean(tags).split(',').map(t => t.trim()).filter(Boolean);

    if(tagNames.length > 20){
        return res.status(400).json({Error: 'Máximo 20 etiquetas por plan'})
    }

    if(tagNames.some(t => t.length > 50)){
        return res.status(400).json({Error: 'Cada etiqueta debe tener máximo 50 caracteres'})
    }

    const parsedFecha = fecha ? parseDateOnly(fecha) : null;
    const parsedFechaFin = fechaFin ? parseDateOnly(fechaFin) : null;
    if(fecha && !parsedFecha){
        return res.status(400).json({Error: 'Fecha inválida'})
    }
    if(fechaFin && !parsedFechaFin) return res.status(400).json({Error: 'Fecha final invalida'});
    if(parsedFecha && parsedFechaFin && parsedFechaFin < parsedFecha){
        return res.status(400).json({Error: 'La fecha final no puede ser anterior a la fecha inicial'});
    }

    const tagRecords = await Promise.all(
        tagNames.map(nombre =>
            prisma.tag.upsert({
                where: { nombre },
                update: {},
                create: { nombre }
            })
        )
    );

    const ideaNew = await prisma.idea.create({
        data: {
            titulo,
            descripcion: descripcion || null,
            ubicacion,
            imagenUrl: req.file ? fileToBase64(req.file) : null,
            fecha: parsedFecha,
            fechaFin: parsedFechaFin,
            precio: Math.max(0, parseInt(precio, 10) || 0),
            precioEstado: ['GRATIS', 'PAGADO', 'NO_INFORMADO'].includes(precioEstado) ? precioEstado : 'NO_INFORMADO',
            fuenteNombre: clean(fuenteNombre) || null,
            fuenteUrl: clean(fuenteUrl) || null,
            destacado: destacado === 'true',
            creadoPor: req.userName || null,
            tags: {
                create: tagRecords.map(tag => ({ tagId: tag.id }))
            }
        },
        include: { tags: { include: { tag: true } } }
    });

    res.status(201).json({
        ...ideaNew,
        tags: ideaNew.tags.map(t => t.tag.nombre)
    });
}

exports.deleteIdea = async (req, res) => {
    const id = req.query.id;

    const idea = await prisma.idea.findUnique({ where: { id } });
    if(!idea){
        return res.status(404).json({Error: 'Idea no encontrada'});
    }

    await prisma.idea.delete({ where: { id } });
    res.status(200).json({Mensaje: 'Idea eliminada correctamente'});
}

exports.updateIdea = async (req, res) => {
    const id = req.query.id;
    const { tags, fecha, fechaFin, destacado, precio, precioEstado, fuenteNombre, fuenteUrl } = req.body;
    const titulo = clean(req.body.titulo);
    const descripcion = clean(req.body.descripcion);
    const ubicacion = clean(req.body.ubicacion);

    const existing = await prisma.idea.findUnique({ where: { id } });
    if(!existing){
        return res.status(404).json({Error: 'Idea no encontrada'});
    }
    const existingEndDate = existing.fechaFin || existing.fecha;
    if(existingEndDate && existingEndDate < todayAsUtcDate() && !req.isAdmin){
        return res.status(403).json({Error: 'Solo un administrador puede editar planes vencidos'});
    }

    if(titulo && !validateLength(titulo, 1, 200)){
        return res.status(400).json({Error: 'El título debe tener entre 1 y 200 caracteres'})
    }
    if(ubicacion && !validateLength(ubicacion, 1, 100)){
        return res.status(400).json({Error: 'La ubicación debe tener entre 1 y 100 caracteres'})
    }
    if(descripcion && !validateLength(descripcion, 0, 5000)){
        return res.status(400).json({Error: 'La descripción no puede superar los 5000 caracteres'})
    }

    const data = {};
    if(titulo) data.titulo = titulo;
    if(descripcion !== undefined) data.descripcion = descripcion || null;
    if(ubicacion) data.ubicacion = ubicacion;
    if(fecha !== undefined){
        const parsed = fecha ? parseDateOnly(fecha) : null;
        if(fecha && !parsed){
            return res.status(400).json({Error: 'Fecha inválida'})
        }
        data.fecha = parsed;
    }
    if(fechaFin !== undefined){
        const parsed = fechaFin ? parseDateOnly(fechaFin) : null;
        if(fechaFin && !parsed) return res.status(400).json({Error: 'Fecha final invalida'});
        data.fechaFin = parsed;
    }
    const effectiveStart = data.fecha !== undefined ? data.fecha : existing.fecha;
    const effectiveEnd = data.fechaFin !== undefined ? data.fechaFin : existing.fechaFin;
    if(effectiveStart && effectiveEnd && effectiveEnd < effectiveStart){
        return res.status(400).json({Error: 'La fecha final no puede ser anterior a la fecha inicial'});
    }
    if(precio !== undefined) data.precio = Math.max(0, parseInt(precio, 10) || 0);
    if(precioEstado !== undefined && ['GRATIS', 'PAGADO', 'NO_INFORMADO'].includes(precioEstado)) data.precioEstado = precioEstado;
    if(fuenteNombre !== undefined) data.fuenteNombre = clean(fuenteNombre) || null;
    if(fuenteUrl !== undefined) data.fuenteUrl = clean(fuenteUrl) || null;
    if(destacado !== undefined) data.destacado = destacado === 'true';
    if(req.file) data.imagenUrl = fileToBase64(req.file);

    if(tags){
        const tagNames = clean(tags).split(',').map(t => t.trim()).filter(Boolean);

        if(tagNames.length > 20){
            return res.status(400).json({Error: 'Máximo 20 etiquetas por plan'})
        }
        if(tagNames.some(t => t.length > 50)){
            return res.status(400).json({Error: 'Cada etiqueta debe tener máximo 50 caracteres'})
        }

        const tagRecords = await Promise.all(
            tagNames.map(nombre =>
                prisma.tag.upsert({
                    where: { nombre },
                    update: {},
                    create: { nombre }
                })
            )
        );
        await prisma.ideaTag.deleteMany({ where: { ideaId: id } });
        data.tags = {
            create: tagRecords.map(tag => ({ tagId: tag.id }))
        };
    }

    const ideaUpdated = await prisma.idea.update({
        where: { id },
        data,
        include: { tags: { include: { tag: true } } }
    });

    res.status(200).json({
        ...ideaUpdated,
        tags: ideaUpdated.tags.map(t => t.tag.nombre)
    });
}

exports.getRandomIdea = async (req, res) => {
    const { tag } = req.query;
    const filters = [activeIdeaWhere()];

    if(tag){
        const tags = Array.isArray(tag) ? tag : [tag];
        filters.push({ tags: {
            some: {
                tag: { nombre: { in: tags } }
            }
        } });
    }
    const where = { AND: filters };

    const count = await prisma.idea.count({ where });
    if(count === 0){
        return res.status(404).json({Error: 'No hay ideas disponibles con esos filtros'});
    }

    const randomIndex = Math.floor(Math.random() * count);
    const [randomIdea] = await prisma.idea.findMany({
        where,
        skip: randomIndex,
        take: 1,
        include: { tags: { include: { tag: true } } }
    });

    res.status(200).json({
        ...randomIdea,
        tags: randomIdea.tags.map(t => t.tag.nombre)
    });
}

exports.getAllTags = async (req, res) => {
    const tags = await prisma.tag.findMany({
        orderBy: { nombre: 'asc' },
        include: {
            ideas: {
                where: { idea: { is: activeIdeaWhere() } },
                select: { ideaId: true }
            }
        }
    });

    res.json(tags.map(t => ({
        id: t.id,
        nombre: t.nombre,
        count: t.ideas.length
    })));
}

exports.getAdminIdeas = async (req, res) => {
    const status = String(req.query.status || 'expired').toLowerCase();
    const today = todayAsUtcDate();
    let where;
    if(status === 'expired') where = expiredIdeaWhere(today);
    else if(status === 'undated') where = { fecha: null };
    else if(status === 'active') where = activeIdeaWhere(today);
    else return res.status(400).json({ Error: 'Estado invalido' });

    const ideas = await prisma.idea.findMany({
        where,
        include: { tags: { include: { tag: true } } },
        orderBy: [{ fecha: 'desc' }, { creadoEl: 'desc' }]
    });
    res.json({
        ideas: ideas.map(idea => ({ ...idea, tags: idea.tags.map(item => item.tag.nombre) })),
        total: ideas.length
    });
};
