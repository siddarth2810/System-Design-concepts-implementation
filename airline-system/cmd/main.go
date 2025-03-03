package main

import (
	"database/sql"
	"fmt"
	log "github.com/sirupsen/logrus"
	"os"
	"strconv"

	"airline-system/airline"
	"airline-system/io"
)

func printSeatMap() {
	rows, err := io.DB.Query(`
    SELECT name, user_id FROM seats 
    ORDER BY 
        split_part(name, '-', 1)::INTEGER, 
        split_part(name, '-', 2)          
`)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	currentRow := ""
	for rows.Next() {
		var seatName string
		var userID sql.NullInt64
		rows.Scan(&seatName, &userID)

		row := string(seatName[0])
		if row != currentRow {
			currentRow = row
			println()
		}

		if userID.Valid {
			print("X ")
		} else {
			print(". ")
		}
	}
	println()
}

func book(user *airline.User, seat *airline.Seat) error {
	txn, err := io.DB.Begin()
	if err != nil {
		return err
	}
	defer txn.Rollback()

	log.Debugf("booking seat: %s for user: %d", seat.Name, user.ID)

	// Check seat availability
	var currentUserID sql.NullInt64
	err = txn.QueryRow(
		"SELECT user_id FROM seats WHERE id = $1 FOR UPDATE", seat.ID,
	).Scan(&currentUserID)
	if err != nil {
		return err
	}
	if currentUserID.Valid {
		log.Debug("seat already booked")
		return fmt.Errorf("seat already booked")
	}

	log.Debug("transaction locked the seat")
	io.Wait()

	_, err = txn.Exec(
		"UPDATE seats SET user_id = $1 WHERE id = $2",
		user.ID, seat.ID,
	)
	if err != nil {
		return err
	}

	io.Wait()

	return txn.Commit()
}

func main() {
	airline.Reset()
	log.SetLevel(log.DebugLevel)

	userID, err := strconv.Atoi(os.Args[1])
	if err != nil {
		log.Fatal("invalid user ID")
	}

	user := airline.GetUser(userID)
	if user == nil {
		log.Fatal("user not found")
	}
	log.Debugf("Hello, %s! Which seat do you want to book?", user.Name)

	seatID := io.ReadInt()
	seat := airline.GetSeat(seatID)
	if seat == nil {
		log.Fatal("seat not found")
	}
	log.Debugf("Attempting to book seat %s for you...", seat.Name)

	if err := book(user, seat); err != nil {
		log.Errorf("Booking failed: %v", err)
	} else {
		log.Infof("%s successfully booked seat %s!", user.Name, seat.Name)
	}
	printSeatMap()
}
