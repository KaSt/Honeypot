"use strict";

//Some ports to listen on

const prod_list = {
	23: "telnet",
	21: "ftp",
	22: "ssh",
	// 25: "smtp",
	3389: "RDP",
	//110: "POP3",
	//143: "IMAP",
	//53: "DNS",
	3306: "MySQL",
	995: "pop3s",
	993: "imaps",
	5900: "VNC",
	//465: "smtps",
	113: "ident",
	514: "shell",
	5060: "sip",
	1433: "MSSQL",
	5800: "vnc-http",
	389: "ldap",
	5432: "postgresql",
};

const dev_list = {
	11023: "telnet",
	11021: "ftp",
	11022: "ssh",
	// 11025: "smtp",
	13389: "RDP",
	//11110: "POP3",
	//11143: "IMAP",
	//11053: "DNS",
	13306: "MySQL",
	11995: "pop3s",
	11993: "imaps",
	15900: "VNC",
	//465: "smtps",
	11113: "ident",
	11514: "shell",
	15060: "sip",
	11433: "MSSQL",
	15800: "vnc-http",
	11389: "ldap",
	15432: "postgresql",
};

const list = process.env["env"] == "PROD" ? prod_list : dev_list;
module.exports = list;