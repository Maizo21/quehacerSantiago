const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');
const ideasModels = require('../Models/ideasModels');
const { validateLength, prisma } = ideasModels;

const uploadsDir = path.resolve(__dirname, '../uploads');

// Sanitizar texto — eliminar todo HTML
const clean = (str) => str ? sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim() : str;

// Validar que un path esté dentro de uploads/
const safePath = (filename) => {
    const resolved = path.resolve(uploadsDir, filename);
    if (!resolved.startsWith(uploadsDir)) return null;
    return resolved;
};

// Eliminar archivo de forma segura
const safeUnlink = (filename) => {
    const filePath = safePath(filename);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

exports.getAllIdeas = async (req, res) => {
    const { id, search, tag } = req.query;

    // Buscar por ID (tu lógica original)
    if(id){
        const ideaFound = await prisma.idea.findUnique({
            where: { id },
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
    const where = {};

    if(search){
        const s = clean(search);
        where.OR = [
            { titulo: { contains: s } },
            { descripcion: { contains: s } },
            { ubicacion: { contains: s } }
        ];
    }

    if(tag){
        const tags = Array.isArray(tag) ? tag : [tag];
        where.tags = {
            some: {
                tag: { nombre: { in: tags } }
            }
        };
    }

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
    const { tags, fecha, destacado } = req.body;

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

    if(fecha && isNaN(new Date(fecha).getTime())){
        return res.status(400).json({Error: 'Fecha inválida'})
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
            imagenUrl: req.file ? req.file.filename : null,
            fecha: fecha ? new Date(fecha) : null,
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

    if(idea.imagenUrl) safeUnlink(idea.imagenUrl);

    await prisma.idea.delete({ where: { id } });
    res.status(200).json({Mensaje: 'Idea eliminada correctamente'});
}

exports.updateIdea = async (req, res) => {
    const id = req.query.id;
    const { tags, fecha, destacado } = req.body;
    const titulo = clean(req.body.titulo);
    const descripcion = clean(req.body.descripcion);
    const ubicacion = clean(req.body.ubicacion);

    const existing = await prisma.idea.findUnique({ where: { id } });
    if(!existing){
        return res.status(404).json({Error: 'Idea no encontrada'});
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

    if(req.file && existing.imagenUrl) safeUnlink(existing.imagenUrl);

    const data = {};
    if(titulo) data.titulo = titulo;
    if(descripcion !== undefined) data.descripcion = descripcion || null;
    if(ubicacion) data.ubicacion = ubicacion;
    if(fecha !== undefined){
        if(fecha && isNaN(new Date(fecha).getTime())){
            return res.status(400).json({Error: 'Fecha inválida'})
        }
        data.fecha = fecha ? new Date(fecha) : null;
    }
    if(destacado !== undefined) data.destacado = destacado === 'true';
    if(req.file) data.imagenUrl = req.file.filename;

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
    const count = await prisma.idea.count();
    if(count === 0){
        return res.status(404).json({Error: 'No hay ideas disponibles'});
    }

    const randomIndex = Math.floor(Math.random() * count);
    const [randomIdea] = await prisma.idea.findMany({
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
        include: { _count: { select: { ideas: true } } }
    });

    res.json(tags.map(t => ({
        id: t.id,
        nombre: t.nombre,
        count: t._count.ideas
    })));
}
