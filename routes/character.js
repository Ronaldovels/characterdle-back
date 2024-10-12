const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const cron = require('node-cron')

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
    characterImg: String
})

const Character = mongoose.model('Character', characterSchema)

const selectedCharacter = new mongoose.Schema({
    characterId: mongoose.Schema.Types.ObjectId,
})

const SelectedCharacter = mongoose.model ('SelectedCharacter', selectedCharacter)

async function selectRandomCharacter() {
    try {
        const selectedCharacters = await SelectedCharacter.find()
        const selectedIds = selectedCharacters.map((item) => item.characterId)


        const unselectedCharacters = await Character.find({_id: {$nin: selectedIds} })

        if (unselectedCharacters.length === 0) {

            await SelectedCharacter.deleteMany( {} )

            return selectRandomCharacter()
        }


        const randomCharacter = unselectedCharacters[Math.floor(Math.random() * unselectedCharacters.length)]

        await SelectedCharacter.create( {characterId: randomCharacter._id} )

        console.log(`Personagem selecionado ${randomCharacter.name}`)
        return  randomCharacter


    } catch (error) {
        console.log(`Erro ao selecionar um personagem`, error)
    }
}

function scheduleNextExecution() {
    const now = new Date();
    const nextExecution = new Date();

    nextExecution.setUTCHours(10, 59, 59, 0);

    if (nextExecution <= now) {
        nextExecution.setUTCDate(now.getUTCDate() + 1);
    }

    const timeUntilNextExecution = nextExecution - now;

    setTimeout(() => {
        selectRandomCharacter();
        setInterval(selectRandomCharacter, 24 * 60 * 60 * 1000); // Repeat every 24 hours
    }, timeUntilNextExecution);
}

// Call the scheduling function
scheduleNextExecution();

router.get('/random', async (req, res) => {
    try {
        const lastSelected = await SelectedCharacter.findOne().sort({_id: -1}).populate('characterId')

        if (!lastSelected) {
            return res.status(404).json({message: 'Nenhum personagem foi selecionado ainda'})
        }

        const character = await Character.findById(lastSelected.characterId)

        if (!character) {
            return res.status(404).json({message: 'Não encontrado'})
        }

        res.json({character})
    } catch (error) {
        console.error(error)
    }
})


router.get('/', async (req, res) => {
    try {
        const { name, exactMatch, gender, filiation, race, hair_color, eye_color, introducion_arc, family, techniques } = req.query;
        const filter = {};

        if (name) {
            const names = name.split(',');
            if (exactMatch === 'true') {
                // Busca por nomes exatos
                filter.name = { $in: names.map((name) => new RegExp(`^${name}$`, 'i')) };
            } else {
                // Busca por nomes parciais (para sugestões)
                filter.name = { $in: names.map((name) => new RegExp(name, 'i')) };
            }
        }
        if (gender) filter.gender = gender;
        if (filiation) {
            const filiations = filiation.split(',');
            filter.filiation = { $in: filiations.map((filiation) => new RegExp(filiation, 'i')) };
        }
        if (race) filter.race = race;
        if (hair_color) filter.hair_color = hair_color;
        if (eye_color) filter.eye_color = eye_color;
        if (introducion_arc) filter.introducion_arc = introducion_arc;
        if (family) filter.family = family;
        if (techniques) filter.techniques = techniques;

        const characters = await Character.find(filter);
        res.send(characters);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch records' });
    }
});


// Rota para criar múltiplos personagens
router.post('/', async (req, res) => {
    try {
        const charactersData = req.body;

        // Verifica se é um array e se contém pelo menos um item
        if (!Array.isArray(charactersData) || charactersData.length === 0) {
            return res.status(400).json({ error: 'Envie um array de personagens' });
        }

        // Insere todos os personagens de uma vez usando insertMany
        const newCharacters = await Character.insertMany(charactersData);

        res.status(201).json(newCharacters);
    } catch (error) {
        console.error('Erro ao criar personagens:', error);
        res.status(400).json({ error: 'Failed to create characters' });
    }
});


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
                techniques: req.body.techniques,
                characterImg: req.body.characterImg
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