package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"log/slog"
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
		slog.Warn("Email service disabled: RESEND_API_KEY or EMAIL_FROM not configured")
	} else {
		slog.Info("Email service enabled", "from_name", fromName, "from_email", fromEmail)
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
		slog.Info("Password reset link generated (mock)", "to", toEmail, "link", resetLink)
		return nil
	}

	// Parse and execute template
	templatePath := filepath.Join(e.templatesDir, "password_reset.html")
	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		slog.Error("Failed to parse password reset template", "error", err)
		return fmt.Errorf("failed to parse email template: %w", err)
	}

	data := PasswordResetData{
		ResetLink: resetLink,
	}

	var htmlBuf bytes.Buffer
	if err := tmpl.Execute(&htmlBuf, data); err != nil {
		slog.Error("Failed to execute password reset template", "error", err)
		return fmt.Errorf("failed to execute email template: %w", err)
	}

	plainText := fmt.Sprintf(`Reset Your Password

You requested to reset your password. Click the link below to create a new password:

%s

This link expires in 1 hour.
If you didn't request this, please ignore this email.

© 2026 AnvayaLabs Battery
`, resetLink)

	return e.sendEmail(toEmail, "Reset Your Password - AnvayaLabs", htmlBuf.String(), plainText)
}

// SendVerificationEmail sends an email with a link to verify the user's email address.
// In dev mode (enabled=false), the link is logged to console.
func (e *EmailService) SendVerificationEmail(toEmail, verificationToken string) error {
	verifyLink := fmt.Sprintf("%s/auth/verify-email?token=%s", e.baseURL, verificationToken)

	if !e.enabled {
		slog.Info("Email verification link generated (mock)", "to", toEmail, "link", verifyLink)
		return nil
	}

	plainText := fmt.Sprintf(`Verify Your Email Address

Please click the link below to verify your email address:

%s

This link expires in 24 hours.
If you did not create an AnvayaLabs account, please ignore this email.

© 2026 AnvayaLabs Battery
`, verifyLink)

	html := fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2>Verify Your Email Address</h2>
<p>Thank you for signing up for AnvayaLabs Battery.</p>
<p>Please click the link below to verify your email address:</p>
<p><a href="%s" style="display:inline-block;padding:12px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></p>
<p>Or copy this link: %s</p>
<p><small>This link expires in 24 hours. If you did not create an account, please ignore this email.</small></p>
<p>© 2026 AnvayaLabs Battery</p>
</body></html>`, verifyLink, verifyLink)

	return e.sendEmail(toEmail, "Verify your email - AnvayaLabs", html, plainText)
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
		slog.Info("Magic link email (mock)", "to", toEmail, "action", action)
		return nil
	}

	magicLink := fmt.Sprintf("%s/p/%s/action?token=%s", e.baseURL, passportID, token)

	// Get action-specific content
	actionTitle, actionDescription, actionColor := getActionContent(action)

	// Parse and execute template
	templatePath := filepath.Join(e.templatesDir, "magic_link.html")
	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		slog.Error("Failed to parse magic link template", "error", err)
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
		slog.Error("Failed to execute magic link template", "error", err)
		return fmt.Errorf("failed to execute email template: %w", err)
	}

	plainText := fmt.Sprintf(`%s

%s

Click the link below to complete your action:
%s

Passport ID: %s

This link expires in 1 hour.
If you didn't request this, please ignore this email.

© 2026 AnvayaLabs Battery
`, actionTitle, actionDescription, magicLink, passportID)

	return e.sendEmail(toEmail, fmt.Sprintf("%s - Battery Passport", actionTitle), htmlBuf.String(), plainText)
}

// getActionContent returns action-specific email content
func getActionContent(action string) (title, description, color string) {
	switch action {
	case "SHIP":
		return "Shipping Confirmation",
			"You've been authorized to mark this battery as shipped. Click below to confirm the shipment and update the battery's status in the registry.",
			"#3b82f6" // blue
	case "INSTALL":
		return "Installation Verification",
			"You've been authorized to register the installation of this battery. Click below to activate the warranty and mark the battery as in service.",
			"#10b981" // emerald
	case "RECYCLE":
		return "Recycling Verification",
			"You've been authorized to mark this battery as recycled. Click below to complete the end-of-life documentation.",
			"#8b5cf6" // purple
	case "RECALL":
		return "Recall Acknowledgement",
			"You've been authorized to mark this battery as recalled. Click below to record the recall in the registry.",
			"#ef4444" // red
	case "ACTIVATE":
		return "Activation Confirmation",
			"You've been authorized to activate this battery passport. Click below to confirm manufacturing completion.",
			"#10b981" // emerald
	case "CLOSE":
		return "End of Life Closure",
			"You've been authorized to close this battery's lifecycle. Click below to finalize end-of-life status.",
			"#64748b" // slate
	default:
		return "Battery Passport Action",
			"You've been authorized to perform an action on this battery passport. Click below to continue.",
			"#059669" // emerald
	}
}

// TeamInviteData contains data for the team invite email template
type TeamInviteData struct {
	CompanyName string
	InviteLink  string
	Role        string
}

// SendTeamInvite sends a team invitation email using template
func (e *EmailService) SendTeamInvite(toEmail, companyName, inviteToken, role string) error {
	inviteLink := fmt.Sprintf("%s/accept-invite?token=%s", e.baseURL, inviteToken)

	if !e.enabled {
		slog.Info("Team invite email (mock)", "to", toEmail, "company", companyName, "role", role)
		return nil
	}

	templatePath := filepath.Join(e.templatesDir, "team_invite.html")
	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		slog.Error("Failed to parse team invite template", "error", err)
		return fmt.Errorf("failed to parse email template: %w", err)
	}

	data := TeamInviteData{
		CompanyName: companyName,
		InviteLink:  inviteLink,
		Role:        role,
	}

	var htmlBuf bytes.Buffer
	if err := tmpl.Execute(&htmlBuf, data); err != nil {
		slog.Error("Failed to execute team invite template", "error", err)
		return fmt.Errorf("failed to execute email template: %w", err)
	}

	plainText := fmt.Sprintf("You've been invited to join %s as a %s on AnvayaLabs.\n\nAccept: %s\n\nExpires in 7 days.\n© 2026 AnvayaLabs Battery", companyName, role, inviteLink)

	return e.sendEmail(toEmail, fmt.Sprintf("You're invited to join %s on AnvayaLabs", companyName), htmlBuf.String(), plainText)
}

// AnvayaLabsData contains data for the export ready email template
type AnvayaLabsData struct {
	Content template.HTML
}

// SendAnvayaLabs sends a notification that an export job is complete using template
func (e *EmailService) SendAnvayaLabs(toEmail, subject, htmlContent string) error {
	if !e.enabled {
		slog.Info("Export ready email (mock)", "to", toEmail)
		return nil
	}

	templatePath := filepath.Join(e.templatesDir, "export_ready.html")
	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		slog.Error("Failed to parse export ready template", "error", err)
		return fmt.Errorf("failed to parse email template: %w", err)
	}

	data := AnvayaLabsData{
		Content: template.HTML(htmlContent),
	}

	var htmlBuf bytes.Buffer
	if err := tmpl.Execute(&htmlBuf, data); err != nil {
		slog.Error("Failed to execute export ready template", "error", err)
		return fmt.Errorf("failed to execute email template: %w", err)
	}

	plainText := "Your export is ready for download. Link expires in 24 hours."
	return e.sendEmail(toEmail, subject, htmlBuf.String(), plainText)
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

	slog.Info("Email sent", "to", to, "resend_id", result.ID)
	return nil
}

// GetEmailServiceFromEnv creates an email service from environment variables
func GetEmailServiceFromEnv(frontendBaseURL string) *EmailService {
	apiKey := os.Getenv("RESEND_API_KEY")
	fromEmail := os.Getenv("EMAIL_FROM")
	fromName := os.Getenv("EMAIL_FROM_NAME")

	if fromName == "" {
		fromName = "AnvayaLabs Battery"
	}
	if fromEmail == "" {
		fromEmail = "noreply@anvayalabs.io"
	}

	return NewResendEmailService(apiKey, fromEmail, fromName, frontendBaseURL)
}
