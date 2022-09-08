require('dotenv').config();
const echo = console.log;

const { Client } = require('./index.js');

const client = new Client(process.env.DISCORD_TOKEN, { dev: true });

client.on('ready', function() {
	echo(`Successfully loggend in as ${client.user.username}#${client.user.discriminator}`)
});

client.login();