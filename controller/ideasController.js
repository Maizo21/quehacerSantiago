const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ideasModels = require('../Models/ideasModels');
const { validateLength } = ideasModels;
let ideasData = ideasModels.readIdeasData();

exports.getAllIdeas = (req, res) =>{
    const id = req.query.id
    const ideaFound = ideasData.actividades_santiago.ideas.find(idea => idea.ID == id)

    if(!id){
        return res.status(200).json(ideasData)
    }else if(ideaFound){
        console.log(id);
        console.log(ideaFound);
        res.status(200).json(ideaFound)
    }else{
        res.status(404).json({Error: 'Idea no existe'})
    }
}

exports.createIdea = (req, res) =>{
    const { idea, ubicacion, etiquetas } = req.body;

    if(!idea || !ubicacion || !etiquetas){
        return res.status(400).json({Error: 'Faltan datos'})
    }

    if(!validateLength(idea, 1, 100) || !validateLength(ubicacion, 1, 100)){
        return res.status(400).json({Error: 'Los datos debe tener entre 1 y 100 caracteres'})
    }

    const ideaNew = {
        ID: uuidv4(),
        idea: idea,
        ubicacion: ubicacion,
        etiquetas: etiquetas
    }

    ideasData.actividades_santiago.ideas.push(ideaNew);

    

    res.status(201).json(ideaNew);    
}

exports.deleteIdea = (req, res) =>{
    const id = req.query.id;
    const ideaIndex = ideasData.actividades_santiago.ideas.findIndex(idea => idea.ID == id);
    if(ideaIndex === -1){
        return res.status(404).json({Error: 'Idea no encontrada'});
    }
    ideasData.actividades_santiago.ideas.splice(ideaIndex, 1);
    fs.writeFileSync(`${__dirname}/../dev-data/ideas.json`, JSON.stringify(ideasData, null, 2), 'utf-8');
    res.status(200).json({Mensaje: 'Idea eliminada correctamente'});
}

exports.updateIdea = (req, res) =>{
    const id = req.query.id;
    const { idea, ubicacion, etiquetas } = req.body;
    const ideaFound = ideasData.actividades_santiago.ideas.find(idea => idea.ID == id);
    if(!ideaFound){
        return res.status(404).json({Error: 'Idea no encontrada'});
    }

    if(!validateLength(idea, 1, 100) || !validateLength(ubicacion, 1, 100)){
        return res.status(400).json({Error: 'Los datos debe tener entre 1 y 100 caracteres'})
    }

    ideaFound.idea = idea;
    ideaFound.ubicacion = ubicacion;
    ideaFound.etiquetas = etiquetas;
    fs.writeFileSync(`${__dirname}/../dev-data/ideas.json`, JSON.stringify(ideasData, null, 2), 'utf-8');
    res.status(200).json(ideaFound);
}

exports.getRandomIdea = (req, res) => {
    const randomIndex = Math.floor(Math.random() * ideasData.actividades_santiago.ideas.length);
    console.log(randomIndex);
    const randomIdea = ideasData.actividades_santiago.ideas[randomIndex];
    console.log(randomIdea);
    res.status(200).json(randomIdea);
}