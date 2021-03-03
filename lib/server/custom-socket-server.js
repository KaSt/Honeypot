"use strict";

const config = require('./../../config');
const helper = require('./helper');
const EventEmitter = require('events');
const fs = require('fs');
const net = require('net');
const FtpSrv = require('ftp-srv');
const ssh2 = require('ssh2');
const chalk = require('chalk');
const telnetSocketServer = require('./telnet-socket-server');
const { generateKeyPairSync } = require('crypto'); 

class SocketServer extends EventEmitter {
	/**
	 * @param {number} port - Socket's Port Number
	 * @param {string} name - Service Name
	 */
	constructor(port, name) {
		super();
		this.port = port;
		this.name = name;
		this.start();
	}

	start() {
		throw new Error('You have to implement the `start` method!');
	}

	onError(err) {
		if (err.code === 'EADDRINUSE') console.log(chalk.bgYellow.bold('Warning:') + ' Cannot start `' + this.name + '` service on port ' + this.port + '. Error Code: EADDRINUSE, Address already in use.');
		else if (err.code === 'EACCES') console.log(chalk.bgYellow.bold('Warning:') + ' Cannot start `' + this.name + '` service on port ' + this.port + '. Error Code: EACCES, Permission Denied.');
		else throw new Error(err);
	}
}

class SshSocketServer extends SocketServer {
	start() {
		const { publicKey, privateKey } = generateKeyPairSync('rsa',{
			modulusLength: 2048,
			publicExponent: 3,
			publicKeyEncoding: {
			  type: 'pkcs1',
			  format: 'pem'
			},
			privateKeyEncoding: {
			  type: 'pkcs1',
			  format: 'pem'
			}
		  });
		new ssh2.Server({
			hostKeys: [privateKey],
			banner: 'Secure Access\n Auhorized personnel only\n  Connections attepts are logged and tracked\n',
			ident: 'OpenSSH_7.2'
		}, (client) => {
			client.on('authentication', (ctx) => {
				if (ctx.method !== 'password') return ctx.reject(['password']);
				else if (ctx.method === 'password') {
					if (client._client_info) {
						this.emit('data', {
							'username': ctx.username,
							'password': ctx.password,
							'ip': client._client_info.ip,
							'service': this.name,
							'request': (ctx.username && ctx.username.length !== '') ? this.name + ' ' + ctx.username + '@' + config.server_ip + ':' + this.port : this.name + ' ' + config.server_ip + ':' + this.port,
							'request_headers': helper.formatHeaders(client._client_info.header)
						});
					}
					ctx.accept();
					client.end();
				}
			}).on('ready', () => {
				client.end();
			}).on('error', () => {
				client.end();
			});
		}).on('connection', (client, info) => {
			client._client_info = info;
		}).on('error', (err) => {
			this.onError(err);
		}).listen(this.port);
		console.log(chalk.bgGreen.bold('Info:') + ' '+this.name + ' server listening on: ' + this.port);
	}
}

class FtpSocketServer extends SocketServer {
	start() {
		new FtpSrv('ftp://0.0.0.0:' + this.port, {
			fs: require('./custom-ftp-file-system'),
			greeting: 'Hi There!',
			anonymous: true,
			log: require('bunyan').createLogger({level: 60, name: 'noname'})
		}).on('login', ({connection, username, password}, resolve, reject) => {
			connection.close();
			this.emit('data', {
				'username': username,
				'password': password,
				'ip': connection.ip,
				'service': this.name,
				'request': 'ftp://' + username + ':' + password + '@' + config.server_ip + ':' + this.port
			});
		}).on('error', (err) => {
			this.onError(err);
		}).listen();
		console.log(chalk.bgGreen.bold('Info:') + ' '+this.name + ' server listening on: ' + this.port);
	}
}

class TelnetSocketServer extends SocketServer {	
	start() {
		const _self = this;
		telnetSocketServer(this.port, config.telnet, function(authData) {
			_self.emit('data', {
				'username': authData.username,
				'password': authData.password,
				'ip': authData.ip,
				'service': _self.name,
				'request': _self.name + " " + authData.username + ':' + authData.password + '@' + config.server_ip + ':' + _self.port
			});
		});
		console.log(chalk.bgGreen.bold('Info:') + ' '+this.name + ' server listening on: ' + this.port);
	}
}
class GenericSocketServer extends SocketServer {
	start() {
		net.createServer((socket) => {
			socket.setEncoding('utf8');
			socket.on('error', (err) => {
				socket.end();
				socket.destroy();
			});
			socket.write('Hi There ' + socket.remoteAddress + ':' + socket.remotePort + '\r\n');
			socket.setTimeout(5000);
			socket.on('timeout', () => {
				this.log(socket);
				socket.end();
				socket.destroy();
			});
			socket.on('data', (data) => {
				this.log(socket, data);
				socket.end();
				socket.destroy();
			});
		}).on('error', (err) => {
			this.onError(err);
		}).listen(this.port);
		console.log(chalk.bgGreen.bold('Info:') + ' '+this.name + ' server listening on: ' + this.port);
	}

	log(socket, data) {
		let ip = socket.remoteAddress;
		ip = helper.formatIpAddress(ip);
		let info = {
			'ip': ip,
			'service': this.name,
			'request': 'Connection from ' + ip + ':' + socket.remotePort
		};
		if (data && data.toString().trim().length !== 0) info.request_headers = data.toString();

		this.emit('data', info);
	}
}

/**
 * @param {number} port - Socket's Port Number
 * @param {string} name - Service Name
 */
const CustomSocketServer = (port, name) => {
	if (name === 'ssh') {
		return new SshSocketServer(port, name);
	}
	else if (name === 'ftp') {
		return new FtpSocketServer(port, name);
	}
	else if (name === 'telnet') {
		return new TelnetSocketServer(port, name);
	}
	else {
		return new GenericSocketServer(port, name);
	}
};

module.exports = CustomSocketServer;