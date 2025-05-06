using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;
using SendGrid.Helpers.Mail.Model;

namespace Elite_Personal_Training.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly string _environment;

        public EmailService(
            IConfiguration configuration,
            ILogger<EmailService> logger,
            IWebHostEnvironment environment)
        {
            _configuration = configuration;
            _logger = logger;
            _environment = environment.EnvironmentName;
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetLink)
        {
            var subject = "Elite PT - Password Reset Request";

            var plainTextContent = $"We received a request to reset your password.\nPlease use the following link to reset it: {resetLink}\nIf you didn't request this, you can ignore this email. This link will expire in 24 hours.";

            var htmlContent = $@" 
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <h2 style='color: #9c0d0d;'>Elite Personal Training</h2>
            <p>We received a request to reset your password.</p>
            <p>Please click the button below to reset your password:</p>
            <a href='{resetLink}'
                style='background-color: #9c0d0d; color: white; padding: 10px 20px;
                       text-decoration: none; border-radius: 5px; display: inline-block;
                       margin: 10px 0;'>
                Reset Password
            </a>
            <p style='color: #666; font-size: 0.9em;'>
                If you didn't request this, please ignore this email.<br>
                This link will expire in 24 hours.
            </p>
        </div>";

            await SendEmailAsync(email, subject, plainTextContent, htmlContent);
        }



        public async Task SendWelcomeEmailAsync(string email, string name)
        {
            var subject = "Welcome to Elite Personal Training!";

            var plainTextContent = $@"Welcome {name}!

Thank you for joining Elite Personal Training.
Get started by exploring our training programs and booking your first session.

If you have any questions, don't hesitate to contact our support team.";

            var htmlContent = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #9c0d0d;'>Welcome to Elite Personal Training, {name}!</h2>
                    <p>We're excited to have you as part of our fitness community.</p>
                    <p>Get started by exploring our training programs and booking your first session.</p>
                    <div style='margin: 20px 0; text-align: center;'>
                        <a href='{_configuration["ClientUrl"]}/programs'
                           style='background-color: #9c0d0d; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;'>
                            View Training Programs
                        </a>
                    </div>
                    <p>If you have any questions, don't hesitate to contact our support team.</p>
                </div>";

            await SendEmailWithRetry(email, subject, plainTextContent, htmlContent);
        }

        public async Task SendBookingConfirmationAsync(string email, string bookingDetails)
        {
            var subject = "Your Elite PT Booking Confirmation";

            var plainTextContent = $@"Your booking is confirmed!
Booking details:
{bookingDetails}

We look forward to seeing you!";

            var htmlContent = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #9c0d0d;'>Booking Confirmed!</h2>
                    <p>Here are your booking details:</p>
                    <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;'>
                        {bookingDetails}
                    </div>
                    <p>We look forward to seeing you!</p>
                    <div style='margin-top: 30px; font-size: 0.9em; color: #666;'>
                        <p>Need to reschedule? Contact us at least 24 hours before your session.</p>
                    </div>
                </div>";

            await SendEmailWithRetry(email, subject, plainTextContent, htmlContent);
        }

        public async Task SendContactFormSubmissionAsync(string adminEmail, string userEmail, string message)
        {
            var subject = "New Contact Form Submission";

            var plainTextContent = $@"New message from {userEmail}:
{message}";

            var htmlContent = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #9c0d0d;'>New Contact Form Submission</h2>
                    <p><strong>From:</strong> {userEmail}</p>
                    <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;'>
                        {message}
                    </div>
                    <div style='margin-top: 20px;'>
                        <a href='mailto:{userEmail}'
                           style='background-color: #9c0d0d; color: white; padding: 8px 16px; 
                                  text-decoration: none; border-radius: 4px; display: inline-block;'>
                            Reply to User
                        </a>
                    </div>
                </div>";

            await SendEmailWithRetry(adminEmail, subject, plainTextContent, htmlContent);
        }

        private async Task SendEmailWithRetry(string email, string subject, string plainTextContent, string htmlContent, int maxRetries = 2)
        {
            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    await SendEmailAsync(email, subject, plainTextContent, htmlContent);
                    return;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Email send attempt {attempt} failed for {email}");

                    if (attempt == maxRetries)
                    {
                        throw; // Re-throw on final attempt
                    }

                    await Task.Delay(1000 * attempt); // Exponential backoff
                }
            }
        }

        private async Task SendEmailAsync(string email, string subject, string plainTextContent, string htmlContent)
        {
            var apiKey = _configuration["SendGrid:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogError("SendGrid API key is missing in configuration");
                throw new InvalidOperationException("Email service configuration error");
            }

            var client = new SendGridClient(apiKey);
            var fromEmail = _configuration["SendGrid:DomainEmail"] ?? _configuration["SendGrid:FromEmail"];

            var from = new EmailAddress(fromEmail, _configuration["SendGrid:FromName"]);
            var to = new EmailAddress(email);

            var msg = MailHelper.CreateSingleEmail(
                from,
                to,
                subject,
                plainTextContent,
                htmlContent);

            var response = await client.SendEmailAsync(msg);

            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Body.ReadAsStringAsync();
                var errorMessage = $"SendGrid failed with status {response.StatusCode}. Response: {responseBody}";
                _logger.LogError(errorMessage);
                throw new Exception(errorMessage);
            }

            _logger.LogInformation($"Email successfully sent to {email}");
        }
    }
}