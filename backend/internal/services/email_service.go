package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
)

// EmailService handles sending transactional emails
type EmailService struct {
	apiKey    string
	fromEmail string
	fromName  string
	baseURL   string // Frontend base URL for links
}

// NewEmailService creates a new email service
// Uses Resend API (https://resend.com) - set RESEND_API_KEY env var
func NewEmailService(baseURL string) *EmailService {
	apiKey := os.Getenv("RESEND_API_KEY")
	fromEmail := os.Getenv("EMAIL_FROM")
	if fromEmail == "" {
		fromEmail = "noreply@exportready.com"
	}
	fromName := os.Getenv("EMAIL_FROM_NAME")
	if fromName == "" {
		fromName = "ExportReady"
	}

	return &EmailService{
		apiKey:    apiKey,
		fromEmail: fromEmail,
		fromName:  fromName,
		baseURL:   baseURL,
	}
}

// IsConfigured returns true if email service has API key configured
func (s *EmailService) IsConfigured() bool {
	return s.apiKey != ""
}

// SendPasswordResetEmail sends a password reset email
func (s *EmailService) SendPasswordResetEmail(toEmail, resetToken string) error {
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", s.baseURL, resetToken)

	// If not configured, just log to console (MVP mode)
	if !s.IsConfigured() {
		log.Printf("📧 Password reset requested for %s", toEmail)
		log.Printf("🔗 Reset link: %s", resetURL)
		log.Printf("💡 To send real emails, set RESEND_API_KEY in .env")
		return nil
	}

	subject := "Reset Your Password - ExportReady"
	htmlBody := s.getPasswordResetHTML(resetURL)
	textBody := fmt.Sprintf("Reset your password by visiting: %s\n\nThis link expires in 1 hour.", resetURL)

	return s.sendEmail(toEmail, subject, htmlBody, textBody)
}

// sendEmail sends an email via Resend API
func (s *EmailService) sendEmail(to, subject, htmlBody, textBody string) error {
	payload := map[string]interface{}{
		"from":    fmt.Sprintf("%s <%s>", s.fromName, s.fromEmail),
		"to":      []string{to},
		"subject": subject,
		"html":    htmlBody,
		"text":    textBody,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("email API error: status %d", resp.StatusCode)
	}

	log.Printf("✅ Email sent to %s: %s", to, subject)
	return nil
}

// getPasswordResetHTML returns the HTML email template
func (s *EmailService) getPasswordResetHTML(resetURL string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #18181b; border-radius: 16px; border: 1px solid #27272a;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #27272a;">
                            <h1 style="margin: 0; color: #a855f7; font-size: 24px; font-weight: 700;">ExportReady</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px;">
                            <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 20px; font-weight: 600;">Reset Your Password</h2>
                            <p style="margin: 0 0 24px; color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                                We received a request to reset your password. Click the button below to create a new password.
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="%s" style="display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #9333ea, #6366f1); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 24px 0 0; color: #71717a; font-size: 12px; line-height: 1.5;">
                                This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; border-top: 1px solid #27272a; text-align: center;">
                            <p style="margin: 0; color: #52525b; font-size: 12px;">
                                © 2026 ExportReady. Battery Passport Platform.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`, resetURL)
}
