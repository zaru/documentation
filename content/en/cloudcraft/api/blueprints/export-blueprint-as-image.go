package main

import (
	"context"
	"log"
	"os"

	"github.com/DataDog/cloudcraft-go"
)

func main() {
	key, ok := os.LookupEnv("CLOUDCRAFT_API_KEY")
	if !ok {
		log.Fatal("missing env var: CLOUDCRAFT_API_KEY")
	}

	// Create new Config to be initialize a Client.
	cfg := cloudcraft.NewConfig(key)

	// Create a new Client instance with the given Config.
	client, err := cloudcraft.NewClient(cfg)
	if err != nil {
		log.Fatal(err)
	}

	// List all blueprints in an account.
	image, _, err := client.Blueprint.ExportImage(
		context.Background(),
		"0f1a4e20-a887-4467-a37b-1bc7a3deb9a9",
		"png",
		&cloudcraft.ImageExportParams{
			Width:  1920,
			Height: 1080,
		}
	)
	if err != nil {
		log.Fatal(err)
	}
}
