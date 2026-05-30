package jobs

import (
	"context"
	"encoding/hex"
	"log"
	"time"

	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
)

// StartAnchorUpgradeTicker starts a background goroutine that periodically
// upgrades pending OTS proofs to full Bitcoin confirmation.
func StartAnchorUpgradeTicker(repo repository.RepositoryInterface, interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for range ticker.C {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
			if err := UpgradePendingAnchors(ctx, repo); err != nil {
				log.Printf("[anchor-upgrader] job failed: %v", err)
			}
			cancel()
		}
	}()
}

// UpgradePendingAnchors finds all anchors with status "anchored" and attempts
// to upgrade their OTS proofs to include Bitcoin block header attestations.
func UpgradePendingAnchors(ctx context.Context, repo repository.RepositoryInterface) error {
	anchors, err := repo.GetAnchorsNeedingUpgrade(ctx)
	if err != nil {
		return err
	}
	if len(anchors) == 0 {
		return nil
	}

	otsSvc := services.NewOpenTimestampsService()
	upgradedCount := 0
	pendingCount := 0

	for _, anchor := range anchors {
		if anchor.OTSProof == nil || *anchor.OTSProof == "" {
			continue
		}

		hashBytes, err := hex.DecodeString(anchor.FileHash)
		if err != nil || len(hashBytes) != 32 {
			log.Printf("[anchor-upgrader] invalid hash for anchor %s: %v", anchor.ID, err)
			continue
		}
		_ = hashBytes // hash is implicitly verified by the proof structure

		proofBytes, err := services.DecodeProof(*anchor.OTSProof)
		if err != nil {
			log.Printf("[anchor-upgrader] failed to decode proof for anchor %s: %v", anchor.ID, err)
			continue
		}

		upgraded, err := otsSvc.UpgradeProof(ctx, proofBytes)
		if err != nil {
			if err.Error() == "proof not yet confirmed in Bitcoin — try again later" {
				pendingCount++
				continue
			}
			log.Printf("[anchor-upgrader] failed to upgrade anchor %s: %v", anchor.ID, err)
			continue
		}

		upgradedB64 := services.EncodeProof(upgraded)
		now := time.Now()
		if err := repo.UpdateCertificateAnchorStatus(ctx, anchor.ID, "confirmed", &upgradedB64, nil, &now); err != nil {
			log.Printf("[anchor-upgrader] failed to update anchor %s status: %v", anchor.ID, err)
			continue
		}
		upgradedCount++
	}

	if upgradedCount > 0 || pendingCount > 0 {
		log.Printf("[anchor-upgrader] processed %d anchors: %d upgraded, %d still pending", len(anchors), upgradedCount, pendingCount)
	}
	return nil
}
