const { WebSocket } = require('ws'); require('dotenv').config();
const echo = console.log;

function normalizePayload(buffer) {
	if (Object.prototype.toString.call(buffer).split('object ')[1] == 'Uint8Array]') {
		return JSON.parse(String(buffer));
	} else {
		return buffer;
	}
}

/*socket.on('message', function(data) {
	data = normalizePayload(data);

	if (data.op === 10) {
		const jitter = Math.random();

		setTimeout(function () {
			let payload = { op: 1, d: null };
			socket.send(JSON.stringify(payload));

			console.log('begri')

			setInterval(function () {
				socket.send(payload);
			}, data.d.heartbeat_interval);
		}, data.d.heartbeat_interval * jitter);
	}

	if (data.op === 11) {
		console.log(data);
	}

	console.log(data);
});*/

const EventEmitter = require('node:events');

class Client extends EventEmitter {
	constructor(token) {
		super();
		
		this.socket = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');

		Reflect.defineProperty(this.socket, 'sendJSON', {
			value: function (data) {
				this.send(JSON.stringify(data));
			},
		});
		
		this.token = token;
	}

	login() {
		// Обработчик пейлоадов
		this.socket.on('message', (data) => {
			data = this.normalizePayload(data);

			const ops = {
				0: this.opDispatchHandler.bind(this),
				9: this.opInvalidSessionHandler.bind(this),
  				10: this.opHelloHander.bind(this),
			   11: this.opHeartbeatACKHander.bind(this),
			};

			const op = ops[data.op];

			op ? op(data) : echo(`Unhandlered op event, code: ${data.op}`);
		});
	}

	opDispatchHandler(data) {
		const events = {
			READY: this.dispatchReady.bind(this),
		};

		const event = events[data.t];

		event ? event(data) : echo(`Unhandlered dispatch event, code: ${data.t}`);
	}

	dispatchReady(data) {
		this.user = data.d.user;
		this.guilds = data.d.guilds;

		this.emit('ready');
	}

	opInvalidSessionHandler(data) {
		echo(data);
	}

	opHelloHander(data) {
		const payload = {
			op: 2,
			d: {
				token: this.token,
				intents: 1 << 9,
				properties: {
					os: 'Windows 8.1',
					browser: 'Chromium',
					device: 'Lenovo',
				},
			},
		};

		// Отправить пейлоад с идентификацией
		this.socket.sendJSON(payload);

		const jitter = Math.random();

		setTimeout(() => {
			const payload = { op: 1, d: null };
			this.socket.sendJSON(payload);	

			setInterval(() => {
				this.socket.sendJSON(payload);

			}, data.d.heartbeat_interval);
		}, data.d.heartbeat_interval * jitter);
	}

	opHeartbeatACKHander(data) {
		echo(data);
	}

	normalizePayload(buffer) {
		if (Object.prototype.toString.call(buffer).split('object ')[1] == 'Uint8Array]') {
			return JSON.parse(String(buffer));
		} else {
			return buffer;
		}
	}
}

const client = new Client(process.env.DISCORD_TOKEN);

client.on('ready', function () {
	echo(`Successfully logged in as ${client.user.username}#${client.user.discriminator}`);
});

client.login();