const https = require('https');

const config = require("../../config");
const indicatorTemplate = {indicator: {
    indicator: "",
    itype: "ipv4",
    description: "",
    tags: ["attack", "bruteforce", "scanning"],


}} 


const publishCsirtgIndicator = function (data) {
    if (config.output.csirtg.enabled) {
        var indicator = indicatorTemplate;
        indicator.indicator = data.ip,
        indicator.description = data.service + " connection attempt",
        indicator.tags.push(data.service);
        
        var options = {
            hostname: 'csirtg.io',
            port: 443,
            path: '/api/users/' + config.output.csirtg.userId + '/feeds/' + config.output.csirtg.feed + '/indicators',
            method: 'POST',
            headers: {
                 'Content-Type': 'application/json',
                 'Authorization': 'apiKey ' + config.output.csirtg.apiKey
               }
          };
          
          var req = https.request(options, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);
          
            res.on('data', (d) => {
              process.stdout.write(d);
            });
          });
          
          req.on('error', (e) => {
            console.error(e);
          });
          
          req.write(postData);
          req.end();
       
    }
}

module.exports = publishCsirtgIndicator;