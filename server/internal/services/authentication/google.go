// authentication/authentication.go
package authentication

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"io"
	"io/ioutil"
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
	router.GET("/app/login", authenticator.handleLogin)
	router.GET("/app/auth/google/callback", authenticator.handleCallback)

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
	domain = strings.TrimLeft(URL, "http://")

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

	// check if the user is allowed to access the application
	filePath := "./data/userinfo.csv"
	uinfos, err := readUserInfos(filePath)
	if err != nil {
		log.Println("Error reading user info:", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to read user info"})
		return
	}

	c.SetCookie("X-USER-EMAIL", userInfo.Email, 1200, "/", "localhost", false, false)
	c.SetCookie("X-USER-NAME", userInfo.Name, 1200, "/", "localhost", false, false)

	isProvider := false

	for _, uinfo := range uinfos {
		if uinfo.Email == userInfo.Email {
			if uinfo.SpID != "" {
				c.SetCookie("X-USER-TYPE", "SERVICE_PROVIDER", 1200, "/", "localhost", false, false)
				isProvider = true
			} else if uinfo.BenID != "" {
				c.SetCookie("X-USER-TYPE", "BENEFICIARY", 1200, "/", "localhost", false, false)
				isProvider = true
			}
		}
	}

	if !isProvider {
		c.SetCookie("X-USER-TYPE", "INDIVIDUAL", 1200, "/", "localhost", false, false)
	}

	c.Redirect(http.StatusFound, "/app/index.html")
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

type UserInfo struct {
	Email string `json:"email"`
	SpID  string `json:"spID"`
	BenID string `json:"benID"`
}

func readUserInfos(filePath string) ([]UserInfo, error) {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	reader := csv.NewReader(bytes.NewReader(data))
	reader.FieldsPerRecord = 3 // Expecting 3 columns (email, spID, benID)

	// Skip the header row
	if _, err := reader.Read(); err != nil {
		return nil, fmt.Errorf("failed to read header: %w", err)
	}

	var userInfos []UserInfo
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to parse CSV record: %w", err)
		}

		userInfo := UserInfo{
			Email: strings.TrimSpace(record[0]),
			SpID:  strings.TrimSpace(record[1]),
			BenID: strings.TrimSpace(record[2]),
		}
		userInfos = append(userInfos, userInfo)
	}

	return userInfos, nil
}
