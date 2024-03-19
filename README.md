# 1. Modify CORS setting in caddyfile config of JustWhere and restart JustWhere Caddy. This is assuming the demo app is running at http://localhost:3000
	header {
		Access-Control-Allow-Origin http://localhost:3000
		Access-Control-Allow-Credentials true
		Access-Control-Allow-Methods *
		Access-Control-Allow-Headers "Content-Type, Access-Control-Allow-Headers, Access-Control-Allow-Origin, Access-Control-Allow-Credentials, Access-Control-Allow-Methods, *"
		defer
	}

# 2. Clone this repo
# 3. In the project root, run the following commands
## - npm i
## - npm run build
## - go mod tidy `(go mod indicates version 1.22.1)`
# 4. Set env variables needed for authentication
## - CLIENT_ID, CLIENT_SECRET, URL, REDIRECT_URL
# 5. In the project root, run the following command
## - go run server/cmd/main/main.go
## This will run the demo server at http://localhost:3000 by default.
# 6. Open your web browser and navigate to http://localhost:3000/login to be authenticated
