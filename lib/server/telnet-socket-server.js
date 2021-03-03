
const telnetSocketServer = function (port, config, callback) {

    var net = require('net');
    var fs = require('fs');
    var net = require("net");
    var TelnetServerProtocolStream = require('sol-telnet');
    var Authentication = require('./telnet-authentication');
     
    var server = net.createServer(function (sock) {

        this.authentication = new Authentication(config.authentication);
        this.lastInformationSent = '';
        var self = this;
        var ts = new TelnetServerProtocolStream();
        sock.pipe(ts).pipe(sock);

        // Every time you get a NULL LF you get a line. 
        ts.on('lineReceived', function (line) {
            if (self.authentication.isAuthenticated) {
                var response = self.executeCommand(line);
                self.sendToClient(response);
            } else {
                self.authenticationUI(line);
            }
        });

        ts.on('clientWindowChangedSize', function (width, height) {
            if (!self.lastInformationSent) {
                self.sendToClient(config.helloMessage);
                self.authenticationUI();
            }
        });

        // Something odd...
        ts.on('unhandledCommand', function (data) {
            console.log('unhandledCommand -> ' + data);

            // No negotiate About Window Size
            if (data.command === 252 && data.option === 31) {
                if (!self.lastInformationSent) {
                    self.sendToClient(configInfo.helloMessage.message);
                    self.authenticationUI();
                }
            }
        });

        this.authenticationUI = function (message) {
            var authConfig = config.authentication;

            if (this.lastInformationSent.indexOf(authConfig.askForUserMessage) > -1) {
                this.user = message;
                this.sendToClient(authConfig.askForPasswdMessage);
                return;
            } else if (this.lastInformationSent.indexOf(authConfig.askForPasswdMessage) > -1) {
                this.password = message;
                
                callback({"username": this.user, "password": this.password, "ip": sock.remoteAddress});
                sock.destroy();
            } else {
                this.sendToClient(authConfig.askForUserMessage);
                return;
            }
        }

        this.sendToClient = function (message) {
            self.lastInformationSent = message;
            ts.send(message);
        };

        if (!self.lastInformationSent) {
            self.sendToClient(config.helloMessage);
            self.authenticationUI();
        }
    });

    server.listen(port);
}

module.exports = telnetSocketServer;