package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

// EmailService handles sending transactional emails
type EmailService struct {
	apiKey       string
	fromEmail    string
	fromName     string
	baseURL      string // Frontend base URL for magic links
	enabled      bool
	templatesDir string // Path to email templates directory
}

// NewEmailService creates a new email service instance (simple constructor for auth)
// This is used for password reset emails which just log to console in dev mode
func NewEmailService(baseURL string) *EmailService {
	return &EmailService{
		baseURL:      baseURL,
		enabled:      false, // Console logging mode for password reset
		templatesDir: getTemplatesDir(),
	}
}

// NewResendEmailService creates a new email service with Resend API integration
func NewResendEmailService(apiKey, fromEmail, fromName, baseURL string) *EmailService {
	enabled := apiKey != "" && fromEmail != ""
	if !enabled {
		log.Println("⚠️ Email service disabled: RESEND_API_KEY or EMAIL_FROM not configured")
	} else {
		log.Printf("✅ Email service enabled: sending from %s <%s>", fromName, fromEmail)
	}

	return &EmailService{
		apiKey:       apiKey,
		fromEmail:    fromEmail,
		fromName:     fromName,
		baseURL:      baseURL,
		enabled:      enabled,
		templatesDir: getTemplatesDir(),
	}
}

// getTemplatesDir returns the path to the email templates directory
func getTemplatesDir() string {
	// Check if TEMPLATES_DIR env var is set
	if dir := os.Getenv("TEMPLATES_DIR"); dir != "" {
		return dir
	}
	// Default to ./templates relative to working directory
	return "templates"
}

// IsEnabled returns whether email sending is enabled
func (e *EmailService) IsEnabled() bool {
	return e.enabled
}

// PasswordResetData contains data for the password reset email template
type PasswordResetData struct {
	ResetLink string
}

// SendPasswordResetEmail sends a password reset email using template
func (e *EmailService) SendPasswordResetEmail(toEmail, resetToken string) error {
	resetLink := fmt.Sprintf("%s/auth/reset-password?token=%s", e.baseURL, resetToken)

	if !e.enabled {
		// Log to console in development
		log.Printf("🔐 Password Reset Link for %s:\n%s", toEmail, resetLink)
		return nil
	}

	// Parse and execute template
	templatePath := filepath.Join(e.templatesDir, "password_reset.html")
	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		log.Printf("❌ Failed to parse password reset template: %v", err)
		return fmt.Errorf("failed to parse email template: %w", err)
	}

	data := PasswordResetData{
		ResetLink: resetLink,
	}

	var htmlBuf bytes.Buffer
	if err := tmpl.Execute(&htmlBuf, data); err != nil {
		log.Printf("❌ Failed to execute password reset template: %v", err)
		return fmt.Errorf("failed to execute email template: %w", err)
	}

	plainText := fmt.Sprintf(`Reset Your Password

You requested to reset your password. Click the link below to create a new password:

%s

This link expires in 1 hour.
If you didn't request this, please ignore this email.

© 2026 ExportReady Battery
`, resetLink)

	return e.sendEmail(toEmail, "Reset Your Password - ExportReady", htmlBuf.String(), plainText)
}

// ResendEmailRequest is the Resend API request structure
type ResendEmailRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
	Text    string   `json:"text,omitempty"`
}

// ResendEmailResponse is the Resend API response structure
type ResendEmailResponse struct {
	ID string `json:"id"`
}

// MagicLinkData contains data for the magic link email template
type MagicLinkData struct {
	MagicLink         string
	PassportID        string
	Role              string
	ActionTitle       string
	ActionDescription string
	ActionColor       string
}

// SendMagicLink sends a magic link email for battery passport actions using template
func (e *EmailService) SendMagicLink(toEmail, passportID, token, role, action string) error {
	if !e.enabled {
		log.Printf("📧 [MOCK] Would send magic link to %s for action: %s", toEmail, action)
		return nil
	}

	magicLink := fmt.Sprintf("%s/p/%s/action?token=%s", e.baseURL, passportID, token)

	// Get action-specific content
	actionTitle, actionDescription, actionColor := getActionContent(action)

	// Parse and execute template
	templatePath := filepath.Join(e.templatesDir, "magic_link.html")
	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		log.Printf("❌ Failed to parse magic link template: %v", err)
		return fmt.Errorf("failed to parse email template: %w", err)
	}

	data := MagicLinkData{
		MagicLink:         magicLink,
		PassportID:        passportID,
		Role:              role,
		ActionTitle:       actionTitle,
		ActionDescription: actionDescription,
		ActionColor:       actionColor,
	}

	var htmlBuf bytes.Buffer
	if err := tmpl.Execute(&htmlBuf, data); err != nil {
		log.Printf("❌ Failed to execute magic link template: %v", err)
		return fmt.Errorf("failed to execute email template: %w", err)
	}

	plainText := fmt.Sprintf(`%s

%s

Click the link below to complete your action:
%s

Passport ID: %s

This link expires in 1 hour.
If you didn't request this, please ignore this email.

© 2026 ExportReady Battery
`, actionTitle, actionDescription, magicLink, passportID)

	return e.sendEmail(toEmail, fmt.Sprintf("%s - Battery Passport", actionTitle), htmlBuf.String(), plainText)
}

