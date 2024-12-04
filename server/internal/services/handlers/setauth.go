package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SaveToken(c *gin.Context) {
	authtoken := c.Query("authtoken")
	if authtoken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "authtoken query parameter is required"})
		return
	}

	htmlContent := fmt.Sprintf(`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Hidden Elements</title>
		</head>
		<body onload="getHiddenValues()">
			<input type="hidden" id="authtoken" name="authtoken" value="%s">
			<script>
				function getHiddenValues() {
					const authtoken = document.getElementById('authtoken').value;
					sessionStorage.setItem('JWAUTH', authtoken);
    					window.location.replace('/app/home');
				}
			</script>
		</body>
		</html>
		`, authtoken)

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(htmlContent))
}
