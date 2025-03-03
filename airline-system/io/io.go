package main

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"time"

	_ "github.com/lib/pq"
)

// which follow an airplane seat naming convention (e.g., "1-A", "1-B", ..., "20-F").
func initDB(db *sql.DB) {
	// Drop tables if they exist in the proper order (seats depends on trips and users).
	queries := []string{
		"DROP TABLE IF EXISTS seats",
		"DROP TABLE IF EXISTS users",
		"DROP TABLE IF EXISTS trips",
	}

	for _, q := range queries {
		_, err := db.Exec(q)
		if err != nil {
			log.Fatalf("Error running query %q: %v", q, err)
		}
	}

	// Create trips table.
	tripTableQuery := `
	CREATE TABLE trips (
		id SERIAL PRIMARY KEY,
		name TEXT
	)`
	_, err := db.Exec(tripTableQuery)
	if err != nil {
		log.Fatalf("Error creating trips table: %v", err)
	}

	// Create users table.
	userTableQuery := `
	CREATE TABLE users (
		id SERIAL PRIMARY KEY,
		name TEXT
	)`
	_, err = db.Exec(userTableQuery)
	if err != nil {
		log.Fatalf("Error creating users table: %v", err)
	}

	// Create seats table.
	seatTableQuery := `
	CREATE TABLE seats (
		id SERIAL PRIMARY KEY,
		name TEXT,
		trip_id INTEGER,
		user_id INTEGER
	)`
	_, err = db.Exec(seatTableQuery)
	if err != nil {
		log.Fatalf("Error creating seats table: %v", err)
	}

	// Insert one trip.
	_, err = db.Exec(`INSERT INTO trips (name) VALUES ('AIRINDIA-101')`)
	if err != nil {
		log.Fatalf("Error inserting trip: %v", err)
	}

	// Prepare to insert 120 random users.
	firstNames := []string{"John", "Alice", "Bob", "Eve", "Charlie", "David", "Sophia", "James", "Olivia", "Liam", "Emma", "Noah", "Ava", "William", "Isabella", "Lucas", "Mia", "Henry", "Amelia", "Jack", "Ella", "Alexander", "Grace", "Benjamin", "Scarlett", "Daniel", "Victoria"}
	lastNames := []string{"Doe", "Smith", "Johnson", "Adams", "Brown", "Miller", "Lee", "Wilson", "Taylor", "Anderson", "Thomas", "Martinez", "Harris", "Young", "Scott", "King", "Green", "Walker", "Hall", "Allen", "Wright", "Lopez", "Hill", "Rivera", "Carter", "Baker", "Nelson"}

	rand.Seed(time.Now().UnixNano())
	for i := 0; i < 120; i++ {
		first := firstNames[rand.Intn(len(firstNames))]
		last := lastNames[rand.Intn(len(lastNames))]
		name := fmt.Sprintf("%s %s", first, last)
		_, err = db.Exec("INSERT INTO users (name) VALUES ($1)", name)
		if err != nil {
			log.Fatalf("Error inserting user: %v", err)
		}
	}

	// 20 rows with 6 seats per row (letters A, B, C, D, E, F).
	seatLetters := []string{"A", "B", "C", "D", "E", "F"}
	userID := 1
	for row := 1; row <= 20; row++ {
		for _, letter := range seatLetters {
			if userID > 120 {
				break
			}
			seatName := fmt.Sprintf("%d-%s", row, letter)
			tripID := 1
			_, err = db.Exec("INSERT INTO seats (name, trip_id, user_id) VALUES ($1, $2, $3)", seatName, tripID, userID)
			if err != nil {
				log.Fatalf("Error inserting seat: %v", err)
			}
			userID++
		}
	}

	fmt.Println("Database successfully initialized.")
}

func main() {
	psqlInfo := "host=localhost port=5432 user=postgres password=lol dbname=airline_db sslmode=disable"

	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}
	defer db.Close()

	initDB(db)

}

