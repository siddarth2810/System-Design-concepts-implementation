package airline

import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
)

type User struct {
	ID   int
	Name string
}

type Seat struct {
	ID     int
	Name   string
	TripID int
	UserID sql.NullInt64
}

var db *sql.DB

func init() {
	psqlInfo := fmt.Sprintf(
		"host=localhost port=5432 user=postgres password=lol dbname=airline_db sslmode=disable",
	)
	var err error
	db, err = sql.Open("postgres", psqlInfo)
	if err != nil {
		panic(err)
	}
}

func Reset() {
	_, err := db.Exec(`TRUNCATE seats RESTART IDENTITY CASCADE;`)
	if err != nil {
		panic(err)
	}
	// Re-insert default seats
	_, err = db.Exec(`
		DO $$
		BEGIN
			FOR row IN 1..3 LOOP
				FOR seat_num IN 1..20 LOOP
					INSERT INTO seats (name, trip_id) 
					VALUES (row || '-' || CHR(64 + seat_num), 1);
				END LOOP;
			END LOOP;
		END $$;
	`)
	if err != nil {
		panic(err)
	}
}

func GetUser(id int) *User {
	user := &User{}
	err := db.QueryRow("SELECT id, name FROM users WHERE id = $1", id).
		Scan(&user.ID, &user.Name)
	if err != nil {
		return nil
	}
	return user
}

func GetSeat(id int) *Seat {
	seat := &Seat{}
	err := db.QueryRow(
		"SELECT id, name, trip_id, user_id FROM seats WHERE id = $1", id,
	).Scan(&seat.ID, &seat.Name, &seat.TripID, &seat.UserID)
	if err != nil {
		return nil
	}
	return seat
}

