package model

import "github.com/blkchain/blkchain/db"

type Model struct {
	*db.Explorer
}

func New(db *db.Explorer) *Model {
	return &Model{
		Explorer: db,
	}
}
