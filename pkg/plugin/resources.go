package plugin

import "net/http"

func (a *App) registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/chat", a.handleChat)
}
