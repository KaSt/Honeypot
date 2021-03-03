const publishCsirtgIndicator =  require("./csirtg");
const publishAbuseIppDbIndicator = require("./abuseipdb");
const publishDshieldIndicator = require("./dshield");
const publishOtxIndicator = require("./otx");

module.exports = [publishCsirtgIndicator, publishAbuseIppDbIndicator, publishDshieldIndicator, publishOtxIndicator];