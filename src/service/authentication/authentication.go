// authentication/authentication.go
package authentication

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	googleapi "google.golang.org/api/oauth2/v2"
)

var URL string

func init() {
	URL = os.Getenv("URL")
}

// Authenticator is the 2-legged OAuth 2.0 based authentication middleware using Google IdP.
type Authenticator struct {
	router      *gin.Engine
	oauthConfig *oauth2.Config
}

// NewAuthenticator creates a new instance of the Authenticator middleware.
func NewAuthenticator(router *gin.Engine, clientID, clientSecret, redirectURL string, scopes []string) *Authenticator {
	oauthConfig := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes:       scopes,
		Endpoint:     google.Endpoint,
	}

	authenticator := &Authenticator{
		router:      router,
		oauthConfig: oauthConfig,
	}

	// Setup authentication related handlers
	router.GET("/login", authenticator.handleLogin)
	router.GET("/auth/google/callback", authenticator.handleCallback)

	log.Printf("Authenticator initialized with clientID: %s, redirectURL: %s", clientID, redirectURL)

	return authenticator
}

// GetAuthenticator is the middleware function that checks if the user is authenticated.
func (a *Authenticator) GetAuthenticator() gin.HandlerFunc {
	return func(c *gin.Context) {
		// If the user is authenticated, proceed with the request
		c.Next()
	}
}

// handleLogin is the handler for initiating the OAuth 2.0 authentication flow.
func (a *Authenticator) handleLogin(c *gin.Context) {
	authURL := a.oauthConfig.AuthCodeURL("", oauth2.AccessTypeOffline)
	c.Redirect(http.StatusFound, authURL)
}

// handleCallback is the handler for handling the OAuth 2.0 callback and exchanging the authorization code for a token.
func (a *Authenticator) handleCallback(c *gin.Context) {

	domain := strings.TrimLeft(URL, "https://")
	fmt.Printf("%+v", c.Params)
	code := c.Query("code")
	token, err := a.oauthConfig.Exchange(c, code)
	if err != nil {
		log.Printf("exchange token error %+v", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to exchange code for token"})
		return
	}
	_ = domain

	userInfo, err := a.getUserInfo(token)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to get user info"})
		return
	}
	_ = userInfo

	c.Redirect(http.StatusFound, "/home")
}

// getUserInfo fetches user information using the OAuth 2.0 token.
func (a *Authenticator) getUserInfo(token *oauth2.Token) (*googleapi.Userinfo, error) {
	client := a.oauthConfig.Client(oauth2.NoContext, token)
	oauth2Service, err := googleapi.New(client)
	if err != nil {
		return nil, err
	}

	userInfo, err := oauth2Service.Userinfo.Get().Do()
	if err != nil {
		return nil, err
	}

	return userInfo, nil
}
