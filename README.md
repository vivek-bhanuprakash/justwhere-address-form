# 1. Use Following commands to generate SelfSigned CERTS
	#!/bin/bash
	
	openssl genrsa -out cert.key 4096
	openssl req -new -key cert.key -out cert.csr
	openssl x509 -req -days 1825 -in cert.csr -signkey cert.key -out cert.crt
	
	NOW Copy the cert.crt file and cert.key file into some safe dir
	
# 2. Clone this repo
# 3. In the project root, run the following commands
## - npm i
## - npm run build
## - go mod tidy `(go mod indicates version 1.22.1)`
# 4. Set env variables needed for authentication
## - CLIENT_ID, CLIENT_SECRET, URL, REDIRECT_URL
# 5. In the project root, run the following command
## - go run server/cmd/main/main.go -tls -certfile `<abovecertfilepathname>` -keyfile `<abovekeyfilepathname>`
## This will run the demo server at https://localhost:3000 by default.
# 6. Open your web browser and navigate to http://localhost:3000/login to be authenticated
