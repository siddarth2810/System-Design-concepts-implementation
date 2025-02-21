package io

import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
	"time"
)

var DB *sql.DB

func init() {
	psqlInfo := fmt.Sprintf(
		"host=localhost port=5432 user=postgres password=lol dbname=airline_db sslmode=disable",
	)
	var err error
	DB, err = sql.Open("postgres", psqlInfo)
	if err != nil {
		panic(err)
	}
}

func Wait() {
	time.Sleep(100 * time.Millisecond)
}

func ReadInt() int {
	var input int
	fmt.Scan(&input)
	return input
}

