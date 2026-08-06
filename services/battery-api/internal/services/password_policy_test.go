package services

import (
	"strings"
	"testing"
)

func TestValidatePassword_AcceptsStrong(t *testing.T) {
	cases := []string{
		"correct-horse-1",
		"MyBattery2026!",
		"αβγδεζηθικ12", // unicode letters + digits
		"longenough99ab",
	}
	for _, pw := range cases {
		if err := ValidatePassword(pw, "user@example.com"); err != nil {
			t.Errorf("%q should pass: %v", pw, err)
		}
	}
}

func TestValidatePassword_RejectsWeak(t *testing.T) {
	if err := ValidatePassword("password1234", ""); err == nil {
		t.Fatal("password1234 must be rejected as common")
	}
	if err := ValidatePassword("Password1234", ""); err == nil {
		t.Fatal("Password1234 must be rejected as common")
	}
	if err := ValidatePassword("abcdefghij", ""); err == nil || !strings.Contains(err.Error(), "number") {
		t.Fatalf("letters-only must need number: %v", err)
	}
	if err := ValidatePassword("123456789012", ""); err == nil || !strings.Contains(err.Error(), "letter") {
		t.Fatalf("digits-only must need letter: %v", err)
	}
	if err := ValidatePassword("short", ""); err == nil || !strings.Contains(err.Error(), "12") {
		t.Fatalf("short must fail length: %v", err)
	}
	if err := ValidatePassword("user@example.com", "user@example.com"); err == nil {
		t.Fatal("password equal to email must fail")
	}
	if err := ValidatePassword("alicealice12", "alicealice12@corp.com"); err == nil {
		t.Fatal("password equal to email local-part must fail")
	}
}

func TestValidatePassword_MinLengthUsesRunes(t *testing.T) {
	pw := "abcdefghij1" // 11 runes
	if err := ValidatePassword(pw, ""); err == nil {
		t.Fatal("11-char password must fail")
	}
	pw12 := "abcdefghijk1" // 12
	if err := ValidatePassword(pw12, ""); err != nil {
		t.Fatalf("12-char letter+digit should pass: %v", err)
	}
}
