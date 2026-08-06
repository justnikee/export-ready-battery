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
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
)

// EmailService handles sending transactional emails
type EmailService struct {
	apiKey       string
	fromEmail    string
	fromName     string
	baseURL      string // Frontend base URL for magic links
	enabled      bool
	templatesDir string // Path to email templates directory
	client       *http.Client
}

// NewEmailService creates a new email service instance (simple constructor for auth)
// This is used for password reset emails which just log to console in dev mode
func NewEmailService(baseURL string) *EmailService {
	return &EmailService{
		baseURL:      baseURL,
		enabled:      false, // Console logging mode for password reset
		templatesDir: getTemplatesDir(),
		client:       &http.Client{Timeout: 30 * time.Second},
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
		client:       &http.Client{Timeout: 30 * time.Second},
	}
}

// getTemplatesDir returns the path to the email templates directory
func getTemplatesDir() string {
	// Check if TEMPLATES_DIR env var is set
	if dir := os.Getenv("TEMPLATES_DIR"); dir != "" {
		return dir
	}

	// Check standard locations relative to CWD or executable
	candidates := []string{
		"templates",
		"services/battery-api/templates",
	}
	if exe, err := os.Executable(); err == nil {
		exeDir := filepath.Dir(exe)
		candidates = append(candidates, filepath.Join(exeDir, "templates"), filepath.Join(exeDir, "..", "templates"))
	}

	for _, cand := range candidates {
		if info, err := os.Stat(cand); err == nil && info.IsDir() {
			return cand
		}
	}

	// Default to ./templates relative to working directory
	return "templates"
}

// IsEnabled returns whether email sending is enabled
func (e *EmailService) IsEnabled() bool {
	return e.enabled
}

// BaseURL returns the configured frontend base URL.
func (e *EmailService) BaseURL() string {
	return e.baseURL
}

// PasswordResetData contains data for the password reset email template
type PasswordResetData struct {
	ResetLink string
}

func normalizeProductType(productType models.ProductType) models.ProductType {
	if !productType.IsValid() || productType == models.ProductTypeElectronics {
		return models.DefaultProductType()
	}

	return productType
}

func productSlug(productType models.ProductType) string {
	return "battery"
}

func productLabel(productType models.ProductType) string {
	return "Battery Passport"
}

func (e *EmailService) productLink(productType models.ProductType, page string, token string) string {
	return fmt.Sprintf("%s/%s/%s?token=%s", e.baseURL, productSlug(productType), page, token)
}

// SendPasswordResetEmail sends a password reset email using template
func (e *EmailService) SendPasswordResetEmail(toEmail, resetToken string, productType models.ProductType) error {
	productType = normalizeProductType(productType)
	resetLink := e.productLink(productType, "reset-password", resetToken)

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

© 2026 AnvayaLabs %s
`, resetLink, productLabel(productType))

	return e.sendEmail(toEmail, "Reset Your Password - AnvayaLabs", htmlBuf.String(), plainText)
}

// SendAccountExistsEmail notifies an existing user that someone tried to register
// with their email (S-14 anti-enumeration). Does not confirm to the HTTP client
// whether the account exists — the API returns the same response either way.
func (e *EmailService) SendAccountExistsEmail(toEmail string, productType models.ProductType) error {
	productType = normalizeProductType(productType)
	loginLink := fmt.Sprintf("%s/%s/login", e.baseURL, productSlug(productType))
	forgotLink := fmt.Sprintf("%s/%s/forgot-password", e.baseURL, productSlug(productType))

	if !e.enabled {
		slog.Info("Account-exists notice generated (mock)", "to", toEmail, "login", loginLink)
		return nil
	}

	plainText := fmt.Sprintf(`Sign-in attempt with your email

Someone tried to create an AnvayaLabs account using this email address.

If this was you, you already have an account — sign in here:
%s

Forgot your password?
%s

If you did not try to register, you can ignore this email. Your account was not changed.

© 2026 AnvayaLabs %s
`, loginLink, forgotLink, productLabel(productType))

	html := fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2>You already have an AnvayaLabs account</h2>
<p>Someone tried to register using <strong>%s</strong>.</p>
<p>If this was you, sign in instead of creating a new account:</p>
<p><a href="%s" style="display:inline-block;padding:12px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">Sign in</a></p>
<p>Forgot your password? <a href="%s">Reset it here</a>.</p>
<p><small>If you did not try to register, you can ignore this email. Your account was not changed.</small></p>
<p>© 2026 AnvayaLabs %s</p>
</body></html>`, toEmail, loginLink, forgotLink, productLabel(productType))

	return e.sendEmail(toEmail, "You already have an AnvayaLabs account", html, plainText)
}

