package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/mkhadilk/logrotate"
	"github.com/vivek-bhanuprakash/justwhere-address-form/server/internal/services/authentication"
)

func init() {
	// Initialize logrotate
	r := logrotate.NewRotator()
	e := r.Set("20 Mib", 5, "justwhere-address-form.log")

	if e != nil {
		log.Printf("Can not set log rotate options- %s", e.Error())
		os.Exit(-1)
	}

	r.Start()

	log.SetFlags(log.Llongfile | log.LstdFlags)

	log.SetOutput(r)

	// Initialize the MongoDB connection
}

var listenurl = flag.String("listenurl", ":3000", "-listenurl [prefix]:<port>")

func main() {

	log.SetFlags(log.Llongfile | log.LstdFlags)

	clientID := os.Getenv("CLIENT_ID")
	clientSecret := os.Getenv("CLIENT_SECRET")
	URL := os.Getenv("URL")
	redirectURL := os.Getenv("REDIRECT_URL")

	// Check if any of the required environment variables is missing
	if clientID == "" || clientSecret == "" || redirectURL == "" {
		msg := "Missing environment variables. Please set CLIENT_ID, CLIENT_SECRET, URL and REDIRECT_URL."
		fmt.Printf("ERROR: %s\n", msg)
		log.Fatal("ERROR: " + msg)
	}

	router := gin.Default()
	appGroup := router.Group("/app")
	{
		appGroup.StaticFS("/static", http.Dir("./build/static"))
		appGroup.StaticFS("/index.html", http.Dir("./build/index.html"))
		appGroup.StaticFS("/home", http.Dir("./build"))
		appGroup.StaticFile("/manifest.json", "./build/manifest.json")
		appGroup.StaticFile("/logo512.png", "./build/logo512.png")
		appGroup.StaticFile("/logo192.png", "./build/logo192.png")
		appGroup.StaticFile("/favicon.ico", "./build/favicon.ico")

	}

	// Set the scope to only include the "https://www.googleapis.com/auth/userinfo.email" scope for Google IdP
	scopes := []string{"https://www.googleapis.com/auth/userinfo.email"}

	router.Use(func(c *gin.Context) {
		if c.Request.Method == "OPTIONS" {
			log.Println("Handling OPTIONS request")
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Create the Authenticator middleware
	authenticator := authentication.NewAuthenticator(router, clientID, clientSecret, URL+redirectURL, scopes)

	// // Apply the authentication middleware
	router.Use(authenticator.GetAuthenticator())

	flag.Parse()

	log.Fatal(router.Run(*listenurl))
}
