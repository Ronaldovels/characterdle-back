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
    introducion_arc: String,
    family: String,
    techniques: String,
})

const Character = mongoose.model('Character', characterSchema)

router.get('/', async (req, res) => {
    try {
        const {name, gender, filiation, race, hair_color, eye_color, introducion_arc, family, techniques} = req.query

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
        if(introducion_arc) filter.introducion_arc = introducion_arc
        if(family) filter.family = family 
        if(techniques) filter.techniques = techniques 

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
            eye_color: req.body.eye_color,
            introducion_arc: req.body.introducion_arc,
            family: req.body.family,
            techniques: req.body.techniques,
        })
        
        await newCharacter.save()
        res.send(newCharacter)

    } catch (error) {
        res.status(400).json({error: 'Failed to create record'})
    }
})

router.patch('/:id', async (req, res) => {
    const id = req.params.id

    try {
        const updateCharacter = await Character.findByIdAndUpdate(id,
            {
                name: req.body.name,
                gender: req.body.gender,
                filiation: req.body.filiation,
                race: req.body.race,
                hair_color: req.body.hair_color,
                eye_color: req.body.eye_color,
                introducion_arc: req.body.introducion_arc,
                family: req.body.family,
                techniques: req.body.techniques
            },
            {
                new: true,
                runValidators: true
            }
        )
        if (!updateCharacter) {
            return res.status(404).json({error: 'Character not found'})
        }
        res.json(updateCharacter)
    } catch (error) {
        res.status(400).json({error: "Can't update character"})
    }

})

module.exports = router