// SendVerificationEmail sends an email with a link to verify the user's email address.
// In dev mode (enabled=false), the link is logged to console.
func (e *EmailService) SendVerificationEmail(toEmail, verificationToken string, productType models.ProductType) error {
	productType = normalizeProductType(productType)
	verifyLink := e.productLink(productType, "verify-email", verificationToken)

	if !e.enabled {
		slog.Info("Email verification link generated (mock)", "to", toEmail, "link", verifyLink)
		return nil
	}

	plainText := fmt.Sprintf(`Verify Your Email Address

Please click the link below to verify your email address:

%s

This link expires in 24 hours.
If you did not create an AnvayaLabs account, please ignore this email.

© 2026 AnvayaLabs %s
`, verifyLink, productLabel(productType))

	html := fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2>Verify Your Email Address</h2>
<p>Thank you for signing up for AnvayaLabs %s.</p>
<p>Please click the link below to verify your email address:</p>
<p><a href="%s" style="display:inline-block;padding:12px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></p>
<p>Or copy this link: %s</p>
<p><small>This link expires in 24 hours. If you did not create an account, please ignore this email.</small></p>
</body></html>`, productLabel(productType), verifyLink, verifyLink)
	html = fmt.Sprintf("%s<p>© 2026 AnvayaLabs %s</p>", html[:len(html)-14], productLabel(productType)) + "</body></html>"

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

// SendMagicLinkOTP sends the 6-digit OTP for high-risk magic link actions.
func (e *EmailService) SendMagicLinkOTP(toEmail, action, otp string) error {
	actionTitle, actionDescription, actionColor := getActionContent(action)
	subject := fmt.Sprintf("%s verification code - AnvayaLabs", actionTitle)

	if !e.enabled {
		slog.Info("Magic link OTP (mock)", "to", toEmail, "action", action, "otp", otp)
		return nil
	}

	plainText := fmt.Sprintf(`%s

%s

Your 6-digit verification code is: %s

This code expires in 10 minutes.
If you did not request this action, please ignore this email.

© 2026 AnvayaLabs Battery
`, actionTitle, actionDescription, otp)

	html := fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a">
<h2 style="margin-bottom:12px;">%s</h2>
<p style="margin-bottom:16px;line-height:1.6;">%s</p>
<p style="margin-bottom:8px;">Use this 6-digit verification code to continue:</p>
<div style="display:inline-block;padding:14px 18px;border-radius:10px;background:%s;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:0.3em;">%s</div>
<p style="margin-top:16px;line-height:1.6;">This code expires in 10 minutes. If you did not request this action, please ignore this email.</p>
<p style="margin-top:24px;font-size:12px;color:#64748b;">© 2026 AnvayaLabs Battery</p>
</body></html>`, actionTitle, actionDescription, actionColor, otp)

	return e.sendEmail(toEmail, subject, html, plainText)
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
func (e *EmailService) SendTeamInvite(toEmail, companyName, inviteToken, role string, productType models.ProductType) error {
	productType = normalizeProductType(productType)
	inviteLink := fmt.Sprintf("%s/%s/accept-invite?token=%s", e.baseURL, productSlug(productType), inviteToken)

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

	plainText := fmt.Sprintf("You've been invited to join %s as a %s on AnvayaLabs.\n\nAccept: %s\n\nExpires in 7 days.\n© 2026 AnvayaLabs %s", companyName, role, inviteLink, productLabel(productType))

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

	client := e.client
	if client == nil {
		client = &http.Client{Timeout: 30 * time.Second}
	}
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

// AlertEmailData contains data for alert notification emails.
type AlertEmailData struct {
	CompanyName string
	AlertTitle  string
	AlertType   string
	Severity    string
	Message     string
	DashboardURL string
}

// SupplierInvitationData contains data for the supplier invitation email template.
type SupplierInvitationData struct {
	CompanyName   string
	TenantName    string
	AcceptLink    string
	PortalLoginLink string
}

// SendSupplierInvitationEmail sends a supplier portal invitation email.
func (e *EmailService) SendSupplierInvitationEmail(toEmail, tenantName, companyName, token string) error {
	acceptLink := fmt.Sprintf("%s/supplier/accept?token=%s", e.baseURL, token)
	portalLink := fmt.Sprintf("%s/supplier/login", e.baseURL)

	if !e.enabled {
		slog.Info("Supplier invitation email (mock)", "to", toEmail, "tenant", tenantName, "link", acceptLink)
		return nil
	}

	subject := fmt.Sprintf("You're invited to join %s's supplier portal on AnvayaLabs", tenantName)

	html := fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a">
<div style="text-align:center;margin-bottom:24px;">
<h2 style="margin:0 0 8px 0;color:#059669;">AnvayaLabs Supplier Portal</h2>
</div>
<p>Hello,</p>
<p><strong>%s</strong> has invited you to join their supplier portal on AnvayaLabs.</p>
<div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;">
<p style="margin:0 0 4px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Company</p>
<p style="margin:0;font-weight:600;">%s</p>
</div>
<p>As a supplier, you'll be able to:</p>
<ul style="line-height:1.6;">
<li>Upload certificates of conformance (CoC)</li>
<li>Submit audit reports and test data</li>
<li>Track document review status in real-time</li>
</ul>
<div style="margin:24px 0;text-align:center;">
<a href="%s" style="display:inline-block;padding:12px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px;font-weight:500;">Accept Invitation</a>
</div>
<p style="font-size:13px;color:#64748b;">Or copy this link: %s</p>
<p style="font-size:13px;color:#64748b;">This invitation expires in 30 days. If you already have an account, you can <a href="%s">log in here</a>.</p>
<p style="font-size:12px;color:#94a3b8;margin-top:32px;">© 2026 AnvayaLabs</p>
</body></html>`, tenantName, companyName, acceptLink, acceptLink, portalLink)

	plainText := fmt.Sprintf(`You've been invited to join %s's supplier portal on AnvayaLabs.

Company: %s

Accept your invitation:
%s

This invitation expires in 30 days. If you already have an account, log in at:
%s

© 2026 AnvayaLabs`, tenantName, companyName, acceptLink, portalLink)

	return e.sendEmail(toEmail, subject, html, plainText)
}

// DocumentReviewData contains data for the document review notification email.
type DocumentReviewData struct {
	DocType       string
	Status        string
	ReviewerNotes string
	DashboardURL  string
}

// SendSupplierDocumentReviewEmail notifies a supplier when their document is reviewed.
func (e *EmailService) SendSupplierDocumentReviewEmail(toEmail string, data DocumentReviewData) error {
	if !e.enabled {
		slog.Info("Supplier document review email (mock)", "to", toEmail, "status", data.Status, "doc_type", data.DocType)
		return nil
	}

	statusColor := "#ef4444" // red for rejected
	statusLabel := "Rejected"
	if data.Status == "approved" {
		statusColor = "#059669" // green
		statusLabel = "Approved"
	}

	subject := fmt.Sprintf("Your %s has been %s — AnvayaLabs Supplier Portal", data.DocType, statusLabel)

	notesBlock := ""
	if data.ReviewerNotes != "" {
		notesBlock = fmt.Sprintf(`<div style="background:#fef2f2;border-radius:6px;padding:12px;margin:16px 0;border-left:3px solid #ef4444;">
<p style="margin:0 0 4px 0;font-size:12px;color:#ef4444;font-weight:600;">Reviewer Notes</p>
<p style="margin:0;font-size:13px;color:#7f1d1d;">%s</p>
</div>`, data.ReviewerNotes)
	}

	html := fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a">
<div style="border-left:4px solid %s;padding-left:16px;margin-bottom:24px;">
<h2 style="margin:0 0 8px 0;">Document %s</h2>
<p style="margin:0;color:%s;font-weight:600;text-transform:uppercase;font-size:12px;letter-spacing:0.05em;">%s · %s</p>
</div>
<p>Your uploaded document has been reviewed by the buyer.</p>
%s
<div style="margin:24px 0;">
<a href="%s" style="display:inline-block;padding:12px 24px;background:#37322F;color:#fff;text-decoration:none;border-radius:6px;font-weight:500;">View in Supplier Portal</a>
</div>
<p style="font-size:12px;color:#64748b;margin-top:24px;">© 2026 AnvayaLabs</p>
</body></html>`, statusColor, statusLabel, statusColor, data.DocType, statusLabel, notesBlock, data.DashboardURL)

	plainText := fmt.Sprintf(`Document %s

Your %s has been %s.
%s

View in portal: %s

© 2026 AnvayaLabs`, statusLabel, data.DocType, statusLabel, data.ReviewerNotes, data.DashboardURL)

	return e.sendEmail(toEmail, subject, html, plainText)
}

