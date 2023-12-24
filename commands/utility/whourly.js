const { default: axios } = require('axios');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require("dotenv").config()

function createTable(data) {
    var stringTable = require('string-table');
    return stringTable.create(data);
}

function getPrecipitationType(code) {
    const types = {
        0: "N/A",
        1: "Rain",
        2: "Snow",
        3: "Freezing Rain",
        4: "Ice Pellets"
    }

    return types[code]
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whourly')
        .setDescription('Returns hourly weather of current day')
        .addStringOption(option => option.setName("location").setDescription("Location (ex. new york, istanbul, london, üsküdar)").setRequired(true)),

    async execute(interaction) {
        const location = interaction.options.getString('location')
        const res = await axios.post("https://api.tomorrow.io/v4/timelines?apikey=" + process.env.WEATHER_API_KEY, {
            location: location,
            fields: [
                'temperature',
                'temperatureApparent',
                'windSpeed',
                'precipitationProbability',
                'precipitationType'
            ],
            units: 'metric',
            timesteps: ['1h'],
            startTime: 'now',
            endTime: 'nowPlus12h'
        }, {
            headers: {
                "accept": "application/json",
                "Accept-Encoding": "gzip",
                "content-type": "application/json"
            }
        })

        const dataArray = res.data.data.timelines[0].intervals

        const flattendArray = []

        dataArray.forEach(element => {
            const newData = {}
            const startTime = new Date(element.startTime)
            newData.Time = startTime.toLocaleTimeString('en',
                { timeStyle: 'short', hour12: false, timeZone: 'UTC' }) + " " + startTime.getDate() + "." + (startTime.getMonth() + 1) + "." + startTime.getFullYear();

            newData.Preciption = element.values.precipitationProbability
            newData.Preciption_Type = getPrecipitationType(element.values.precipitationType)
            newData.Temperature = element.values.temperature
            newData.Feel_Like = element.values.temperatureApparent
            newData.Wind_Speed = element.values.windSpeed
            flattendArray.push(newData)
        });

        await interaction.reply(createTable(flattendArray));
    },
};