// getActionContent returns action-specific email content
func getActionContent(action string) (title, description, color string) {
	switch action {
	case "SHIPPED":
		return "Shipping Confirmation",
			"You've been authorized to mark this battery as shipped. Click below to confirm the shipment and update the battery's status in the registry.",
			"#3b82f6" // blue
	case "IN_SERVICE":
		return "Installation Verification",
			"You've been authorized to register the installation of this battery. Click below to activate the warranty and mark the battery as in service.",
			"#10b981" // emerald
	case "RETURN_REQUESTED":
		return "Return Request",
			"You've requested to return this battery. Click below to initiate the return process and receive further instructions.",
			"#f97316" // orange
	case "RETURNED":
		return "Return Confirmation",
			"You've been authorized to confirm this battery's return. Click below to complete the return process.",
			"#f59e0b" // amber
	case "RECYCLED":
		return "Recycling Verification",
			"You've been authorized to mark this battery as recycled. Click below to complete the end-of-life documentation.",
			"#8b5cf6" // purple
	default:
		return "Battery Passport Action",
			"You've been authorized to perform an action on this battery passport. Click below to continue.",
			"#059669" // emerald
	}
}

// TeamInviteData contains data for the team invite email
type TeamInviteData struct {
	CompanyName string
	InviteLink  string
	Role        string
}

// SendTeamInvite sends a team invitation email
func (e *EmailService) SendTeamInvite(toEmail, companyName, inviteToken, role string) error {
	inviteLink := fmt.Sprintf("%s/invite?token=%s", e.baseURL, inviteToken)

	if !e.enabled {
		// Log to console in development
		log.Printf("📧 Team Invite for %s to join %s as %s:\n%s", toEmail, companyName, role, inviteLink)
		return nil
	}

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
    <table role="presentation" style="width: 100%%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #3B82F6 0%%, #2563EB 100%%); padding: 32px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">ExportReady</h1>
                            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Battery Passport Registry</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 20px;">You've Been Invited!</h2>
                            <p style="margin: 0 0 24px; color: #64748b; font-size: 15px; line-height: 1.6;">
                                You've been invited to join <strong style="color: #1e293b;">%s</strong> as a <strong style="color: #3b82f6;">%s</strong> on ExportReady.
                            </p>
                            <p style="margin: 0 0 28px; color: #64748b; font-size: 15px; line-height: 1.6;">
                                Click the button below to accept this invitation and get started.
                            </p>
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%%, #2563EB 100%%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                                Accept Invitation
                            </a>
                            <p style="margin: 28px 0 0; color: #94a3b8; font-size: 13px;">
                                This invitation expires in 7 days. If you didn't expect this, you can ignore this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                                © 2026 ExportReady Battery
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`, companyName, role, inviteLink)

	plainText := fmt.Sprintf(`You've Been Invited!

You've been invited to join %s as a %s on ExportReady.

Click the link below to accept this invitation:
%s

This invitation expires in 7 days.
If you didn't expect this, you can ignore this email.

© 2026 ExportReady Battery
`, companyName, role, inviteLink)

	return e.sendEmail(toEmail, fmt.Sprintf("You're invited to join %s on ExportReady", companyName), html, plainText)
}

// SendExportReady sends a notification that an export job is complete
func (e *EmailService) SendExportReady(toEmail, subject, htmlContent string) error {
	if !e.enabled {
		log.Printf("📧 [MOCK] Would send export ready email to %s", toEmail)
		return nil
	}

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Export Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
    <table role="presentation" style="width: 100%%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #3B82F6 0%%, #2563EB 100%%); padding: 32px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">ExportReady</h1>
                            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Battery Passport Registry</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            %s
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                                © 2026 ExportReady Battery
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`, htmlContent)

	plainText := fmt.Sprintf("Your export is ready for download. Link expires in 24 hours.")
	return e.sendEmail(toEmail, subject, html, plainText)
}

// sendEmail sends an email via Resend API
func (e *EmailService) sendEmail(to, subject, html, plainText string) error {
	reqBody := ResendEmailRequest{
		From:    fmt.Sprintf("%s <%s>", e.fromName, e.fromEmail),
		To:      []string{to},
		Subject: subject,
		HTML:    html,
		Text:    plainText,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal email request: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", e.apiKey))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var errResp map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errResp)
		return fmt.Errorf("resend API error (%d): %v", resp.StatusCode, errResp)
	}

	var result ResendEmailResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("failed to decode response: %w", err)
	}

	log.Printf("📧 Email sent successfully to %s (ID: %s)", to, result.ID)
	return nil
}

// GetEmailServiceFromEnv creates an email service from environment variables
func GetEmailServiceFromEnv(frontendBaseURL string) *EmailService {
	apiKey := os.Getenv("RESEND_API_KEY")
	fromEmail := os.Getenv("EMAIL_FROM")
	fromName := os.Getenv("EMAIL_FROM_NAME")

	if fromName == "" {
		fromName = "ExportReady Battery"
	}
	if fromEmail == "" {
		fromEmail = "noreply@exportready.io"
	}

	return NewResendEmailService(apiKey, fromEmail, fromName, frontendBaseURL)
}