// SendAlertEmail sends a compliance alert notification email.
func (e *EmailService) SendAlertEmail(toEmail string, data AlertEmailData) error {
	if !e.enabled {
		slog.Info("Alert email (mock)", "to", toEmail, "title", data.AlertTitle, "severity", data.Severity)
		return nil
	}

	severityColor := "#f59e0b" // amber for WARNING
	if data.Severity == "CRITICAL" {
		severityColor = "#ef4444" // red
	}

	subject := fmt.Sprintf("[%s] %s — ExportReady Alert", data.Severity, data.AlertTitle)

	html := fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a">
<div style="border-left:4px solid %s;padding-left:16px;margin-bottom:24px;">
<h2 style="margin:0 0 8px 0;">%s</h2>
<p style="margin:0;color:%s;font-weight:600;text-transform:uppercase;font-size:12px;letter-spacing:0.05em;">%s · %s</p>
</div>
<p style="line-height:1.6;">%s</p>
<div style="margin:24px 0;">
<a href="%s" style="display:inline-block;padding:12px 24px;background:#37322F;color:#fff;text-decoration:none;border-radius:6px;font-weight:500;">View in Dashboard</a>
</div>
<p style="font-size:12px;color:#64748b;margin-top:24px;">You are receiving this because you have compliance alerts enabled for your organization. <a href="%s">Manage alert preferences</a>.</p>
<p style="font-size:12px;color:#64748b;">© 2026 AnvayaLabs</p>
</body></html>`, severityColor, data.AlertTitle, severityColor, data.AlertType, data.Severity, data.Message, data.DashboardURL, data.DashboardURL)

	plainText := fmt.Sprintf(`%s
[%s] %s

%s

View in dashboard: %s

© 2026 AnvayaLabs
`, data.AlertTitle, data.Severity, data.AlertType, data.Message, data.DashboardURL)

	return e.sendEmail(toEmail, subject, html, plainText)
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
