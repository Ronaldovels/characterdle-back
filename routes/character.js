const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const characterSchema = new mongoose.Schema({
    name: String,
    gender: String,
    filiation: String,
    race: String,
    hair_color: String,
    eye_color: String,
})

const Character = mongoose.model('Character', characterSchema)

router.get('/', async (req, res) => {
    try {
        const {name, gender, filiation, race, hair_color, eye_color} = req.query

        const filter = {}

        if(name) {
            const names = name.split(',')
            filter.name = {$in: names.map(name => new RegExp (name, 'i'))}
        }
        if(gender) filter.gender = gender 
        if(filiation) {
            const filiations = filiation.split(',')
            filter.filiation = {$in: filiations.map(filiation => new RegExp (filiation, 'i'))} 
        }
        if(race) filter.race = race
        if(hair_color) filter.hair_color = hair_color
        if(eye_color) filter.eye_color = eye_color


        const character = await Character.find(filter)
        res.send(character)
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch records'})
    }
})

router.post('/', async (req, res) => {
    try {
        const newCharacter = new Character({
            name: req.body.name,
            gender: req.body.gender,
            filiation: req.body.filiation,
            race: req.body.race,
            hair_color: req.body.hair_color,
            eye_color: req.body.eye_color
        })
        
        await newCharacter.save()
        res.send(newCharacter)

    } catch (error) {
        res.status(400).json({error: 'Failed to create record'})
    }
})

module.exports = router