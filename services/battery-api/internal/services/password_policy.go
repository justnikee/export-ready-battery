package services

import (
	"fmt"
	"strings"
	"unicode"
)

// Password policy (S-13). Applied on register, password reset, and supplier accept.
const (
	// MinPasswordLength is the minimum accepted password length.
	MinPasswordLength = 12

	// PasswordPolicyHint is a user-facing summary of the rules (API error suffix / UI copy).
	PasswordPolicyHint = "at least 12 characters, including a letter and a number"
)

// commonPasswords is a small offline blocklist of frequently abused secrets.
// Not a substitute for breach databases; catches the worst defaults.
var commonPasswords = map[string]struct{}{
	"password":         {},
	"password1":        {},
	"password12":       {},
	"password123":      {},
	"password1234":     {},
	"passw0rd":         {},
	"12345678":         {},
	"123456789":        {},
	"1234567890":       {},
	"123456789012":     {},
	"qwerty123":        {},
	"qwertyuiop":       {},
	"qwertyuiop12":     {},
	"letmein1234":      {},
	"welcome123":       {},
	"welcome1234":      {},
	"admin123456":      {},
	"changeme123":      {},
	"iloveyou123":      {},
	"monkey123456":     {},
	"dragon123456":     {},
	"master123456":     {},
	"exportready":      {},
	"exportready1":     {},
	"exportready12":    {},
	"exportready123":   {},
	"battery12345":     {},
	"anvayalabs":       {},
	"anvayalabs1":      {},
	"anvayalabs12":     {},
	"anvayalabs123":    {},
}

// ValidatePassword enforces the S-13 password policy.
// email is optional; when set, rejects passwords equal to the email or its local-part.
func ValidatePassword(password, email string) error {
	if password == "" {
		return fmt.Errorf("password is required")
	}

	// Count runes so multi-byte characters are not under-counted.
	length := 0
	hasLetter := false
	hasDigit := false
	for _, r := range password {
		length++
		if unicode.IsLetter(r) {
			hasLetter = true
		}
		if unicode.IsDigit(r) {
			hasDigit = true
		}
	}

	if length < MinPasswordLength {
		return fmt.Errorf("password must be at least %d characters (%s)", MinPasswordLength, PasswordPolicyHint)
	}
	if !hasLetter {
		return fmt.Errorf("password must include at least one letter (%s)", PasswordPolicyHint)
	}
	if !hasDigit {
		return fmt.Errorf("password must include at least one number (%s)", PasswordPolicyHint)
	}

	lower := strings.ToLower(strings.TrimSpace(password))
	// Strip common separators for blocklist / email comparison.
	compact := strings.Map(func(r rune) rune {
		if r == ' ' || r == '-' || r == '_' || r == '.' {
			return -1
		}
		return r
	}, lower)

	if _, bad := commonPasswords[lower]; bad {
		return fmt.Errorf("password is too common; choose a stronger password")
	}
	if _, bad := commonPasswords[compact]; bad {
		return fmt.Errorf("password is too common; choose a stronger password")
	}

	if email != "" {
		em := strings.ToLower(strings.TrimSpace(email))
		if lower == em || compact == strings.Map(func(r rune) rune {
			if r == ' ' || r == '-' || r == '_' || r == '.' || r == '@' {
				return -1
			}
			return r
		}, em) {
			return fmt.Errorf("password must not be the same as your email")
		}
		if at := strings.IndexByte(em, '@'); at > 0 {
			local := em[:at]
			if lower == local || compact == local {
				return fmt.Errorf("password must not be the same as your email")
			}
		}
	}

	return nil
}
