const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')



const characterSchema = new mongoose.Schema({
    name: String,
    gender: String,
    age: String,
    hair_color: String,
    occupation: String,
    firstAppearance : String,
    majorCrime: String,
    characterImg: String,
    isSelected: {
        type: Boolean,
        default: false
    },
    lastSelectedDate: Date
})

const Character = mongoose.model('bbdCharacter', characterSchema)

const getDailyCharacter = async () => {
    try {
        const count = await Character.countDocuments();
        if (count === 0) {
            throw new Error('Nenhum personagem encontrado no banco de dados');
        }

        // Define a hora em que o personagem deve mudar (11:00 AM UTC)
        const changeHour = 10;
        const changeMinute = 59;
        const changeSecond = 59;

        // Obtém a data atual (UTC)
        const now = new Date();

        // Ajusta a data para o horário de troca (11:00 AM UTC do mesmo dia)
        const changeTime = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            changeHour, changeMinute, changeSecond, 0
        ));

        // Se a hora atual for antes da hora de troca, subtrai um dia para pegar o personagem anterior
        if (now < changeTime) {
            changeTime.setUTCDate(changeTime.getUTCDate() - 1);
        }

        const selectedCharacter = await Character.findOne({
            lastSelectedDate: { $gte: changeTime }
        });

        if (selectedCharacter) {
            return selectedCharacter
        }

        const unselectedCharacterCount = await Character.countDocuments({ isSelected: false })
        if (unselectedCharacterCount === 0) {
            await Character.updateMany({}, { isSelected: false })
        }

        const randomCharacter = await Character.findOne({ isSelected: false }).skip(Math.floor(Math.random() * unselectedCharacterCount))

        if (randomCharacter) {
            randomCharacter.isSelected = true
            randomCharacter.lastSelectedDate = new Date()
            await randomCharacter.save()
        }

        return randomCharacter


    } catch (error) {
        console.error('Erro ao buscar o personagem do dia:', error);
        throw error;
    }
};


const getLastCharacter = async () => {
    try {
        // Obtém a data atual (UTC)
        const now = new Date();

        // Ajusta para o horário de troca (11:00 AM UTC)
        const changeHour = 10;
        const changeMinute = 59;
        const changeSecond = 59;

        const changeTime = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            changeHour, changeMinute, changeSecond, 0
        ));

        // Se a hora atual for antes da hora de troca, subtrai um dia para pegar o personagem anterior
        if (now < changeTime) {
            changeTime.setUTCDate(changeTime.getUTCDate() - 1);
        }

        // Busca um personagem cuja data de seleção seja antes do `changeTime` e ordena por data mais recente
        const lastCharacter = await Character.findOne({
            lastSelectedDate: { $lt: changeTime }
        }).sort({ lastSelectedDate: -1 });

        return lastCharacter;
    } catch (error) {
        console.error('Erro ao buscar o personagem do dia anterior:', error);
        throw error;
    }
};



// Rota no backend
router.get('/daily', async (req, res) => {
    try {
        const character = await getDailyCharacter();
        res.json(character);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch daily character' });
    }
});

router.get('/last', async (req, res) => {
    try {
        const lastCharacter = await getLastCharacter();
        if (lastCharacter) {
            res.json(lastCharacter);
        } else {
            res.status(404).json({ error: 'No last character found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch last character' });
    }
});


router.get('/', async (req, res) => {
    try {
        const { name, exactMatch, gender, filiation, occupation, age, race, hair_color, eye_color, abilites } = req.query;
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
        if (occupation) {
            const occupations = occupation.split(',');
            filter.occupation = { $in: occupations.map((occupation) => new RegExp(occupation, 'i')) };
        }
        if (abilites) filter.abilites = abilites;
        if (race) filter.race = race;
        if (hair_color) filter.hair_color = hair_color;
        if (eye_color) filter.eye_color = eye_color;

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

router.patch('/reset-last-selected-date', async (req, res) => {
    try {
        // Atualiza todos os documentos, setando lastSelectedDate para null
        await Character.updateMany({}, { lastSelectedDate: null });

        res.json({ message: 'All lastSelectedDate fields have been reset to null' });
    } catch (error) {
        console.error('Erro ao resetar os lastSelectedDate:', error);
        res.status(500).json({ error: 'Failed to reset lastSelectedDate' });
    }
});


router.patch('/:id', async (req, res) => {
    const id = req.params.id
    const charactersData = req.body;


    try {
        const updateCharacter = await Character.findByIdAndUpdate(id,
            {
                charactersData 
            },
            {
                new: true,
                runValidators: true
            }
        )
        if (!updateCharacter) {
            return res.status(404).json({ error: 'Character not found' })
        }
        res.json(updateCharacter)
    } catch (error) {
        res.status(400).json({ error: "Can't update character" })
    }

})

router.delete('/:id', async (req, res) => {

    const id = req.params.id

    try {
        const deleteCharacter = await Character.findByIdAndDelete(id)

        if (!deleteCharacter) {
            return res.status(404).json({ error: 'Character not found' })
        }

        res.json({ message: 'Character deleted' })

    } catch (error) {
        res.status(500).json({ error: 'Error deleting charatcer', details: error.message })
    }
})

router.delete('/delte/all', async (req, res) => {
    try {
        const result = await Character.deleteMany({});

        res.json({ message: `${result.deletedCount} characters deleted` });
    } catch (error) {
        console.error('Erro ao deletar todos os personagens:', error);
        res.status(500).json({ error: 'Failed to delete all characters' });
    }
});

module.exports = router