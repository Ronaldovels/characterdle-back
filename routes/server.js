const express = require('express')
const app = express()
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
const axios = require('axios')


app.use(express.json())
app.use(cors())
app.use(bodyParser.json())
dotenv.config()

const port = process.env.PORT
const url = process.env.MONGODB_URL
const api = process.env.API_URL

mongoose.connect(url)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.log('Failed to connect to MongoDB', error))

const eisiCharacterRoute = require("./eminenceCharacter")
app.use('/character/eisi', eisiCharacterRoute)

const coteCharacterRoute = require("./coteCharacter")
app.use('/character/cote', coteCharacterRoute)



app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

const keepAlive = () => {
    axios.get(api)
      .then(() => console.log('Pinged API to keep it alive'))
      .catch((error) => console.error('Erro ao pingar a API:', error));
  };
  
  // Envia um ping a cada 13 minutos para manter a API ativa
  //setInterval(keepAlive, 7 * 60 * 1000);