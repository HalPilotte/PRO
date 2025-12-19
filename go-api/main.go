package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

// Config holds environment-based settings.
type Config struct {
	Port           string
	DatabaseURL    string
	UploadDir      string
	AllowOrigin    string
	MaxUploadBytes int64
}

// Player payload mirrors existing contract.
type Player struct {
	FirstName  string `json:"firstName"`
	LastName   string `json:"lastName"`
	DOB        string `json:"dob"`
	Address1   string `json:"address_1"`
	Address2   string `json:"address_2"`
	City       string `json:"city"`
	State      string `json:"state"`
	Zip        string `json:"zip"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	PictureURL string `json:"picturePath"`
}

func main() {
	_ = godotenv.Load()

	cfg := Config{
		Port:           getenv("PORT", "8080"),
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		UploadDir:      getenv("UPLOAD_DIR", "./public/uploads"),
		AllowOrigin:    getenv("ALLOW_ORIGIN", "*"),
		MaxUploadBytes: 10 << 20, // 10MB default
	}
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to create db pool: %v", err)
	}
	defer pool.Close()

	if err := ensureUploadDir(cfg.UploadDir); err != nil {
		log.Fatalf("failed to ensure upload dir: %v", err)
	}

	r := mux.NewRouter()
	r.Use(cors(cfg.AllowOrigin))

	r.HandleFunc("/api/players", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		handleCreatePlayer(ctx, pool, cfg, w, r)
	}).Methods(http.MethodPost)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("go-api listening on :%s", cfg.Port)
	log.Fatal(srv.ListenAndServe())
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func ensureUploadDir(dir string) error {
	return os.MkdirAll(dir, 0o755)
}

// cors middleware with simple allow-origin.
func cors(origin string) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func handleCreatePlayer(ctx context.Context, pool *pgxpool.Pool, cfg Config, w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(cfg.MaxUploadBytes); err != nil {
		http.Error(w, "invalid form data", http.StatusBadRequest)
		return
	}

	get := func(keys ...string) string {
		for _, k := range keys {
			if v := strings.TrimSpace(r.FormValue(k)); v != "" {
				return v
			}
		}
		return ""
	}

	first := get("player_first_name", "firstName")
	last := get("player_last_name", "lastName")
	dobInput := get("player_dob", "dob")
	address1 := get("player_address_1", "address_1", "address1")
	address2 := get("player_address_2", "address_2", "address2")
	city := get("player_city", "city")
	state := get("player_state", "state")
	zip := get("player_zip", "zip")
	email := strings.ToLower(get("player_email", "email"))
	phone := get("player_phone", "phone")

	if first == "" || last == "" || dobInput == "" || email == "" {
		http.Error(w, "first name, last name, dob, and email are required", http.StatusBadRequest)
		return
	}

	dobISO, err := parseDobToISO(dobInput)
	if err != nil {
		http.Error(w, "date of birth must be valid and use MM-DD-YYYY or MM/DD/YYYY", http.StatusBadRequest)
		return
	}

	picturePath, err := savePictureFile(cfg.UploadDir, r)
	if err != nil {
		http.Error(w, "failed to save picture", http.StatusInternalServerError)
		return
	}

	playerID, err := insertPlayer(ctx, pool, Player{
		FirstName:  first,
		LastName:   last,
		DOB:        dobISO,
		Address1:   address1,
		Address2:   address2,
		City:       city,
		State:      state,
		Zip:        zip,
		Email:      email,
		Phone:      phone,
		PictureURL: picturePath,
	})
	if err != nil {
		if errors.Is(err, errDuplicateEmail) {
			http.Error(w, "A player with this email already exists.", http.StatusConflict)
			return
		}
		log.Printf("insert error: %v", err)
		http.Error(w, "unable to register player", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"playerId": playerID})
}

// parseDobToISO normalizes MM/DD/YYYY or MM-DD-YYYY to YYYY-MM-DD.
func parseDobToISO(input string) (string, error) {
	s := strings.TrimSpace(input)
	if s == "" {
		return "", errors.New("empty")
	}
	var sep rune
	for _, c := range s {
		if c == '-' || c == '/' {
			sep = c
			break
		}
	}
	if sep == 0 {
		return "", errors.New("invalid separator")
	}
	parts := strings.Split(s, string(sep))
	if len(parts) != 3 {
		return "", errors.New("invalid parts")
	}
	month, day, year := strings.TrimLeft(parts[0], "0"), strings.TrimLeft(parts[1], "0"), parts[2]
	if month == "" {
		month = "0"
	}
	if day == "" {
		day = "0"
	}
	m, d := toInt(month), toInt(day)
	y := toInt(year)
	if y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31 {
		return "", errors.New("out of range")
	}
	t := time.Date(y, time.Month(m), d, 0, 0, 0, 0, time.UTC)
	if t.Year() != y || int(t.Month()) != m || t.Day() != d {
		return "", errors.New("invalid date")
	}
	return fmt.Sprintf("%04d-%02d-%02d", y, m, d), nil
}

func toInt(s string) int {
	n := 0
	for _, c := range s {
		if c < '0' || c > '9' {
			return 0
		}
		n = n*10 + int(c-'0')
	}
	return n
}

var errDuplicateEmail = errors.New("duplicate email")

func insertPlayer(ctx context.Context, pool *pgxpool.Pool, p Player) (int64, error) {
	const q = `INSERT INTO players (
        first_name, last_name, dob, address_1, address_2, city, state, zip, email, phone, picture_path
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING player_id`

	var id int64
	err := pool.QueryRow(ctx, q,
		p.FirstName,
		p.LastName,
		p.DOB,
		toNull(p.Address1),
		toNull(p.Address2),
		toNull(p.City),
		toNull(p.State),
		toNull(p.Zip),
		p.Email,
		toNull(p.Phone),
		toNull(p.PictureURL),
	).Scan(&id)
	if err != nil {
		// Check for unique violation
		if strings.Contains(err.Error(), "duplicate key value") && strings.Contains(err.Error(), "players_email_key") {
			return 0, errDuplicateEmail
		}
		return 0, err
	}
	return id, nil
}

// savePictureFile saves an optional uploaded file and returns the public URL path.
func savePictureFile(uploadDir string, r *http.Request) (string, error) {
	file, header, err := r.FormFile("player_picture")
	if err != nil {
		// Not present
		return "", nil
	}
	defer file.Close()
	if header.Filename == "" {
		return "", nil
	}

	// Keep original extension; randomize name.
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".bin"
	}
	name := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), randomString(8), ext)
	dest := filepath.Join(uploadDir, name)

	out, err := os.OpenFile(dest, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return "", err
	}
	defer out.Close()

	if _, err := file.Seek(0, 0); err != nil {
		return "", err
	}
	if _, err := io.Copy(out, file); err != nil {
		return "", err
	}

	return "/uploads/" + name, nil
}

// randomString returns n random bytes hex-encoded (non-guessable).
func randomString(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}

func toNull(s string) any {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return s
}
